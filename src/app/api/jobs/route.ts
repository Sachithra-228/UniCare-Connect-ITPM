import { NextRequest } from "next/server";
import { demoJobs } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

export async function GET() {
  if (isDemoMode()) {
    return jsonResponse(demoJobs);
  }

  try {
    const database = await getMongoDatabase();
    const jobs = await database
      .collection("jobs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const list = jobs.map((item: { _id?: unknown; [k: string]: unknown }) => ({
      ...item,
      _id: item._id?.toString?.() ?? String(item._id)
    }));

    if (list.length === 0) {
      return jsonResponse(demoJobs);
    }
    return jsonResponse(list);
  } catch {
    return jsonResponse(demoJobs);
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Job listing created (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, [
    "admin",
    "super_admin",
    "employer"
  ]);
  if (roleCheck) {
    return roleCheck;
  }

  const database = await getMongoDatabase();
  const jobsCollection = database.collection("jobs");
  const now = new Date();
  const document = {
    ...payload,
    createdBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
    createdAt: now,
    updatedAt: now
  };
  const result = await jobsCollection.insertOne(document);

  return jsonResponse(
    { message: "Job created", job: { ...document, _id: result.insertedId.toString() } },
    201
  );
}

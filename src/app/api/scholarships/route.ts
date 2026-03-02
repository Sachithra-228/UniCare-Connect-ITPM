import { NextRequest } from "next/server";
import { demoScholarships } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

export async function GET() {
  if (isDemoMode()) {
    return jsonResponse(demoScholarships);
  }

  try {
    const database = await getMongoDatabase();
    const scholarships = await database
      .collection("scholarships")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const list = scholarships.map((item: { _id?: unknown; [k: string]: unknown }) => ({
      ...item,
      _id: item._id?.toString?.() ?? String(item._id)
    }));

    if (list.length === 0) {
      return jsonResponse(demoScholarships);
    }
    return jsonResponse(list);
  } catch {
    return jsonResponse(demoScholarships);
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Scholarship created (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, [
    "admin",
    "super_admin",
    "donor",
    "ngo"
  ]);
  if (roleCheck) {
    return roleCheck;
  }

  const database = await getMongoDatabase();
  const scholarshipsCollection = database.collection("scholarships");
  const now = new Date();
  const document = {
    ...payload,
    createdBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
    createdAt: now,
    updatedAt: now
  };
  const result = await scholarshipsCollection.insertOne(document);

  return jsonResponse(
    {
      message: "Scholarship created",
      scholarship: { ...document, _id: result.insertedId.toString() }
    },
    201
  );
}

import { NextRequest } from "next/server";
import { demoJobs } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
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
  const jobId = result.insertedId.toString();
  const title = String(document.title ?? document.position ?? "job listing");
  const creatorRole = authResult.session.user?.role ?? "employer";

  await Promise.allSettled([
    createNotification(database, {
      userId: authResult.session.user?._id,
      firebaseUid: authResult.session.firebase.uid,
      title: "Job listing published",
      message: `Your job "${title}" is now visible to students.`,
      type: "career",
      sectionId: creatorRole === "admin" || creatorRole === "super_admin" ? "career-services" : "job-listings",
      relatedJobId: jobId
    }),
    createNotification(database, {
      audienceRoles: ["student"],
      title: "New job opportunity",
      message: `A new job "${title}" was posted.`,
      type: "career",
      sectionId: "career",
      relatedJobId: jobId
    }),
    createNotification(database, {
      audienceRoles: ["admin", "super_admin"],
      title: "New employer job posting",
      message: `A new job "${title}" is available for review and tracking.`,
      type: "career",
      sectionId: "career-services",
      relatedJobId: jobId
    })
  ]);

  return jsonResponse(
    { message: "Job created", job: { ...document, _id: jobId } },
    201
  );
}

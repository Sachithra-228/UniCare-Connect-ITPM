import { NextRequest } from "next/server";
import { demoJobs } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type JobModerationStatus = "Pending" | "Approved" | "Rejected";
type JobPublishingStatus = "draft" | "active" | "expired";

type JobDocument = {
  _id?: unknown;
  title?: string;
  position?: string;
  status?: string;
  moderationStatus?: string;
  createdBy?: string;
  createdByUserId?: string;
  createdByFirebaseUid?: string;
  createdByRole?: string;
  [key: string]: unknown;
};

function normalizeModerationStatus(value: unknown, fallback: JobModerationStatus = "Approved"): JobModerationStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return fallback;
}

function normalizeJobStatus(value: unknown, fallback: JobPublishingStatus = "active"): JobPublishingStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "draft") return "draft";
  if (status === "expired") return "expired";
  if (status === "active") return "active";
  return fallback;
}

function mapJobDocument(item: JobDocument, fallbackModeration: JobModerationStatus = "Approved") {
  return {
    ...item,
    _id: item._id?.toString?.() ?? String(item._id),
    status: normalizeJobStatus(item.status),
    moderationStatus: normalizeModerationStatus(item.moderationStatus, fallbackModeration)
  };
}

function isApprovedAndActive(item: { status?: string; moderationStatus?: string }) {
  return (
    normalizeModerationStatus(item.moderationStatus) === "Approved" &&
    normalizeJobStatus(item.status) === "active"
  );
}

function ownedByCurrentUser(
  item: { createdBy?: string; createdByUserId?: string; createdByFirebaseUid?: string },
  userId?: string,
  firebaseUid?: string
) {
  const userMatch = Boolean(userId) && (item.createdByUserId === userId || item.createdBy === userId);
  const firebaseMatch =
    Boolean(firebaseUid) && (item.createdByFirebaseUid === firebaseUid || item.createdBy === firebaseUid);
  return Boolean(userMatch || firebaseMatch);
}

function normalizeDemoJobs() {
  return demoJobs.map((job) => ({
    ...job,
    status: "active" as const,
    moderationStatus: "Approved" as const
  }));
}

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const currentRole = authResult.session.user?.role;
  const isAdmin = currentRole === "admin" || currentRole === "faculty" || currentRole === "super_admin";
  const isEmployer = currentRole === "employer";

  if (scope === "all") {
    const roleCheck = requireRole(currentRole, ["admin", "faculty", "super_admin"]);
    if (roleCheck) return roleCheck;
  }

  if (scope === "mine") {
    const roleCheck = requireRole(currentRole, ["admin", "faculty", "super_admin", "employer"]);
    if (roleCheck) return roleCheck;
  }

  if (isDemoMode()) {
    const demoList = normalizeDemoJobs();
    if (scope === "all" || (scope === "mine" && isAdmin)) {
      return jsonResponse(demoList);
    }
    if (scope === "mine" && isEmployer) {
      return jsonResponse([]);
    }
    if (isEmployer) {
      return jsonResponse([]);
    }
    return jsonResponse(demoList.filter((item) => isApprovedAndActive(item)));
  }

  try {
    const database = await getMongoDatabase();
    const jobs = await database
      .collection<JobDocument>("jobs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const list = jobs.map((item) => mapJobDocument(item));
    const userId = authResult.session.user?._id;
    const firebaseUid = authResult.session.firebase.uid;

    let visible = list;
    if (scope === "all" || (scope === "mine" && isAdmin)) {
      visible = list;
    } else if (scope === "mine" || isEmployer) {
      visible = list.filter((item) => ownedByCurrentUser(item, userId, firebaseUid));
    } else if (!isAdmin) {
      visible = list.filter((item) => isApprovedAndActive(item));
    }

    if (visible.length > 0) {
      return jsonResponse(visible);
    }

    if (scope === "all" || scope === "mine" || isEmployer) {
      return jsonResponse([]);
    }

    return jsonResponse(normalizeDemoJobs().filter((item) => isApprovedAndActive(item)));
  } catch {
    const fallback = normalizeDemoJobs();
    if (scope === "all") return jsonResponse(fallback);
    if (scope === "mine" || isEmployer) return jsonResponse([]);
    return jsonResponse(fallback.filter((item) => isApprovedAndActive(item)));
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "faculty", "super_admin", "employer"]);
  if (roleCheck) {
    return roleCheck;
  }

  const creatorRole = authResult.session.user?.role ?? "employer";
  const createdByUserId = authResult.session.user?._id;
  const createdByFirebaseUid = authResult.session.firebase.uid;
  const creatorId = createdByUserId ?? createdByFirebaseUid;
  const moderationStatus: JobModerationStatus =
    creatorRole === "employer"
      ? "Pending"
      : normalizeModerationStatus((payload as { moderationStatus?: string }).moderationStatus, "Approved");
  const publishingStatus = normalizeJobStatus((payload as { status?: string }).status, "active");

  const reviewNoteRaw = (payload as { reviewNote?: string }).reviewNote;
  const reviewNote =
    typeof reviewNoteRaw === "string" && reviewNoteRaw.trim().length
      ? reviewNoteRaw.trim().slice(0, 500)
      : null;

  if (isDemoMode()) {
    return jsonResponse(
      {
        message: "Job listing created (demo mode)",
        job: {
          ...payload,
          _id: `demo-job-${Date.now()}`,
          status: publishingStatus,
          moderationStatus,
          reviewNote,
          createdBy: creatorId,
          createdByUserId,
          createdByFirebaseUid,
          createdByRole: creatorRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      201
    );
  }

  const database = await getMongoDatabase();
  const jobsCollection = database.collection("jobs");
  const now = new Date();
  const document = {
    ...payload,
    status: publishingStatus,
    moderationStatus,
    reviewNote,
    createdBy: creatorId,
    createdByUserId,
    createdByFirebaseUid,
    createdByRole: creatorRole,
    ...(moderationStatus !== "Pending"
      ? {
          reviewedBy: creatorId,
          reviewedAt: now
        }
      : {}),
    createdAt: now,
    updatedAt: now
  };

  const result = await jobsCollection.insertOne(document);
  const jobId = result.insertedId.toString();
  const title = String(document.title ?? document.position ?? "job listing");

  const notifications = [
    createNotification(database, {
      userId: createdByUserId,
      firebaseUid: createdByFirebaseUid,
      title: moderationStatus === "Pending" ? "Job listing submitted" : "Job listing published",
      message:
        moderationStatus === "Pending"
          ? `Your job "${title}" is pending admin review.`
          : `Your job "${title}" is now visible to students.`,
      type: "career",
      sectionId:
        creatorRole === "admin" || creatorRole === "faculty" || creatorRole === "super_admin"
          ? "career-services"
          : "job-listings",
      relatedJobId: jobId
    })
  ];

  if (moderationStatus === "Pending") {
    notifications.push(
      createNotification(database, {
        audienceRoles: ["admin", "faculty", "super_admin"],
        title: "Job posting needs review",
        message: `A new job "${title}" is waiting for approval.`,
        type: "career",
        sectionId: "career-services",
        relatedJobId: jobId
      })
    );
  }

  if (moderationStatus === "Approved" && publishingStatus === "active") {
    notifications.push(
      createNotification(database, {
        audienceRoles: ["student"],
        title: "New job opportunity",
        message: `A new job "${title}" is now open.`,
        type: "career",
        sectionId: "career",
        relatedJobId: jobId
      })
    );
  }

  await Promise.allSettled(notifications);

  return jsonResponse(
    { message: "Job created", job: mapJobDocument({ ...document, _id: jobId }, moderationStatus) },
    201
  );
}


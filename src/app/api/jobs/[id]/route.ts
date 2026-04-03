import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };
type JobModerationStatus = "Pending" | "Approved" | "Rejected";

type JobDocument = {
  _id: ObjectId;
  title?: string;
  position?: string;
  status?: string;
  moderationStatus?: string;
  reviewNote?: string | null;
  createdBy?: string;
  createdByUserId?: string;
  createdByFirebaseUid?: string;
  [key: string]: unknown;
};

function normalizeModerationStatus(value: unknown): JobModerationStatus | null {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return null;
}

function normalizeJobStatus(value: unknown): "draft" | "active" | "expired" {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "draft") return "draft";
  if (status === "expired") return "expired";
  return "active";
}

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return jsonResponse({ error: "Missing job id" }, 400);
  }

  const payload = (await request.json().catch(() => ({}))) as {
    moderationStatus?: string;
    reviewNote?: string | null;
  };
  const nextModerationStatus = normalizeModerationStatus(payload.moderationStatus);
  if (!nextModerationStatus) {
    return jsonResponse({ error: "Invalid moderation status. Use Pending, Approved, or Rejected." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse({
      message: `Job moderation updated to ${nextModerationStatus} (demo mode)`
    });
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "faculty", "super_admin"]);
  if (roleCheck) {
    return roleCheck;
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return jsonResponse({ error: "Invalid job id" }, 400);
  }

  const reviewNote =
    typeof payload.reviewNote === "string" && payload.reviewNote.trim().length
      ? payload.reviewNote.trim().slice(0, 500)
      : null;

  const now = new Date();
  const reviewer = authResult.session.user?._id ?? authResult.session.firebase.uid;

  const database = await getMongoDatabase();
  const jobsCollection = database.collection<JobDocument>("jobs");
  const updated = await jobsCollection.findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        moderationStatus: nextModerationStatus,
        reviewNote,
        reviewedBy: reviewer,
        reviewedAt: now,
        updatedAt: now
      }
    },
    { returnDocument: "after" }
  );

  if (!updated) {
    return jsonResponse({ error: "Job not found" }, 404);
  }

  const jobId = updated._id.toString();
  const title = String(updated.title ?? updated.position ?? "job listing");
  const publishingStatus = normalizeJobStatus(updated.status);
  const ownerUserId =
    typeof updated.createdByUserId === "string"
      ? updated.createdByUserId
      : typeof updated.createdBy === "string"
        ? updated.createdBy
        : undefined;
  const ownerFirebaseUid =
    typeof updated.createdByFirebaseUid === "string"
      ? updated.createdByFirebaseUid
      : typeof updated.createdBy === "string"
        ? updated.createdBy
        : undefined;

  const ownerMessage =
    nextModerationStatus === "Approved"
      ? `Your job "${title}" was approved and is now visible to students.`
      : nextModerationStatus === "Rejected"
        ? `Your job "${title}" was rejected. Review note and update before resubmitting.`
        : `Your job "${title}" was moved back to pending review.`;

  const adminMessage = `Job "${title}" was marked ${nextModerationStatus}.`;

  const notifications = [
    createNotification(database, {
      userId: ownerUserId,
      firebaseUid: ownerFirebaseUid,
      title: `Job ${nextModerationStatus}`,
      message: ownerMessage,
      type: "career",
      sectionId: "job-listings",
      relatedJobId: jobId
    }),
    createNotification(database, {
      audienceRoles: ["admin", "faculty", "super_admin"],
      title: "Career moderation updated",
      message: adminMessage,
      type: "career",
      sectionId: "career-services",
      relatedJobId: jobId
    })
  ];

  if (nextModerationStatus === "Approved" && publishingStatus === "active") {
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

  return jsonResponse({
    message: "Job moderation updated",
    job: {
      ...updated,
      _id: jobId,
      status: publishingStatus,
      moderationStatus: nextModerationStatus
    }
  });
}


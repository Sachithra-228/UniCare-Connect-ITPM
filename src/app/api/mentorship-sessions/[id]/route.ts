import { NextRequest } from "next/server";
import { demoUsers } from "@/lib/demo-data";
import { getDemoSessionById, updateDemoSession } from "@/lib/mentorship-demo-store";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";
import type { MentorshipSession } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  if (!id) {
    return jsonResponse({ message: "Session ID required" }, 400);
  }

  const body = await request.json().catch(() => ({}));
  const { status, scheduledTime, rating, review } = body;

  if (isDemoMode()) {
    const session = await requireSession(request);
    if (session.error) return session.error;
    const uid = session.session.firebase.uid;
    const currentUserId = (session.session.user as { _id?: string } | null)?._id ?? uid;

    const existing = getDemoSessionById(id);
    if (!existing) {
      return jsonResponse({ message: "Session not found" }, 404);
    }
    const isStudent = existing.studentId === currentUserId || existing.studentId === uid;
    const isMentor = existing.mentorId === currentUserId || existing.mentorId === uid;
    if (!isStudent && !isMentor) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }
    const updates: Partial<MentorshipSession> = {};

    if (status !== undefined) {
      if (status === "cancelled" && (isStudent || isMentor)) {
        updates.status = "cancelled";
      } else if ((status === "confirmed" || status === "scheduled" || status === "completed") && isMentor) {
        updates.status = status;
      } else if (status === "scheduled" && isStudent) {
        updates.status = "scheduled";
      }
    }
    const canSetScheduledTime =
      (isMentor && (status === "confirmed" || status === "scheduled" || status === undefined)) ||
      (isStudent && (existing.status === "confirmed" || existing.status === "scheduled") && status !== "cancelled");
    if (scheduledTime !== undefined && typeof scheduledTime === "string" && canSetScheduledTime) {
      updates.scheduledTime = scheduledTime;
    }
    if (existing.status === "completed" && isStudent) {
      if (typeof rating === "number" && rating >= 1 && rating <= 5) updates.rating = rating;
      if (typeof review === "string") updates.review = review.trim();
    }

    const applied = { ...updates };
    if (Object.keys(applied).length === 0) {
      return jsonResponse({ message: "No valid updates" }, 400);
    }
    if (!updateDemoSession(id, applied)) {
      return jsonResponse({ message: "Session not found" }, 404);
    }
    const updated = getDemoSessionById(id);
    return jsonResponse(updated ?? {});
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const isDemoId = id.length !== 24 || !/^[a-f0-9]{24}$/i.test(id);
  if (isDemoId && process.env.NODE_ENV === "development") {
    const existing = getDemoSessionById(id);
    if (!existing) {
      return jsonResponse({ message: "Session not found" }, 404);
    }
    const uid = authResult.session.firebase.uid;
    const currentUserId = (authResult.session.user as { _id?: string } | null)?._id ?? uid;
    const isStudent = existing.studentId === currentUserId || existing.studentId === uid;
    const isMentor = existing.mentorId === currentUserId || existing.mentorId === uid;
    if (!isStudent && !isMentor) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }
    const updates: Partial<MentorshipSession> = {};

    if (status !== undefined) {
      if (status === "cancelled" && (isStudent || isMentor)) updates.status = "cancelled";
      else if ((status === "confirmed" || status === "scheduled" || status === "completed") && isMentor) updates.status = status;
      else if (status === "scheduled" && isStudent) updates.status = "scheduled";
    }
    const canSetScheduledTime =
      (isMentor && (status === "confirmed" || status === "scheduled" || status === undefined)) ||
      (isStudent && (existing.status === "confirmed" || existing.status === "scheduled") && status !== "cancelled");
    if (scheduledTime !== undefined && typeof scheduledTime === "string" && canSetScheduledTime) {
      updates.scheduledTime = scheduledTime;
    }
    if (existing.status === "completed" && isStudent) {
      if (typeof rating === "number" && rating >= 1 && rating <= 5) updates.rating = rating;
      if (typeof review === "string") updates.review = review.trim();
    }
    if (Object.keys(updates).length === 0) {
      return jsonResponse({ message: "No valid updates" }, 400);
    }
    if (!updateDemoSession(id, updates)) {
      return jsonResponse({ message: "Session not found" }, 404);
    }
    const updated = getDemoSessionById(id);
    return jsonResponse(updated ?? {});
  }

  const database = await getMongoDatabase();
  const sessionsCol = database.collection("mentorship_sessions");
  const { ObjectId } = await import("mongodb");
  let sessionDoc: Record<string, unknown> | null = null;
  try {
    sessionDoc = await sessionsCol.findOne({ _id: new ObjectId(id) });
  } catch {
    sessionDoc = null;
  }
  if (!sessionDoc) {
    return jsonResponse({ message: "Session not found" }, 404);
  }

  const uid = authResult.session.firebase.uid;
  const isMentor = sessionDoc.mentorFirebaseUid === uid;
  const isStudent = sessionDoc.studentFirebaseUid === uid;
  if (!isMentor && !isStudent) {
    return jsonResponse({ message: "Forbidden" }, 403);
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) {
    if (status === "cancelled") update.status = "cancelled";
    else if (status === "confirmed" || status === "scheduled" || status === "completed") {
      if (isMentor) update.status = status;
      else if (isStudent && status === "scheduled") update.status = "scheduled";
    }
  }
  const canSetScheduledTime =
    (isMentor && (status === "confirmed" || status === "scheduled" || status === undefined)) ||
    (isStudent && (sessionDoc.status === "confirmed" || sessionDoc.status === "scheduled") && status !== "cancelled");
  if (scheduledTime !== undefined && typeof scheduledTime === "string" && canSetScheduledTime) {
    update.scheduledTime = scheduledTime;
  }
  if (sessionDoc.status === "completed" && isStudent) {
    if (typeof rating === "number" && rating >= 1 && rating <= 5) update.rating = rating;
    if (typeof review === "string") update.review = review.trim();
  }

  if (Object.keys(update).length <= 1) {
    return jsonResponse({ message: "No valid updates" }, 400);
  }

  await sessionsCol.updateOne({ _id: new ObjectId(id) }, { $set: update });
  const updatedDoc = await sessionsCol.findOne({ _id: new ObjectId(id) });

  const recipientUserId = isMentor
    ? (typeof sessionDoc.studentId === "string" ? sessionDoc.studentId : null)
    : (typeof sessionDoc.mentorId === "string" ? sessionDoc.mentorId : null);
  const recipientSectionId = isMentor ? "mentorship" : "sessions";
  const topic = typeof sessionDoc.topic === "string" ? sessionDoc.topic : "mentorship session";
  const changedStatus = typeof update.status === "string" ? update.status : null;
  const ratingValue = typeof update.rating === "number" ? update.rating : null;
  const reviewValue = typeof update.review === "string" && update.review.trim().length ? update.review.trim() : null;

  if (recipientUserId && (changedStatus || ratingValue !== null || reviewValue !== null)) {
    let title = "Mentorship update";
    let message = `Session "${topic}" has a new update.`;

    if (ratingValue !== null || reviewValue !== null) {
      title = "New mentorship feedback";
      if (ratingValue !== null && reviewValue) {
        message = `Your session "${topic}" received a ${ratingValue}/5 rating and a new review.`;
      } else if (ratingValue !== null) {
        message = `Your session "${topic}" received a ${ratingValue}/5 rating.`;
      } else {
        message = `Your session "${topic}" received a new written review.`;
      }
    } else if (changedStatus === "confirmed") {
      message = isMentor
        ? `Your mentorship request "${topic}" was approved by the mentor.`
        : `You approved the mentorship request "${topic}".`;
    } else if (changedStatus === "scheduled") {
      message = isMentor
        ? `Your mentorship session "${topic}" has a scheduled time.`
        : `A student scheduled "${topic}".`;
    } else if (changedStatus === "completed") {
      message = isMentor
        ? `Your mentorship session "${topic}" was marked completed. You can now rate and review.`
        : `You marked "${topic}" as completed.`;
    } else if (changedStatus === "cancelled") {
      message = isMentor
        ? `Your mentorship session "${topic}" was cancelled.`
        : `The mentorship session "${topic}" was cancelled by the other participant.`;
    }

    await Promise.allSettled([
      createNotification(database, {
        userId: recipientUserId,
        title,
        message,
        type: "mentorship",
        sectionId: recipientSectionId,
        relatedSessionId: id
      }),
      createNotification(database, {
        audienceRoles: ["admin", "super_admin"],
        title: "Mentorship activity update",
        message: `Mentorship session "${topic}" has a new ${changedStatus ?? "feedback"} update.`,
        type: "mentorship",
        sectionId: "mentorship-program",
        relatedSessionId: id
      })
    ]);
  }

  return jsonResponse({
    ...updatedDoc,
    _id: (updatedDoc as { _id?: { toString: () => string } })._id?.toString?.() ?? id
  });
}

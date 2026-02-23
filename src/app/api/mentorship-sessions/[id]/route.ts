import { NextRequest } from "next/server";
import { demoUsers } from "@/lib/demo-data";
import { getDemoSessionById, updateDemoSession } from "@/lib/mentorship-demo-store";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
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
    const isStudent = existing.studentId === currentUserId;
    const updates: Partial<MentorshipSession> = {};

    if (status !== undefined) {
      if (status === "cancelled" && (isStudent || existing.mentorId === currentUserId)) {
        updates.status = "cancelled";
      } else if ((status === "confirmed" || status === "scheduled") && existing.mentorId === currentUserId) {
        updates.status = status;
      } else if (status === "scheduled" && isStudent) {
        updates.status = "scheduled";
      }
    }
    if (scheduledTime !== undefined && typeof scheduledTime === "string") {
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
    const isStudent = existing.studentId === currentUserId;
    const updates: Partial<MentorshipSession> = {};

    if (status !== undefined) {
      if (status === "cancelled") updates.status = "cancelled";
      else if ((status === "confirmed" || status === "scheduled") && existing.mentorId === currentUserId) updates.status = status;
      else if (status === "scheduled" && isStudent) updates.status = "scheduled";
    }
    if (scheduledTime !== undefined && typeof scheduledTime === "string") updates.scheduledTime = scheduledTime;
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
    else if (status === "confirmed" || status === "scheduled") {
      if (isMentor) update.status = status;
      else if (isStudent && status === "scheduled") update.status = "scheduled";
    }
  }
  if (scheduledTime !== undefined && typeof scheduledTime === "string") {
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
  return jsonResponse({
    ...updatedDoc,
    _id: (updatedDoc as { _id?: { toString: () => string } })._id?.toString?.() ?? id
  });
}

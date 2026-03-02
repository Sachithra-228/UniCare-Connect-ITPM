import { NextRequest } from "next/server";
import { demoUsers } from "@/lib/demo-data";
import { getDemoSessions, addDemoSession } from "@/lib/mentorship-demo-store";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";
import type { MentorshipSession } from "@/types";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse(getDemoSessions());
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const uid = authResult.session.firebase.uid;
  const database = await getMongoDatabase();
  const sessionsCol = database.collection("mentorship_sessions");
  const usersCol = database.collection("users");

  const sessions = await sessionsCol
    .find({
      $or: [{ mentorFirebaseUid: uid }, { studentFirebaseUid: uid }]
    })
    .sort({ scheduledTime: -1, createdAt: -1 })
    .toArray();

  const mentorUids = [...new Set(sessions.map((s: { mentorFirebaseUid?: string }) => s.mentorFirebaseUid).filter(Boolean))];
  const studentUids = [...new Set(sessions.map((s: { studentFirebaseUid?: string }) => s.studentFirebaseUid).filter(Boolean))];
  const allUids = [...new Set([...mentorUids, ...studentUids])];

  const userDocs = allUids.length
    ? await usersCol.find({ $or: [{ firebaseUid: { $in: allUids } }, { _id: { $in: allUids } }] }).project({ _id: 1, name: 1, firebaseUid: 1 }).toArray()
    : [];

  const uidToUser = new Map<string, { _id: string; name: string }>();
  userDocs.forEach((u: { _id: { toString: () => string }; name: string; firebaseUid?: string }) => {
    const id = u._id.toString();
    uidToUser.set(id, { _id: id, name: u.name });
    if (u.firebaseUid) uidToUser.set(u.firebaseUid, { _id: id, name: u.name });
  });

  const enriched = sessions.map((item: Record<string, unknown>) => {
    const mentor = uidToUser.get((item.mentorFirebaseUid as string) ?? "") ?? uidToUser.get((item.mentorId as string) ?? "");
    const student = uidToUser.get((item.studentFirebaseUid as string) ?? "") ?? uidToUser.get((item.studentId as string) ?? "");
    return {
      _id: (item._id as { toString: () => string }).toString(),
      mentorId: mentor?._id ?? item.mentorId,
      studentId: student?._id ?? item.studentId,
      mentorName: mentor?.name ?? item.mentorName,
      studentName: student?.name ?? item.studentName,
      topic: item.topic,
      scheduledTime: item.scheduledTime ?? "",
      status: item.status ?? "pending",
      message: item.message,
      feedback: item.feedback,
      rating: item.rating,
      review: item.review,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  });

  // In development, if DB has no sessions, show demo data so the UI isn't blank
  if (enriched.length === 0 && process.env.NODE_ENV === "development") {
    return jsonResponse(getDemoSessions());
  }

  return jsonResponse(enriched);
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const mentorId = payload.mentorId ?? payload.mentor_id;
  const topic = String(payload.topic ?? "").trim();
  const message = payload.message ? String(payload.message).trim() : undefined;

  if (!topic) {
    return jsonResponse({ message: "Topic is required" }, 400);
  }

  if (isDemoMode()) {
    const session = await requireSession(request);
    if (session.error) return session.error;
    const currentUser = session.session.user ?? session.session.firebase;
    const studentId = (currentUser as { _id?: string })._id ?? "u1";
    const mentor = demoUsers.find((u) => u._id === mentorId && u.role === "mentor");
    if (!mentor) {
      return jsonResponse({ message: "Mentor not found" }, 404);
    }
    const newSession: MentorshipSession = {
      _id: `m${Date.now()}`,
      mentorId: mentor._id,
      studentId,
      mentorName: mentor.name,
      studentName: (currentUser as { name?: string }).name ?? "Student",
      topic,
      scheduledTime: "",
      status: "pending",
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addDemoSession(newSession);
    return jsonResponse({ message: "Request sent", session: newSession }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  if (!mentorId) {
    return jsonResponse({ message: "mentorId is required" }, 400);
  }

  const isDemoId = typeof mentorId === "string" && mentorId.length > 0 && (mentorId.length !== 24 || !/^[a-f0-9]{24}$/i.test(mentorId));
  if (isDemoId && process.env.NODE_ENV === "development") {
    const session = await requireSession(request);
    if (session.error) return session.error;
    const currentUser = session.session.user ?? session.session.firebase;
    const studentId = (currentUser as { _id?: string })._id ?? "u1";
    const mentor = demoUsers.find((u) => u._id === mentorId && u.role === "mentor");
    if (!mentor) {
      return jsonResponse({ message: "Mentor not found" }, 404);
    }
    const newSession: MentorshipSession = {
      _id: `m${Date.now()}`,
      mentorId: mentor._id,
      studentId,
      mentorName: mentor.name,
      studentName: (currentUser as { name?: string }).name ?? "Student",
      topic,
      scheduledTime: "",
      status: "pending",
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addDemoSession(newSession);
    return jsonResponse({ message: "Request sent", session: newSession }, 201);
  }

  const database = await getMongoDatabase();
  const usersCol = database.collection("users");
  const { ObjectId } = await import("mongodb");
  const mentorUser = await usersCol.findOne({
    _id: typeof mentorId === "string" && mentorId.length === 24 ? new ObjectId(mentorId) : mentorId,
    role: "mentor"
  });
  if (!mentorUser || !mentorUser.firebaseUid) {
    return jsonResponse({ message: "Mentor not found" }, 404);
  }

  const sessionsCollection = database.collection("mentorship_sessions");
  const now = new Date();
  const document = {
    mentorId,
    mentorFirebaseUid: mentorUser.firebaseUid,
    studentFirebaseUid: authResult.session.firebase.uid,
    studentId: authResult.session.user?._id ?? undefined,
    topic,
    message,
    scheduledTime: "",
    status: "pending",
    createdAt: now,
    updatedAt: now
  };
  const result = await sessionsCollection.insertOne(document as Record<string, unknown>);
  const inserted = {
    ...document,
    _id: result.insertedId.toString()
  };

  return jsonResponse({ message: "Request sent", session: inserted }, 201);
}

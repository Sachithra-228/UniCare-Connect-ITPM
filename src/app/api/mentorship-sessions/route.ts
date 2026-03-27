import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { demoUsers } from "@/lib/demo-data";
import { getDemoSessions, addDemoSession } from "@/lib/mentorship-demo-store";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";
import type { MentorshipSession } from "@/types";

type SessionDocument = {
  _id: ObjectId;
  mentorId?: string;
  mentorFirebaseUid?: string;
  mentorName?: string;
  studentId?: string;
  studentFirebaseUid?: string;
  studentName?: string;
  topic?: string;
  scheduledTime?: string;
  status?: string;
  message?: string;
  feedback?: string;
  rating?: number;
  review?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type UserDocument = {
  _id: ObjectId;
  name: string;
  firebaseUid?: string;
};

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
  const sessionsCol = database.collection<SessionDocument>("mentorship_sessions");
  const usersCol = database.collection<UserDocument>("users");

  const sessions = await sessionsCol
    .find({
      $or: [{ mentorFirebaseUid: uid }, { studentFirebaseUid: uid }]
    })
    .sort({ scheduledTime: -1, createdAt: -1 })
    .toArray();

  const mentorUids = Array.from(
    new Set(sessions.map((s) => s.mentorFirebaseUid).filter((value): value is string => Boolean(value)))
  );
  const studentUids = Array.from(
    new Set(sessions.map((s) => s.studentFirebaseUid).filter((value): value is string => Boolean(value)))
  );
  const allUids = [...new Set([...mentorUids, ...studentUids])];
  const objectIdCandidates = allUids
    .filter((value) => ObjectId.isValid(value))
    .map((value) => new ObjectId(value));

  const [usersByFirebaseUid, usersByObjectId] = await Promise.all([
    allUids.length
      ? usersCol.find({ firebaseUid: { $in: allUids } }).project({ _id: 1, name: 1, firebaseUid: 1 }).toArray()
      : Promise.resolve([] as UserDocument[]),
    objectIdCandidates.length
      ? usersCol.find({ _id: { $in: objectIdCandidates } }).project({ _id: 1, name: 1, firebaseUid: 1 }).toArray()
      : Promise.resolve([] as UserDocument[])
  ]);

  const userDocs = [...usersByFirebaseUid, ...usersByObjectId];
  const uidToUser = new Map<string, { _id: string; name: string }>();
  userDocs.forEach((u) => {
    const id = u._id.toString();
    uidToUser.set(id, { _id: id, name: u.name });
    if (u.firebaseUid) uidToUser.set(u.firebaseUid, { _id: id, name: u.name });
  });

  const enriched = sessions.map((item) => {
    const mentor = uidToUser.get(item.mentorFirebaseUid ?? "") ?? uidToUser.get(item.mentorId ?? "");
    const student = uidToUser.get(item.studentFirebaseUid ?? "") ?? uidToUser.get(item.studentId ?? "");
    return {
      _id: item._id.toString(),
      mentorId: mentor?._id ?? item.mentorId ?? "",
      studentId: student?._id ?? item.studentId ?? "",
      mentorName: mentor?.name ?? item.mentorName ?? "",
      studentName: student?.name ?? item.studentName ?? "",
      topic: item.topic ?? "",
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
  const sessionId = result.insertedId.toString();

  await Promise.allSettled([
    createNotification(database, {
      userId: typeof mentorId === "string" ? mentorId : undefined,
      firebaseUid: mentorUser.firebaseUid,
      title: "New mentorship request",
      message: `A student requested mentorship on "${topic}".`,
      type: "mentorship",
      sectionId: "sessions",
      relatedSessionId: sessionId
    }),
    createNotification(database, {
      userId: typeof document.studentId === "string" ? document.studentId : undefined,
      firebaseUid: document.studentFirebaseUid,
      title: "Mentorship request sent",
      message: `Your mentorship request "${topic}" was sent successfully.`,
      type: "mentorship",
      sectionId: "mentorship",
      relatedSessionId: sessionId
    }),
    createNotification(database, {
      audienceRoles: ["admin", "super_admin"],
      title: "Mentorship request submitted",
      message: `A new mentorship request was submitted for "${topic}".`,
      type: "mentorship",
      sectionId: "mentorship-program",
      relatedSessionId: sessionId
    })
  ]);

  const inserted = {
    ...document,
    _id: sessionId
  };

  return jsonResponse({ message: "Request sent", session: inserted }, 201);
}

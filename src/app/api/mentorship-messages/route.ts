import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getDemoSessionById } from "@/lib/mentorship-demo-store";
import {
  addDemoMentorshipMessage,
  listDemoMentorshipMessages
} from "@/lib/mentorship-chat-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";

type MentorshipSessionDocument = {
  _id: ObjectId;
  topic?: string;
  status?: string;
  mentorId?: string;
  mentorFirebaseUid?: string;
  studentId?: string;
  studentFirebaseUid?: string;
};

type MentorshipMessageDocument = {
  _id: ObjectId;
  sessionId: string;
  senderRole: "student" | "mentor" | "admin";
  senderUserId?: string;
  senderFirebaseUid?: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

function canChat(status?: string) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return normalized === "confirmed" || normalized === "scheduled" || normalized === "completed";
}

function isAdminRole(role?: string) {
  return role === "admin" || role === "faculty" || role === "super_admin";
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return jsonResponse({ message: "sessionId is required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const uid = authResult.session.firebase.uid;
  const role = authResult.session.user?.role ?? "";
  const userId = authResult.session.user?._id;
  const isAdmin = isAdminRole(role);

  if (isDemoMode()) {
    const session = getDemoSessionById(sessionId);
    if (!session) return jsonResponse({ message: "Session not found." }, 404);

    const isMentor = session.mentorId === userId || session.mentorId === uid;
    const isStudent = session.studentId === userId || session.studentId === uid;
    if (!isMentor && !isStudent && !isAdmin) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }

    return jsonResponse(listDemoMentorshipMessages(sessionId));
  }

  if (!ObjectId.isValid(sessionId)) {
    return jsonResponse({ message: "Invalid session id." }, 400);
  }

  const database = await getMongoDatabase();
  const sessionsCol = database.collection<MentorshipSessionDocument>("mentorship_sessions");
  const messagesCol = database.collection<MentorshipMessageDocument>("mentorship_messages");

  const session = await sessionsCol.findOne({ _id: new ObjectId(sessionId) });
  if (!session) return jsonResponse({ message: "Session not found." }, 404);

  const isMentor = session.mentorFirebaseUid === uid;
  const isStudent = session.studentFirebaseUid === uid;
  if (!isMentor && !isStudent && !isAdmin) {
    return jsonResponse({ message: "Forbidden" }, 403);
  }

  const messages = await messagesCol.find({ sessionId }).sort({ createdAt: 1 }).toArray();
  return jsonResponse(
    messages.map((item) => ({
      ...item,
      _id: item._id.toString()
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const sessionId = String(payload.sessionId ?? "").trim();
  const text = String(payload.text ?? "").trim().slice(0, 2000);

  if (!sessionId) return jsonResponse({ message: "sessionId is required." }, 400);
  if (!text) return jsonResponse({ message: "Message text is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const uid = authResult.session.firebase.uid;
  const role = authResult.session.user?.role ?? "";
  const userId = authResult.session.user?._id;
  const isAdmin = isAdminRole(role);

  if (isDemoMode()) {
    const session = getDemoSessionById(sessionId);
    if (!session) return jsonResponse({ message: "Session not found." }, 404);

    const isMentor = session.mentorId === userId || session.mentorId === uid;
    const isStudent = session.studentId === userId || session.studentId === uid;
    if (!isMentor && !isStudent && !isAdmin) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }
    if (!canChat(session.status)) {
      return jsonResponse({ message: "Chat is enabled after the mentor approves your request." }, 409);
    }

    const row = addDemoMentorshipMessage({
      sessionId,
      senderRole: isMentor ? "mentor" : isStudent ? "student" : "admin",
      senderUserId: userId,
      senderFirebaseUid: uid,
      text
    });
    return jsonResponse({ message: "Message sent.", chat: row }, 201);
  }

  if (!ObjectId.isValid(sessionId)) {
    return jsonResponse({ message: "Invalid session id." }, 400);
  }

  const database = await getMongoDatabase();
  const sessionsCol = database.collection<MentorshipSessionDocument>("mentorship_sessions");
  const messagesCol = database.collection<MentorshipMessageDocument>("mentorship_messages");
  const session = await sessionsCol.findOne({ _id: new ObjectId(sessionId) });
  if (!session) return jsonResponse({ message: "Session not found." }, 404);

  const isMentor = session.mentorFirebaseUid === uid;
  const isStudent = session.studentFirebaseUid === uid;
  if (!isMentor && !isStudent && !isAdmin) {
    return jsonResponse({ message: "Forbidden" }, 403);
  }
  if (!canChat(session.status)) {
    return jsonResponse({ message: "Chat is enabled after the mentor approves your request." }, 409);
  }

  const now = new Date();
  const senderRole: "student" | "mentor" | "admin" = isMentor ? "mentor" : isStudent ? "student" : "admin";
  const document: Omit<MentorshipMessageDocument, "_id"> = {
    sessionId,
    senderRole,
    senderUserId: userId,
    senderFirebaseUid: uid,
    text,
    createdAt: now,
    updatedAt: now
  };

  const result = await messagesCol.insertOne(document as MentorshipMessageDocument);
  const topic = String(session.topic ?? "Mentorship session");

  const recipient =
    senderRole === "mentor"
      ? {
          userId: session.studentId,
          firebaseUid: session.studentFirebaseUid,
          sectionId: "mentorship" as const
        }
      : senderRole === "student"
        ? {
            userId: session.mentorId,
            firebaseUid: session.mentorFirebaseUid,
            sectionId: "messages" as const
          }
        : null;

  if (recipient) {
    await createNotification(database, {
      userId: recipient.userId,
      firebaseUid: recipient.firebaseUid,
      title: "New mentor chat message",
      message: `New message in "${topic}".`,
      type: "chat",
      sectionId: recipient.sectionId,
      relatedSessionId: sessionId
    });
  }

  return jsonResponse(
    {
      message: "Message sent.",
      chat: { ...document, _id: result.insertedId.toString() }
    },
    201
  );
}


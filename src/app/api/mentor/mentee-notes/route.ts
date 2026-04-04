import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { addDemoMentorMenteeNote, listDemoMentorMenteeNotes } from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type MenteeNoteDoc = {
  _id?: { toString: () => string };
  mentorUserId?: string;
  mentorFirebaseUid?: string;
  studentId?: string;
  studentName?: string;
  topic?: string;
  note?: string;
  priority?: "low" | "medium" | "high";
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizePriority(value: unknown): "low" | "medium" | "high" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "low" || normalized === "high") return normalized;
  return "medium";
}

function normalizeIsoDate(value?: Date | string) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return new Date().toISOString();
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["mentor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    return jsonResponse({ items: listDemoMentorMenteeNotes({ userId: mentorUserId, firebaseUid: mentorFirebaseUid }) });
  }

  try {
    const database = await getMongoDatabase();
    const items = await database
      .collection<MenteeNoteDoc>("mentor_mentee_notes")
      .find({
        $or: [
          ...(mentorUserId ? [{ mentorUserId }] : []),
          ...(mentorFirebaseUid ? [{ mentorFirebaseUid }] : [])
        ]
      })
      .sort({ updatedAt: -1 })
      .toArray();

    return jsonResponse({
      items: items.map((item) => ({
        _id: item._id?.toString?.() ?? "",
        studentId: item.studentId ?? "",
        studentName: item.studentName ?? "",
        topic: item.topic ?? "",
        note: item.note ?? "",
        priority: item.priority ?? "medium",
        createdAt: normalizeIsoDate(item.createdAt),
        updatedAt: normalizeIsoDate(item.updatedAt ?? item.createdAt)
      }))
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse({ items: listDemoMentorMenteeNotes({ userId: mentorUserId, firebaseUid: mentorFirebaseUid }) });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["mentor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const studentId = normalizeText(payload.studentId, 80);
  const studentName = normalizeText(payload.studentName, 120);
  const topic = normalizeText(payload.topic, 120);
  const note = normalizeText(payload.note, 3000);
  const priority = normalizePriority(payload.priority);
  if (!studentId || !note) {
    return jsonResponse({ message: "Student and note are required." }, 400);
  }

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const created = addDemoMentorMenteeNote({
      mentorUserId,
      mentorFirebaseUid,
      studentId,
      studentName,
      topic,
      note,
      priority
    });
    return jsonResponse({ message: "Mentee note created.", item: created }, 201);
  }

  const now = new Date();
  const document = {
    mentorUserId,
    mentorFirebaseUid,
    studentId,
    studentName,
    topic,
    note,
    priority,
    createdAt: now,
    updatedAt: now
  };

  const database = await getMongoDatabase();
  const result = await database.collection("mentor_mentee_notes").insertOne(document);
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Mentee note saved",
    message: `Your note for ${studentName || "a mentee"} was saved.`,
    type: "mentorship",
    sectionId: "my-mentees"
  });

  return jsonResponse(
    {
      message: "Mentee note created.",
      item: { ...document, _id: result.insertedId.toString(), createdAt: now.toISOString(), updatedAt: now.toISOString() }
    },
    201
  );
}

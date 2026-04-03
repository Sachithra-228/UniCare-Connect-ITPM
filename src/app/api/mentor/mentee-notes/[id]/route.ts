import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { deleteDemoMentorMenteeNote, updateDemoMentorMenteeNote } from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type MenteeNoteDoc = {
  _id: ObjectId;
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

function ownsItem(item: MenteeNoteDoc, identities: string[]) {
  const userId = String(item.mentorUserId ?? "").trim();
  const firebaseUid = String(item.mentorFirebaseUid ?? "").trim();
  return Boolean((userId && identities.includes(userId)) || (firebaseUid && identities.includes(firebaseUid)));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Item id is required." }, 400);

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
  if (!studentId || !note) return jsonResponse({ message: "Student and note are required." }, 400);

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;
  const identities = [mentorUserId, mentorFirebaseUid].filter(Boolean) as string[];

  if (isDemoMode()) {
    const updated = updateDemoMentorMenteeNote(id, {
      studentId,
      studentName,
      topic,
      note,
      priority
    });
    if (!updated) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Mentee note updated.", item: updated });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<MenteeNoteDoc>("mentor_mentee_notes");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const now = new Date();
  const updated = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { studentId, studentName, topic, note, priority, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return jsonResponse({ message: "Item not found." }, 404);

  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Mentee note updated",
    message: `Your note for ${studentName || "a mentee"} was updated.`,
    type: "mentorship",
    sectionId: "my-mentees"
  });

  return jsonResponse({
    message: "Mentee note updated.",
    item: {
      ...updated,
      _id: updated._id.toString(),
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
      updatedAt: now.toISOString()
    }
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Item id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["mentor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;
  const identities = [mentorUserId, mentorFirebaseUid].filter(Boolean) as string[];

  if (isDemoMode()) {
    const removed = deleteDemoMentorMenteeNote(id);
    if (!removed) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Mentee note deleted." });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<MenteeNoteDoc>("mentor_mentee_notes");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  await collection.deleteOne({ _id: new ObjectId(id) });
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Mentee note removed",
    message: `Your note for ${String(existing.studentName ?? "a mentee")} was deleted.`,
    type: "mentorship",
    sectionId: "my-mentees"
  });
  return jsonResponse({ message: "Mentee note deleted." });
}

import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  deleteDemoMentorSuccessStory,
  updateDemoMentorSuccessStory
} from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type SuccessStoryDoc = {
  _id: ObjectId;
  mentorUserId?: string;
  mentorFirebaseUid?: string;
  title?: string;
  studentLabel?: string;
  summary?: string;
  impactMetric?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function ownsItem(item: SuccessStoryDoc, identities: string[]) {
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

  const title = normalizeText(payload.title, 160);
  const studentLabel = normalizeText(payload.studentLabel, 80);
  const summary = normalizeText(payload.summary, 3000);
  const impactMetric = normalizeText(payload.impactMetric, 180);
  if (!title || !summary) return jsonResponse({ message: "Title and summary are required." }, 400);

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;
  const identities = [mentorUserId, mentorFirebaseUid].filter(Boolean) as string[];

  if (isDemoMode()) {
    const updated = updateDemoMentorSuccessStory(id, {
      title,
      studentLabel,
      summary,
      impactMetric
    });
    if (!updated) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Success story updated.", item: updated });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<SuccessStoryDoc>("mentor_success_stories");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const now = new Date();
  const updated = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { title, studentLabel, summary, impactMetric, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return jsonResponse({ message: "Item not found." }, 404);

  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Success story updated",
    message: `Impact story "${title}" was updated.`,
    type: "impact",
    sectionId: "impact-tracker"
  });

  return jsonResponse({
    message: "Success story updated.",
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
    const removed = deleteDemoMentorSuccessStory(id);
    if (!removed) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Success story deleted." });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<SuccessStoryDoc>("mentor_success_stories");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  await collection.deleteOne({ _id: new ObjectId(id) });
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Success story removed",
    message: `Impact story "${String(existing.title ?? "Story")}" was deleted.`,
    type: "impact",
    sectionId: "impact-tracker"
  });
  return jsonResponse({ message: "Success story deleted." });
}

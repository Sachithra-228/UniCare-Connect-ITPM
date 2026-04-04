import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  deleteDemoMentorCareerInsight,
  updateDemoMentorCareerInsight
} from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type CareerInsightDoc = {
  _id: ObjectId;
  mentorUserId?: string;
  mentorFirebaseUid?: string;
  title?: string;
  category?: string;
  content?: string;
  referenceUrl?: string;
  visibility?: "mentees" | "public";
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeVisibility(value: unknown): "mentees" | "public" {
  return String(value ?? "").trim().toLowerCase() === "public" ? "public" : "mentees";
}

function ownsItem(item: CareerInsightDoc, identities: string[]) {
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

  const title = normalizeText(payload.title, 140);
  const category = normalizeText(payload.category, 80) || "General";
  const content = normalizeText(payload.content, 3000);
  const referenceUrl = normalizeText(payload.referenceUrl, 400);
  const visibility = normalizeVisibility(payload.visibility);
  if (!title || !content) {
    return jsonResponse({ message: "Title and content are required." }, 400);
  }

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;
  const identities = [mentorUserId, mentorFirebaseUid].filter(Boolean) as string[];

  if (isDemoMode()) {
    const updated = updateDemoMentorCareerInsight(id, {
      title,
      category,
      content,
      referenceUrl,
      visibility
    });
    if (!updated) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Career insight updated.", item: updated });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<CareerInsightDoc>("mentor_career_insights");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const now = new Date();
  const updated = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { title, category, content, referenceUrl, visibility, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return jsonResponse({ message: "Item not found." }, 404);

  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Career insight updated",
    message: `Your insight "${title}" was updated.`,
    type: "career",
    sectionId: "career-insights"
  });

  return jsonResponse({
    message: "Career insight updated.",
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
    const removed = deleteDemoMentorCareerInsight(id);
    if (!removed) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Career insight deleted." });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<CareerInsightDoc>("mentor_career_insights");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  await collection.deleteOne({ _id: new ObjectId(id) });
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Career insight removed",
    message: `Your insight "${String(existing.title ?? "Insight")}" was deleted.`,
    type: "career",
    sectionId: "career-insights"
  });
  return jsonResponse({ message: "Career insight deleted." });
}

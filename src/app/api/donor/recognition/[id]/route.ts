import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  deleteDemoDonorRecognitionStory,
  updateDemoDonorRecognitionStory
} from "@/lib/donor-recognition-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type RecognitionStoryDoc = {
  _id: ObjectId;
  donorUserId?: string;
  donorFirebaseUid?: string;
  title?: string;
  summary?: string;
  category?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeText(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function ownsStory(item: Pick<RecognitionStoryDoc, "donorUserId" | "donorFirebaseUid">, identities: string[]) {
  const donorUserId = String(item.donorUserId ?? "").trim();
  const donorFirebaseUid = String(item.donorFirebaseUid ?? "").trim();
  return Boolean((donorUserId && identities.includes(donorUserId)) || (donorFirebaseUid && identities.includes(donorFirebaseUid)));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Story id is required." }, 400);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  const title = normalizeText(payload.title, 140);
  const summary = normalizeText(payload.summary, 600);
  const category = normalizeText(payload.category, 80);
  if (!title || !summary) return jsonResponse({ message: "Title and summary are required." }, 400);

  if (isDemoMode()) {
    const updated = updateDemoDonorRecognitionStory(id, { title, summary, category });
    if (!updated) return jsonResponse({ message: "Story not found." }, 404);
    return jsonResponse({ message: "Story updated.", story: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid story id." }, 400);

  try {
    const database = await getMongoDatabase();
    const collection = database.collection<RecognitionStoryDoc>("donor_recognition_stories");
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) return jsonResponse({ message: "Story not found." }, 404);
    if (!ownsStory(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

    const now = new Date();
    const updated = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { title, summary, category, updatedAt: now } },
      { returnDocument: "after" }
    );
    if (!updated) return jsonResponse({ message: "Story not found." }, 404);

    return jsonResponse({
      message: "Story updated.",
      story: {
        id: updated._id.toString(),
        title: updated.title ?? title,
        summary: updated.summary ?? summary,
        category: updated.category ?? category,
        date:
          updated.updatedAt instanceof Date
            ? updated.updatedAt.toISOString()
            : typeof updated.updatedAt === "string"
              ? updated.updatedAt
              : now.toISOString()
      }
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoDonorRecognitionStory(id, { title, summary, category });
      if (!updated) return jsonResponse({ message: "Story not found." }, 404);
      return jsonResponse({ message: "Story updated.", story: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Story id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  if (isDemoMode()) {
    const removed = deleteDemoDonorRecognitionStory(id);
    if (!removed) return jsonResponse({ message: "Story not found." }, 404);
    return jsonResponse({ message: "Story deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid story id." }, 400);

  try {
    const database = await getMongoDatabase();
    const collection = database.collection<RecognitionStoryDoc>("donor_recognition_stories");
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) return jsonResponse({ message: "Story not found." }, 404);
    if (!ownsStory(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

    await collection.deleteOne({ _id: objectId });
    return jsonResponse({ message: "Story deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const removed = deleteDemoDonorRecognitionStory(id);
      if (!removed) return jsonResponse({ message: "Story not found." }, 404);
      return jsonResponse({ message: "Story deleted." });
    }
    throw error;
  }
}

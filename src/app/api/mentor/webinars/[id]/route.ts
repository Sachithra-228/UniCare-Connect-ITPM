import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { deleteDemoMentorWebinar, updateDemoMentorWebinar } from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type WebinarDoc = {
  _id: ObjectId;
  mentorUserId?: string;
  mentorFirebaseUid?: string;
  title?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  mode?: "online" | "in-person" | "hybrid";
  joinLink?: string;
  description?: string;
  status?: "upcoming" | "completed" | "cancelled";
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeStatus(value: unknown): "upcoming" | "completed" | "cancelled" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  return "upcoming";
}

function normalizeMode(value: unknown): "online" | "in-person" | "hybrid" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "online" || normalized === "in-person") return normalized;
  return "hybrid";
}

function ownsItem(item: WebinarDoc, identities: string[]) {
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
  const scheduledAt = normalizeText(payload.scheduledAt, 80);
  const durationMinutes = Number(payload.durationMinutes ?? 60);
  const mode = normalizeMode(payload.mode);
  const joinLink = normalizeText(payload.joinLink, 400);
  const description = normalizeText(payload.description, 3000);
  const status = normalizeStatus(payload.status);
  if (!title || !scheduledAt || !description) {
    return jsonResponse({ message: "Title, schedule, and description are required." }, 400);
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 600) {
    return jsonResponse({ message: "Duration should be between 1 and 600 minutes." }, 400);
  }

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;
  const identities = [mentorUserId, mentorFirebaseUid].filter(Boolean) as string[];

  if (isDemoMode()) {
    const updated = updateDemoMentorWebinar(id, {
      title,
      scheduledAt,
      durationMinutes,
      mode,
      joinLink,
      description,
      status
    });
    if (!updated) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Webinar updated.", item: updated });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<WebinarDoc>("mentor_webinars");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const now = new Date();
  const updated = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { title, scheduledAt, durationMinutes, mode, joinLink, description, status, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return jsonResponse({ message: "Item not found." }, 404);

  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Webinar updated",
    message: `Your webinar "${title}" was updated.`,
    type: "webinar",
    sectionId: "webinars"
  });

  return jsonResponse({
    message: "Webinar updated.",
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
    const removed = deleteDemoMentorWebinar(id);
    if (!removed) return jsonResponse({ message: "Item not found." }, 404);
    return jsonResponse({ message: "Webinar deleted." });
  }

  if (!ObjectId.isValid(id)) return jsonResponse({ message: "Invalid item id." }, 400);
  const database = await getMongoDatabase();
  const collection = database.collection<WebinarDoc>("mentor_webinars");
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Item not found." }, 404);
  if (!ownsItem(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  await collection.deleteOne({ _id: new ObjectId(id) });
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Webinar removed",
    message: `Your webinar "${String(existing.title ?? "Webinar")}" was deleted.`,
    type: "webinar",
    sectionId: "webinars"
  });
  return jsonResponse({ message: "Webinar deleted." });
}

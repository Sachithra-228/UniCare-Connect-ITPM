import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  deleteDemoDonorMessage,
  updateDemoDonorMessage
} from "@/lib/donor-communications-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";
import type { UserRole } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

type MessageDoc = {
  _id: ObjectId;
  donorUserId?: string;
  donorFirebaseUid?: string;
  audience?: string;
  recipientRoles?: UserRole[];
  messageType?: string;
  subject?: string;
  body?: string;
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

function normalizeAudience(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "students") return "Students";
  if (normalized === "admin_faculty") return "University Admin / Faculty";
  if (normalized === "students_admin_faculty") return "Students + University Admin / Faculty";
  if (normalized.includes("admin") && normalized.includes("student")) return "Students + University Admin / Faculty";
  if (normalized.includes("admin")) return "University Admin / Faculty";
  return "Students";
}

function mapAudienceToRoles(audience: string): UserRole[] {
  const normalized = audience.toLowerCase();
  if (normalized.includes("students + university admin / faculty")) {
    return ["student", "admin", "faculty", "super_admin"];
  }
  if (normalized.includes("admin")) return ["admin", "faculty", "super_admin"];
  return ["student"];
}

function ownsMessage(item: Pick<MessageDoc, "donorUserId" | "donorFirebaseUid">, identities: string[]) {
  const donorUserId = String(item.donorUserId ?? "").trim();
  const donorFirebaseUid = String(item.donorFirebaseUid ?? "").trim();
  return Boolean((donorUserId && identities.includes(donorUserId)) || (donorFirebaseUid && identities.includes(donorFirebaseUid)));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Message id is required." }, 400);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  const audience = normalizeAudience(payload.audience);
  const messageType = normalizeText(payload.messageType, 80);
  const subject = normalizeText(payload.subject, 160);
  const body = normalizeText(payload.body, 1000);
  if (!subject || !body) return jsonResponse({ message: "Subject and message are required." }, 400);

  if (isDemoMode()) {
    const updated = updateDemoDonorMessage(id, { audience, messageType, subject, body });
    if (!updated) return jsonResponse({ message: "Message not found." }, 404);
    return jsonResponse({ message: "Message updated.", messageItem: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid message id." }, 400);

  const database = await getMongoDatabase();
  const collection = database.collection<MessageDoc>("donor_communications");
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) return jsonResponse({ message: "Message not found." }, 404);
  if (!ownsMessage(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const now = new Date();
  const recipientRoles = mapAudienceToRoles(audience);
  const updated = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: { audience, recipientRoles, messageType, subject, body, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return jsonResponse({ message: "Message not found." }, 404);

  await Promise.allSettled([
    createNotification(database, {
      userId: donorUserId,
      firebaseUid: donorFirebaseUid,
      title: "Message updated",
      message: `Your message "${subject}" was updated.`,
      type: "communication",
      sectionId: "communications"
    }),
    createNotification(database, {
      audienceRoles: recipientRoles,
      title: `Donor message updated: ${subject}`,
      message: "A donor message was updated.",
      type: "communication",
      sectionId: "communications"
    })
  ]);

  return jsonResponse({
    message: "Message updated.",
    messageItem: {
      ...updated,
      _id: updated._id.toString(),
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
      updatedAt: now.toISOString()
    }
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Message id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  if (isDemoMode()) {
    const removed = deleteDemoDonorMessage(id);
    if (!removed) return jsonResponse({ message: "Message not found." }, 404);
    return jsonResponse({ message: "Message deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid message id." }, 400);

  const database = await getMongoDatabase();
  const collection = database.collection<MessageDoc>("donor_communications");
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) return jsonResponse({ message: "Message not found." }, 404);
  if (!ownsMessage(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  await collection.deleteOne({ _id: objectId });
  await createNotification(database, {
    userId: donorUserId,
    firebaseUid: donorFirebaseUid,
    title: "Message deleted",
    message: `Your message "${String(existing.subject ?? "Message")}" was deleted.`,
    type: "communication",
    sectionId: "communications"
  });

  return jsonResponse({ message: "Message deleted." });
}

import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import {
  buildParentOwnerClauses,
  normalizeText,
  requireParentIdentity,
  toIsoDate,
  toStringId
} from "@/lib/parent-api-auth";
import type { UserRole } from "@/types";

type ParentCommunicationDoc = {
  _id?: unknown;
  parentUserId?: string;
  parentFirebaseUid?: string;
  audience?: string;
  recipientRoles?: UserRole[];
  subject?: string;
  body?: string;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeAudience(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "mentor") return "Mentor";
  if (normalized === "admin_faculty") return "University Admin / Faculty";
  if (normalized.includes("mentor")) return "Mentor";
  return "University Admin / Faculty";
}

function mapAudienceToRoles(audience: string): UserRole[] {
  if (audience === "Mentor") return ["mentor"];
  return ["admin", "faculty", "super_admin"];
}

function mapMessage(item: ParentCommunicationDoc) {
  return {
    _id: toStringId(item._id),
    audience: String(item.audience ?? "University Admin / Faculty"),
    subject: String(item.subject ?? "Message"),
    body: String(item.body ?? ""),
    status: String(item.status ?? "sent"),
    createdAt: toIsoDate(item.createdAt),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

export async function GET(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  if (isDemoMode()) {
    return jsonResponse([]);
  }

  try {
    const database = await getMongoDatabase();
    const messages = await database
      .collection<ParentCommunicationDoc>("parent_communications")
      .find({
        $or: buildParentOwnerClauses({
          userId: parent.identity.userId,
          firebaseUid: parent.identity.firebaseUid
        })
      })
      .sort({ createdAt: -1 })
      .limit(60)
      .toArray();

    return jsonResponse(messages.map(mapMessage));
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(
        { message: "Database temporarily unavailable. Please try again later.", code: "MongoUnavailable" },
        503
      );
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const audience = normalizeAudience(payload.audience);
  const subject = normalizeText(payload.subject, 160);
  const body = normalizeText(payload.body, 1200);

  if (!subject || !body) {
    return jsonResponse({ message: "Subject and message are required." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse(
      {
        _id: `demo-parent-message-${Date.now()}`,
        audience,
        subject,
        body,
        status: "sent",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      201
    );
  }

  try {
    const database = await getMongoDatabase();
    const now = new Date();
    const recipientRoles = mapAudienceToRoles(audience);
    const document: ParentCommunicationDoc = {
      parentUserId: parent.identity.userId,
      parentFirebaseUid: parent.identity.firebaseUid,
      audience,
      recipientRoles,
      subject,
      body,
      status: "sent",
      createdAt: now,
      updatedAt: now
    };
    const result = await database.collection<ParentCommunicationDoc>("parent_communications").insertOne(document);

    await Promise.allSettled([
      createNotification(database, {
        userId: parent.identity.userId,
        firebaseUid: parent.identity.firebaseUid,
        title: "Message sent",
        message: `Your message "${subject}" was sent to ${audience}.`,
        type: "communication",
        sectionId: "communications"
      }),
      createNotification(database, {
        audienceRoles: recipientRoles,
        title: `Parent message: ${subject}`,
        message: `${parent.identity.name} sent a message via parent dashboard.`,
        type: "communication",
        sectionId: "communications"
      })
    ]);

    return jsonResponse({ ...mapMessage(document), _id: result.insertedId.toString() }, 201);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(
        { message: "Database temporarily unavailable. Please try again later.", code: "MongoUnavailable" },
        503
      );
    }
    throw error;
  }
}

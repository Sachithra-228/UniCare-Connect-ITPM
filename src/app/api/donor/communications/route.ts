import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  addDemoDonorMessage,
  listDemoDonorMessages
} from "@/lib/donor-communications-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";
import type { UserRole } from "@/types";

type MessageDoc = {
  _id?: { toString: () => string };
  donorUserId?: string;
  donorFirebaseUid?: string;
  audience?: string;
  messageType?: string;
  subject?: string;
  body?: string;
  createdAt?: Date | string;
};

function normalizeText(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function mapAudienceToRoles(audience: string): UserRole[] {
  const normalized = audience.toLowerCase();
  if (normalized.includes("admin")) return ["admin", "super_admin"];
  return ["student"];
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    return jsonResponse(listDemoDonorMessages({ userId, firebaseUid }));
  }

  try {
    const database = await getMongoDatabase();
    const messages = await database
      .collection<MessageDoc>("donor_communications")
      .find({
        $or: [
          ...(userId ? [{ donorUserId: userId }] : []),
          ...(firebaseUid ? [{ donorFirebaseUid: firebaseUid }] : [])
        ]
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return jsonResponse(
      messages.map((item) => ({
        _id: item._id?.toString?.() ?? "",
        audience: item.audience ?? "Recipients",
        messageType: item.messageType ?? "General update",
        subject: item.subject ?? "Message",
        body: item.body ?? "",
        createdAt:
          item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : typeof item.createdAt === "string"
              ? item.createdAt
              : new Date().toISOString()
      }))
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(listDemoDonorMessages({ userId, firebaseUid }));
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const audience = normalizeText(payload.audience, 80);
  const messageType = normalizeText(payload.messageType, 80);
  const subject = normalizeText(payload.subject, 160);
  const body = normalizeText(payload.body, 1000);

  if (!audience || !subject || !body) {
    return jsonResponse({ message: "Audience, subject, and message are required." }, 400);
  }

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const donorName = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Donor";

  if (isDemoMode()) {
    const created = addDemoDonorMessage({
      donorUserId,
      donorFirebaseUid,
      audience,
      messageType,
      subject,
      body
    });
    return jsonResponse({ message: "Message sent.", messageItem: created }, 201);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  const document = {
    donorUserId,
    donorFirebaseUid,
    audience,
    messageType,
    subject,
    body,
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("donor_communications").insertOne(document);
  const messageId = result.insertedId.toString();

  await Promise.allSettled([
    createNotification(database, {
      userId: donorUserId,
      firebaseUid: donorFirebaseUid,
      title: "Message sent",
      message: `Your message \"${subject}\" was delivered.`,
      type: "communication",
      sectionId: "communications"
    }),
    createNotification(database, {
      audienceRoles: mapAudienceToRoles(audience),
      title: `Donor message: ${subject}`,
      message: `${donorName} sent a ${messageType.toLowerCase()} update.`,
      type: "communication",
      sectionId: "communications"
    })
  ]);

  return jsonResponse(
    {
      message: "Message sent.",
      messageItem: { ...document, _id: messageId, createdAt: now.toISOString() }
    },
    201
  );
}

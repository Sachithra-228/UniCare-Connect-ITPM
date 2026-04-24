import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { addNgoCommunication } from "@/lib/ngo-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";
import type { UserRole } from "@/types";

type MessageDoc = {
  ngoUserId?: string;
  ngoName?: string;
  audience?: string;
  recipientRoles?: UserRole[];
  recipientId?: string; // For direct messages
  messageType?: string;
  subject?: string;
  body?: string;
  donorName?: string; // Re-using this field for inbox display compatibility
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function mapAudienceToRoles(audience: string): UserRole[] {
  const normalized = audience.toLowerCase();
  if (normalized === "beneficiaries") return ["student"];
  if (normalized === "donors") return ["donor"];
  if (normalized === "all-applicants") return ["student"];
  if (normalized === "direct-message") return ["donor", "admin", "faculty"]; // Broad for direct
  return ["student"];
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  
  const roleCheck = requireRole(authResult.session.user?.role, ["ngo", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;

  if (isDemoMode()) {
    const { getNgoCommunications } = await import("@/lib/ngo-demo-store");
    return jsonResponse({ messages: getNgoCommunications() });
  }

  try {
    const database = await getMongoDatabase();
    const messages = await database
      .collection<MessageDoc>("donor_communications")
      .find({ ngoUserId: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return jsonResponse({
      messages: messages.map((item) => ({
        _id: item._id?.toString?.() ?? "",
        audience: item.audience,
        type: item.messageType,
        subject: item.subject,
        message: item.body,
        sentAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        recipientName: item.recipientName
      }))
    });
  } catch (error) {
    return jsonResponse({ message: "Unable to load history." }, 500);
  }
}

export async function POST(request: NextRequest) {

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  
  const roleCheck = requireRole(authResult.session.user?.role, ["ngo", "super_admin"]);
  if (roleCheck) return roleCheck;

  const audience = String(payload.audience ?? "beneficiaries");
  const type = normalizeText(payload.type || payload.messageType, 80);
  const subject = normalizeText(payload.subject, 160);
  const message = normalizeText(payload.message || payload.body, 2000);
  const recipientId = payload.recipientId ? String(payload.recipientId) : undefined;
  const recipientName = payload.recipientName ? String(payload.recipientName) : undefined;

  if (!subject || !message) {
    return jsonResponse({ message: "Subject and message are required." }, 400);
  }

  const ngoUserId = authResult.session.user?._id;
  const ngoName = authResult.session.user?.name ?? "UniCare NGO";
  const recipientRoles = mapAudienceToRoles(audience);

  if (isDemoMode()) {
    const created = addNgoCommunication({
      audience: audience as any,
      type: type as any,
      subject,
      message,
      recipientId,
      recipientName,
      recipientCount: recipientId ? 1 : audience === "donors" ? 8 : 135,
      readRate: 0,
      sentAt: new Date().toISOString(),
    });
    return jsonResponse({ message: "Message sent (Demo).", messageItem: created }, 201);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  const document: MessageDoc = {
    ngoUserId,
    ngoName,
    donorName: ngoName, // Compatible with unified inbox
    audience,
    recipientRoles,
    recipientId,
    messageType: type,
    subject,
    body: message,
    createdAt: now,
    updatedAt: now
  };

  const result = await database.collection("donor_communications").insertOne(document);
  const messageId = result.insertedId.toString();

  // Create notifications for recipients
  await createNotification(database, {
    audienceRoles: recipientId ? undefined : recipientRoles,
    userId: recipientId,
    title: `NGO Update: ${subject}`,
    message: `${ngoName} sent a new update regarding your program.`,
    type: "communication",
    sectionId: "communications"
  });

  return jsonResponse(
    {
      message: "Message delivered successfully.",
      messageItem: { ...document, _id: messageId, createdAt: now.toISOString() }
    },
    201
  );
}

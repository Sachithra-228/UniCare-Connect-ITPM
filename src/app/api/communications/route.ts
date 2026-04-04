import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { listDemoDonorInboxMessages } from "@/lib/donor-communications-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";
import type { UserRole } from "@/types";

type MessageDoc = {
  _id?: ObjectId;
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

type UserDoc = {
  _id: ObjectId;
  name?: string;
  firebaseUid?: string;
  roleDetails?: Record<string, unknown>;
};

const INBOX_ROLES: UserRole[] = ["student", "admin", "faculty", "super_admin"];

function roleAudienceFallbackFilters(role: UserRole) {
  if (role === "student") {
    return [{ audience: { $regex: "student|recipient|beneficiar", $options: "i" } }];
  }
  return [{ audience: { $regex: "admin|faculty", $options: "i" } }];
}

function normalizeIsoDate(value: Date | string | undefined) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return new Date().toISOString();
}

function resolveOrganization(roleDetails?: Record<string, unknown>) {
  if (!roleDetails) return "";
  const candidates = [
    roleDetails.organizationName,
    roleDetails.organization,
    roleDetails.companyName,
    roleDetails.company
  ];
  for (const value of candidates) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userRole = authResult.session.user?.role;
  const roleCheck = requireRole(userRole, INBOX_ROLES);
  if (roleCheck) return roleCheck;

  if (isDemoMode()) {
    const messages = listDemoDonorInboxMessages(userRole as UserRole).map((item) => ({
      _id: item._id,
      audience: item.audience,
      messageType: item.messageType || "General update",
      subject: item.subject || "Message",
      body: item.body || "",
      donorName: "Donor / CSR Partner",
      donorOrganization: null,
      createdAt: item.createdAt,
      updatedAt: item.createdAt
    }));
    return jsonResponse({ messages });
  }

  const roleFilters: Record<string, unknown>[] = [
    { recipientRoles: userRole },
    ...roleAudienceFallbackFilters(userRole as UserRole)
  ];

  try {
    const database = await getMongoDatabase();
    const messageCollection = database.collection<MessageDoc>("donor_communications");
    const userCollection = database.collection<UserDoc>("users");

    const messages = await messageCollection
      .find({ $or: roleFilters })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const donorIds = Array.from(
      new Set(
        messages
          .map((item) => String(item.donorUserId ?? "").trim())
          .filter(Boolean)
      )
    );
    const donorFirebaseUids = Array.from(
      new Set(
        messages
          .map((item) => String(item.donorFirebaseUid ?? "").trim())
          .filter(Boolean)
      )
    );

    const donorFilters: Record<string, unknown>[] = [];
    const donorObjectIds = donorIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    if (donorObjectIds.length) donorFilters.push({ _id: { $in: donorObjectIds } });
    if (donorFirebaseUids.length) donorFilters.push({ firebaseUid: { $in: donorFirebaseUids } });

    const donorIndex = new Map<string, UserDoc>();
    if (donorFilters.length) {
      const donors = await userCollection.find({ $or: donorFilters }).toArray();
      donors.forEach((donor) => {
        donorIndex.set(donor._id.toString(), donor);
        if (donor.firebaseUid) donorIndex.set(donor.firebaseUid, donor);
      });
    }

    return jsonResponse({
      messages: messages.map((item) => {
        const donorIdentity = String(item.donorUserId ?? "").trim() || String(item.donorFirebaseUid ?? "").trim();
        const donor = donorIdentity ? donorIndex.get(donorIdentity) : undefined;
        const donorName = String(donor?.name ?? "").trim() || "Donor / CSR Partner";
        const donorOrganization = resolveOrganization(donor?.roleDetails);
        return {
          _id: item._id?.toString() ?? "",
          audience: item.audience ?? "Recipients",
          messageType: item.messageType ?? "General update",
          subject: item.subject ?? "Message",
          body: item.body ?? "",
          donorName,
          donorOrganization: donorOrganization || null,
          createdAt: normalizeIsoDate(item.createdAt),
          updatedAt: normalizeIsoDate(item.updatedAt ?? item.createdAt)
        };
      })
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const messages = listDemoDonorInboxMessages(userRole as UserRole).map((item) => ({
        _id: item._id,
        audience: item.audience,
        messageType: item.messageType || "General update",
        subject: item.subject || "Message",
        body: item.body || "",
        donorName: "Donor / CSR Partner",
        donorOrganization: null,
        createdAt: item.createdAt,
        updatedAt: item.createdAt
      }));
      return jsonResponse({ messages });
    }
    throw error;
  }
}

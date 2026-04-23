import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import {
  createDemoNgoPartnershipRequest,
  listDemoNgoPartnershipRequests,
  type NgoPartnershipRequest
} from "@/lib/ngo-partnership-demo-store";
import { requireRole, requireSession } from "@/lib/session-auth";
import type { UserRole } from "@/types";

type PartnershipRecipient = "admin_staff" | "donor_csr";
type PartnershipStatus = "pending" | "in_review" | "accepted" | "declined";

type PartnershipDoc = {
  _id?: ObjectId;
  ngoUserId?: string;
  ngoFirebaseUid?: string;
  ngoName?: string;
  title?: string;
  description?: string;
  focusArea?: string;
  recipients?: PartnershipRecipient[];
  status?: PartnershipStatus;
  responseNote?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toIdentity(session: {
  user?: { _id?: string; role?: UserRole; name?: string } | null;
  firebase: { uid?: string };
}) {
  return {
    userId: session.user?._id,
    firebaseUid: session.firebase.uid,
    role: session.user?.role
  };
}

function buildOwnerFilter(identity: { userId?: string; firebaseUid?: string }) {
  const clauses: Array<{ ngoUserId?: string; ngoFirebaseUid?: string }> = [];
  if (identity.userId) clauses.push({ ngoUserId: identity.userId });
  if (identity.firebaseUid) clauses.push({ ngoFirebaseUid: identity.firebaseUid });
  if (!clauses.length) return null;
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

function normalizeRecipients(value: unknown): PartnershipRecipient[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => String(item ?? "").trim().toLowerCase())
    .filter((item): item is PartnershipRecipient => item === "admin_staff" || item === "donor_csr");
  return [...new Set(normalized)];
}

function mapRecipientsToRoles(recipients: PartnershipRecipient[]): UserRole[] {
  const roles = new Set<UserRole>();
  if (recipients.includes("admin_staff")) {
    roles.add("admin");
    roles.add("faculty");
    roles.add("super_admin");
  }
  if (recipients.includes("donor_csr")) {
    roles.add("donor");
  }
  return [...roles];
}

function mapDoc(item: PartnershipDoc): NgoPartnershipRequest {
  return {
    _id: item._id?.toString() ?? "",
    ngoUserId: item.ngoUserId,
    ngoFirebaseUid: item.ngoFirebaseUid,
    ngoName: String(item.ngoName ?? "NGO"),
    title: String(item.title ?? "Partnership request"),
    description: String(item.description ?? ""),
    focusArea: String(item.focusArea ?? ""),
    recipients: normalizeRecipients(item.recipients),
    status: (String(item.status ?? "pending").toLowerCase() as PartnershipStatus) ?? "pending",
    responseNote: String(item.responseNote ?? ""),
    createdAt: new Date(item.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(item.updatedAt ?? Date.now()).toISOString()
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, [
    "ngo",
    "admin",
    "faculty",
    "super_admin",
    "donor"
  ]);
  if (roleCheck) return roleCheck;

  const identity = toIdentity(authResult.session);
  const role = authResult.session.user?.role;

  if (isDemoMode()) {
    return jsonResponse(listDemoNgoPartnershipRequests(identity));
  }

  try {
    const database = await getMongoDatabase();
    const collection = database.collection<PartnershipDoc>("ngo_partnership_requests");
    let filter: Record<string, unknown> = {};

    if (role === "ngo") {
      const ownerFilter = buildOwnerFilter(identity);
      if (!ownerFilter) return jsonResponse([], 200);
      filter = ownerFilter as Record<string, unknown>;
    } else if (role === "donor") {
      filter = { recipients: "donor_csr" };
    } else {
      filter = { recipients: "admin_staff" };
    }

    const rows = await collection.find(filter).sort({ createdAt: -1 }).toArray();
    return jsonResponse(rows.map(mapDoc));
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(listDemoNgoPartnershipRequests(identity));
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["ngo"]);
  if (roleCheck) return roleCheck;

  const identity = toIdentity(authResult.session);
  const ngoName =
    String(authResult.session.user?.name ?? "").trim() ||
    String(authResult.session.firebase.displayName ?? "").trim() ||
    "NGO partner";
  const title = String(payload.title ?? "").trim().slice(0, 160);
  const description = String(payload.description ?? "").trim().slice(0, 1200);
  const focusArea = String(payload.focusArea ?? "").trim().slice(0, 160);
  const recipients = normalizeRecipients(payload.recipients);

  if (!title || !description || !recipients.length) {
    return jsonResponse(
      { message: "Title, description, and at least one recipient are required." },
      400
    );
  }

  const input = {
    ngoName,
    title,
    description,
    focusArea,
    recipients,
    status: "pending" as PartnershipStatus,
    responseNote: ""
  };

  if (isDemoMode()) {
    const created = createDemoNgoPartnershipRequest(identity, input);
    return jsonResponse(
      { message: "Partnership request submitted.", request: created },
      201
    );
  }

  try {
    const database = await getMongoDatabase();
    const now = new Date();
    const document: PartnershipDoc = {
      ngoUserId: identity.userId,
      ngoFirebaseUid: identity.firebaseUid,
      ...input,
      createdAt: now,
      updatedAt: now
    };
    const result = await database
      .collection<PartnershipDoc>("ngo_partnership_requests")
      .insertOne(document);

    await Promise.allSettled([
      createNotification(database, {
        userId: identity.userId,
        firebaseUid: identity.firebaseUid,
        title: "NGO partnership request submitted",
        message: `Your request "${title}" is pending review.`,
        type: "partnership",
        sectionId: "ngo-partnerships"
      }),
      createNotification(database, {
        audienceRoles: mapRecipientsToRoles(recipients),
        title: `New NGO partnership request: ${title}`,
        message: `${ngoName} submitted a partnership request.`,
        type: "partnership",
        sectionId: "ngo-partnerships"
      })
    ]);

    return jsonResponse(
      {
        message: "Partnership request submitted.",
        request: mapDoc({ ...document, _id: result.insertedId })
      },
      201
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const created = createDemoNgoPartnershipRequest(identity, input);
      return jsonResponse(
        { message: "Partnership request submitted.", request: created },
        201
      );
    }
    throw error;
  }
}

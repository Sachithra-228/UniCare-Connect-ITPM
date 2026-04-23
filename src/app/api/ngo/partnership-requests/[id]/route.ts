import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import {
  deleteDemoNgoPartnershipRequest,
  updateDemoNgoPartnershipRequest,
  type NgoPartnershipRequest
} from "@/lib/ngo-partnership-demo-store";
import { requireRole, requireSession } from "@/lib/session-auth";
import type { UserRole } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };
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

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function toIdentity(session: {
  user?: { _id?: string; role?: UserRole } | null;
  firebase: { uid?: string };
}) {
  return {
    userId: session.user?._id,
    firebaseUid: session.firebase.uid,
    role: session.user?.role
  };
}

function normalizeStatus(value: unknown): PartnershipStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "in_review") return "in_review";
  if (normalized === "accepted") return "accepted";
  if (normalized === "declined") return "declined";
  return "pending";
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
    recipients: Array.isArray(item.recipients) ? item.recipients : [],
    status: normalizeStatus(item.status),
    responseNote: String(item.responseNote ?? ""),
    createdAt: new Date(item.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(item.updatedAt ?? Date.now()).toISOString()
  };
}

function canRecipientAct(item: PartnershipDoc, role?: UserRole) {
  if (!role) return false;
  const recipients = Array.isArray(item.recipients) ? item.recipients : [];
  const isAdmin = role === "admin" || role === "faculty" || role === "super_admin";
  const isDonor = role === "donor";
  if (isAdmin && recipients.includes("admin_staff")) return true;
  if (isDonor && recipients.includes("donor_csr")) return true;
  return false;
}

function ownerFilter(identity: { userId?: string; firebaseUid?: string }) {
  const clauses: Array<{ ngoUserId?: string; ngoFirebaseUid?: string }> = [];
  if (identity.userId) clauses.push({ ngoUserId: identity.userId });
  if (identity.firebaseUid) clauses.push({ ngoFirebaseUid: identity.firebaseUid });
  if (!clauses.length) return null;
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing request id." }, 400);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
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
  const role = identity.role;
  const status = payload.status !== undefined ? normalizeStatus(payload.status) : undefined;
  const responseNote =
    payload.responseNote !== undefined
      ? String(payload.responseNote ?? "").trim().slice(0, 500)
      : undefined;

  if (isDemoMode()) {
    const updated = updateDemoNgoPartnershipRequest(identity, id, { status, responseNote });
    if (!updated) return jsonResponse({ message: "Partnership request not found." }, 404);
    return jsonResponse({ message: "Partnership request updated.", request: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid request id." }, 400);

  try {
    const database = await getMongoDatabase();
    const collection = database.collection<PartnershipDoc>("ngo_partnership_requests");
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) return jsonResponse({ message: "Partnership request not found." }, 404);

    const identityOwnerFilter = ownerFilter(identity);
    const isNgoOwner =
      role === "ngo" &&
      identityOwnerFilter &&
      ((identity.userId && existing.ngoUserId === identity.userId) ||
        (identity.firebaseUid && existing.ngoFirebaseUid === identity.firebaseUid));

    const recipientActor = canRecipientAct(existing, role);
    if (!isNgoOwner && !recipientActor) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) update.status = status;
    if (responseNote !== undefined) update.responseNote = responseNote;
    const updated = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!updated) return jsonResponse({ message: "Partnership request not found." }, 404);

    if (recipientActor && status) {
      await createNotification(database, {
        userId: updated.ngoUserId,
        firebaseUid: updated.ngoFirebaseUid,
        title: "NGO partnership request updated",
        message: `Your request "${updated.title}" is now ${status.replace("_", " ")}.`,
        type: "partnership",
        sectionId: "ngo-partnerships"
      });
    }

    return jsonResponse({ message: "Partnership request updated.", request: mapDoc(updated) });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoNgoPartnershipRequest(identity, id, { status, responseNote });
      if (!updated) return jsonResponse({ message: "Partnership request not found." }, 404);
      return jsonResponse({ message: "Partnership request updated.", request: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing request id." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["ngo"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) {
    const deleted = deleteDemoNgoPartnershipRequest(identity, id);
    if (!deleted) return jsonResponse({ message: "Partnership request not found." }, 404);
    return jsonResponse({ message: "Partnership request deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid request id." }, 400);
  const filter = ownerFilter(identity);
  if (!filter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const result = await database
      .collection("ngo_partnership_requests")
      .deleteOne({ _id: objectId, ...filter });
    if (!result.deletedCount) return jsonResponse({ message: "Partnership request not found." }, 404);
    return jsonResponse({ message: "Partnership request deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const deleted = deleteDemoNgoPartnershipRequest(identity, id);
      if (!deleted) return jsonResponse({ message: "Partnership request not found." }, 404);
      return jsonResponse({ message: "Partnership request deleted." });
    }
    throw error;
  }
}

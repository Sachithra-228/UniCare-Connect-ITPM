import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  deleteDemoDonorContribution,
  updateDemoDonorContribution
} from "@/lib/donor-contributions-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type ContributionType = "emergency_fund" | "equipment" | "scholarship" | "general" | "ngo_program";

type ContributionDocument = {
  _id: ObjectId;
  donorUserId?: string;
  donorFirebaseUid?: string;
  donorName?: string;
  contributionType?: ContributionType;
  program?: string;
  category?: string;
  amountLkr?: number;
  note?: string;
  receiptNumber?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const VALID_TYPES: ContributionType[] = ["emergency_fund", "equipment", "scholarship", "general", "ngo_program"];

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeType(value: unknown): ContributionType {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (VALID_TYPES.includes(normalized as ContributionType)) {
    return normalized as ContributionType;
  }
  return "general";
}

function parseAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const digits = value.replace(/[^\d]/g, "");
    if (!digits) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function ownsContribution(item: Pick<ContributionDocument, "donorUserId" | "donorFirebaseUid">, identities: string[]) {
  const donorUserId = String(item.donorUserId ?? "").trim();
  const donorFirebaseUid = String(item.donorFirebaseUid ?? "").trim();
  return Boolean((donorUserId && identities.includes(donorUserId)) || (donorFirebaseUid && identities.includes(donorFirebaseUid)));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Contribution id is required." }, 400);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  const amountLkr = parseAmount(payload.amountLkr);
  if (!amountLkr) return jsonResponse({ message: "Amount is required." }, 400);

  const updates = {
    contributionType: normalizeType(payload.contributionType),
    program: String(payload.program ?? "").trim().slice(0, 140) || "General support",
    category: String(payload.category ?? "").trim().slice(0, 140) || "General support",
    amountLkr,
    note: String(payload.note ?? "").trim().slice(0, 500) || undefined
  };

  if (isDemoMode()) {
    const updated = updateDemoDonorContribution(id, updates);
    if (!updated) return jsonResponse({ message: "Contribution not found." }, 404);
    return jsonResponse({ message: "Contribution updated.", contribution: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid contribution id." }, 400);

  const database = await getMongoDatabase();
  const collection = database.collection<ContributionDocument>("donor_contributions");
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) return jsonResponse({ message: "Contribution not found." }, 404);
  if (!ownsContribution(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const now = new Date();
  const updated = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: { ...updates, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!updated) return jsonResponse({ message: "Contribution not found." }, 404);

  await createNotification(database, {
    userId: donorUserId,
    firebaseUid: donorFirebaseUid,
    title: "Contribution updated",
    message: `Receipt ${String(updated.receiptNumber ?? "").trim() || id} was updated.`,
    type: "financial-aid",
    sectionId: "donations"
  });

  return jsonResponse({
    message: "Contribution updated.",
    contribution: {
      ...updated,
      _id: updated._id.toString(),
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
      updatedAt: now.toISOString()
    }
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Contribution id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  if (isDemoMode()) {
    const removed = deleteDemoDonorContribution(id);
    if (!removed) return jsonResponse({ message: "Contribution not found." }, 404);
    return jsonResponse({ message: "Contribution deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid contribution id." }, 400);

  const database = await getMongoDatabase();
  const collection = database.collection<ContributionDocument>("donor_contributions");
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) return jsonResponse({ message: "Contribution not found." }, 404);
  if (!ownsContribution(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  await collection.deleteOne({ _id: objectId });

  await createNotification(database, {
    userId: donorUserId,
    firebaseUid: donorFirebaseUid,
    title: "Contribution deleted",
    message: `Receipt ${String(existing.receiptNumber ?? "").trim() || id} was removed.`,
    type: "financial-aid",
    sectionId: "donations"
  });

  return jsonResponse({ message: "Contribution deleted." });
}

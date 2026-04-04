import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  deleteDemoDonorFundedUpdate,
  updateDemoDonorFundedUpdate
} from "@/lib/donor-funded-students-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type FundedStudentUpdateDocument = {
  _id: ObjectId;
  donorUserId?: string;
  donorFirebaseUid?: string;
  title?: string;
  detail?: string;
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

function ownsUpdate(item: Pick<FundedStudentUpdateDocument, "donorUserId" | "donorFirebaseUid">, identities: string[]) {
  const donorUserId = String(item.donorUserId ?? "").trim();
  const donorFirebaseUid = String(item.donorFirebaseUid ?? "").trim();
  return Boolean((donorUserId && identities.includes(donorUserId)) || (donorFirebaseUid && identities.includes(donorFirebaseUid)));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Update id is required." }, 400);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  const title = String(payload.title ?? "").trim().slice(0, 140);
  const detail = String(payload.detail ?? "").trim().slice(0, 600);
  if (!title || !detail) return jsonResponse({ message: "Title and detail are required." }, 400);

  if (isDemoMode()) {
    const updated = updateDemoDonorFundedUpdate(id, { title, detail });
    if (!updated) return jsonResponse({ message: "Update not found." }, 404);
    return jsonResponse({ message: "Update saved.", update: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid update id." }, 400);

  try {
    const database = await getMongoDatabase();
    const collection = database.collection<FundedStudentUpdateDocument>("donor_funded_student_updates");
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) return jsonResponse({ message: "Update not found." }, 404);
    if (!ownsUpdate(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

    const now = new Date();
    const updated = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { title, detail, updatedAt: now } },
      { returnDocument: "after" }
    );
    if (!updated) return jsonResponse({ message: "Update not found." }, 404);

    return jsonResponse({
      message: "Update saved.",
      update: {
        id: updated._id.toString(),
        title: updated.title ?? title,
        detail: updated.detail ?? detail,
        date: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt ?? now.toISOString()),
        editable: true
      }
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoDonorFundedUpdate(id, { title, detail });
      if (!updated) return jsonResponse({ message: "Update not found." }, 404);
      return jsonResponse({ message: "Update saved.", update: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Update id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const identities = [...(donorUserId ? [donorUserId] : []), ...(donorFirebaseUid ? [donorFirebaseUid] : [])];

  if (isDemoMode()) {
    const removed = deleteDemoDonorFundedUpdate(id);
    if (!removed) return jsonResponse({ message: "Update not found." }, 404);
    return jsonResponse({ message: "Update deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid update id." }, 400);

  try {
    const database = await getMongoDatabase();
    const collection = database.collection<FundedStudentUpdateDocument>("donor_funded_student_updates");
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) return jsonResponse({ message: "Update not found." }, 404);
    if (!ownsUpdate(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

    await collection.deleteOne({ _id: objectId });
    return jsonResponse({ message: "Update deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const removed = deleteDemoDonorFundedUpdate(id);
      if (!removed) return jsonResponse({ message: "Update not found." }, 404);
      return jsonResponse({ message: "Update deleted." });
    }
    throw error;
  }
}

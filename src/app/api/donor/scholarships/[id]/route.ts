import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  deleteDemoDonorScholarship,
  updateDemoDonorScholarship
} from "@/lib/donor-scholarships-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

type ScholarshipDocument = {
  _id: ObjectId;
  title?: string;
  status?: string;
  createdBy?: string;
  createdByUserId?: string;
  createdByFirebaseUid?: string;
  [key: string]: unknown;
};

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeStatus(value: unknown): "active" | "closed" | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "closed") return "closed";
  return null;
}

function canEdit(
  scholarship: Pick<ScholarshipDocument, "createdBy" | "createdByUserId" | "createdByFirebaseUid">,
  identities: string[]
) {
  const createdBy = String(scholarship.createdBy ?? "").trim();
  const createdByUserId = String(scholarship.createdByUserId ?? "").trim();
  const createdByFirebaseUid = String(scholarship.createdByFirebaseUid ?? "").trim();
  return [createdBy, createdByUserId, createdByFirebaseUid].some((owner) => owner && identities.includes(owner));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Scholarship id is required." }, 400);

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nextStatus = normalizeStatus(payload.status);
  if (!nextStatus) {
    return jsonResponse({ message: "Invalid status. Use active or closed." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identities = [...(userId ? [userId] : []), ...(firebaseUid ? [firebaseUid] : [])];

  if (isDemoMode()) {
    const updated = updateDemoDonorScholarship(id, { status: nextStatus });
    if (!updated) return jsonResponse({ message: "Scholarship not found." }, 404);
    return jsonResponse({ message: "Scholarship updated.", scholarship: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid scholarship id." }, 400);

  const database = await getMongoDatabase();
  const scholarshipsCollection = database.collection<ScholarshipDocument>("scholarships");
  const existing = await scholarshipsCollection.findOne({ _id: objectId });
  if (!existing) return jsonResponse({ message: "Scholarship not found." }, 404);
  if (!canEdit(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const now = new Date();
  const updated = await scholarshipsCollection.findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        status: nextStatus,
        updatedAt: now
      }
    },
    { returnDocument: "after" }
  );
  if (!updated) return jsonResponse({ message: "Scholarship not found." }, 404);

  const scholarshipId = updated._id.toString();
  const title = String(updated.title ?? "Scholarship");

  await Promise.allSettled([
    createNotification(database, {
      userId,
      firebaseUid,
      title: "Scholarship updated",
      message: `"${title}" is now ${nextStatus}.`,
      type: "financial-aid",
      sectionId: "my-scholarships",
      relatedScholarshipId: scholarshipId
    }),
    createNotification(database, {
      audienceRoles: ["student"],
      title: "Scholarship status changed",
      message: `"${title}" is now ${nextStatus}.`,
      type: "financial-aid",
      sectionId: "financial-aid",
      relatedScholarshipId: scholarshipId
    })
  ]);

  return jsonResponse({
    message: "Scholarship updated.",
    scholarship: {
      ...updated,
      _id: scholarshipId,
      updatedAt: now.toISOString()
    }
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Scholarship id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identities = [...(userId ? [userId] : []), ...(firebaseUid ? [firebaseUid] : [])];

  if (isDemoMode()) {
    const removed = deleteDemoDonorScholarship(id);
    if (!removed) return jsonResponse({ message: "Scholarship not found." }, 404);
    return jsonResponse({ message: "Scholarship deleted.", scholarship: removed });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid scholarship id." }, 400);

  const database = await getMongoDatabase();
  const scholarshipsCollection = database.collection<ScholarshipDocument>("scholarships");
  const existing = await scholarshipsCollection.findOne({ _id: objectId });
  if (!existing) return jsonResponse({ message: "Scholarship not found." }, 404);
  if (!canEdit(existing, identities)) return jsonResponse({ message: "Forbidden" }, 403);

  const title = String(existing.title ?? "Scholarship");
  await scholarshipsCollection.deleteOne({ _id: objectId });

  await Promise.allSettled([
    createNotification(database, {
      userId,
      firebaseUid,
      title: "Scholarship deleted",
      message: `"${title}" has been removed.`,
      type: "financial-aid",
      sectionId: "my-scholarships"
    }),
    createNotification(database, {
      audienceRoles: ["student"],
      title: "Scholarship removed",
      message: `"${title}" is no longer available.`,
      type: "financial-aid",
      sectionId: "financial-aid"
    })
  ]);

  return jsonResponse({ message: "Scholarship deleted." });
}

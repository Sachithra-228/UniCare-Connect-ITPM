import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { buildParentOwnerClauses, normalizeText, requireParentIdentity } from "@/lib/parent-api-auth";

function buildOwnerFilter(identity: { userId: string; firebaseUid: string }) {
  const ownerClauses = buildParentOwnerClauses({
    userId: identity.userId,
    firebaseUid: identity.firebaseUid
  });
  return ownerClauses.length ? { $or: ownerClauses } : {};
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  const id = String(params.id ?? "").trim();
  if (!ObjectId.isValid(id)) {
    return jsonResponse({ message: "Invalid note id." }, 400);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const updateFields: Record<string, unknown> = {};
  if ("title" in payload) updateFields.title = normalizeText(payload.title, 140);
  if ("note" in payload) updateFields.note = normalizeText(payload.note, 2000);
  if ("tag" in payload) updateFields.tag = normalizeText(payload.tag, 60) || "general";
  if ("isPinned" in payload) updateFields.isPinned = Boolean(payload.isPinned);

  const hasChange = Object.keys(updateFields).length > 0;
  if (!hasChange) {
    return jsonResponse({ message: "No changes provided." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse({
      _id: id,
      ...updateFields,
      updatedAt: new Date().toISOString()
    });
  }

  try {
    const database = await getMongoDatabase();
    const ownerFilter = buildOwnerFilter(parent.identity);
    const result = await database.collection("parent_tracker_notes").findOneAndUpdate(
      {
        _id: new ObjectId(id),
        ...ownerFilter
      },
      {
        $set: {
          ...updateFields,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return jsonResponse({ message: "Note not found." }, 404);
    }

    return jsonResponse({
      _id: result._id.toString(),
      title: String(result.title ?? "Private note"),
      note: String(result.note ?? ""),
      tag: String(result.tag ?? "general"),
      isPinned: Boolean(result.isPinned),
      createdAt: result.createdAt instanceof Date ? result.createdAt.toISOString() : String(result.createdAt ?? ""),
      updatedAt: result.updatedAt instanceof Date ? result.updatedAt.toISOString() : String(result.updatedAt ?? "")
    });
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  const id = String(params.id ?? "").trim();
  if (!ObjectId.isValid(id)) {
    return jsonResponse({ message: "Invalid note id." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse({ message: "Note deleted." });
  }

  try {
    const database = await getMongoDatabase();
    const ownerFilter = buildOwnerFilter(parent.identity);
    const result = await database.collection("parent_tracker_notes").deleteOne({
      _id: new ObjectId(id),
      ...ownerFilter
    });
    if (!result.deletedCount) {
      return jsonResponse({ message: "Note not found." }, 404);
    }
    return jsonResponse({ message: "Note deleted." });
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

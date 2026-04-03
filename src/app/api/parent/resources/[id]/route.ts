import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { buildParentOwnerClauses, normalizeText, requireParentIdentity } from "@/lib/parent-api-auth";

function buildOwnerFilter(identity: { userId: string; firebaseUid: string; email: string }) {
  const clauses = buildParentOwnerClauses({
    userId: identity.userId,
    firebaseUid: identity.firebaseUid,
    email: identity.email
  });
  return clauses.length ? { $or: clauses } : {};
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  const id = String(params.id ?? "").trim();
  if (!ObjectId.isValid(id)) {
    return jsonResponse({ message: "Invalid resource id." }, 400);
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const updateFields: Record<string, unknown> = {};
  if ("title" in payload) updateFields.title = normalizeText(payload.title, 160);
  if ("type" in payload) updateFields.type = normalizeText(payload.type, 80) || "Guide";
  if ("description" in payload) updateFields.description = normalizeText(payload.description, 800);
  if ("url" in payload) updateFields.url = normalizeText(payload.url, 300);

  if (!Object.keys(updateFields).length) {
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
    const result = await database.collection("parent_resources").findOneAndUpdate(
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
      return jsonResponse({ message: "Resource not found." }, 404);
    }

    return jsonResponse({
      _id: result._id.toString(),
      title: String(result.title ?? "Resource"),
      type: String(result.type ?? "Guide"),
      description: String(result.description ?? ""),
      url: String(result.url ?? ""),
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
    return jsonResponse({ message: "Invalid resource id." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse({ message: "Resource deleted." });
  }

  try {
    const database = await getMongoDatabase();
    const ownerFilter = buildOwnerFilter(parent.identity);
    const result = await database.collection("parent_resources").deleteOne({
      _id: new ObjectId(id),
      ...ownerFilter
    });
    if (!result.deletedCount) {
      return jsonResponse({ message: "Resource not found." }, 404);
    }
    return jsonResponse({ message: "Resource deleted." });
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

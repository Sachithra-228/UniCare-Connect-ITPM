import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  buildParentOwnerClauses,
  normalizeText,
  requireParentIdentity,
  toIsoDate,
  toStringId
} from "@/lib/parent-api-auth";

type ParentResourceDoc = {
  _id?: unknown;
  parentUserId?: string;
  parentFirebaseUid?: string;
  userEmail?: string;
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function mapResource(item: ParentResourceDoc) {
  return {
    _id: toStringId(item._id),
    title: String(item.title ?? "Resource"),
    type: String(item.type ?? "Guide"),
    description: String(item.description ?? ""),
    url: String(item.url ?? ""),
    createdAt: toIsoDate(item.createdAt),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

export async function GET(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  if (isDemoMode()) {
    return jsonResponse([]);
  }

  try {
    const database = await getMongoDatabase();
    const resources = await database
      .collection<ParentResourceDoc>("parent_resources")
      .find({
        $or: buildParentOwnerClauses({
          userId: parent.identity.userId,
          firebaseUid: parent.identity.firebaseUid,
          email: parent.identity.email
        })
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    return jsonResponse(resources.map(mapResource));
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

export async function POST(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = normalizeText(payload.title, 160);
  const type = normalizeText(payload.type, 80) || "Guide";
  const description = normalizeText(payload.description, 800);
  const url = normalizeText(payload.url, 300);

  if (!title || !description) {
    return jsonResponse({ message: "Title and description are required." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse(
      {
        _id: `demo-parent-resource-${Date.now()}`,
        title,
        type,
        description,
        url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      201
    );
  }

  try {
    const database = await getMongoDatabase();
    const now = new Date();
    const document: ParentResourceDoc = {
      parentUserId: parent.identity.userId,
      parentFirebaseUid: parent.identity.firebaseUid,
      userEmail: parent.identity.email,
      title,
      type,
      description,
      url,
      createdAt: now,
      updatedAt: now
    };
    const result = await database.collection<ParentResourceDoc>("parent_resources").insertOne(document);
    return jsonResponse({ ...mapResource(document), _id: result.insertedId.toString() }, 201);
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

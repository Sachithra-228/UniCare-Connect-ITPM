import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  buildParentOwnerClauses,
  normalizeText,
  requireParentIdentity,
  toIsoDate,
  toStringId
} from "@/lib/parent-api-auth";
import { resolveParentLinkedStudent } from "@/lib/parent-link";

type TrackerNoteDoc = {
  _id?: ObjectId;
  parentUserId?: string;
  parentFirebaseUid?: string;
  linkedStudentId?: string;
  linkedStudentFirebaseUid?: string;
  title?: string;
  note?: string;
  tag?: string;
  isPinned?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function mapTracker(item: TrackerNoteDoc) {
  return {
    _id: toStringId(item._id),
    title: String(item.title ?? "Private note"),
    note: String(item.note ?? ""),
    tag: String(item.tag ?? "general"),
    isPinned: Boolean(item.isPinned),
    linkedStudentId: String(item.linkedStudentId ?? ""),
    linkedStudentFirebaseUid: String(item.linkedStudentFirebaseUid ?? ""),
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
    const linkedStudent = await resolveParentLinkedStudent(database, parent.identity.roleDetails);
    const linkedStudentId = String(linkedStudent?._id ?? "").trim();
    const filter: Record<string, unknown> = {
      $or: buildParentOwnerClauses({
        userId: parent.identity.userId,
        firebaseUid: parent.identity.firebaseUid
      })
    };
    if (linkedStudentId) {
      filter.linkedStudentId = linkedStudentId;
    }

    const notes = await database
      .collection<TrackerNoteDoc>("parent_tracker_notes")
      .find(filter)
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(80)
      .toArray();

    return jsonResponse(notes.map(mapTracker));
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
  const title = normalizeText(payload.title, 140);
  const note = normalizeText(payload.note, 2000);
  const tag = normalizeText(payload.tag, 60) || "general";
  const isPinned = Boolean(payload.isPinned);

  if (!title || !note) {
    return jsonResponse({ message: "Title and note are required." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse(
      {
        _id: `demo-parent-note-${Date.now()}`,
        title,
        note,
        tag,
        isPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      201
    );
  }

  try {
    const database = await getMongoDatabase();
    const linkedStudent = await resolveParentLinkedStudent(database, parent.identity.roleDetails);
    const now = new Date();
    const document: TrackerNoteDoc = {
      parentUserId: parent.identity.userId,
      parentFirebaseUid: parent.identity.firebaseUid,
      linkedStudentId: linkedStudent?._id ?? "",
      linkedStudentFirebaseUid: linkedStudent?.firebaseUid ?? "",
      title,
      note,
      tag,
      isPinned,
      createdAt: now,
      updatedAt: now
    };

    const result = await database.collection<TrackerNoteDoc>("parent_tracker_notes").insertOne(document);
    return jsonResponse({ ...mapTracker(document), _id: result.insertedId.toString() }, 201);
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

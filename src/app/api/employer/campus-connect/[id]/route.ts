import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  deleteDemoEmployerCampusEvent,
  updateDemoEmployerCampusEvent,
  type DemoEmployerCampusEvent
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };
type CampusEventStatus = "planning" | "open" | "closed" | "completed" | "cancelled";
type CampusEventType = "career-fair" | "workshop" | "info-session" | "networking" | "other";

type EmployerCampusEventDocument = {
  _id?: ObjectId;
  employerUserId?: string;
  employerFirebaseUid?: string;
  title?: string;
  eventType?: CampusEventType;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  status?: CampusEventStatus;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toIdentity(session: {
  user?: { _id?: string } | null;
  firebase: { uid?: string };
}) {
  const userId = session.user?._id;
  const firebaseUid = session.firebase.uid;
  return { userId, firebaseUid };
}

function buildOwnerFilter(identity: { userId?: string; firebaseUid?: string }) {
  const clauses: Array<{ employerUserId?: string; employerFirebaseUid?: string }> = [];
  if (identity.userId) clauses.push({ employerUserId: identity.userId });
  if (identity.firebaseUid) clauses.push({ employerFirebaseUid: identity.firebaseUid });
  if (!clauses.length) return null;
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

function normalizeStatus(value: unknown): CampusEventStatus {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "open") return "open";
  if (raw === "closed") return "closed";
  if (raw === "completed") return "completed";
  if (raw === "cancelled") return "cancelled";
  return "planning";
}

function normalizeType(value: unknown): CampusEventType {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "career-fair") return "career-fair";
  if (raw === "workshop") return "workshop";
  if (raw === "info-session") return "info-session";
  if (raw === "networking") return "networking";
  return "other";
}

function normalizeCapacity(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return undefined;
  if (numberValue < 0) return 0;
  return Math.min(100000, Math.round(numberValue));
}

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function mapDocument(item: EmployerCampusEventDocument): DemoEmployerCampusEvent {
  return {
    _id: item._id?.toString() ?? "",
    employerUserId: item.employerUserId,
    employerFirebaseUid: item.employerFirebaseUid,
    title: String(item.title ?? "Campus event"),
    eventType: normalizeType(item.eventType),
    eventDate: String(item.eventDate ?? ""),
    startTime: item.startTime ?? "",
    endTime: item.endTime ?? "",
    location: item.location ?? "",
    capacity: typeof item.capacity === "number" ? item.capacity : undefined,
    status: normalizeStatus(item.status),
    notes: item.notes ?? "",
    createdAt: new Date(item.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(item.updatedAt ?? Date.now()).toISOString()
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing event id." }, 400);
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  const patch = {
    title: payload.title !== undefined ? String(payload.title ?? "").trim().slice(0, 180) : undefined,
    eventType: payload.eventType !== undefined ? normalizeType(payload.eventType) : undefined,
    eventDate: payload.eventDate !== undefined ? String(payload.eventDate ?? "").trim().slice(0, 20) : undefined,
    startTime: payload.startTime !== undefined ? String(payload.startTime ?? "").trim().slice(0, 20) : undefined,
    endTime: payload.endTime !== undefined ? String(payload.endTime ?? "").trim().slice(0, 20) : undefined,
    location: payload.location !== undefined ? String(payload.location ?? "").trim().slice(0, 220) : undefined,
    capacity: payload.capacity !== undefined ? normalizeCapacity(payload.capacity) : undefined,
    status: payload.status !== undefined ? normalizeStatus(payload.status) : undefined,
    notes: payload.notes !== undefined ? String(payload.notes ?? "").trim().slice(0, 1200) : undefined
  };

  if (isDemoMode()) {
    const updated = updateDemoEmployerCampusEvent(identity, id, patch);
    if (!updated) return jsonResponse({ message: "Campus event not found." }, 404);
    return jsonResponse({ message: "Campus event updated.", event: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid event id." }, 400);
  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    Object.entries(patch).forEach(([key, value]) => {
      if (value !== undefined) update[key] = value;
    });
    const updated = await database
      .collection<EmployerCampusEventDocument>("employer_campus_connect")
      .findOneAndUpdate({ _id: objectId, ...ownerFilter }, { $set: update }, { returnDocument: "after" });
    if (!updated) return jsonResponse({ message: "Campus event not found." }, 404);
    return jsonResponse({ message: "Campus event updated.", event: mapDocument(updated) });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoEmployerCampusEvent(identity, id, patch);
      if (!updated) return jsonResponse({ message: "Campus event not found." }, 404);
      return jsonResponse({ message: "Campus event updated.", event: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing event id." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) {
    const deleted = deleteDemoEmployerCampusEvent(identity, id);
    if (!deleted) return jsonResponse({ message: "Campus event not found." }, 404);
    return jsonResponse({ message: "Campus event deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid event id." }, 400);
  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const result = await database
      .collection("employer_campus_connect")
      .deleteOne({ _id: objectId, ...ownerFilter });
    if (!result.deletedCount) return jsonResponse({ message: "Campus event not found." }, 404);
    return jsonResponse({ message: "Campus event deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const deleted = deleteDemoEmployerCampusEvent(identity, id);
      if (!deleted) return jsonResponse({ message: "Campus event not found." }, 404);
      return jsonResponse({ message: "Campus event deleted." });
    }
    throw error;
  }
}

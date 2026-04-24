import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  createDemoEmployerCampusEvent,
  listDemoEmployerCampusEvents,
  type DemoEmployerCampusEvent
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

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

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) return jsonResponse(listDemoEmployerCampusEvents(identity));

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse([], 200);

  try {
    const database = await getMongoDatabase();
    const rows = await database
      .collection<EmployerCampusEventDocument>("employer_campus_connect")
      .find(ownerFilter)
      .sort({ eventDate: 1, startTime: 1, createdAt: -1 })
      .toArray();
    return jsonResponse(rows.map(mapDocument));
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(listDemoEmployerCampusEvents(identity));
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  const title = String(payload.title ?? "").trim().slice(0, 180);
  const eventDate = String(payload.eventDate ?? "").trim().slice(0, 20);
  if (!title || !eventDate) {
    return jsonResponse({ message: "Event title and event date are required." }, 400);
  }

  const input = {
    title,
    eventType: normalizeType(payload.eventType),
    eventDate,
    startTime: String(payload.startTime ?? "").trim().slice(0, 20),
    endTime: String(payload.endTime ?? "").trim().slice(0, 20),
    location: String(payload.location ?? "").trim().slice(0, 220),
    capacity: normalizeCapacity(payload.capacity),
    status: normalizeStatus(payload.status),
    notes: String(payload.notes ?? "").trim().slice(0, 1200)
  };

  if (isDemoMode()) {
    const created = createDemoEmployerCampusEvent(identity, input);
    return jsonResponse({ message: "Campus event created.", event: created }, 201);
  }

  try {
    const database = await getMongoDatabase();
    const now = new Date();
    const document: EmployerCampusEventDocument = {
      employerUserId: identity.userId,
      employerFirebaseUid: identity.firebaseUid,
      ...input,
      createdAt: now,
      updatedAt: now
    };
    const result = await database.collection("employer_campus_connect").insertOne(document);
    return jsonResponse(
      { message: "Campus event created.", event: mapDocument({ ...document, _id: result.insertedId }) },
      201
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const created = createDemoEmployerCampusEvent(identity, input);
      return jsonResponse({ message: "Campus event created.", event: created }, 201);
    }
    throw error;
  }
}

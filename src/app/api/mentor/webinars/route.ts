import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { addDemoMentorWebinar, listDemoMentorWebinars } from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type WebinarDoc = {
  _id?: { toString: () => string };
  mentorUserId?: string;
  mentorFirebaseUid?: string;
  title?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  mode?: "online" | "in-person" | "hybrid";
  joinLink?: string;
  description?: string;
  status?: "upcoming" | "completed" | "cancelled";
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeStatus(value: unknown): "upcoming" | "completed" | "cancelled" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  return "upcoming";
}

function normalizeMode(value: unknown): "online" | "in-person" | "hybrid" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "online" || normalized === "in-person") return normalized;
  return "hybrid";
}

function normalizeIsoDate(value?: Date | string) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return new Date().toISOString();
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["mentor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    return jsonResponse({ items: listDemoMentorWebinars({ userId: mentorUserId, firebaseUid: mentorFirebaseUid }) });
  }

  try {
    const database = await getMongoDatabase();
    const items = await database
      .collection<WebinarDoc>("mentor_webinars")
      .find({
        $or: [
          ...(mentorUserId ? [{ mentorUserId }] : []),
          ...(mentorFirebaseUid ? [{ mentorFirebaseUid }] : [])
        ]
      })
      .sort({ scheduledAt: 1, updatedAt: -1 })
      .toArray();

    return jsonResponse({
      items: items.map((item) => ({
        _id: item._id?.toString?.() ?? "",
        title: item.title ?? "",
        scheduledAt: item.scheduledAt ?? "",
        durationMinutes: Number(item.durationMinutes ?? 60),
        mode: item.mode ?? "hybrid",
        joinLink: item.joinLink ?? "",
        description: item.description ?? "",
        status: item.status ?? "upcoming",
        createdAt: normalizeIsoDate(item.createdAt),
        updatedAt: normalizeIsoDate(item.updatedAt ?? item.createdAt)
      }))
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse({ items: listDemoMentorWebinars({ userId: mentorUserId, firebaseUid: mentorFirebaseUid }) });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["mentor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const title = normalizeText(payload.title, 140);
  const scheduledAt = normalizeText(payload.scheduledAt, 80);
  const durationMinutes = Number(payload.durationMinutes ?? 60);
  const mode = normalizeMode(payload.mode);
  const joinLink = normalizeText(payload.joinLink, 400);
  const description = normalizeText(payload.description, 3000);
  const status = normalizeStatus(payload.status);

  if (!title || !scheduledAt || !description) {
    return jsonResponse({ message: "Title, schedule, and description are required." }, 400);
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 600) {
    return jsonResponse({ message: "Duration should be between 1 and 600 minutes." }, 400);
  }

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const created = addDemoMentorWebinar({
      mentorUserId,
      mentorFirebaseUid,
      title,
      scheduledAt,
      durationMinutes,
      mode,
      joinLink,
      description,
      status
    });
    return jsonResponse({ message: "Webinar created.", item: created }, 201);
  }

  const now = new Date();
  const document = {
    mentorUserId,
    mentorFirebaseUid,
    title,
    scheduledAt,
    durationMinutes,
    mode,
    joinLink,
    description,
    status,
    createdAt: now,
    updatedAt: now
  };

  const database = await getMongoDatabase();
  const result = await database.collection("mentor_webinars").insertOne(document);
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Webinar published",
    message: `Your webinar "${title}" is now saved.`,
    type: "webinar",
    sectionId: "webinars"
  });

  return jsonResponse(
    {
      message: "Webinar created.",
      item: { ...document, _id: result.insertedId.toString(), createdAt: now.toISOString(), updatedAt: now.toISOString() }
    },
    201
  );
}

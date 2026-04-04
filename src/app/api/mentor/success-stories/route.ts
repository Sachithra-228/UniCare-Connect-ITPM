import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  addDemoMentorSuccessStory,
  listDemoMentorSuccessStories
} from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type SuccessStoryDoc = {
  _id?: { toString: () => string };
  mentorUserId?: string;
  mentorFirebaseUid?: string;
  title?: string;
  studentLabel?: string;
  summary?: string;
  impactMetric?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
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
    return jsonResponse({
      items: listDemoMentorSuccessStories({ userId: mentorUserId, firebaseUid: mentorFirebaseUid })
    });
  }

  try {
    const database = await getMongoDatabase();
    const items = await database
      .collection<SuccessStoryDoc>("mentor_success_stories")
      .find({
        $or: [
          ...(mentorUserId ? [{ mentorUserId }] : []),
          ...(mentorFirebaseUid ? [{ mentorFirebaseUid }] : [])
        ]
      })
      .sort({ updatedAt: -1 })
      .toArray();

    return jsonResponse({
      items: items.map((item) => ({
        _id: item._id?.toString?.() ?? "",
        title: item.title ?? "",
        studentLabel: item.studentLabel ?? "",
        summary: item.summary ?? "",
        impactMetric: item.impactMetric ?? "",
        createdAt: normalizeIsoDate(item.createdAt),
        updatedAt: normalizeIsoDate(item.updatedAt ?? item.createdAt)
      }))
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse({
        items: listDemoMentorSuccessStories({ userId: mentorUserId, firebaseUid: mentorFirebaseUid })
      });
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

  const title = normalizeText(payload.title, 160);
  const studentLabel = normalizeText(payload.studentLabel, 80);
  const summary = normalizeText(payload.summary, 3000);
  const impactMetric = normalizeText(payload.impactMetric, 180);
  if (!title || !summary) return jsonResponse({ message: "Title and summary are required." }, 400);

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const created = addDemoMentorSuccessStory({
      mentorUserId,
      mentorFirebaseUid,
      title,
      studentLabel,
      summary,
      impactMetric
    });
    return jsonResponse({ message: "Success story created.", item: created }, 201);
  }

  const now = new Date();
  const document = {
    mentorUserId,
    mentorFirebaseUid,
    title,
    studentLabel,
    summary,
    impactMetric,
    createdAt: now,
    updatedAt: now
  };

  const database = await getMongoDatabase();
  const result = await database.collection("mentor_success_stories").insertOne(document);
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Success story saved",
    message: `Impact story "${title}" was saved.`,
    type: "impact",
    sectionId: "impact-tracker"
  });

  return jsonResponse(
    {
      message: "Success story created.",
      item: { ...document, _id: result.insertedId.toString(), createdAt: now.toISOString(), updatedAt: now.toISOString() }
    },
    201
  );
}

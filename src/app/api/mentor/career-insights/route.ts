import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  addDemoMentorCareerInsight,
  listDemoMentorCareerInsights
} from "@/lib/mentor-content-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type CareerInsightDoc = {
  _id?: { toString: () => string };
  mentorUserId?: string;
  mentorFirebaseUid?: string;
  title?: string;
  category?: string;
  content?: string;
  referenceUrl?: string;
  visibility?: "mentees" | "public";
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeVisibility(value: unknown): "mentees" | "public" {
  return String(value ?? "").trim().toLowerCase() === "public" ? "public" : "mentees";
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
      items: listDemoMentorCareerInsights({ userId: mentorUserId, firebaseUid: mentorFirebaseUid })
    });
  }

  try {
    const database = await getMongoDatabase();
    const items = await database
      .collection<CareerInsightDoc>("mentor_career_insights")
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
        category: item.category ?? "General",
        content: item.content ?? "",
        referenceUrl: item.referenceUrl ?? "",
        visibility: item.visibility ?? "mentees",
        createdAt: normalizeIsoDate(item.createdAt),
        updatedAt: normalizeIsoDate(item.updatedAt ?? item.createdAt)
      }))
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse({
        items: listDemoMentorCareerInsights({ userId: mentorUserId, firebaseUid: mentorFirebaseUid })
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

  const title = normalizeText(payload.title, 140);
  const category = normalizeText(payload.category, 80) || "General";
  const content = normalizeText(payload.content, 3000);
  const referenceUrl = normalizeText(payload.referenceUrl, 400);
  const visibility = normalizeVisibility(payload.visibility);
  if (!title || !content) {
    return jsonResponse({ message: "Title and content are required." }, 400);
  }

  const mentorUserId = authResult.session.user?._id;
  const mentorFirebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const created = addDemoMentorCareerInsight({
      mentorUserId,
      mentorFirebaseUid,
      title,
      category,
      content,
      referenceUrl,
      visibility
    });
    return jsonResponse({ message: "Career insight created.", item: created }, 201);
  }

  const now = new Date();
  const document = {
    mentorUserId,
    mentorFirebaseUid,
    title,
    category,
    content,
    referenceUrl,
    visibility,
    createdAt: now,
    updatedAt: now
  };

  const database = await getMongoDatabase();
  const result = await database.collection("mentor_career_insights").insertOne(document);
  await createNotification(database, {
    userId: mentorUserId,
    firebaseUid: mentorFirebaseUid,
    title: "Career insight published",
    message: `Your insight "${title}" was saved.`,
    type: "career",
    sectionId: "career-insights"
  });

  return jsonResponse(
    {
      message: "Career insight created.",
      item: { ...document, _id: result.insertedId.toString(), createdAt: now.toISOString(), updatedAt: now.toISOString() }
    },
    201
  );
}

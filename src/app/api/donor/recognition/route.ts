import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getDemoDonorRecognitionOverview } from "@/lib/donor-recognition-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RecognitionStoryDoc = {
  _id?: { toString: () => string };
  title?: string;
  summary?: string;
  category?: string;
  donorUserId?: string;
  donorFirebaseUid?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type ThankYouDoc = {
  donorUserId?: string;
  donorFirebaseUid?: string;
  message?: string;
};

function toIso(value: Date | string | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return value;
  }
  return new Date().toISOString();
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  if (isDemoMode()) {
    return jsonResponse(getDemoDonorRecognitionOverview());
  }

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  try {
    const database = await getMongoDatabase();
    const stories = await database
      .collection<RecognitionStoryDoc>("donor_recognition_stories")
      .find({
        $or: [
          ...(userId ? [{ donorUserId: userId }] : []),
          ...(firebaseUid ? [{ donorFirebaseUid: firebaseUid }] : [])
        ]
      })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    const thankYouCount = await database.collection<ThankYouDoc>("donor_thank_you_messages").countDocuments({
      $or: [
        ...(userId ? [{ donorUserId: userId }] : []),
        ...(firebaseUid ? [{ donorFirebaseUid: firebaseUid }] : [])
      ]
    });

    const metrics = {
      featuredStories: stories.length,
      studentTestimonials: thankYouCount,
      anonymizedHighlights: Math.max(0, thankYouCount + stories.length),
      engagementRate: Math.min(100, 40 + stories.length * 6 + Math.min(thankYouCount, 10) * 3)
    };

    return jsonResponse({
      metrics,
      stories: stories.map((item) => ({
        id: item._id?.toString?.() ?? "",
        title: item.title ?? "Student highlight",
        summary: item.summary ?? "Recognition highlight from funded student.",
        category: item.category ?? "Student support",
        date: toIso(item.createdAt ?? item.updatedAt)
      }))
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(getDemoDonorRecognitionOverview());
    }
    throw error;
  }
}

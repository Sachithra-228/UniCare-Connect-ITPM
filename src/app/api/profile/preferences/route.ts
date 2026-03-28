import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  getDemoProfilePreferences,
  saveDemoProfilePreferences
} from "@/lib/profile-preferences-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";

type PreferenceDocument = {
  _id?: { toString: () => string };
  privacy?: {
    shareCareerInterestsWithMentors?: boolean;
    shareFinancialAidWithAdmins?: boolean;
  };
  notifications?: {
    emailApplicationStatus?: boolean;
    mentorshipSessionReminders?: boolean;
    weeklyWellnessReminder?: boolean;
  };
  userId?: string;
  firebaseUid?: string;
  updatedAt?: Date | string;
};

const defaultPreferences = {
  privacy: {
    shareCareerInterestsWithMentors: true,
    shareFinancialAidWithAdmins: true
  },
  notifications: {
    emailApplicationStatus: true,
    mentorshipSessionReminders: true,
    weeklyWellnessReminder: false
  }
};

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    return jsonResponse(getDemoProfilePreferences({ userId, firebaseUid }));
  }

  const database = await getMongoDatabase();
  const query = {
    $or: [...(userId ? [{ userId }] : []), ...(firebaseUid ? [{ firebaseUid }] : [])]
  };
  const doc = (await database.collection("profile_preferences").findOne(query)) as PreferenceDocument | null;
  if (!doc) {
    return jsonResponse(defaultPreferences);
  }

  return jsonResponse({
    privacy: {
      shareCareerInterestsWithMentors: doc.privacy?.shareCareerInterestsWithMentors ?? true,
      shareFinancialAidWithAdmins: doc.privacy?.shareFinancialAidWithAdmins ?? true
    },
    notifications: {
      emailApplicationStatus: doc.notifications?.emailApplicationStatus ?? true,
      mentorshipSessionReminders: doc.notifications?.mentorshipSessionReminders ?? true,
      weeklyWellnessReminder: doc.notifications?.weeklyWellnessReminder ?? false
    },
    updatedAt: doc.updatedAt
  });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const privacyPayload = (payload.privacy ?? {}) as Record<string, unknown>;
  const notificationPayload = (payload.notifications ?? {}) as Record<string, unknown>;
  const privacy = {
    shareCareerInterestsWithMentors: Boolean(privacyPayload.shareCareerInterestsWithMentors),
    shareFinancialAidWithAdmins: Boolean(privacyPayload.shareFinancialAidWithAdmins)
  };
  const notifications = {
    emailApplicationStatus: Boolean(notificationPayload.emailApplicationStatus),
    mentorshipSessionReminders: Boolean(notificationPayload.mentorshipSessionReminders),
    weeklyWellnessReminder: Boolean(notificationPayload.weeklyWellnessReminder)
  };

  if (isDemoMode()) {
    const saved = saveDemoProfilePreferences({ userId, firebaseUid, privacy, notifications });
    return jsonResponse({ message: "Preferences saved", preferences: saved });
  }

  const identityClauses = [...(userId ? [{ userId }] : []), ...(firebaseUid ? [{ firebaseUid }] : [])];
  if (!identityClauses.length) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  await database.collection("profile_preferences").updateOne(
    { $or: identityClauses },
    {
      $set: {
        privacy,
        notifications,
        userId,
        firebaseUid,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  return jsonResponse({
    message: "Preferences saved",
    preferences: { privacy, notifications, updatedAt: now.toISOString() }
  });
}

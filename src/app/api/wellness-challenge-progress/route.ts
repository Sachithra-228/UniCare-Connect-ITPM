import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";
import {
  getDemoWellnessChallenges,
  upsertDemoChallengeProgress
} from "@/lib/wellness-demo-store";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const challengeId = String(payload.challengeId ?? "").trim();
  const progress = Math.max(0, Math.min(100, Number(payload.progress ?? 0)));
  const completed = Boolean(payload.completed) || progress >= 100;

  if (!challengeId) {
    return jsonResponse({ message: "challengeId is required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const userName = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Student";

  if (isDemoMode()) {
    const challenge = getDemoWellnessChallenges().find((item) => item._id === challengeId);
    if (!challenge) return jsonResponse({ message: "Challenge not found." }, 404);
    const record = upsertDemoChallengeProgress(
      { challengeId, userId, firebaseUid },
      {
        progress,
        completed,
        joinedAt: new Date().toISOString(),
        completedAt: completed ? new Date().toISOString() : undefined
      }
    );
    return jsonResponse({ message: "Challenge progress saved", progress: record });
  }

  const database = await getMongoDatabase();
  if (!/^[a-f0-9]{24}$/i.test(challengeId)) {
    return jsonResponse({ message: "Invalid challenge id." }, 400);
  }
  const challenge = await database
    .collection("wellness_challenges")
    .findOne({ _id: new ObjectId(challengeId), isActive: { $ne: false } });
  if (!challenge) {
    return jsonResponse({ message: "Challenge not found." }, 404);
  }

  const now = new Date();
  const filter = {
    challengeId,
    $or: [
      ...(userId ? [{ userId }] : []),
      ...(firebaseUid ? [{ firebaseUid }] : [])
    ]
  };

  await database.collection("wellness_challenge_progress").updateOne(
    filter,
    {
      $set: {
        challengeId,
        userId,
        firebaseUid,
        progress,
        completed,
        ...(completed ? { completedAt: now.toISOString() } : {}),
        updatedAt: now
      },
      $setOnInsert: {
        joinedAt: now.toISOString(),
        createdAt: now
      }
    },
    { upsert: true }
  );

  const record = await database.collection("wellness_challenge_progress").findOne(filter);

  if (completed) {
    await Promise.allSettled([
      createNotification(database, {
        userId,
        firebaseUid,
        title: "Challenge completed",
        message: `Great work! You completed "${String((challenge as { title?: string }).title ?? "a challenge")}".`,
        type: "wellness",
        sectionId: "wellness"
      }),
      createNotification(database, {
        audienceRoles: ["admin", "super_admin"],
        title: "Student wellness achievement",
        message: `${userName} completed a wellness challenge.`,
        type: "wellness",
        sectionId: "reports"
      })
    ]);
  }

  return jsonResponse({
    message: "Challenge progress saved",
    progress: { ...record, _id: (record as { _id?: { toString: () => string } })._id?.toString?.() }
  });
}

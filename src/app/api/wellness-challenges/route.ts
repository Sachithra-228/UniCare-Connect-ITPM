import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";
import {
  addDemoWellnessChallenge,
  getDemoChallengeProgress,
  getDemoWellnessChallenges
} from "@/lib/wellness-demo-store";

type ChallengeDocument = {
  _id?: { toString: () => string };
  title?: string;
  description?: string;
  category?: string;
  durationDays?: number;
  points?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type ChallengeProgressDocument = {
  _id?: { toString: () => string };
  challengeId?: string;
  progress?: number;
  completed?: boolean;
  joinedAt?: string;
  completedAt?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const progressMap = new Map(
      getDemoChallengeProgress()
        .filter(
          (item) =>
            (item.userId && userId && item.userId === userId) ||
            (item.firebaseUid && item.firebaseUid === firebaseUid)
        )
        .map((item) => [item.challengeId, item])
    );
    const list = getDemoWellnessChallenges().map((item) => {
      const progress = progressMap.get(item._id);
      return {
        ...item,
        progress: Number(progress?.progress ?? 0),
        completed: Boolean(progress?.completed),
        joined: Boolean(progress)
      };
    });
    return jsonResponse(list);
  }

  const database = await getMongoDatabase();
  const challengeDocs = await database
    .collection("wellness_challenges")
    .find({ isActive: { $ne: false } })
    .sort({ createdAt: -1 })
    .toArray();
  const challengeIds = challengeDocs.map((item) => item._id.toString());

  const progressDocs = challengeIds.length
    ? await database
        .collection("wellness_challenge_progress")
        .find({
          challengeId: { $in: challengeIds },
          $or: [
            ...(userId ? [{ userId }] : []),
            ...(firebaseUid ? [{ firebaseUid }] : [])
          ]
        })
        .toArray()
    : [];

  const progressByChallengeId = new Map<string, ChallengeProgressDocument>();
  progressDocs.forEach((item: ChallengeProgressDocument) => {
    const id = String(item.challengeId ?? "");
    if (!id) return;
    progressByChallengeId.set(id, item);
  });

  return jsonResponse(
    challengeDocs.map((item: ChallengeDocument) => {
      const challengeId = item._id?.toString?.() ?? "";
      const progress = progressByChallengeId.get(challengeId);
      return {
        ...item,
        _id: challengeId,
        progress: Number(progress?.progress ?? 0),
        completed: Boolean(progress?.completed),
        joined: Boolean(progress)
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const title = String(payload.title ?? "").trim();
  const description = String(payload.description ?? "").trim();
  const categoryRaw = String(payload.category ?? "mindfulness").trim().toLowerCase();
  const category = ["mindfulness", "fitness", "sleep", "nutrition", "stress"].includes(categoryRaw)
    ? categoryRaw
    : "mindfulness";
  const durationDays = Math.max(1, Math.min(60, Number(payload.durationDays ?? 7)));
  const points = Math.max(10, Math.min(500, Number(payload.points ?? 100)));

  if (!title || !description) {
    return jsonResponse({ message: "Title and description are required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "faculty", "super_admin"]);
  if (roleCheck) return roleCheck;

  const nowIso = new Date().toISOString();
  if (isDemoMode()) {
    const inserted = addDemoWellnessChallenge({
      title,
      description,
      category: category as "mindfulness" | "fitness" | "sleep" | "nutrition" | "stress",
      durationDays,
      points,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso
    });
    return jsonResponse({ message: "Challenge created", challenge: inserted }, 201);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  const document = {
    title,
    description,
    category,
    durationDays,
    points,
    isActive: true,
    createdBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("wellness_challenges").insertOne(document);

  return jsonResponse(
    { message: "Challenge created", challenge: { ...document, _id: result.insertedId.toString() } },
    201
  );
}


import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

function monthKey(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function moodToScore(mood?: string): number {
  const value = String(mood ?? "").toLowerCase();
  if (value === "great") return 90;
  if (value === "good") return 80;
  if (value === "okay") return 65;
  if (value === "low") return 45;
  if (value === "anxious") return 35;
  return 60;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function wellnessScoreFromLog(log: { mood?: string; stressLevel?: number; sleepHours?: number }) {
  const base = moodToScore(log.mood);
  const stress = Number(log.stressLevel ?? 5);
  const sleep = Number(log.sleepHours ?? 7);
  const stressPenalty = (Math.max(1, Math.min(10, stress)) - 1) * 3.5;
  const sleepDiff = Math.abs(8 - Math.max(0, Math.min(12, sleep)));
  const sleepPenalty = sleepDiff * 4;
  return clampScore(base - stressPenalty - sleepPenalty + 10);
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
  if (roleCheck) {
    return roleCheck;
  }

  if (!process.env.MONGODB_URI || process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return jsonResponse({
      engagement: [
        { month: "Sep", users: 320, aid: 40 },
        { month: "Oct", users: 420, aid: 58 },
        { month: "Nov", users: 520, aid: 72 },
        { month: "Dec", users: 610, aid: 91 },
        { month: "Jan", users: 780, aid: 120 }
      ],
      wellness: [
        { week: "W1", score: 72 },
        { week: "W2", score: 68 },
        { week: "W3", score: 75 },
        { week: "W4", score: 80 }
      ]
    });
  }

  const database = await getMongoDatabase();

  const users = await database
    .collection("users")
    .find({}, { projection: { createdAt: 1 } })
    .toArray();

  const aidRequests = await database
    .collection("aid_requests")
    .find({}, { projection: { createdAt: 1 } })
    .toArray();
  const healthLogs = await database
    .collection("health_logs")
    .find({}, { projection: { date: 1, mood: 1, stressLevel: 1, sleepHours: 1 } })
    .toArray();

  const monthSummary = new Map<string, { users: number; aid: number }>();

  for (const user of users) {
    const date = user.createdAt instanceof Date ? user.createdAt : new Date();
    const key = monthKey(date);
    const existing = monthSummary.get(key) ?? { users: 0, aid: 0 };
    monthSummary.set(key, { ...existing, users: existing.users + 1 });
  }

  for (const request of aidRequests) {
    const date = request.createdAt instanceof Date ? request.createdAt : new Date();
    const key = monthKey(date);
    const existing = monthSummary.get(key) ?? { users: 0, aid: 0 };
    monthSummary.set(key, { ...existing, aid: existing.aid + 1 });
  }

  const engagement = [...monthSummary.entries()].map(([month, stats]) => ({
    month,
    users: stats.users,
    aid: stats.aid
  }));

  const now = new Date();
  const weekBuckets: Array<{ label: string; values: number[] }> = [
    { label: "W1", values: [] },
    { label: "W2", values: [] },
    { label: "W3", values: [] },
    { label: "W4", values: [] }
  ];

  healthLogs.forEach((log) => {
    const dateValue =
      typeof log.date === "string" && log.date.trim().length ? new Date(log.date) : new Date(now);
    if (Number.isNaN(dateValue.getTime())) return;
    const ageDays = Math.floor((now.getTime() - dateValue.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays < 0 || ageDays >= 28) return;
    const bucketIndex = 3 - Math.floor(ageDays / 7);
    if (bucketIndex < 0 || bucketIndex > 3) return;
    weekBuckets[bucketIndex].values.push(
      wellnessScoreFromLog({
        mood: typeof log.mood === "string" ? log.mood : undefined,
        stressLevel: typeof log.stressLevel === "number" ? log.stressLevel : undefined,
        sleepHours: typeof log.sleepHours === "number" ? log.sleepHours : undefined
      })
    );
  });

  const wellness = weekBuckets.map((bucket, index) => {
    if (!bucket.values.length) {
      const fallback = [72, 68, 75, 80][index] ?? 72;
      return { week: bucket.label, score: fallback };
    }
    const avg = bucket.values.reduce((total, value) => total + value, 0) / bucket.values.length;
    return { week: bucket.label, score: clampScore(avg) };
  });

  return jsonResponse({
    engagement: engagement.length ? engagement : [{ month: monthKey(new Date()), users: 0, aid: 0 }],
    wellness
  });
}

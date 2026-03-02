import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

function monthKey(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
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

  return jsonResponse({
    engagement: engagement.length ? engagement : [{ month: monthKey(new Date()), users: 0, aid: 0 }],
    wellness: [
      { week: "W1", score: 72 },
      { week: "W2", score: 68 },
      { week: "W3", score: 75 },
      { week: "W4", score: 80 }
    ]
  });
}

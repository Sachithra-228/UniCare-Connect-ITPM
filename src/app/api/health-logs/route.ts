import { NextRequest } from "next/server";
import { demoHealthLogs } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getWellnessRecommendation, isHighRiskMood } from "@/lib/logic/wellness";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse(demoHealthLogs);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const logs = await database
    .collection("health_logs")
    .find({ firebaseUid: authResult.session.firebase.uid })
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  return jsonResponse(
    logs.map((item) => ({
      ...item,
      _id: item._id.toString()
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const getSessionIdentity = (session: {
    user?: { role?: string; _id?: string } | null;
    firebase?: { uid?: string };
  }) => {
    const isAdmin = ["admin", "faculty", "super_admin"].includes(session.user?.role ?? "");
    const sessionUserId = session.user?._id;
    const sessionFirebaseUid = session.firebase?.uid;
    const requestedUserId = isAdmin && typeof payload.userId === "string" ? payload.userId : undefined;
    const requestedFirebaseUid =
      isAdmin && typeof payload.firebaseUid === "string" ? payload.firebaseUid : undefined;

    return {
      userId: requestedUserId ?? sessionUserId,
      firebaseUid: requestedFirebaseUid ?? sessionFirebaseUid
    };
  };

  if (isDemoMode()) {
    return jsonResponse({ message: "Health log saved (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }
  const identity = getSessionIdentity(authResult.session);

  const database = await getMongoDatabase();
  const healthLogsCollection = database.collection("health_logs");
  const now = new Date();
  const stressLevel = Number(payload.stressLevel ?? 0);
  const sleepHours = Number(payload.sleepHours ?? 0);
  const mood = String(payload.mood ?? "").trim().toLowerCase();
  const recommendation = getWellnessRecommendation(stressLevel, sleepHours);
  const highRisk = isHighRiskMood(mood) || stressLevel >= 8 || sleepHours < 4;

  const document = {
    ...payload,
    mood,
    stressLevel,
    sleepHours,
    recommendations: [recommendation],
    riskLevel: highRisk ? "high" : "normal",
    userId: identity.userId,
    firebaseUid: identity.firebaseUid,
    createdAt: now,
    updatedAt: now
  };
  const result = await healthLogsCollection.insertOne(document);

  await Promise.allSettled([
    createNotification(database, {
      userId: typeof identity.userId === "string" ? identity.userId : undefined,
      firebaseUid: typeof identity.firebaseUid === "string" ? identity.firebaseUid : undefined,
      title: "Wellness check-in saved",
      message: "Your mood check-in has been recorded successfully.",
      type: "wellness",
      sectionId: "wellness"
    }),
    ...(highRisk
      ? [
          createNotification(database, {
            audienceRoles: ["admin", "faculty", "super_admin"],
            title: "High-risk wellness signal",
            message: "A student check-in may require counselor follow-up.",
            type: "wellness",
            sectionId: "reports"
          })
        ]
      : [])
  ]);

  return jsonResponse(
    { message: "Health log saved", healthLog: { ...document, _id: result.insertedId.toString() } },
    201
  );
}


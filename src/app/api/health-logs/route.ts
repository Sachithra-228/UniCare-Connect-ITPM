import { NextRequest } from "next/server";
import { demoHealthLogs } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
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
  if (isDemoMode()) {
    return jsonResponse({ message: "Health log saved (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const healthLogsCollection = database.collection("health_logs");
  const now = new Date();
  const document = {
    ...payload,
    userId: payload.userId ?? authResult.session.user?._id,
    firebaseUid: payload.firebaseUid ?? authResult.session.firebase.uid,
    createdAt: now,
    updatedAt: now
  };
  const result = await healthLogsCollection.insertOne(document);

  return jsonResponse(
    { message: "Health log saved", healthLog: { ...document, _id: result.insertedId.toString() } },
    201
  );
}

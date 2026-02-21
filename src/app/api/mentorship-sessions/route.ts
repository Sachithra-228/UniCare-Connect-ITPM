import { NextRequest } from "next/server";
import { demoMentorshipSessions } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse(demoMentorshipSessions);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const sessions = await database
    .collection("mentorship_sessions")
    .find({
      $or: [
        { mentorFirebaseUid: authResult.session.firebase.uid },
        { studentFirebaseUid: authResult.session.firebase.uid }
      ]
    })
    .sort({ scheduledTime: -1, createdAt: -1 })
    .toArray();

  return jsonResponse(
    sessions.map((item) => ({
      ...item,
      _id: item._id.toString()
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Session scheduled (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const sessionsCollection = database.collection("mentorship_sessions");
  const now = new Date();
  const document = {
    ...payload,
    requestedBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
    studentFirebaseUid: payload.studentFirebaseUid ?? authResult.session.firebase.uid,
    status: payload.status ?? "pending",
    createdAt: now,
    updatedAt: now
  };
  const result = await sessionsCollection.insertOne(document);

  return jsonResponse(
    { message: "Session created", session: { ...document, _id: result.insertedId.toString() } },
    201
  );
}

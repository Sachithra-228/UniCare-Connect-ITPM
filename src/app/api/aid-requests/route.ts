import { NextRequest } from "next/server";
import { jsonResponse, isDemoMode } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";

const demoRequests = [
  {
    id: "aid1",
    category: "Emergency academic aid",
    status: "Under review",
    submittedAt: "2026-02-02"
  },
  {
    id: "aid2",
    category: "Equipment support",
    status: "Approved",
    submittedAt: "2026-01-20"
  }
];

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse(demoRequests);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const requests = await database
    .collection("aid_requests")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return jsonResponse(
    requests.map((item) => ({
      ...item,
      _id: item._id.toString()
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Aid request received (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const requestsCollection = database.collection("aid_requests");
  const now = new Date();

  const document = {
    ...payload,
    userId: payload.userId ?? authResult.session.user?._id,
    firebaseUid: payload.firebaseUid ?? authResult.session.firebase.uid,
    status: payload.status ?? "pending",
    createdAt: now,
    updatedAt: now
  };

  const result = await requestsCollection.insertOne(document);

  return jsonResponse(
    {
      message: "Aid request saved",
      aidRequest: { ...document, _id: result.insertedId.toString() }
    },
    201
  );
}

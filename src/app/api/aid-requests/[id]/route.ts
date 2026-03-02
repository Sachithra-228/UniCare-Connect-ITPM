import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { jsonResponse, isDemoMode } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return jsonResponse({ error: "Missing request id" }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse({ message: "Aid request deleted (demo mode)" });
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase?.uid;
  const orClauses: { userId?: string; firebaseUid?: string }[] = [];
  if (userId) orClauses.push({ userId });
  if (firebaseUid) orClauses.push({ firebaseUid });
  if (orClauses.length === 0) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return jsonResponse({ error: "Invalid request id" }, 400);
  }

  const database = await getMongoDatabase();
  const result = await database
    .collection("aid_requests")
    .deleteOne({ _id: objectId, $or: orClauses });

  if (result.deletedCount === 0) {
    return jsonResponse({ error: "Request not found or you cannot delete it" }, 404);
  }

  return jsonResponse({ message: "Aid request deleted" });
}

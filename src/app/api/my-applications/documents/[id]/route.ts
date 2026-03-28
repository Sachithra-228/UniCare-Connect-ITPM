import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { removeDemoDocument } from "@/lib/my-applications-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Document id is required." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identityClauses = [...(userId ? [{ userId }] : []), ...(firebaseUid ? [{ firebaseUid }] : [])];
  if (!identityClauses.length) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  if (isDemoMode()) {
    const removed = removeDemoDocument({ id, userId, firebaseUid });
    if (!removed) return jsonResponse({ message: "Document not found." }, 404);
    return jsonResponse({ message: "Document removed" });
  }

  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return jsonResponse({ message: "Invalid document id." }, 400);
  }

  const database = await getMongoDatabase();
  const filter = {
    _id: new ObjectId(id),
    $or: identityClauses
  };
  const result = await database.collection("application_documents").deleteOne(filter);
  if (!result.deletedCount) {
    return jsonResponse({ message: "Document not found." }, 404);
  }

  return jsonResponse({ message: "Document removed" });
}

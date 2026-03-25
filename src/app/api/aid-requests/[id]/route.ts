import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { jsonResponse, isDemoMode } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeAidStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  if (value === "pending") return "Pending";
  if (value === "under review") return "Under review";
  return null;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return jsonResponse({ error: "Missing request id" }, 400);
  }

  const payload = await request.json().catch(() => ({} as { status?: string; reviewNote?: string }));
  const nextStatus = normalizeAidStatus(String(payload.status ?? ""));
  if (!nextStatus) {
    return jsonResponse({ error: "Invalid status. Use Approved, Rejected, Pending, or Under review." }, 400);
  }

  if (isDemoMode()) {
    return jsonResponse({
      message: "Aid request updated (demo mode)",
      aidRequest: {
        _id: id,
        status: nextStatus,
        reviewNote: payload.reviewNote ?? ""
      }
    });
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
  if (roleCheck) {
    return roleCheck;
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return jsonResponse({ error: "Invalid request id" }, 400);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  const reviewNote =
    typeof payload.reviewNote === "string" && payload.reviewNote.trim().length
      ? payload.reviewNote.trim().slice(0, 500)
      : null;

  const result = await database.collection("aid_requests").findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        status: nextStatus,
        reviewNote,
        reviewedBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
        updatedAt: now
      }
    },
    { returnDocument: "after" }
  );

  if (!result) {
    return jsonResponse({ error: "Request not found" }, 404);
  }

  return jsonResponse({
    message: "Aid request updated",
    aidRequest: {
      ...result,
      _id: result._id.toString()
    }
  });
}

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

  const objectId = toObjectId(id);
  if (!objectId) {
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

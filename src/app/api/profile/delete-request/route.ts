import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import {
  addDemoDeleteRequest,
  findPendingDemoDeleteRequest
} from "@/lib/profile-preferences-demo-store";
import { requireSession } from "@/lib/session-auth";

type DeleteRequestDocument = {
  _id?: { toString: () => string };
  userId?: string;
  firebaseUid?: string;
  email?: string;
  name?: string;
  reason?: string;
  status?: "pending" | "approved" | "rejected";
  requestedAt?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function safeReason(value: unknown) {
  return String(value ?? "").trim().slice(0, 600);
}

function identityClauses(input: { userId?: string; firebaseUid?: string }) {
  return [...(input.userId ? [{ userId: input.userId }] : []), ...(input.firebaseUid ? [{ firebaseUid: input.firebaseUid }] : [])];
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identity = identityClauses({ userId, firebaseUid });
  if (!identity.length) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  if (isDemoMode()) {
    const pending = findPendingDemoDeleteRequest({ userId, firebaseUid });
    return jsonResponse({ pending: Boolean(pending), request: pending });
  }

  const database = await getMongoDatabase();
  const pending = (await database.collection("account_deletion_requests").findOne({
    $or: identity,
    status: "pending"
  })) as DeleteRequestDocument | null;

  if (!pending) {
    return jsonResponse({ pending: false, request: null });
  }

  return jsonResponse({
    pending: true,
    request: {
      ...pending,
      _id: pending._id?.toString?.() ?? null
    }
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const email = authResult.session.user?.email ?? authResult.session.firebase.email ?? undefined;
  const name = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? undefined;
  const reason = safeReason(payload.reason);

  const identity = identityClauses({ userId, firebaseUid });
  if (!identity.length) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  if (isDemoMode()) {
    const existing = findPendingDemoDeleteRequest({ userId, firebaseUid });
    if (existing) {
      return jsonResponse({ message: "A deletion request is already pending.", request: existing }, 409);
    }
    const created = addDemoDeleteRequest({ userId, firebaseUid, email, name, reason: reason || undefined });
    return jsonResponse({ message: "Deletion request submitted.", request: created }, 201);
  }

  const database = await getMongoDatabase();
  const collection = database.collection("account_deletion_requests");
  const existing = (await collection.findOne({
    $or: identity,
    status: "pending"
  })) as DeleteRequestDocument | null;
  if (existing) {
    return jsonResponse(
      {
        message: "A deletion request is already pending.",
        request: { ...existing, _id: existing._id?.toString?.() ?? null }
      },
      409
    );
  }

  const now = new Date();
  const requestDoc: Omit<DeleteRequestDocument, "_id"> = {
    userId,
    firebaseUid,
    email,
    name,
    reason: reason || undefined,
    status: "pending",
    requestedAt: now.toISOString(),
    createdAt: now,
    updatedAt: now
  };
  const result = await collection.insertOne(requestDoc);

  await createNotification(database, {
    audienceRoles: ["admin", "faculty", "super_admin"],
    title: "New account deletion request",
    message: `${name ?? email ?? "A user"} requested account deletion review.`,
    type: "profile",
    sectionId: "profile"
  });

  return jsonResponse(
    {
      message: "Deletion request submitted.",
      request: {
        ...requestDoc,
        _id: result.insertedId.toString()
      }
    },
    201
  );
}


import { NextRequest } from "next/server";
import { Db, ObjectId } from "mongodb";
import { jsonResponse, isDemoMode } from "@/lib/api";
import {
  deleteDemoAidRequest,
  listDemoAidRequests,
  updateDemoAidRequest
} from "@/lib/aid-requests-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };
type BalanceField = "mealVoucherBalance" | "tuitionSupportBalance";

type AidRequestDocument = {
  _id: ObjectId;
  category?: string;
  amount?: string | number;
  userId?: string;
  firebaseUid?: string;
  [key: string]: unknown;
};

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

function parseAidAmount(amount: unknown) {
  if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
    return Math.trunc(amount);
  }
  if (typeof amount === "string") {
    const digitsOnly = amount.replace(/[^\d]/g, "");
    if (!digitsOnly) return 0;
    const parsed = Number.parseInt(digitsOnly, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function normalizeAidCategory(category?: string) {
  const value = String(category ?? "").trim().toLowerCase();
  if (value.includes("equipment")) return "equipment";
  if (value.includes("meal") || value.includes("voucher") || value.includes("boarding")) return "boarding";
  if (value.includes("tuition") || value.includes("maintenance") || value.includes("fee")) return "tuition";
  if (value.includes("emergency")) return "emergency";
  return "other";
}

function resolveBalanceField(category?: string): BalanceField | null {
  const normalized = normalizeAidCategory(category);
  if (normalized === "boarding") return "mealVoucherBalance";
  if (normalized === "equipment") return null;
  return "tuitionSupportBalance";
}

async function creditStudentBalance(database: Db, aidRequest: AidRequestDocument, now: Date) {
  const amount = parseAidAmount(aidRequest.amount);
  const balanceField = resolveBalanceField(aidRequest.category);
  const userId = typeof aidRequest.userId === "string" && aidRequest.userId.trim().length ? aidRequest.userId.trim() : null;
  const firebaseUid =
    typeof aidRequest.firebaseUid === "string" && aidRequest.firebaseUid.trim().length
      ? aidRequest.firebaseUid.trim()
      : null;

  if (!amount || !balanceField || (!userId && !firebaseUid)) {
    return null;
  }

  const matchClauses: Array<{ userId?: string; firebaseUid?: string }> = [];
  if (userId) matchClauses.push({ userId });
  if (firebaseUid) matchClauses.push({ firebaseUid });

  const setFields: Record<string, unknown> = { updatedAt: now };
  if (userId) setFields.userId = userId;
  if (firebaseUid) setFields.firebaseUid = firebaseUid;

  const incFields: Record<string, number> = { [balanceField]: amount };

  const financialCollection = database.collection("student_financial");
  const matchFilter = matchClauses.length === 1 ? matchClauses[0] : { $or: matchClauses };
  const matched = await financialCollection.updateOne(
    matchFilter,
    {
      $inc: incFields,
      $set: setFields
    },
    { upsert: false }
  );

  if (matched.matchedCount === 0) {
    const primaryFilter = userId ? { userId } : { firebaseUid: firebaseUid as string };
    await financialCollection.updateOne(
      primaryFilter,
      {
        $inc: incFields,
        $set: setFields,
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );
  }

  return { balanceField, amount };
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
    const current = listDemoAidRequests().find((item) => item._id === id || item.id === id);
    if (!current) {
      return jsonResponse({ error: "Request not found" }, 404);
    }
    if (current.balanceApplied && nextStatus !== "Approved") {
      return jsonResponse(
        { error: "Approved requests with credited balance cannot be changed to another status." },
        409
      );
    }
    const updated = updateDemoAidRequest(id, {
      status: nextStatus,
      reviewNote: typeof payload.reviewNote === "string" ? payload.reviewNote.trim() : null,
      ...(nextStatus === "Approved" ? { balanceApplied: true } : {})
    });
    if (!updated) {
      return jsonResponse({ error: "Request not found" }, 404);
    }
    return jsonResponse({
      message: "Aid request updated (demo mode)",
      aidRequest: updated
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
  const requestsCollection = database.collection<AidRequestDocument>("aid_requests");
  const now = new Date();
  const reviewNote =
    typeof payload.reviewNote === "string" && payload.reviewNote.trim().length
      ? payload.reviewNote.trim().slice(0, 500)
      : null;
  const reviewedBy = authResult.session.user?._id ?? authResult.session.firebase.uid;

  const setFields = {
    status: nextStatus,
    reviewNote,
    reviewedBy,
    updatedAt: now
  };

  let financialCredit: { balanceField: BalanceField; amount: number } | null = null;
  let result: AidRequestDocument | null = null;
  const existing = await requestsCollection.findOne(
    { _id: objectId },
    { projection: { _id: 1, status: 1, balanceApplied: 1 } }
  );

  if (!existing) {
    return jsonResponse({ error: "Request not found" }, 404);
  }

  const alreadyCredited = Boolean(existing.balanceApplied);
  if (alreadyCredited && nextStatus !== "Approved") {
    return jsonResponse(
      { error: "Approved requests with credited balance cannot be changed to another status." },
      409
    );
  }

  if (nextStatus === "Approved") {
    result = await requestsCollection.findOneAndUpdate(
      {
        _id: objectId,
        status: { $nin: ["Approved", "approved"] },
        balanceApplied: { $ne: true }
      },
      {
        $set: {
          ...setFields,
          balanceApplied: true,
          approvedAt: now
        }
      },
      { returnDocument: "after" }
    );

    if (result) {
      financialCredit = await creditStudentBalance(database, result, now);
    } else {
      result = await requestsCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: setFields },
        { returnDocument: "after" }
      );
    }
  } else {
    result = await requestsCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: setFields },
      { returnDocument: "after" }
    );
  }

  if (!result) return jsonResponse({ error: "Request not found" }, 404);

  const requestId = result._id.toString();
  const category = String(result.category ?? "financial aid request");
  const userId = typeof result.userId === "string" ? result.userId : undefined;
  const firebaseUid = typeof result.firebaseUid === "string" ? result.firebaseUid : undefined;
  const statusMessage =
    nextStatus === "Approved"
      ? financialCredit
        ? `Your ${category} was approved. ${financialCredit.amount} LKR was added to your support balance.`
        : `Your ${category} was approved.`
      : nextStatus === "Rejected"
        ? `Your ${category} was rejected. Review the note and re-apply if needed.`
        : nextStatus === "Under review"
          ? `Your ${category} is currently under review.`
          : `Your ${category} status is now ${nextStatus}.`;

  await Promise.allSettled([
    createNotification(database, {
      userId,
      firebaseUid,
      title: `Aid request ${nextStatus}`,
      message: statusMessage,
      type: "financial-aid",
      sectionId: "financial-aid",
      relatedAidRequestId: requestId
    }),
    createNotification(database, {
      audienceRoles: ["admin", "super_admin"],
      title: "Aid review updated",
      message: `${category} was marked ${nextStatus}.`,
      type: "financial-aid",
      sectionId: "financial-oversight",
      relatedAidRequestId: requestId
    }),
    createNotification(database, {
      audienceRoles: ["donor"],
      title: "Aid decision update",
      message: `${category} was marked ${nextStatus}.`,
      type: "financial-aid",
      sectionId: "impact-reports",
      relatedAidRequestId: requestId
    }),
    createNotification(database, {
      audienceRoles: ["ngo"],
      title: "Aid decision update",
      message: `${category} was marked ${nextStatus}.`,
      type: "financial-aid",
      sectionId: "funding",
      relatedAidRequestId: requestId
    })
  ]);

  return jsonResponse({
    message: "Aid request updated",
    aidRequest: {
      ...result,
      _id: result._id.toString()
    },
    financialCredit
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return jsonResponse({ error: "Missing request id" }, 400);
  }

  if (isDemoMode()) {
    const deleted = deleteDemoAidRequest(id);
    if (!deleted) {
      return jsonResponse({ error: "Request not found or you cannot delete it" }, 404);
    }
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

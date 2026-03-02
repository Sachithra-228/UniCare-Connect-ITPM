import { NextRequest } from "next/server";
import { isMongoConnectionError, jsonResponse, isDemoMode } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse({
      mealVoucherBalance: 1250,
      tuitionSupportBalance: 50000,
      currency: "LKR",
      lastUpdated: new Date().toISOString().slice(0, 10)
    });
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
  const filter = orClauses.length ? { $or: orClauses } : {};

  try {
    const database = await getMongoDatabase();
    const doc = await database
      .collection("student_financial")
      .findOne(filter as Record<string, unknown>);

    const mealVoucherBalance = doc?.mealVoucherBalance ?? 0;
    const tuitionSupportBalance = doc?.tuitionSupportBalance ?? 0;

    return jsonResponse({
      mealVoucherBalance: Number(mealVoucherBalance),
      tuitionSupportBalance: Number(tuitionSupportBalance),
      currency: "LKR",
      lastUpdated: doc?.updatedAt
        ? new Date(doc.updatedAt as Date).toISOString().slice(0, 10)
        : null
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse({
        mealVoucherBalance: 1250,
        tuitionSupportBalance: 50000,
        currency: "LKR",
        lastUpdated: null
      });
    }
    throw error;
  }
}

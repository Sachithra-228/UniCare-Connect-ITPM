import { NextRequest } from "next/server";
import { errorMessageForDev, isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";

type PreflightPayload = {
  email?: string;
};

type DbUser = {
  email: string;
  isDeleted?: boolean;
  status?: string;
  role?: string;
  subscription?: {
    status?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return jsonResponse({ allowed: true, code: "DEMO_MODE" });
    }

    let payload: PreflightPayload;
    try {
      payload = (await request.json()) as PreflightPayload;
    } catch {
      return jsonResponse({ allowed: false, code: "INVALID_BODY" }, 400);
    }

    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      return jsonResponse({ allowed: false, code: "EMAIL_REQUIRED" }, 400);
    }

    const PREFLIGHT_DB_TIMEOUT_MS = 10_000;

    try {
      const database = await getMongoDatabase();
      const usersCollection = database.collection<DbUser>("users");
      const user = await Promise.race([
        usersCollection.findOne({ email }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Preflight database timeout")), PREFLIGHT_DB_TIMEOUT_MS)
        )
      ]);

      if (!user) {
        return jsonResponse({ allowed: false, code: "USER_NOT_FOUND" }, 404);
      }

      if (user.isDeleted || user.status === "deleted") {
        return jsonResponse({ allowed: false, code: "ACCOUNT_DELETED" }, 403);
      }

      if (user.status === "blocked" || user.subscription?.status === "blocked") {
        return jsonResponse({ allowed: false, code: "ACCOUNT_BLOCKED" }, 403);
      }

      return jsonResponse({
        allowed: true,
        code: "OK",
        role: user.role ?? null
      });
    } catch (err) {
      const devMessage = errorMessageForDev(err);
      return jsonResponse(
        {
          allowed: false,
          code: "DB_CONNECTION_FAILED",
          ...(devMessage && { error: devMessage })
        },
        503
      );
    }
  } catch (err) {
    const devMessage = errorMessageForDev(err);
    return jsonResponse(
      {
        allowed: false,
        code: "DB_CONNECTION_FAILED",
        ...(devMessage && { error: devMessage })
      },
      503
    );
  }
}

import { NextRequest } from "next/server";
import { errorMessageForDev, isDemoMode, jsonResponse } from "@/lib/api";
import {
  applySessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  SESSION_COOKIE_NAME
} from "@/lib/session-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-auth-server";

type SessionPayload = {
  idToken?: string;
};

const shouldLogTiming = process.env.DEBUG_AUTH_TIMING === "true";

export async function GET(request: NextRequest) {
  const start = shouldLogTiming ? Date.now() : 0;
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonResponse({ status: "unauthenticated" }, 401);
    }

    if (shouldLogTiming) {
      console.info(`[auth] GET /api/auth/session in ${Date.now() - start}ms`);
    }
    return jsonResponse({
      status: "authenticated",
      firebase: session.firebase,
      user: session.user
    });
  } catch {
    return jsonResponse({ status: "unauthenticated" }, 401);
  }
}

export async function POST(request: NextRequest) {
  const start = shouldLogTiming ? Date.now() : 0;
  if (isDemoMode()) {
    const response = jsonResponse({ status: "session_set", mode: "demo" });
    applySessionCookie(response, "demo-session");
    return response;
  }

  try {
    const payload = (await request.json()) as SessionPayload;
    const idToken = payload.idToken;
    if (!idToken) {
      return jsonResponse({ message: "idToken is required." }, 400);
    }

    const currentToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (currentToken && currentToken === idToken) {
      return jsonResponse({ status: "session_set" });
    }

    await verifyFirebaseIdToken(idToken);
    const response = jsonResponse({ status: "session_set" });
    applySessionCookie(response, idToken);
    if (shouldLogTiming) {
      console.info(`[auth] POST /api/auth/session in ${Date.now() - start}ms`);
    }
    return response;
  } catch (err) {
    const devMessage = errorMessageForDev(err);
    return jsonResponse(
      {
        message: "Invalid ID token.",
        ...(devMessage && { error: devMessage })
      },
      401
    );
  }
}

export async function DELETE() {
  const response = jsonResponse({ status: "session_cleared" });
  clearSessionCookie(response);
  return response;
}

import { NextRequest } from "next/server";
import { errorMessageForDev, isDemoMode, jsonResponse } from "@/lib/api";
import {
  applySessionCookie,
  clearSessionCookie,
  getSessionFromRequest
} from "@/lib/session-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-auth-server";

type SessionPayload = {
  idToken?: string;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonResponse({ status: "unauthenticated" }, 401);
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

    await verifyFirebaseIdToken(idToken);
    const response = jsonResponse({ status: "session_set" });
    applySessionCookie(response, idToken);
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

import { NextRequest } from "next/server";
import { errorMessageForDev, isDemoMode, jsonResponse } from "@/lib/api";
import { sendFirebaseVerificationEmail, verifyFirebaseIdToken } from "@/lib/firebase-auth-server";
import { getSessionFromRequest } from "@/lib/session-auth";

type VerificationPayload = {
  continueUrl?: string;
};

export async function POST(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse({ message: "Verification email sent (demo mode)." });
  }

  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonResponse({ message: "Unauthorized" }, 401);
    }

    const payload = (await request.json()) as VerificationPayload;
    const verifiedIdentity = await verifyFirebaseIdToken(session.idToken);
    if (verifiedIdentity.emailVerified) {
      return jsonResponse({ message: "Email already verified." });
    }

    await sendFirebaseVerificationEmail(session.idToken, payload.continueUrl);
    return jsonResponse({ message: "Verification email sent." });
  } catch (err) {
    const devMessage = errorMessageForDev(err);
    return jsonResponse(
      {
        message: "Unable to send verification email.",
        ...(devMessage && { error: devMessage })
      },
      500
    );
  }
}

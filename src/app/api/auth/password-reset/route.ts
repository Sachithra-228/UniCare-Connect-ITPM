import { NextRequest } from "next/server";
import { errorMessageForDev, isDemoMode, jsonResponse } from "@/lib/api";
import { sendFirebasePasswordResetEmail } from "@/lib/firebase-auth-server";

type PasswordResetPayload = {
  email?: string;
  continueUrl?: string;
};

export async function POST(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse({ message: "Password reset link sent (demo mode)." });
  }

  const payload = (await request.json()) as PasswordResetPayload;
  const email = payload.email?.trim();

  if (!email) {
    return jsonResponse({ message: "Email is required." }, 400);
  }

  try {
    await sendFirebasePasswordResetEmail(email, payload.continueUrl);
    return jsonResponse({ message: "Password reset link sent." });
  } catch (err) {
    const devMessage = errorMessageForDev(err);
    return jsonResponse(
      {
        message: "Unable to send reset link.",
        ...(devMessage && { error: devMessage })
      },
      500
    );
  }
}

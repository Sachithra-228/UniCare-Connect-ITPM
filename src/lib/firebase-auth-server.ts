type FirebaseLookupUser = {
  localId: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
};

type FirebaseLookupResponse = {
  users?: FirebaseLookupUser[];
};

type FirebaseSignUpResponse = {
  localId: string;
  email?: string;
  idToken: string;
};

type FirebaseErrorPayload = {
  error?: {
    message?: string;
  };
};

export type VerifiedFirebaseIdentity = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

function getFirebaseApiKey() {
  const key = process.env.FIREBASE_WEB_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) {
    throw new Error("FIREBASE_API_KEY_NOT_CONFIGURED");
  }
  return key;
}

async function postIdentityToolkit<TResponse>(path: string, payload: Record<string, unknown>) {
  const apiKey = getFirebaseApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    let message = "IDENTITY_TOOLKIT_REQUEST_FAILED";
    try {
      const errorPayload = (await response.json()) as FirebaseErrorPayload;
      if (errorPayload.error?.message) {
        message = errorPayload.error.message;
      }
    } catch {
      // Keep generic message.
    }
    throw new Error(message);
  }

  return (await response.json()) as TResponse;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseIdentity> {
  const response = await postIdentityToolkit<FirebaseLookupResponse>("accounts:lookup", {
    idToken
  });

  const user = response.users?.[0];
  if (!user) {
    throw new Error("INVALID_ID_TOKEN");
  }

  return {
    uid: user.localId,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    emailVerified: Boolean(user.emailVerified)
  };
}

export async function sendFirebaseVerificationEmail(idToken: string, continueUrl?: string) {
  await postIdentityToolkit("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken,
    continueUrl
  });
}

export async function sendFirebasePasswordResetEmail(email: string, continueUrl?: string) {
  await postIdentityToolkit("accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
    continueUrl
  });
}

export async function createFirebaseUserWithPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<{ uid: string; email: string | null; idToken: string }> {
  const signUpResponse = await postIdentityToolkit<FirebaseSignUpResponse>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true
  });

  if (displayName && signUpResponse.idToken) {
    await postIdentityToolkit("accounts:update", {
      idToken: signUpResponse.idToken,
      displayName,
      returnSecureToken: true
    });
  }

  return {
    uid: signUpResponse.localId,
    email: signUpResponse.email ?? null,
    idToken: signUpResponse.idToken
  };
}

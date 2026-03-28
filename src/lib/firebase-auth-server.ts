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

const VERIFY_CACHE_TTL_MS = 5 * 60 * 1000;
const VERIFY_CACHE_MAX_ENTRIES = 500;
type CachedIdentity = {
  identity: VerifiedFirebaseIdentity;
  expiresAt: number;
};

const verifyCache = new Map<string, CachedIdentity>();
const inflightLookups = new Map<string, Promise<VerifiedFirebaseIdentity>>();

function decodeJwtExpMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = payloadBase64.length % 4 === 0 ? "" : "=".repeat(4 - (payloadBase64.length % 4));
    const payloadJson = Buffer.from(payloadBase64 + padding, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function getCacheExpiry(idToken: string, now: number) {
  const tokenExpMs = decodeJwtExpMs(idToken);
  const tokenBoundedExpiry = tokenExpMs ? Math.max(now + 1000, tokenExpMs - 30_000) : now + VERIFY_CACHE_TTL_MS;
  return Math.min(now + VERIFY_CACHE_TTL_MS, tokenBoundedExpiry);
}

function trimVerifyCacheIfNeeded() {
  while (verifyCache.size > VERIFY_CACHE_MAX_ENTRIES) {
    const oldestKey = verifyCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    verifyCache.delete(oldestKey);
  }
}

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
  const now = Date.now();
  const cached = verifyCache.get(idToken);
  if (cached && cached.expiresAt > now) {
    return cached.identity;
  }
  if (cached) {
    verifyCache.delete(idToken);
  }

  const inflight = inflightLookups.get(idToken);
  if (inflight) {
    return inflight;
  }

  const lookupPromise = (async () => {
    const response = await postIdentityToolkit<FirebaseLookupResponse>("accounts:lookup", {
      idToken
    });

    const user = response.users?.[0];
    if (!user) {
      throw new Error("INVALID_ID_TOKEN");
    }

    const identity: VerifiedFirebaseIdentity = {
      uid: user.localId,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      emailVerified: Boolean(user.emailVerified)
    };

    verifyCache.set(idToken, {
      identity,
      expiresAt: getCacheExpiry(idToken, Date.now())
    });
    trimVerifyCacheIfNeeded();
    return identity;
  })();

  inflightLookups.set(idToken, lookupPromise);
  try {
    return await lookupPromise;
  } finally {
    inflightLookups.delete(idToken);
  }
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

import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { demoUsers } from "@/lib/demo-data";
import { verifyFirebaseIdToken } from "@/lib/firebase-auth-server";
import { getMongoDatabase } from "@/lib/mongodb";
import { UserProfile } from "@/types";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours - cookie expires after 1 day
const USER_CACHE_TTL_MS = 30 * 1000;
const USER_CACHE_MAX_ENTRIES = 500;

type DbUserDocument = {
  _id: { toString: () => string };
  email: string;
  name: string;
  role: UserProfile["role"] | string;
  university?: string;
  contact?: string;
  roleDetails?: Record<string, string>;
  needsProfileCompletion?: boolean;
  firebaseUid?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  status?: string;
  subscription?: {
    plan?: string;
    status?: string;
    trialEndsAt?: Date | string;
  };
};

type CachedUser = {
  user: UserProfile | null;
  expiresAt: number;
};

const sessionUserCache = new Map<string, CachedUser>();

function buildSessionCacheKey(identity: { uid: string; email: string | null }) {
  return `${identity.uid}:${identity.email?.toLowerCase() ?? ""}`;
}

function getCachedSessionUser(identity: { uid: string; email: string | null }) {
  const key = buildSessionCacheKey(identity);
  const now = Date.now();
  const cached = sessionUserCache.get(key);
  if (!cached) return undefined;
  if (cached.expiresAt <= now) {
    sessionUserCache.delete(key);
    return undefined;
  }
  return cached;
}

function setCachedSessionUser(identity: { uid: string; email: string | null }, user: UserProfile | null) {
  const key = buildSessionCacheKey(identity);
  sessionUserCache.set(key, {
    user,
    expiresAt: Date.now() + USER_CACHE_TTL_MS
  });

  while (sessionUserCache.size > USER_CACHE_MAX_ENTRIES) {
    const oldestKey = sessionUserCache.keys().next().value;
    if (!oldestKey) break;
    sessionUserCache.delete(oldestKey);
  }
}

export function invalidateSessionUserCache(identity?: { uid?: string; email?: string | null }) {
  if (!identity?.uid && !identity?.email) {
    sessionUserCache.clear();
    return;
  }

  for (const key of sessionUserCache.keys()) {
    const [uid, email] = key.split(":", 2);
    const uidMatches = identity.uid ? uid === identity.uid : true;
    const emailMatches = identity.email ? email === identity.email.toLowerCase() : true;
    if (uidMatches && emailMatches) {
      sessionUserCache.delete(key);
    }
  }
}

function mapUserDocument(document: DbUserDocument): UserProfile {
  return {
    _id: document._id.toString(),
    email: document.email,
    name: document.name,
    role: document.role as UserProfile["role"],
    university: document.university,
    contact: document.contact,
    roleDetails: document.roleDetails,
    needsProfileCompletion: document.needsProfileCompletion,
    firebaseUid: document.firebaseUid,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    isDeleted: document.isDeleted,
    status: document.status as UserProfile["status"],
    subscription: document.subscription
      ? {
          plan: document.subscription.plan,
          status: document.subscription.status as UserProfile["subscription"] extends infer T
            ? T extends { status?: infer S }
              ? S
              : never
            : never,
          trialEndsAt: document.subscription.trialEndsAt
        }
      : undefined
  };
}

export function applySessionCookie(response: NextResponse, idToken: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: idToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/"
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}

export async function getSessionFromRequest(request: NextRequest) {
  if (isDemoMode()) {
    return {
      idToken: "demo-session",
      firebase: {
        uid: demoUsers[0]?._id ?? "demo-user",
        email: demoUsers[0]?.email ?? null,
        displayName: demoUsers[0]?.name ?? null,
        emailVerified: true
      },
      user: demoUsers[0] ?? null
    };
  }

  const idToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!idToken) {
    return null;
  }

  const firebase = await verifyFirebaseIdToken(idToken);

  if (!process.env.MONGODB_URI) {
    return { idToken, firebase, user: null };
  }

  const cachedUser = getCachedSessionUser(firebase);
  if (cachedUser) {
    return { idToken, firebase, user: cachedUser.user };
  }

  try {
    const database = await getMongoDatabase();
    const usersCollection = database.collection<DbUserDocument>("users");
    const userDocument =
      (await usersCollection.findOne({ firebaseUid: firebase.uid })) ??
      (firebase.email ? await usersCollection.findOne({ email: firebase.email }) : null);

    const user = userDocument ? mapUserDocument(userDocument) : null;
    setCachedSessionUser(firebase, user);

    return {
      idToken,
      firebase,
      user
    };
  } catch {
    return {
      idToken,
      firebase,
      user: null
    };
  }
}

export async function requireSession(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return { error: jsonResponse({ message: "Unauthorized" }, 401) };
    }
    return { session };
  } catch {
    return { error: jsonResponse({ message: "Unauthorized" }, 401) };
  }
}

export function requireRole(
  role: string | undefined,
  allowedRoles: string[]
): NextResponse | null {
  if (!role || !allowedRoles.includes(role)) {
    return jsonResponse({ message: "Forbidden" }, 403);
  }
  return null;
}

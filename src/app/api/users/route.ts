import { NextRequest } from "next/server";
import { WithId, ObjectId } from "mongodb";
import { demoUsers } from "@/lib/demo-data";
import { errorMessageForDev, isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase, isMongoTlsHandshakeError, resetMongoClient } from "@/lib/mongodb";
import { invalidateSessionUserCache, requireRole, requireSession } from "@/lib/session-auth";
import { isValidFullName } from "@/lib/validation";
import { UserRole } from "@/types";

const shouldLogTiming = process.env.DEBUG_AUTH_TIMING === "true";

type UserPayload = {
  firebaseUid?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  university?: string;
  contact?: string;
  profilePic?: string;
  roleDetails?: Record<string, string>;
  needsProfileCompletion?: boolean;
  status?: "active" | "blocked" | "pending";
  isDeleted?: boolean;
  deletedAt?: Date | string;
  subscription?: {
    plan?: string;
    status?: "trialing" | "active" | "blocked" | "expired";
    trialEndsAt?: Date | string;
  };
};

type DbUserDocument = {
  _id: ObjectId;
  firebaseUid?: string;
  email: string;
  name: string;
  role: UserRole;
  university?: string;
  contact?: string;
  profilePic?: string;
  roleDetails?: Record<string, string>;
  needsProfileCompletion?: boolean;
  status?: "active" | "blocked" | "pending";
  isDeleted?: boolean;
  deletedAt?: Date | string;
  subscription?: {
    plan?: string;
    status?: "trialing" | "active" | "blocked" | "expired";
    trialEndsAt?: Date | string;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

type DbUserInput = Omit<DbUserDocument, "_id">;

function fallbackNameFromEmail(email?: string) {
  if (!email) return "User";
  const localPart = email.split("@")[0] ?? "";
  const candidate = localPart
    .replace(/[._-]+/g, " ")
    .replace(/[0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return candidate && isValidFullName(candidate) ? candidate : "User";
}

function mapUserDocument(document: WithId<DbUserInput>) {
  return {
    _id: document._id.toString(),
    email: document.email,
    name: document.name,
    role: document.role,
    university: document.university,
    contact: document.contact,
    profilePic: document.profilePic,
    roleDetails: document.roleDetails,
    needsProfileCompletion: document.needsProfileCompletion,
    firebaseUid: document.firebaseUid,
    status: document.status,
    isDeleted: document.isDeleted,
    deletedAt: document.deletedAt,
    subscription: document.subscription,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse(demoUsers);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const isAdmin = ["admin", "faculty", "super_admin"].includes(authResult.session.user?.role ?? "");

  try {
    const database = await getMongoDatabase();
    const usersCollection = database.collection<DbUserInput>("users");
    const email = request.nextUrl.searchParams.get("email")?.toLowerCase();
    const firebaseUid = request.nextUrl.searchParams.get("firebaseUid");
    const roleParam = request.nextUrl.searchParams.get("role");

    const rolesParam = request.nextUrl.searchParams.get("roles");

    if (firebaseUid) {
      if (!isAdmin && firebaseUid !== authResult.session.firebase.uid) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const user = await usersCollection.findOne({ firebaseUid });
      if (!user) {
        return jsonResponse({ message: "User not found" }, 404);
      }
      return jsonResponse({ user: mapUserDocument(user) });
    }

    if (email) {
      if (!isAdmin && email !== (authResult.session.firebase.email ?? "").toLowerCase()) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return jsonResponse({ message: "User not found" }, 404);
      }
      return jsonResponse({ user: mapUserDocument(user) });
    }

    // Allow NGO users to search for partners (admins, faculty, donors)
    const isNgo = authResult.session.user?.role === "ngo";
    const requestedRoles = rolesParam ? rolesParam.split(",") : roleParam ? [roleParam] : null;
    const isPartnerSearch = isNgo && requestedRoles && requestedRoles.every(r => ["admin", "faculty", "donor"].includes(r));

    if (!isAdmin && !isPartnerSearch) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }

    const filter: any = {};
    if (requestedRoles) {
      filter.role = { $in: requestedRoles };
    }

    const users = await usersCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return jsonResponse(users.map(mapUserDocument));

  } catch (err) {
    if (isMongoTlsHandshakeError(err)) {
      resetMongoClient();
    }
    const devMessage = errorMessageForDev(err);
    return jsonResponse(
      {
        message: "Database is currently unavailable. Please try again.",
        code: "DB_CONNECTION_FAILED",
        ...(devMessage && { error: devMessage })
      },
      503
    );
  }
}

export async function POST(request: NextRequest) {
  const start = shouldLogTiming ? Date.now() : 0;
  const payload = (await request.json()) as UserPayload;
  const rawName = typeof payload.name === "string" ? payload.name : "";
  const normalizedName = rawName.trim().replace(/\s+/g, " ");
  const safeName = normalizedName && isValidFullName(normalizedName) ? normalizedName : undefined;

  if (isDemoMode()) {
    if (!payload.email) {
      return jsonResponse({ message: "Email is required." }, 400);
    }

    return jsonResponse(
      {
        message: "User created (demo mode)",
        user: {
          _id: payload.firebaseUid ?? `demo-${Date.now()}`,
          email: payload.email,
          name: safeName ?? fallbackNameFromEmail(payload.email),
          role: payload.role ?? "student",
          university: payload.university,
          contact: payload.contact,
          roleDetails: payload.roleDetails ?? {},
          firebaseUid: payload.firebaseUid,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      201
    );
  }

  if (!payload.email) {
    return jsonResponse({ message: "Email is required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const normalizedEmail = payload.email.toLowerCase();
  const requesterRole = authResult.session.user?.role ?? "";
  const isStaff = ["admin", "faculty", "super_admin"].includes(requesterRole);
  const isPrivileged = ["admin", "super_admin"].includes(requesterRole);
  const isSelfRequest =
    (payload.firebaseUid && payload.firebaseUid === authResult.session.firebase.uid) ||
    normalizedEmail === (authResult.session.firebase.email ?? "").toLowerCase();

  if (!isStaff && !isSelfRequest) {
    return jsonResponse({ message: "Forbidden" }, 403);
  }

  try {
    const dbStart = shouldLogTiming ? Date.now() : 0;
    const database = await getMongoDatabase();
    if (shouldLogTiming) {
      console.info(`[users] getMongoDatabase in ${Date.now() - dbStart}ms`);
    }
    const usersCollection = database.collection<DbUserInput>("users");
    const now = new Date();

    const filter = payload.firebaseUid ? { firebaseUid: payload.firebaseUid } : { email: normalizedEmail };
    const matchPath = payload.firebaseUid ? "firebaseUid" : "email";
    const existingUser = await usersCollection.findOne(filter);
    if (shouldLogTiming) {
      console.info(`[users] match=${matchPath} existing=${existingUser ? "yes" : "no"}`);
    }
    const isSelf =
      (payload.firebaseUid && payload.firebaseUid === authResult.session.firebase.uid) ||
      normalizedEmail === (authResult.session.firebase.email ?? "").toLowerCase();

    const validRoles: UserRole[] = [
      "student",
      "faculty",
      "mentor",
      "donor",
      "admin",
      "super_admin",
      "employer",
      "ngo",
      "parent"
    ];
    const rawRole = payload.role ? String(payload.role).toLowerCase() : null;
    const payloadRole =
      rawRole && validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : null;

    const privilegedRoles = new Set<UserRole>(["admin", "super_admin"]);
    const isPrivilegedRole = payloadRole != null && privilegedRoles.has(payloadRole);
    // Non-privileged users can never set admin/super_admin, even for themselves.
    const canApplyRole =
      payloadRole != null &&
      (isPrivileged || (!isPrivilegedRole && (isSelf || !existingUser)));
    // Always prefer payload role for allowed self-request/new-user; otherwise new user -> student, existing user -> leave unchanged.
    const roleFromPayload = canApplyRole ? payloadRole : undefined;
    const roleToSet = roleFromPayload ?? (!existingUser ? "student" : undefined);
    const isNewUserWithoutRole = !existingUser && payloadRole == null;
    const completingProfile = isSelf && (payloadRole != null || (payload.roleDetails && Object.keys(payload.roleDetails).length > 0));

    const setFields: Partial<DbUserInput> & { updatedAt: Date } = {
      updatedAt: now,
      email: normalizedEmail,
      name: safeName ?? fallbackNameFromEmail(normalizedEmail),
      ...(roleToSet != null && { role: roleToSet }),
      firebaseUid: payload.firebaseUid,
      university: payload.university,
      contact: payload.contact,
      ...(isNewUserWithoutRole && { needsProfileCompletion: true }),
      ...(completingProfile && { needsProfileCompletion: false })
    };

    if (safeName) setFields.name = safeName;
    if (roleToSet != null) setFields.role = roleToSet;
    if (payload.university) setFields.university = payload.university;
    if (payload.contact) setFields.contact = payload.contact;
    if (payload.profilePic !== undefined && isSelf) setFields.profilePic = payload.profilePic;
    if (payload.roleDetails) setFields.roleDetails = payload.roleDetails;
    if (payload.needsProfileCompletion === false) setFields.needsProfileCompletion = false;
    if (isPrivileged && payload.status) setFields.status = payload.status;
    if (isPrivileged && typeof payload.isDeleted === "boolean") setFields.isDeleted = payload.isDeleted;
    if (isPrivileged && payload.deletedAt) setFields.deletedAt = payload.deletedAt;
    if (isPrivileged && payload.subscription) setFields.subscription = payload.subscription;

    const normalizeForCompare = (value: unknown) => {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "object") return JSON.stringify(value ?? null);
      return value;
    };

    const { updatedAt: _updatedAt, ...compareFields } = setFields;
    const changedFields: string[] = [];
    if (existingUser) {
      for (const [key, nextValue] of Object.entries(compareFields)) {
        if (nextValue === undefined) continue;
        const prevValue = (existingUser as Record<string, unknown>)[key];
        if (normalizeForCompare(prevValue) !== normalizeForCompare(nextValue)) {
          changedFields.push(key);
        }
      }
    }
    const shouldSkipUpdate = existingUser && changedFields.length === 0;
    if (shouldLogTiming) {
      console.info(
        `[users] changes=${changedFields.length ? changedFields.join(",") : "none"} skip=${
          shouldSkipUpdate ? "yes" : "no"
        }`
      );
    }
    if (shouldSkipUpdate) {
      const syncedUser = mapUserDocument(existingUser);
      invalidateSessionUserCache({
        uid: syncedUser.firebaseUid,
        email: syncedUser.email
      });
      if (shouldLogTiming) {
        console.info(`[users] skip update; POST /api/users total in ${Date.now() - start}ms`);
      }
      return jsonResponse({ message: "User synced", user: syncedUser }, 201);
    }

    // No path may appear in both $set and $setOnInsert (MongoDB conflict). Use $setOnInsert only for
    // insert-only defaults; everything else goes in $set.
    const update: {
      $set: Partial<DbUserInput> & { updatedAt: Date };
      $setOnInsert: Pick<DbUserInput, "createdAt" | "status" | "isDeleted" | "subscription">;
    } = {
      $set: setFields,
      $setOnInsert: {
        createdAt: now,
        status: "active",
        isDeleted: false,
        subscription: {
          plan: "trial",
          status: "trialing",
          trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
      }
    };

    const upsertStart = shouldLogTiming ? Date.now() : 0;
    const result = await usersCollection.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: "after"
    });
    if (shouldLogTiming) {
      console.info(`[users] findOneAndUpdate in ${Date.now() - upsertStart}ms`);
    }

    if (!result) {
      return jsonResponse({ message: "Unable to sync user." }, 500);
    }

    const syncedUser = mapUserDocument(result);
    invalidateSessionUserCache({
      uid: syncedUser.firebaseUid,
      email: syncedUser.email
    });

    if (shouldLogTiming) {
      console.info(`[users] POST /api/users total in ${Date.now() - start}ms`);
    }
    return jsonResponse({ message: "User synced", user: syncedUser }, 201);
  } catch (err) {
    console.error("[POST /api/users] MongoDB error:", err instanceof Error ? err.message : err);
    if (isMongoTlsHandshakeError(err)) {
      resetMongoClient();
    }
    const devMessage = errorMessageForDev(err);
    return jsonResponse(
      {
        message: "Database is currently unavailable. Please try again.",
        code: "DB_CONNECTION_FAILED",
        ...(devMessage && { error: devMessage })
      },
      503
    );
  }
}

export async function PUT(request: NextRequest) {
  const payload = (await request.json()) as { profilePic?: string };

  if (isDemoMode()) {
    return jsonResponse({ message: "Profile picture updated (demo mode)", profilePic: payload.profilePic ?? null });
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const uid = authResult.session.firebase?.uid;
  if (!uid) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  try {
    const database = await getMongoDatabase();
    const usersCollection = database.collection<DbUserInput>("users");
    const now = new Date();
    const nextProfilePic = payload.profilePic ?? "";
    const result = await usersCollection.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { profilePic: nextProfilePic, updatedAt: now } },
      { returnDocument: "after" }
    );
    if (!result) {
      return jsonResponse({ message: "User not found" }, 404);
    }
    const updatedUser = mapUserDocument(result);
    invalidateSessionUserCache({
      uid: updatedUser.firebaseUid,
      email: updatedUser.email
    });
    return jsonResponse({ message: "Profile picture updated", user: updatedUser });
  } catch (err) {
    console.error("[PUT /api/users] MongoDB error:", err instanceof Error ? err.message : err);
    if (isMongoTlsHandshakeError(err)) {
      resetMongoClient();
    }
    const devMessage = errorMessageForDev(err);
    return jsonResponse(
      {
        message: "Database is currently unavailable. Please try again.",
        code: "DB_CONNECTION_FAILED",
        ...(devMessage && { error: devMessage })
      },
      503
    );
  }
}


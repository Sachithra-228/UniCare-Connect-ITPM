import { NextRequest } from "next/server";
import { WithId, ObjectId } from "mongodb";
import { demoUsers } from "@/lib/demo-data";
import { errorMessageForDev, isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";
import { UserRole } from "@/types";

type UserPayload = {
  firebaseUid?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  university?: string;
  contact?: string;
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

function mapUserDocument(document: WithId<DbUserInput>) {
  return {
    _id: document._id.toString(),
    email: document.email,
    name: document.name,
    role: document.role,
    university: document.university,
    contact: document.contact,
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

  const isAdmin = ["admin", "super_admin"].includes(authResult.session.user?.role ?? "");

  try {
    const database = await getMongoDatabase();
    const usersCollection = database.collection<DbUserInput>("users");
    const email = request.nextUrl.searchParams.get("email")?.toLowerCase();
    const firebaseUid = request.nextUrl.searchParams.get("firebaseUid");

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

    const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
    if (roleCheck) {
      return roleCheck;
    }

    const users = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return jsonResponse(users.map(mapUserDocument));
  } catch (err) {
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
  const payload = (await request.json()) as UserPayload;

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
          name: payload.name ?? payload.email.split("@")[0] ?? "User",
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
  const isPrivileged = ["admin", "super_admin"].includes(requesterRole);
  const isSelfRequest =
    (payload.firebaseUid && payload.firebaseUid === authResult.session.firebase.uid) ||
    normalizedEmail === (authResult.session.firebase.email ?? "").toLowerCase();

  if (!isPrivileged && !isSelfRequest) {
    return jsonResponse({ message: "Forbidden" }, 403);
  }

  try {
    const database = await getMongoDatabase();
    const usersCollection = database.collection<DbUserInput>("users");
    const now = new Date();

    const filter = payload.firebaseUid ? { firebaseUid: payload.firebaseUid } : { email: normalizedEmail };
    const existingUser = await usersCollection.findOne(filter);
    const isSelf =
      (payload.firebaseUid && payload.firebaseUid === authResult.session.firebase.uid) ||
      normalizedEmail === (authResult.session.firebase.email ?? "").toLowerCase();

    const validRoles: UserRole[] = [
      "student",
      "mentor",
      "donor",
      "admin",
      "super_admin",
      "employer",
      "ngo",
      "parent"
    ];
    const rawRole = payload.role != null && payload.role !== "" ? String(payload.role).toLowerCase() : null;
    const payloadRole =
      rawRole && validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : null;

    // Always prefer payload role for self-request; otherwise new user → student, existing user → leave unchanged.
    const roleFromPayload =
      payloadRole != null
        ? (isPrivileged || !existingUser || isSelf ? payloadRole : undefined)
        : undefined;
    const roleToSet = roleFromPayload ?? (!existingUser ? "student" : undefined);
    const isNewUserWithoutRole = !existingUser && payloadRole == null;
    const completingProfile = isSelf && (payloadRole != null || (payload.roleDetails && Object.keys(payload.roleDetails).length > 0));

    const setFields: Partial<DbUserInput> & { updatedAt: Date } = {
      updatedAt: now,
      email: normalizedEmail,
      name: payload.name ?? normalizedEmail.split("@")[0] ?? "User",
      ...(roleToSet != null && { role: roleToSet }),
      firebaseUid: payload.firebaseUid,
      university: payload.university,
      contact: payload.contact,
      roleDetails: payload.roleDetails ?? {},
      ...(isNewUserWithoutRole && { needsProfileCompletion: true }),
      ...(completingProfile && { needsProfileCompletion: false })
    };

    if (payload.name) setFields.name = payload.name;
    if (roleToSet != null) setFields.role = roleToSet;
    if (payload.university) setFields.university = payload.university;
    if (payload.contact) setFields.contact = payload.contact;
    if (payload.roleDetails) setFields.roleDetails = payload.roleDetails;
    if (payload.needsProfileCompletion === false) setFields.needsProfileCompletion = false;
    if (isPrivileged && payload.status) setFields.status = payload.status;
    if (isPrivileged && typeof payload.isDeleted === "boolean") setFields.isDeleted = payload.isDeleted;
    if (isPrivileged && payload.deletedAt) setFields.deletedAt = payload.deletedAt;
    if (isPrivileged && payload.subscription) setFields.subscription = payload.subscription;

    // No path may appear in both $set and $setOnInsert (MongoDB conflict). Use $setOnInsert only for
    // insert-only defaults; everything else goes in $set.
    const update = {
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

    const result = await usersCollection.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: "after"
    });

    if (!result) {
      return jsonResponse({ message: "Unable to sync user." }, 500);
    }

    return jsonResponse({ message: "User synced", user: mapUserDocument(result) }, 201);
  } catch (err) {
    console.error("[POST /api/users] MongoDB error:", err instanceof Error ? err.message : err);
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

import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";
import type { UserRole } from "@/types";

type VerificationItem = {
  id: string;
  kind: "user" | "aid";
  type: string;
  role: string;
  status: string;
  note: string;
  createdAt: string;
  userId?: string;
  firebaseUid?: string;
  email?: string;
  userRole?: UserRole;
};

const pendingAidStatuses = ["pending", "Pending", "under review", "Under review"];

let demoItems: VerificationItem[] = [
  {
    id: "demo-user-student",
    kind: "user",
    type: "Student enrollment",
    role: "Student",
    status: "Pending",
    note: "Verify enrollment details",
    createdAt: new Date().toISOString(),
    userId: "demo-student-1",
    firebaseUid: "demo-student-1",
    email: "student@unicare.lk",
    userRole: "student"
  },
  {
    id: "demo-user-ngo",
    kind: "user",
    type: "NGO onboarding",
    role: "NGO",
    status: "Documents pending",
    note: "Registration certificate uploaded",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    userId: "demo-ngo-1",
    firebaseUid: "demo-ngo-1",
    email: "ngo@unicare.lk",
    userRole: "ngo"
  },
  {
    id: "demo-aid-1",
    kind: "aid",
    type: "Financial aid application",
    role: "Student",
    status: "Under review",
    note: "Check eligibility and documents",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  }
];

function roleLabel(role?: string) {
  const value = String(role ?? "").toLowerCase();
  if (value === "student") return "Student";
  if (value === "donor") return "Donor";
  if (value === "ngo") return "NGO";
  return "User";
}

function statusLabel(status?: string, needsProfileCompletion?: boolean) {
  const value = String(status ?? "").toLowerCase();
  if (value === "active") return "Verified";
  if (value === "blocked") return "Rejected";
  if (needsProfileCompletion) return "Documents pending";
  if (value === "pending") return "Pending";
  return "Pending";
}

function verificationTypeForRole(role?: string) {
  const value = String(role ?? "").toLowerCase();
  if (value === "student") return "Student enrollment";
  if (value === "donor") return "Donor organization";
  if (value === "ngo") return "NGO onboarding";
  return "Account verification";
}

function userDecisionToStatus(decision: "approve" | "reject") {
  return decision === "approve" ? "active" : "blocked";
}

function profileSectionForRole(role?: UserRole) {
  if (role === "student") return "profile";
  if (role === "donor") return "profile";
  if (role === "ngo") return "profile";
  return "profile";
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "faculty", "super_admin"]);
  if (roleCheck) return roleCheck;

  if (isDemoMode()) {
    return jsonResponse({ items: demoItems });
  }

  try {
    const database = await getMongoDatabase();

    const [users, aidRequests] = await Promise.all([
      database
        .collection("users")
        .find(
          {
            role: { $in: ["student", "donor", "ngo"] },
            isDeleted: { $ne: true },
            $or: [{ status: "pending" }, { needsProfileCompletion: true }]
          },
          {
            projection: {
              _id: 1,
              role: 1,
              status: 1,
              needsProfileCompletion: 1,
              email: 1,
              firebaseUid: 1,
              createdAt: 1
            }
          }
        )
        .sort({ createdAt: -1 })
        .toArray(),
      database
        .collection("aid_requests")
        .find(
          { status: { $in: pendingAidStatuses } },
          { projection: { _id: 1, category: 1, status: 1, amount: 1, createdAt: 1, userId: 1, firebaseUid: 1 } }
        )
        .sort({ createdAt: -1 })
        .toArray()
    ]);

    const userItems: VerificationItem[] = users.map((user) => {
      const userRole = String(user.role ?? "").toLowerCase() as UserRole;
      const status = statusLabel(
        typeof user.status === "string" ? user.status : undefined,
        Boolean(user.needsProfileCompletion)
      );
      const createdAtValue =
        user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString();
      return {
        id: user._id?.toString?.() ?? "",
        kind: "user",
        type: verificationTypeForRole(userRole),
        role: roleLabel(userRole),
        status,
        note:
          status === "Documents pending"
            ? "Waiting for profile/doc completion"
            : "Verify identity and eligibility",
        createdAt: createdAtValue,
        userId: user._id?.toString?.() ?? "",
        firebaseUid: typeof user.firebaseUid === "string" ? user.firebaseUid : undefined,
        email: typeof user.email === "string" ? user.email : undefined,
        userRole
      };
    });

    const aidItems: VerificationItem[] = aidRequests.map((aid) => ({
      id: aid._id?.toString?.() ?? "",
      kind: "aid",
      type: "Financial aid application",
      role: "Student",
      status: String(aid.status ?? "Pending"),
      note: `Category: ${String(aid.category ?? "General")} | Amount: ${String(aid.amount ?? "N/A")}`,
      createdAt:
        aid.createdAt instanceof Date
          ? aid.createdAt.toISOString()
          : typeof aid.createdAt === "string"
            ? aid.createdAt
            : new Date().toISOString(),
      userId: typeof aid.userId === "string" ? aid.userId : undefined,
      firebaseUid: typeof aid.firebaseUid === "string" ? aid.firebaseUid : undefined
    }));

    const items = [...userItems, ...aidItems].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return jsonResponse({ items });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse({ items: demoItems });
    }
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "faculty", "super_admin"]);
  if (roleCheck) return roleCheck;

  const payload = (await request.json().catch(() => ({}))) as {
    kind?: string;
    id?: string;
    decision?: string;
  };
  const kind = String(payload.kind ?? "").toLowerCase();
  const id = String(payload.id ?? "").trim();
  const decision = String(payload.decision ?? "").toLowerCase();

  if (kind !== "user") {
    return jsonResponse({ message: "Only user verification updates are supported here." }, 400);
  }
  if (!id) {
    return jsonResponse({ message: "Verification id is required." }, 400);
  }
  if (decision !== "approve" && decision !== "reject") {
    return jsonResponse({ message: "Decision must be approve or reject." }, 400);
  }

  if (isDemoMode()) {
    demoItems = demoItems.map((item) =>
      item.kind === "user" && item.id === id
        ? {
            ...item,
            status: decision === "approve" ? "Verified" : "Rejected"
          }
        : item
    );
    return jsonResponse({ message: "Verification updated (demo mode)." });
  }

  if (!ObjectId.isValid(id)) {
    return jsonResponse({ message: "Invalid verification id." }, 400);
  }

  const database = await getMongoDatabase();
  const usersCollection = database.collection("users");
  const now = new Date();
  const nextStatus = userDecisionToStatus(decision as "approve" | "reject");

  const updated = await usersCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: nextStatus,
        ...(decision === "approve" ? { needsProfileCompletion: false } : {}),
        updatedAt: now
      }
    },
    {
      projection: { _id: 1, role: 1, firebaseUid: 1, email: 1, name: 1 },
      returnDocument: "after"
    }
  );

  if (!updated) {
    return jsonResponse({ message: "Verification record not found." }, 404);
  }

  const userRole = String(updated.role ?? "") as UserRole;
  const label = verificationTypeForRole(userRole);
  const personName = String(updated.name ?? updated.email ?? "User");
  const statusText = decision === "approve" ? "approved" : "rejected";

  await createNotification(database, {
    userId: updated._id.toString(),
    firebaseUid: typeof updated.firebaseUid === "string" ? updated.firebaseUid : undefined,
    userEmail: typeof updated.email === "string" ? updated.email : undefined,
    title: `${label} ${statusText}`,
    message:
      decision === "approve"
        ? `Your ${label.toLowerCase()} was approved by university admin.`
        : `Your ${label.toLowerCase()} was rejected by university admin.`,
    type: "verification",
    sectionId: profileSectionForRole(userRole)
  });

  await createNotification(database, {
    audienceRoles: ["admin", "faculty", "super_admin"],
    title: "Verification updated",
    message: `${personName} verification was ${statusText}.`,
    type: "verification",
    sectionId: "verifications"
  });

  return jsonResponse({ message: "Verification updated." });
}


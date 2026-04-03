import { NextRequest, NextResponse } from "next/server";
import { jsonResponse } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/session-auth";

export type ParentIdentity = {
  userId: string;
  firebaseUid: string;
  email: string;
  roleDetails: Record<string, unknown>;
  name: string;
};

export async function requireParentIdentity(
  request: NextRequest
): Promise<{ error: NextResponse } | { identity: ParentIdentity }> {
  const authResult = await requireSession(request);
  if (authResult.error) {
    return { error: authResult.error };
  }

  const roleCheck = requireRole(authResult.session.user?.role, ["parent", "super_admin"]);
  if (roleCheck) {
    return { error: roleCheck };
  }

  const userId = String(authResult.session.user?._id ?? "").trim();
  const firebaseUid = String(authResult.session.firebase.uid ?? "").trim();
  const email = String(authResult.session.firebase.email ?? authResult.session.user?.email ?? "")
    .trim()
    .toLowerCase();
  const roleDetails = (authResult.session.user?.roleDetails as Record<string, unknown> | undefined) ?? {};
  const name = String(authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Parent").trim();

  if (!userId && !firebaseUid) {
    return { error: jsonResponse({ message: "Unauthorized" }, 401) };
  }

  return {
    identity: {
      userId,
      firebaseUid,
      email,
      roleDetails,
      name
    }
  };
}

export function buildIdentityClauses(identity: { userId?: string; firebaseUid?: string; email?: string | null }) {
  const clauses: Record<string, unknown>[] = [];
  const userId = String(identity.userId ?? "").trim();
  const firebaseUid = String(identity.firebaseUid ?? "").trim();
  const email = String(identity.email ?? "").trim().toLowerCase();

  if (userId) clauses.push({ userId });
  if (firebaseUid) clauses.push({ firebaseUid });
  if (email) clauses.push({ userEmail: email });
  return clauses;
}

export function buildParentOwnerClauses(identity: {
  userId?: string;
  firebaseUid?: string;
  email?: string | null;
}) {
  const clauses: Record<string, unknown>[] = [];
  const userId = String(identity.userId ?? "").trim();
  const firebaseUid = String(identity.firebaseUid ?? "").trim();
  const email = String(identity.email ?? "").trim().toLowerCase();

  if (userId) clauses.push({ parentUserId: userId });
  if (firebaseUid) clauses.push({ parentFirebaseUid: firebaseUid });
  if (email) clauses.push({ userEmail: email });

  // Backward compatibility for any old rows using generic ownership keys
  if (userId) clauses.push({ userId });
  if (firebaseUid) clauses.push({ firebaseUid });
  return clauses;
}

export function toIsoDate(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return "";
}

export function toStringId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in value) {
    return (value as { toString: () => string }).toString();
  }
  return "";
}

export function normalizeText(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

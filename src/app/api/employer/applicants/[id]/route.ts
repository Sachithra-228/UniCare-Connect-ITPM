import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  deleteDemoEmployerApplicant,
  updateDemoEmployerApplicant,
  type DemoEmployerApplicant
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };
type ApplicantStatus = "new" | "shortlisted" | "interview" | "offered" | "rejected";

type EmployerApplicantDocument = {
  _id?: ObjectId;
  employerUserId?: string;
  employerFirebaseUid?: string;
  jobId?: string;
  jobTitle?: string;
  candidateName?: string;
  candidateEmail?: string;
  university?: string;
  department?: string;
  graduationYear?: string;
  skills?: string[];
  status?: ApplicantStatus;
  note?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toIdentity(session: {
  user?: { _id?: string } | null;
  firebase: { uid?: string };
}) {
  const userId = session.user?._id;
  const firebaseUid = session.firebase.uid;
  return { userId, firebaseUid };
}

function buildOwnerFilter(identity: { userId?: string; firebaseUid?: string }) {
  const clauses: Array<{ employerUserId?: string; employerFirebaseUid?: string }> = [];
  if (identity.userId) clauses.push({ employerUserId: identity.userId });
  if (identity.firebaseUid) clauses.push({ employerFirebaseUid: identity.firebaseUid });
  if (!clauses.length) return null;
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

function normalizeStatus(value: unknown): ApplicantStatus {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "shortlisted") return "shortlisted";
  if (raw === "interview") return "interview";
  if (raw === "offered") return "offered";
  if (raw === "rejected") return "rejected";
  return "new";
}

function normalizeSkills(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  return [] as string[];
}

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function mapDocument(item: EmployerApplicantDocument): DemoEmployerApplicant {
  return {
    _id: item._id?.toString() ?? "",
    employerUserId: item.employerUserId,
    employerFirebaseUid: item.employerFirebaseUid,
    jobId: item.jobId ?? "",
    jobTitle: String(item.jobTitle ?? "General role"),
    candidateName: String(item.candidateName ?? "Candidate"),
    candidateEmail: String(item.candidateEmail ?? ""),
    university: item.university ?? "",
    department: item.department ?? "",
    graduationYear: item.graduationYear ?? "",
    skills: Array.isArray(item.skills) ? item.skills.map((skill) => String(skill)) : [],
    status: normalizeStatus(item.status),
    note: item.note ?? "",
    createdAt: new Date(item.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(item.updatedAt ?? Date.now()).toISOString()
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing applicant id." }, 400);

  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  const patch = {
    jobId: payload.jobId !== undefined ? String(payload.jobId ?? "").trim().slice(0, 80) : undefined,
    jobTitle:
      payload.jobTitle !== undefined ? String(payload.jobTitle ?? "").trim().slice(0, 160) || "General role" : undefined,
    candidateName:
      payload.candidateName !== undefined ? String(payload.candidateName ?? "").trim().slice(0, 140) : undefined,
    candidateEmail:
      payload.candidateEmail !== undefined
        ? String(payload.candidateEmail ?? "").trim().toLowerCase().slice(0, 180)
        : undefined,
    university: payload.university !== undefined ? String(payload.university ?? "").trim().slice(0, 160) : undefined,
    department: payload.department !== undefined ? String(payload.department ?? "").trim().slice(0, 120) : undefined,
    graduationYear:
      payload.graduationYear !== undefined ? String(payload.graduationYear ?? "").trim().slice(0, 20) : undefined,
    skills: payload.skills !== undefined ? normalizeSkills(payload.skills) : undefined,
    status: payload.status !== undefined ? normalizeStatus(payload.status) : undefined,
    note: payload.note !== undefined ? String(payload.note ?? "").trim().slice(0, 500) : undefined
  };

  if (isDemoMode()) {
    const updated = updateDemoEmployerApplicant(identity, id, patch);
    if (!updated) return jsonResponse({ message: "Applicant not found." }, 404);
    return jsonResponse({ message: "Applicant updated.", applicant: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid applicant id." }, 400);

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    Object.entries(patch).forEach(([key, value]) => {
      if (value !== undefined) update[key] = value;
    });
    const updated = await database
      .collection<EmployerApplicantDocument>("employer_applicants")
      .findOneAndUpdate({ _id: objectId, ...ownerFilter }, { $set: update }, { returnDocument: "after" });
    if (!updated) return jsonResponse({ message: "Applicant not found." }, 404);
    return jsonResponse({ message: "Applicant updated.", applicant: mapDocument(updated) });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoEmployerApplicant(identity, id, patch);
      if (!updated) return jsonResponse({ message: "Applicant not found." }, 404);
      return jsonResponse({ message: "Applicant updated.", applicant: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing applicant id." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) {
    const deleted = deleteDemoEmployerApplicant(identity, id);
    if (!deleted) return jsonResponse({ message: "Applicant not found." }, 404);
    return jsonResponse({ message: "Applicant deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid applicant id." }, 400);

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const result = await database
      .collection("employer_applicants")
      .deleteOne({ _id: objectId, ...ownerFilter });
    if (!result.deletedCount) return jsonResponse({ message: "Applicant not found." }, 404);
    return jsonResponse({ message: "Applicant deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const deleted = deleteDemoEmployerApplicant(identity, id);
      if (!deleted) return jsonResponse({ message: "Applicant not found." }, 404);
      return jsonResponse({ message: "Applicant deleted." });
    }
    throw error;
  }
}


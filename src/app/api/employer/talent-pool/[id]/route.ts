import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  deleteDemoEmployerTalent,
  updateDemoEmployerTalent,
  type DemoEmployerTalentProfile
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };
type TalentStatus = "saved" | "contacted" | "in-process";
type ExperienceLevel = "entry" | "intermediate" | "advanced";

type EmployerTalentDocument = {
  _id?: ObjectId;
  employerUserId?: string;
  employerFirebaseUid?: string;
  sourceApplicantId?: string;
  fullName?: string;
  email?: string;
  university?: string;
  department?: string;
  graduationYear?: string;
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  portfolioUrl?: string;
  status?: TalentStatus;
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

function normalizeStatus(value: unknown): TalentStatus {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "contacted") return "contacted";
  if (raw === "in-process") return "in-process";
  return "saved";
}

function normalizeExperience(value: unknown): ExperienceLevel | undefined {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "entry") return "entry";
  if (raw === "intermediate") return "intermediate";
  if (raw === "advanced") return "advanced";
  return undefined;
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

function mapDocument(item: EmployerTalentDocument): DemoEmployerTalentProfile {
  return {
    _id: item._id?.toString() ?? "",
    employerUserId: item.employerUserId,
    employerFirebaseUid: item.employerFirebaseUid,
    sourceApplicantId: item.sourceApplicantId ?? "",
    fullName: String(item.fullName ?? "Candidate"),
    email: String(item.email ?? ""),
    university: item.university ?? "",
    department: item.department ?? "",
    graduationYear: item.graduationYear ?? "",
    skills: Array.isArray(item.skills) ? item.skills.map((skill) => String(skill)) : [],
    experienceLevel: normalizeExperience(item.experienceLevel),
    portfolioUrl: item.portfolioUrl ?? "",
    status: normalizeStatus(item.status),
    note: item.note ?? "",
    createdAt: new Date(item.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(item.updatedAt ?? Date.now()).toISOString()
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing talent profile id." }, 400);
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  const patch = {
    sourceApplicantId:
      payload.sourceApplicantId !== undefined ? String(payload.sourceApplicantId ?? "").trim().slice(0, 80) : undefined,
    fullName: payload.fullName !== undefined ? String(payload.fullName ?? "").trim().slice(0, 140) : undefined,
    email:
      payload.email !== undefined ? String(payload.email ?? "").trim().toLowerCase().slice(0, 180) : undefined,
    university: payload.university !== undefined ? String(payload.university ?? "").trim().slice(0, 160) : undefined,
    department: payload.department !== undefined ? String(payload.department ?? "").trim().slice(0, 120) : undefined,
    graduationYear:
      payload.graduationYear !== undefined ? String(payload.graduationYear ?? "").trim().slice(0, 20) : undefined,
    skills: payload.skills !== undefined ? normalizeSkills(payload.skills) : undefined,
    experienceLevel:
      payload.experienceLevel !== undefined ? normalizeExperience(payload.experienceLevel) : undefined,
    portfolioUrl:
      payload.portfolioUrl !== undefined ? String(payload.portfolioUrl ?? "").trim().slice(0, 300) : undefined,
    status: payload.status !== undefined ? normalizeStatus(payload.status) : undefined,
    note: payload.note !== undefined ? String(payload.note ?? "").trim().slice(0, 500) : undefined
  };

  if (isDemoMode()) {
    const updated = updateDemoEmployerTalent(identity, id, patch);
    if (!updated) return jsonResponse({ message: "Talent profile not found." }, 404);
    return jsonResponse({ message: "Talent profile updated.", talent: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid talent profile id." }, 400);

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    Object.entries(patch).forEach(([key, value]) => {
      if (value !== undefined) update[key] = value;
    });
    const updated = await database
      .collection<EmployerTalentDocument>("employer_talent_pool")
      .findOneAndUpdate({ _id: objectId, ...ownerFilter }, { $set: update }, { returnDocument: "after" });
    if (!updated) return jsonResponse({ message: "Talent profile not found." }, 404);
    return jsonResponse({ message: "Talent profile updated.", talent: mapDocument(updated) });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoEmployerTalent(identity, id, patch);
      if (!updated) return jsonResponse({ message: "Talent profile not found." }, 404);
      return jsonResponse({ message: "Talent profile updated.", talent: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing talent profile id." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) {
    const deleted = deleteDemoEmployerTalent(identity, id);
    if (!deleted) return jsonResponse({ message: "Talent profile not found." }, 404);
    return jsonResponse({ message: "Talent profile deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid talent profile id." }, 400);
  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const result = await database
      .collection("employer_talent_pool")
      .deleteOne({ _id: objectId, ...ownerFilter });
    if (!result.deletedCount) return jsonResponse({ message: "Talent profile not found." }, 404);
    return jsonResponse({ message: "Talent profile deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const deleted = deleteDemoEmployerTalent(identity, id);
      if (!deleted) return jsonResponse({ message: "Talent profile not found." }, 404);
      return jsonResponse({ message: "Talent profile deleted." });
    }
    throw error;
  }
}


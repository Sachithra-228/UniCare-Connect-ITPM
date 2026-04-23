import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  createDemoEmployerTalent,
  listDemoEmployerTalent,
  type DemoEmployerTalentProfile
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

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

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) return jsonResponse(listDemoEmployerTalent(identity));

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse([], 200);

  try {
    const database = await getMongoDatabase();
    const rows = await database
      .collection<EmployerTalentDocument>("employer_talent_pool")
      .find(ownerFilter)
      .sort({ createdAt: -1 })
      .toArray();
    return jsonResponse(rows.map(mapDocument));
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(listDemoEmployerTalent(identity));
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  const fullName = String(payload.fullName ?? "").trim().slice(0, 140);
  const email = String(payload.email ?? "").trim().toLowerCase().slice(0, 180);
  if (!fullName || !email) {
    return jsonResponse({ message: "Full name and email are required." }, 400);
  }

  const input = {
    sourceApplicantId: String(payload.sourceApplicantId ?? "").trim().slice(0, 80),
    fullName,
    email,
    university: String(payload.university ?? "").trim().slice(0, 160),
    department: String(payload.department ?? "").trim().slice(0, 120),
    graduationYear: String(payload.graduationYear ?? "").trim().slice(0, 20),
    skills: normalizeSkills(payload.skills),
    experienceLevel: normalizeExperience(payload.experienceLevel),
    portfolioUrl: String(payload.portfolioUrl ?? "").trim().slice(0, 300),
    status: normalizeStatus(payload.status),
    note: String(payload.note ?? "").trim().slice(0, 500)
  };

  if (isDemoMode()) {
    const created = createDemoEmployerTalent(identity, input);
    return jsonResponse({ message: "Talent profile saved.", talent: created }, 201);
  }

  try {
    const database = await getMongoDatabase();
    const ownerFilter = buildOwnerFilter(identity);
    if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

    const existing = await database
      .collection<EmployerTalentDocument>("employer_talent_pool")
      .findOne({ ...ownerFilter, email });
    if (existing) {
      return jsonResponse({ message: "This candidate already exists in your talent pool." }, 409);
    }

    const now = new Date();
    const document: EmployerTalentDocument = {
      employerUserId: identity.userId,
      employerFirebaseUid: identity.firebaseUid,
      ...input,
      createdAt: now,
      updatedAt: now
    };
    const result = await database.collection("employer_talent_pool").insertOne(document);
    return jsonResponse(
      { message: "Talent profile saved.", talent: mapDocument({ ...document, _id: result.insertedId }) },
      201
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const created = createDemoEmployerTalent(identity, input);
      return jsonResponse({ message: "Talent profile saved.", talent: created }, 201);
    }
    throw error;
  }
}


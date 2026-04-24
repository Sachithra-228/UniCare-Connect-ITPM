import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  createDemoEmployerApplicant,
  listDemoEmployerApplicants,
  type DemoEmployerApplicant
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

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

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;

  const identity = toIdentity(authResult.session);
  if (isDemoMode()) {
    return jsonResponse(listDemoEmployerApplicants(identity));
  }

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse([], 200);

  try {
    const database = await getMongoDatabase();
    const rows = await database
      .collection<EmployerApplicantDocument>("employer_applicants")
      .find(ownerFilter)
      .sort({ createdAt: -1 })
      .toArray();
    return jsonResponse(rows.map(mapDocument));
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(listDemoEmployerApplicants(identity));
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

  const candidateName = String(payload.candidateName ?? "").trim().slice(0, 140);
  const candidateEmail = String(payload.candidateEmail ?? "").trim().toLowerCase().slice(0, 180);
  const jobTitle = String(payload.jobTitle ?? "").trim().slice(0, 160);

  if (!candidateName || !candidateEmail) {
    return jsonResponse({ message: "Candidate name and email are required." }, 400);
  }

  const input = {
    jobId: String(payload.jobId ?? "").trim().slice(0, 80),
    jobTitle: jobTitle || "General role",
    candidateName,
    candidateEmail,
    university: String(payload.university ?? "").trim().slice(0, 160),
    department: String(payload.department ?? "").trim().slice(0, 120),
    graduationYear: String(payload.graduationYear ?? "").trim().slice(0, 20),
    skills: normalizeSkills(payload.skills),
    status: normalizeStatus(payload.status),
    note: String(payload.note ?? "").trim().slice(0, 500)
  };

  if (isDemoMode()) {
    const created = createDemoEmployerApplicant(identity, input);
    return jsonResponse({ message: "Applicant added.", applicant: created }, 201);
  }

  try {
    const database = await getMongoDatabase();
    const now = new Date();
    const document: EmployerApplicantDocument = {
      employerUserId: identity.userId,
      employerFirebaseUid: identity.firebaseUid,
      ...input,
      createdAt: now,
      updatedAt: now
    };
    const result = await database.collection("employer_applicants").insertOne(document);
    return jsonResponse(
      { message: "Applicant added.", applicant: mapDocument({ ...document, _id: result.insertedId }) },
      201
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const created = createDemoEmployerApplicant(identity, input);
      return jsonResponse({ message: "Applicant added.", applicant: created }, 201);
    }
    throw error;
  }
}

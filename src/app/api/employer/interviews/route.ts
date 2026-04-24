import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  createDemoEmployerInterview,
  listDemoEmployerInterviews,
  type DemoEmployerInterview
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type InterviewStatus = "scheduled" | "completed" | "cancelled";
type InterviewMode = "virtual" | "on-site" | "phone";

type EmployerInterviewDocument = {
  _id?: ObjectId;
  employerUserId?: string;
  employerFirebaseUid?: string;
  applicantId?: string;
  candidateName?: string;
  candidateEmail?: string;
  jobId?: string;
  jobTitle?: string;
  interviewDate?: string;
  interviewTime?: string;
  mode?: InterviewMode;
  locationOrLink?: string;
  instructions?: string;
  status?: InterviewStatus;
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

function normalizeStatus(value: unknown): InterviewStatus {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "completed") return "completed";
  if (raw === "cancelled") return "cancelled";
  return "scheduled";
}

function normalizeMode(value: unknown): InterviewMode {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "on-site") return "on-site";
  if (raw === "phone") return "phone";
  return "virtual";
}

function mapDocument(item: EmployerInterviewDocument): DemoEmployerInterview {
  return {
    _id: item._id?.toString() ?? "",
    employerUserId: item.employerUserId,
    employerFirebaseUid: item.employerFirebaseUid,
    applicantId: item.applicantId ?? "",
    candidateName: String(item.candidateName ?? "Candidate"),
    candidateEmail: item.candidateEmail ?? "",
    jobId: item.jobId ?? "",
    jobTitle: item.jobTitle ?? "",
    interviewDate: String(item.interviewDate ?? ""),
    interviewTime: String(item.interviewTime ?? ""),
    mode: normalizeMode(item.mode),
    locationOrLink: item.locationOrLink ?? "",
    instructions: item.instructions ?? "",
    status: normalizeStatus(item.status),
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

  if (isDemoMode()) return jsonResponse(listDemoEmployerInterviews(identity));

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse([], 200);

  try {
    const database = await getMongoDatabase();
    const rows = await database
      .collection<EmployerInterviewDocument>("employer_interviews")
      .find(ownerFilter)
      .sort({ interviewDate: 1, interviewTime: 1, createdAt: -1 })
      .toArray();
    return jsonResponse(rows.map(mapDocument));
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(listDemoEmployerInterviews(identity));
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
  const interviewDate = String(payload.interviewDate ?? "").trim().slice(0, 20);
  const interviewTime = String(payload.interviewTime ?? "").trim().slice(0, 20);

  if (!candidateName || !interviewDate || !interviewTime) {
    return jsonResponse(
      { message: "Candidate name, interview date, and interview time are required." },
      400
    );
  }

  const input = {
    applicantId: String(payload.applicantId ?? "").trim().slice(0, 80),
    candidateName,
    candidateEmail: String(payload.candidateEmail ?? "").trim().toLowerCase().slice(0, 180),
    jobId: String(payload.jobId ?? "").trim().slice(0, 80),
    jobTitle: String(payload.jobTitle ?? "").trim().slice(0, 160),
    interviewDate,
    interviewTime,
    mode: normalizeMode(payload.mode),
    locationOrLink: String(payload.locationOrLink ?? "").trim().slice(0, 300),
    instructions: String(payload.instructions ?? "").trim().slice(0, 1000),
    status: normalizeStatus(payload.status)
  };

  if (isDemoMode()) {
    const created = createDemoEmployerInterview(identity, input);
    return jsonResponse({ message: "Interview scheduled.", interview: created }, 201);
  }

  try {
    const database = await getMongoDatabase();
    const now = new Date();
    const document: EmployerInterviewDocument = {
      employerUserId: identity.userId,
      employerFirebaseUid: identity.firebaseUid,
      ...input,
      createdAt: now,
      updatedAt: now
    };
    const result = await database.collection("employer_interviews").insertOne(document);
    return jsonResponse(
      { message: "Interview scheduled.", interview: mapDocument({ ...document, _id: result.insertedId }) },
      201
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const created = createDemoEmployerInterview(identity, input);
      return jsonResponse({ message: "Interview scheduled.", interview: created }, 201);
    }
    throw error;
  }
}


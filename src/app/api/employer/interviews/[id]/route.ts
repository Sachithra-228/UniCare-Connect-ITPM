import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  deleteDemoEmployerInterview,
  updateDemoEmployerInterview,
  type DemoEmployerInterview
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };
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

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing interview id." }, 400);
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  const patch = {
    applicantId: payload.applicantId !== undefined ? String(payload.applicantId ?? "").trim().slice(0, 80) : undefined,
    candidateName:
      payload.candidateName !== undefined ? String(payload.candidateName ?? "").trim().slice(0, 140) : undefined,
    candidateEmail:
      payload.candidateEmail !== undefined
        ? String(payload.candidateEmail ?? "").trim().toLowerCase().slice(0, 180)
        : undefined,
    jobId: payload.jobId !== undefined ? String(payload.jobId ?? "").trim().slice(0, 80) : undefined,
    jobTitle: payload.jobTitle !== undefined ? String(payload.jobTitle ?? "").trim().slice(0, 160) : undefined,
    interviewDate:
      payload.interviewDate !== undefined ? String(payload.interviewDate ?? "").trim().slice(0, 20) : undefined,
    interviewTime:
      payload.interviewTime !== undefined ? String(payload.interviewTime ?? "").trim().slice(0, 20) : undefined,
    mode: payload.mode !== undefined ? normalizeMode(payload.mode) : undefined,
    locationOrLink:
      payload.locationOrLink !== undefined ? String(payload.locationOrLink ?? "").trim().slice(0, 300) : undefined,
    instructions:
      payload.instructions !== undefined ? String(payload.instructions ?? "").trim().slice(0, 1000) : undefined,
    status: payload.status !== undefined ? normalizeStatus(payload.status) : undefined
  };

  if (isDemoMode()) {
    const updated = updateDemoEmployerInterview(identity, id, patch);
    if (!updated) return jsonResponse({ message: "Interview not found." }, 404);
    return jsonResponse({ message: "Interview updated.", interview: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid interview id." }, 400);
  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    Object.entries(patch).forEach(([key, value]) => {
      if (value !== undefined) update[key] = value;
    });
    const updated = await database
      .collection<EmployerInterviewDocument>("employer_interviews")
      .findOneAndUpdate({ _id: objectId, ...ownerFilter }, { $set: update }, { returnDocument: "after" });
    if (!updated) return jsonResponse({ message: "Interview not found." }, 404);
    return jsonResponse({ message: "Interview updated.", interview: mapDocument(updated) });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoEmployerInterview(identity, id, patch);
      if (!updated) return jsonResponse({ message: "Interview not found." }, 404);
      return jsonResponse({ message: "Interview updated.", interview: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing interview id." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) {
    const deleted = deleteDemoEmployerInterview(identity, id);
    if (!deleted) return jsonResponse({ message: "Interview not found." }, 404);
    return jsonResponse({ message: "Interview deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid interview id." }, 400);
  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const result = await database
      .collection("employer_interviews")
      .deleteOne({ _id: objectId, ...ownerFilter });
    if (!result.deletedCount) return jsonResponse({ message: "Interview not found." }, 404);
    return jsonResponse({ message: "Interview deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const deleted = deleteDemoEmployerInterview(identity, id);
      if (!deleted) return jsonResponse({ message: "Interview not found." }, 404);
      return jsonResponse({ message: "Interview deleted." });
    }
    throw error;
  }
}


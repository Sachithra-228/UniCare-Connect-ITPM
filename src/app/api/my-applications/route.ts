import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  addDemoApplication,
  getDemoMyApplications
} from "@/lib/my-applications-demo-store";
import type {
  ApplicationEntry,
  ApplicationKind,
  ApplicationStatus
} from "@/lib/my-applications-types";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";

type AidRequestDocument = {
  _id?: { toString: () => string };
  category?: string;
  status?: string;
  submittedAt?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  reviewNote?: string | null;
};

type ApplicationRecordDocument = {
  _id?: { toString: () => string };
  kind?: string;
  title?: string;
  organization?: string;
  status?: string;
  submittedAt?: string;
  reviewNote?: string | null;
  source?: string;
  updatedAt?: Date | string;
};

type DocumentRecordDocument = {
  _id?: { toString: () => string };
  name?: string;
  size?: number;
  linkedTo?: string;
  mimeType?: string;
  uploadedAt?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeStatus(value: unknown): ApplicationStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "under review") return "Under review";
  return "Pending";
}

function normalizeKind(value: unknown): Exclude<ApplicationKind, "aid"> | null {
  const kind = String(value ?? "").trim().toLowerCase();
  if (kind === "job") return "job";
  if (kind === "scholarship") return "scholarship";
  return null;
}

function toIsoDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return text.slice(0, 10);
  return new Date(parsed).toISOString().slice(0, 10);
}

function toStringId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toString" in value) return (value as { toString: () => string }).toString();
  return "";
}

function mapAidRequest(item: AidRequestDocument): ApplicationEntry {
  return {
    _id: toStringId(item._id),
    kind: "aid",
    title: String(item.category ?? "Aid request"),
    status: normalizeStatus(item.status),
    submittedAt: toIsoDate(item.submittedAt ?? item.createdAt),
    reviewNote: typeof item.reviewNote === "string" ? item.reviewNote : null,
    source: "Financial Aid"
  };
}

function mapApplicationRecord(item: ApplicationRecordDocument): ApplicationEntry {
  const kind = normalizeKind(item.kind) ?? "job";
  return {
    _id: toStringId(item._id),
    kind,
    title: String(item.title ?? "Application"),
    organization: item.organization ? String(item.organization) : undefined,
    status: normalizeStatus(item.status),
    submittedAt: toIsoDate(item.submittedAt),
    reviewNote: typeof item.reviewNote === "string" ? item.reviewNote : null,
    source: item.source ? String(item.source) : kind === "job" ? "Career" : "Financial Aid"
  };
}

function mapDocumentRecord(item: DocumentRecordDocument) {
  return {
    _id: toStringId(item._id),
    name: String(item.name ?? ""),
    size: Number(item.size ?? 0),
    linkedTo: item.linkedTo ? String(item.linkedTo) : undefined,
    mimeType: item.mimeType ? String(item.mimeType) : undefined,
    uploadedAt: toIsoDate(item.uploadedAt ?? item.createdAt ?? item.updatedAt)
  };
}

function extractFeedback(
  aidRequests: ApplicationEntry[],
  otherApplications: ApplicationEntry[]
) {
  return [
    ...aidRequests
      .filter((item) => item.status === "Rejected" && item.reviewNote)
      .map((item) => ({
        _id: `feedback-aid-${item._id}`,
        kind: item.kind,
        title: item.title,
        status: item.status,
        feedback: item.reviewNote ?? "",
        updatedAt: item.submittedAt
      })),
    ...otherApplications
      .filter((item) => item.status === "Rejected" && item.reviewNote)
      .map((item) => ({
        _id: `feedback-app-${item._id}`,
        kind: item.kind,
        title: item.title,
        status: item.status,
        feedback: item.reviewNote ?? "",
        updatedAt: item.submittedAt
      }))
  ];
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identityClauses = [...(userId ? [{ userId }] : []), ...(firebaseUid ? [{ firebaseUid }] : [])];
  if (!identityClauses.length) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }
  const userFilter = { $or: identityClauses };

  const demoAidRequests: ApplicationEntry[] = [
    {
      _id: "aid-demo-1",
      kind: "aid",
      title: "Emergency academic aid",
      status: "Under review",
      submittedAt: "2026-03-20",
      reviewNote: null,
      source: "Financial Aid"
    },
    {
      _id: "aid-demo-2",
      kind: "aid",
      title: "Equipment support",
      status: "Rejected",
      submittedAt: "2026-03-12",
      reviewNote: "Please attach updated equipment quotation.",
      source: "Financial Aid"
    }
  ];

  if (isDemoMode()) {
    return jsonResponse(getDemoMyApplications({ aidRequests: demoAidRequests, userId, firebaseUid }));
  }

  try {
    const database = await getMongoDatabase();
    const [aidDocs, appDocs, docRecords] = await Promise.all([
      database.collection("aid_requests").find(userFilter).sort({ createdAt: -1 }).toArray(),
      database.collection("my_applications").find(userFilter).sort({ createdAt: -1 }).toArray(),
      database.collection("application_documents").find(userFilter).sort({ createdAt: -1 }).toArray()
    ]);

    const aidRequests = (aidDocs as AidRequestDocument[]).map(mapAidRequest);
    const applicationEntries = (appDocs as ApplicationRecordDocument[]).map(mapApplicationRecord);
    const jobApplications = applicationEntries.filter((item) => item.kind === "job");
    const scholarshipApplications = applicationEntries.filter((item) => item.kind === "scholarship");
    const documents = (docRecords as DocumentRecordDocument[]).map(mapDocumentRecord);
    const feedback = extractFeedback(aidRequests, applicationEntries);

    return jsonResponse({
      aidRequests,
      jobApplications,
      scholarshipApplications,
      documents,
      feedback
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(getDemoMyApplications({ aidRequests: demoAidRequests, userId, firebaseUid }));
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const kind = normalizeKind(payload.kind);
  const title = String(payload.title ?? "").trim().slice(0, 180);
  const organization = String(payload.organization ?? "").trim().slice(0, 140);
  const source = String(payload.source ?? "").trim().slice(0, 80);
  const submittedAt = toIsoDate(payload.submittedAt || new Date().toISOString().slice(0, 10));

  if (!kind || !title) {
    return jsonResponse({ message: "Application type and title are required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const userName = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Student";

  if (isDemoMode()) {
    const created = addDemoApplication({
      userId,
      firebaseUid,
      kind,
      title,
      organization: organization || undefined,
      source: source || undefined,
      submittedAt
    });
    return jsonResponse({ message: "Application logged", application: created }, 201);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  const document = {
    kind,
    title,
    organization: organization || undefined,
    source: source || (kind === "job" ? "Career" : "Financial Aid"),
    status: "Pending",
    submittedAt,
    userId,
    firebaseUid,
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("my_applications").insertOne(document);
  const applicationId = toStringId(result.insertedId);

  await Promise.allSettled([
    createNotification(database, {
      userId,
      firebaseUid,
      title: "Application logged",
      message: `Your ${kind} application "${title}" is now tracked in My Applications.`,
      type: "application",
      sectionId: "my-applications"
    }),
    createNotification(database, {
      audienceRoles: ["admin", "super_admin"],
      title: "Student application update",
      message: `${userName} logged a ${kind} application: ${title}.`,
      type: "application",
      sectionId: kind === "job" ? "career-services" : "financial-oversight"
    })
  ]);

  return jsonResponse(
    {
      message: "Application logged",
      application: {
        _id: applicationId,
        kind,
        title,
        organization: organization || undefined,
        status: "Pending",
        submittedAt,
        source: source || (kind === "job" ? "Career" : "Financial Aid")
      }
    },
    201
  );
}

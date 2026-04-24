import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  createDemoEmployerAnalyticsRecord,
  listDemoEmployerAnalyticsRecords,
  type DemoEmployerAnalyticsRecord
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type AnalyticsStatus = "draft" | "published" | "archived";
type MetricArea = "applications" | "interviews" | "hiring" | "brand" | "general";

type EmployerAnalyticsDocument = {
  _id?: ObjectId;
  employerUserId?: string;
  employerFirebaseUid?: string;
  reportName?: string;
  metricArea?: MetricArea;
  periodStart?: string;
  periodEnd?: string;
  totalViews?: number;
  totalApplications?: number;
  totalInterviews?: number;
  totalOffers?: number;
  totalHires?: number;
  conversionRate?: number;
  note?: string;
  status?: AnalyticsStatus;
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

function normalizeStatus(value: unknown): AnalyticsStatus {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "published") return "published";
  if (raw === "archived") return "archived";
  return "draft";
}

function normalizeMetricArea(value: unknown): MetricArea {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "applications") return "applications";
  if (raw === "interviews") return "interviews";
  if (raw === "hiring") return "hiring";
  if (raw === "brand") return "brand";
  return "general";
}

function normalizeNumber(value: unknown, max = 1000000) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  if (numberValue < 0) return 0;
  return Math.min(max, Math.round(numberValue));
}

function normalizeRate(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  if (numberValue < 0) return 0;
  if (numberValue > 100) return 100;
  return Number(numberValue.toFixed(2));
}

function computeRate(
  views: number,
  applications: number,
  interviews: number,
  offers: number,
  hires: number
) {
  if (views > 0) return normalizeRate((applications / views) * 100);
  if (applications > 0) return normalizeRate((hires / applications) * 100);
  if (interviews > 0) return normalizeRate((offers / interviews) * 100);
  return normalizeRate(hires > 0 ? 100 : 0);
}

function mapDocument(item: EmployerAnalyticsDocument): DemoEmployerAnalyticsRecord {
  const totalViews = normalizeNumber(item.totalViews);
  const totalApplications = normalizeNumber(item.totalApplications);
  const totalInterviews = normalizeNumber(item.totalInterviews);
  const totalOffers = normalizeNumber(item.totalOffers);
  const totalHires = normalizeNumber(item.totalHires);
  const conversionRate =
    item.conversionRate === undefined
      ? computeRate(totalViews, totalApplications, totalInterviews, totalOffers, totalHires)
      : normalizeRate(item.conversionRate);

  return {
    _id: item._id?.toString() ?? "",
    employerUserId: item.employerUserId,
    employerFirebaseUid: item.employerFirebaseUid,
    reportName: String(item.reportName ?? "Analytics snapshot"),
    metricArea: normalizeMetricArea(item.metricArea),
    periodStart: String(item.periodStart ?? ""),
    periodEnd: String(item.periodEnd ?? ""),
    totalViews,
    totalApplications,
    totalInterviews,
    totalOffers,
    totalHires,
    conversionRate,
    note: item.note ?? "",
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

  if (isDemoMode()) return jsonResponse(listDemoEmployerAnalyticsRecords(identity));

  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse([], 200);

  try {
    const database = await getMongoDatabase();
    const rows = await database
      .collection<EmployerAnalyticsDocument>("employer_analytics")
      .find(ownerFilter)
      .sort({ createdAt: -1 })
      .toArray();
    return jsonResponse(rows.map(mapDocument));
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(listDemoEmployerAnalyticsRecords(identity));
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

  const reportName = String(payload.reportName ?? "").trim().slice(0, 180);
  const periodStart = String(payload.periodStart ?? "").trim().slice(0, 20);
  const periodEnd = String(payload.periodEnd ?? "").trim().slice(0, 20);
  if (!reportName || !periodStart || !periodEnd) {
    return jsonResponse({ message: "Report name, period start, and period end are required." }, 400);
  }

  const totalViews = normalizeNumber(payload.totalViews);
  const totalApplications = normalizeNumber(payload.totalApplications);
  const totalInterviews = normalizeNumber(payload.totalInterviews);
  const totalOffers = normalizeNumber(payload.totalOffers);
  const totalHires = normalizeNumber(payload.totalHires);

  const conversionRate =
    payload.conversionRate === undefined
      ? computeRate(totalViews, totalApplications, totalInterviews, totalOffers, totalHires)
      : normalizeRate(payload.conversionRate);

  const input = {
    reportName,
    metricArea: normalizeMetricArea(payload.metricArea),
    periodStart,
    periodEnd,
    totalViews,
    totalApplications,
    totalInterviews,
    totalOffers,
    totalHires,
    conversionRate,
    note: String(payload.note ?? "").trim().slice(0, 1200),
    status: normalizeStatus(payload.status)
  };

  if (isDemoMode()) {
    const created = createDemoEmployerAnalyticsRecord(identity, input);
    return jsonResponse({ message: "Analytics snapshot created.", record: created }, 201);
  }

  try {
    const database = await getMongoDatabase();
    const now = new Date();
    const document: EmployerAnalyticsDocument = {
      employerUserId: identity.userId,
      employerFirebaseUid: identity.firebaseUid,
      ...input,
      createdAt: now,
      updatedAt: now
    };
    const result = await database.collection("employer_analytics").insertOne(document);
    return jsonResponse(
      { message: "Analytics snapshot created.", record: mapDocument({ ...document, _id: result.insertedId }) },
      201
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const created = createDemoEmployerAnalyticsRecord(identity, input);
      return jsonResponse({ message: "Analytics snapshot created.", record: created }, 201);
    }
    throw error;
  }
}

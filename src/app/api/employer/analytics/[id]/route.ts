import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import {
  deleteDemoEmployerAnalyticsRecord,
  updateDemoEmployerAnalyticsRecord,
  type DemoEmployerAnalyticsRecord
} from "@/lib/employer-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type RouteParams = { params: Promise<{ id: string }> };
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

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing analytics record id." }, 400);
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  const nextViews = payload.totalViews !== undefined ? normalizeNumber(payload.totalViews) : undefined;
  const nextApplications =
    payload.totalApplications !== undefined ? normalizeNumber(payload.totalApplications) : undefined;
  const nextInterviews =
    payload.totalInterviews !== undefined ? normalizeNumber(payload.totalInterviews) : undefined;
  const nextOffers = payload.totalOffers !== undefined ? normalizeNumber(payload.totalOffers) : undefined;
  const nextHires = payload.totalHires !== undefined ? normalizeNumber(payload.totalHires) : undefined;

  const patch = {
    reportName:
      payload.reportName !== undefined ? String(payload.reportName ?? "").trim().slice(0, 180) : undefined,
    metricArea: payload.metricArea !== undefined ? normalizeMetricArea(payload.metricArea) : undefined,
    periodStart:
      payload.periodStart !== undefined ? String(payload.periodStart ?? "").trim().slice(0, 20) : undefined,
    periodEnd: payload.periodEnd !== undefined ? String(payload.periodEnd ?? "").trim().slice(0, 20) : undefined,
    totalViews: nextViews,
    totalApplications: nextApplications,
    totalInterviews: nextInterviews,
    totalOffers: nextOffers,
    totalHires: nextHires,
    conversionRate: payload.conversionRate !== undefined ? normalizeRate(payload.conversionRate) : undefined,
    note: payload.note !== undefined ? String(payload.note ?? "").trim().slice(0, 1200) : undefined,
    status: payload.status !== undefined ? normalizeStatus(payload.status) : undefined
  };

  if (isDemoMode()) {
    const updated = updateDemoEmployerAnalyticsRecord(identity, id, patch);
    if (!updated) return jsonResponse({ message: "Analytics record not found." }, 404);
    return jsonResponse({ message: "Analytics record updated.", record: updated });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid analytics record id." }, 400);
  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const update: Record<string, unknown> = { updatedAt: new Date() };
    Object.entries(patch).forEach(([key, value]) => {
      if (value !== undefined) update[key] = value;
    });
    const updated = await database
      .collection<EmployerAnalyticsDocument>("employer_analytics")
      .findOneAndUpdate({ _id: objectId, ...ownerFilter }, { $set: update }, { returnDocument: "after" });
    if (!updated) return jsonResponse({ message: "Analytics record not found." }, 404);
    return jsonResponse({ message: "Analytics record updated.", record: mapDocument(updated) });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoEmployerAnalyticsRecord(identity, id, patch);
      if (!updated) return jsonResponse({ message: "Analytics record not found." }, 404);
      return jsonResponse({ message: "Analytics record updated.", record: updated });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Missing analytics record id." }, 400);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["employer"]);
  if (roleCheck) return roleCheck;
  const identity = toIdentity(authResult.session);

  if (isDemoMode()) {
    const deleted = deleteDemoEmployerAnalyticsRecord(identity, id);
    if (!deleted) return jsonResponse({ message: "Analytics record not found." }, 404);
    return jsonResponse({ message: "Analytics record deleted." });
  }

  const objectId = toObjectId(id);
  if (!objectId) return jsonResponse({ message: "Invalid analytics record id." }, 400);
  const ownerFilter = buildOwnerFilter(identity);
  if (!ownerFilter) return jsonResponse({ message: "Unauthorized" }, 401);

  try {
    const database = await getMongoDatabase();
    const result = await database
      .collection("employer_analytics")
      .deleteOne({ _id: objectId, ...ownerFilter });
    if (!result.deletedCount) return jsonResponse({ message: "Analytics record not found." }, 404);
    return jsonResponse({ message: "Analytics record deleted." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const deleted = deleteDemoEmployerAnalyticsRecord(identity, id);
      if (!deleted) return jsonResponse({ message: "Analytics record not found." }, 404);
      return jsonResponse({ message: "Analytics record deleted." });
    }
    throw error;
  }
}

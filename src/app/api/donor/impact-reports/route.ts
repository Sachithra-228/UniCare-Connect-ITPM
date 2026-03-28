import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getDemoDonorImpactReport } from "@/lib/donor-impact-reports-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type ContributionDoc = {
  amountLkr?: number;
  contributionType?: string;
  category?: string;
  createdAt?: Date | string;
};

type ScholarshipDoc = {
  status?: string;
  amount?: string | number;
  createdBy?: string;
  createdAt?: Date | string;
};

type AidRequestDoc = {
  userId?: string;
  firebaseUid?: string;
  category?: string;
  amount?: string | number;
  status?: string;
  approvedAt?: Date | string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
};

function normalizeRangeDays(value: string | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return 90;
  return Math.max(7, Math.min(365, parsed));
}

function parseAmount(amount: unknown) {
  if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) return Math.trunc(amount);
  if (typeof amount === "string") {
    const digits = amount.replace(/[^\d]/g, "");
    if (!digits) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function normalizeCategory(value: unknown) {
  const category = String(value ?? "").trim().toLowerCase();
  if (category.includes("emergency")) return "Emergency aid";
  if (category.includes("equipment")) return "Equipment support";
  if (category.includes("meal") || category.includes("voucher") || category.includes("boarding")) {
    return "Meal vouchers";
  }
  if (category.includes("tuition")) return "Tuition support";
  if (!category) return "General support";
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  const status = String(value ?? "").trim().toLowerCase();
  return status === "approved";
}

function toRangeDate(doc: { approvedAt?: Date | string; updatedAt?: Date | string; createdAt?: Date | string }) {
  const value = doc.approvedAt ?? doc.updatedAt ?? doc.createdAt;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const rangeDays = normalizeRangeDays(request.nextUrl.searchParams.get("rangeDays"));
  if (isDemoMode()) {
    return jsonResponse(getDemoDonorImpactReport(rangeDays));
  }

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identities = [...(userId ? [userId] : []), ...(firebaseUid ? [firebaseUid] : [])];

  try {
    const database = await getMongoDatabase();
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

    const [contributions, scholarships, aidRequests] = await Promise.all([
      database
        .collection<ContributionDoc>("donor_contributions")
        .find({
          $or: [
            ...(userId ? [{ donorUserId: userId }] : []),
            ...(firebaseUid ? [{ donorFirebaseUid: firebaseUid }] : [])
          ],
          createdAt: { $gte: since }
        })
        .toArray(),
      database
        .collection<ScholarshipDoc>("scholarships")
        .find({ createdBy: { $in: identities } })
        .toArray(),
      database
        .collection<AidRequestDoc>("aid_requests")
        .find({ status: { $in: ["Approved", "approved"] } })
        .toArray()
    ]);

    const totalContributedLkr = contributions.reduce((sum, item) => sum + Number(item.amountLkr ?? 0), 0);

    const totalScholarships = scholarships.length;
    const activeScholarships = scholarships.filter(
      (item) => String(item.status ?? "").trim().toLowerCase() !== "closed"
    ).length;

    const approvedAidInRange = aidRequests.filter((item) => {
      if (!normalizeStatus(item.status)) return false;
      const date = toRangeDate(item);
      return date ? date >= since : false;
    });

    const approvedAidRequests = approvedAidInRange.length;
    const aidApprovedLkr = approvedAidInRange.reduce((sum, item) => sum + parseAmount(item.amount), 0);

    const uniqueStudents = new Set(
      approvedAidInRange
        .map((item) => String(item.userId ?? item.firebaseUid ?? "").trim())
        .filter(Boolean)
    );

    const fundedStudents = uniqueStudents.size;
    const avgSupportPerStudent = fundedStudents ? Math.round(aidApprovedLkr / fundedStudents) : 0;

    const distributionMap = new Map<string, { amountLkr: number; count: number }>();
    approvedAidInRange.forEach((item) => {
      const label = normalizeCategory(item.category);
      const current = distributionMap.get(label) ?? { amountLkr: 0, count: 0 };
      current.amountLkr += parseAmount(item.amount);
      current.count += 1;
      distributionMap.set(label, current);
    });

    contributions.forEach((item) => {
      const label = normalizeCategory(item.category ?? item.contributionType);
      const current = distributionMap.get(label) ?? { amountLkr: 0, count: 0 };
      current.amountLkr += Number(item.amountLkr ?? 0);
      current.count += 1;
      distributionMap.set(label, current);
    });

    const distribution = Array.from(distributionMap.entries())
      .map(([label, values]) => ({ label, ...values }))
      .sort((a, b) => b.amountLkr - a.amountLkr)
      .slice(0, 6);

    const highlights = [
      {
        id: "impact-highlight-1",
        title: "Funding utilization",
        detail: `${approvedAidRequests} aid approvals were completed in the last ${rangeDays} days.`
      },
      {
        id: "impact-highlight-2",
        title: "Student reach",
        detail: `${fundedStudents} students benefited from approved support in this period.`
      }
    ];

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      rangeDays,
      summary: {
        totalContributedLkr,
        activeScholarships,
        totalScholarships,
        aidApprovedLkr,
        approvedAidRequests,
        fundedStudents,
        avgSupportPerStudent
      },
      distribution,
      highlights
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(getDemoDonorImpactReport(rangeDays));
    }
    throw error;
  }
}

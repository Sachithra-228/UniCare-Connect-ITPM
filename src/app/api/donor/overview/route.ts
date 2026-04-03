import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { listDemoDonorContributions } from "@/lib/donor-contributions-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type ScholarshipDocument = {
  _id?: { toString: () => string };
  title?: string;
  amount?: string | number;
  deadline?: string;
  status?: string;
  createdBy?: string;
  createdAt?: Date | string;
};

type AidRequestDocument = {
  _id?: { toString: () => string };
  category?: string;
  amount?: string | number;
  status?: string;
  approvedAt?: Date | string;
  updatedAt?: Date | string;
};

type ContributionDocument = {
  _id?: { toString: () => string };
  contributionType?: "emergency_fund" | "equipment" | "scholarship" | "general";
  program?: string;
  category?: string;
  amountLkr?: number;
  receiptNumber?: string;
  createdAt?: Date | string;
};

type ThankYouDocument = {
  _id?: { toString: () => string };
  donorUserId?: string;
  donorFirebaseUid?: string;
  from?: string;
  message?: string;
  program?: string;
  createdAt?: Date | string;
};

function normalizeStatus(value: unknown): "approved" | "rejected" | "pending" {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function parseAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const digits = value.replace(/[^\d]/g, "");
    if (!digits) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function toIso(value: Date | string | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return value;
  }
  return new Date().toISOString();
}

function matchesOwner(value: unknown, identities: string[]) {
  const owner = String(value ?? "").trim();
  return owner.length > 0 && identities.includes(owner);
}

function normalizeCategory(value: unknown) {
  const category = String(value ?? "").trim().toLowerCase();
  if (category.includes("emergency")) return "Emergency aid";
  if (category.includes("equipment")) return "Equipment support";
  if (category.includes("meal") || category.includes("voucher") || category.includes("boarding")) {
    return "Meal voucher support";
  }
  if (category.includes("tuition")) return "Tuition support";
  if (!category) return "General support";
  return String(value ?? "").trim();
}

function demoOverview() {
  const contributions = listDemoDonorContributions({ userId: "u4", firebaseUid: "u4" });
  return {
    summary: {
      activeScholarships: 3,
      totalScholarships: 4,
      emergencyAidCases: 6,
      upcomingDeadlines: 2,
      totalContributedLkr: contributions.reduce((sum, item) => sum + Number(item.amountLkr ?? 0), 0)
    },
    recentDonations: contributions.slice(0, 5).map((item) => ({
      id: item._id,
      program: item.program,
      category: item.category,
      amountLkr: item.amountLkr,
      receiptNumber: item.receiptNumber,
      date: item.createdAt
    })),
    thankYouMessages: [
      {
        id: "demo-thanks-1",
        from: "Student (anonymized)",
        message: "Your support helped me continue my semester without interruption.",
        program: "Emergency Support Fund",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: "demo-thanks-2",
        from: "Student (anonymized)",
        message: "Thank you for the equipment donation. I can now attend labs and coursework.",
        program: "Digital Access Grant",
        date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
      }
    ]
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  if (isDemoMode()) {
    return jsonResponse(demoOverview());
  }

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identities = [...(userId ? [userId] : []), ...(firebaseUid ? [firebaseUid] : [])];

  try {
    const database = await getMongoDatabase();

    const [scholarships, contributions, approvedEmergencyAid, thankYouMessages] = await Promise.all([
      database
        .collection<ScholarshipDocument>("scholarships")
        .find({ createdBy: { $in: identities } })
        .sort({ createdAt: -1 })
        .toArray(),
      database
        .collection<ContributionDocument>("donor_contributions")
        .find({
          $or: [...(userId ? [{ donorUserId: userId }] : []), ...(firebaseUid ? [{ donorFirebaseUid: firebaseUid }] : [])]
        })
        .sort({ createdAt: -1 })
        .toArray(),
      database
        .collection<AidRequestDocument>("aid_requests")
        .find(
          { status: { $in: ["Approved", "approved"] }, category: { $in: ["Emergency aid", "Emergency support", "emergency aid", "emergency support"] } },
          { projection: { _id: 1 } }
        )
        .toArray(),
      database
        .collection<ThankYouDocument>("donor_thank_you_messages")
        .find({
          $or: [...(userId ? [{ donorUserId: userId }] : []), ...(firebaseUid ? [{ donorFirebaseUid: firebaseUid }] : [])]
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray()
    ]);

    const totalScholarships = scholarships.length;
    const activeScholarships = scholarships.filter(
      (item) => !["closed", "expired"].includes(String(item.status ?? "").trim().toLowerCase())
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDeadlines = scholarships.filter((item) => {
      const deadline = String(item.deadline ?? "").trim();
      if (!deadline) return false;
      const parsed = new Date(deadline);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed >= today;
    }).length;

    const totalContributedLkr =
      contributions.reduce((sum, item) => sum + Number(item.amountLkr ?? 0), 0) +
      scholarships.reduce((sum, item) => sum + parseAmount(item.amount), 0);

    const recentDonations = [
      ...contributions.map((item) => ({
        id: item._id?.toString?.() ?? "",
        program: item.program ?? normalizeCategory(item.category),
        category: normalizeCategory(item.category),
        amountLkr: Number(item.amountLkr ?? 0),
        receiptNumber: item.receiptNumber ?? "",
        date: toIso(item.createdAt)
      })),
      ...scholarships
        .filter((item) => matchesOwner(item.createdBy, identities))
        .map((item) => ({
          id: `sch-${item._id?.toString?.() ?? ""}`,
          program: item.title ?? "Scholarship commitment",
          category: "Scholarship support",
          amountLkr: parseAmount(item.amount),
          receiptNumber: "",
          date: toIso(item.createdAt)
        }))
    ]
      .filter((item) => item.amountLkr > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);

    const fallbackThankYou = recentDonations.slice(0, 4).map((item, index) => ({
      id: `derived-thanks-${index}`,
      from: "Student (anonymized)",
      message:
        item.category === "Equipment support"
          ? "Your equipment contribution helped students continue digital learning."
          : "Your contribution helped students continue their studies with reduced financial stress.",
      program: item.program,
      date: item.date
    }));

    const resolvedThankYou = thankYouMessages.length
      ? thankYouMessages.map((item) => ({
          id: item._id?.toString?.() ?? "",
          from: item.from ?? "Student (anonymized)",
          message: item.message ?? "Thank you for your support.",
          program: item.program ?? "Student support",
          date: toIso(item.createdAt)
        }))
      : fallbackThankYou;

    return jsonResponse({
      summary: {
        activeScholarships,
        totalScholarships,
        emergencyAidCases: approvedEmergencyAid.length,
        upcomingDeadlines,
        totalContributedLkr
      },
      recentDonations,
      thankYouMessages: resolvedThankYou
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(demoOverview());
    }
    throw error;
  }
}

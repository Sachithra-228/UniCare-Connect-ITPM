import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type DateValue = Date | string | null | undefined;

type OverviewStats = {
  activeStudents: number;
  pendingVerifications: number;
  openAidRequests: number;
  openTickets: number;
};

type OverviewActivity = {
  id: string;
  type: string;
  status: string;
  owner: string;
  createdAt: string;
};

type OverviewDeadline = {
  id: string;
  label: string;
  date: string;
};

type OverviewHealth = {
  database: string;
  auth: string;
  background: string;
};

type OverviewResponse = {
  stats: OverviewStats;
  recentActivity: OverviewActivity[];
  upcomingDeadlines: OverviewDeadline[];
  systemHealth: OverviewHealth;
};

function normalizeDate(value: DateValue) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

function toIso(value: DateValue) {
  const parsed = normalizeDate(value);
  return parsed ? parsed.toISOString() : new Date().toISOString();
}

function normalizeStatus(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "Pending";
}

function pendingStatusFilter() {
  return { $in: ["pending", "Pending", "under review", "Under review"] };
}

function fallbackOverview(): OverviewResponse {
  return {
    stats: {
      activeStudents: 132,
      pendingVerifications: 9,
      openAidRequests: 7,
      openTickets: 3
    },
    recentActivity: [
      {
        id: "demo-aid-1",
        type: "Emergency aid request",
        status: "Under review",
        owner: "Student",
        createdAt: new Date().toISOString()
      },
      {
        id: "demo-ngo-1",
        type: "NGO onboarding",
        status: "Documents pending",
        owner: "NGO",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: "demo-counselor-1",
        type: "Counselor booking",
        status: "Pending",
        owner: "Student",
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
      }
    ],
    upcomingDeadlines: [
      {
        id: "demo-deadline-1",
        label: "Scholarship cycle close",
        date: "2026-04-10"
      },
      {
        id: "demo-deadline-2",
        label: "Internship application review",
        date: "2026-04-15"
      },
      {
        id: "demo-deadline-3",
        label: "Aid review checkpoint",
        date: "2026-04-20"
      }
    ],
    systemHealth: {
      database: "Demo / fallback mode",
      auth: "OK",
      background: "Sample data only"
    }
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
  if (roleCheck) {
    return roleCheck;
  }

  if (isDemoMode()) {
    return jsonResponse(fallbackOverview());
  }

  try {
    const database = await getMongoDatabase();

    const [activeStudents, pendingVerifications, openAidRequests, pendingCounselorBookings, pendingDeleteRequests] =
      await Promise.all([
        database.collection("users").countDocuments({
          role: "student",
          isDeleted: { $ne: true },
          status: { $ne: "blocked" }
        }),
        database.collection("users").countDocuments({
          role: { $in: ["student", "donor", "ngo"] },
          isDeleted: { $ne: true },
          $or: [{ status: "pending" }, { needsProfileCompletion: true }]
        }),
        database.collection("aid_requests").countDocuments({
          status: pendingStatusFilter()
        }),
        database.collection("wellness_counselor_bookings").countDocuments({
          status: pendingStatusFilter()
        }),
        database.collection("account_deletion_requests").countDocuments({
          status: "pending"
        })
      ]);

    const [recentAidRequests, recentDeleteRequests, recentCounselorBookings, scholarships, jobs] = await Promise.all([
      database
        .collection("aid_requests")
        .find({}, { projection: { _id: 1, category: 1, status: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      database
        .collection("account_deletion_requests")
        .find({}, { projection: { _id: 1, status: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray(),
      database
        .collection("wellness_counselor_bookings")
        .find({}, { projection: { _id: 1, status: 1, studentName: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray(),
      database
        .collection("scholarships")
        .find({}, { projection: { _id: 1, title: 1, deadline: 1 } })
        .toArray(),
      database
        .collection("jobs")
        .find({}, { projection: { _id: 1, title: 1, applicationDeadline: 1 } })
        .toArray()
    ]);

    const recentActivity = [
      ...recentAidRequests.map((item) => ({
        id: item._id?.toString?.() ?? "",
        type: String(item.category ?? "Aid request"),
        status: normalizeStatus(item.status),
        owner: "Student",
        createdAt: toIso(item.createdAt as DateValue)
      })),
      ...recentDeleteRequests.map((item) => ({
        id: item._id?.toString?.() ?? "",
        type: "Account deletion request",
        status: normalizeStatus(item.status),
        owner: "Student",
        createdAt: toIso(item.createdAt as DateValue)
      })),
      ...recentCounselorBookings.map((item) => ({
        id: item._id?.toString?.() ?? "",
        type: "Counselor booking",
        status: normalizeStatus(item.status),
        owner: String(item.studentName ?? "Student"),
        createdAt: toIso(item.createdAt as DateValue)
      }))
    ]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 8);

    const today = new Date();
    const upcomingDeadlines = [
      ...scholarships
        .map((item) => {
          const date = normalizeDate(item.deadline as DateValue);
          if (!date) return null;
          return {
            id: `sch-${item._id?.toString?.() ?? ""}`,
            label: String(item.title ?? "Scholarship deadline"),
            date
          };
        })
        .filter((item): item is { id: string; label: string; date: Date } => Boolean(item)),
      ...jobs
        .map((item) => {
          const date = normalizeDate(item.applicationDeadline as DateValue);
          if (!date) return null;
          return {
            id: `job-${item._id?.toString?.() ?? ""}`,
            label: String(item.title ?? "Job application deadline"),
            date
          };
        })
        .filter((item): item is { id: string; label: string; date: Date } => Boolean(item))
    ]
      .filter((item) => item.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      .sort((a, b) => (a.date.getTime() > b.date.getTime() ? 1 : -1))
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        label: item.label,
        date: item.date.toISOString().slice(0, 10)
      }));

    const openTickets = pendingCounselorBookings + pendingDeleteRequests;
    const health: OverviewHealth = {
      database: "Connected",
      auth: "OK",
      background:
        openAidRequests + openTickets > 0
          ? `${openAidRequests + openTickets} queue items waiting`
          : "No queue backlog"
    };

    return jsonResponse({
      stats: {
        activeStudents,
        pendingVerifications,
        openAidRequests,
        openTickets
      },
      recentActivity,
      upcomingDeadlines,
      systemHealth: health
    } satisfies OverviewResponse);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(fallbackOverview());
    }
    throw error;
  }
}

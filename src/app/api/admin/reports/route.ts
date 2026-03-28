import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type DateValue = Date | string | null | undefined;

type AidRequestDoc = {
  category?: string;
  amount?: string | number;
  status?: string;
  createdAt?: DateValue;
  updatedAt?: DateValue;
  approvedAt?: DateValue;
};

type MentorshipSessionDoc = {
  status?: string;
  createdAt?: DateValue;
  updatedAt?: DateValue;
};

type CounselorBookingDoc = {
  status?: string;
  createdAt?: DateValue;
  updatedAt?: DateValue;
};

type HealthLogDoc = {
  riskLevel?: string;
  mood?: string;
  stressLevel?: number;
  sleepHours?: number;
  createdAt?: DateValue;
  date?: DateValue;
  updatedAt?: DateValue;
};

type JobDoc = {
  status?: string;
  moderationStatus?: string;
  createdAt?: DateValue;
  updatedAt?: DateValue;
};

type ApplicationDoc = {
  kind?: string;
  status?: string;
  createdAt?: DateValue;
  submittedAt?: DateValue;
  updatedAt?: DateValue;
};

type TrendPoint = {
  period: string;
  aidRequests: number;
  aidApprovedAmount: number;
  mentorshipCompleted: number;
  wellnessHighRisk: number;
};

type AidCategorySummary = {
  category: string;
  requests: number;
  approved: number;
  rejected: number;
  pending: number;
  approvedAmount: number;
};

type AidStatusSummary = {
  status: string;
  count: number;
};

type MentorshipStatusSummary = {
  status: string;
  count: number;
};

type ReportsResponse = {
  template: string;
  rangeDays: number;
  generatedAt: string;
  summary: {
    totalAidRequests: number;
    pendingAidRequests: number;
    approvedAidRequests: number;
    approvedAidAmountLkr: number;
    mentorshipSessions: number;
    mentorshipCompleted: number;
    counselorBookings: number;
    highRiskCheckins: number;
    jobModerationPending: number;
  };
  aidByCategory: AidCategorySummary[];
  aidByStatus: AidStatusSummary[];
  mentorshipByStatus: MentorshipStatusSummary[];
  wellness: {
    counselorPending: number;
    counselorConfirmed: number;
    counselorCompleted: number;
    healthLogs: number;
    highRiskCheckins: number;
  };
  outcomes: {
    trackedApplications: number;
    approvedJobApplications: number;
    approvedScholarshipApplications: number;
    activeApprovedJobs: number;
    mentorshipCompleted: number;
  };
  trend: TrendPoint[];
};

const TEMPLATE_KEYS = new Set([
  "student-support-metrics",
  "financial-aid-distribution",
  "graduation-outcomes"
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeTemplate(value: string | null) {
  const template = String(value ?? "").trim().toLowerCase();
  return TEMPLATE_KEYS.has(template) ? template : "student-support-metrics";
}

function normalizeRangeDays(value: string | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(7, Math.min(365, parsed));
}

function normalizeDate(value: DateValue) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function inRange(value: DateValue, since: Date, now: Date) {
  const parsed = normalizeDate(value);
  if (!parsed) return false;
  return parsed >= since && parsed <= now;
}

function toRangeDate(
  item: { createdAt?: DateValue; updatedAt?: DateValue; approvedAt?: DateValue; submittedAt?: DateValue; date?: DateValue },
  kind: "created" | "approved" = "created"
) {
  if (kind === "approved") {
    return normalizeDate(item.approvedAt) ?? normalizeDate(item.updatedAt) ?? normalizeDate(item.createdAt);
  }
  return (
    normalizeDate(item.createdAt) ??
    normalizeDate(item.submittedAt) ??
    normalizeDate(item.date) ??
    normalizeDate(item.updatedAt)
  );
}

function normalizeAidCategory(category?: string) {
  const value = String(category ?? "").trim().toLowerCase();
  if (!value || value.includes("emergency")) return "Emergency aid";
  if (value.includes("equipment")) return "Equipment support";
  if (value.includes("meal") || value.includes("voucher") || value.includes("boarding")) return "Meal voucher support";
  if (value.includes("tuition") || value.includes("maintenance") || value.includes("fee")) return "Tuition support";
  return "Other aid";
}

function normalizeAidStatus(status?: string): "Approved" | "Rejected" | "Pending" {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  return "Pending";
}

function normalizeMentorshipStatus(status?: string) {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "confirmed") return "Confirmed";
  if (value === "scheduled") return "Scheduled";
  if (value === "completed") return "Completed";
  if (value === "cancelled") return "Cancelled";
  return "Pending";
}

function normalizeBookingStatus(status?: string): "pending" | "confirmed" | "completed" | "cancelled" {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "confirmed") return "confirmed";
  if (value === "completed") return "completed";
  if (value === "cancelled") return "cancelled";
  return "pending";
}

function normalizeModerationStatus(value?: string): "pending" | "approved" | "rejected" {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function normalizePublishingStatus(value?: string): "draft" | "active" | "expired" {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "draft") return "draft";
  if (status === "expired") return "expired";
  return "active";
}

function parseAmount(amount: unknown) {
  if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
    return Math.trunc(amount);
  }
  if (typeof amount === "string") {
    const digits = amount.replace(/[^\d]/g, "");
    if (!digits) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function isHighRiskLog(log: HealthLogDoc) {
  const riskLevel = String(log.riskLevel ?? "").trim().toLowerCase();
  if (riskLevel === "high") return true;

  const mood = String(log.mood ?? "").trim().toLowerCase();
  if (mood === "low" || mood === "anxious") return true;

  const stressLevel = Number(log.stressLevel ?? 0);
  const sleepHours = Number(log.sleepHours ?? 0);
  return stressLevel >= 8 || (sleepHours > 0 && sleepHours < 4);
}

function periodKey(date: Date, rangeDays: number) {
  if (rangeDays <= 60) {
    return date.toISOString().slice(0, 10);
  }

  const start = new Date(date);
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return start.toISOString().slice(0, 10);
}

function buildTrend(
  rangeDays: number,
  aidRequests: AidRequestDoc[],
  mentorshipSessions: MentorshipSessionDoc[],
  healthLogs: HealthLogDoc[],
  since: Date,
  now: Date
) {
  const bucket = new Map<string, TrendPoint>();

  const ensurePoint = (key: string) => {
    const existing = bucket.get(key);
    if (existing) return existing;
    const next: TrendPoint = {
      period: key,
      aidRequests: 0,
      aidApprovedAmount: 0,
      mentorshipCompleted: 0,
      wellnessHighRisk: 0
    };
    bucket.set(key, next);
    return next;
  };

  aidRequests.forEach((item) => {
    const createdDate = toRangeDate(item, "created");
    if (createdDate && createdDate >= since && createdDate <= now) {
      const point = ensurePoint(periodKey(createdDate, rangeDays));
      point.aidRequests += 1;
    }

    if (normalizeAidStatus(item.status) === "Approved") {
      const approvedDate = toRangeDate(item, "approved");
      if (approvedDate && approvedDate >= since && approvedDate <= now) {
        const point = ensurePoint(periodKey(approvedDate, rangeDays));
        point.aidApprovedAmount += parseAmount(item.amount);
      }
    }
  });

  mentorshipSessions.forEach((item) => {
    if (normalizeMentorshipStatus(item.status) !== "Completed") return;
    const date = toRangeDate(item, "created");
    if (!date || date < since || date > now) return;
    const point = ensurePoint(periodKey(date, rangeDays));
    point.mentorshipCompleted += 1;
  });

  healthLogs.forEach((item) => {
    if (!isHighRiskLog(item)) return;
    const date = toRangeDate(item, "created");
    if (!date || date < since || date > now) return;
    const point = ensurePoint(periodKey(date, rangeDays));
    point.wellnessHighRisk += 1;
  });

  return [...bucket.values()].sort((a, b) => (a.period > b.period ? 1 : -1)).slice(-12);
}

function escapeCsvValue(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function toCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(",")).join("\n");
}

function buildReportLines(template: string, report: ReportsResponse) {
  const generatedLabel = new Date(report.generatedAt).toISOString();
  const lines: string[] = [];

  if (template === "financial-aid-distribution") {
    lines.push("FINANCIAL AID DISTRIBUTION REPORT");
    lines.push(`GeneratedAt: ${generatedLabel}`);
    lines.push(`RangeDays: ${report.rangeDays}`);
    lines.push("");
    lines.push("Aid by category");
    report.aidByCategory.forEach((item) => {
      lines.push(
        `${item.category} | requests=${item.requests} approved=${item.approved} rejected=${item.rejected} pending=${item.pending} approvedAmountLkr=${item.approvedAmount}`
      );
    });
    lines.push("");
    lines.push("Aid by status");
    report.aidByStatus.forEach((item) => {
      lines.push(`${item.status}: ${item.count}`);
    });
    return lines;
  }

  if (template === "graduation-outcomes") {
    lines.push("GRADUATION OUTCOMES REPORT");
    lines.push(`GeneratedAt: ${generatedLabel}`);
    lines.push(`RangeDays: ${report.rangeDays}`);
    lines.push("");
    lines.push("Outcome metrics");
    lines.push(`Tracked applications: ${report.outcomes.trackedApplications}`);
    lines.push(`Approved job applications: ${report.outcomes.approvedJobApplications}`);
    lines.push(`Approved scholarship applications: ${report.outcomes.approvedScholarshipApplications}`);
    lines.push(`Active approved jobs: ${report.outcomes.activeApprovedJobs}`);
    lines.push(`Mentorship completed: ${report.outcomes.mentorshipCompleted}`);
    lines.push("");
    lines.push("Trend");
    report.trend.forEach((item) => {
      lines.push(
        `${item.period} | aidRequests=${item.aidRequests} aidApprovedAmountLkr=${item.aidApprovedAmount} mentorshipCompleted=${item.mentorshipCompleted} wellnessHighRisk=${item.wellnessHighRisk}`
      );
    });
    return lines;
  }

  lines.push("STUDENT SUPPORT METRICS REPORT");
  lines.push(`GeneratedAt: ${generatedLabel}`);
  lines.push(`RangeDays: ${report.rangeDays}`);
  lines.push("");
  lines.push("Summary");
  lines.push(`Total aid requests: ${report.summary.totalAidRequests}`);
  lines.push(`Approved aid requests: ${report.summary.approvedAidRequests}`);
  lines.push(`Pending aid requests: ${report.summary.pendingAidRequests}`);
  lines.push(`Approved aid amount (LKR): ${report.summary.approvedAidAmountLkr}`);
  lines.push(`Mentorship sessions: ${report.summary.mentorshipSessions}`);
  lines.push(`Mentorship completed: ${report.summary.mentorshipCompleted}`);
  lines.push(`Counselor bookings: ${report.summary.counselorBookings}`);
  lines.push(`High-risk check-ins: ${report.summary.highRiskCheckins}`);
  lines.push(`Jobs pending moderation: ${report.summary.jobModerationPending}`);
  lines.push("");
  lines.push("Mentorship status");
  report.mentorshipByStatus.forEach((item) => {
    lines.push(`${item.status}: ${item.count}`);
  });
  lines.push("");
  lines.push("Trend");
  report.trend.forEach((item) => {
    lines.push(
      `${item.period} | aidRequests=${item.aidRequests} aidApprovedAmountLkr=${item.aidApprovedAmount} mentorshipCompleted=${item.mentorshipCompleted} wellnessHighRisk=${item.wellnessHighRisk}`
    );
  });
  return lines;
}

function sanitizePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const linesPerPage = 56;
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  if (!pages.length) pages.push(["No report rows available."]);

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageCount = pages.length;
  const pageObjectStart = 4;
  const kids = pages.map((_, index) => `${pageObjectStart + index * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = pageObjectStart + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );

    const textOps: string[] = ["BT", "/F1 10 Tf", "13 TL", "40 760 Td"];
    pageLines.forEach((line, lineIndex) => {
      const safe = sanitizePdfText(line || " ");
      if (lineIndex === 0) {
        textOps.push(`(${safe}) Tj`);
      } else {
        textOps.push("T*");
        textOps.push(`(${safe}) Tj`);
      }
    });
    textOps.push("ET");
    const stream = `${textOps.join("\n")}\n`;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });

  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    const objectNumber = index + 1;
    offsets.push(output.length);
    output += `${objectNumber} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = output.length;
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(output);
}

function buildPdf(template: string, report: ReportsResponse) {
  const lines = buildReportLines(template, report);
  return buildSimplePdf(lines);
}

function buildCsv(template: string, report: ReportsResponse) {
  const generatedLabel = new Date(report.generatedAt).toISOString();

  if (template === "financial-aid-distribution") {
    const rows: Array<Array<string | number>> = [
      ["Report", "Financial aid distribution"],
      ["GeneratedAt", generatedLabel],
      ["RangeDays", report.rangeDays],
      [],
      ["Category", "Requests", "Approved", "Rejected", "Pending", "ApprovedAmountLkr"],
      ...report.aidByCategory.map((item) => [
        item.category,
        item.requests,
        item.approved,
        item.rejected,
        item.pending,
        item.approvedAmount
      ]),
      [],
      ["Status", "Count"],
      ...report.aidByStatus.map((item) => [item.status, item.count])
    ];
    return toCsv(rows);
  }

  if (template === "graduation-outcomes") {
    const rows: Array<Array<string | number>> = [
      ["Report", "Graduation outcomes"],
      ["GeneratedAt", generatedLabel],
      ["RangeDays", report.rangeDays],
      [],
      ["Metric", "Value"],
      ["Tracked applications", report.outcomes.trackedApplications],
      ["Approved job applications", report.outcomes.approvedJobApplications],
      ["Approved scholarship applications", report.outcomes.approvedScholarshipApplications],
      ["Active approved jobs", report.outcomes.activeApprovedJobs],
      ["Mentorship completed", report.outcomes.mentorshipCompleted],
      [],
      ["Period", "AidRequests", "AidApprovedAmountLkr", "MentorshipCompleted", "WellnessHighRisk"],
      ...report.trend.map((item) => [
        item.period,
        item.aidRequests,
        item.aidApprovedAmount,
        item.mentorshipCompleted,
        item.wellnessHighRisk
      ])
    ];
    return toCsv(rows);
  }

  const rows: Array<Array<string | number>> = [
    ["Report", "Student support metrics"],
    ["GeneratedAt", generatedLabel],
    ["RangeDays", report.rangeDays],
    [],
    ["Metric", "Value"],
    ["Total aid requests", report.summary.totalAidRequests],
    ["Approved aid requests", report.summary.approvedAidRequests],
    ["Pending aid requests", report.summary.pendingAidRequests],
    ["Approved aid amount (LKR)", report.summary.approvedAidAmountLkr],
    ["Mentorship sessions", report.summary.mentorshipSessions],
    ["Mentorship completed", report.summary.mentorshipCompleted],
    ["Counselor bookings", report.summary.counselorBookings],
    ["High-risk check-ins", report.summary.highRiskCheckins],
    ["Jobs pending moderation", report.summary.jobModerationPending],
    [],
    ["Mentorship status", "Count"],
    ...report.mentorshipByStatus.map((item) => [item.status, item.count]),
    [],
    ["Period", "AidRequests", "AidApprovedAmountLkr", "MentorshipCompleted", "WellnessHighRisk"],
    ...report.trend.map((item) => [
      item.period,
      item.aidRequests,
      item.aidApprovedAmount,
      item.mentorshipCompleted,
      item.wellnessHighRisk
    ])
  ];
  return toCsv(rows);
}

function demoReport(rangeDays: number, template: string): ReportsResponse {
  const now = new Date();
  const generatedAt = now.toISOString();
  return {
    template,
    rangeDays,
    generatedAt,
    summary: {
      totalAidRequests: 28,
      pendingAidRequests: 9,
      approvedAidRequests: 16,
      approvedAidAmountLkr: 265000,
      mentorshipSessions: 18,
      mentorshipCompleted: 10,
      counselorBookings: 7,
      highRiskCheckins: 4,
      jobModerationPending: 3
    },
    aidByCategory: [
      { category: "Emergency aid", requests: 10, approved: 6, rejected: 1, pending: 3, approvedAmount: 82000 },
      { category: "Meal voucher support", requests: 8, approved: 5, rejected: 1, pending: 2, approvedAmount: 43000 },
      { category: "Tuition support", requests: 6, approved: 3, rejected: 2, pending: 1, approvedAmount: 110000 },
      { category: "Equipment support", requests: 4, approved: 2, rejected: 0, pending: 2, approvedAmount: 30000 }
    ],
    aidByStatus: [
      { status: "Approved", count: 16 },
      { status: "Pending", count: 9 },
      { status: "Rejected", count: 3 }
    ],
    mentorshipByStatus: [
      { status: "Pending", count: 5 },
      { status: "Confirmed", count: 3 },
      { status: "Scheduled", count: 4 },
      { status: "Completed", count: 10 },
      { status: "Cancelled", count: 1 }
    ],
    wellness: {
      counselorPending: 3,
      counselorConfirmed: 2,
      counselorCompleted: 2,
      healthLogs: 34,
      highRiskCheckins: 4
    },
    outcomes: {
      trackedApplications: 19,
      approvedJobApplications: 6,
      approvedScholarshipApplications: 4,
      activeApprovedJobs: 13,
      mentorshipCompleted: 10
    },
    trend: [
      { period: "2026-03-02", aidRequests: 4, aidApprovedAmount: 38000, mentorshipCompleted: 1, wellnessHighRisk: 0 },
      { period: "2026-03-09", aidRequests: 7, aidApprovedAmount: 64000, mentorshipCompleted: 2, wellnessHighRisk: 1 },
      { period: "2026-03-16", aidRequests: 9, aidApprovedAmount: 85000, mentorshipCompleted: 3, wellnessHighRisk: 2 },
      { period: "2026-03-23", aidRequests: 8, aidApprovedAmount: 78000, mentorshipCompleted: 4, wellnessHighRisk: 1 }
    ]
  };
}

function buildReportPayload(input: {
  template: string;
  rangeDays: number;
  aidRequests: AidRequestDoc[];
  mentorshipSessions: MentorshipSessionDoc[];
  counselorBookings: CounselorBookingDoc[];
  healthLogs: HealthLogDoc[];
  jobs: JobDoc[];
  applications: ApplicationDoc[];
}) {
  const { template, rangeDays, aidRequests, mentorshipSessions, counselorBookings, healthLogs, jobs, applications } = input;
  const now = new Date();
  const since = new Date(now.getTime() - (rangeDays - 1) * MS_PER_DAY);
  since.setHours(0, 0, 0, 0);

  const aidInRange = aidRequests.filter((item) => inRange(toRangeDate(item, "created"), since, now));
  const mentorshipInRange = mentorshipSessions.filter((item) => inRange(toRangeDate(item, "created"), since, now));
  const bookingsInRange = counselorBookings.filter((item) => inRange(toRangeDate(item, "created"), since, now));
  const healthInRange = healthLogs.filter((item) => inRange(toRangeDate(item, "created"), since, now));
  const jobsInRange = jobs.filter((item) => inRange(toRangeDate(item, "created"), since, now));
  const applicationsInRange = applications.filter((item) => inRange(toRangeDate(item, "created"), since, now));

  const categoryMap = new Map<string, AidCategorySummary>();
  const aidStatusMap = new Map<string, number>();
  let approvedAidAmountLkr = 0;
  let approvedAidRequests = 0;
  let pendingAidRequests = 0;

  aidInRange.forEach((item) => {
    const category = normalizeAidCategory(item.category);
    const status = normalizeAidStatus(item.status);
    const amount = parseAmount(item.amount);

    const current = categoryMap.get(category) ?? {
      category,
      requests: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      approvedAmount: 0
    };
    current.requests += 1;
    if (status === "Approved") {
      current.approved += 1;
      current.approvedAmount += amount;
      approvedAidAmountLkr += amount;
      approvedAidRequests += 1;
    } else if (status === "Rejected") {
      current.rejected += 1;
    } else {
      current.pending += 1;
      pendingAidRequests += 1;
    }
    categoryMap.set(category, current);
    aidStatusMap.set(status, (aidStatusMap.get(status) ?? 0) + 1);
  });

  const mentorshipStatusMap = new Map<string, number>();
  let mentorshipCompleted = 0;
  mentorshipInRange.forEach((item) => {
    const status = normalizeMentorshipStatus(item.status);
    mentorshipStatusMap.set(status, (mentorshipStatusMap.get(status) ?? 0) + 1);
    if (status === "Completed") {
      mentorshipCompleted += 1;
    }
  });

  let counselorPending = 0;
  let counselorConfirmed = 0;
  let counselorCompleted = 0;
  bookingsInRange.forEach((item) => {
    const status = normalizeBookingStatus(item.status);
    if (status === "pending") counselorPending += 1;
    if (status === "confirmed") counselorConfirmed += 1;
    if (status === "completed") counselorCompleted += 1;
  });

  const highRiskCheckins = healthInRange.filter((item) => isHighRiskLog(item)).length;
  const jobModerationPending = jobsInRange.filter((item) => normalizeModerationStatus(item.moderationStatus) === "pending").length;
  const activeApprovedJobs = jobsInRange.filter(
    (item) =>
      normalizeModerationStatus(item.moderationStatus) === "approved" &&
      normalizePublishingStatus(item.status) === "active"
  ).length;

  const trackedApplications = applicationsInRange.length;
  const approvedJobApplications = applicationsInRange.filter((item) => {
    const kind = String(item.kind ?? "").toLowerCase();
    const status = normalizeAidStatus(String(item.status ?? ""));
    return kind === "job" && status === "Approved";
  }).length;
  const approvedScholarshipApplications = applicationsInRange.filter((item) => {
    const kind = String(item.kind ?? "").toLowerCase();
    const status = normalizeAidStatus(String(item.status ?? ""));
    return kind === "scholarship" && status === "Approved";
  }).length;

  const trend = buildTrend(rangeDays, aidRequests, mentorshipSessions, healthLogs, since, now);

  return {
    template,
    rangeDays,
    generatedAt: now.toISOString(),
    summary: {
      totalAidRequests: aidInRange.length,
      pendingAidRequests,
      approvedAidRequests,
      approvedAidAmountLkr,
      mentorshipSessions: mentorshipInRange.length,
      mentorshipCompleted,
      counselorBookings: bookingsInRange.length,
      highRiskCheckins,
      jobModerationPending
    },
    aidByCategory: [...categoryMap.values()].sort((a, b) => (a.requests < b.requests ? 1 : -1)),
    aidByStatus: [...aidStatusMap.entries()].map(([status, count]) => ({ status, count })),
    mentorshipByStatus: [...mentorshipStatusMap.entries()].map(([status, count]) => ({ status, count })),
    wellness: {
      counselorPending,
      counselorConfirmed,
      counselorCompleted,
      healthLogs: healthInRange.length,
      highRiskCheckins
    },
    outcomes: {
      trackedApplications,
      approvedJobApplications,
      approvedScholarshipApplications,
      activeApprovedJobs,
      mentorshipCompleted
    },
    trend
  } satisfies ReportsResponse;
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
  if (roleCheck) return roleCheck;

  const template = normalizeTemplate(request.nextUrl.searchParams.get("template"));
  const rangeDays = normalizeRangeDays(request.nextUrl.searchParams.get("rangeDays"));
  const format = String(request.nextUrl.searchParams.get("format") ?? "json").trim().toLowerCase();

  const buildExportResponse = (report: ReportsResponse) => {
    if (format === "csv") {
      const csv = buildCsv(template, report);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"admin-report-${template}-${Date.now()}.csv\"`
        }
      });
    }
    if (format === "pdf") {
      const pdf = buildPdf(template, report);
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=\"admin-report-${template}-${Date.now()}.pdf\"`
        }
      });
    }
    return jsonResponse(report);
  };

  if (isDemoMode()) {
    const report = demoReport(rangeDays, template);
    return buildExportResponse(report);
  }

  try {
    const database = await getMongoDatabase();

    const [aidRequests, mentorshipSessions, counselorBookings, healthLogs, jobs, applications] =
      await Promise.all([
        database
          .collection("aid_requests")
          .find({}, { projection: { category: 1, amount: 1, status: 1, createdAt: 1, updatedAt: 1, approvedAt: 1 } })
          .toArray() as Promise<AidRequestDoc[]>,
        database
          .collection("mentorship_sessions")
          .find({}, { projection: { status: 1, createdAt: 1, updatedAt: 1 } })
          .toArray() as Promise<MentorshipSessionDoc[]>,
        database
          .collection("wellness_counselor_bookings")
          .find({}, { projection: { status: 1, createdAt: 1, updatedAt: 1 } })
          .toArray() as Promise<CounselorBookingDoc[]>,
        database
          .collection("health_logs")
          .find({}, { projection: { riskLevel: 1, mood: 1, stressLevel: 1, sleepHours: 1, date: 1, createdAt: 1, updatedAt: 1 } })
          .toArray() as Promise<HealthLogDoc[]>,
        database
          .collection("jobs")
          .find({}, { projection: { status: 1, moderationStatus: 1, createdAt: 1, updatedAt: 1 } })
          .toArray() as Promise<JobDoc[]>,
        database
          .collection("my_applications")
          .find({}, { projection: { kind: 1, status: 1, submittedAt: 1, createdAt: 1, updatedAt: 1 } })
          .toArray() as Promise<ApplicationDoc[]>
      ]);

    const report = buildReportPayload({
      template,
      rangeDays,
      aidRequests,
      mentorshipSessions,
      counselorBookings,
      healthLogs,
      jobs,
      applications
    });

    return buildExportResponse(report);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const report = demoReport(rangeDays, template);
      return buildExportResponse(report);
    }
    throw error;
  }
}

import type { DashboardRole } from "@/lib/role-dashboard-config";

export type DashboardNotification = {
  id?: string;
  _id?: string;
  title?: string;
  message?: string;
  type?: string;
  sectionId?: string;
  read?: boolean;
};

const ROLE_SECTION_KEYWORDS: Record<DashboardRole, Record<string, string[]>> = {
  student: {
    "financial-aid": [
      "financial",
      "aid",
      "scholarship",
      "tuition",
      "voucher",
      "equipment",
      "grant",
      "fee waiver",
      "disbursement"
    ],
    career: ["career", "job", "internship", "employer", "interview", "placement", "resume"],
    mentorship: ["mentor", "mentorship", "mentee", "session", "review", "rating", "feedback", "chat", "request", "approved"],
    wellness: ["wellness", "mental", "stress", "counsel", "health", "therapy"],
    "campus-life": ["campus", "club", "event", "announcement", "volunteer", "society"],
    "my-applications": ["application", "applied", "approval", "approved", "rejected", "pending"],
    communications: ["communication", "message", "donor", "csr", "partner", "announcement"],
    "ngo-partnerships": ["ngo partnership", "partnership request", "ngo collaboration", "partnership"],
    profile: ["profile", "account", "settings"]
  },
  admin: {
    verifications: ["verification", "verify", "eligibility", "document", "enrollment", "validation"],
    "financial-oversight": [
      "financial",
      "aid",
      "fund",
      "disbursement",
      "fee waiver",
      "equipment",
      "voucher",
      "scholarship"
    ],
    "career-services": ["career", "job", "internship", "employer", "placement"],
    "mentorship-program": ["mentor", "mentorship", "mentee", "session", "review", "rating", "feedback"],
    "counselor-support": ["wellness", "counsel", "counselor", "therapy", "booking", "mental", "health"],
    "peer-support": ["peer support", "peer", "forum", "discussion", "post", "reply"],
    reports: ["report", "analytics", "metric", "summary"],
    announcements: ["announcement", "notice", "alert", "broadcast"],
    communications: ["communication", "message", "donor", "csr", "partner", "announcement"],
    "ngo-partnerships": ["ngo partnership", "partnership request", "ngo collaboration", "partnership"],
    profile: ["profile", "account", "settings"]
  },
  faculty: {
    verifications: ["verification", "verify", "eligibility", "document", "enrollment", "validation"],
    "financial-oversight": [
      "financial",
      "aid",
      "fund",
      "disbursement",
      "fee waiver",
      "equipment",
      "voucher",
      "scholarship"
    ],
    "career-services": ["career", "job", "internship", "employer", "placement"],
    "mentorship-program": ["mentor", "mentorship", "mentee", "session", "review", "rating", "feedback"],
    "counselor-support": ["wellness", "counsel", "counselor", "therapy", "booking", "mental", "health"],
    reports: ["report", "analytics", "metric", "summary"],
    announcements: ["announcement", "notice", "alert", "broadcast"],
    communications: ["communication", "message", "donor", "csr", "partner", "announcement"],
    "ngo-partnerships": ["ngo partnership", "partnership request", "ngo collaboration", "partnership"],
    profile: ["profile", "account", "settings"]
  },
  mentor: {
    "my-mentees": ["mentee", "student", "request", "pairing"],
    sessions: ["session", "schedule", "confirmed", "completed", "cancelled", "review", "rating", "feedback"],
    messages: ["message", "chat", "inbox", "conversation"],
    "career-insights": ["career", "industry", "job", "referral"],
    webinars: ["webinar", "talk", "event"],
    "impact-tracker": ["impact", "hours", "success"],
    profile: ["profile", "availability", "settings"]
  },
  donor: {
    "my-scholarships": ["scholarship", "recipient", "application"],
    "funded-students": ["funded", "student progress", "progress", "milestone"],
    donations: ["donation", "receipt", "tax", "contribution", "equipment"],
    "impact-reports": ["impact", "report", "metrics", "analytics"],
    recognition: ["recognition", "testimonial", "story", "thanks"],
    communications: ["message", "communication", "invite", "announcement"],
    "ngo-partnerships": ["ngo partnership", "partnership request", "ngo collaboration", "partnership"],
    profile: ["profile", "account", "settings"]
  },
  employer: {
    "job-listings": ["job listing", "posting", "vacancy"],
    applicants: ["applicant", "application", "candidate", "shortlist"],
    "talent-pool": ["talent", "skill match", "recommended"],
    interviews: ["interview", "schedule"],
    "campus-connect": ["campus", "career fair", "recruitment event"],
    analytics: ["analytics", "report", "metric"],
    profile: ["profile", "account", "settings"]
  },
  ngo: {
    programs: ["program", "initiative", "campaign"],
    funding: ["fund", "grant", "allocation", "disbursement", "relief"],
    beneficiaries: ["beneficiary", "student", "application"],
    reports: ["report", "analytics", "impact"],
    partnerships: ["partnership", "collaboration", "partner"],
    "ngo-partnerships": ["ngo partnership", "partnership request", "ngo collaboration", "partnership"],
    communications: ["announcement", "communication", "message"],
    profile: ["profile", "account", "settings"]
  },
  parent: {
    "my-student": ["student", "progress", "attendance", "result"],
    "financial-overview": ["financial", "aid", "scholarship", "fee", "document"],
    "important-dates": ["deadline", "date", "event", "meeting"],
    communications: ["message", "communication", "notice", "announcement"],
    resources: ["resource", "guide"],
    alerts: ["alert", "urgent", "warning", "missing"],
    profile: ["profile", "account", "settings"]
  }
};

const ROLE_DEFAULT_SECTION: Record<DashboardRole, string> = {
  student: "home",
  admin: "overview",
  faculty: "overview",
  mentor: "mentor-home",
  donor: "partner-home",
  employer: "employer-home",
  ngo: "organization-home",
  parent: "parent-home"
};

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

function roleTypeHint(role: DashboardRole, type: string): string | undefined {
  const normalizedType = normalize(type);
  if (!normalizedType) return undefined;
  if (normalizedType.includes("mentorship")) {
    if (role === "student") return "mentorship";
    if (role === "admin" || role === "faculty") return "mentorship-program";
    if (role === "mentor") return "sessions";
  }
  if (normalizedType.includes("financial") || normalizedType.includes("aid")) {
    if (role === "student") return "financial-aid";
    if (role === "admin" || role === "faculty") return "financial-oversight";
    if (role === "parent") return "financial-overview";
    if (role === "ngo") return "funding";
    if (role === "donor") return "donations";
  }
  if (normalizedType.includes("career")) {
    if (role === "student") return "career";
    if (role === "mentor") return "career-insights";
    if (role === "admin" || role === "faculty") return "career-services";
    if (role === "employer") return "job-listings";
  }
  if (normalizedType.includes("wellness") || normalizedType.includes("counsel")) {
    if (role === "admin" || role === "faculty") return "counselor-support";
    if (role === "student") return "wellness";
  }
  if (normalizedType.includes("message") || normalizedType.includes("communication")) {
    if (role === "student" || role === "admin" || role === "faculty") return "communications";
    if (role === "mentor") return "messages";
    if (role === "donor" || role === "ngo" || role === "parent") return "communications";
  }
  return undefined;
}

export function getNotificationSectionId(
  role: DashboardRole,
  notification: DashboardNotification,
  validSectionIds: Set<string>
): string | undefined {
  if (notification.sectionId && validSectionIds.has(notification.sectionId)) {
    return notification.sectionId;
  }

  const hintedByType = roleTypeHint(role, notification.type ?? "");
  if (hintedByType && validSectionIds.has(hintedByType)) {
    return hintedByType;
  }

  const haystack = `${normalize(notification.type)} ${normalize(notification.title)} ${normalize(notification.message)}`;
  const sectionKeywords = ROLE_SECTION_KEYWORDS[role];

  for (const [sectionId, keywords] of Object.entries(sectionKeywords)) {
    if (!validSectionIds.has(sectionId)) continue;
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return sectionId;
    }
  }

  const fallback = ROLE_DEFAULT_SECTION[role];
  return validSectionIds.has(fallback) ? fallback : undefined;
}

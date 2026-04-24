/* -----------------------------------------------------------------
   NGO Demo Store
   Module‑level mutable arrays that act as an in‑memory data layer
   when the app runs in demo mode (no MongoDB).  Follows the same
   pattern used by wellness-demo-store, campus-life-demo-store, etc.
   Added: localStorage persistence to survive page refreshes.
   ----------------------------------------------------------------- */

const STORAGE_KEY = "unicare_ngo_store_v3";


function saveToStorage() {
  if (typeof window === "undefined") return;
  const data = {
    programs,
    beneficiaries,
    ngoVerificationNotifications,
    fundingRecords,
    partnerships,
    communications,
    reports,
    impactStories,
    applications,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (data.programs) programs = data.programs;
    if (data.beneficiaries) beneficiaries = data.beneficiaries;
    if (data.ngoVerificationNotifications) ngoVerificationNotifications = data.ngoVerificationNotifications;
    if (data.fundingRecords) fundingRecords = data.fundingRecords;
    if (data.partnerships) partnerships = data.partnerships;
    if (data.communications) communications = data.communications;
    if (data.reports) reports = data.reports;
    if (data.impactStories) impactStories = data.impactStories;
    if (data.applications) applications = data.applications;
  } catch (e) {
    console.error("Failed to load NGO store", e);
  }
}

// ─── Types ───────────────────────────────────────────────────────

export type NgoProgram = {
  _id: string;
  title: string;
  description: string;
  category: "education" | "health" | "emergency" | "equipment" | "general";
  status: "active" | "paused" | "completed" | "draft";
  budget: number;
  disbursed: number;
  beneficiaryCount: number;
  eligibility: string;
  targetUniversity: string;
  /** Connected parties for this program */
  connectedTo: ("student" | "admin")[];
  createdAt: string;
  updatedAt: string;
};

export type NgoBeneficiary = {
  _id: string;
  programId: string;
  programTitle: string;
  initials: string;
  university: string;
  status: "active" | "graduated" | "paused";
  supportReceived: number;
  supportRequested: number;
  isDisbursed: boolean;
  retentionIndicator: "on-track" | "at-risk" | "graduated";
  enrolledAt: string;
  consentRecorded: boolean;
  applicationId?: string;
  lastDisbursedAmount?: number;
  lastDisbursedAt?: string;
};

export type NgoVerificationNotification = {
  _id: string;
  applicationId: string;
  programId: string;
  programTitle: string;
  studentInitials: string;
  university: string;
  amountRequested: number;
  createdAt: string;
  readAt?: string;
};

export type NgoDisbursementNotification = {
  _id: string;
  ngoName: string;
  beneficiaryInitials: string;
  university: string;
  programTitle: string;
  amount: number;
  date: string;
};

export type NgoFundingRecord = {
  _id: string;
  donorName: string;
  donorType: "corporate" | "individual" | "government";
  amount: number;
  allocatedTo: string; // program title
  programId: string;
  status: "received" | "allocated" | "disbursed" | "pending";
  date: string;
};

export type NgoPartnership = {
  _id: string;
  partnerName: string;
  partnerType: "admin" | "donor";
  role: string;
  status: "active" | "pending" | "completed" | "canceled";

  focusArea: string;
  jointInitiatives: string[];
  since: string;
  partnerUserId?: string;
};


export type NgoCommunication = {
  _id: string;
  audience: "beneficiaries" | "donors" | "all-applicants" | "direct-message";
  recipientId?: string; // For direct messages to specific admins/donors
  recipientName?: string;
  type: "program-update" | "newsletter" | "feedback-request" | "awareness-campaign" | "direct-message";
  subject: string;
  message: string;
  recipientCount: number;
  readRate: number; // 0-100
  sentAt: string;
};


export type NgoReport = {
  _id: string;
  title: string;
  description: string;
  audience: "donors" | "admin" | "both";
  lastGenerated: string | null;
  metrics: {
    studentsHelped: number;
    fundsUtilized: number;
    retentionRate: number;
    programsActive: number;
  };
};

export type NgoImpactStory = {
  _id: string;
  title: string;
  summary: string;
  connectedParty: "student" | "admin" | "donor";
  date: string;
};

export type NgoApplication = {
  _id: string;
  studentId: string;
  studentInitials: string;
  university: string;
  programId: string;
  programTitle: string;
  amountRequested: number;
  reason: string;
  status: "pending_admin" | "verified_by_admin" | "approved_by_ngo" | "rejected";
  appliedAt: string;
};

// ─── Seed data (CLEAN SLATE) ─────────────────────────────────────

const nowIso = new Date().toISOString();

let programs: NgoProgram[] = [
  {
    _id: "np1",
    title: "Mahapola Scholarship Support",
    description: "Monthly financial aid for low-income university students.",
    category: "education",
    status: "active",
    budget: 5000000,
    disbursed: 1250000,
    beneficiaryCount: 85,
    eligibility: "GPA > 3.0, Household income < 500k/yr",
    targetUniversity: "All National Universities",
    connectedTo: ["student", "admin"],
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    _id: "np2",
    title: "HEI Emergency Fund",
    description: "One-time grants for students facing sudden financial crisis.",
    category: "emergency",
    status: "active",
    budget: 2000000,
    disbursed: 450000,
    beneficiaryCount: 24,
    eligibility: "Documented emergency (medical, loss of guardian)",
    targetUniversity: "University of Colombo, UOM",
    connectedTo: ["student", "admin"],
    createdAt: nowIso,
    updatedAt: nowIso,
  }
];

let beneficiaries: NgoBeneficiary[] = [
  {
    _id: "nb1",
    programId: "np1",
    programTitle: "Mahapola Scholarship Support",
    initials: "A.B.C.",
    university: "University of Colombo",
    status: "active",
    supportReceived: 45000,
    supportRequested: 180000,
    isDisbursed: true,
    retentionIndicator: "on-track",
    enrolledAt: nowIso,
    consentRecorded: true,
  },
  {
    _id: "nb2",
    programId: "np2",
    programTitle: "HEI Emergency Fund",
    initials: "S.T.R.",
    university: "University of Moratuwa",
    status: "active",
    supportReceived: 25000,
    supportRequested: 25000,
    isDisbursed: true,
    retentionIndicator: "on-track",
    enrolledAt: nowIso,
    consentRecorded: false,
  }
];

let ngoVerificationNotifications: NgoVerificationNotification[] = [];
let disbursementNotifications: NgoDisbursementNotification[] = [];
let fundingRecords: NgoFundingRecord[] = [
  {
    _id: "nf1",
    donorName: "Ministry of Higher Education",
    donorType: "government",
    amount: 3500000,
    allocatedTo: "Mahapola Scholarship Support",
    programId: "np1",
    status: "received",
    date: nowIso,
  },
  {
    _id: "nf2",
    donorName: "University Grants Commission",
    donorType: "government",
    amount: 1500000,
    allocatedTo: "HEI Emergency Fund",
    programId: "np2",
    status: "received",
    date: nowIso,
  },
  {
    _id: "nf3",
    donorName: "Dialog Axiata",
    donorType: "corporate",
    amount: 1000000,
    allocatedTo: "Mahapola Scholarship Support",
    programId: "np1",
    status: "allocated",
    date: nowIso,
  }
];

let partnerships: NgoPartnership[] = [];
let communications: NgoCommunication[] = [];
let reports: NgoReport[] = [];
let impactStories: NgoImpactStory[] = [
  {
    _id: "is1",
    title: "Mahapola Support Success",
    summary: "Sajini Perera was able to complete her semester thanks to timely Mahapola disbursement.",
    connectedParty: "student",
    date: nowIso,
  },
  {
    _id: "is2",
    title: "HEI Emergency Grant Impact",
    summary: "A student from UOM received emergency medical support within 24 hours.",
    connectedParty: "admin",
    date: nowIso,
  }
];

let applications: NgoApplication[] = [];

// ─── Accessors ───────────────────────────────────────────────────

export function getNgoPrograms() { return programs; }
export function getNgoBeneficiaries() { return beneficiaries; }
export function getNgoVerificationNotifications() { return ngoVerificationNotifications; }
export function getNgoFundingRecords(): NgoFundingRecord[] {
  return [...fundingRecords];
}

export function updateNgoFundingStatus(id: string, status: "pending" | "allocated" | "disbursed") {
  const index = fundingRecords.findIndex((r) => r._id === id);
  if (index !== -1) {
    fundingRecords[index] = { ...fundingRecords[index], status };
    saveToStorage();
  }
}

export function getNgoPartnerships() { return partnerships; }
export function updateNgoPartnership(id: string, updates: Partial<NgoPartnership>) {
  const idx = partnerships.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  const updated = { ...partnerships[idx], ...updates };
  partnerships = partnerships.slice();
  partnerships[idx] = updated;
  saveToStorage();
  return updated;
}

export function deleteNgoPartnership(id: string) {
  partnerships = partnerships.filter((p) => p._id !== id);
  saveToStorage();
}

/**
 * Simulates fetching existing users from the system that are available for partnership.
 * In a real app, this would query the MongoDB 'users' collection.
 */
export function getEligiblePartners() {
  return [
    { _id: "u3", name: "University of Peradeniya Admin", role: "admin", university: "University of Peradeniya" },
    { _id: "u4", name: "UOM Welfare Office", role: "admin", university: "University of Moratuwa" },
    { _id: "u5", name: "Dialog Axiata CSR", role: "donor", university: "N/A" },
    { _id: "u6", name: "Hayleys Group Philanthropy", role: "donor", university: "N/A" },
    { _id: "u7", name: "Faculty of IT - UOM", role: "admin", university: "University of Moratuwa" },
    { _id: "u8", name: "Standard Chartered Bank", role: "donor", university: "N/A" },
  ];
}

export function getIncomingPartnershipRequests(userId: string) {
  return partnerships.filter((p) => p.partnerUserId === userId && p.status === "pending");
}

export function acceptNgoPartnership(id: string) {
  const idx = partnerships.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  partnerships[idx] = { ...partnerships[idx], status: "active" };
  saveToStorage();
  return partnerships[idx];
}

export function rejectNgoPartnership(id: string) {
  const idx = partnerships.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  partnerships[idx] = { ...partnerships[idx], status: "canceled" };
  saveToStorage();
  return partnerships[idx];
}

export function getNgoCommunications() { return communications; }

export function getNgoCommunicationsForUser(userId: string, role: string) {
  return communications.filter(c => {
    if (c.audience === "direct-message" && c.recipientId === userId) return true;
    if (c.audience === "donors" && (role === "donor")) return true;
    if (c.audience === "beneficiaries" && role === "student") return true;
    // Admins usually see everything related to programs
    if (c.audience === "beneficiaries" && (role === "admin" || role === "faculty")) return true;
    return false;
  });
}




export function getNgoReports() { return reports; }
export function getNgoImpactStories() { return impactStories; }
export function getNgoApplications() { return applications; }
export function getAdminNotifications() { return disbursementNotifications; }

export function markNgoVerificationNotificationRead(notificationId: string) {
  const idx = ngoVerificationNotifications.findIndex((item) => item._id === notificationId);
  if (idx === -1) return null;
  const next = {
    ...ngoVerificationNotifications[idx],
    readAt: ngoVerificationNotifications[idx].readAt ?? new Date().toISOString()
  };
  ngoVerificationNotifications = ngoVerificationNotifications.slice();
  ngoVerificationNotifications[idx] = next;
  saveToStorage();
  return next;
}

export function markNgoVerificationNotificationsReadByApplication(applicationId: string) {
  let changed = false;
  ngoVerificationNotifications = ngoVerificationNotifications.map((item) => {
    if (item.applicationId !== applicationId || item.readAt) return item;
    changed = true;
    return { ...item, readAt: new Date().toISOString() };
  });
  if (changed) saveToStorage();
}

export function markAllNgoVerificationNotificationsRead() {
  let changed = false;
  ngoVerificationNotifications = ngoVerificationNotifications.map((item) => {
    if (item.readAt) return item;
    changed = true;
    return { ...item, readAt: new Date().toISOString() };
  });
  if (changed) saveToStorage();
}

// ─── Mutators ────────────────────────────────────────────────────

export function addNgoProgram(input: Omit<NgoProgram, "_id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const item: NgoProgram = { ...input, _id: `np${Date.now()}`, createdAt: now, updatedAt: now };
  programs = [item, ...programs];
  saveToStorage();
  return item;
}

export function updateNgoProgram(id: string, updates: Partial<NgoProgram>) {
  const idx = programs.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  const updated = { ...programs[idx], ...updates, updatedAt: new Date().toISOString() };
  programs = programs.slice();
  programs[idx] = updated;
  saveToStorage();
  return updated;
}

export function deleteNgoProgram(id: string) {
  programs = programs.filter((p) => p._id !== id);
  saveToStorage();
}

export function addNgoBeneficiary(input: Omit<NgoBeneficiary, "_id">) {
  const item: NgoBeneficiary = { ...input, _id: `nb${Date.now()}` };
  beneficiaries = [item, ...beneficiaries];
  // Increment program beneficiary count
  const pIdx = programs.findIndex((p) => p._id === input.programId);
  if (pIdx !== -1) {
    programs = programs.slice();
    programs[pIdx] = { ...programs[pIdx], beneficiaryCount: programs[pIdx].beneficiaryCount + 1 };
  }
  saveToStorage();
  return item;
}

export function addNgoFundingRecord(input: Omit<NgoFundingRecord, "_id">) {
  const item: NgoFundingRecord = { ...input, _id: `nf${Date.now()}` };
  fundingRecords = [item, ...fundingRecords];
  saveToStorage();
  return item;
}

export function addNgoPartnership(input: Omit<NgoPartnership, "_id">) {
  const item: NgoPartnership = { ...input, _id: `npa${Date.now()}` };
  partnerships = [item, ...partnerships];
  saveToStorage();
  return item;
}

export function addNgoCommunication(input: Omit<NgoCommunication, "_id">) {
  const item: NgoCommunication = { ...input, _id: `nc${Date.now()}` };
  communications = [item, ...communications];
  saveToStorage();
  return item;
}

export function markReportGenerated(id: string) {
  const idx = reports.findIndex((r) => r._id === id);
  if (idx === -1) return null;
  // Recompute metrics from current data
  const activeProgs = programs.filter((p) => p.status === "active");
  const totalBeneficiaries = beneficiaries.filter((b) => b.status !== "paused").length;
  const totalDisbursed = programs.reduce((sum, p) => sum + p.disbursed, 0);
  const onTrack = beneficiaries.filter((b) => b.retentionIndicator === "on-track" || b.retentionIndicator === "graduated").length;
  const retentionRate = beneficiaries.length > 0 ? Math.round((onTrack / beneficiaries.length) * 100) : 0;

  const updated: NgoReport = {
    ...reports[idx],
    lastGenerated: new Date().toISOString(),
    metrics: {
      studentsHelped: totalBeneficiaries,
      fundsUtilized: totalDisbursed,
      retentionRate,
      programsActive: activeProgs.length
    }
  };
  reports = reports.slice();
  reports[idx] = updated;
  saveToStorage();
  return updated;
}

export function disburseNgoPayment(id: string) {
  const bIdx = beneficiaries.findIndex((b) => b._id === id);
  if (bIdx === -1) return null;
  const b = beneficiaries[bIdx];
  if (b.isDisbursed) return null;

  // 1. Update beneficiary
  const amountToDisburse = b.supportRequested - b.supportReceived;
  if (amountToDisburse <= 0) return null;
  const updatedBeneficiary = {
    ...b,
    supportReceived: b.supportRequested,
    isDisbursed: true,
    status: "active" as const,
    lastDisbursedAmount: amountToDisburse,
    lastDisbursedAt: new Date().toISOString()
  };
  beneficiaries = beneficiaries.slice();
  beneficiaries[bIdx] = updatedBeneficiary;

  // 2. Update program disbursement
  const pIdx = programs.findIndex((p) => p._id === b.programId);
  if (pIdx !== -1) {
    programs = programs.slice();
    programs[pIdx] = {
      ...programs[pIdx],
      disbursed: (programs[pIdx].disbursed || 0) + amountToDisburse
    };
  }

  // 3. Create notification for University Admin
  const notification: NgoDisbursementNotification = {
    _id: `ndn${Date.now()}`,
    ngoName: "Hope Foundation (YOU)",
    beneficiaryInitials: b.initials,
    university: b.university,
    programTitle: b.programTitle,
    amount: amountToDisburse,
    date: new Date().toISOString()
  };
  disbursementNotifications = [notification, ...disbursementNotifications];
  if (b.applicationId) {
    markNgoVerificationNotificationsReadByApplication(b.applicationId);
  }

  saveToStorage();
  return updatedBeneficiary;
}

export function addNgoApplication(input: Omit<NgoApplication, "_id" | "status" | "appliedAt">) {
  const item: NgoApplication = {
    ...input,
    _id: `napp${Date.now()}`,
    status: "pending_admin",
    appliedAt: new Date().toISOString()
  };
  applications = [item, ...applications];
  saveToStorage();
  return item;
}

export function updateNgoApplicationStatus(id: string, status: NgoApplication["status"]) {
  const idx = applications.findIndex((a) => a._id === id);
  if (idx === -1) return null;
  const updated = { ...applications[idx], status };
  applications = applications.slice();
  applications[idx] = updated;

  // When university admin verifies, notify NGO and add beneficiary once.
  if (status === "verified_by_admin") {
    const existingNotification = ngoVerificationNotifications.find((item) => item.applicationId === updated._id);
    if (!existingNotification) {
      const notification: NgoVerificationNotification = {
        _id: `nver${Date.now()}`,
        applicationId: updated._id,
        programId: updated.programId,
        programTitle: updated.programTitle,
        studentInitials: updated.studentInitials || "St.U.",
        university: updated.university || "University",
        amountRequested: updated.amountRequested > 0 ? updated.amountRequested : 0,
        createdAt: new Date().toISOString()
      };
      ngoVerificationNotifications = [notification, ...ngoVerificationNotifications];
    }
  }

  // If approved by admin OR NGO, automatically add to beneficiaries if not already there.
  if (status === "approved_by_ngo" || status === "verified_by_admin") {
    const exists = beneficiaries.some(b => b.programId === updated.programId && b.initials === updated.studentInitials);
    if (!exists) {
      addNgoBeneficiary({
        programId: updated.programId,
        programTitle: updated.programTitle,
        initials: updated.studentInitials || "St.U.",
        university: updated.university || "University",
        status: "active",
        supportReceived: 0,
        supportRequested: updated.amountRequested > 0 ? updated.amountRequested : 0,
        isDisbursed: false,
        retentionIndicator: "on-track",
        enrolledAt: new Date().toISOString(),
        consentRecorded: false,
        applicationId: updated._id
      });
    }
  }
  saveToStorage();
  return updated;
}

// ─── Computed summaries ──────────────────────────────────────────

export function getNgoSummaryStats() {
  const activeProgs = programs.filter((p) => p.status === "active").length;
  const totalBeneficiaries = beneficiaries.filter((b) => b.status !== "paused").length;
  const totalBudget = programs.reduce((s, p) => s + p.budget, 0);
  const totalDonorContributions = fundingRecords.reduce((s, f) => s + f.amount, 0);
  const totalDisbursed = programs.reduce((s, p) => s + p.disbursed, 0);
  const pendingAllocations = fundingRecords.filter((f) => f.status === "pending" || f.status === "received").length;
  const onTrack = beneficiaries.filter((b) => b.retentionIndicator === "on-track" || b.retentionIndicator === "graduated").length;
  const retentionRate = beneficiaries.length > 0 ? Math.round((onTrack / beneficiaries.length) * 100) : 0;
  return { activeProgs, totalBeneficiaries, totalBudget, totalDonorContributions, totalDisbursed, pendingAllocations, retentionRate };
}

// ─── Initialization ──────────────────────────────────────────────

loadFromStorage();

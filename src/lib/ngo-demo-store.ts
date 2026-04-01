/* -----------------------------------------------------------------
   NGO Demo Store
   Module‑level mutable arrays that act as an in‑memory data layer
   when the app runs in demo mode (no MongoDB).  Follows the same
   pattern used by wellness-demo-store, campus-life-demo-store, etc.
   ----------------------------------------------------------------- */

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
  retentionIndicator: "on-track" | "at-risk" | "graduated";
  enrolledAt: string;
  consentRecorded: boolean;
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
  status: "active" | "pending" | "completed";
  focusArea: string;
  jointInitiatives: string[];
  since: string;
};

export type NgoCommunication = {
  _id: string;
  audience: "beneficiaries" | "donors" | "all-applicants";
  type: "program-update" | "newsletter" | "feedback-request" | "awareness-campaign";
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
  programId: string;
  programTitle: string;
  amountRequested: number;
  reason: string;
  status: "pending_admin" | "verified_by_admin" | "approved_by_ngo" | "rejected";
  appliedAt: string;
};

// ─── Seed data ───────────────────────────────────────────────────

let programs: NgoProgram[] = [
  {
    _id: "np1",
    title: "Emergency Tuition Relief Fund",
    description: "Provides emergency financial assistance to students at risk of dropping out due to unpaid tuition fees.",
    category: "emergency",
    status: "active",
    budget: 2500000,
    disbursed: 1750000,
    beneficiaryCount: 42,
    eligibility: "Financial need level: High · GPA ≥ 2.5",
    targetUniversity: "University of Colombo",
    connectedTo: ["student", "admin"],
    createdAt: "2025-08-15T09:00:00Z",
    updatedAt: "2026-03-20T14:30:00Z"
  },
  {
    _id: "np2",
    title: "Digital Equipment Support",
    description: "Supplies laptops and internet dongles to students from low-income families who need digital access for studies.",
    category: "equipment",
    status: "active",
    budget: 1800000,
    disbursed: 900000,
    beneficiaryCount: 28,
    eligibility: "First-year students · Household income below threshold",
    targetUniversity: "University of Moratuwa",
    connectedTo: ["student", "admin"],
    createdAt: "2025-09-01T10:00:00Z",
    updatedAt: "2026-02-10T08:00:00Z"
  },
  {
    _id: "np3",
    title: "Student Wellness Initiative",
    description: "Fund counseling sessions and wellness workshops for students facing mental health challenges during exams.",
    category: "health",
    status: "active",
    budget: 800000,
    disbursed: 350000,
    beneficiaryCount: 65,
    eligibility: "All registered students",
    targetUniversity: "University of Peradeniya",
    connectedTo: ["student", "admin"],
    createdAt: "2025-11-10T11:00:00Z",
    updatedAt: "2026-03-15T09:30:00Z"
  },
  {
    _id: "np4",
    title: "Boarding Support Scholarship",
    description: "Monthly stipend for students who need accommodation support near campus.",
    category: "education",
    status: "paused",
    budget: 1200000,
    disbursed: 1200000,
    beneficiaryCount: 18,
    eligibility: "Students from rural areas · Distance > 50km",
    targetUniversity: "University of Kelaniya",
    connectedTo: ["student", "admin"],
    createdAt: "2025-06-01T08:00:00Z",
    updatedAt: "2026-01-30T16:00:00Z"
  }
];

let beneficiaries: NgoBeneficiary[] = [
  { _id: "nb1", programId: "np1", programTitle: "Emergency Tuition Relief Fund", initials: "A.P.", university: "University of Colombo", status: "active", supportReceived: 75000, retentionIndicator: "on-track", enrolledAt: "2025-09-12T00:00:00Z", consentRecorded: true },
  { _id: "nb2", programId: "np1", programTitle: "Emergency Tuition Relief Fund", initials: "K.S.", university: "University of Colombo", status: "active", supportReceived: 60000, retentionIndicator: "on-track", enrolledAt: "2025-10-01T00:00:00Z", consentRecorded: true },
  { _id: "nb3", programId: "np2", programTitle: "Digital Equipment Support", initials: "M.R.", university: "University of Moratuwa", status: "active", supportReceived: 45000, retentionIndicator: "on-track", enrolledAt: "2025-09-20T00:00:00Z", consentRecorded: false },
  { _id: "nb4", programId: "np2", programTitle: "Digital Equipment Support", initials: "T.D.", university: "University of Moratuwa", status: "graduated", supportReceived: 45000, retentionIndicator: "graduated", enrolledAt: "2025-09-20T00:00:00Z", consentRecorded: true },
  { _id: "nb5", programId: "np3", programTitle: "Student Wellness Initiative", initials: "N.W.", university: "University of Peradeniya", status: "active", supportReceived: 12000, retentionIndicator: "at-risk", enrolledAt: "2026-01-05T00:00:00Z", consentRecorded: false },
  { _id: "nb6", programId: "np4", programTitle: "Boarding Support Scholarship", initials: "S.J.", university: "University of Kelaniya", status: "paused", supportReceived: 90000, retentionIndicator: "on-track", enrolledAt: "2025-07-15T00:00:00Z", consentRecorded: true },
  { _id: "nb7", programId: "np1", programTitle: "Emergency Tuition Relief Fund", initials: "D.F.", university: "University of Colombo", status: "active", supportReceived: 50000, retentionIndicator: "at-risk", enrolledAt: "2026-02-10T00:00:00Z", consentRecorded: true },
];

let fundingRecords: NgoFundingRecord[] = [
  { _id: "nf1", donorName: "Lanka CSR Foundation", donorType: "corporate", amount: 1500000, allocatedTo: "Emergency Tuition Relief Fund", programId: "np1", status: "disbursed", date: "2025-08-20T00:00:00Z" },
  { _id: "nf2", donorName: "Tech for Lanka Trust", donorType: "corporate", amount: 1200000, allocatedTo: "Digital Equipment Support", programId: "np2", status: "allocated", date: "2025-09-05T00:00:00Z" },
  { _id: "nf3", donorName: "Dr. Amal Perera", donorType: "individual", amount: 300000, allocatedTo: "Emergency Tuition Relief Fund", programId: "np1", status: "disbursed", date: "2025-10-12T00:00:00Z" },
  { _id: "nf4", donorName: "Ministry of Education Grant", donorType: "government", amount: 800000, allocatedTo: "Student Wellness Initiative", programId: "np3", status: "received", date: "2026-01-15T00:00:00Z" },
  { _id: "nf5", donorName: "Lanka CSR Foundation", donorType: "corporate", amount: 600000, allocatedTo: "Digital Equipment Support", programId: "np2", status: "pending", date: "2026-03-01T00:00:00Z" },
  { _id: "nf6", donorName: "Alumni Association", donorType: "individual", amount: 400000, allocatedTo: "Boarding Support Scholarship", programId: "np4", status: "disbursed", date: "2025-07-10T00:00:00Z" },
];

let partnerships: NgoPartnership[] = [
  {
    _id: "npa1",
    partnerName: "University of Colombo — Student Affairs",
    partnerType: "admin",
    role: "Joint program design & student verification",
    status: "active",
    focusArea: "Emergency relief & tuition support",
    jointInitiatives: ["Tuition Relief 2025", "Exam-period emergency fund"],
    since: "2025-06-01T00:00:00Z"
  },
  {
    _id: "npa2",
    partnerName: "Lanka CSR Foundation",
    partnerType: "donor",
    role: "Co-funded scholarships and equipment donations",
    status: "active",
    focusArea: "Digital equity & financial aid",
    jointInitiatives: ["Digital Equipment 2025", "Emergency Fund top-up"],
    since: "2025-08-01T00:00:00Z"
  },
  {
    _id: "npa3",
    partnerName: "University of Moratuwa — Dean's Office",
    partnerType: "admin",
    role: "Eligibility verification & distribution monitoring",
    status: "active",
    focusArea: "Equipment distribution & tracking",
    jointInitiatives: ["Laptop distribution Q4-2025"],
    since: "2025-09-01T00:00:00Z"
  },
  {
    _id: "npa4",
    partnerName: "Tech for Lanka Trust",
    partnerType: "donor",
    role: "Technology sponsorship for student equipment",
    status: "pending",
    focusArea: "Hardware donations",
    jointInitiatives: [],
    since: "2026-02-15T00:00:00Z"
  }
];

let communications: NgoCommunication[] = [
  {
    _id: "nc1",
    audience: "beneficiaries",
    type: "program-update",
    subject: "Tuition Relief Fund — March disbursement complete",
    message: "All approved students for the March cycle have received their tuition support. If you haven't received funds, please contact the student affairs office.",
    recipientCount: 42,
    readRate: 78,
    sentAt: "2026-03-22T10:00:00Z"
  },
  {
    _id: "nc2",
    audience: "donors",
    type: "newsletter",
    subject: "Q1 2026 Impact Update",
    message: "In Q1 2026, your contributions helped 135 students stay enrolled across 3 universities. Retention rate improved to 94%. Read the full impact report attached.",
    recipientCount: 8,
    readRate: 100,
    sentAt: "2026-03-30T08:00:00Z"
  },
  {
    _id: "nc3",
    audience: "beneficiaries",
    type: "awareness-campaign",
    subject: "Exam season wellness resources",
    message: "Exam period can be stressful. We've partnered with university counseling centers to offer free sessions. Visit your campus wellness center or book online.",
    recipientCount: 135,
    readRate: 62,
    sentAt: "2026-03-15T09:00:00Z"
  }
];

let reports: NgoReport[] = [
  {
    _id: "nr1",
    title: "Program Impact Summary",
    description: "Reach, retention indicators, and key outcomes across all active programs.",
    audience: "both",
    lastGenerated: "2026-03-25T14:00:00Z",
    metrics: { studentsHelped: 135, fundsUtilized: 4200000, retentionRate: 94, programsActive: 3 }
  },
  {
    _id: "nr2",
    title: "Fund Utilization & Compliance",
    description: "Allocation vs. disbursement, outstanding balances, and audit-ready breakdown.",
    audience: "donors",
    lastGenerated: "2026-03-20T10:00:00Z",
    metrics: { studentsHelped: 135, fundsUtilized: 4200000, retentionRate: 94, programsActive: 3 }
  },
  {
    _id: "nr3",
    title: "Beneficiary Outcomes Report",
    description: "Academic retention, graduation rates, and support effectiveness per program.",
    audience: "admin",
    lastGenerated: null,
    metrics: { studentsHelped: 135, fundsUtilized: 4200000, retentionRate: 94, programsActive: 3 }
  },
  {
    _id: "nr4",
    title: "Annual Impact Report 2025",
    description: "Full-year summary of programs, partnerships, funding, and student impact.",
    audience: "both",
    lastGenerated: "2026-01-15T09:00:00Z",
    metrics: { studentsHelped: 210, fundsUtilized: 6300000, retentionRate: 91, programsActive: 4 }
  }
];

let impactStories: NgoImpactStory[] = [
  { _id: "nis1", title: "Keeping students enrolled during crisis", summary: "Emergency stipends helped 42 students from low-income families continue their studies at University of Colombo.", connectedParty: "student", date: "2026-03-18T00:00:00Z" },
  { _id: "nis2", title: "Digital equity for rural students", summary: "28 laptops distributed to first-year students at UoM, enabling full participation in online coursework.", connectedParty: "donor", date: "2026-02-25T00:00:00Z" },
  { _id: "nis3", title: "Admin partnership reduces dropout risk", summary: "Joint verification with UoC Student Affairs reduced processing time from 3 weeks to 5 days.", connectedParty: "admin", date: "2026-01-20T00:00:00Z" },
  { _id: "nis4", title: "Wellness support during exam season", summary: "65 students accessed funded counseling sessions, with 89% reporting reduced anxiety.", connectedParty: "student", date: "2026-03-28T00:00:00Z" }
];

let applications: NgoApplication[] = [
  { _id: "napp1", studentId: "std123", programId: "np1", programTitle: "Emergency Tuition Relief Fund", amountRequested: 50000, reason: "Unable to pay final semester tuition", status: "pending_admin", appliedAt: "2026-03-28T10:00:00Z" },
  { _id: "napp2", studentId: "std456", programId: "np2", programTitle: "Digital Equipment Support", amountRequested: 0, reason: "Need laptop for IT coursework", status: "verified_by_admin", appliedAt: "2026-03-25T09:00:00Z" }
];

// ─── Accessors ───────────────────────────────────────────────────

export function getNgoPrograms() { return programs; }
export function getNgoBeneficiaries() { return beneficiaries; }
export function getNgoFundingRecords(): NgoFundingRecord[] {
  return [...fundingRecords];
}

export function updateNgoFundingStatus(id: string, status: "pending" | "allocated" | "disbursed") {
  const index = fundingRecords.findIndex((r) => r._id === id);
  if (index !== -1) {
    fundingRecords[index] = { ...fundingRecords[index], status };
  }
}

export function getNgoPartnerships() { return partnerships; }
export function getNgoCommunications() { return communications; }
export function getNgoReports() { return reports; }
export function getNgoImpactStories() { return impactStories; }
export function getNgoApplications() { return applications; }

// ─── Mutators ────────────────────────────────────────────────────

export function addNgoProgram(input: Omit<NgoProgram, "_id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const item: NgoProgram = { ...input, _id: `np${Date.now()}`, createdAt: now, updatedAt: now };
  programs = [item, ...programs];
  return item;
}

export function updateNgoProgram(id: string, updates: Partial<NgoProgram>) {
  const idx = programs.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  const updated = { ...programs[idx], ...updates, updatedAt: new Date().toISOString() };
  programs = programs.slice();
  programs[idx] = updated;
  return updated;
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
  return item;
}

export function addNgoFundingRecord(input: Omit<NgoFundingRecord, "_id">) {
  const item: NgoFundingRecord = { ...input, _id: `nf${Date.now()}` };
  fundingRecords = [item, ...fundingRecords];
  return item;
}

export function addNgoPartnership(input: Omit<NgoPartnership, "_id">) {
  const item: NgoPartnership = { ...input, _id: `npa${Date.now()}` };
  partnerships = [item, ...partnerships];
  return item;
}

export function addNgoCommunication(input: Omit<NgoCommunication, "_id">) {
  const item: NgoCommunication = { ...input, _id: `nc${Date.now()}` };
  communications = [item, ...communications];
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
  return updated;
}

export function addNgoApplication(input: Omit<NgoApplication, "_id" | "status" | "appliedAt">) {
  const item: NgoApplication = {
    ...input,
    _id: `napp${Date.now()}`,
    status: "pending_admin",
    appliedAt: new Date().toISOString()
  };
  applications = [item, ...applications];
  return item;
}

export function updateNgoApplicationStatus(id: string, status: NgoApplication["status"]) {
  const idx = applications.findIndex((a) => a._id === id);
  if (idx === -1) return null;
  const updated = { ...applications[idx], status };
  applications = applications.slice();
  applications[idx] = updated;

  // If approved, automatically add to beneficiaries
  if (status === "approved_by_ngo") {
    addNgoBeneficiary({
      programId: updated.programId,
      programTitle: updated.programTitle,
      initials: "St.U.", // Mock initials
      university: "University",
      status: "active",
      supportReceived: updated.amountRequested > 0 ? updated.amountRequested : 0,
      retentionIndicator: "on-track",
      enrolledAt: new Date().toISOString(),
      consentRecorded: false
    });
  }

  return updated;
}

// ─── Computed summaries ──────────────────────────────────────────

export function getNgoSummaryStats() {
  const activeProgs = programs.filter((p) => p.status === "active").length;
  const totalBeneficiaries = beneficiaries.filter((b) => b.status !== "paused").length;
  const totalFundsReceived = fundingRecords.reduce((s, f) => s + f.amount, 0);
  const totalDisbursed = programs.reduce((s, p) => s + p.disbursed, 0);
  const pendingAllocations = fundingRecords.filter((f) => f.status === "pending" || f.status === "received").length;
  const onTrack = beneficiaries.filter((b) => b.retentionIndicator === "on-track" || b.retentionIndicator === "graduated").length;
  const retentionRate = beneficiaries.length > 0 ? Math.round((onTrack / beneficiaries.length) * 100) : 0;
  return { activeProgs, totalBeneficiaries, totalFundsReceived, totalDisbursed, pendingAllocations, retentionRate };
}

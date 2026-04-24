type EmployerOwned = {
  employerUserId?: string;
  employerFirebaseUid?: string;
};

export type DemoEmployerApplicant = EmployerOwned & {
  _id: string;
  jobId?: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  university?: string;
  department?: string;
  graduationYear?: string;
  skills: string[];
  status: "new" | "shortlisted" | "interview" | "offered" | "rejected";
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type DemoEmployerTalentProfile = EmployerOwned & {
  _id: string;
  sourceApplicantId?: string;
  fullName: string;
  email: string;
  university?: string;
  department?: string;
  graduationYear?: string;
  skills: string[];
  experienceLevel?: "entry" | "intermediate" | "advanced";
  portfolioUrl?: string;
  status: "saved" | "contacted" | "in-process";
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type DemoEmployerInterview = EmployerOwned & {
  _id: string;
  applicantId?: string;
  candidateName: string;
  candidateEmail?: string;
  jobId?: string;
  jobTitle?: string;
  interviewDate: string;
  interviewTime: string;
  mode: "virtual" | "on-site" | "phone";
  locationOrLink?: string;
  instructions?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type DemoEmployerCampusEvent = EmployerOwned & {
  _id: string;
  title: string;
  eventType: "career-fair" | "workshop" | "info-session" | "networking" | "other";
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  status: "planning" | "open" | "closed" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DemoEmployerAnalyticsRecord = EmployerOwned & {
  _id: string;
  reportName: string;
  metricArea: "applications" | "interviews" | "hiring" | "brand" | "general";
  periodStart: string;
  periodEnd: string;
  totalViews: number;
  totalApplications: number;
  totalInterviews: number;
  totalOffers: number;
  totalHires: number;
  conversionRate: number;
  note?: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
};

type EmployerIdentity = {
  userId?: string;
  firebaseUid?: string;
};

let demoApplicants: DemoEmployerApplicant[] = [];
let demoTalentPool: DemoEmployerTalentProfile[] = [];
let demoInterviews: DemoEmployerInterview[] = [];
let demoCampusEvents: DemoEmployerCampusEvent[] = [];
let demoAnalyticsRecords: DemoEmployerAnalyticsRecord[] = [];

function cloneApplicant(item: DemoEmployerApplicant) {
  return {
    ...item,
    skills: [...item.skills]
  };
}

function cloneTalent(item: DemoEmployerTalentProfile) {
  return {
    ...item,
    skills: [...item.skills]
  };
}

function cloneInterview(item: DemoEmployerInterview) {
  return { ...item };
}

function cloneCampusEvent(item: DemoEmployerCampusEvent) {
  return { ...item };
}

function cloneAnalyticsRecord(item: DemoEmployerAnalyticsRecord) {
  return { ...item };
}

function isOwnedByIdentity(item: EmployerOwned, identity: EmployerIdentity) {
  const userMatch =
    identity.userId && item.employerUserId && identity.userId === item.employerUserId;
  const firebaseMatch =
    identity.firebaseUid &&
    item.employerFirebaseUid &&
    identity.firebaseUid === item.employerFirebaseUid;
  return Boolean(userMatch || firebaseMatch);
}

function stampNow() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function listDemoEmployerApplicants(identity: EmployerIdentity) {
  return demoApplicants.filter((item) => isOwnedByIdentity(item, identity)).map(cloneApplicant);
}

export function createDemoEmployerApplicant(
  identity: EmployerIdentity,
  input: Omit<DemoEmployerApplicant, "_id" | "createdAt" | "updatedAt" | keyof EmployerOwned>
) {
  const now = stampNow();
  const row: DemoEmployerApplicant = {
    _id: createId("applicant"),
    employerUserId: identity.userId,
    employerFirebaseUid: identity.firebaseUid,
    ...input,
    createdAt: now,
    updatedAt: now
  };
  demoApplicants = [row, ...demoApplicants];
  return cloneApplicant(row);
}

export function updateDemoEmployerApplicant(
  identity: EmployerIdentity,
  id: string,
  patch: Partial<Omit<DemoEmployerApplicant, "_id" | "createdAt" | keyof EmployerOwned>>
) {
  const index = demoApplicants.findIndex(
    (item) => item._id === id && isOwnedByIdentity(item, identity)
  );
  if (index < 0) return null;
  const next: DemoEmployerApplicant = {
    ...demoApplicants[index],
    ...patch,
    updatedAt: stampNow()
  };
  demoApplicants[index] = next;
  return cloneApplicant(next);
}

export function deleteDemoEmployerApplicant(identity: EmployerIdentity, id: string) {
  const before = demoApplicants.length;
  demoApplicants = demoApplicants.filter(
    (item) => !(item._id === id && isOwnedByIdentity(item, identity))
  );
  return before !== demoApplicants.length;
}

export function listDemoEmployerTalent(identity: EmployerIdentity) {
  return demoTalentPool.filter((item) => isOwnedByIdentity(item, identity)).map(cloneTalent);
}

export function createDemoEmployerTalent(
  identity: EmployerIdentity,
  input: Omit<DemoEmployerTalentProfile, "_id" | "createdAt" | "updatedAt" | keyof EmployerOwned>
) {
  const now = stampNow();
  const row: DemoEmployerTalentProfile = {
    _id: createId("talent"),
    employerUserId: identity.userId,
    employerFirebaseUid: identity.firebaseUid,
    ...input,
    createdAt: now,
    updatedAt: now
  };
  demoTalentPool = [row, ...demoTalentPool];
  return cloneTalent(row);
}

export function updateDemoEmployerTalent(
  identity: EmployerIdentity,
  id: string,
  patch: Partial<Omit<DemoEmployerTalentProfile, "_id" | "createdAt" | keyof EmployerOwned>>
) {
  const index = demoTalentPool.findIndex(
    (item) => item._id === id && isOwnedByIdentity(item, identity)
  );
  if (index < 0) return null;
  const next: DemoEmployerTalentProfile = {
    ...demoTalentPool[index],
    ...patch,
    updatedAt: stampNow()
  };
  demoTalentPool[index] = next;
  return cloneTalent(next);
}

export function deleteDemoEmployerTalent(identity: EmployerIdentity, id: string) {
  const before = demoTalentPool.length;
  demoTalentPool = demoTalentPool.filter(
    (item) => !(item._id === id && isOwnedByIdentity(item, identity))
  );
  return before !== demoTalentPool.length;
}

export function listDemoEmployerInterviews(identity: EmployerIdentity) {
  return demoInterviews.filter((item) => isOwnedByIdentity(item, identity)).map(cloneInterview);
}

export function createDemoEmployerInterview(
  identity: EmployerIdentity,
  input: Omit<DemoEmployerInterview, "_id" | "createdAt" | "updatedAt" | keyof EmployerOwned>
) {
  const now = stampNow();
  const row: DemoEmployerInterview = {
    _id: createId("interview"),
    employerUserId: identity.userId,
    employerFirebaseUid: identity.firebaseUid,
    ...input,
    createdAt: now,
    updatedAt: now
  };
  demoInterviews = [row, ...demoInterviews];
  return cloneInterview(row);
}

export function updateDemoEmployerInterview(
  identity: EmployerIdentity,
  id: string,
  patch: Partial<Omit<DemoEmployerInterview, "_id" | "createdAt" | keyof EmployerOwned>>
) {
  const index = demoInterviews.findIndex(
    (item) => item._id === id && isOwnedByIdentity(item, identity)
  );
  if (index < 0) return null;
  const next: DemoEmployerInterview = {
    ...demoInterviews[index],
    ...patch,
    updatedAt: stampNow()
  };
  demoInterviews[index] = next;
  return cloneInterview(next);
}

export function deleteDemoEmployerInterview(identity: EmployerIdentity, id: string) {
  const before = demoInterviews.length;
  demoInterviews = demoInterviews.filter(
    (item) => !(item._id === id && isOwnedByIdentity(item, identity))
  );
  return before !== demoInterviews.length;
}

export function listDemoEmployerCampusEvents(identity: EmployerIdentity) {
  return demoCampusEvents
    .filter((item) => isOwnedByIdentity(item, identity))
    .map(cloneCampusEvent);
}

export function createDemoEmployerCampusEvent(
  identity: EmployerIdentity,
  input: Omit<DemoEmployerCampusEvent, "_id" | "createdAt" | "updatedAt" | keyof EmployerOwned>
) {
  const now = stampNow();
  const row: DemoEmployerCampusEvent = {
    _id: createId("campus-event"),
    employerUserId: identity.userId,
    employerFirebaseUid: identity.firebaseUid,
    ...input,
    createdAt: now,
    updatedAt: now
  };
  demoCampusEvents = [row, ...demoCampusEvents];
  return cloneCampusEvent(row);
}

export function updateDemoEmployerCampusEvent(
  identity: EmployerIdentity,
  id: string,
  patch: Partial<Omit<DemoEmployerCampusEvent, "_id" | "createdAt" | keyof EmployerOwned>>
) {
  const index = demoCampusEvents.findIndex(
    (item) => item._id === id && isOwnedByIdentity(item, identity)
  );
  if (index < 0) return null;
  const next: DemoEmployerCampusEvent = {
    ...demoCampusEvents[index],
    ...patch,
    updatedAt: stampNow()
  };
  demoCampusEvents[index] = next;
  return cloneCampusEvent(next);
}

export function deleteDemoEmployerCampusEvent(identity: EmployerIdentity, id: string) {
  const before = demoCampusEvents.length;
  demoCampusEvents = demoCampusEvents.filter(
    (item) => !(item._id === id && isOwnedByIdentity(item, identity))
  );
  return before !== demoCampusEvents.length;
}

export function listDemoEmployerAnalyticsRecords(identity: EmployerIdentity) {
  return demoAnalyticsRecords
    .filter((item) => isOwnedByIdentity(item, identity))
    .map(cloneAnalyticsRecord);
}

export function createDemoEmployerAnalyticsRecord(
  identity: EmployerIdentity,
  input: Omit<DemoEmployerAnalyticsRecord, "_id" | "createdAt" | "updatedAt" | keyof EmployerOwned>
) {
  const now = stampNow();
  const row: DemoEmployerAnalyticsRecord = {
    _id: createId("analytics"),
    employerUserId: identity.userId,
    employerFirebaseUid: identity.firebaseUid,
    ...input,
    createdAt: now,
    updatedAt: now
  };
  demoAnalyticsRecords = [row, ...demoAnalyticsRecords];
  return cloneAnalyticsRecord(row);
}

export function updateDemoEmployerAnalyticsRecord(
  identity: EmployerIdentity,
  id: string,
  patch: Partial<Omit<DemoEmployerAnalyticsRecord, "_id" | "createdAt" | keyof EmployerOwned>>
) {
  const index = demoAnalyticsRecords.findIndex(
    (item) => item._id === id && isOwnedByIdentity(item, identity)
  );
  if (index < 0) return null;
  const next: DemoEmployerAnalyticsRecord = {
    ...demoAnalyticsRecords[index],
    ...patch,
    updatedAt: stampNow()
  };
  demoAnalyticsRecords[index] = next;
  return cloneAnalyticsRecord(next);
}

export function deleteDemoEmployerAnalyticsRecord(identity: EmployerIdentity, id: string) {
  const before = demoAnalyticsRecords.length;
  demoAnalyticsRecords = demoAnalyticsRecords.filter(
    (item) => !(item._id === id && isOwnedByIdentity(item, identity))
  );
  return before !== demoAnalyticsRecords.length;
}


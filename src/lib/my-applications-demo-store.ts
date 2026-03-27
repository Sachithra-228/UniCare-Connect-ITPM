import type {
  ApplicationDocumentEntry,
  ApplicationEntry,
  ApplicationFeedbackEntry,
  ApplicationKind,
  ApplicationStatus,
  MyApplicationsPayload
} from "@/lib/my-applications-types";

type DemoApplicationRecord = {
  _id: string;
  userId?: string;
  firebaseUid?: string;
  kind: Exclude<ApplicationKind, "aid">;
  title: string;
  organization?: string;
  status: ApplicationStatus;
  submittedAt?: string;
  reviewNote?: string | null;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DemoDocumentRecord = {
  _id: string;
  userId?: string;
  firebaseUid?: string;
  name: string;
  size: number;
  linkedTo?: string;
  mimeType?: string;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

const nowIso = () => new Date().toISOString();
const idFor = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

let applicationRecords: DemoApplicationRecord[] = [
  {
    _id: "ma_job_1",
    kind: "job",
    title: "Junior Frontend Developer Intern",
    organization: "TechCorp Lanka",
    status: "Pending",
    submittedAt: "2026-03-25",
    source: "Career",
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    _id: "ma_sch_1",
    kind: "scholarship",
    title: "Merit Scholarship 2026",
    organization: "UniCare Foundation",
    status: "Rejected",
    submittedAt: "2026-03-12",
    reviewNote: "Please submit latest academic transcript with GPA details.",
    source: "Financial Aid",
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

let documentRecords: DemoDocumentRecord[] = [];

function belongsToUser(
  item: { userId?: string; firebaseUid?: string },
  userId?: string,
  firebaseUid?: string
) {
  if (!item.userId && !item.firebaseUid) return true;
  if (userId && item.userId === userId) return true;
  if (firebaseUid && item.firebaseUid === firebaseUid) return true;
  return false;
}

function toApplicationEntry(record: DemoApplicationRecord): ApplicationEntry {
  return {
    _id: record._id,
    kind: record.kind,
    title: record.title,
    organization: record.organization,
    status: record.status,
    submittedAt: record.submittedAt,
    reviewNote: record.reviewNote ?? null,
    source: record.source
  };
}

function toDocumentEntry(record: DemoDocumentRecord): ApplicationDocumentEntry {
  return {
    _id: record._id,
    name: record.name,
    size: record.size,
    linkedTo: record.linkedTo,
    mimeType: record.mimeType,
    uploadedAt: record.uploadedAt ?? record.createdAt
  };
}

export function getDemoMyApplications(input: {
  aidRequests: ApplicationEntry[];
  userId?: string;
  firebaseUid?: string;
}): MyApplicationsPayload {
  const scopedApps = applicationRecords
    .filter((item) => belongsToUser(item, input.userId, input.firebaseUid))
    .sort((a, b) => Date.parse(b.submittedAt ?? b.createdAt ?? "") - Date.parse(a.submittedAt ?? a.createdAt ?? ""));
  const scopedDocs = documentRecords
    .filter((item) => belongsToUser(item, input.userId, input.firebaseUid))
    .sort((a, b) => Date.parse(b.uploadedAt ?? b.createdAt ?? "") - Date.parse(a.uploadedAt ?? a.createdAt ?? ""));

  const jobApplications = scopedApps.filter((item) => item.kind === "job").map(toApplicationEntry);
  const scholarshipApplications = scopedApps
    .filter((item) => item.kind === "scholarship")
    .map(toApplicationEntry);
  const documents = scopedDocs.map(toDocumentEntry);

  const feedback: ApplicationFeedbackEntry[] = [
    ...input.aidRequests
      .filter((item) => item.status === "Rejected" && item.reviewNote)
      .map((item) => ({
        _id: `aid-feedback-${item._id}`,
        kind: "aid" as const,
        title: item.title,
        status: item.status,
        feedback: item.reviewNote ?? "",
        updatedAt: item.submittedAt
      })),
    ...scopedApps
      .filter((item) => item.status === "Rejected" && item.reviewNote)
      .map((item) => ({
        _id: `application-feedback-${item._id}`,
        kind: item.kind,
        title: item.title,
        status: item.status,
        feedback: item.reviewNote ?? "",
        updatedAt: item.updatedAt ?? item.submittedAt
      }))
  ];

  return {
    aidRequests: input.aidRequests,
    jobApplications,
    scholarshipApplications,
    documents,
    feedback
  };
}

export function addDemoApplication(input: {
  userId?: string;
  firebaseUid?: string;
  kind: Exclude<ApplicationKind, "aid">;
  title: string;
  organization?: string;
  source?: string;
  submittedAt?: string;
}) {
  const now = nowIso();
  const record: DemoApplicationRecord = {
    _id: idFor("ma_"),
    userId: input.userId,
    firebaseUid: input.firebaseUid,
    kind: input.kind,
    title: input.title,
    organization: input.organization,
    status: "Pending",
    source: input.source,
    submittedAt: input.submittedAt ?? now.slice(0, 10),
    createdAt: now,
    updatedAt: now
  };
  applicationRecords = [record, ...applicationRecords];
  return toApplicationEntry(record);
}

export function addDemoDocument(input: {
  userId?: string;
  firebaseUid?: string;
  name: string;
  size: number;
  linkedTo?: string;
  mimeType?: string;
}) {
  const now = nowIso();
  const record: DemoDocumentRecord = {
    _id: idFor("md_"),
    userId: input.userId,
    firebaseUid: input.firebaseUid,
    name: input.name,
    size: input.size,
    linkedTo: input.linkedTo,
    mimeType: input.mimeType,
    uploadedAt: now,
    createdAt: now,
    updatedAt: now
  };
  documentRecords = [record, ...documentRecords];
  return toDocumentEntry(record);
}

export function removeDemoDocument(input: { id: string; userId?: string; firebaseUid?: string }) {
  const before = documentRecords.length;
  documentRecords = documentRecords.filter((item) => {
    if (item._id !== input.id) return true;
    return !belongsToUser(item, input.userId, input.firebaseUid);
  });
  return before !== documentRecords.length;
}

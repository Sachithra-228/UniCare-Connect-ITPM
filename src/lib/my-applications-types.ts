export type ApplicationKind = "aid" | "job" | "scholarship";

export type ApplicationStatus = "Pending" | "Under review" | "Approved" | "Rejected";

export type ApplicationEntry = {
  _id: string;
  kind: ApplicationKind;
  title: string;
  organization?: string;
  status: ApplicationStatus;
  submittedAt?: string;
  reviewNote?: string | null;
  source?: string;
};

export type ApplicationDocumentEntry = {
  _id: string;
  name: string;
  size: number;
  linkedTo?: string;
  mimeType?: string;
  uploadedAt?: string;
};

export type ApplicationFeedbackEntry = {
  _id: string;
  kind: ApplicationKind;
  title: string;
  status: ApplicationStatus;
  feedback: string;
  updatedAt?: string;
};

export type MyApplicationsPayload = {
  aidRequests: ApplicationEntry[];
  jobApplications: ApplicationEntry[];
  scholarshipApplications: ApplicationEntry[];
  documents: ApplicationDocumentEntry[];
  feedback: ApplicationFeedbackEntry[];
};

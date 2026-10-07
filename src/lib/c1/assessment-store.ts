import type { VulnerabilityAssessment, StudentFinancialProfile } from "./vulnerability";

/** Stored record. The raw financial profile is only ever returned to the student who owns it. */
export type StoredAssessment = {
  userId?: string;
  firebaseUid?: string;
  studentName: string;
  university?: string;
  profile: StudentFinancialProfile;
  assessment: VulnerabilityAssessment;
  consentAt: string;
  updatedAt: string;
};

/** What a welfare officer sees: derived need signals only (data minimisation). */
export type AdminQueueItem = {
  id: string;
  studentName: string;
  university?: string;
  vulnerabilityIndex: number;
  band: VulnerabilityAssessment["band"];
  flaggedVulnerable: boolean;
  topFactors: VulnerabilityAssessment["topFactors"];
  modelVersion: string;
  syntheticTraining: boolean;
  assessedAt: string;
};

export function toAdminQueueItem(record: StoredAssessment, id: string): AdminQueueItem {
  return {
    id,
    studentName: record.studentName,
    university: record.university,
    vulnerabilityIndex: record.assessment.vulnerabilityIndex,
    band: record.assessment.band,
    flaggedVulnerable: record.assessment.flaggedVulnerable,
    topFactors: record.assessment.topFactors,
    modelVersion: record.assessment.modelVersion,
    syntheticTraining: record.assessment.syntheticTraining,
    assessedAt: record.updatedAt
  };
}

// ---------------------------------------------------------------- demo-mode store
const demoStore = new Map<string, StoredAssessment>();

function identityKey(record: Pick<StoredAssessment, "userId" | "firebaseUid">) {
  return record.userId ?? record.firebaseUid ?? "anonymous";
}

export function saveDemoAssessment(record: StoredAssessment) {
  demoStore.set(identityKey(record), record);
}

export function getDemoAssessment(identity: { userId?: string; firebaseUid?: string }): StoredAssessment | null {
  return demoStore.get(identityKey(identity)) ?? null;
}

export function deleteDemoAssessment(identity: { userId?: string; firebaseUid?: string }) {
  demoStore.delete(identityKey(identity));
}

export function listDemoAssessments(): Array<{ id: string; record: StoredAssessment }> {
  return [...demoStore.entries()].map(([id, record]) => ({ id, record }));
}

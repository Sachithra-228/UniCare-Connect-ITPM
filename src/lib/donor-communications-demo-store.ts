import type { UserRole } from "@/types";

export type DemoDonorMessage = {
  _id: string;
  donorUserId?: string;
  donorFirebaseUid?: string;
  audience: string;
  messageType: string;
  subject: string;
  body: string;
  createdAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `demo-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

let demoMessages: DemoDonorMessage[] = [
  {
    _id: "demo-msg-1",
    donorUserId: "u4",
    donorFirebaseUid: "u4",
    audience: "Scholarship recipients",
    messageType: "General update",
    subject: "Welcome note",
    body: "We are proud to support your journey. Please share any updates for our impact report.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  }
];

function belongsToUser(item: DemoDonorMessage, input: { userId?: string; firebaseUid?: string }) {
  const userMatch = Boolean(input.userId) && item.donorUserId === input.userId;
  const firebaseMatch = Boolean(input.firebaseUid) && item.donorFirebaseUid === input.firebaseUid;
  return Boolean(userMatch || firebaseMatch);
}

export function listDemoDonorMessages(input: { userId?: string; firebaseUid?: string }) {
  return demoMessages
    .filter((item) => belongsToUser(item, input))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((item) => ({ ...item }));
}

function audienceMatchesRole(audience: string, role: UserRole): boolean {
  const normalizedAudience = String(audience ?? "").toLowerCase();
  if (role === "student") {
    return (
      normalizedAudience.includes("student") ||
      normalizedAudience.includes("recipient") ||
      normalizedAudience.includes("beneficiar")
    );
  }
  if (role === "admin" || role === "faculty" || role === "super_admin") {
    return normalizedAudience.includes("admin") || normalizedAudience.includes("faculty");
  }
  return false;
}

export function listDemoDonorInboxMessages(role: UserRole) {
  return demoMessages
    .filter((item) => audienceMatchesRole(item.audience, role))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((item) => ({ ...item }));
}

export function addDemoDonorMessage(
  input: Omit<DemoDonorMessage, "_id" | "createdAt">
) {
  const created: DemoDonorMessage = {
    ...input,
    _id: makeId(),
    createdAt: nowIso()
  };
  demoMessages = [created, ...demoMessages];
  return { ...created };
}

export function updateDemoDonorMessage(
  id: string,
  input: Partial<Pick<DemoDonorMessage, "audience" | "messageType" | "subject" | "body">>
) {
  const index = demoMessages.findIndex((item) => item._id === id);
  if (index < 0) return null;
  const next: DemoDonorMessage = {
    ...demoMessages[index],
    ...input
  };
  demoMessages[index] = next;
  return { ...next };
}

export function deleteDemoDonorMessage(id: string) {
  const index = demoMessages.findIndex((item) => item._id === id);
  if (index < 0) return null;
  const [removed] = demoMessages.splice(index, 1);
  return { ...removed };
}

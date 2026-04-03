export type DemoDonorContribution = {
  _id: string;
  donorUserId?: string;
  donorFirebaseUid?: string;
  donorEmail?: string;
  donorName?: string;
  contributionType: "emergency_fund" | "equipment" | "scholarship" | "general" | "ngo_program";
  program: string;
  category: string;
  amountLkr: number;
  note?: string;
  receiptNumber: string;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `demo-donation-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function receiptNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `DNT-${y}${m}${d}-${random}`;
}

let demoContributions: DemoDonorContribution[] = [
  {
    _id: "demo-donation-1",
    donorUserId: "u4",
    donorFirebaseUid: "u4",
    donorEmail: "donor@example.com",
    donorName: "Demo Donor",
    contributionType: "emergency_fund",
    program: "Emergency Support Fund",
    category: "Emergency aid",
    amountLkr: 50000,
    note: "Urgent semester support",
    receiptNumber: "DNT-20260327-1001",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  },
  {
    _id: "demo-donation-2",
    donorUserId: "u4",
    donorFirebaseUid: "u4",
    donorEmail: "donor@example.com",
    donorName: "Demo Donor",
    contributionType: "equipment",
    program: "Digital Access Grant",
    category: "Equipment support",
    amountLkr: 75000,
    note: "Laptops for students",
    receiptNumber: "DNT-20260325-2211",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
  }
];

function belongsToUser(
  item: DemoDonorContribution,
  input: { userId?: string; firebaseUid?: string }
) {
  const userMatch = Boolean(input.userId) && item.donorUserId === input.userId;
  const firebaseMatch =
    Boolean(input.firebaseUid) && item.donorFirebaseUid === input.firebaseUid;
  return Boolean(userMatch || firebaseMatch);
}

export function listDemoDonorContributions(input: { userId?: string; firebaseUid?: string }) {
  return demoContributions
    .filter((item) => belongsToUser(item, input))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((item) => ({ ...item }));
}

export function addDemoDonorContribution(
  input: Omit<DemoDonorContribution, "_id" | "receiptNumber" | "createdAt" | "updatedAt">
) {
  const now = nowIso();
  const created: DemoDonorContribution = {
    ...input,
    _id: makeId(),
    receiptNumber: receiptNumber(),
    createdAt: now,
    updatedAt: now
  };
  demoContributions = [created, ...demoContributions];
  return { ...created };
}

export function updateDemoDonorContribution(
  id: string,
  input: Partial<Pick<DemoDonorContribution, "contributionType" | "program" | "category" | "amountLkr" | "note">>
) {
  const index = demoContributions.findIndex((item) => item._id === id);
  if (index < 0) return null;
  const next: DemoDonorContribution = {
    ...demoContributions[index],
    ...input,
    updatedAt: nowIso()
  };
  demoContributions[index] = next;
  return { ...next };
}

export function deleteDemoDonorContribution(id: string) {
  const index = demoContributions.findIndex((item) => item._id === id);
  if (index < 0) return null;
  const [removed] = demoContributions.splice(index, 1);
  return { ...removed };
}

export type DemoDonorScholarship = {
  _id: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  eligibilityCriteria: string;
  applicationLink: string;
  tags: string[];
  status: "active" | "closed";
  donorUserId?: string;
  donorFirebaseUid?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

type ListInput = {
  userId?: string;
  firebaseUid?: string;
};

type CreateInput = Omit<DemoDonorScholarship, "_id" | "createdAt" | "updatedAt" | "status"> & {
  status?: "active" | "closed";
};

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `demo-scholarship-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

let demoScholarships: DemoDonorScholarship[] = [
  {
    _id: "demo-donor-sch-1",
    title: "Future Engineers Grant",
    provider: "Demo Donor Foundation",
    amount: "LKR 120000",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().slice(0, 10),
    eligibilityCriteria: "Undergraduate engineering students with financial need",
    applicationLink: "https://example.org/donor/future-engineers",
    tags: ["engineering", "need-based"],
    status: "active",
    donorUserId: "u4",
    donorFirebaseUid: "u4",
    createdBy: "u4",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
  }
];

function belongsToUser(item: DemoDonorScholarship, input: ListInput) {
  const userId = input.userId?.trim();
  const firebaseUid = input.firebaseUid?.trim();
  return Boolean(
    (userId && [item.donorUserId, item.createdBy].includes(userId)) ||
      (firebaseUid && [item.donorFirebaseUid, item.createdBy].includes(firebaseUid))
  );
}

export function listDemoDonorScholarships(input: ListInput) {
  return demoScholarships
    .filter((item) => belongsToUser(item, input))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((item) => ({ ...item }));
}

export function createDemoDonorScholarship(input: CreateInput) {
  const now = nowIso();
  const row: DemoDonorScholarship = {
    ...input,
    _id: makeId(),
    status: input.status ?? "active",
    createdAt: now,
    updatedAt: now
  };
  demoScholarships = [row, ...demoScholarships];
  return { ...row };
}

export function updateDemoDonorScholarship(
  id: string,
  input: Partial<Pick<DemoDonorScholarship, "title" | "amount" | "deadline" | "status" | "eligibilityCriteria" | "tags" | "applicationLink">>
) {
  const index = demoScholarships.findIndex((item) => item._id === id);
  if (index < 0) return null;
  const next: DemoDonorScholarship = {
    ...demoScholarships[index],
    ...input,
    updatedAt: nowIso()
  };
  demoScholarships[index] = next;
  return { ...next };
}

export function deleteDemoDonorScholarship(id: string) {
  const index = demoScholarships.findIndex((item) => item._id === id);
  if (index < 0) return null;
  const [removed] = demoScholarships.splice(index, 1);
  return { ...removed };
}

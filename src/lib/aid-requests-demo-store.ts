type DemoAidRequest = {
  _id: string;
  id: string;
  category: string;
  status: string;
  amount?: string;
  userId?: string;
  firebaseUid?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewNote?: string;
  balanceApplied?: boolean;
};

const initialRequests: DemoAidRequest[] = [
  {
    _id: "aid1",
    id: "aid1",
    category: "Emergency academic aid",
    status: "Under review",
    amount: "2500",
    userId: "u1",
    firebaseUid: "u1",
    submittedAt: "2026-02-02",
    createdAt: "2026-02-02T08:30:00.000Z",
    updatedAt: "2026-02-02T08:30:00.000Z",
    reviewNote: ""
  },
  {
    _id: "aid2",
    id: "aid2",
    category: "Equipment support",
    status: "Approved",
    amount: "50000",
    userId: "u1",
    firebaseUid: "u1",
    submittedAt: "2026-01-20",
    createdAt: "2026-01-20T06:20:00.000Z",
    updatedAt: "2026-01-20T06:20:00.000Z",
    reviewNote: "",
    balanceApplied: true
  }
];

let demoAidRequests: DemoAidRequest[] = [...initialRequests];

function clone(item: DemoAidRequest) {
  return { ...item };
}

export function listDemoAidRequests() {
  return demoAidRequests.map(clone);
}

export function createDemoAidRequest(input: Record<string, unknown>) {
  const now = new Date().toISOString();
  const id = `aid${Date.now()}`;
  const row: DemoAidRequest = {
    _id: id,
    id,
    category: String(input.category ?? "Emergency academic aid"),
    status: String(input.status ?? "pending"),
    amount: input.amount != null ? String(input.amount) : undefined,
    userId: typeof input.userId === "string" ? input.userId : undefined,
    firebaseUid: typeof input.firebaseUid === "string" ? input.firebaseUid : undefined,
    submittedAt: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
    reviewNote: ""
  };
  demoAidRequests = [row, ...demoAidRequests];
  return clone(row);
}

export function updateDemoAidRequest(
  id: string,
  input: { status?: string; reviewNote?: string | null; balanceApplied?: boolean }
) {
  const index = demoAidRequests.findIndex((item) => item._id === id || item.id === id);
  if (index < 0) return null;
  const current = demoAidRequests[index];
  const next: DemoAidRequest = {
    ...current,
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.reviewNote !== undefined ? { reviewNote: input.reviewNote ?? "" } : {}),
    ...(input.balanceApplied !== undefined ? { balanceApplied: input.balanceApplied } : {}),
    updatedAt: new Date().toISOString()
  };
  demoAidRequests[index] = next;
  return clone(next);
}

export function deleteDemoAidRequest(id: string) {
  const before = demoAidRequests.length;
  demoAidRequests = demoAidRequests.filter((item) => item._id !== id && item.id !== id);
  return before !== demoAidRequests.length;
}

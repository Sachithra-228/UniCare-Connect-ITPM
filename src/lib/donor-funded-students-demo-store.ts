export type DemoFundedStudent = {
  id: string;
  displayName: string;
  canViewIdentity: boolean;
  university?: string;
  program?: string;
  year?: string;
  totalFundedLkr: number;
  supportCategories: string[];
  progressScore: number;
  progressLabel: string;
  latestStatus: string;
  lastUpdated: string;
  recentMilestone: string;
};

export type DemoFundedUpdate = {
  id: string;
  title: string;
  detail: string;
  date: string;
  editable?: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return `demo-update-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

const students: DemoFundedStudent[] = [
  {
    id: "demo-funded-1",
    displayName: "Student (consented): N. Perera",
    canViewIdentity: true,
    university: "University of Colombo",
    program: "BSc Computer Science",
    year: "Year 2",
    totalFundedLkr: 85000,
    supportCategories: ["Emergency aid", "Meal voucher support"],
    progressScore: 78,
    progressLabel: "On track",
    latestStatus: "Active",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    recentMilestone: "Completed semester registration and resumed classes."
  },
  {
    id: "demo-funded-2",
    displayName: "Student #A241",
    canViewIdentity: false,
    totalFundedLkr: 50000,
    supportCategories: ["Equipment support"],
    progressScore: 64,
    progressLabel: "Improving",
    latestStatus: "Active",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    recentMilestone: "Received laptop support and rejoined online coursework."
  }
];

const derivedUpdates: DemoFundedUpdate[] = [
  {
    id: "demo-update-1",
    title: "Support disbursed",
    detail: "A funded student received equipment support worth LKR 50,000.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    editable: false
  },
  {
    id: "demo-update-2",
    title: "Academic milestone",
    detail: "One funded student completed all mid-semester submissions on time.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
    editable: false
  }
];

let manualUpdates: DemoFundedUpdate[] = [];

function allUpdates() {
  return [...manualUpdates, ...derivedUpdates]
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function addDemoDonorFundedUpdate(input: Pick<DemoFundedUpdate, "title" | "detail">) {
  const created: DemoFundedUpdate = {
    id: makeId(),
    title: input.title,
    detail: input.detail,
    date: nowIso(),
    editable: true
  };
  manualUpdates = [created, ...manualUpdates];
  return { ...created };
}

export function updateDemoDonorFundedUpdate(
  id: string,
  input: Partial<Pick<DemoFundedUpdate, "title" | "detail">>
) {
  const index = manualUpdates.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next: DemoFundedUpdate = {
    ...manualUpdates[index],
    ...input,
    date: nowIso(),
    editable: true
  };
  manualUpdates[index] = next;
  return { ...next };
}

export function deleteDemoDonorFundedUpdate(id: string) {
  const index = manualUpdates.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const [removed] = manualUpdates.splice(index, 1);
  return { ...removed };
}

export function getDemoDonorFundedStudentsOverview() {
  const updates = allUpdates();

  const fundedStudents = students.length;
  const consentedProfiles = students.filter((item) => item.canViewIdentity).length;
  const anonymizedProfiles = fundedStudents - consentedProfiles;
  const totalFundedLkr = students.reduce((sum, item) => sum + item.totalFundedLkr, 0);
  const avgProgressScore = fundedStudents
    ? Math.round(students.reduce((sum, item) => sum + item.progressScore, 0) / fundedStudents)
    : 0;

  return {
    summary: {
      fundedStudents,
      consentedProfiles,
      anonymizedProfiles,
      totalFundedLkr,
      avgProgressScore,
      activeSupportCases: fundedStudents
    },
    students,
    updates
  };
}

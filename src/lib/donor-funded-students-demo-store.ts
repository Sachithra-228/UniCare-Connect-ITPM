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
};

export function getDemoDonorFundedStudentsOverview() {
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

  const updates: DemoFundedUpdate[] = [
    {
      id: "demo-update-1",
      title: "Support disbursed",
      detail: "A funded student received equipment support worth LKR 50,000.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
    },
    {
      id: "demo-update-2",
      title: "Academic milestone",
      detail: "One funded student completed all mid-semester submissions on time.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString()
    }
  ];

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

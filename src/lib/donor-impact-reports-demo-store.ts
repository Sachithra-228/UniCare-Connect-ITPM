export type DemoDonorImpactReport = {
  generatedAt: string;
  rangeDays: number;
  summary: {
    totalContributedLkr: number;
    activeScholarships: number;
    totalScholarships: number;
    aidApprovedLkr: number;
    approvedAidRequests: number;
    fundedStudents: number;
    avgSupportPerStudent: number;
  };
  distribution: Array<{
    label: string;
    amountLkr: number;
    count: number;
  }>;
  highlights: Array<{
    id: string;
    title: string;
    detail: string;
  }>;
};

export function getDemoDonorImpactReport(rangeDays = 90): DemoDonorImpactReport {
  const totalContributedLkr = 125000;
  const fundedStudents = 6;
  const aidApprovedLkr = 95000;
  const approvedAidRequests = 8;
  const avgSupportPerStudent = fundedStudents
    ? Math.round(aidApprovedLkr / fundedStudents)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    rangeDays,
    summary: {
      totalContributedLkr,
      activeScholarships: 2,
      totalScholarships: 3,
      aidApprovedLkr,
      approvedAidRequests,
      fundedStudents,
      avgSupportPerStudent
    },
    distribution: [
      { label: "Emergency aid", amountLkr: 45000, count: 3 },
      { label: "Equipment support", amountLkr: 30000, count: 2 },
      { label: "Meal vouchers", amountLkr: 20000, count: 3 }
    ],
    highlights: [
      {
        id: "demo-highlight-1",
        title: "Emergency support impact",
        detail: "3 students avoided semester dropout after emergency funding."
      },
      {
        id: "demo-highlight-2",
        title: "Digital access progress",
        detail: "2 students received laptop support and resumed online coursework."
      }
    ]
  };
}

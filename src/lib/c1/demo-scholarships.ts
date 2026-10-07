import type { ScholarshipCriteria } from "./matching";

/**
 * ILLUSTRATIVE catalogue for the C1 prototype. Names, providers and criteria are
 * fictional and are NOT real scholarship offers. Real scholarships published by
 * donors carry structured `criteria` in the same shape (see donor scholarships API).
 */
export const illustrativeScholarships: ScholarshipCriteria[] = [
  {
    id: "ILL-01",
    title: "Need-Based Bursary (illustrative)",
    provider: "Illustrative Alumni Fund",
    type: "need",
    amountLkr: 120_000,
    minGpa: 2.0,
    maxMonthlyIncomeLkr: 90_000,
    minVulnerability: 55,
    eligibleYears: [3, 4],
    ruralOnly: false,
    deadlineDays: 21
  },
  {
    id: "ILL-02",
    title: "Rural Students Opportunity Grant (illustrative)",
    provider: "Illustrative NGO Programme",
    type: "need",
    amountLkr: 240_000,
    minGpa: 2.3,
    maxMonthlyIncomeLkr: 70_000,
    minVulnerability: 70,
    eligibleYears: [3, 4],
    ruralOnly: true,
    deadlineDays: 45
  },
  {
    id: "ILL-03",
    title: "Tech Merit Scholarship (illustrative)",
    provider: "Illustrative Telecom Scholars",
    type: "merit",
    amountLkr: 360_000,
    minGpa: 3.3,
    maxMonthlyIncomeLkr: 1_000_000,
    minVulnerability: 0,
    eligibleYears: [3, 4],
    ruralOnly: false,
    deadlineDays: 60
  },
  {
    id: "ILL-04",
    title: "Merit-cum-Means Award (illustrative)",
    provider: "Illustrative CSR Foundation",
    type: "mixed",
    amountLkr: 180_000,
    minGpa: 2.8,
    maxMonthlyIncomeLkr: 120_000,
    minVulnerability: 45,
    eligibleYears: [3, 4],
    ruralOnly: false,
    deadlineDays: 30
  },
  {
    id: "ILL-05",
    title: "Final-Year Completion Support (illustrative)",
    provider: "Illustrative Bank Education Trust",
    type: "need",
    amountLkr: 180_000,
    minGpa: 2.0,
    maxMonthlyIncomeLkr: 120_000,
    minVulnerability: 65,
    eligibleYears: [4],
    ruralOnly: false,
    deadlineDays: 14
  },
  {
    id: "ILL-06",
    title: "Faculty Excellence Endowment (illustrative)",
    provider: "Illustrative Faculty Endowment",
    type: "merit",
    amountLkr: 90_000,
    minGpa: 3.0,
    maxMonthlyIncomeLkr: 1_000_000,
    minVulnerability: 0,
    eligibleYears: [3, 4],
    ruralOnly: false,
    deadlineDays: 90
  },
  {
    id: "ILL-07",
    title: "Emergency Study Continuity Fund (illustrative)",
    provider: "Illustrative Alumni Fund",
    type: "need",
    amountLkr: 60_000,
    minGpa: 0,
    maxMonthlyIncomeLkr: 60_000,
    minVulnerability: 75,
    eligibleYears: [3, 4],
    ruralOnly: false,
    deadlineDays: 7
  },
  {
    id: "ILL-08",
    title: "Community Leaders Scholarship (illustrative)",
    provider: "Illustrative CSR Foundation",
    type: "mixed",
    amountLkr: 120_000,
    minGpa: 2.5,
    maxMonthlyIncomeLkr: 150_000,
    minVulnerability: 40,
    eligibleYears: [3, 4],
    ruralOnly: false,
    deadlineDays: 75
  }
];

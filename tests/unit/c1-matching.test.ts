import { assessVulnerability, type StudentFinancialProfile } from "@/lib/c1/vulnerability";
import {
  isEligible,
  ndcgAtK,
  rankByAmount,
  rankScholarships,
  type ScholarshipCriteria
} from "@/lib/c1/matching";

const student: StudentFinancialProfile = {
  monthlyHouseholdIncomeLkr: 30_000,
  householdSize: 6,
  dependents: 4,
  siblingsInEducation: 2,
  guardianEmployment: "unemployed",
  singleParent: true,
  hasEducationLoan: true,
  loanAmountLkr: 350_000,
  monthlyExpensesLkr: 40_000,
  accommodation: "hostel",
  ruralDistrict: true,
  financialShockLastYear: true,
  currentScholarship: false,
  gpa: 3.1,
  yearOfStudy: 3
};

const base: ScholarshipCriteria = {
  id: "S",
  title: "t",
  provider: "p",
  type: "mixed",
  amountLkr: 120_000,
  minGpa: 2.5,
  maxMonthlyIncomeLkr: 1_000_000,
  minVulnerability: 0,
  eligibleYears: [3, 4],
  ruralOnly: false,
  deadlineDays: 60
};

describe("C1 scholarship eligibility", () => {
  it("applies GPA, income, year and rural-only rules", () => {
    expect(isEligible(student, base)).toBe(true);
    expect(isEligible(student, { ...base, minGpa: 3.5 })).toBe(false);
    expect(isEligible(student, { ...base, maxMonthlyIncomeLkr: 20_000 })).toBe(false);
    expect(isEligible(student, { ...base, eligibleYears: [4] })).toBe(false);
    expect(isEligible({ ...student, ruralDistrict: false }, { ...base, ruralOnly: true })).toBe(false);
    expect(isEligible(student, { ...base, ruralOnly: true })).toBe(true);
  });
});

describe("C1 scholarship ranking", () => {
  const catalogue: ScholarshipCriteria[] = [
    { ...base, id: "BIG-MERIT", type: "merit", amountLkr: 360_000, minGpa: 3.0 },
    { ...base, id: "NEED-LARGE", type: "need", amountLkr: 240_000, minGpa: 2.0, minVulnerability: 65 },
    { ...base, id: "NEED-SMALL", type: "need", amountLkr: 60_000, minGpa: 2.0 },
    { ...base, id: "INELIGIBLE", type: "need", amountLkr: 360_000, minGpa: 3.9 }
  ];
  const assessment = assessVulnerability(student);

  it("never recommends ineligible scholarships", () => {
    const ids = rankScholarships(student, assessment, catalogue).map((r) => r.scholarship.id);
    expect(ids).not.toContain("INELIGIBLE");
    expect(ids).toHaveLength(3);
  });

  it("puts need-aligned large awards ahead of a pure-merit award for a high-need student", () => {
    const ids = rankScholarships(student, assessment, catalogue).map((r) => r.scholarship.id);
    expect(ids[0]).toBe("NEED-LARGE");
    expect(ids.indexOf("NEED-LARGE")).toBeLessThan(ids.indexOf("BIG-MERIT"));
  });

  it("the amount-only baseline ranks the biggest award first regardless of need", () => {
    const ids = rankByAmount(student, catalogue).map((s) => s.id);
    expect(ids[0]).toBe("BIG-MERIT");
  });

  it("explains each recommendation", () => {
    for (const r of rankScholarships(student, assessment, catalogue)) {
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic (stable tie-breaking)", () => {
    const a = rankScholarships(student, assessment, [...catalogue].reverse()).map((r) => r.scholarship.id);
    const b = rankScholarships(student, assessment, catalogue).map((r) => r.scholarship.id);
    expect(a).toEqual(b);
  });
});

describe("NDCG@K", () => {
  const rel = { A: 3, B: 2, C: 1, D: 0 };
  it("is 1 for the ideal ordering", () => {
    expect(ndcgAtK(["A", "B", "C", "D"], rel, 4)).toBeCloseTo(1, 10);
  });
  it("penalises a worse ordering", () => {
    expect(ndcgAtK(["D", "C", "B", "A"], rel, 4)).toBeLessThan(0.7);
  });
  it("returns 0 when nothing is relevant", () => {
    expect(ndcgAtK(["A"], { A: 0 }, 3)).toBe(0);
  });
  it("matches a hand computation", () => {
    // ranking [B, A]: dcg = 3/log2(2) + 7/log2(3); ideal [A, B] = 7/log2(2) + 3/log2(3)
    const dcg = 3 / 1 + 7 / Math.log2(3);
    const ideal = 7 / 1 + 3 / Math.log2(3);
    expect(ndcgAtK(["B", "A"], { A: 3, B: 2 }, 2)).toBeCloseTo(dcg / ideal, 10);
  });
});

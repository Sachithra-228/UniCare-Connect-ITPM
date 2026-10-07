/**
 * C1 - Scholarship matching engine (FR05).
 *
 * Two stages:
 *   1. HARD ELIGIBILITY - the scholarship's published criteria (GPA floor,
 *      income cap, year of study, rural-only). Ineligible scholarships are
 *      never shown. This is exactly what a traditional portal does.
 *   2. WEIGHTED ALIGNMENT RANKING - eligible scholarships are ranked by how well
 *      they fit the student's vulnerability (from the AI model), academic
 *      headroom, award size relative to need, and deadline urgency.
 *
 * The rule-based baseline used in the evaluation (`rankByAmount`) keeps stage 1
 * but ranks by award value only, which is the "status-quo" comparison required
 * by the proposal (Section 3.3 / Specific Objective 5).
 */
import type { StudentFinancialProfile, VulnerabilityAssessment } from "./vulnerability";

export type ScholarshipType = "need" | "merit" | "mixed";

export type ScholarshipCriteria = {
  id: string;
  title: string;
  provider: string;
  type: ScholarshipType;
  amountLkr: number;
  minGpa: number;
  maxMonthlyIncomeLkr: number;
  /** Soft target: how vulnerable the donor wants recipients to be (0 = no preference). */
  minVulnerability: number;
  eligibleYears: number[];
  ruralOnly: boolean;
  /** Days until the application deadline. */
  deadlineDays: number;
};

export type Recommendation = {
  scholarship: ScholarshipCriteria;
  /** 0-1 alignment score used for ranking. */
  score: number;
  /** Plain-language reasons shown to the student (explainability). */
  reasons: string[];
};

export const MATCH_WEIGHTS: Record<ScholarshipType, { need: number; merit: number }> = {
  need: { need: 0.5, merit: 0.1 },
  merit: { need: 0.1, merit: 0.5 },
  mixed: { need: 0.3, merit: 0.3 }
};
const AMOUNT_WEIGHT = 0.3;
const URGENCY_WEIGHT = 0.05;
const MAX_AMOUNT_LKR = 360_000;
const MAX_DEADLINE_DAYS = 120;

export function isEligible(profile: StudentFinancialProfile, s: ScholarshipCriteria): boolean {
  return (
    profile.gpa >= s.minGpa &&
    profile.monthlyHouseholdIncomeLkr <= s.maxMonthlyIncomeLkr &&
    s.eligibleYears.includes(profile.yearOfStudy) &&
    (profile.ruralDistrict || !s.ruralOnly)
  );
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

export function scoreMatch(
  profile: StudentFinancialProfile,
  assessment: Pick<VulnerabilityAssessment, "vulnerabilityIndex">,
  s: ScholarshipCriteria
): Recommendation {
  const need = assessment.vulnerabilityIndex / 100;
  const meritHeadroom = clamp01(profile.gpa - s.minGpa);
  const amountFit = clamp01(s.amountLkr / MAX_AMOUNT_LKR) * (0.4 + 0.6 * need);
  const urgency = clamp01(1 - s.deadlineDays / MAX_DEADLINE_DAYS);
  const w = MATCH_WEIGHTS[s.type];

  const score = w.need * need + w.merit * meritHeadroom + AMOUNT_WEIGHT * amountFit + URGENCY_WEIGHT * urgency;

  const reasons: string[] = [];
  if (s.type !== "merit" && assessment.vulnerabilityIndex >= 60) reasons.push("Targets students with high financial need");
  if (s.type !== "need" && meritHeadroom >= 0.5) reasons.push(`Your GPA (${profile.gpa.toFixed(2)}) exceeds the minimum (${s.minGpa.toFixed(1)})`);
  if (s.amountLkr >= 180_000 && need >= 0.6) reasons.push(`Large award (LKR ${s.amountLkr.toLocaleString("en-LK")})`);
  if (s.deadlineDays <= 21) reasons.push(`Deadline in ${s.deadlineDays} days`);
  if (reasons.length === 0) reasons.push("Meets all eligibility criteria");

  return { scholarship: s, score, reasons };
}

/** Proposed ranker: eligibility filter + weighted alignment. */
export function rankScholarships(
  profile: StudentFinancialProfile,
  assessment: Pick<VulnerabilityAssessment, "vulnerabilityIndex">,
  scholarships: ScholarshipCriteria[]
): Recommendation[] {
  return scholarships
    .filter((s) => isEligible(profile, s))
    .map((s) => scoreMatch(profile, assessment, s))
    .sort((a, b) => b.score - a.score || a.scholarship.id.localeCompare(b.scholarship.id));
}

/** Baseline ranker: same eligibility filter, ranked by award value (status-quo "biggest first"). */
export function rankByAmount(profile: StudentFinancialProfile, scholarships: ScholarshipCriteria[]): ScholarshipCriteria[] {
  return scholarships
    .filter((s) => isEligible(profile, s))
    .sort((a, b) => b.amountLkr - a.amountLkr || a.id.localeCompare(b.id));
}

/** Normalised Discounted Cumulative Gain at K with graded relevance (gain = 2^rel - 1). */
export function ndcgAtK(rankedIds: string[], relevance: Record<string, number>, k: number): number {
  const gain = (rel: number) => 2 ** rel - 1;
  const dcg = rankedIds.slice(0, k).reduce((sum, id, i) => sum + gain(relevance[id] ?? 0) / Math.log2(i + 2), 0);
  const ideal = Object.values(relevance)
    .sort((a, b) => b - a)
    .slice(0, k)
    .reduce((sum, rel, i) => sum + gain(rel) / Math.log2(i + 2), 0);
  return ideal === 0 ? 0 : dcg / ideal;
}

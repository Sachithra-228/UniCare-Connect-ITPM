/**
 * Evaluates the C1 scholarship matching engine against the rule-based baseline.
 *
 *   npm run c1:eval-matching
 *
 * Ground truth = graded relevance (0-3) from `ml/data/matching_eval.json`
 * (simulated expert judgements on HOLD-OUT students; see ml/synthetic_data.py).
 * The metric is NDCG@K (proposal target: >= 0.88 vs rule-based baseline).
 *
 * SYNTHETIC-DATA CAVEAT: relevance is produced by a simulated rubric, so this
 * demonstrates that the evaluation harness and ranker work - it is not evidence
 * of real-world recommendation quality. Re-run with welfare-officer judgements.
 */
import fs from "node:fs";
import path from "node:path";
import { assessVulnerability, type StudentFinancialProfile } from "../../src/lib/c1/vulnerability";
import { ndcgAtK, rankByAmount, rankScholarships, type ScholarshipCriteria } from "../../src/lib/c1/matching";

type RawScholarship = {
  id: string;
  title: string;
  provider: string;
  type: "need" | "merit" | "mixed";
  amount_lkr: number;
  min_gpa: number;
  max_monthly_income_lkr: number;
  min_vulnerability: number;
  eligible_years: number[];
  rural_only: boolean;
  deadline_days: number;
};
type RawProfile = Record<string, number | string>;
type EvalFile = {
  scholarships: RawScholarship[];
  items: Array<{ student_id: string; profile: RawProfile; relevance: Record<string, number> }>;
};

function toProfile(r: RawProfile): StudentFinancialProfile {
  return {
    monthlyHouseholdIncomeLkr: Number(r.monthly_household_income_lkr),
    householdSize: Number(r.household_size),
    dependents: Number(r.dependents),
    siblingsInEducation: Number(r.siblings_in_education),
    guardianEmployment: r.guardian_employment as StudentFinancialProfile["guardianEmployment"],
    singleParent: Number(r.single_parent) === 1,
    hasEducationLoan: Number(r.has_education_loan) === 1,
    loanAmountLkr: Number(r.loan_amount_lkr),
    monthlyExpensesLkr: Number(r.monthly_expenses_lkr),
    accommodation: r.accommodation as StudentFinancialProfile["accommodation"],
    ruralDistrict: Number(r.rural_district) === 1,
    financialShockLastYear: Number(r.financial_shock_last_year) === 1,
    currentScholarship: Number(r.current_scholarship) === 1,
    gpa: Number(r.gpa),
    yearOfStudy: Number(r.year_of_study)
  };
}

function toCriteria(s: RawScholarship): ScholarshipCriteria {
  return {
    id: s.id,
    title: s.title,
    provider: s.provider,
    type: s.type,
    amountLkr: s.amount_lkr,
    minGpa: s.min_gpa,
    maxMonthlyIncomeLkr: s.max_monthly_income_lkr,
    minVulnerability: s.min_vulnerability,
    eligibleYears: s.eligible_years,
    ruralOnly: s.rural_only,
    deadlineDays: s.deadline_days
  };
}

// small seeded PRNG so the bootstrap is reproducible
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function main() {
  const root = path.join(__dirname, "..", "..");
  const data: EvalFile = JSON.parse(fs.readFileSync(path.join(root, "ml", "data", "matching_eval.json"), "utf-8"));
  const catalogue = data.scholarships.map(toCriteria);

  const ks = [3, 5, 10];
  const proposed: Record<number, number[]> = { 3: [], 5: [], 10: [] };
  const baseline: Record<number, number[]> = { 3: [], 5: [], 10: [] };
  let precisionProposed = 0;
  let precisionBaseline = 0;
  let evaluated = 0;

  for (const item of data.items) {
    const hasRelevant = Object.values(item.relevance).some((r) => r > 0);
    if (!hasRelevant) continue; // nothing to rank for this student
    evaluated++;
    const profile = toProfile(item.profile);
    const assessment = assessVulnerability(profile);
    const prop = rankScholarships(profile, assessment, catalogue).map((r) => r.scholarship.id);
    const base = rankByAmount(profile, catalogue).map((s) => s.id);
    for (const k of ks) {
      proposed[k].push(ndcgAtK(prop, item.relevance, k));
      baseline[k].push(ndcgAtK(base, item.relevance, k));
    }
    const p5 = (ids: string[]) => ids.slice(0, 5).filter((id) => item.relevance[id] >= 2).length / 5;
    precisionProposed += p5(prop);
    precisionBaseline += p5(base);
  }

  // paired bootstrap CI on mean NDCG@5 difference
  const rand = mulberry32(42);
  const diffs5 = proposed[5].map((v, i) => v - baseline[5][i]);
  const boots: number[] = [];
  for (let b = 0; b < 2000; b++) {
    let s = 0;
    for (let i = 0; i < diffs5.length; i++) s += diffs5[Math.floor(rand() * diffs5.length)];
    boots.push(s / diffs5.length);
  }
  boots.sort((a, b) => a - b);

  const result = {
    warning: "SYNTHETIC DATA - simulated expert relevance; validates the harness, not real-world quality.",
    generatedAt: new Date().toISOString(),
    studentsEvaluated: evaluated,
    scholarshipsInCatalogue: catalogue.length,
    ndcg: Object.fromEntries(
      ks.map((k) => [
        `@${k}`,
        { proposed: mean(proposed[k]), ruleBasedBaseline: mean(baseline[k]), improvement: mean(proposed[k]) - mean(baseline[k]) }
      ])
    ),
    precisionAt5_relevanceGte2: {
      proposed: precisionProposed / evaluated,
      ruleBasedBaseline: precisionBaseline / evaluated
    },
    pairedBootstrapNdcg5Difference: {
      mean: mean(diffs5),
      ci95: [boots[Math.floor(0.025 * boots.length)], boots[Math.floor(0.975 * boots.length)]]
    },
    proposalTarget: { "NDCG@K": 0.88 },
    meetsTargetNdcg5: mean(proposed[5]) >= 0.88
  };

  const out = path.join(root, "docs", "c1", "evidence", "matching-eval.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main();

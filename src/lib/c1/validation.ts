import { z } from "zod";
import type { ScholarshipCriteria } from "./matching";
import type { StudentFinancialProfile } from "./vulnerability";

/** Mirrors the bounds enforced by the browser form (assessment-tool.tsx). */
export const financialProfileSchema = z
  .object({
    monthlyHouseholdIncomeLkr: z.number().min(5_000).max(1_000_000),
    householdSize: z.number().int().min(2).max(9),
    dependents: z.number().int().min(0).max(8),
    siblingsInEducation: z.number().int().min(0).max(6),
    guardianEmployment: z.enum(["formal", "informal", "unemployed", "retired", "deceased"]),
    singleParent: z.boolean(),
    hasEducationLoan: z.boolean(),
    loanAmountLkr: z.number().min(0).max(10_000_000),
    monthlyExpensesLkr: z.number().min(5_000).max(200_000),
    accommodation: z.enum(["home", "boarding", "hostel"]),
    ruralDistrict: z.boolean(),
    financialShockLastYear: z.boolean(),
    currentScholarship: z.boolean(),
    gpa: z.number().min(0).max(4),
    yearOfStudy: z.number().int().min(3).max(4)
  })
  .refine((p) => p.dependents <= p.householdSize - 1, { message: "dependents must be less than household size" })
  .refine((p) => p.hasEducationLoan || p.loanAmountLkr === 0, { message: "loan amount requires hasEducationLoan" });

export const assessmentRequestSchema = z.object({
  profile: financialProfileSchema,
  /** The student must explicitly consent before anything is stored (ethics requirement). */
  consent: z.literal(true)
});

export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;

export function parseProfile(input: unknown): StudentFinancialProfile | null {
  const parsed = financialProfileSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/** Structured criteria a donor can attach to a scholarship so it can be ranked. */
export const scholarshipCriteriaSchema = z.object({
  type: z.enum(["need", "merit", "mixed"]),
  minGpa: z.number().min(0).max(4),
  maxMonthlyIncomeLkr: z.number().min(0).max(10_000_000),
  minVulnerability: z.number().min(0).max(100),
  eligibleYears: z.array(z.number().int().min(1).max(4)).min(1).max(4),
  ruralOnly: z.boolean()
});

export type StoredScholarshipCriteria = z.infer<typeof scholarshipCriteriaSchema>;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseAmountLkr(value: unknown): number {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Converts a stored scholarship document into rankable criteria. Returns null when the
 * document has no (valid) structured criteria, is closed, or its deadline has passed.
 */
export function scholarshipDocToCriteria(doc: Record<string, unknown>, now = Date.now()): ScholarshipCriteria | null {
  const parsed = scholarshipCriteriaSchema.safeParse(doc.criteria);
  if (!parsed.success) return null;
  if (String(doc.status ?? "active").toLowerCase() === "closed") return null;
  const deadline = Date.parse(String(doc.deadline ?? ""));
  if (!Number.isFinite(deadline)) return null;
  const deadlineDays = Math.ceil((deadline - now) / DAY_MS);
  if (deadlineDays < 0) return null;
  const c = parsed.data;
  return {
    id: String(doc._id ?? doc.id ?? ""),
    title: String(doc.title ?? "Scholarship"),
    provider: String(doc.provider ?? "Donor"),
    type: c.type,
    amountLkr: parseAmountLkr(doc.amount),
    minGpa: c.minGpa,
    maxMonthlyIncomeLkr: c.maxMonthlyIncomeLkr,
    minVulnerability: c.minVulnerability,
    eligibleYears: c.eligibleYears,
    ruralOnly: c.ruralOnly,
    deadlineDays
  };
}

export type AidScoreInput = {
  incomeLevel: "low" | "medium" | "high";
  urgency: number;
  dependents: number;
};

export function calculateAidScore(input: AidScoreInput) {
  const incomeWeight = input.incomeLevel === "low" ? 3 : input.incomeLevel === "medium" ? 2 : 1;
  const urgencyWeight = Math.min(10, Math.max(1, input.urgency));
  const dependentsWeight = Math.min(5, Math.max(0, input.dependents));
  return incomeWeight * 10 + urgencyWeight + dependentsWeight;
}

export function isEligibleForEmergencyAid(score: number) {
  return score >= 25;
}

export function normalizeAmount(amount: string) {
  return Number(amount.replace(/[^0-9.]/g, ""));
}

export function getPaymentPlanMonths(amount: number) {
  if (amount <= 50000) return 6;
  if (amount <= 150000) return 12;
  return 24;
}

export function canRequestEquipment(hasPendingRequest: boolean) {
  return !hasPendingRequest;
}

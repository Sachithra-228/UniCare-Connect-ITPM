import {
  calculateAidScore,
  isEligibleForEmergencyAid,
  normalizeAmount,
  getPaymentPlanMonths,
  canRequestEquipment
} from "@/lib/logic/financial";

describe("financial support logic", () => {
  it("calculates aid score with weighted factors", () => {
    const score = calculateAidScore({ incomeLevel: "low", urgency: 8, dependents: 2 });
    expect(score).toBeGreaterThan(25);
  });

  it("flags eligibility for emergency aid", () => {
    expect(isEligibleForEmergencyAid(30)).toBe(true);
    expect(isEligibleForEmergencyAid(10)).toBe(false);
  });

  it("normalizes currency amounts", () => {
    expect(normalizeAmount("LKR 12,000")).toBe(12000);
  });

  it("returns payment plan months based on amount", () => {
    expect(getPaymentPlanMonths(40000)).toBe(6);
    expect(getPaymentPlanMonths(100000)).toBe(12);
    expect(getPaymentPlanMonths(250000)).toBe(24);
  });

  it("prevents equipment request when pending", () => {
    expect(canRequestEquipment(false)).toBe(true);
    expect(canRequestEquipment(true)).toBe(false);
  });
});

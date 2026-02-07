import {
  getWellnessRecommendation,
  normalizeMood,
  isHighRiskMood,
  calculateWellnessScore,
  shouldSuggestChallenge
} from "@/lib/logic/wellness";

describe("wellness module logic", () => {
  it("recommends counseling for high stress", () => {
    expect(getWellnessRecommendation(8, 5)).toContain("counseling");
  });

  it("normalizes mood values", () => {
    expect(normalizeMood("  Good ")).toBe("good");
  });

  it("flags high risk moods", () => {
    expect(isHighRiskMood("anxious")).toBe(true);
  });

  it("calculates wellness score", () => {
    expect(calculateWellnessScore(4, 7)).toBeGreaterThan(5);
  });

  it("suggests challenge when score is low", () => {
    expect(shouldSuggestChallenge(4)).toBe(true);
  });
});

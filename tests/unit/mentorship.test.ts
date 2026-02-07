import {
  canScheduleSession,
  formatSessionTopic,
  isValidSessionTime,
  calculateMentorScore,
  isFeedbackRequired
} from "@/lib/logic/mentorship";

describe("mentorship module logic", () => {
  it("limits sessions per student", () => {
    expect(canScheduleSession(2)).toBe(true);
    expect(canScheduleSession(3)).toBe(false);
  });

  it("formats session topics", () => {
    expect(formatSessionTopic("  Career   prep ")).toBe("Career prep");
  });

  it("validates session time", () => {
    expect(isValidSessionTime("2026-02-12T10:00:00+05:30")).toBe(true);
  });

  it("calculates mentor score", () => {
    expect(calculateMentorScore(4.5, 12)).toBeGreaterThan(40);
  });

  it("requires feedback only for completed sessions", () => {
    expect(isFeedbackRequired("completed")).toBe(true);
    expect(isFeedbackRequired("pending")).toBe(false);
  });
});

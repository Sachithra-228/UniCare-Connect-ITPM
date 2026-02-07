import { demoScholarships, demoJobs } from "@/lib/demo-data";
import {
  matchScholarships,
  filterJobs,
  getUpcomingDeadlines,
  calculateSkillGap,
  formatSalaryRange
} from "@/lib/logic/career";

describe("career module logic", () => {
  it("matches scholarships by tags", () => {
    const results = matchScholarships(demoScholarships, ["need-based"]);
    expect(results.length).toBeGreaterThan(0);
  });

  it("filters jobs by keyword", () => {
    const results = filterJobs(demoJobs, "intern");
    expect(results[0]?.title.toLowerCase()).toContain("intern");
  });

  it("returns upcoming deadlines only", () => {
    const results = getUpcomingDeadlines([{ deadline: "2099-01-01" }, { deadline: "2000-01-01" }]);
    expect(results.length).toBe(1);
  });

  it("calculates skill gap correctly", () => {
    const gap = calculateSkillGap(["React"], ["React", "Node", "SQL"]);
    expect(gap).toEqual(["Node", "SQL"]);
  });

  it("formats salary labels", () => {
    expect(formatSalaryRange("LKR 40,000")).toBe("Rs. 40,000");
  });
});

import { GET as getScholarships } from "@/app/api/scholarships/route";
import { GET as getJobs } from "@/app/api/jobs/route";
import { GET as getHealthLogs } from "@/app/api/health-logs/route";

describe("API route integration", () => {
  it("returns scholarships list", async () => {
    const response = await getScholarships();
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns job listings", async () => {
    const response = await getJobs();
    const data = await response.json();
    expect(data.length).toBeGreaterThan(0);
  });

  it("returns health logs", async () => {
    const response = await getHealthLogs();
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

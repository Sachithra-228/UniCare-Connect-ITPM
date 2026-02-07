import { JobListing, Scholarship } from "@/types";

export function matchScholarships(scholarships: Scholarship[], tags: string[]) {
  return scholarships.filter((scholarship) =>
    tags.some((tag) => scholarship.tags.map((item) => item.toLowerCase()).includes(tag.toLowerCase()))
  );
}

export function filterJobs(jobs: JobListing[], keyword: string) {
  return jobs.filter((job) => job.title.toLowerCase().includes(keyword.toLowerCase()));
}

export function getUpcomingDeadlines(items: { deadline: string }[]) {
  const today = new Date();
  return items.filter((item) => new Date(item.deadline) > today);
}

export function calculateSkillGap(current: string[], target: string[]) {
  return target.filter((skill) => !current.includes(skill));
}

export function formatSalaryRange(value: string) {
  return value.replace("LKR", "Rs.");
}

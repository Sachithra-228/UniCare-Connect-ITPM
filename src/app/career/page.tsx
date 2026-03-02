import { SectionHeading } from "@/components/shared/section-heading";
import { ScholarshipMatcher } from "@/components/career/scholarship-matcher";
import { JobBoard } from "@/components/career/job-board";
import { ApplicationTracker } from "@/components/career/application-tracker";
import { SkillGapAnalysis } from "@/components/career/skill-gap-analysis";

export default function CareerPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow="Career & scholarship module"
        title="Advance your career journey"
        subtitle="Scholarship matching, internships, and skill recommendations."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScholarshipMatcher />
        <ApplicationTracker />
      </div>
      <JobBoard />
      <SkillGapAnalysis />
    </div>
  );
}

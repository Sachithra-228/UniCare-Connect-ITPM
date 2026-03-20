"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { ScholarshipMatcher } from "@/components/career/scholarship-matcher";
import { JobBoard } from "@/components/career/job-board";
import { ApplicationTracker } from "@/components/career/application-tracker";
import { SkillGapAnalysis } from "@/components/career/skill-gap-analysis";
import { useLanguage } from "@/context/language-context";

export default function CareerPage() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          eyebrow: "වෘත්තීය සහ ශිෂ්‍යත්ව මොඩියුලය",
          title: "ඔබගේ වෘත්තීය ගමන ඉදිරියට ගෙන යන්න",
          subtitle: "ශිෂ්‍යත්ව ගැලපීම්, පුහුණු අවස්ථා සහ දක්ෂතා නිර්දේශ."
        }
      : language === "ta"
        ? {
            eyebrow: "தொழில் மற்றும் உதவித்தொகை தொகுதி",
            title: "உங்கள் தொழில் பயணத்தை முன்னேற்றுங்கள்",
            subtitle: "உதவித்தொகை பொருத்தம், இன்டர்ன்ஷிப், மற்றும் திறன் பரிந்துரைகள்."
          }
        : {
            eyebrow: "Career & scholarship module",
            title: "Advance your career journey",
            subtitle: "Scholarship matching, internships, and skill recommendations."
          };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading eyebrow={text.eyebrow} title={text.title} subtitle={text.subtitle} />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScholarshipMatcher />
        <ApplicationTracker />
      </div>
      <JobBoard />
      <SkillGapAnalysis />
    </div>
  );
}

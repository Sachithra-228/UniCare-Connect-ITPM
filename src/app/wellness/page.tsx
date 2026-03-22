"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { MoodTracker } from "@/components/wellness/mood-tracker";
import { CounselorBooking } from "@/components/wellness/counselor-booking";
import { WellnessChallenges } from "@/components/wellness/wellness-challenges";
import { PeerSupport } from "@/components/wellness/peer-support";
import { HealthContent } from "@/components/wellness/health-content";
import { useLanguage } from "@/context/language-context";

export default function WellnessPage() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          eyebrow: "සෞඛ්‍ය සහ සුවතා මොඩියුලය",
          title: "ඔබගේ මානසික සහ ශාරීරික සුවතාවට සහාය දෙන්න",
          subtitle: "මනෝභාවය සටහන් කරන්න, උපදේශකයන් බුක් කරන්න, සහ සුවතා අභියෝගවලට එක්වන්න."
        }
      : language === "ta"
        ? {
            eyebrow: "ஆரோக்கியம் மற்றும் நலன் தொகுதி",
            title: "உங்கள் மன மற்றும் உடல் நலனை ஆதரிக்கவும்",
            subtitle: "மூட் பதிவு செய்யவும், ஆலோசகர் நேரம் பதிவு செய்யவும், நலன் சவால்களில் சேரவும்."
          }
        : {
            eyebrow: "Health & wellness module",
            title: "Support your mental and physical wellbeing",
            subtitle: "Track mood, book counselors, and join wellness challenges."
          };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading eyebrow={text.eyebrow} title={text.title} subtitle={text.subtitle} />
      <div className="grid gap-6 lg:grid-cols-2">
        <MoodTracker />
        <CounselorBooking />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <WellnessChallenges />
        <PeerSupport />
      </div>
      <HealthContent />
    </div>
  );
}

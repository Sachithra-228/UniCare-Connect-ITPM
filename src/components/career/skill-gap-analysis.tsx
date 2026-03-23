"use client";

import { Card } from "@/components/shared/card";
import { useLanguage } from "@/context/language-context";

export function SkillGapAnalysis() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "දක්ෂතා හිඩැස් විශ්ලේෂණය",
          body: "ඔබගේ වෘත්තීය ඉලක්ක මත පුද්ගලීකරණ කළ පාඨමාලා නිර්දේශ.",
          note: "මෙහි පුද්ගලීකරණ කළ දක්ෂතා නිර්දේශ ලබාගැනීමට Profile අංශයේ ඔබගේ පැතිකඩ සහ වෘත්තීය රුචි සම්පූර්ණ කරන්න."
        }
      : language === "ta"
        ? {
            title: "திறன் இடைவெளி பகுப்பாய்வு",
            body: "உங்கள் தொழில் இலக்குகளின் அடிப்படையில் தனிப்பயன் பாடநெறி பரிந்துரைகள்.",
            note: "இங்கே தனிப்பயன் திறன் பரிந்துரைகளைப் பெற Profile பகுதியில் உங்கள் சுயவிவரமும் தொழில் ஆர்வங்களும் பூர்த்தி செய்யவும்."
          }
        : {
            title: "Skill gap analysis",
            body: "Personalized course recommendations based on your career goals.",
            note:
              "Complete your profile and career interests in the Profile section to get personalized skill recommendations here."
          };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text.body}</p>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        {text.note}
      </p>
    </Card>
  );
}

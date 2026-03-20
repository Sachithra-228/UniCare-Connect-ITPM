"use client";

import { Card } from "@/components/shared/card";
import { useLanguage } from "@/context/language-context";

export function HealthContent() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "සෞඛ්‍ය සහ සුවතා සම්පත්",
          body: "තවම සම්පත් ලැයිස්තුගත කර නැත. ඔබගේ විශ්වවිද්‍යාලයට බහුභාෂා සුවතා අන්තර්ගතය මෙහි එක් කළ හැක."
        }
      : language === "ta"
        ? {
            title: "ஆரோக்கியம் மற்றும் நலன் வளங்கள்",
            body: "இன்னும் வளங்கள் பட்டியலிடப்படவில்லை. உங்கள் பல்கலைக்கழகம் பலமொழி நலன் உள்ளடக்கத்தை இங்கே சேர்க்கலாம்."
          }
        : {
            title: "Health & wellness resources",
            body: "No resources listed yet. Your university can add multilingual wellness content here."
          };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        {text.body}
      </p>
    </Card>
  );
}

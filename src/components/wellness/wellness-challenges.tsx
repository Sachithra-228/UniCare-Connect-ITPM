"use client";

import { Card } from "@/components/shared/card";
import { useLanguage } from "@/context/language-context";

export function WellnessChallenges() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "සුවතා අභියෝග",
          body: "දැනට සක්‍රීය අභියෝග නොමැත. ඔබගේ විශ්වවිද්‍යාලය හෝ සුවතා කණ්ඩායම එකතු කරන විට මෙහි පෙන්වනු ඇත."
        }
      : language === "ta"
        ? {
            title: "நலன் சவால்கள்",
            body: "தற்போது செயல்பாட்டிலுள்ள சவால்கள் இல்லை. உங்கள் பல்கலைக்கழகம் அல்லது நலன் குழு சேர்க்கும் போது இங்கே தோன்றும்."
          }
        : {
            title: "Wellness challenges",
            body:
              "No active challenges right now. New challenges will appear here when your university or wellness team adds them."
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

"use client";

import { Card } from "@/components/shared/card";
import { useLanguage } from "@/context/language-context";

export function CounselorBooking() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "උපදේශක බුකින්",
          body: "දැනට උපදේශක ලැයිස්තුවක් නොමැත. සැසියක් බුක් කිරීමට ශිෂ්‍ය සේවා අංශය අමතන්න, හෝ පසුව නැවත බලන්න."
        }
      : language === "ta"
        ? {
            title: "ஆலோசகர் முன்பதிவு",
            body: "தற்போது ஆலோசகர்கள் பட்டியல் இல்லை. அமர்வு முன்பதிவிற்கு மாணவர் சேவைகளை தொடர்புகொள்ளவும் அல்லது பின்னர் பார்க்கவும்."
          }
        : {
            title: "Counselor booking",
            body:
              "No counselors listed at the moment. Contact student services to book a session, or check back when availability is added here."
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

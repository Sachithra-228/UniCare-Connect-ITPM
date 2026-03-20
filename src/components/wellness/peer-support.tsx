"use client";

import { Card } from "@/components/shared/card";
import { useLanguage } from "@/context/language-context";

export function PeerSupport() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "සමපීඩන සහාය සංසදය",
          body: "ආරක්ෂාව සඳහා ඉක්මන් වාර්තා මෙවලම් සහිත නියාමිත සාකච්ඡා.",
          empty: "තවම සාකච්ඡා නොමැත. සංසදය විවෘත වූ විට නව මාතෘකාවක් ආරම්භ කරන්න, හෝ පසුව බලන්න."
        }
      : language === "ta"
        ? {
            title: "இணையாளர் ஆதரவு கருத்துக்களம்",
            body: "பாதுகாப்பிற்கான விரைவு புகார் கருவிகளுடன் மிதப்படுத்தப்பட்ட விவாதங்கள்.",
            empty: "இன்னும் விவாதங்கள் இல்லை. கருத்துக்களம் திறந்ததும் தலைப்பு தொடங்குங்கள் அல்லது பின்னர் பார்க்கவும்."
          }
        : {
            title: "Peer support forum",
            body: "Moderated discussions with quick report tools for safety.",
            empty: "No discussions yet. Start a topic when the forum is open, or check back later."
          };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text.body}</p>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        {text.empty}
      </p>
    </Card>
  );
}

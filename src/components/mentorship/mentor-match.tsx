"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { useLanguage } from "@/context/language-context";

type Mentor = {
  _id: string;
  name: string;
  email?: string;
  expertise?: string;
  availability?: string;
};

export function MentorMatch() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "මෙන්ටර් ගැලපීම්",
          body: "ඔබගේ ඉලක්ක මත පදනම්ව පුරෝගාමී සහ කර්මාන්ත මෙන්ටර්වරුන් සමඟ ගැලපෙන්න.",
          loading: "පූරණය වෙමින්...",
          empty: "දැනට මෙන්ටර්වරුන් නොමැත. පසුව නැවත බලන්න.",
          expertiseFallback: "වෘත්තීය මාර්ගෝපදේශනය",
          availability: "ලබාගත හැකි කාලය",
          availabilityFallback: "ඉල්ලීම මත",
          request: "සැසිය ඉල්ලන්න"
        }
      : language === "ta"
        ? {
            title: "வழிகாட்டி பொருத்தம்",
            body: "உங்கள் இலக்குகளின் அடிப்படையில் பழைய மாணவர்களும் தொழில் வழிகாட்டிகளும் இணைக.",
            loading: "ஏற்றப்படுகிறது...",
            empty: "தற்போது வழிகாட்டிகள் இல்லை. பின்னர் பார்க்கவும்.",
            expertiseFallback: "தொழில் வழிகாட்டல்",
            availability: "கிடைக்கும் நேரம்",
            availabilityFallback: "கோரிக்கைப்படி",
            request: "அமர்வு கோரிக்கை"
          }
        : {
            title: "Mentor matching",
            body: "Match with alumni and industry mentors based on your goals.",
            loading: "Loading...",
            empty: "No mentors available at the moment. Check back later.",
            expertiseFallback: "Career guidance",
            availability: "Availability",
            availabilityFallback: "By request",
            request: "Request session"
          };

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentors")
      .then((r) => r.json())
      .then((data) => setMentors(Array.isArray(data) ? data : []))
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text.body}</p>
      {loading ? (
        <p className="text-sm text-slate-500">{text.loading}</p>
      ) : mentors.length === 0 ? (
        <p className="text-sm text-slate-500">{text.empty}</p>
      ) : (
        <div className="space-y-3 text-sm">
          {mentors.map((mentor) => (
            <div key={mentor._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-slate-500">{mentor.expertise ?? text.expertiseFallback}</p>
              <p className="text-slate-500">{text.availability}: {mentor.availability ?? text.availabilityFallback}</p>
              <Button variant="secondary" className="mt-2">
                {text.request}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

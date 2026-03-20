"use client";

import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { useLanguage } from "@/context/language-context";

export function TuitionSupport() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "පාඨමාලා සහ නඩත්තු සහාය",
          body: "ශිෂ්‍යත්ව, ගාස්තු සහන, ගෙවීම් සැලසුම් සහ ආයතනික අනුග්‍රහ සොයා බලන්න.",
          bullet1: "මූල්‍ය අවශ්‍යතාව මත ගාස්තු සහන ගැලපීම්",
          bullet2: "විශ්වවිද්‍යාල මූල්‍ය කාර්යාල සමඟ ගෙවීම් සැලසුම් ඉල්ලීම්",
          bullet3: "ශිෂ්‍ය ණය මාර්ගෝපදේශනය සහ හවුල් බැංකු",
          eligibility: "සුදුසුකම් පරීක්ෂා කරන්න",
          scholarships: "ශිෂ්‍යත්ව ගැලපීම් බලන්න"
        }
      : language === "ta"
        ? {
            title: "கட்டணம் மற்றும் பராமரிப்பு ஆதரவு",
            body: "உதவித்தொகைகள், கட்டண தளர்வுகள், கட்டண திட்டங்கள், மற்றும் நிறுவன ஆதரவுகளை ஆராயுங்கள்.",
            bullet1: "நிதி தேவையை அடிப்படையாகக் கொண்ட கட்டண தளர்வு பொருத்தங்கள்",
            bullet2: "பல்கலைக்கழக நிதி அலுவலகங்களுடன் கட்டணத் திட்ட கோரிக்கைகள்",
            bullet3: "மாணவர் கடன் வழிகாட்டல் மற்றும் கூட்டாளர் வங்கிகள்",
            eligibility: "தகுதி சரிபார்க்கவும்",
            scholarships: "உதவித்தொகை பொருத்தங்கள் பார்க்க"
          }
        : {
            title: "Tuition & maintenance support",
            body: "Discover scholarships, fee waivers, payment plans, and corporate sponsorships.",
            bullet1: "Fee waiver matching based on financial need",
            bullet2: "Payment plan requests with university finance offices",
            bullet3: "Student loan guidance and partner banks",
            eligibility: "Check eligibility",
            scholarships: "View scholarship matches"
          };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text.body}</p>
      <ul className="text-sm text-slate-500">
        <li>• {text.bullet1}</li>
        <li>• {text.bullet2}</li>
        <li>• {text.bullet3}</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary">{text.eligibility}</Button>
        <Button variant="ghost">{text.scholarships}</Button>
      </div>
    </Card>
  );
}

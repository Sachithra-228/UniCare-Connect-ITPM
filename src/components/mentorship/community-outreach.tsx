"use client";

import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { useLanguage } from "@/context/language-context";

const outreach = [
  { id: "o1", title: "Coastal cleanup", date: "Feb 18", hours: 4 },
  { id: "o2", title: "STEM tutoring", date: "Feb 26", hours: 2 }
];

export function CommunityOutreach() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? { title: "ප්‍රජා ක්‍රියාකාරකම් සහ ස්වේච්ඡා සේවය", join: "ක්‍රියාකාරකමට එක්වන්න", hours: "පැය" }
      : language === "ta"
        ? { title: "சமூக சேவை மற்றும் தன்னார்வம்", join: "செயல்பாட்டில் சேரவும்", hours: "மணி" }
        : { title: "Community outreach & volunteering", join: "Join activity", hours: "hours" };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <div className="space-y-3 text-sm">
        {outreach.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="font-semibold">{item.title}</p>
            <p className="text-slate-500">
              {item.date} • {item.hours} {text.hours}
            </p>
            <Button variant="secondary" className="mt-2">
              {text.join}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

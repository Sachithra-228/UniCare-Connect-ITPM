"use client";

import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { useLanguage } from "@/context/language-context";

const offers = [
  { title: "Meal voucher program", detail: "200 vouchers this semester", status: "active" },
  { title: "Host family matching", detail: "12 hosts near Kandy campus", status: "active" },
  { title: "Subsidized groceries", detail: "10% partner discount", status: "active" }
];

export function BoardingSupport() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "නවාතැන් සහ දෛනික අවශ්‍යතා",
          body: "ආරක්ෂිත නවාතැන් ගැලපීම්, ආහාර වවුචර් සහ සේවා ගාස්තු සහාය ලබාගන්න.",
          active: "සක්‍රීය"
        }
      : language === "ta"
        ? {
            title: "தங்குமிடம் மற்றும் அன்றாட தேவைகள்",
            body: "பாதுகாப்பான தங்குமிடம் பொருத்தம், உணவு வவுச்சர்கள், மற்றும் பயன்பாட்டு கட்டண ஆதரவைப் பெறுங்கள்.",
            active: "செயலில்"
          }
        : {
            title: "Boarding & daily necessities",
            body: "Access safe housing matches, meal vouchers, and utility bill support.",
            active: "active"
          };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text.body}</p>
      <div className="space-y-3">
        {offers.map((offer) => (
          <div
            key={offer.title}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
          >
            <div>
              <p className="font-semibold">{offer.title}</p>
              <p className="text-slate-500">{offer.detail}</p>
            </div>
            <Badge variant="success">{text.active}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

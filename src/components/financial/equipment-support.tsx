"use client";

import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { useLanguage } from "@/context/language-context";

const partners = ["SL Tech Alliance", "LaptopLanka", "Dialog Axiata", "Microsoft Sri Lanka"];

export function EquipmentSupport() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "උපාංග සහ සම්පත් සහාය",
          body:
            "සත්‍යාපිත විශ්වවිද්‍යාල හවුල්කරුවන් හරහා ලැප්ටොප්, පොත් සහ ලැබ් උපකරණ ඉල්ලන්න. උපාංග සමාන ලකුණු පද්ධතියක් මත බෙදා හැරේ.",
          request: "උපාංග ඉල්ලන්න",
          inventory: "දාන තොග බලන්න"
        }
      : language === "ta"
        ? {
            title: "சாதனங்கள் மற்றும் வள ஆதரவு",
            body:
              "சரிபார்க்கப்பட்ட பல்கலைக்கழக கூட்டாளர்களின் மூலம் லேப்டாப், புத்தகங்கள், மற்றும் ஆய்வக சாதனங்களை கோரலாம். சாதனங்கள் சமமான மதிப்பீட்டின் அடிப்படையில் ஒதுக்கப்படும்.",
            request: "சாதனம் கோரவும்",
            inventory: "நன்கொடை இருப்பு பார்க்க"
          }
        : {
            title: "Equipment & resource support",
            body:
              "Request laptops, books, and lab equipment through verified university partners. Devices are allocated via an equitable scoring system.",
            request: "Request equipment",
            inventory: "View donation inventory"
          };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text.body}</p>
      <ul className="text-sm text-slate-500">
        {partners.map((partner) => (
          <li key={partner}>• {partner}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary">{text.request}</Button>
        <Button variant="ghost">{text.inventory}</Button>
      </div>
    </Card>
  );
}

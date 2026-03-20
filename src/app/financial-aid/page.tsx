"use client";

import { Card } from "@/components/shared/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { AidRequestForm } from "@/components/financial/aid-request-form";
import { EquipmentSupport } from "@/components/financial/equipment-support";
import { BoardingSupport } from "@/components/financial/boarding-support";
import { TuitionSupport } from "@/components/financial/tuition-support";
import { PartTimeJobPreview } from "@/components/financial/part-time-job-preview";
import { useLanguage } from "@/context/language-context";

export default function FinancialAidPage() {
  const { language } = useLanguage();

  const text =
    language === "si"
      ? {
          eyebrow: "මූල්‍ය සහාය සහ රැකියා ද්වාරය",
          title: "අධ්‍යයන ආධාර සහ දෛනික අවශ්‍යතා සඳහා අයදුම් කරන්න",
          subtitle: "හදිසි අධ්‍යයන සහාය, උපාංග ණය, නවාතැන් සහාය සහ පාඨමාලා ආධාර.",
          formTitle: "හදිසි අධ්‍යයන ආධාර අයදුම්පත"
        }
      : language === "ta"
        ? {
            eyebrow: "நிதி ஆதரவு மற்றும் வேலை தளம்",
            title: "கல்வி உதவி மற்றும் அன்றாட தேவைகளுக்கு விண்ணப்பிக்கவும்",
            subtitle: "அவசர கல்வி ஆதரவு, சாதனக் கடன், தங்குமிடம் உதவி, மற்றும் கட்டண உதவி.",
            formTitle: "அவசர கல்வி உதவி விண்ணப்பம்"
          }
        : {
            eyebrow: "Financial support & job portal",
            title: "Apply for academic aid and daily necessities",
            subtitle: "Emergency academic support, device loans, boarding help, and tuition assistance.",
            formTitle: "Emergency academic aid application"
          };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
      <SectionHeading
        eyebrow={text.eyebrow}
        title={text.title}
        subtitle={text.subtitle}
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">{text.formTitle}</h3>
          <AidRequestForm />
        </Card>
        <div className="space-y-6">
          <EquipmentSupport />
          <PartTimeJobPreview />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BoardingSupport />
        <TuitionSupport />
      </div>
    </div>
  );
}

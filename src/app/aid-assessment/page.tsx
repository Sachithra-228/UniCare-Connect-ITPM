"use client";

import { AssessmentTool } from "@/components/c1/assessment-tool";
import { useLanguage } from "@/context/language-context";
import { getC1Text } from "@/lib/c1/i18n";

export default function AidAssessmentPage() {
  const { language } = useLanguage();
  const t = getC1Text(language);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">{t.toolTitle}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{t.toolSubtitle}</p>
      </header>
      <AssessmentTool />
    </div>
  );
}

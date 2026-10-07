"use client";

import { LedgerExplorer } from "@/components/c1/ledger-explorer";
import { useLanguage } from "@/context/language-context";
import { getC1Text } from "@/lib/c1/i18n";

export default function TransparencyPage() {
  const { language } = useLanguage();
  const t = getC1Text(language);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">{t.ledgerTitle}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{t.ledgerSubtitle}</p>
      </header>
      <LedgerExplorer variant="public" />
    </div>
  );
}

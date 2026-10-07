"use client";

import { LedgerExplorer } from "./ledger-explorer";
import { useLanguage } from "@/context/language-context";
import { getC1Text } from "@/lib/c1/i18n";

/** Dashboard wrapper around the ledger explorer for the admin ("admin") and donor ("donor") roles. */
export function LedgerSection({ variant }: { variant: "admin" | "donor" }) {
  const { language } = useLanguage();
  const t = getC1Text(language);
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold">{variant === "admin" ? t.adminTitle : t.donorTitle}</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t.ledgerSubtitle}</p>
      </header>
      <LedgerExplorer variant={variant} />
    </div>
  );
}

export function AdminFundLedgerSection() {
  return <LedgerSection variant="admin" />;
}

export function DonorFundTransparencySection() {
  return <LedgerSection variant="donor" />;
}

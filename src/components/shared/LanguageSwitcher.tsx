"use client";

import { useLanguage } from "@/context/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
      value={language}
      onChange={(event) => setLanguage(event.target.value as "en" | "si" | "ta")}
      aria-label="Switch language"
    >
      <option value="en">EN</option>
      <option value="si">සිං</option>
      <option value="ta">தமிழ்</option>
    </select>
  );
}

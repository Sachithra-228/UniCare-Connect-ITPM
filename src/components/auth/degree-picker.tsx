"use client";

import { useState, useRef } from "react";
import { OTHER_DEGREE_VALUE, localizeSignupOptionLabel } from "@/lib/signup-data";
import { DropdownPortal } from "./dropdown-portal";
import { useLanguage } from "@/context/language-context";

type DegreePickerProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

export function DegreePicker({
  options,
  value,
  onChange,
  id,
  placeholder = "Select degree program",
  disabled = false,
  "aria-label": ariaLabel,
  className = ""
}: DegreePickerProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const text =
    language === "si"
      ? {
          otherLabel: "වෙනත් (විස්තර කරන්න)",
          defaultPlaceholder: "උපාධි වැඩසටහන තෝරන්න",
          searchPlaceholder: "සෙවීමට ටයිප් කරන්න...",
          searchAria: "උපාධි වැඩසටහන් සෙවීම",
          noMatches: "ගැලපීම් නොමැත. ඔබේ විස්තරය ටයිප් කිරීමට \"වෙනත්\" තෝරන්න."
        }
      : language === "ta"
        ? {
            otherLabel: "மற்றவை (தயவுசெய்து குறிப்பிடவும்)",
            defaultPlaceholder: "பட்டப்படிப்பு திட்டத்தை தேர்ந்தெடுக்கவும்",
            searchPlaceholder: "தேட தட்டச்சு செய்யவும்...",
            searchAria: "பட்டப்படிப்பு திட்டங்களை தேடுங்கள்",
            noMatches: "பொருத்தங்கள் இல்லை. உங்கள் சொந்த விவரத்தை உள்ளிட \"மற்றவை\" ஐ தேர்ந்தெடுக்கவும்."
          }
        : {
            otherLabel: "Other (Please specify)",
            defaultPlaceholder: "Select degree program",
            searchPlaceholder: "Type to search...",
            searchAria: "Search degree programs",
            noMatches: "No matches. Try \"Other\" to type your own."
          };

  const displayValue =
    value === OTHER_DEGREE_VALUE || value === "Other"
      ? text.otherLabel
      : value
        ? localizeSignupOptionLabel(value, language)
        : "";
  const optionsWithoutOther = options.filter(
    (o) => o !== "Other (Please specify)" && o !== "Other"
  );
  const filtered = optionsWithoutOther.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase().trim())
  );
  const showOther =
    !search.trim() ||
    text.otherLabel.toLowerCase().includes(search.toLowerCase().trim()) ||
    (search.trim() && filtered.length === 0);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900"
      >
        <span className={displayValue ? "text-slate-900 dark:text-slate-100" : "text-slate-500"}>
          {displayValue || (placeholder === "Select degree program" ? text.defaultPlaceholder : placeholder)}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <DropdownPortal open={open && !disabled} anchorRef={containerRef} onClose={() => setOpen(false)}>
        <div role="listbox" className="flex max-h-[300px] flex-col">
          <div className="shrink-0 border-b border-slate-100 p-2 dark:border-slate-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={text.searchPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800"
              autoFocus
              aria-label={text.searchAria}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={value === opt}
                onClick={() => select(opt)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-primary/10 focus:bg-primary/10 focus:outline-none aria-selected:bg-primary/15 aria-selected:font-medium"
              >
                {localizeSignupOptionLabel(opt, language)}
              </button>
            ))}
            {showOther && (
              <div className="border-t border-slate-100 px-2 py-1 dark:border-slate-700">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === OTHER_DEGREE_VALUE || value === "Other (Please specify)" || value === "Other"}
                  onClick={() => select(OTHER_DEGREE_VALUE)}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary/10 focus:bg-primary/10 focus:outline-none aria-selected:bg-primary/15"
                >
                  {text.otherLabel}
                </button>
              </div>
            )}
            {filtered.length === 0 && !showOther && search.trim() && (
              <p className="px-4 py-3 text-sm text-slate-500">{text.noMatches}</p>
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
}

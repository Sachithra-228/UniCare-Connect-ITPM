"use client";

import { useState, useRef } from "react";
import {
  GOVERNMENT_UNIVERSITIES,
  PRIVATE_UNIVERSITIES,
  OTHER_UNIVERSITY_VALUE
} from "@/lib/signup-data";
import { DropdownPortal } from "./dropdown-portal";

const OTHER_LABEL = "Other (Please specify)";

type UniversityPickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

export function UniversityPicker({
  value,
  onChange,
  id,
  placeholder = "Search or choose your university",
  "aria-label": ariaLabel,
  className = ""
}: UniversityPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue =
    value === OTHER_UNIVERSITY_VALUE ? OTHER_LABEL : value || "";

  const filter = (list: readonly string[]) =>
    list.filter((u) => u.toLowerCase().includes(search.toLowerCase().trim()));

  const govFiltered = filter(GOVERNMENT_UNIVERSITIES);
  const privFiltered = filter(PRIVATE_UNIVERSITIES);
  const showOther =
    !search.trim() ||
    OTHER_LABEL.toLowerCase().includes(search.toLowerCase().trim()) ||
    (search.trim() && !govFiltered.length && !privFiltered.length);

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
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900"
      >
        <span className={displayValue ? "text-slate-900 dark:text-slate-100" : "text-slate-500"}>
          {displayValue || placeholder}
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

      <DropdownPortal open={open} anchorRef={containerRef} onClose={() => setOpen(false)}>
        <div role="listbox" className="flex max-h-[300px] flex-col">
          <div className="shrink-0 border-b border-slate-100 p-2 dark:border-slate-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800"
              autoFocus
              aria-label="Search universities"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            {govFiltered.length > 0 && (
              <div className="px-2 py-1">
                <p className="sticky top-0 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  Government Universities
                </p>
                {govFiltered.map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="option"
                    aria-selected={value === u}
                    onClick={() => select(u)}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-primary/10 focus:bg-primary/10 focus:outline-none aria-selected:bg-primary/15 aria-selected:font-medium"
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
            {privFiltered.length > 0 && (
              <div className="px-2 py-1">
                <p className="sticky top-0 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  Private Universities
                </p>
                {privFiltered.map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="option"
                    aria-selected={value === u}
                    onClick={() => select(u)}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-primary/10 focus:bg-primary/10 focus:outline-none aria-selected:bg-primary/15 aria-selected:font-medium"
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
            {showOther && (
              <div className="border-t border-slate-100 px-2 py-1 dark:border-slate-700">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === OTHER_UNIVERSITY_VALUE}
                  onClick={() => select(OTHER_UNIVERSITY_VALUE)}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary/10 focus:bg-primary/10 focus:outline-none aria-selected:bg-primary/15"
                >
                  {OTHER_LABEL}
                </button>
              </div>
            )}
            {!govFiltered.length && !privFiltered.length && !showOther && search.trim() && (
              <p className="px-4 py-3 text-sm text-slate-500">No matches. Try &quot;Other&quot; to type your own.</p>
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { DropdownPortal } from "./dropdown-portal";

export type RoleOption = { value: string; label: string };

type RolePickerProps = {
  options: RoleOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

export function RolePicker({
  options,
  value,
  onChange,
  id,
  placeholder = "Choose your role",
  "aria-label": ariaLabel,
  className = ""
}: RolePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue = options.find((o) => o.value === value)?.label ?? "";
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={"relative " + className}>
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
          className={"h-4 w-4 shrink-0 text-slate-400 transition " + (open ? "rotate-180" : "")}
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
              aria-label="Search roles"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={value === o.value}
                onClick={() => select(o.value)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-primary/10 focus:bg-primary/10 focus:outline-none aria-selected:bg-primary/15 aria-selected:font-medium"
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && search.trim() && (
              <p className="px-4 py-3 text-sm text-slate-500">No matching role.</p>
            )}
          </div>
        </div>
      </DropdownPortal>
    </div>
  );
}

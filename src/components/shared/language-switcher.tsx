"use client";

import { useLanguage } from "@/context/language-context";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(
    () =>
      [
        { value: "en", label: "English", shortLabel: "EN", lang: "en" },
        { value: "si", label: "සිංහල", shortLabel: "සි", lang: "si" },
        { value: "ta", label: "தமிழ்", shortLabel: "த", lang: "ta" },
      ] as const,
    []
  );

  const selected = options.find((o) => o.value === language) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`} aria-label="Switch language">
      <button
        type="button"
        className="inline-flex items-center justify-between gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-900/70"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {selected.shortLabel}
          </span>
          <span className="whitespace-nowrap" lang={selected.lang}>
            {selected.label}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      </button>

      <div
        className={[
          "absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl backdrop-blur-xl transition-all",
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
          "dark:border-slate-800 dark:bg-slate-950",
        ].join(" ")}
        role="menu"
      >
        {options.map((option) => {
          const isActive = option.value === language;
          return (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition",
                isActive
                  ? "bg-primary/12 text-primary dark:bg-primary/15 dark:text-primary"
                  : "text-slate-700 hover:bg-primary/5 hover:text-primary dark:text-slate-200 dark:hover:bg-primary/10",
              ].join(" ")}
              onClick={() => {
                setLanguage(option.value);
                setOpen(false);
              }}
            >
              <span className="whitespace-nowrap" lang={option.lang}>
                {option.label}
              </span>
              <Check className={`${isActive ? "visible" : "invisible"} h-4 w-4 text-primary`} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

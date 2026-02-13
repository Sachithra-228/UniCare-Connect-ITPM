"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type JourneySlide = {
  step: string;
  module: string;
  thought: string;
  resolved: string;
  accent: string;
};

const slides: JourneySlide[] = [
  {
    step: "01",
    module: "Financial Support",
    thought: "I am worried about tuition fees and emergency costs this semester.",
    resolved: "UniCare matched grants and fee-relief options, and my request got approved.",
    accent: "from-emerald-500/20 to-emerald-500/5"
  },
  {
    step: "02",
    module: "Career & Scholarships",
    thought: "I am not sure which internships and scholarships fit my profile.",
    resolved: "UniCare suggested role-based opportunities and scholarship matches in one dashboard.",
    accent: "from-sky-500/20 to-sky-500/5"
  },
  {
    step: "03",
    module: "Mentorship & Campus",
    thought: "I feel disconnected and I do not know who can guide me.",
    resolved: "UniCare connected me with mentors and relevant campus communities.",
    accent: "from-violet-500/20 to-violet-500/5"
  },
  {
    step: "04",
    module: "Health & Wellness",
    thought: "Stress is affecting my focus and I need support quickly.",
    resolved: "UniCare routed me to wellness resources and counselor booking without delay.",
    accent: "from-rose-500/20 to-rose-500/5"
  },
  {
    step: "Done",
    module: "Journey Complete",
    thought: "All my key challenges are now structured and manageable.",
    resolved: "UNICARE always with you.",
    accent: "from-primary/20 to-primary/5"
  }
];

function WalkingAvatar() {
  return (
    <div className="walking-avatar h-24 w-16">
      <svg viewBox="0 0 96 140" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="walkShirtV2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        <circle cx="48" cy="18" r="12" fill="#f8d5b9" stroke="#d4a985" strokeWidth="1.2" />
        <path d="M38 30h20l4 32H34z" fill="url(#walkShirtV2)" />
        <path d="M34 61h28v13H34z" fill="#0f172a" opacity="0.86" />

        <g className="walk-arm-left">
          <line x1="38" y1="40" x2="22" y2="63" stroke="#f8d5b9" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g className="walk-arm-right">
          <line x1="58" y1="40" x2="74" y2="66" stroke="#f8d5b9" strokeWidth="5" strokeLinecap="round" />
        </g>

        <g className="walk-leg-left">
          <line x1="44" y1="74" x2="34" y2="114" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="31" cy="118" rx="8" ry="4" fill="#111827" />
        </g>
        <g className="walk-leg-right">
          <line x1="54" y1="74" x2="64" y2="114" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="67" cy="118" rx="8" ry="4" fill="#111827" />
        </g>
      </svg>
    </div>
  );
}

export function CoreModulesJourney() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number | null; startX: number; startShift: number }>({
    pointerId: null,
    startX: 0,
    startShift: 0
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [dragShift, setDragShift] = useState<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const prev = () => setActiveIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  const next = () => setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);

  const current = slides[activeIndex];
  const isFinal = activeIndex === slides.length - 1;
  const maxAvatarIndex = slides.length - 1;
  const hiddenOffset = -100;
  const stepDistance = 74;
  const shiftForIndex = (index: number) => index * stepDistance;
  const clampShift = (shift: number) =>
    Math.min(shiftForIndex(maxAvatarIndex), Math.max(shiftForIndex(0), shift));
  const shiftFromIndex = entered ? shiftForIndex(Math.min(activeIndex, maxAvatarIndex)) : hiddenOffset;
  const avatarShift = dragShift ?? shiftFromIndex;

  const handleAvatarPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const startShift = dragShift ?? shiftForIndex(Math.min(activeIndex, maxAvatarIndex));
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startShift
    };
    setEntered(true);
    setDragShift(startShift);
  };

  const handleAvatarPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragStateRef.current.startX;
    setDragShift(clampShift(dragStateRef.current.startShift + delta));
  };

  const endAvatarDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const finalShift = dragShift ?? shiftForIndex(Math.min(activeIndex, maxAvatarIndex));
    const snappedIndex = Math.round(clampShift(finalShift) / stepDistance);
    setActiveIndex(Math.min(maxAvatarIndex, Math.max(0, snappedIndex)));
    dragStateRef.current.pointerId = null;
    setDragShift(null);
  };

  return (
    <section id="modules" ref={sectionRef} className="py-16">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4">
        <div
          className={`mx-auto max-w-4xl text-center transition-all duration-700 ${
            entered ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Everything students need in one place
          </h2>
          <p className="mt-4 text-base text-slate-600 md:text-lg">
            Follow one student story module-by-module. Use arrows to move through each thought and
            resolution.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="relative min-h-[360px] overflow-hidden p-1">
              <div className="p-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
                  {isFinal ? "Step Done" : `Current Module • ${current.step}`}
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  {isFinal ? "unicare always with you" : current.module}
                </h3>
              </div>

              <div className="relative mt-4 h-[126px] px-2">
                <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-slate-300" />
                <div className="relative z-10 flex h-full items-center">
                  <div
                    className="cursor-grab select-none touch-none transition-all duration-700 active:cursor-grabbing"
                    style={{ transform: `translateX(${avatarShift}px)`, opacity: entered ? 1 : 0 }}
                    onPointerDown={handleAvatarPointerDown}
                    onPointerMove={handleAvatarPointerMove}
                    onPointerUp={endAvatarDrag}
                    onPointerCancel={endAvatarDrag}
                  >
                    <div className="journey-runner">
                      <WalkingAvatar />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mt-2 text-sm leading-6 text-slate-700">{current.thought}</p>
              </div>
            </div>

            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous thought"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={next}
                aria-label="Next thought"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <article key={`${current.step}-${activeIndex}`} className="mx-10 space-y-4">
                {isFinal ? (
                  <div className="min-h-[300px] rounded-3xl border border-blue-300/40 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-8 text-white shadow-[0_20px_60px_-24px_rgba(29,78,216,0.6)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                      Step Done
                    </p>
                    <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                      <p className="text-lg font-medium lowercase tracking-[0.04em] text-white/95 md:text-xl">
                        unicare always with you
                      </p>
                      <p className="mt-3 text-sm text-blue-100/95">
                        From first worry to final outcome, every support module is now resolved.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`rounded-2xl border bg-gradient-to-r p-4 ${current.accent}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
                        Step {current.step}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold">{current.module}</h3>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Resolved by UniCare
                      </p>
                      <p className="mt-2 text-sm leading-6 text-emerald-900">{current.resolved}</p>
                    </div>
                  </>
                )}

                <div className="flex justify-center gap-2 pt-1">
                  {slides.map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Go to step ${index + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeIndex ? "w-8 bg-primary" : "w-2.5 bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

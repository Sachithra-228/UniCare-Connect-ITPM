"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const faqs: FaqItem[] = [
  {
    question: "Who can use UniCare Connect?",
    answer:
      "University students, mentors, and support staff can use UniCare to manage aid, career pathways, wellbeing, and mentoring in one platform."
  },
  {
    question: "How fast can a student request be reviewed?",
    answer:
      "Urgent cases are prioritized by the support queue, and teams can review and act on requests through the action planner dashboard."
  },
  {
    question: "Does UniCare support both public and private universities?",
    answer:
      "Yes. UniCare is designed for collaboration across Sri Lankan public and private institutions with configurable workflows."
  },
  {
    question: "Can students track outcomes after submitting requests?",
    answer:
      "Yes. Students can follow progress, view updates, and see final outcomes for financial, mentorship, career, and wellness requests."
  },
  {
    question: "Can I apply for financial aid directly from the platform?",
    answer:
      "Yes. Students can submit aid requests, upload required details, and track every status update in real time."
  },
  {
    question: "How does the mentorship matching process work?",
    answer:
      "UniCare maps student goals with available mentors and suggests the best-fit options based on profile and support needs."
  }
];

const clampIndex = (value: number) => Math.min(faqs.length - 1, Math.max(0, value));

export function FaqMiniAccordion() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cooldownRef = useRef(0);

  const [inView, setInView] = useState(false);
  const [desktopMode, setDesktopMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [motionKey, setMotionKey] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const navigateBy = useCallback((delta: 1 | -1) => {
    setActiveIndex((prev) => {
      const next = clampIndex(prev + delta);
      if (next !== prev) {
        setDirection(delta);
        setMotionKey((key) => key + 1);
      }
      return next;
    });
  }, []);

  const navigateTo = useCallback((index: number) => {
    setActiveIndex((prev) => {
      const next = clampIndex(index);
      if (next !== prev) {
        setDirection(next > prev ? 1 : -1);
        setMotionKey((key) => key + 1);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktopMode(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(desktopMode && entry.isIntersecting);
      },
      { threshold: desktopMode ? 0.7 : 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [desktopMode]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (!desktopMode || !inView) return;

      const delta = event.deltaY;
      if (Math.abs(delta) < 8) return;

      const movingDown = delta > 0;
      const atFirst = activeIndex === 0;
      const atLast = activeIndex === faqs.length - 1;
      const canMove = movingDown ? !atLast : !atFirst;
      if (!canMove) return;

      const now = Date.now();
      if (now - cooldownRef.current < 520) return;
      cooldownRef.current = now;

      navigateBy(movingDown ? 1 : -1);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!desktopMode || !inView) return;

      if (event.key === "ArrowDown" && activeIndex < faqs.length - 1) {
        event.preventDefault();
        navigateBy(1);
      } else if (event.key === "ArrowUp" && activeIndex > 0) {
        event.preventDefault();
        navigateBy(-1);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, desktopMode, inView, navigateBy]);

  const activeFaq = faqs[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] py-16"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:38px_38px] opacity-35" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <div className="hidden gap-8 md:grid md:grid-cols-[0.95fr_1.05fr]">
          <aside
            className="min-h-[320px] py-8"
          >
            <div key={`faq-left-${motionKey}`} className={direction === 1 ? "faq-left-up" : "faq-left-down"}>
              <h4 className="text-[2.3rem] font-semibold leading-tight text-white">{activeFaq.question}</h4>
            </div>
          </aside>

          <article
            className="min-h-[320px] py-8"
          >
            <div
              key={`faq-right-${motionKey}`}
              className={direction === 1 ? "faq-right-down" : "faq-right-up"}
              aria-live="polite"
            >
              <p className="text-xl leading-9 text-slate-100">{activeFaq.answer}</p>

              <div className="mt-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigateBy(-1)}
                  className="rounded-full border border-white/25 p-2 text-slate-100 transition-colors hover:bg-white/10"
                  aria-label="Previous question"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  {faqs.map((_, index) => (
                    <button
                      key={`faq-dot-${index}`}
                      type="button"
                      onClick={() => navigateTo(index)}
                      aria-label={`Go to question ${index + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        index === activeIndex ? "w-8 bg-blue-300" : "w-2.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigateBy(1)}
                  className="rounded-full border border-white/25 p-2 text-slate-100 transition-colors hover:bg-white/10"
                  aria-label="Next question"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </div>

        <div className="mx-auto mt-8 max-w-4xl md:hidden">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="border-b border-white/20">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-mobile-${index}`}
                  onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-lg font-medium text-white">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  id={`faq-panel-mobile-${index}`}
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pr-2 text-sm leading-7 text-slate-300">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

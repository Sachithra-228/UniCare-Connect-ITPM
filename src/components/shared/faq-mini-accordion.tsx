"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const faqs = [
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
  },
  {
    question: "Can parents or guardians view student progress?",
    answer:
      "Where enabled by the university, guardians can view key milestones and support updates through guided access."
  },
  {
    question: "Is wellness support confidential?",
    answer:
      "Yes. Wellness interactions follow privacy controls, and only authorized teams can access sensitive support records."
  },
  {
    question: "What devices are supported?",
    answer:
      "UniCare works on desktop, tablet, and mobile browsers so students and staff can access services anywhere."
  }
];

export function FaqMiniAccordion() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-6xl px-4 pb-16">
      <div
        className={`mx-auto max-w-4xl text-center transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <h3 className="text-4xl font-semibold tracking-tight md:text-5xl">Frequently asked questions</h3>
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={faq.question} className="border-b border-slate-200">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${index}`}
                onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-lg font-medium text-slate-900 md:text-2xl">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                id={`faq-panel-${index}`}
                className={`grid transition-[grid-template-rows] duration-300 ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 pr-10 text-sm leading-7 text-slate-600 md:text-base">{faq.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type StoryCard = {
  name: string;
  role: string;
  quote: string;
  tone: string;
  image: string;
};

const stories: StoryCard[] = [
  {
    name: "Ishara P.",
    role: "Engineering student",
    quote: "UniCare helped me secure a laptop within a week and connected me to a part-time lab role.",
    tone: "from-[#1d4ed8] to-[#1e40af] text-white",
    image: "/sachithra.jpeg"
  },
  {
    name: "Prof. D. Jayasekara",
    role: "Faculty mentor",
    quote: "The admin analytics dashboard gives our faculty instant visibility on student needs.",
    tone: "from-[#1e3a8a] to-[#0f172a] text-white",
    image: "/teacher.png"
  },
  {
    name: "Alumni Mentor",
    role: "Campus volunteer",
    quote: "Mentorship scheduling is seamless, and students arrive prepared every time.",
    tone: "from-[#2563eb] to-[#1d4ed8] text-white",
    image: "/kusum.jpeg"
  },
  {
    name: "Dinithi K.",
    role: "First-year student",
    quote: "Emergency bursary support arrived on time and helped me continue my semester.",
    tone: "from-[#0f3b74] to-[#1e3a8a] text-white",
    image: "/imasha.jpeg"
  },
  {
    name: "M. Fernando",
    role: "Career office",
    quote: "Internship routing is now clean and transparent for students and faculty.",
    tone: "from-[#0b2a4d] to-[#17457a] text-white",
    image: "/hero-student.png"
  },
  {
    name: "Kavindu S.",
    role: "IT student",
    quote: "I found mentorship, scholarship alerts, and deadlines in one dashboard.",
    tone: "from-[#1f4d9f] to-[#1e3a8a] text-white",
    image: "/top-hero.png"
  },
  {
    name: "Nethmi R.",
    role: "Medicine student",
    quote: "Wellness booking removed long waiting times and reduced stress before exams.",
    tone: "from-[#164a8a] to-[#1d4ed8] text-white",
    image: "/imasha.jpeg"
  },
  {
    name: "Campus Welfare Team",
    role: "University administration",
    quote: "With UniCare, we can identify urgent student risks and intervene much earlier.",
    tone: "from-[#12315c] to-[#1f4d9f] text-white",
    image: "/parent.png"
  },
  {
    name: "Parent Community",
    role: "Family network",
    quote: "We finally have clarity on student support progress and key outcomes.",
    tone: "from-[#1f3f7a] to-[#2563eb] text-white",
    image: "/kusum.jpeg"
  }
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function StoriesStack() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!sectionRef.current) return;

    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalScrollable = sectionRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const progress = clamp(-rect.top / totalScrollable, 0, 1);
      const nextIndex = Math.min(stories.length - 1, Math.floor(progress * stories.length));
      setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const stickyHeightVh = stories.length * 62;

  return (
    <section id="stories" ref={sectionRef} className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Real stories from Sri Lankan campuses
        </h2>
        <p className="mt-3 text-base text-slate-600 md:text-lg">
          Scroll to bring each story forward.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:hidden">
        {stories.map((story, index) => (
          <article
            key={`mobile-story-${story.name}`}
            className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-6 shadow-lg transition-all duration-700 ${
              story.tone
            } ${index === activeIndex ? "scale-[1.01]" : "opacity-90"}`}
            style={{ transitionDelay: `${index * 180}ms` }}
          >
            <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col justify-between">
                <p className="text-base italic leading-7">&ldquo;{story.quote}&rdquo;</p>
                <div className="pt-4">
                  <p
                    className="text-2xl leading-none text-white"
                    style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                  >
                    {story.name}
                  </p>
                  <p className="mt-1 text-xs text-white/85">{story.role}</p>
                </div>
              </div>
              <div>
                <div className="relative h-32 overflow-hidden rounded-2xl border border-white/35 bg-white/20">
                  <Image src={story.image} alt={story.name} fill className="object-cover" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="relative mt-10 hidden md:block" style={{ height: `${stickyHeightVh}vh` }}>
        <div className="sticky top-24 h-[450px] overflow-visible">
          <div className="relative h-full">
            {stories.map((story, index) => {
              const distance = index - activeIndex;
              const absDistance = Math.abs(distance);
              const clampedDistance = clamp(distance, -4, 4);
              const translateX = clampedDistance * 132;
              const scale =
                absDistance === 0 ? 1.07 : absDistance === 1 ? 0.9 : absDistance === 2 ? 0.8 : 0.72;
              const opacity = absDistance > 4 ? 0 : absDistance === 0 ? 1 : 0.22;
              const blur = absDistance === 0 ? 0 : Math.min(5.5, absDistance * 1.6);
              const rotate = clampedDistance * -2.5;
              const zIndex = 100 - absDistance;

              return (
                <article
                  key={`desktop-story-${story.name}`}
                  className={`absolute left-1/2 top-6 w-[560px] max-w-[78vw] rounded-[22px] border border-white/45 bg-gradient-to-br p-7 shadow-[0_34px_60px_-34px_rgba(15,23,42,0.55)] transition-all duration-500 ${story.tone}`}
                  style={{
                    transform: `translateX(calc(-50% + ${translateX}px)) scale(${scale}) rotate(${rotate}deg)`,
                    opacity,
                    zIndex,
                    filter: `blur(${blur}px)`
                  }}
                >
                  <div className="grid h-full min-h-[320px] grid-cols-[1.14fr_0.86fr] gap-6">
                    <div className="flex h-full flex-col justify-between">
                      <p className="text-[1.45rem] italic font-medium leading-[1.45]">&ldquo;{story.quote}&rdquo;</p>
                      <div className="pt-5">
                        <p
                          className="text-5xl leading-none text-white"
                          style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                        >
                          {story.name}
                        </p>
                        <p className="mt-2 text-sm text-white/90">{story.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-white/35 bg-white/20">
                        <Image src={story.image} alt={story.name} fill className="object-cover" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/85 px-4 py-2 shadow-sm">
            {stories.map((_, index) => (
              <span
                key={`story-dot-${index}`}
                className={`block h-2.5 rounded-full transition-all ${
                  index === activeIndex ? "w-7 bg-primary" : "w-2.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

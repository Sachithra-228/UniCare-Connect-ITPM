import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/shared/section-heading";
import { ImpactStats } from "@/components/shared/impact-stats";
import { TestimonialsCarousel } from "@/components/shared/testimonials-carousel";
import { EcosystemShowcase } from "@/components/shared/ecosystem-showcase";
import { ScrollSwap } from "@/components/shared/scroll-swap";

const partnerUniversities = [
  { name: "University of Colombo", logo: "/colombo.jpg" },
  { name: "University of Peradeniya", logo: "/peradeniya.jpg" },
  { name: "University of Moratuwa", logo: "/moratuwa.jpg" },
  { name: "University of Sri Jayewardenepura", logo: "/jayawardenapura.jpg" },
  { name: "University of Kelaniya", logo: "/kelaniya.jpg" },
  { name: "University of Ruhuna", logo: "/ruhuna.jpg" },
  { name: "University of Jaffna", logo: "/jaffna.jpg" },
  { name: "Eastern University", logo: "/eastern.jpg" },
  { name: "Sabaragamuwa University", logo: "/sabaragamuwa.jpg" },
  { name: "Wayamba University", logo: "/wayamba.jpg" },
  { name: "Rajarata University", logo: "/rajarata.jpg" },
  { name: "Open University of Sri Lanka", logo: "/open.jpg" },
  { name: "University of the Visual & Performing Arts", logo: "/visual.jpg" },
  { name: "South Eastern University", logo: "/southeastern.jpg" },
  { name: "Uva Wellassa University", logo: "/uvawellassa.jpg" },
  { name: "University of Vavuniya", logo: "/vavuniya.jpg" },
  { name: "Gampaha Wickramarachchi University", logo: "/gampaha.jpg" }
];

export default function OverviewPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-4 py-14">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-white p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 md:p-12">
        <div className="absolute inset-x-0 bottom-0 h-32">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M0 40c120 40 240 40 360 0s240-40 360 0 240 40 360 0 240-40 360 0v80H0z"
              fill="#2563EB"
              opacity="0.08"
            />
            <path
              d="M0 60c120 30 240 30 360 0s240-30 360 0 240 30 360 0 240-30 360 0v60H0z"
              fill="#2563EB"
              opacity="0.12"
            />
          </svg>
        </div>
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            <span className="block whitespace-nowrap">Your Complete University</span>
            <span className="block">Support Ecosystem</span>
          </h1>
          <p className="text-base italic text-slate-600 dark:text-slate-300">
            Financial aid, career guidance, mental wellness, and campus life all in one platform
            built for Sri Lankan students.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Image
            src="/top-hero.png"
            alt="Student with laptop and bag"
            width={420}
            height={520}
            className="h-auto w-full max-w-sm"
            priority
          />
        </div>
        </div>
      </section>

      <ScrollSwap
        className="mt-6"
        first={
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">For parents</p>
              <h2 className="text-2xl font-semibold">Stay informed and support with confidence</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Parents can track student progress, see support milestones, and receive updates on
                financial aid, wellness, and career guidance in one place.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Image
                src="/parent.png"
                alt="Parent supporting a student"
                width={420}
                height={520}
                className="h-auto w-full max-w-sm"
              />
            </div>
          </div>
        }
        second={
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <Image
                src="/teacher.png"
                alt="Teacher guiding students"
                width={420}
                height={520}
                className="h-auto w-full max-w-sm"
              />
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">For staff</p>
              <h2 className="text-2xl font-semibold">Empower advisors with real-time visibility</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Staff and mentors get a unified dashboard to triage requests, monitor wellbeing, and
                connect students with the right resources quickly.
              </p>
            </div>
          </div>
        }
      />

      <section>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-8 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Measurable outcomes for every campus</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Real impact across financial aid, careers, and wellbeing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Financial Aid", "Careers", "Wellbeing"].map((item, index) => (
                <button
                  key={item}
                  className={`rounded-full border px-4 py-1 text-xs font-semibold transition-colors ${
                    index === 0
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <ImpactStats
              startOnView
              stats={[
                {
                  label: "Students Supported",
                  value: 10000,
                  suffix: "+",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <path
                        d="M4 18v-2a4 4 0 014-4h8a4 4 0 014 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )
                },
                {
                  label: "in Scholarships Matched",
                  value: 50,
                  prefix: "₹",
                  suffix: "M+",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <path
                        d="M6 7h9a3 3 0 110 6H6V7z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6 13h10a3 3 0 110 6H6v-6z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )
                },
                {
                  label: "Jobs & Internships",
                  value: 2500,
                  suffix: "+",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <path
                        d="M4 7h16v11H4z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9 7V5h6v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )
                },
                {
                  label: "Mental Health Support",
                  value: 24,
                  suffix: "/7",
                  icon: (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <path
                        d="M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )
                }
              ]}
            />
          </div>
        </div>
      </section>

      <EcosystemShowcase />

      <section>
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            title="Core modules around one student experience"
            subtitle="Explore the four key features from the accordion on the right."
          />
        </div>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 md:p-8">
          <div className="relative">
            <div className="absolute left-7 right-7 top-7 hidden h-0.5 bg-slate-200 dark:bg-slate-700 md:block" />
            <div className="absolute left-7 right-7 top-7 hidden h-0.5 bg-gradient-to-r from-primary/80 via-primary/50 to-primary/20 md:block" />

            <div className="grid gap-7 md:grid-cols-3 md:gap-6">
              {[
                {
                  step: "01",
                  title: "Sign Up & Profile",
                  description: "Create your account, set goals, and personalize your support journey."
                },
                {
                  step: "02",
                  title: "Personalized Dashboard",
                  description:
                    "Get curated aid options, career paths, and wellness resources in one view."
                },
                {
                  step: "03",
                  title: "Apply & Track",
                  description:
                    "Submit requests, monitor status updates, and follow every outcome in real time."
                }
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div
                    className={`relative z-10 mb-4 flex items-center gap-3 md:mb-5 md:flex-col ${
                      index === 0 ? "md:items-start" : index === 1 ? "md:items-center" : "md:items-end"
                    }`}
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-primary/30 bg-white text-sm font-bold text-primary shadow-sm dark:bg-slate-950">
                      {item.step}
                    </div>
                    {index < 2 ? (
                      <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 md:hidden" />
                    ) : null}
                  </div>

                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="demo">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Testimonials
          </p>
          <h2 className="text-3xl font-semibold">Stories from our student community</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Real voices from students, advisors, and parents using UniCare across Sri Lankan
            campuses.
          </p>
        </div>
        <TestimonialsCarousel
          testimonials={[
            {
              name: "Sachithra Wijesinghe",
              title: "Final-year Engineering Student, University of Colombo",
              quote:
                "UniCare helped me secure an emergency grant and a campus job in the same month.",
              avatar: "/sachithra.jpeg",
              image: "/sachithra.jpeg"
            },
            {
              name: "Imasha Ransinghe",
              title: "Career Advisor, University of Moratuwa",
              quote:
                "The platform gives students clear internship pathways and helps advisors intervene early.",
              avatar: "/imasha.jpeg",
              image: "/imasha.jpeg"
            },
            {
              name: "Kusum Karunarathna",
              title: "Parent Community Mentor, University of Peradeniya",
              quote:
                "Counseling support and regular mentor check-ins helped my son stay focused and confident.",
              avatar: "/kusum.jpeg",
              image: "/kusum.jpeg"
            }
          ]}
        />
      </section>

      <section>
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            title="Trusted by 25+ universities nationwide"
            subtitle="Collaboration across Sri Lanka with public and private institutions."
          />
        </div>
        <div className="marquee-wrap mt-6 overflow-hidden py-5">
          <div className="marquee-track">
            {[...partnerUniversities, ...partnerUniversities].map((university, index) => (
              <div
                key={`${university.name}-${index}`}
                className="marquee-item rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="marquee-item-inner">
                  <div className="marquee-logo relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={university.logo}
                      alt={`${university.name} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="marquee-name text-sm font-semibold leading-5 text-slate-700 dark:text-slate-200">
                    {university.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-900 to-[#102041] p-8 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.9)] md:p-10">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />

        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">
              Start your journey
            </p>
            <h2 className="text-2xl font-semibold leading-tight md:text-3xl">
              Ready to Transform Your University Experience?
            </h2>
            <p className="max-w-2xl text-sm text-slate-300 md:text-base">
              Join 10,000+ students already using UniCare to access funding, career growth, and
              wellbeing support from one trusted platform.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-300">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">One account</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Real-time tracking</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">University verified</span>
            </div>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Get Started Free
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

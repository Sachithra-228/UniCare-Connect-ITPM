import Link from "next/link";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatCard } from "@/components/shared/StatCard";
import { Card } from "@/components/shared/Card";

export default function HomePage() {
  return (
    <div>
      <section
        id="overview"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16"
      >
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Holistic student support platform
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              UniCare Connect helps Sri Lankan students thrive academically, financially, and
              emotionally.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Bring financial aid, career growth, wellness services, and mentorship together in one
              secure platform aligned with university needs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white"
              >
                Go to dashboard
              </Link>
              <Link
                href="/financial-aid"
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium dark:border-slate-700"
              >
                Apply for aid
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span>For students</span>
              <span>For parents</span>
              <span>For staff</span>
              <span>For alumni</span>
            </div>
          </div>
          <Card id="impact" className="space-y-4">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Live platform snapshot
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Aid Distributed" value="LKR 12.4M" description="2025/2026 cycle" />
              <StatCard label="Active Mentors" value="320" description="Industry + alumni" />
              <StatCard label="Job Listings" value="185" description="On campus + remote" />
              <StatCard label="Wellness Check-ins" value="1,240" description="Last 30 days" />
            </div>
          </Card>
        </div>
      </section>

      <section id="modules" className="bg-slate-50 py-14 dark:bg-slate-900/50">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4">
          <SectionHeading
            eyebrow="Core modules"
            title="Everything students need in one place"
            subtitle="Designed for students, parents, staff, alumni, and partner organizations."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Financial Support",
                description: "Emergency aid, equipment support, and fee assistance."
              },
              {
                title: "Career & Scholarships",
                description: "AI matching, internships, and skill development."
              },
              {
                title: "Mentorship & Campus",
                description: "Alumni mentoring, events, and community outreach."
              },
              {
                title: "Health & Wellness",
                description: "Mood tracking, counseling, and peer support."
              }
            ].map((item) => (
              <Card key={item.title} className="space-y-3">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="mx-auto w-full max-w-6xl space-y-8 px-4 py-14">
        <SectionHeading
          title="Real stories from Sri Lankan campuses"
          subtitle="Impact-focused outcomes for students and universities."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Ishara P.",
              quote:
                "UniCare helped me secure a laptop within a week and connected me to a part-time lab role."
            },
            {
              name: "Prof. D. Jayasekara",
              quote:
                "The admin analytics dashboard gives our faculty instant visibility on student needs."
            },
            {
              name: "Alumni Mentor",
              quote: "Mentorship scheduling is seamless, and students arrive prepared every time."
            }
          ].map((testimonial) => (
            <Card key={testimonial.name} className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                “{testimonial.quote}”
              </p>
              <p className="text-sm font-semibold">{testimonial.name}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

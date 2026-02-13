import Link from "next/link";
import { CoreModulesJourney } from "@/components/shared/core-modules-journey";
import { FaqMiniAccordion } from "@/components/shared/faq-mini-accordion";
import { StoriesStack } from "@/components/shared/stories-stack";
import { SupportWorkspacePanels } from "@/components/shared/support-workspace-panels";
import { WireframeGlobe } from "@/components/shared/wireframe-globe";

export default function HomePage() {
  return (
    <div>
      <section id="overview" className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] px-6 py-10 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.9)] md:px-10 md:py-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:38px_38px] opacity-35" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                UniCare Connect powers student success in Sri Lanka.
              </h1>
              <p className="max-w-2xl text-base text-slate-300">
                Bring financial aid, career growth, wellness services, and mentorship together in
                one secure platform aligned with university needs.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Go to dashboard
                </Link>
                <Link
                  href="/financial-aid"
                  className="rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
                >
                  Apply for aid
                </Link>
              </div>
            </div>

            <WireframeGlobe />
          </div>
        </div>
      </section>

      <CoreModulesJourney />

      <StoriesStack />
      <SupportWorkspacePanels />
      <FaqMiniAccordion />
    </div>
  );
}

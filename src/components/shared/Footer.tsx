import Link from "next/link";
import { Github, Linkedin, Music2, Youtube } from "lucide-react";

const primaryNav = [
  { label: "Overview", href: "/overview" },
  { label: "Universities", href: "/university-connect" },
  { label: "Stories", href: "/stories" }
];

const supportNav = [
  { label: "Financial Aid", href: "/financial-aid" },
  { label: "Career", href: "/career" },
  { label: "Mentorship", href: "/mentorship" },
  { label: "Wellness", href: "/wellness" }
];

const socialLinks = [
  { label: "TikTok", href: "https://www.tiktok.com/", icon: Music2 },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: Linkedin },
  { label: "YouTube", href: "https://www.youtube.com/", icon: Youtube },
  { label: "GitHub", href: "https://github.com/", icon: Github }
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:border-slate-800 dark:from-slate-950 dark:to-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-8">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  UC
                </span>
                <div>
                  <p className="text-base font-semibold">UniCare Connect</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    One platform for student success.
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                A connected ecosystem for financial aid, career pathways, mentorship, and wellness
                support across Sri Lankan universities.
              </p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Contact: support@unicare.lk
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Navigation
              </p>
              <div className="grid gap-2">
                {primaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="w-fit rounded-full px-3 py-1 text-sm text-slate-600 transition-colors hover:bg-primary/10 hover:text-primary dark:text-slate-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <p className="pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                Student support
              </p>
              <div className="grid gap-2">
                {supportNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="w-fit rounded-full px-3 py-1 text-sm text-slate-600 transition-colors hover:bg-primary/10 hover:text-primary dark:text-slate-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Socials</p>
              <div className="flex items-center gap-3">
                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-slate-50 text-primary transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-900"
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <p>� 2026 UniCare Connect. Built for IT3040 IT Project Management.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

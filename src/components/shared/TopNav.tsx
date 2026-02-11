"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function TopNav() {
  const { user, signOutUser } = useAuth();
  const pathname = usePathname();

  const isRouteActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isSupportActive = ["/financial-aid", "/career", "/mentorship", "/wellness"].some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  const navLinkClass = (href: string) =>
    clsx(
      "rounded-full px-3 py-1.5 transition-colors",
      isRouteActive(href)
        ? "bg-primary/12 text-primary"
        : "hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-900"
    );

  return (
    <header className="sticky top-0 z-40 bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white/90 px-5 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              UC
            </span>
            <span className="hidden sm:inline">UniCare Connect</span>
          </Link>

          <nav
            className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-200 lg:flex"
            aria-label="Main"
          >
            <Link href="/overview" className={navLinkClass("/overview")}>
              Overview
            </Link>
            <Link href="/university-connect" className={navLinkClass("/university-connect")}>
              Universities
            </Link>

            <div className="group relative">
              <button
                className={clsx(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
                  isSupportActive
                    ? "bg-primary/12 text-primary"
                    : "hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-900"
                )}
              >
                Student Support
                <span className="text-xs">▾</span>
              </button>
              <div className="invisible absolute left-0 top-full z-10 mt-3 w-52 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-950">
                <Link
                  href="/financial-aid"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/financial-aid") && "bg-primary/10 text-primary"
                  )}
                >
                  Financial Aid
                </Link>
                <Link
                  href="/career"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/career") && "bg-primary/10 text-primary"
                  )}
                >
                  Career
                </Link>
                <Link
                  href="/mentorship"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/mentorship") && "bg-primary/10 text-primary"
                  )}
                >
                  Mentorship
                </Link>
                <Link
                  href="/wellness"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/wellness") && "bg-primary/10 text-primary"
                  )}
                >
                  Wellness
                </Link>
              </div>
            </div>

            <Link href="/stories" className={navLinkClass("/stories")}>
              Stories
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-700 md:inline-flex"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOutUser()}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

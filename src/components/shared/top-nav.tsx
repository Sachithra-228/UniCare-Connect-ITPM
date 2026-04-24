"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { getUiTranslations } from "@/lib/ui-translations";

export function TopNav() {
  const { user, signOutUser, loading } = useAuth();
  const { language } = useLanguage();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSupportOpen, setIsMobileSupportOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const text = getUiTranslations(language).topNav;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      setIsScrolled(currentScrollY > 8);

      if (currentScrollY <= 8) {
        setIsVisible(true);
      } else if (scrollDelta > 6) {
        setIsVisible(false);
      } else if (scrollDelta < -6) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isRouteActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isSupportActive = ["/financial-aid", "/career", "/mentorship", "/wellness"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSupportOpen(isSupportActive);
  }, [pathname, isSupportActive]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navLinkClass = (href: string) =>
    clsx(
      "rounded-full px-3 py-1.5 transition-colors",
      isRouteActive(href)
        ? "bg-primary/12 text-primary"
        : "hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-900"
    );

  const mobileNavLinkClass = (href: string) =>
    clsx(
      "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
      isRouteActive(href)
        ? "bg-primary/12 text-primary dark:bg-blue-400/20 dark:text-blue-200"
        : "text-slate-800 hover:bg-slate-100 hover:text-primary dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-blue-200"
    );

  const isAuthenticated = !loading && Boolean(user);
  const mobileItemDelay = (index: number) => ({ animationDelay: `${index * 70}ms` });

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 bg-gradient-to-br from-[#0b1f45] via-[#102a59] to-[#0c1d3d]"
      )}
    >
      <div
        className={clsx(
          "mx-auto w-full max-w-6xl px-4 py-4 transition-transform duration-300",
          isVisible || isMobileMenuOpen ? "translate-y-0" : "-translate-y-[120%]"
        )}
      >
        <div
          className={clsx(
            "flex items-center justify-between rounded-full px-3 py-2.5 transition-all duration-300 sm:px-5 sm:py-3",
            isScrolled
              ? "translate-y-2 border border-white/15 bg-white/65 shadow-lg backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/65"
              : "translate-y-0 border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80"
          )}
        >
          <Link href="/" className="flex items-center" aria-label="UniCare Connect">
            <Image
              src="/logo.png"
              alt="UniCare Connect"
              width={500}
              height={500}
              className="h-8 w-16 object-contain object-center sm:w-20"
              priority
            />
          </Link>

          <nav
            className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-200 lg:flex"
            aria-label="Main"
          >
            <Link href="/overview" className={navLinkClass("/overview")}>
              {text.overview}
            </Link>
            <Link href="/university-connect" className={navLinkClass("/university-connect")}>
              {text.universities}
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
                {text.studentSupport}
                <span className="text-xs">v</span>
              </button>
              <div className="invisible absolute left-0 top-full z-10 mt-3 w-52 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-950">
                <Link
                  href="/financial-aid"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/financial-aid") && "bg-primary/10 text-primary"
                  )}
                >
                  {text.financialAid}
                </Link>
                <Link
                  href="/career"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/career") && "bg-primary/10 text-primary"
                  )}
                >
                  {text.career}
                </Link>
                <Link
                  href="/mentorship"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/mentorship") && "bg-primary/10 text-primary"
                  )}
                >
                  {text.mentorship}
                </Link>
                <Link
                  href="/wellness"
                  className={clsx(
                    "block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900",
                    isRouteActive("/wellness") && "bg-primary/10 text-primary"
                  )}
                >
                  {text.wellness}
                </Link>
              </div>
            </div>

            <Link href="/stories" className={navLinkClass("/stories")}>
              {text.stories}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher compactOnMobile />
            <ThemeToggle className="p-1.5 sm:p-2" />
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-700 md:inline-flex"
                >
                  {text.dashboard}
                </Link>
                <button
                  onClick={() => signOutUser()}
                  className="hidden rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-700 md:inline-flex"
                >
                  {text.signOut}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden whitespace-nowrap rounded-full bg-primary px-3 py-2 text-sm font-medium text-white sm:px-4 sm:py-1.5 md:inline-flex"
              >
                {text.signIn}
              </Link>
            )}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 lg:hidden"
            >
              {isMobileMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-[#eef5ff] to-white dark:from-[#081a3a] dark:via-[#0d2754] dark:to-[#091933]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.07)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45 dark:opacity-35" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-300/30 blur-3xl dark:bg-cyan-300/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl dark:bg-blue-500/12" />

          <aside className="relative flex h-full flex-col overflow-y-auto p-4 text-slate-900 dark:text-slate-100">
            <div className="mb-3 flex items-center justify-between border-b border-slate-300/70 pb-3 dark:border-slate-700/70">
              <Link href="/" className="flex items-center" aria-label="UniCare Connect">
                <Image
                  src="/logo.png"
                  alt="UniCare Connect"
                  width={500}
                  height={500}
                  className="h-8 w-16 object-contain object-center sm:w-20"
                  priority
                />
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/80 bg-white/70 text-slate-600 dark:border-slate-600/80 dark:bg-slate-900/60 dark:text-slate-300"
                aria-label="Close menu"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="space-y-2 pt-2" aria-label="Mobile">
              <Link href="/overview" className={`${mobileNavLinkClass("/overview")} mobile-menu-float-in`} style={mobileItemDelay(0)}>
                {text.overview}
              </Link>
              <Link href="/university-connect" className={`${mobileNavLinkClass("/university-connect")} mobile-menu-float-in`} style={mobileItemDelay(1)}>
                {text.universities}
              </Link>

              <div
                className="mobile-menu-float-in rounded-xl border border-slate-300/70 bg-white/50 dark:border-slate-700/70 dark:bg-slate-900/35"
                style={mobileItemDelay(2)}
              >
                <button
                  type="button"
                  onClick={() => setIsMobileSupportOpen((open) => !open)}
                  className={clsx(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isSupportActive
                      ? "bg-primary/12 text-primary dark:bg-blue-400/20 dark:text-blue-200"
                      : "text-slate-800 hover:bg-slate-100 hover:text-primary dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-blue-200"
                  )}
                >
                  <span>{text.studentSupport}</span>
                  <span className={clsx("text-xs transition-transform", isMobileSupportOpen ? "rotate-180" : "")}>
                    v
                  </span>
                </button>
                <div
                  className={clsx(
                    "grid transition-[grid-template-rows] duration-300",
                    isMobileSupportOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-1 p-2 pt-0">
                      <Link href="/financial-aid" className={mobileNavLinkClass("/financial-aid")}>
                        {text.financialAid}
                      </Link>
                      <Link href="/career" className={mobileNavLinkClass("/career")}>
                        {text.career}
                      </Link>
                      <Link href="/mentorship" className={mobileNavLinkClass("/mentorship")}>
                        {text.mentorship}
                      </Link>
                      <Link href="/wellness" className={mobileNavLinkClass("/wellness")}>
                        {text.wellness}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/stories" className={`${mobileNavLinkClass("/stories")} mobile-menu-float-in`} style={mobileItemDelay(3)}>
                {text.stories}
              </Link>
            </nav>

            <div className="mobile-menu-float-in mt-auto border-t border-slate-300/70 pt-4 dark:border-slate-700/70" style={mobileItemDelay(4)}>
              {isAuthenticated ? (
                <div className="grid gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/60 px-4 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-900/55 dark:text-slate-100"
                  >
                    {text.dashboard}
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOutUser()}
                    className="inline-flex items-center justify-center rounded-full bg-[#0b1f45] px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                  >
                    {text.signOut}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
                >
                  {text.signIn}
                </Link>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function TopNav() {
  const { user, signOutUser } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          UniCare Connect
        </Link>
        <nav className="hidden gap-6 text-sm font-medium md:flex" aria-label="Main">
          <Link href="/financial-aid">Financial Aid</Link>
          <Link href="/career">Career</Link>
          <Link href="/mentorship">Mentorship</Link>
          <Link href="/wellness">Wellness</Link>
          <Link href="/university-connect">University Connect</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <button
              onClick={() => signOutUser()}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-700"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-primary px-3 py-1 text-sm text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

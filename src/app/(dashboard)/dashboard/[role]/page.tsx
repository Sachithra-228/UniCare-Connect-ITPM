"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/shared/card";
import {
  DASHBOARD_ROLE_CONFIG,
  DASHBOARD_ROLE_ORDER,
  DashboardRole,
  resolveDashboardRole
} from "@/lib/role-dashboard-config";
import { getSectionIcon } from "@/lib/dashboard-icons";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StudentSectionContent } from "@/components/dashboard/student/student-section-content";

type RoleDashboardPageProps = {
  params: { role: string };
};

function resolveRouteRole(value: string): DashboardRole | null {
  const normalized = value.toLowerCase();
  return DASHBOARD_ROLE_ORDER.find((r) => r === normalized) ?? null;
}

type QuickStats = {
  pendingApplications: number;
  upcomingDeadlines: number;
  unreadNotifications: number;
};

export default function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const routeRole = resolveRouteRole(params.role);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeSectionId, setActiveSectionId] = useState("");
  const [quickStats, setQuickStats] = useState<QuickStats>({
    pendingApplications: 0,
    upcomingDeadlines: 0,
    unreadNotifications: 0
  });

  const roleConfig = useMemo(
    () => (routeRole ? DASHBOARD_ROLE_CONFIG[routeRole] : null),
    [routeRole]
  );

  useEffect(() => {
    if (!roleConfig) {
      router.replace("/dashboard");
      return;
    }
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    const validFromHash = hash && roleConfig.sections.some((s) => s.id === hash);
    const sectionId = validFromHash ? hash : roleConfig.sections[0]?.id ?? "";
    setActiveSectionId(sectionId);
    if (!validFromHash && sectionId) {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  }, [roleConfig, router]);

  useEffect(() => {
    if (!roleConfig) return;
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash && roleConfig.sections.some((s) => s.id === hash)) setActiveSectionId(hash);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [roleConfig]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?mode=signin");
      return;
    }
    const expectedRole = resolveDashboardRole(user.role);
    if (!routeRole || routeRole !== expectedRole) {
      router.replace(`/dashboard/${expectedRole}`);
    }
  }, [loading, routeRole, router, user]);

  useEffect(() => {
    if (routeRole !== "student") return;
    Promise.all([
      fetch("/api/aid-requests").then((r) => r.json()).catch(() => []),
      fetch("/api/scholarships").then((r) => r.json()).catch(() => []),
      fetch("/api/jobs").then((r) => r.json()).catch(() => []),
      fetch("/api/notifications").then((r) => r.json()).catch(() => ({}))
    ]).then(([aid, scholarships, jobs, notifData]) => {
      const aidList = Array.isArray(aid) ? aid : [];
      const pendingApps = aidList.filter(
        (a: { status?: string }) =>
          a.status && !["Approved", "Rejected", "approved", "rejected"].includes(a.status)
      ).length;
      const schList = Array.isArray(scholarships) ? scholarships : [];
      const jobList = Array.isArray(jobs) ? jobs : [];
      const today = new Date().toISOString().split("T")[0];
      const deadlines = [
        ...schList.map((s: { deadline?: string }) => s.deadline).filter(Boolean),
        ...jobList.map((j: { applicationDeadline?: string }) => j.applicationDeadline).filter(Boolean)
      ].filter((d: string) => d >= today).length;
      const notifications = Array.isArray((notifData as { notifications?: unknown[] }).notifications)
        ? (notifData as { notifications: { read?: boolean }[] }).notifications
        : [];
      const unread = notifications.filter((n: { read?: boolean }) => !n.read).length;
      setQuickStats({
        pendingApplications: pendingApps,
        upcomingDeadlines: deadlines,
        unreadNotifications: unread
      });
    });
  }, [routeRole]);

  if (loading || !roleConfig || !routeRole) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading your dashboard...
      </div>
    );
  }

  if (!user) return null;

  const activeSection =
    roleConfig.sections.find((s) => s.id === activeSectionId) ?? roleConfig.sections[0];
  const ActiveSectionIcon = getSectionIcon(activeSection.id);

  const isHomeSection = activeSectionId === "home";

  return (
    <div className="space-y-8">
      {isHomeSection && (
        <>
          <DashboardHeader />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a
              href={`/dashboard/${routeRole}#my-applications`}
              className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/10 py-5 px-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:from-primary/15 hover:to-primary/20 hover:shadow-md hover:shadow-primary/10 dark:from-primary/10 dark:via-slate-900/80 dark:to-primary/15 dark:hover:from-primary/20 dark:hover:to-primary/25"
            >
              <span className="absolute right-0 top-0 h-16 w-20 rounded-bl-full bg-primary/5 transition-colors group-hover:bg-primary/10 dark:bg-primary/10 dark:group-hover:bg-primary/15" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pending applications</p>
              <p className="mt-1 text-2xl font-semibold text-primary transition-colors group-hover:text-primary dark:text-primary">{quickStats.pendingApplications}</p>
            </a>
            <a
              href={`/dashboard/${routeRole}#home`}
              className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/10 py-5 px-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:from-primary/15 hover:to-primary/20 hover:shadow-md hover:shadow-primary/10 dark:from-primary/10 dark:via-slate-900/80 dark:to-primary/15 dark:hover:from-primary/20 dark:hover:to-primary/25"
            >
              <span className="absolute right-0 top-0 h-16 w-20 rounded-bl-full bg-primary/5 transition-colors group-hover:bg-primary/10 dark:bg-primary/10 dark:group-hover:bg-primary/15" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Upcoming deadlines</p>
              <p className="mt-1 text-2xl font-semibold text-primary transition-colors group-hover:text-primary dark:text-primary">{quickStats.upcomingDeadlines}</p>
            </a>
            <a
              href={`/dashboard/${routeRole}#profile`}
              className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/10 py-5 px-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:from-primary/15 hover:to-primary/20 hover:shadow-md hover:shadow-primary/10 dark:from-primary/10 dark:via-slate-900/80 dark:to-primary/15 dark:hover:from-primary/20 dark:hover:to-primary/25"
            >
              <span className="absolute right-0 top-0 h-16 w-20 rounded-bl-full bg-primary/5 transition-colors group-hover:bg-primary/10 dark:bg-primary/10 dark:group-hover:bg-primary/15" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Unread notifications</p>
              <p className="mt-1 text-2xl font-semibold text-primary transition-colors group-hover:text-primary dark:text-primary">{quickStats.unreadNotifications}</p>
            </a>
          </div>
        </>
      )}

      <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-700/50">
        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ActiveSectionIcon className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {activeSection.menuLabel}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{activeSection.title}</h2>
          </div>
        </div>
        <div className="p-6">
        {routeRole === "student" ? (
          <StudentSectionContent sectionId={activeSection.id} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {activeSection.items.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
        </div>
      </Card>

    </div>
  );
}

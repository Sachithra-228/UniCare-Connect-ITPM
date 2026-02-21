"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/shared/badge";
import { Card } from "@/components/shared/card";
import {
  DASHBOARD_ROLE_CONFIG,
  DASHBOARD_ROLE_ORDER,
  DashboardRole,
  resolveDashboardRole
} from "@/lib/role-dashboard-config";
import { getSectionIcon } from "@/lib/dashboard-icons";

type RoleDashboardPageProps = {
  params: { role: string };
};

function resolveRouteRole(value: string): DashboardRole | null {
  const normalized = value.toLowerCase();
  return DASHBOARD_ROLE_ORDER.find((r) => r === normalized) ?? null;
}

export default function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const routeRole = resolveRouteRole(params.role);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeSectionId, setActiveSectionId] = useState("");

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

  const setSectionAndHash = (id: string) => {
    setActiveSectionId(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

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
  const totalItems = roleConfig.sections.reduce((c, s) => c + s.items.length, 0);
  const ActiveSectionIcon = getSectionIcon(activeSection.id);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Role Dashboard
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {roleConfig.workspaceLabel}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{roleConfig.description}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Your assigned role</p>
            <p className="text-sm font-semibold text-primary">{roleConfig.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">This dashboard is based on your account role.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Role</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{roleConfig.label}</p>
          <Badge variant="info">Active workspace</Badge>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modules</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{roleConfig.sections.length}</p>
          <p className="text-xs text-slate-500">Sidebar sections</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content Blocks</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{totalItems}</p>
          <p className="text-xs text-slate-500">Planned items</p>
        </Card>
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ActiveSectionIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {activeSection.menuLabel}
            </p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{activeSection.title}</h2>
          </div>
        </div>
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
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All modules</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {roleConfig.sections.map((section) => {
            const Icon = getSectionIcon(section.id);
            const isActive = section.id === activeSection.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setSectionAndHash(section.id)}
                className={clsx(
                  "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-700 hover:border-primary/30 hover:text-primary dark:border-slate-800 dark:text-slate-300"
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0" />
                  <span>{section.menuLabel}</span>
                </span>
                <span className="text-xs text-slate-400">{section.items.length}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

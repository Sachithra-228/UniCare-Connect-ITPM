"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, PanelLeftClose, ChevronDown, UserCircle, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { getSectionIcon } from "@/lib/dashboard-icons";
import {
  DASHBOARD_ROLE_CONFIG,
  type DashboardRole,
  type DashboardSection
} from "@/lib/role-dashboard-config";
import {
  getNotificationSectionId,
  type DashboardNotification
} from "@/lib/dashboard-notification-routing";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import type { UserProfile } from "@/types";

type AppSidebarProps = {
  role: DashboardRole;
  user: UserProfile | null;
};

export function AppSidebar({ role, user }: AppSidebarProps) {
  const pathname = usePathname();
  const { collapsed, isMobile, setMobileOpen } = useSidebar();
  const isCompact = !isMobile && collapsed;
  const { signOutUser } = useAuth();
  const { language } = useLanguage();
  const [hash, setHash] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const markingIdsRef = useRef<Set<string>>(new Set());
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    if (accountOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [accountOpen]);

  useEffect(() => {
    setHash(typeof window !== "undefined" ? window.location.hash.slice(1) : "");
    const onHash = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [role]);

  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile, pathname, setMobileOpen]);

  const config = DASHBOARD_ROLE_CONFIG[role];
  const text =
    language === "si"
      ? { menu: "මෙනුව", account: "ගිණුම", signOut: "ඉවත් වන්න" }
      : language === "ta"
        ? { menu: "மெனு", account: "கணக்கு", signOut: "வெளியேறு" }
        : { menu: "Menu", account: "Account", signOut: "Sign out" };
  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = () => {
      fetch("/api/notifications")
        .then((response) => (response.ok ? response.json() : {}))
        .then((data) => {
          if (cancelled) return;
          const list = Array.isArray((data as { notifications?: unknown[] }).notifications)
            ? ((data as { notifications: DashboardNotification[] }).notifications ?? []).map((item) => ({
                ...item,
                id: item.id ?? item._id
              }))
            : [];
          setNotifications(list);
        })
        .catch(() => {
          if (!cancelled) setNotifications([]);
        });
    };

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const sectionIds = useMemo(() => new Set(config.sections.map((section) => section.id)), [config.sections]);
  const sectionNotificationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    config.sections.forEach((section) => {
      counts[section.id] = 0;
    });

    notifications
      .filter((item) => !item.read)
      .forEach((item) => {
        const sectionId = getNotificationSectionId(role, item, sectionIds);
        if (sectionId && sectionId in counts) {
          counts[sectionId] += 1;
        }
      });

    return counts;
  }, [config.sections, notifications, role, sectionIds]);

  const activeSectionId = hash || config.sections[0]?.id || "";

  useEffect(() => {
    if (!activeSectionId) return;

    const unreadIdsForActiveSection = notifications
      .filter((item) => !item.read)
      .filter((item) => getNotificationSectionId(role, item, sectionIds) === activeSectionId)
      .map((item) => String(item.id ?? item._id ?? "").trim())
      .filter(Boolean)
      .filter((id) => !markingIdsRef.current.has(id));

    if (!unreadIdsForActiveSection.length) return;

    unreadIdsForActiveSection.forEach((id) => markingIdsRef.current.add(id));

    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIdsForActiveSection })
    })
      .then((response) => {
        if (!response.ok) return;
        setNotifications((current) =>
          current.map((item) =>
            unreadIdsForActiveSection.includes(String(item.id ?? item._id ?? "").trim())
              ? { ...item, read: true }
              : item
          )
        );
      })
      .finally(() => {
        unreadIdsForActiveSection.forEach((id) => markingIdsRef.current.delete(id));
      });
  }, [activeSectionId, notifications, role, sectionIds]);

  return (
    <Sidebar>
      <SidebarHeader className="gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <span className="text-sm font-semibold">UC</span>
          </div>
          {!isCompact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">UniCare Connect</p>
              <p className="truncate text-xs text-slate-500">{config.label}</p>
            </div>
          )}
        </div>
        <SidebarTrigger className="shrink-0">
          <PanelLeftClose className="size-5" />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{text.menu}</SidebarGroupLabel>
          <SidebarMenu>
            {config.sections.map((section: DashboardSection) => {
              const href = `/dashboard/${role}#${section.id}`;
              const isActive = pathname === `/dashboard/${role}` && hash === section.id;
              const SectionIcon = getSectionIcon(section.id);
              const unreadCount = sectionNotificationCounts[section.id] ?? 0;
              const handleClick = (e: React.MouseEvent) => {
                if (pathname === `/dashboard/${role}`) {
                  e.preventDefault();
                  window.location.hash = section.id;
                }
                if (isMobile) setMobileOpen(false);
              };
              return (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={href} onClick={handleClick} className="flex w-full items-center gap-3">
                      <span className="relative inline-flex shrink-0">
                        <SectionIcon className="size-5 text-slate-600 dark:text-slate-400" />
                        {isCompact && unreadCount > 0 ? (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                        ) : null}
                      </span>
                      {!isCompact && (
                        <>
                          <span className="flex-1">{section.menuLabel}</span>
                          {unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          ) : null}
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => setAccountOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/80"
            aria-expanded={accountOpen}
            aria-haspopup="true"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <User className="size-5" />
            </div>
            {!isCompact && user && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            )}
            {!isCompact && (
              <ChevronDown
                className={clsx("size-4 shrink-0 text-slate-400 transition-transform", accountOpen && "rotate-180")}
              />
            )}
          </button>

          {accountOpen && (
            <div
              className="absolute bottom-full left-0 z-50 mb-1 min-w-[12rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
              style={
                isCompact
                  ? { left: "100%", bottom: 0, marginBottom: 0, marginLeft: 8, minWidth: "11rem" }
                  : { right: 0 }
              }
              role="menu"
            >
              {user && (
                <div className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              )}
              <div className="py-1">
                <Link
                  href={`/dashboard/${role}#profile`}
                  onClick={() => {
                    setAccountOpen(false);
                    if (isMobile) setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  <UserCircle className="size-4 shrink-0" />
                  {text.account}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    if (isMobile) setMobileOpen(false);
                    signOutUser();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  <LogOut className="size-4 shrink-0" />
                  {text.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

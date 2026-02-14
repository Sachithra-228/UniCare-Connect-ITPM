"use client";

import { useEffect, useState, useRef } from "react";
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
import { useAuth } from "@/context/auth-context";
import type { UserProfile } from "@/types";

type AppSidebarProps = {
  role: DashboardRole;
  user: UserProfile | null;
};

export function AppSidebar({ role, user }: AppSidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const { signOutUser } = useAuth();
  const [hash, setHash] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
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
  }, []);
  const config = DASHBOARD_ROLE_CONFIG[role];
  if (!config) return null;

  return (
    <Sidebar>
      <SidebarHeader className="gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <span className="text-sm font-semibold">UC</span>
          </div>
          {!collapsed && (
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
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarMenu>
            {config.sections.map((section: DashboardSection) => {
              const href = `/dashboard/${role}#${section.id}`;
              const isActive = pathname === `/dashboard/${role}` && hash === section.id;
              const SectionIcon = getSectionIcon(section.id);
              return (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={href} className="flex items-center gap-3">
                      <SectionIcon className="size-5 shrink-0 text-slate-600 dark:text-slate-400" />
                      {!collapsed && <span>{section.menuLabel}</span>}
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
            {!collapsed && user && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <ChevronDown
                className={clsx("size-4 shrink-0 text-slate-400 transition-transform", accountOpen && "rotate-180")}
              />
            )}
          </button>

          {accountOpen && (
            <div
              className="absolute bottom-full left-0 z-50 mb-1 min-w-[12rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
              style={
                collapsed
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
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  <UserCircle className="size-4 shrink-0" />
                  Account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    signOutUser();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  <LogOut className="size-4 shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

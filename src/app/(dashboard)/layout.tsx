"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  DASHBOARD_ROLE_ORDER,
  resolveDashboardRole,
  type DashboardRole
} from "@/lib/role-dashboard-config";

function getRoleFromPathname(pathname: string): DashboardRole | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  const role = match?.[1]?.toLowerCase();
  return role && DASHBOARD_ROLE_ORDER.includes(role as DashboardRole) ? (role as DashboardRole) : null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const roleFromPath = getRoleFromPathname(pathname);
  const role = roleFromPath ?? resolveDashboardRole(user?.role ?? null) ?? "student";

  return (
    <SidebarProvider defaultCollapsed={false}>
      <AppSidebar role={role} user={user ?? null} />
      <SidebarInset>
        <div className="flex min-h-screen flex-col bg-slate-50/80 p-4 md:p-6 lg:p-8 dark:bg-slate-900/50">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

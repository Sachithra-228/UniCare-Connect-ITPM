"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { resolveDashboardRole } from "@/lib/role-dashboard-config";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login?mode=signin");
      return;
    }

    const targetRole = resolveDashboardRole(user.role);
    router.replace(`/dashboard/${targetRole}`);
  }, [loading, router, user]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      Loading your dashboard...
    </div>
  );
}

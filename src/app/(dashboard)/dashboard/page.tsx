"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { resolveDashboardRole } from "@/lib/role-dashboard-config";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const loadingText =
    language === "si"
      ? "ඔබගේ ඩෑෂ්බෝඩ් පූරණය වෙමින්..."
      : language === "ta"
        ? "உங்கள் டாஷ்போர்டு ஏற்றப்படுகிறது..."
        : "Loading your dashboard...";

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
      {loadingText}
    </div>
  );
}

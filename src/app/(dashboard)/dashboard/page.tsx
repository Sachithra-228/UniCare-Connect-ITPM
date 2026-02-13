"use client";

import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/shared/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/shared/badge";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const { notifications } = useAppStore();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Student dashboard"
        title={`Welcome back, ${user?.name ?? "Student"}`}
        subtitle="Track your support requests, jobs, and wellness goals."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active Aid Requests" value="3" description="2 under review" />
        <StatCard label="Upcoming Sessions" value="2" description="Mentorship & counseling" />
        <StatCard label="Job Matches" value="12" description="5 new this week" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">Quick actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/financial-aid" className="rounded-xl border border-slate-200 p-4">
              Apply for emergency aid
            </Link>
            <Link href="/career" className="rounded-xl border border-slate-200 p-4">
              Explore scholarships & internships
            </Link>
            <Link href="/wellness" className="rounded-xl border border-slate-200 p-4">
              Log today’s mood
            </Link>
            <Link href="/mentorship" className="rounded-xl border border-slate-200 p-4">
              Book a mentor session
            </Link>
          </div>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">Role & status</h3>
          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Role</span>
            <Badge variant="info">{user?.role ?? "student"}</Badge>
            <span>Financial need</span>
            <Badge variant="warning">{user?.financialNeedLevel ?? "medium"}</Badge>
          </div>
        </Card>
      </div>
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <p className="font-semibold">{notification.title}</p>
              <p className="text-slate-500">{notification.message}</p>
              <p className="text-xs text-slate-400">{notification.date}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

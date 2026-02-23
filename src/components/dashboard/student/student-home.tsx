"use client";

import { useEffect, useState } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import type { Scholarship } from "@/types";
import type { JobListing } from "@/types";

type AidRequest = { id?: string; _id?: string; category?: string; status?: string; submittedAt?: string };
type MentorshipSession = { _id: string; topic: string; scheduledTime: string; status: string };

const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];
const APPLICATION_STATUS_COLORS = ["#1e3a8a", "#1e40af", "#2563eb", "#3b82f6"];

export function StudentHome() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [aidRequests, setAidRequests] = useState<AidRequest[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  useEffect(() => {
    Promise.all([
      fetch("/api/scholarships").then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/jobs/feed").then((r) => r.json()).catch(() => []),
      fetch("/api/aid-requests").then((r) => r.json()).catch(() => []),
      fetch("/api/mentorship-sessions").then((r) => r.json()).catch(() => [])
    ]).then(([sch, jb, feed, aid, sess]) => {
      setScholarships(Array.isArray(sch) ? sch : []);
      const localJobs = Array.isArray(jb) ? jb : [];
      const externalJobs = Array.isArray(feed) ? feed : [];
      setJobs([...localJobs, ...externalJobs]);
      setAidRequests(Array.isArray(aid) ? aid : []);
      setSessions(Array.isArray(sess) ? sess : []);
    });
  }, []);

  const upcomingDeadlines = [
    ...scholarships.slice(0, 4).map((s) => ({ name: s.title.slice(0, 18), deadline: s.deadline, type: "Scholarship" })),
    ...jobs.slice(0, 3).map((j) => ({ name: j.title.slice(0, 18), deadline: j.applicationDeadline, type: "Job" }))
  ]
    .sort((a, b) => (a.deadline > b.deadline ? 1 : -1))
    .slice(0, 5);

  const applicationStatusCounts = aidRequests.reduce(
    (acc, a) => {
      const s = (a.status || "Pending").toLowerCase();
      const key = s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  let pieData = [
    { name: "Pending", value: applicationStatusCounts.Pending || 0, color: APPLICATION_STATUS_COLORS[1] },
    { name: "Approved", value: applicationStatusCounts.Approved || 0, color: APPLICATION_STATUS_COLORS[2] },
    { name: "Rejected", value: applicationStatusCounts.Rejected || 0, color: APPLICATION_STATUS_COLORS[3] }
  ].filter((d) => d.value > 0);
  const isEmptyState = pieData.length === 0;
  if (isEmptyState) {
    pieData = [
      { name: "No applications", value: 2, color: APPLICATION_STATUS_COLORS[0] },
      { name: "", value: 1, color: APPLICATION_STATUS_COLORS[1] },
      { name: "", value: 1, color: APPLICATION_STATUS_COLORS[2] }
    ];
  }

  const today = new Date();
  const calendarYear = today.getFullYear();
  const calendarMonth = today.getMonth();
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const deadlineDatesSet = new Set(
    upcomingDeadlines.map((d) => d.deadline).filter(Boolean)
  );
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabel = firstDay.toLocaleString("default", { month: "long", year: "numeric" });
  function dateKey(day: number) {
    const y = calendarYear;
    const m = String(calendarMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-white to-primary/5 p-5 dark:from-slate-900/80 dark:to-primary/10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Application status
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => (name ? `${name}: ${value}` : null)}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Count"]} />
                <Legend formatter={(_: unknown, entry: { payload?: { name?: string } }, i: number) => (isEmptyState && i > 0 ? "" : entry.payload?.name)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-white to-primary/5 p-5 dark:from-slate-900/80 dark:to-primary/10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Upcoming deadlines
          </h3>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 dark:border-slate-700/50 dark:bg-slate-800/30">
              <p className="mb-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                {monthLabel}
              </p>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {weekDays.map((w) => (
                  <div key={w} className="py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {w}
                  </div>
                ))}
                {calendarDays.map((day, i) => {
                  if (day === null) {
                    return <div key={`e-${i}`} className="min-h-[28px]" />;
                  }
                  const key = dateKey(day);
                  const hasDeadline = deadlineDatesSet.has(key);
                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === calendarMonth &&
                    today.getFullYear() === calendarYear;
                  return (
                    <div
                      key={key}
                      className={`flex min-h-[28px] items-center justify-center rounded text-sm ${
                        isToday
                          ? "bg-primary font-semibold text-white"
                          : hasDeadline
                            ? "bg-primary/15 font-medium text-primary dark:bg-primary/25 dark:text-primary"
                            : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="max-h-24 overflow-y-auto">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No upcoming deadlines.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {upcomingDeadlines.map((d, i) => (
                    <li
                      key={`${d.deadline}-${d.name}-${i}`}
                      className="flex items-center gap-2 rounded border border-slate-100 px-2 py-1.5 dark:border-slate-700/50"
                    >
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary dark:bg-primary/20">
                        {d.deadline}
                      </span>
                      <span className="truncate text-slate-700 dark:text-slate-300">{d.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white dark:from-primary/10 dark:via-slate-900/90 dark:to-slate-900/80">
        <div className="border-b border-primary/10 bg-primary/5 px-5 py-4 dark:border-primary/20 dark:bg-primary/10">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">AI scholarship matching</h3>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Recommendations based on financial need, academic performance, and interests.
          </p>
        </div>
        <div className="p-5">
          {scholarships.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No scholarships loaded.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scholarships.map((s) => (
                <a
                  key={s._id}
                  href={s.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-primary/40"
                >
                  <h4 className="font-semibold text-slate-900 dark:text-white">{s.title}</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.provider}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{s.amount}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{s.deadline}</Badge>
                    <Badge variant="success">{s.status}</Badge>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}

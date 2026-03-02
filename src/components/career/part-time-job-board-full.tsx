"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import type { JobListing } from "@/types";

const typeBorderClass: Record<string, string> = {
  "part-time": "border-l-4 border-l-blue-500",
  internship: "border-l-4 border-l-emerald-500",
  "full-time": "border-l-4 border-l-violet-500"
};

const quickChips = [
  { id: "all", label: "All", type: "", location: "" },
  { id: "remote", label: "Remote", type: "", location: "Remote" },
  { id: "part-time", label: "Part-time", type: "part-time", location: "" },
  { id: "internship", label: "Internship", type: "internship", location: "" },
  { id: "full-time", label: "Full-time", type: "full-time", location: "" }
];

function getDaysUntil(deadlineStr: string): number | null {
  if (!deadlineStr) return null;
  try {
    const [y, m, d] = deadlineStr.split("-").map(Number);
    const deadline = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  } catch {
    return null;
  }
}

export function PartTimeJobBoardFull() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobType, setJobType] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobTab, setJobTab] = useState<"all" | "campus" | "remotive">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/jobs/feed").then((r) => r.json()).catch(() => [])
    ]).then(([jb, feed]) => {
      const localJobs = Array.isArray(jb) ? jb : [];
      const externalJobs = Array.isArray(feed) ? feed : [];
      setJobs([...localJobs, ...externalJobs]);
    });
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchType = !jobType || job.type === jobType;
    const loc = (job.location || "").toLowerCase();
    const matchLoc =
      !jobLocation ||
      job.location === jobLocation ||
      (jobLocation === "Remote" && (loc.includes("remote") || loc.includes("anywhere")));
    return matchType && matchLoc;
  });

  const campusJobs = filteredJobs.filter((j) => !j.source || j.source !== "Remotive");
  const remotiveJobs = filteredJobs.filter((j) => j.source === "Remotive");
  const jobsByTab =
    jobTab === "campus" ? campusJobs : jobTab === "remotive" ? remotiveJobs : filteredJobs;
  const featuredJobs = jobsByTab.slice(0, 3);

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white dark:from-primary/10 dark:via-slate-900/90 dark:to-slate-900/80">
      <div className="border-b border-primary/10 bg-primary/5 px-5 py-4 dark:border-primary/20 dark:bg-primary/10">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Part-time & internship job board
        </h3>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          Campus jobs plus remote roles from Remotive. Apply via links below.
        </p>
        <div className="mt-4 flex border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Job source">
          {[
            { id: "all" as const, label: "All jobs", count: filteredJobs.length },
            { id: "campus" as const, label: "Campus jobs", count: campusJobs.length },
            { id: "remotive" as const, label: "Remotive", count: remotiveJobs.length }
          ].map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={jobTab === id}
              onClick={() => setJobTab(id)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                jobTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {label}
              <span className="ml-1.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-xs dark:bg-slate-600/50">
                {count}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickChips.map((chip) => {
            const isActive = jobType === chip.type && jobLocation === chip.location;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setJobType(chip.type);
                  setJobLocation(chip.location);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-5">
        {jobsByTab.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {jobTab === "all" ? "No jobs match your filters." : `No ${jobTab === "campus" ? "campus" : "Remotive"} jobs match your filters.`}
          </p>
        ) : (
          <>
            {featuredJobs.length >= 2 && (
              <div className="mb-6">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Featured
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {featuredJobs.map((j) => {
                    const days = getDaysUntil(j.applicationDeadline || "");
                    const isRemote = (j.location || "").toLowerCase().includes("remote") || (j.location || "").toLowerCase().includes("anywhere");
                    return (
                      <a
                        key={j._id}
                        href={j.externalUrl || (j.contactEmail ? `mailto:${j.contactEmail}` : "#")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-[260px] shrink-0 flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{j.title}</h4>
                          {j.source && (
                            <span className="shrink-0 rounded bg-slate-200/80 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-600/50 dark:text-slate-300">
                              {j.source}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{j.company}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          {isRemote ? <span aria-hidden>🌐</span> : <span aria-hidden>📍</span>}
                          <span>{j.location}</span>
                          {j.salary && j.salary !== "Not specified" && <span>· {j.salary}</span>}
                        </div>
                        {(days !== null || j.applicationDeadline) && (
                          <p className="mt-1 text-xs text-slate-500">
                            {days !== null ? `Closes in ${days} day${days !== 1 ? "s" : ""}` : `Apply by ${j.applicationDeadline}`}
                          </p>
                        )}
                        <span className="mt-2 inline-flex w-fit rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary/90">
                          Apply
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobsByTab.map((j) => {
                const days = getDaysUntil(j.applicationDeadline || "");
                const isRemote = (j.location || "").toLowerCase().includes("remote") || (j.location || "").toLowerCase().includes("anywhere");
                const borderClass = typeBorderClass[j.type] || "border-l-4 border-l-slate-300 dark:border-l-slate-600";
                return (
                  <div
                    key={j._id}
                    className={`flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-primary/40 ${borderClass}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{j.title}</h4>
                      {j.source && (
                        <span className="shrink-0 rounded bg-slate-200/80 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-600/50 dark:text-slate-300">
                          {j.source}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{j.company}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                      {isRemote ? <span aria-hidden>🌐</span> : <span aria-hidden>📍</span>}
                      <span>{j.location}</span>
                      {j.salary && j.salary !== "Not specified" && <span>· {j.salary}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="info">{j.type}</Badge>
                      {(days !== null || j.applicationDeadline) && (
                        <span className="text-xs text-slate-500">
                          {days !== null ? `Closes in ${days} day${days !== 1 ? "s" : ""}` : `Apply by ${j.applicationDeadline}`}
                        </span>
                      )}
                    </div>
                    {(j.externalUrl || j.contactEmail) && (
                      <a
                        href={j.externalUrl || `mailto:${j.contactEmail}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-fit items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                      >
                        Apply
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

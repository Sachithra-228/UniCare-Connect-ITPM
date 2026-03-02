"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import type { JobListing } from "@/types";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

type EmployerSectionContentProps = {
  sectionId: string;
};

type EmployerJob = JobListing & {
  status?: "draft" | "active" | "expired";
  views?: number;
  applicationsCount?: number;
};

export function EmployerSectionContent({ sectionId }: EmployerSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "employer-home":
        return EmployerHomeSection;
      case "job-listings":
        return EmployerJobListingsSection;
      case "applicants":
        return EmployerApplicantsSection;
      case "talent-pool":
        return EmployerTalentPoolSection;
      case "interviews":
        return EmployerInterviewsSection;
      case "campus-connect":
        return EmployerCampusConnectSection;
      case "analytics":
        return EmployerAnalyticsSection;
      case "profile":
        return EmployerProfileSection;
      default:
        return EmployerHomeSection;
    }
  }, [sectionId]);

  return <Section />;
}

function useEmployerJobs() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/jobs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setJobs(
            data.map((job) => ({
              ...job,
              status: (job as EmployerJob).status ?? "active",
              views: (job as EmployerJob).views ?? 0,
              applicationsCount: (job as EmployerJob).applicationsCount ?? 0
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });

  return () => {
      cancelled = true;
    };
  }, []);

  return jobs;
}

function EmployerHomeSection() {
  const jobs = useEmployerJobs();

  const activeJobs = jobs.filter((j) => j.status !== "expired" && j.status !== "draft").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicationsCount ?? 0), 0);

  const recommendedCount = Math.min(12, totalApplicants); // placeholder logic until matching exists

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active postings"
          value={String(activeJobs)}
          description="Currently visible to students"
        />
        <StatCard
          label="Recent applicants"
          value={String(totalApplicants)}
          description="Last sync from applications"
        />
        <StatCard
          label="Recommended candidates"
          value={String(recommendedCount)}
          description="Based on skills & interests"
        />
        <StatCard
          label="Upcoming interviews"
          value="—"
          description="Schedule managed in Interviews"
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Recently posted jobs</h3>
        <div className="space-y-2 text-sm">
          {jobs.slice(0, 5).map((job) => (
            <div
              key={job._id}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-slate-500">
                    {job.location} • {job.type}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {job.status ?? "Active"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {job.applicationsCount ?? 0} applicants • {job.views ?? 0} views
              </p>
            </div>
          ))}
          {!jobs.length && (
            <p className="text-sm text-slate-500">
              No job postings yet. Create your first listing from the Job Listings section.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function EmployerJobListingsSection() {
  const jobs = useEmployerJobs();

  const drafts = jobs.filter((j) => j.status === "draft");
  const active = jobs.filter((j) => j.status !== "draft" && j.status !== "expired");
  const expired = jobs.filter((j) => j.status === "expired");

  const renderList = (title: string, items: EmployerJob[]) => (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
        {items.map((job) => (
          <div
            key={job._id}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{job.title}</p>
              <p className="text-xs text-slate-500">
                {job.location} • {job.type}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{job.views ?? 0} views</span>
              <span>{job.applicationsCount ?? 0} applications</span>
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="py-3 text-sm text-slate-500">No items in this state.</p>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Create and manage job openings visible to students. Listings here connect only to student
        profiles and university verification—no wellness or financial data is exposed.
      </p>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Job listings</h2>
        <button className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90">
          Create job posting
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {renderList("Drafts", drafts)}
        {renderList("Active", active)}
        {renderList("Expired", expired)}
      </div>
    </div>
  );
}

function EmployerApplicantsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Review applicants for your roles, shortlist candidates, and coordinate with students. Donors
        and NGOs do not access this workspace.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Applicants by job</h3>
        <p className="text-sm text-slate-500">
          Hook this section into your applications collection once it exists. It will display
          applicants per job with actions to shortlist, reject with feedback, schedule interviews,
          and make offers—limited strictly to career‑related information.
        </p>
      </Card>
    </div>
  );
}

function EmployerTalentPoolSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Browse student talent based on skills and departments. Only students who have consented
        (e.g., by applying or opting in) will appear here; you cannot view unrelated profiles.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Talent pool</h3>
        <p className="text-sm text-slate-500">
          Connect this area to a student profiles API with filters for skills, department, and
          graduation year. It will support saving promising profiles, AI‑matched recommendations,
          and contact options for interested students.
        </p>
      </Card>
    </div>
  );
}

function EmployerInterviewsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Plan and track interviews with students. This section focuses only on career‑related
        interactions and does not show sensitive wellness or financial details.
      </p>
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">Interview scheduler</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Role / job
            </label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
              <option>Select job</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Time slot
            </label>
            <input
              type="time"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Interview instructions
          </label>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Add call details, virtual meeting links, or in‑person location..."
          />
        </div>
        <div className="flex justify-end">
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Send invitations
          </button>
        </div>
      </Card>
    </div>
  );
}

function EmployerCampusConnectSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Coordinate with the university on career fairs and campus recruitment events. This space is
        focused on employer–student interactions only.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Campus events</h3>
        <p className="text-sm text-slate-500">
          Integrate upcoming fair dates and recruitment events from the university calendar. You can
          register, manage participation, and promote your employer brand to students.
        </p>
      </Card>
    </div>
  );
}

function EmployerAnalyticsSection() {
  const jobs = useEmployerJobs();

  const totalApplications = jobs.reduce((sum, j) => sum + (j.applicationsCount ?? 0), 0);
  const avgPerJob = jobs.length ? Math.round(totalApplications / jobs.length) : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        High‑level analytics to understand how students engage with your roles and how quickly
        hiring moves, without exposing individual student wellness or financial data.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total applications"
          value={String(totalApplications)}
          description="Across all postings"
        />
        <StatCard
          label="Avg. applications per job"
          value={String(avgPerJob)}
          description="Interest per listing"
        />
        <StatCard label="Time‑to‑hire" value="—" description="Add from offer data when ready" />
      </div>
    </div>
  );
}

function EmployerProfileSection() {
  return (
    <RoleProfileShell roleLabel="Employer profile">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Keep your company profile up to date. Students and university admins see this information
          when evaluating your opportunities; you cannot modify student profiles from here.
        </p>
        <Card className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Company name
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Your company"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Logo URL
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Hiring preferences
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="E.g. departments, skill areas, locations"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Team access
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
                <option>Single recruiter</option>
                <option>Recruiter + hiring managers</option>
                <option>Full team management</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Save profile
            </button>
          </div>
        </Card>
      </div>
    </RoleProfileShell>
  );
}


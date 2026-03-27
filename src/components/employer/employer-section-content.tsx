"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import type { JobListing } from "@/types";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

type EmployerSectionContentProps = {
  sectionId: string;
};

type EmployerJob = JobListing & {
  status?: "draft" | "active" | "expired";
  moderationStatus?: "Pending" | "Approved" | "Rejected";
  reviewNote?: string | null;
  views?: number;
  applicationsCount?: number;
};

function normalizeModerationStatus(status?: string): "Pending" | "Approved" | "Rejected" {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  return "Pending";
}

function moderationBadgeClass(status: "Pending" | "Approved" | "Rejected") {
  if (status === "Approved") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (status === "Rejected") {
    return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  }
  return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/jobs?scope=mine");
      if (!response.ok) {
        setError("Unable to load jobs right now.");
        setJobs([]);
        return;
      }
      const data = (await response.json().catch(() => [])) as EmployerJob[];
      if (!Array.isArray(data)) {
        setJobs([]);
        return;
      }
      setJobs(
        data.map((job) => ({
          ...job,
          status: (job as EmployerJob).status ?? "active",
          moderationStatus: normalizeModerationStatus((job as EmployerJob).moderationStatus),
          views: (job as EmployerJob).views ?? 0,
          applicationsCount: (job as EmployerJob).applicationsCount ?? 0
        }))
      );
    } catch {
      setError("Unable to load jobs right now.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return { jobs, loading, error, reload: loadJobs };
}

function EmployerHomeSection() {
  const { jobs, loading, error } = useEmployerJobs();

  const activeJobs = jobs.filter(
    (j) => j.status !== "expired" && j.status !== "draft" && normalizeModerationStatus(j.moderationStatus) === "Approved"
  ).length;
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
          value="-"
          description="Schedule managed in Interviews"
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Recently posted jobs</h3>
        {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-500">Loading jobs...</p> : null}
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
                    {job.location} - {job.type}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {job.status ?? "Active"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${moderationBadgeClass(
                    normalizeModerationStatus(job.moderationStatus)
                  )}`}
                >
                  {normalizeModerationStatus(job.moderationStatus)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {job.applicationsCount ?? 0} applicants - {job.views ?? 0} views
              </p>
              {job.reviewNote ? (
                <p className="mt-1 text-xs text-slate-500">Review note: {job.reviewNote}</p>
              ) : null}
            </div>
          ))}
          {!loading && !jobs.length && (
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
  const { jobs, loading, error, reload } = useEmployerJobs();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [type, setType] = useState<"part-time" | "full-time" | "internship">("part-time");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [publishingStatus, setPublishingStatus] = useState<"active" | "draft">("active");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const drafts = jobs.filter((job) => job.status === "draft");
  const active = jobs.filter((job) => job.status !== "draft" && job.status !== "expired");
  const expired = jobs.filter((job) => job.status === "expired");

  const submitJobPosting = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);

    const requirements = requirementsText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!title.trim() || !company.trim() || !location.trim() || !salary.trim() || !applicationDeadline || !contactEmail.trim()) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    if (!requirements.length) {
      setSubmitError("Please add at least one requirement.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          salary: salary.trim(),
          type,
          requirements,
          applicationDeadline,
          contactEmail: contactEmail.trim(),
          status: publishingStatus
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) {
        setSubmitError(payload.message ?? payload.error ?? "Unable to create job posting.");
        return;
      }

      setSubmitMessage("Job posting submitted. It will appear to students after admin approval.");
      setTitle("");
      setCompany("");
      setLocation("");
      setSalary("");
      setType("part-time");
      setApplicationDeadline("");
      setContactEmail("");
      setRequirementsText("");
      setPublishingStatus("active");
      await reload();
    } catch {
      setSubmitError("Unable to create job posting.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderList = (titleLabel: string, items: EmployerJob[]) => (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold">{titleLabel}</h3>
      <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
        {loading ? (
          <p className="py-3 text-sm text-slate-500">Loading jobs...</p>
        ) : (
          items.map((job) => (
            <div
              key={job._id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-slate-500">{job.location} - {job.type}</p>
                {job.reviewNote ? (
                  <p className="mt-1 text-xs text-slate-500">Review note: {job.reviewNote}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{job.views ?? 0} views</span>
                <span>{job.applicationsCount ?? 0} applications</span>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-medium ${moderationBadgeClass(
                    normalizeModerationStatus(job.moderationStatus)
                  )}`}
                >
                  {normalizeModerationStatus(job.moderationStatus)}
                </span>
              </div>
            </div>
          ))
        )}
        {!loading && !items.length ? (
          <p className="py-3 text-sm text-slate-500">No items in this state.</p>
        ) : null}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Create and manage job openings visible to students. Employer postings go through admin review before student visibility.
      </p>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Job listings</h2>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm((current) => !current);
            setSubmitError(null);
            setSubmitMessage(null);
          }}
          className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90"
        >
          {showCreateForm ? "Close form" : "Create job posting"}
        </button>
      </div>

      {showCreateForm ? (
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">Create new job posting</h3>
          <form className="space-y-3" onSubmit={submitJobPosting}>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Job title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                required
              />
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Location (e.g., Colombo / Remote)"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
              />
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Salary (e.g., LKR 60,000/month)"
                value={salary}
                onChange={(event) => setSalary(event.target.value)}
                required
              />
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={type}
                onChange={(event) => setType(event.target.value as "part-time" | "full-time" | "internship")}
              >
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
              </select>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={applicationDeadline}
                onChange={(event) => setApplicationDeadline(event.target.value)}
                required
              />
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
                placeholder="Contact email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                required
              />
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
                value={publishingStatus}
                onChange={(event) => setPublishingStatus(event.target.value as "active" | "draft")}
              >
                <option value="active">Publish after approval</option>
                <option value="draft">Save as draft after approval</option>
              </select>
            </div>

            <textarea
              className="min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder="Requirements (comma or new line separated)"
              value={requirementsText}
              onChange={(event) => setRequirementsText(event.target.value)}
              required
            />

            {submitError ? <p className="text-sm text-rose-600 dark:text-rose-400">{submitError}</p> : null}
            {submitMessage ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{submitMessage}</p> : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit for review"}
              </button>
            </div>
          </form>
        </Card>
      ) : null}

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
          and make offers - limited strictly to career-related information.
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
          graduation year. It will support saving promising profiles, AI-matched recommendations,
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
        Plan and track interviews with students. This section focuses only on career-related
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
            placeholder="Add call details, virtual meeting links, or in-person location..."
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
        focused on employer-student interactions only.
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
  const { jobs } = useEmployerJobs();

  const totalApplications = jobs.reduce((sum, j) => sum + (j.applicationsCount ?? 0), 0);
  const avgPerJob = jobs.length ? Math.round(totalApplications / jobs.length) : 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        High-level analytics to understand how students engage with your roles and how quickly
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
        <StatCard label="Time-to-hire" value="-" description="Add from offer data when ready" />
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


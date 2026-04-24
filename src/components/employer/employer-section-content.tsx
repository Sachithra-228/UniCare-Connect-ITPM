"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useAuth } from "@/context/auth-context";
import {
  employerNavyCardClass,
  employerNavyStatClass,
  employerNavySurfaceClass
} from "@/components/employer/employer-card-theme";
import {
  defaultPreferences,
  mergePreferences,
  tabVariants,
  type ProfilePreferences,
  type ProfileTab
} from "@/components/profile/profile-preferences";
import type { JobListing } from "@/types";

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

type EmployerApplicant = {
  _id: string;
  jobId?: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  university?: string;
  department?: string;
  graduationYear?: string;
  skills: string[];
  status: "new" | "shortlisted" | "interview" | "offered" | "rejected";
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EmployerTalentProfile = {
  _id: string;
  sourceApplicantId?: string;
  fullName: string;
  email: string;
  university?: string;
  department?: string;
  graduationYear?: string;
  skills: string[];
  experienceLevel?: "entry" | "intermediate" | "advanced";
  portfolioUrl?: string;
  status: "saved" | "contacted" | "in-process";
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EmployerInterview = {
  _id: string;
  applicantId?: string;
  candidateName: string;
  candidateEmail?: string;
  jobId?: string;
  jobTitle?: string;
  interviewDate: string;
  interviewTime: string;
  mode: "virtual" | "on-site" | "phone";
  locationOrLink?: string;
  instructions?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
};

type EmployerCampusEvent = {
  _id: string;
  title: string;
  eventType: "career-fair" | "workshop" | "info-session" | "networking" | "other";
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  capacity?: number;
  status: "planning" | "open" | "closed" | "completed" | "cancelled";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EmployerAnalyticsRecord = {
  _id: string;
  reportName: string;
  metricArea: "applications" | "interviews" | "hiring" | "brand" | "general";
  periodStart: string;
  periodEnd: string;
  totalViews: number;
  totalApplications: number;
  totalInterviews: number;
  totalOffers: number;
  totalHires: number;
  conversionRate: number;
  note?: string;
  status: "draft" | "published" | "archived";
  createdAt?: string;
  updatedAt?: string;
};

function splitSkills(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function useEmployerApplicants() {
  const [applicants, setApplicants] = useState<EmployerApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/employer/applicants");
      const payload = (await response.json().catch(() => [])) as
        | EmployerApplicant[]
        | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load applicants.");
        setApplicants([]);
        return;
      }
      setApplicants(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load applicants.");
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplicants();
  }, [loadApplicants]);

  return { applicants, loading, error, reload: loadApplicants };
}

function useEmployerTalentPool() {
  const [profiles, setProfiles] = useState<EmployerTalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/employer/talent-pool");
      const payload = (await response.json().catch(() => [])) as
        | EmployerTalentProfile[]
        | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load talent pool.");
        setProfiles([]);
        return;
      }
      setProfiles(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load talent pool.");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  return { profiles, loading, error, reload: loadProfiles };
}

function useEmployerInterviews() {
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/employer/interviews");
      const payload = (await response.json().catch(() => [])) as
        | EmployerInterview[]
        | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load interviews.");
        setInterviews([]);
        return;
      }
      setInterviews(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load interviews.");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInterviews();
  }, [loadInterviews]);

  return { interviews, loading, error, reload: loadInterviews };
}

function useEmployerCampusEvents() {
  const [events, setEvents] = useState<EmployerCampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/employer/campus-connect");
      const payload = (await response.json().catch(() => [])) as
        | EmployerCampusEvent[]
        | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load campus events.");
        setEvents([]);
        return;
      }
      setEvents(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load campus events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return { events, loading, error, reload: loadEvents };
}

function useEmployerAnalyticsRecords() {
  const [records, setRecords] = useState<EmployerAnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/employer/analytics");
      const payload = (await response.json().catch(() => [])) as
        | EmployerAnalyticsRecord[]
        | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load analytics records.");
        setRecords([]);
        return;
      }
      setRecords(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load analytics records.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  return { records, loading, error, reload: loadRecords };
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
          className={employerNavyStatClass}
        />
        <StatCard
          label="Recent applicants"
          value={String(totalApplicants)}
          description="Last sync from applications"
          className={employerNavyStatClass}
        />
        <StatCard
          label="Recommended candidates"
          value={String(recommendedCount)}
          description="Based on skills & interests"
          className={employerNavyStatClass}
        />
        <StatCard
          label="Upcoming interviews"
          value="-"
          description="Schedule managed in Interviews"
          className={employerNavyStatClass}
        />
      </div>

      <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
        <h3 className="text-sm font-semibold">Recently posted jobs</h3>
        {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
        {loading ? <p className="text-sm text-slate-500">Loading jobs...</p> : null}
        <div className="space-y-2 text-sm">
          {jobs.slice(0, 5).map((job) => (
            <div
              key={job._id}
              className={`${employerNavySurfaceClass} flex flex-col gap-1 rounded-xl p-3`}
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
    <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
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
        <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
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
  const { jobs } = useEmployerJobs();
  const { applicants, loading, error, reload } = useEmployerApplicants();
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [jobId, setJobId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [status, setStatus] = useState<EmployerApplicant["status"]>("new");
  const [note, setNote] = useState("");

  const clearForm = () => {
    setEditingId(null);
    setJobId("");
    setJobTitle("");
    setCandidateName("");
    setCandidateEmail("");
    setUniversity("");
    setDepartment("");
    setGraduationYear("");
    setSkillsText("");
    setStatus("new");
    setNote("");
  };

  const groupedByJob = useMemo(() => {
    const groups = new Map<string, EmployerApplicant[]>();
    applicants.forEach((item) => {
      const key = item.jobTitle || "General role";
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    });
    return Array.from(groups.entries());
  }, [applicants]);

  const statusCounts = useMemo(
    () =>
      applicants.reduce(
        (acc, item) => {
          acc.total += 1;
          if (item.status === "shortlisted") acc.shortlisted += 1;
          if (item.status === "interview") acc.interview += 1;
          if (item.status === "offered") acc.offered += 1;
          return acc;
        },
        { total: 0, shortlisted: 0, interview: 0, offered: 0 }
      ),
    [applicants]
  );

  const statusBadge = (value: EmployerApplicant["status"]) => {
    if (value === "shortlisted") {
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    }
    if (value === "interview") {
      return "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    }
    if (value === "offered") {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    }
    if (value === "rejected") {
      return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    }
    return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  };

  const startEdit = (item: EmployerApplicant) => {
    setEditingId(item._id);
    setJobId(item.jobId ?? "");
    setJobTitle(item.jobTitle ?? "");
    setCandidateName(item.candidateName ?? "");
    setCandidateEmail(item.candidateEmail ?? "");
    setUniversity(item.university ?? "");
    setDepartment(item.department ?? "");
    setGraduationYear(item.graduationYear ?? "");
    setSkillsText((item.skills ?? []).join(", "));
    setStatus(item.status ?? "new");
    setNote(item.note ?? "");
    setActionError(null);
    setMessage(null);
  };

  const submitApplicant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setMessage(null);
    if (!candidateName.trim() || !candidateEmail.trim()) {
      setActionError("Candidate name and email are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/employer/applicants/${editingId}` : "/api/employer/applicants",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: jobId || undefined,
            jobTitle: jobTitle || undefined,
            candidateName: candidateName.trim(),
            candidateEmail: candidateEmail.trim(),
            university: university.trim() || undefined,
            department: department.trim() || undefined,
            graduationYear: graduationYear.trim() || undefined,
            skills: splitSkills(skillsText),
            status,
            note: note.trim() || undefined
          })
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to save applicant.");
        return;
      }
      setMessage(payload.message ?? (editingId ? "Applicant updated." : "Applicant added."));
      clearForm();
      await reload();
    } catch {
      setActionError("Unable to save applicant.");
    } finally {
      setSaving(false);
    }
  };

  const updateApplicantStatus = async (id: string, nextStatus: EmployerApplicant["status"]) => {
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/applicants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to update applicant status.");
        return;
      }
      setMessage(payload.message ?? "Applicant status updated.");
      await reload();
    } catch {
      setActionError("Unable to update applicant status.");
    }
  };

  const deleteApplicant = async (id: string) => {
    if (!window.confirm("Delete this applicant?")) return;
    setDeletingId(id);
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/applicants/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to delete applicant.");
        return;
      }
      if (editingId === id) clearForm();
      setMessage(payload.message ?? "Applicant deleted.");
      await reload();
    } catch {
      setActionError("Unable to delete applicant.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Review applicants for your roles, shortlist candidates, and coordinate with students. Donors
        and NGOs do not access this workspace.
      </p>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {actionError ? <p className="text-sm text-rose-600 dark:text-rose-400">{actionError}</p> : null}
      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total applicants"
          value={String(statusCounts.total)}
          description="All tracked candidates"
          className={employerNavyStatClass}
        />
        <StatCard
          label="Shortlisted"
          value={String(statusCounts.shortlisted)}
          description="Review priority"
          className={employerNavyStatClass}
        />
        <StatCard
          label="Interview stage"
          value={String(statusCounts.interview)}
          description="Needs scheduling"
          className={employerNavyStatClass}
        />
        <StatCard label="Offers" value={String(statusCounts.offered)} description="Ready for follow-up" className={employerNavyStatClass} />
      </div>

      <Card className={`${employerNavyCardClass} space-y-4 p-4`}>
        <h3 className="text-sm font-semibold">{editingId ? "Edit applicant" : "Add applicant"}</h3>
        <form className="space-y-3" onSubmit={submitApplicant}>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={jobId}
              onChange={(event) => {
                const selected = jobs.find((item) => item._id === event.target.value);
                setJobId(event.target.value);
                setJobTitle(selected?.title ?? "");
              }}
            >
              <option value="">Select job (optional)</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
            <Input
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Job title (if not selected above)"
            />
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={status}
              onChange={(event) => setStatus(event.target.value as EmployerApplicant["status"])}
            >
              <option value="new">New</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
            <Input
              value={candidateName}
              onChange={(event) => setCandidateName(event.target.value)}
              placeholder="Candidate name"
              required
            />
            <Input
              type="email"
              value={candidateEmail}
              onChange={(event) => setCandidateEmail(event.target.value)}
              placeholder="Candidate email"
              required
            />
            <Input
              value={graduationYear}
              onChange={(event) => setGraduationYear(event.target.value)}
              placeholder="Graduation year"
            />
            <Input value={university} onChange={(event) => setUniversity(event.target.value)} placeholder="University" />
            <Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" />
            <Input
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder="Skills (comma separated)"
            />
          </div>
          <textarea
            className="min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Notes, feedback, or next steps"
          />
          <div className="flex justify-end gap-2">
            {editingId ? (
              <Button
                type="button"
                onClick={() => {
                  clearForm();
                  setActionError(null);
                  setMessage(null);
                }}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update applicant" : "Add applicant"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Applicants by job</h3>
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 text-xs dark:border-slate-700 dark:bg-slate-900/40">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Table view
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                viewMode === "card"
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Card view
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading applicants...</p>
        ) : !applicants.length ? (
          <p className="text-sm text-slate-500">No applicants yet. Add the first candidate above.</p>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Candidate</th>
                  <th className="px-2 py-2 text-left font-medium">Job</th>
                  <th className="px-2 py-2 text-left font-medium">University</th>
                  <th className="px-2 py-2 text-left font-medium">Skills</th>
                  <th className="px-2 py-2 text-left font-medium">Status</th>
                  <th className="px-2 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {applicants.map((item) => (
                  <tr key={item._id}>
                    <td className="px-2 py-2">
                      <p className="font-medium">{item.candidateName}</p>
                      <p className="text-xs text-slate-500">{item.candidateEmail}</p>
                    </td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{item.jobTitle || "General role"}</td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      {item.university || "-"}
                      {item.department ? `, ${item.department}` : ""}
                    </td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{item.skills.join(", ") || "-"}</td>
                    <td className="px-2 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => updateApplicantStatus(item._id, "shortlisted")}
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Shortlist
                        </button>
                        <button
                          type="button"
                          onClick={() => updateApplicantStatus(item._id, "interview")}
                          className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                        >
                          Interview
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="text-xs font-medium text-slate-700 hover:underline dark:text-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteApplicant(item._id)}
                          disabled={deletingId === item._id}
                          className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60 dark:text-rose-400"
                        >
                          {deletingId === item._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByJob.map(([job, list]) => (
              <div key={job} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{job}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {list.map((item) => (
                    <article key={item._id} className={`${employerNavySurfaceClass} rounded-xl p-3`}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.candidateName}</p>
                          <p className="text-xs text-slate-500">{item.candidateEmail}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.university || "University N/A"}
                        {item.department ? ` · ${item.department}` : ""}
                        {item.graduationYear ? ` · ${item.graduationYear}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Skills: {item.skills.join(", ") || "Not specified"}
                      </p>
                      {item.note ? <p className="mt-1 text-xs text-slate-500">Note: {item.note}</p> : null}
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => updateApplicantStatus(item._id, "offered")}
                          className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => updateApplicantStatus(item._id, "rejected")}
                          className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="text-xs font-medium text-slate-700 hover:underline dark:text-slate-200"
                        >
                          Edit
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmployerTalentPoolSection() {
  const { applicants, reload: reloadApplicants } = useEmployerApplicants();
  const { profiles, loading, error, reload } = useEmployerTalentPool();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployerTalentProfile["status"] | "all">("all");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"entry" | "intermediate" | "advanced">("entry");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [status, setStatus] = useState<EmployerTalentProfile["status"]>("saved");
  const [note, setNote] = useState("");

  const clearForm = () => {
    setEditingId(null);
    setFullName("");
    setEmail("");
    setUniversity("");
    setDepartment("");
    setGraduationYear("");
    setSkillsText("");
    setExperienceLevel("entry");
    setPortfolioUrl("");
    setStatus("saved");
    setNote("");
  };

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((item) => {
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        const haystack = `${item.fullName} ${item.email} ${item.skills.join(" ")} ${item.university ?? ""}`.toLowerCase();
        const matchQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
        return matchStatus && matchQuery;
      }),
    [profiles, query, statusFilter]
  );

  const shortlistedApplicants = useMemo(
    () => applicants.filter((item) => item.status === "shortlisted" || item.status === "interview"),
    [applicants]
  );

  const startEdit = (item: EmployerTalentProfile) => {
    setEditingId(item._id);
    setFullName(item.fullName ?? "");
    setEmail(item.email ?? "");
    setUniversity(item.university ?? "");
    setDepartment(item.department ?? "");
    setGraduationYear(item.graduationYear ?? "");
    setSkillsText((item.skills ?? []).join(", "));
    setExperienceLevel(item.experienceLevel ?? "entry");
    setPortfolioUrl(item.portfolioUrl ?? "");
    setStatus(item.status ?? "saved");
    setNote(item.note ?? "");
    setActionError(null);
    setMessage(null);
  };

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setMessage(null);
    if (!fullName.trim() || !email.trim()) {
      setActionError("Full name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/employer/talent-pool/${editingId}` : "/api/employer/talent-pool",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            university: university.trim() || undefined,
            department: department.trim() || undefined,
            graduationYear: graduationYear.trim() || undefined,
            skills: splitSkills(skillsText),
            experienceLevel,
            portfolioUrl: portfolioUrl.trim() || undefined,
            status,
            note: note.trim() || undefined
          })
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to save talent profile.");
        return;
      }
      setMessage(payload.message ?? (editingId ? "Talent profile updated." : "Talent profile added."));
      clearForm();
      await reload();
    } catch {
      setActionError("Unable to save talent profile.");
    } finally {
      setSaving(false);
    }
  };

  const updateTalentStatus = async (id: string, nextStatus: EmployerTalentProfile["status"]) => {
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/talent-pool/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to update talent status.");
        return;
      }
      setMessage(payload.message ?? "Talent status updated.");
      await reload();
    } catch {
      setActionError("Unable to update talent status.");
    }
  };

  const deleteProfile = async (id: string) => {
    if (!window.confirm("Delete this talent profile?")) return;
    setDeletingId(id);
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/talent-pool/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to delete talent profile.");
        return;
      }
      if (editingId === id) clearForm();
      setMessage(payload.message ?? "Talent profile deleted.");
      await reload();
    } catch {
      setActionError("Unable to delete talent profile.");
    } finally {
      setDeletingId(null);
    }
  };

  const importApplicant = async (item: EmployerApplicant) => {
    setImportingId(item._id);
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/employer/talent-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceApplicantId: item._id,
          fullName: item.candidateName,
          email: item.candidateEmail,
          university: item.university,
          department: item.department,
          graduationYear: item.graduationYear,
          skills: item.skills,
          status: "saved",
          note: item.note
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to import candidate.");
        return;
      }
      setMessage(payload.message ?? "Candidate added to talent pool.");
      await Promise.all([reload(), reloadApplicants()]);
    } catch {
      setActionError("Unable to import candidate.");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Browse student talent based on skills and departments. Only students who have consented
        (e.g., by applying or opting in) will appear here; you cannot view unrelated profiles.
      </p>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {actionError ? <p className="text-sm text-rose-600 dark:text-rose-400">{actionError}</p> : null}
      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}

      <Card className={`${employerNavyCardClass} space-y-4 p-4`}>
        <h3 className="text-sm font-semibold">{editingId ? "Edit talent profile" : "Add talent profile"}</h3>
        <form className="space-y-3" onSubmit={submitProfile}>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" required />
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={status}
              onChange={(event) => setStatus(event.target.value as EmployerTalentProfile["status"])}
            >
              <option value="saved">Saved</option>
              <option value="contacted">Contacted</option>
              <option value="in-process">In process</option>
            </select>
            <Input value={university} onChange={(event) => setUniversity(event.target.value)} placeholder="University" />
            <Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" />
            <Input value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} placeholder="Graduation year" />
            <Input
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder="Skills (comma separated)"
            />
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value as "entry" | "intermediate" | "advanced")}
            >
              <option value="entry">Entry level</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <Input
              value={portfolioUrl}
              onChange={(event) => setPortfolioUrl(event.target.value)}
              placeholder="Portfolio or LinkedIn URL"
            />
          </div>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Notes"
          />
          <div className="flex justify-end gap-2">
            {editingId ? <Button type="button" onClick={clearForm}>Cancel</Button> : null}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update profile" : "Add profile"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Talent pool</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, skill, university"
              className="w-[220px]"
            />
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as EmployerTalentProfile["status"] | "all")
              }
            >
              <option value="all">All</option>
              <option value="saved">Saved</option>
              <option value="contacted">Contacted</option>
              <option value="in-process">In process</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading talent pool...</p>
        ) : !filteredProfiles.length ? (
          <p className="text-sm text-slate-500">No profiles match your filters.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredProfiles.map((item) => (
              <article key={item._id} className={`${employerNavySurfaceClass} space-y-2 rounded-xl p-3`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.fullName}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {item.university || "-"}
                  {item.department ? ` · ${item.department}` : ""}
                  {item.graduationYear ? ` · ${item.graduationYear}` : ""}
                </p>
                <p className="text-xs text-slate-500">Skills: {item.skills.join(", ") || "N/A"}</p>
                {item.note ? <p className="text-xs text-slate-500">Note: {item.note}</p> : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => updateTalentStatus(item._id, "contacted")}
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Contacted
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTalentStatus(item._id, "in-process")}
                    className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    In process
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-xs font-medium text-slate-700 hover:underline dark:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProfile(item._id)}
                    disabled={deletingId === item._id}
                    className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60 dark:text-rose-400"
                  >
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
        <h3 className="text-sm font-semibold">Import from shortlisted applicants</h3>
        {!shortlistedApplicants.length ? (
          <p className="text-sm text-slate-500">
            No shortlisted/interview applicants yet. Shortlist candidates in Applicants section first.
          </p>
        ) : (
          <div className="space-y-2">
            {shortlistedApplicants.map((item) => (
              <div
                key={item._id}
                className={`${employerNavySurfaceClass} flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm`}
              >
                <div>
                  <p className="font-medium">{item.candidateName}</p>
                  <p className="text-xs text-slate-500">
                    {item.candidateEmail} · {item.jobTitle || "General role"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={importingId === item._id}
                  onClick={() => importApplicant(item)}
                >
                  {importingId === item._id ? "Importing..." : "Add to talent pool"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmployerInterviewsSection() {
  const { jobs } = useEmployerJobs();
  const { applicants } = useEmployerApplicants();
  const { interviews, loading, error, reload } = useEmployerInterviews();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [applicantId, setApplicantId] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [mode, setMode] = useState<EmployerInterview["mode"]>("virtual");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [status, setStatus] = useState<EmployerInterview["status"]>("scheduled");
  const [instructions, setInstructions] = useState("");

  const clearForm = () => {
    setEditingId(null);
    setApplicantId("");
    setJobId("");
    setJobTitle("");
    setCandidateName("");
    setCandidateEmail("");
    setInterviewDate("");
    setInterviewTime("");
    setMode("virtual");
    setLocationOrLink("");
    setStatus("scheduled");
    setInstructions("");
  };

  const startEdit = (item: EmployerInterview) => {
    setEditingId(item._id);
    setApplicantId(item.applicantId ?? "");
    setJobId(item.jobId ?? "");
    setJobTitle(item.jobTitle ?? "");
    setCandidateName(item.candidateName ?? "");
    setCandidateEmail(item.candidateEmail ?? "");
    setInterviewDate(item.interviewDate ?? "");
    setInterviewTime(item.interviewTime ?? "");
    setMode(item.mode ?? "virtual");
    setLocationOrLink(item.locationOrLink ?? "");
    setStatus(item.status ?? "scheduled");
    setInstructions(item.instructions ?? "");
  };

  const onApplicantChange = (nextApplicantId: string) => {
    setApplicantId(nextApplicantId);
    if (!nextApplicantId) return;
    const selected = applicants.find((item) => item._id === nextApplicantId);
    if (!selected) return;
    setCandidateName(selected.candidateName ?? "");
    setCandidateEmail(selected.candidateEmail ?? "");
    setJobId(selected.jobId ?? "");
    setJobTitle(selected.jobTitle ?? "");
  };

  const onJobChange = (nextJobId: string) => {
    setJobId(nextJobId);
    const selected = jobs.find((item) => item._id === nextJobId);
    if (selected) setJobTitle(selected.title);
  };

  const submitInterview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setMessage(null);
    if (!candidateName.trim() || !interviewDate || !interviewTime) {
      setActionError("Candidate, date, and time are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/employer/interviews/${editingId}` : "/api/employer/interviews",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicantId: applicantId || undefined,
            candidateName: candidateName.trim(),
            candidateEmail: candidateEmail.trim() || undefined,
            jobId: jobId || undefined,
            jobTitle: jobTitle.trim() || undefined,
            interviewDate,
            interviewTime,
            mode,
            locationOrLink: locationOrLink.trim() || undefined,
            status,
            instructions: instructions.trim() || undefined
          })
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to save interview.");
        return;
      }
      setMessage(payload.message ?? (editingId ? "Interview updated." : "Interview scheduled."));
      clearForm();
      await reload();
    } catch {
      setActionError("Unable to save interview.");
    } finally {
      setSaving(false);
    }
  };

  const updateInterviewStatus = async (id: string, nextStatus: EmployerInterview["status"]) => {
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to update interview.");
        return;
      }
      setMessage(payload.message ?? "Interview updated.");
      await reload();
    } catch {
      setActionError("Unable to update interview.");
    }
  };

  const deleteInterview = async (id: string) => {
    if (!window.confirm("Delete this interview schedule?")) return;
    setDeletingId(id);
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/interviews/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to delete interview.");
        return;
      }
      if (editingId === id) clearForm();
      setMessage(payload.message ?? "Interview deleted.");
      await reload();
    } catch {
      setActionError("Unable to delete interview.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Plan and track interviews with students. This section focuses only on career-related
        interactions and does not show sensitive wellness or financial details.
      </p>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {actionError ? <p className="text-sm text-rose-600 dark:text-rose-400">{actionError}</p> : null}
      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}

      <Card className={`${employerNavyCardClass} space-y-4 p-4`}>
        <h3 className="text-sm font-semibold">{editingId ? "Edit interview" : "Interview scheduler"}</h3>
        <form className="space-y-3" onSubmit={submitInterview}>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={applicantId}
              onChange={(event) => onApplicantChange(event.target.value)}
            >
              <option value="">Select applicant (optional)</option>
              {applicants.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.candidateName} - {item.jobTitle || "General role"}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={jobId}
              onChange={(event) => onJobChange(event.target.value)}
            >
              <option value="">Select job (optional)</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
            <Input
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Role/job title"
            />
            <Input
              value={candidateName}
              onChange={(event) => setCandidateName(event.target.value)}
              placeholder="Candidate name"
              required
            />
            <Input
              type="email"
              value={candidateEmail}
              onChange={(event) => setCandidateEmail(event.target.value)}
              placeholder="Candidate email"
            />
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={mode}
              onChange={(event) => setMode(event.target.value as EmployerInterview["mode"])}
            >
              <option value="virtual">Virtual</option>
              <option value="on-site">On-site</option>
              <option value="phone">Phone</option>
            </select>
            <Input type="date" value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} required />
            <Input type="time" value={interviewTime} onChange={(event) => setInterviewTime(event.target.value)} required />
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={status}
              onChange={(event) => setStatus(event.target.value as EmployerInterview["status"])}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Input
            value={locationOrLink}
            onChange={(event) => setLocationOrLink(event.target.value)}
            placeholder="Meeting link or location"
          />
          <textarea
            className="min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Interview instructions"
          />
          <div className="flex justify-end gap-2">
            {editingId ? <Button type="button" onClick={clearForm}>Cancel</Button> : null}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update interview" : "Schedule interview"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
        <h3 className="text-sm font-semibold">Scheduled interviews</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading interviews...</p>
        ) : !interviews.length ? (
          <p className="text-sm text-slate-500">No interviews scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {interviews.map((item) => (
              <div
                key={item._id}
                className={`${employerNavySurfaceClass} flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.candidateName}</p>
                  <p className="text-xs text-slate-500">
                    {item.jobTitle || "General role"} · {item.interviewDate} {item.interviewTime}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.mode}
                    {item.locationOrLink ? ` · ${item.locationOrLink}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateInterviewStatus(item._id, "completed")}
                    className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => updateInterviewStatus(item._id, "cancelled")}
                    className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-xs font-medium text-slate-700 hover:underline dark:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteInterview(item._id)}
                    disabled={deletingId === item._id}
                    className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60 dark:text-rose-400"
                  >
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmployerCampusConnectSection() {
  const { events, loading, error, reload } = useEmployerCampusEvents();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EmployerCampusEvent["eventType"]>("career-fair");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState<EmployerCampusEvent["status"]>("planning");
  const [notes, setNotes] = useState("");

  const clearForm = () => {
    setEditingId(null);
    setTitle("");
    setEventType("career-fair");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setCapacity("");
    setStatus("planning");
    setNotes("");
  };

  const startEdit = (item: EmployerCampusEvent) => {
    setEditingId(item._id);
    setTitle(item.title ?? "");
    setEventType(item.eventType ?? "career-fair");
    setEventDate(item.eventDate ?? "");
    setStartTime(item.startTime ?? "");
    setEndTime(item.endTime ?? "");
    setLocation(item.location ?? "");
    setCapacity(item.capacity !== undefined ? String(item.capacity) : "");
    setStatus(item.status ?? "planning");
    setNotes(item.notes ?? "");
    setActionError(null);
    setMessage(null);
  };

  const submitEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setMessage(null);

    if (!title.trim() || !eventDate) {
      setActionError("Event title and date are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/employer/campus-connect/${editingId}` : "/api/employer/campus-connect",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            eventType,
            eventDate,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            location: location.trim() || undefined,
            capacity: capacity ? Number(capacity) : undefined,
            status,
            notes: notes.trim() || undefined
          })
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to save campus event.");
        return;
      }
      setMessage(payload.message ?? (editingId ? "Campus event updated." : "Campus event created."));
      clearForm();
      await reload();
    } catch {
      setActionError("Unable to save campus event.");
    } finally {
      setSaving(false);
    }
  };

  const updateEventStatus = async (id: string, nextStatus: EmployerCampusEvent["status"]) => {
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/campus-connect/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to update event status.");
        return;
      }
      setMessage(payload.message ?? "Campus event updated.");
      await reload();
    } catch {
      setActionError("Unable to update event status.");
    }
  };

  const deleteEvent = async (id: string) => {
    if (!window.confirm("Delete this campus event?")) return;
    setDeletingId(id);
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/campus-connect/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to delete campus event.");
        return;
      }
      if (editingId === id) clearForm();
      setMessage(payload.message ?? "Campus event deleted.");
      await reload();
    } catch {
      setActionError("Unable to delete campus event.");
    } finally {
      setDeletingId(null);
    }
  };

  const summary = useMemo(
    () =>
      events.reduce(
        (acc, item) => {
          acc.total += 1;
          if (item.status === "open") acc.open += 1;
          if (item.status === "completed") acc.completed += 1;
          acc.capacity += Number(item.capacity ?? 0);
          return acc;
        },
        { total: 0, open: 0, completed: 0, capacity: 0 }
      ),
    [events]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Coordinate with the university on career fairs and campus recruitment events. This space is
        focused on employer-student interactions only.
      </p>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {actionError ? <p className="text-sm text-rose-600 dark:text-rose-400">{actionError}</p> : null}
      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total events" value={String(summary.total)} description="All planned activities" className={employerNavyStatClass} />
        <StatCard label="Open registration" value={String(summary.open)} description="Accepting participants" className={employerNavyStatClass} />
        <StatCard label="Completed" value={String(summary.completed)} description="Closed activities" className={employerNavyStatClass} />
        <StatCard label="Total capacity" value={String(summary.capacity)} description="Planned seats" className={employerNavyStatClass} />
      </div>

      <Card className={`${employerNavyCardClass} space-y-4 p-4`}>
        <h3 className="text-sm font-semibold">{editingId ? "Edit campus event" : "Create campus event"}</h3>
        <form className="space-y-3" onSubmit={submitEvent}>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" required />
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={eventType}
              onChange={(event) => setEventType(event.target.value as EmployerCampusEvent["eventType"])}
            >
              <option value="career-fair">Career fair</option>
              <option value="workshop">Workshop</option>
              <option value="info-session">Info session</option>
              <option value="networking">Networking</option>
              <option value="other">Other</option>
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={status}
              onChange={(event) => setStatus(event.target.value as EmployerCampusEvent["status"])}
            >
              <option value="planning">Planning</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required />
            <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" />
            <Input
              type="number"
              min={0}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="Capacity"
            />
          </div>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Event notes, agenda, or coordination details"
          />
          <div className="flex justify-end gap-2">
            {editingId ? <Button type="button" onClick={clearForm}>Cancel</Button> : null}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update event" : "Create event"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
        <h3 className="text-sm font-semibold">Campus event log</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading campus events...</p>
        ) : !events.length ? (
          <p className="text-sm text-slate-500">No events yet. Create the first event above.</p>
        ) : (
          <div className="space-y-2">
            {events.map((item) => (
              <div
                key={item._id}
                className={`${employerNavySurfaceClass} flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.eventType} · {item.eventDate}
                    {item.startTime ? ` ${item.startTime}` : ""}
                    {item.endTime ? `-${item.endTime}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.location || "Location pending"}
                    {item.capacity !== undefined ? ` · Capacity ${item.capacity}` : ""}
                  </p>
                  {item.notes ? <p className="mt-1 text-xs text-slate-500">Notes: {item.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateEventStatus(item._id, "open")}
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => updateEventStatus(item._id, "completed")}
                    className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-xs font-medium text-slate-700 hover:underline dark:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEvent(item._id)}
                    disabled={deletingId === item._id}
                    className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60 dark:text-rose-400"
                  >
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmployerAnalyticsSection() {
  const { records, loading, error, reload } = useEmployerAnalyticsRecords();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [reportName, setReportName] = useState("");
  const [metricArea, setMetricArea] = useState<EmployerAnalyticsRecord["metricArea"]>("general");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [totalViews, setTotalViews] = useState("");
  const [totalApplications, setTotalApplications] = useState("");
  const [totalInterviews, setTotalInterviews] = useState("");
  const [totalOffers, setTotalOffers] = useState("");
  const [totalHires, setTotalHires] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [status, setStatus] = useState<EmployerAnalyticsRecord["status"]>("draft");
  const [note, setNote] = useState("");

  const summary = useMemo(() => {
    return records.reduce(
      (acc, item) => {
        acc.views += item.totalViews ?? 0;
        acc.applications += item.totalApplications ?? 0;
        acc.interviews += item.totalInterviews ?? 0;
        acc.hires += item.totalHires ?? 0;
        if (item.status === "published") acc.published += 1;
        return acc;
      },
      { views: 0, applications: 0, interviews: 0, hires: 0, published: 0 }
    );
  }, [records]);

  const averageConversion = useMemo(() => {
    if (!records.length) return 0;
    const total = records.reduce((sum, item) => sum + (item.conversionRate ?? 0), 0);
    return Number((total / records.length).toFixed(2));
  }, [records]);

  const clearForm = () => {
    setEditingId(null);
    setReportName("");
    setMetricArea("general");
    setPeriodStart("");
    setPeriodEnd("");
    setTotalViews("");
    setTotalApplications("");
    setTotalInterviews("");
    setTotalOffers("");
    setTotalHires("");
    setConversionRate("");
    setStatus("draft");
    setNote("");
  };

  const startEdit = (item: EmployerAnalyticsRecord) => {
    setEditingId(item._id);
    setReportName(item.reportName ?? "");
    setMetricArea(item.metricArea ?? "general");
    setPeriodStart(item.periodStart ?? "");
    setPeriodEnd(item.periodEnd ?? "");
    setTotalViews(String(item.totalViews ?? 0));
    setTotalApplications(String(item.totalApplications ?? 0));
    setTotalInterviews(String(item.totalInterviews ?? 0));
    setTotalOffers(String(item.totalOffers ?? 0));
    setTotalHires(String(item.totalHires ?? 0));
    setConversionRate(item.conversionRate !== undefined ? String(item.conversionRate) : "");
    setStatus(item.status ?? "draft");
    setNote(item.note ?? "");
    setActionError(null);
    setMessage(null);
  };

  const submitRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setMessage(null);

    if (!reportName.trim() || !periodStart || !periodEnd) {
      setActionError("Report name, period start, and period end are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/employer/analytics/${editingId}` : "/api/employer/analytics",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportName: reportName.trim(),
            metricArea,
            periodStart,
            periodEnd,
            totalViews: totalViews ? Number(totalViews) : 0,
            totalApplications: totalApplications ? Number(totalApplications) : 0,
            totalInterviews: totalInterviews ? Number(totalInterviews) : 0,
            totalOffers: totalOffers ? Number(totalOffers) : 0,
            totalHires: totalHires ? Number(totalHires) : 0,
            conversionRate: conversionRate ? Number(conversionRate) : undefined,
            status,
            note: note.trim() || undefined
          })
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to save analytics record.");
        return;
      }
      setMessage(payload.message ?? (editingId ? "Analytics record updated." : "Analytics record created."));
      clearForm();
      await reload();
    } catch {
      setActionError("Unable to save analytics record.");
    } finally {
      setSaving(false);
    }
  };

  const updateRecordStatus = async (id: string, nextStatus: EmployerAnalyticsRecord["status"]) => {
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/analytics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to update analytics status.");
        return;
      }
      setMessage(payload.message ?? "Analytics record updated.");
      await reload();
    } catch {
      setActionError("Unable to update analytics status.");
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm("Delete this analytics record?")) return;
    setDeletingId(id);
    setActionError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/employer/analytics/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to delete analytics record.");
        return;
      }
      if (editingId === id) clearForm();
      setMessage(payload.message ?? "Analytics record deleted.");
      await reload();
    } catch {
      setActionError("Unable to delete analytics record.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        High-level analytics to understand how students engage with your roles and how quickly
        hiring moves, without exposing individual student wellness or financial data.
      </p>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {actionError ? <p className="text-sm text-rose-600 dark:text-rose-400">{actionError}</p> : null}
      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total views"
          value={String(summary.views)}
          description="Across analytics snapshots"
          className={employerNavyStatClass}
        />
        <StatCard
          label="Total applications"
          value={String(summary.applications)}
          description="Tracked applications"
          className={employerNavyStatClass}
        />
        <StatCard
          label="Avg conversion %"
          value={String(averageConversion)}
          description={`${summary.published} published snapshots`}
          className={employerNavyStatClass}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total interviews"
          value={String(summary.interviews)}
          description="Interview pipeline volume"
          className={employerNavyStatClass}
        />
        <StatCard
          label="Total hires"
          value={String(summary.hires)}
          description="Recorded hires"
          className={employerNavyStatClass}
        />
      </div>

      <Card className={`${employerNavyCardClass} space-y-4 p-4`}>
        <h3 className="text-sm font-semibold">{editingId ? "Edit analytics snapshot" : "Create analytics snapshot"}</h3>
        <form className="space-y-3" onSubmit={submitRecord}>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={reportName}
              onChange={(event) => setReportName(event.target.value)}
              placeholder="Snapshot name"
              required
            />
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={metricArea}
              onChange={(event) => setMetricArea(event.target.value as EmployerAnalyticsRecord["metricArea"])}
            >
              <option value="general">General</option>
              <option value="applications">Applications</option>
              <option value="interviews">Interviews</option>
              <option value="hiring">Hiring</option>
              <option value="brand">Brand</option>
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={status}
              onChange={(event) => setStatus(event.target.value as EmployerAnalyticsRecord["status"])}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} required />
            <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} required />
            <Input type="number" min={0} value={totalViews} onChange={(event) => setTotalViews(event.target.value)} placeholder="Views" />
            <Input type="number" min={0} value={totalApplications} onChange={(event) => setTotalApplications(event.target.value)} placeholder="Applications" />
            <Input type="number" min={0} value={totalInterviews} onChange={(event) => setTotalInterviews(event.target.value)} placeholder="Interviews" />
            <Input type="number" min={0} value={totalOffers} onChange={(event) => setTotalOffers(event.target.value)} placeholder="Offers" />
            <Input type="number" min={0} value={totalHires} onChange={(event) => setTotalHires(event.target.value)} placeholder="Hires" />
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={conversionRate}
              onChange={(event) => setConversionRate(event.target.value)}
              placeholder="Conversion % (optional)"
            />
          </div>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Insights or commentary"
          />
          <div className="flex justify-end gap-2">
            {editingId ? <Button type="button" onClick={clearForm}>Cancel</Button> : null}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update snapshot" : "Create snapshot"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className={`${employerNavyCardClass} space-y-3 p-4`}>
        <h3 className="text-sm font-semibold">Analytics snapshots</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading analytics...</p>
        ) : !records.length ? (
          <p className="text-sm text-slate-500">No analytics snapshots yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {records.map((item) => (
              <div
                key={item._id}
                className={`${employerNavySurfaceClass} flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.reportName}</p>
                  <p className="text-xs text-slate-500">
                    {item.metricArea} · {item.periodStart} to {item.periodEnd}
                  </p>
                  <p className="text-xs text-slate-500">
                    Views {item.totalViews} · Apps {item.totalApplications} · Interviews {item.totalInterviews}
                    {" "}· Hires {item.totalHires} · Conv {item.conversionRate}%
                  </p>
                  {item.note ? <p className="mt-1 text-xs text-slate-500">Note: {item.note}</p> : null}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateRecordStatus(item._id, "published")}
                    className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRecordStatus(item._id, "archived")}
                    className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-xs font-medium text-slate-700 hover:underline dark:text-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRecord(item._id)}
                    disabled={deletingId === item._id}
                    className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60 dark:text-rose-400"
                  >
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmployerProfileSection() {
  const { user, refreshUser, updateUserProfile, requestPasswordReset } = useAuth();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.contact ?? "");
  const [companyName, setCompanyName] = useState(user?.roleDetails?.companyName ?? "");
  const [logoUrl, setLogoUrl] = useState(user?.roleDetails?.logoUrl ?? "");
  const [hiringPreferences, setHiringPreferences] = useState(user?.roleDetails?.hiringPreferences ?? "");
  const [teamAccess, setTeamAccess] = useState(user?.roleDetails?.teamAccess ?? "Single recruiter");

  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [employerSaving, setEmployerSaving] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferences, setPreferences] = useState<ProfilePreferences>(defaultPreferences);

  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setContact(user.contact ?? "");
    setCompanyName(user.roleDetails?.companyName ?? "");
    setLogoUrl(user.roleDetails?.logoUrl ?? "");
    setHiringPreferences(user.roleDetails?.hiringPreferences ?? "");
    setTeamAccess(user.roleDetails?.teamAccess ?? "Single recruiter");
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    async function loadPreferences() {
      setPreferencesLoading(true);
      try {
        const response = await fetch("/api/profile/preferences", { cache: "no-store" });
        const payload = (await response.json()) as Partial<ProfilePreferences>;
        if (!cancelled && response.ok) {
          setPreferences(mergePreferences(payload));
        }
      } catch {
        if (!cancelled) setPreferences(mergePreferences(null));
      } finally {
        if (!cancelled) setPreferencesLoading(false);
      }
    }

    async function loadDeleteRequestStatus() {
      try {
        const response = await fetch("/api/profile/delete-request", { cache: "no-store" });
        const payload = (await response.json()) as {
          pending?: boolean;
          request?: { status?: "pending" | "approved" | "rejected" } | null;
        };
        if (!cancelled && response.ok) {
          const isPending = Boolean(payload.pending || payload.request?.status === "pending");
          setDeletePending(isPending);
        }
      } catch {
        if (!cancelled) setDeletePending(false);
      }
    }

    void loadPreferences();
    void loadDeleteRequestStatus();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const savePersonal = async () => {
    if (!user?.email) return;
    setMessage(null);
    setPersonalSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
          email: user.email,
          name: name.trim() || user.name,
          contact: contact.trim() || undefined
        })
      });
      const payload = (await response.json()) as { user?: { name?: string; contact?: string }; message?: string };
      if (response.ok && payload.user) {
        updateUserProfile({ name: payload.user.name, contact: payload.user.contact });
        await refreshUser();
        setMessage({ type: "ok", text: "Personal details updated." });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setPersonalSaving(false);
    }
  };

  const saveEmployerProfile = async () => {
    if (!user?.email) return;
    setMessage(null);
    setEmployerSaving(true);

    const currentRoleDetails = { ...(user.roleDetails ?? {}) };
    const nextCompany = companyName.trim();
    const nextLogo = logoUrl.trim();
    const nextHiring = hiringPreferences.trim();

    if (nextCompany) {
      currentRoleDetails.companyName = nextCompany;
    } else {
      delete currentRoleDetails.companyName;
    }
    if (nextLogo) {
      currentRoleDetails.logoUrl = nextLogo;
    } else {
      delete currentRoleDetails.logoUrl;
    }
    if (nextHiring) {
      currentRoleDetails.hiringPreferences = nextHiring;
    } else {
      delete currentRoleDetails.hiringPreferences;
    }
    if (teamAccess) {
      currentRoleDetails.teamAccess = teamAccess;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
          email: user.email,
          name: user.name,
          roleDetails: currentRoleDetails
        })
      });
      const payload = (await response.json()) as {
        user?: { roleDetails?: Record<string, string> };
        message?: string;
      };
      if (response.ok && payload.user) {
        updateUserProfile({ roleDetails: payload.user.roleDetails });
        await refreshUser();
        setMessage({ type: "ok", text: "Employer profile updated." });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setEmployerSaving(false);
    }
  };

  const savePreferences = async (successText: string) => {
    setMessage(null);
    setPreferencesSaving(true);
    try {
      const response = await fetch("/api/profile/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacy: preferences.privacy,
          notifications: preferences.notifications
        })
      });
      const payload = (await response.json()) as { message?: string; preferences?: Partial<ProfilePreferences> };
      if (response.ok) {
        if (payload.preferences) {
          setPreferences(mergePreferences(payload.preferences));
        }
        setMessage({ type: "ok", text: successText });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save preferences." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save preferences. Try again." });
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setProfilePicUploading(true);
      setMessage(null);
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
            email: user.email,
            profilePic: dataUrl
          })
        });
        const payload = (await response.json()) as { user?: { profilePic?: string }; message?: string };
        if (response.ok && payload.user) {
          updateUserProfile({ profilePic: payload.user.profilePic });
          await refreshUser();
          setMessage({ type: "ok", text: "Profile picture updated." });
        } else {
          setMessage({ type: "err", text: payload.message ?? "Could not update picture." });
        }
      } catch {
        setMessage({ type: "err", text: "Could not update picture. Try again." });
      } finally {
        setProfilePicUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setSecurityMessage(null);
    try {
      await requestPasswordReset(user.email);
      setSecurityMessage({ type: "ok", text: "Password reset link sent to your email." });
    } catch {
      setSecurityMessage({ type: "err", text: "Could not send reset email. Try again." });
    }
  };

  const handleSubmitDeleteRequest = async () => {
    if (!window.confirm("Submit account deletion request for admin review?")) {
      return;
    }

    setSecurityMessage(null);
    setDeleteSubmitting(true);
    try {
      const response = await fetch("/api/profile/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: deleteReason.trim() || undefined
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (response.ok || response.status === 409) {
        setDeletePending(true);
        setSecurityMessage({
          type: "ok",
          text: payload.message ?? "Deletion request submitted for admin review."
        });
      } else {
        setSecurityMessage({
          type: "err",
          text: payload.message ?? "Could not submit deletion request. Try again."
        });
      }
    } catch {
      setSecurityMessage({ type: "err", text: "Could not submit deletion request. Try again." });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "settings", label: "Preferences" },
    { id: "security", label: "Security" }
  ];

  const initials =
    (user?.name ?? user?.email ?? "U")
      .split(/\s+/)
      .map((segment) => segment[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`rounded-xl border px-4 py-2 text-sm ${
            message.type === "ok"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {securityMessage && (
        <p
          className={`rounded-xl border px-4 py-2 text-sm ${
            securityMessage.type === "ok"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {securityMessage.text}
        </p>
      )}

      <Card className={`${employerNavyCardClass} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-slate-100 dark:border-primary/60 dark:bg-slate-800">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary">{initials}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Employer profile</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name ?? "Your name"}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePicChange}
              disabled={profilePicUploading}
            />
            {profilePicUploading ? "Uploading..." : "Change picture"}
          </label>
        </div>
      </Card>

      <Card className={`${employerNavyCardClass} p-4`}>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Keep your company profile current for students and university admins.
        </p>
      </Card>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Profile sections">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className={`${employerNavyCardClass} space-y-4 p-5`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <Input type="email" defaultValue={user?.email ?? ""} placeholder="Email" disabled />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact</label>
                  <Input
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <Button variant="primary" onClick={savePersonal} disabled={personalSaving}>
                {personalSaving ? "Saving..." : "Save changes"}
              </Button>
            </Card>

            <Card className={`${employerNavyCardClass} space-y-4 p-5`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Company profile</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Details students see when they review your job listings.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company name</label>
                  <Input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Your company"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Logo URL</label>
                  <Input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hiring preferences</label>
                  <Input
                    value={hiringPreferences}
                    onChange={(event) => setHiringPreferences(event.target.value)}
                    placeholder="Departments, skill areas, locations"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Team access</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={teamAccess}
                    onChange={(event) => setTeamAccess(event.target.value)}
                  >
                    <option>Single recruiter</option>
                    <option>Recruiter + hiring managers</option>
                    <option>Full team management</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" onClick={saveEmployerProfile} disabled={employerSaving}>
                {employerSaving ? "Saving..." : "Update company profile"}
              </Button>
            </Card>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className={`${employerNavyCardClass} space-y-4 p-5`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy preferences</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Control what is shared with university career services.
              </p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.privacy.shareCareerInterestsWithMentors}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        privacy: {
                          ...current.privacy,
                          shareCareerInterestsWithMentors: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Share hiring preferences with student mentors
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.privacy.shareFinancialAidWithAdmins}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        privacy: {
                          ...current.privacy,
                          shareFinancialAidWithAdmins: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Share recruiting activity with university admins
                </label>
              </div>
              <Button
                variant="secondary"
                onClick={() => savePreferences("Privacy settings saved.")}
                disabled={preferencesLoading || preferencesSaving}
              >
                {preferencesSaving ? "Saving..." : "Save privacy settings"}
              </Button>
            </Card>

            <Card className={`${employerNavyCardClass} space-y-4 p-5`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification settings</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Choose how you receive updates about applicants and approvals.
              </p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.notifications.emailApplicationStatus}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        notifications: {
                          ...current.notifications,
                          emailApplicationStatus: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Email for application status changes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.notifications.mentorshipSessionReminders}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        notifications: {
                          ...current.notifications,
                          mentorshipSessionReminders: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Reminders for interview schedules
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.notifications.weeklyWellnessReminder}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        notifications: {
                          ...current.notifications,
                          weeklyWellnessReminder: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Weekly recruiting digest reminder
                </label>
              </div>
              <Button
                variant="secondary"
                onClick={() => savePreferences("Notification settings saved.")}
                disabled={preferencesLoading || preferencesSaving}
              >
                {preferencesSaving ? "Saving..." : "Save notification settings"}
              </Button>
              {preferences.updatedAt ? (
                <p className="text-xs text-slate-500">Last updated: {new Date(preferences.updatedAt).toLocaleString()}</p>
              ) : null}
            </Card>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            key="security"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className={`${employerNavyCardClass} space-y-3 p-5`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Password and sign-in</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Send yourself a secure link to reset your password.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Input type="email" value={user?.email ?? ""} disabled className="max-w-xs" />
                <Button variant="secondary" onClick={handleSendResetEmail} disabled={!user?.email}>
                  Send reset link
                </Button>
              </div>
            </Card>

            <Card className={`${employerNavyCardClass} space-y-3 border-red-200 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/40`}>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Delete account request</h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Submit a request and the university admin team will review it.
              </p>
              <textarea
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Optional reason for deletion request"
                className="min-h-[90px] w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-red-300 dark:border-red-700 dark:bg-slate-900 dark:text-slate-100"
                disabled={deletePending || deleteSubmitting}
              />
              <Button
                variant="secondary"
                className="border-red-400 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/40"
                onClick={handleSubmitDeleteRequest}
                disabled={deletePending || deleteSubmitting}
              >
                {deletePending ? "Deletion request pending" : deleteSubmitting ? "Submitting..." : "Request account deletion"}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



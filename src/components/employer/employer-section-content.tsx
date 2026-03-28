"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { useAuth } from "@/context/auth-context";
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

      <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/20 bg-gradient-to-r from-primary/5 via-white to-emerald-50 p-5 dark:from-primary/10 dark:via-slate-900 dark:to-emerald-900/20">
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

      <Card className="border-primary/20 bg-primary/5 p-4">
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
            <Card className="space-y-4 p-5">
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

            <Card className="space-y-4 p-5">
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
            <Card className="space-y-4 p-5">
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

            <Card className="space-y-4 p-5">
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
            <Card className="space-y-3 p-5">
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

            <Card className="space-y-3 border-red-200 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/40">
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



"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useAuth } from "@/context/auth-context";
import {
  defaultPreferences,
  mergePreferences,
  tabVariants,
  type ProfilePreferences,
  type ProfileTab
} from "@/components/profile/profile-preferences";

type Scholarship = {
  _id?: string;
  provider?: string;
  title?: string;
  amount?: string | number;
  status?: "active" | "closed" | string;
  deadline?: string;
  eligibilityCriteria?: string;
  applicationLink?: string;
  tags?: string[];
  editable?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type DonorContribution = {
  _id?: string;
  contributionType?: "emergency_fund" | "equipment" | "scholarship" | "general" | "ngo_program";
  program?: string;
  category?: string;
  amountLkr?: number;
  note?: string;
  receiptNumber?: string;
  createdAt?: string;
};

type DonorOverview = {
  summary: {
    activeScholarships: number;
    totalScholarships: number;
    emergencyAidCases: number;
    upcomingDeadlines: number;
    totalContributedLkr: number;
  };
  recentDonations: Array<{
    id: string;
    program: string;
    category: string;
    amountLkr: number;
    receiptNumber?: string;
    date: string;
  }>;
  thankYouMessages: Array<{
    id: string;
    from: string;
    message: string;
    program: string;
    date: string;
  }>;
};

type DonorFundedStudentsOverview = {
  summary: {
    fundedStudents: number;
    consentedProfiles: number;
    anonymizedProfiles: number;
    totalFundedLkr: number;
    avgProgressScore: number;
    activeSupportCases: number;
  };
  students: Array<{
    id: string;
    displayName: string;
    canViewIdentity: boolean;
    university?: string;
    program?: string;
    year?: string;
    totalFundedLkr: number;
    supportCategories: string[];
    progressScore: number;
    progressLabel: string;
    latestStatus: string;
    lastUpdated: string;
    recentMilestone: string;
  }>;
  updates: Array<{
    id: string;
    title: string;
    detail: string;
    date: string;
    editable?: boolean;
  }>;
};

type DonorImpactReport = {
  generatedAt: string;
  rangeDays: number;
  summary: {
    totalContributedLkr: number;
    activeScholarships: number;
    totalScholarships: number;
    aidApprovedLkr: number;
    approvedAidRequests: number;
    fundedStudents: number;
    avgSupportPerStudent: number;
  };
  distribution: Array<{
    label: string;
    amountLkr: number;
    count: number;
  }>;
  highlights: Array<{
    id: string;
    title: string;
    detail: string;
  }>;
};

type DonorRecognitionOverview = {
  metrics: {
    featuredStories: number;
    studentTestimonials: number;
    anonymizedHighlights: number;
    engagementRate: number;
  };
  stories: Array<{
    id: string;
    title: string;
    summary: string;
    category: string;
    date: string;
  }>;
};

type DonorCommunication = {
  _id?: string;
  audience?: string;
  messageType?: string;
  subject?: string;
  body?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DonorProfile = {
  organizationName: string;
  logoUrl: string;
  focusAreas: string;
  teamAccess: string;
  contactEmail: string;
  websiteUrl: string;
};

type DonorSectionContentProps = {
  sectionId: string;
};

export function DonorSectionContent({ sectionId }: DonorSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "partner-home":
        return DonorPartnerHomeSection;
      case "my-scholarships":
        return DonorMyScholarshipsSection;
      case "funded-students":
        return DonorFundedStudentsSection;
      case "donations":
        return DonorDonationsSection;
      case "impact-reports":
        return DonorImpactReportsSection;
      case "recognition":
        return DonorRecognitionSection;
      case "communications":
        return DonorCommunicationsSection;
      case "profile":
        return DonorProfileSection;
      default:
        return DonorPartnerHomeSection;
    }
  }, [sectionId]);

  return <Section />;
}

function useScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScholarships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/scholarships");
      const payload = (await response.json().catch(() => [])) as Scholarship[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load scholarships.");
        setScholarships([]);
        return;
      }
      setScholarships(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load scholarships.");
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScholarships();
  }, [loadScholarships]);

  return { scholarships, loading, error, reload: loadScholarships };
}

function useDonorContributions() {
  const [contributions, setContributions] = useState<DonorContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContributions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/contributions");
      const payload = (await response.json().catch(() => [])) as DonorContribution[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load contributions.");
        setContributions([]);
        return;
      }
      setContributions(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load contributions.");
      setContributions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContributions();
  }, [loadContributions]);

  return { contributions, loading, error, reload: loadContributions };
}

function DonorPartnerHomeSection() {
  const [overview, setOverview] = useState<DonorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState<
    "emergency_fund" | "equipment" | "scholarship" | "general" | "ngo_program"
  >("emergency_fund");
  const [program, setProgram] = useState("Emergency Support Fund");
  const [amountLkr, setAmountLkr] = useState("");
  const [note, setNote] = useState("");
  const [loggingContribution, setLoggingContribution] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/overview");
      const payload = (await response.json().catch(() => ({}))) as DonorOverview & { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to load donor overview.");
        setOverview(null);
        return;
      }
      setOverview(payload);
    } catch {
      setError("Unable to load donor overview.");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const logContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoggingContribution(true);
    try {
      const response = await fetch("/api/donor/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionType,
          program: program.trim(),
          amountLkr: amountLkr.trim(),
          note: note.trim() || undefined
        })
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to log contribution.");
        return;
      }

      setAmountLkr("");
      setNote("");
      await loadOverview();
    } catch {
      setError("Unable to log contribution.");
    } finally {
      setLoggingContribution(false);
    }
  };

  const summary = overview?.summary;
  const recentDonations = overview?.recentDonations ?? [];
  const thankYouMessages = overview?.thankYouMessages ?? [];
  const summaryCards = [
    {
      label: "Active scholarships",
      value: loading ? "..." : String(summary?.activeScholarships ?? 0),
      description: "Currently accepting applications"
    },
    {
      label: "Scholarships created",
      value: loading ? "..." : String(summary?.totalScholarships ?? 0),
      description: "Across all donor programs"
    },
    {
      label: "Emergency aid cases",
      value: loading ? "..." : String(summary?.emergencyAidCases ?? 0),
      description: "Approved support cases"
    },
    {
      label: "Total contributed",
      value: loading ? "..." : `LKR ${summary?.totalContributedLkr ?? 0}`,
      description: loading ? "Loading..." : `${summary?.upcomingDeadlines ?? 0} upcoming deadlines`
    }
  ];

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50">
                  Partner home
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Manage donor impact with a clearer, more action-friendly dashboard
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50/90">
                    Review scholarship activity, log contributions faster, and keep recent donor engagement updates in one polished workspace.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Recent donations</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : recentDonations.length}</p>
                  <p className="text-xs text-sky-50/80">Tracked contributions</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Thank you notes</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : thankYouMessages.length}</p>
                  <p className="text-xs text-sky-50/80">Recent student appreciation</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            description={item.description}
          />
        ))}
      </div>

      <Card className="space-y-5 border-slate-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Log new contribution</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Record a new donation with clear fields so your partner activity stays organized and easy to review.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">Quick action</p>
            <p>Add a contribution in a few steps</p>
          </div>
        </div>
        <form className="space-y-4" onSubmit={logContribution}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Contribution type</span>
              <select
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
                value={contributionType}
                onChange={(event) =>
                  setContributionType(
                    event.target.value as "emergency_fund" | "equipment" | "scholarship" | "general" | "ngo_program"
                  )
                }
              >
                <option value="emergency_fund">Emergency fund</option>
                <option value="equipment">Equipment</option>
                <option value="scholarship">Scholarship</option>
                <option value="ngo_program">NGO Program</option>
                <option value="general">General</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Program / campaign</span>
              <Input
                value={program}
                onChange={(event) => setProgram(event.target.value)}
                placeholder="Campaign name"
                required
                className="min-h-11 border-slate-200 bg-white/90 dark:bg-slate-950"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Amount (LKR)</span>
              <Input
                value={amountLkr}
                onChange={(event) => setAmountLkr(event.target.value)}
                placeholder="50000"
                required
                className="min-h-11 border-slate-200 bg-white/90 dark:bg-slate-950"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Note (optional)</span>
            <textarea
              className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Any note for internal tracking..."
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-w-[120px]"
              onClick={() => {
                setContributionType("emergency_fund");
                setProgram("Emergency Support Fund");
                setAmountLkr("");
                setNote("");
                setError(null);
              }}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={loggingContribution}
              className="min-w-[180px] bg-primary text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingContribution ? "Logging..." : "Log contribution"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent donations</h3>
            <p className="text-sm text-slate-500">A quick view of your latest recorded donor contributions.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {loading ? "..." : `${recentDonations.length} items`}
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading recent donations...</p>
        ) : !recentDonations.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No donations logged yet.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recentDonations.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.program}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      {item.category}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                    LKR {item.amountLkr}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {new Date(item.date).toLocaleDateString()}
                  {item.receiptNumber ? ` | Receipt: ${item.receiptNumber}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent thank you messages</h3>
            <p className="text-sm text-slate-500">Student appreciation and support feedback shared with donors.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {loading ? "..." : `${thankYouMessages.length} messages`}
          </span>
        </div>
        <div className="space-y-3 text-sm">
          {thankYouMessages.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t.program}
              </p>
              <p className="mt-2 text-slate-800 dark:text-slate-100">{t.message}</p>
              <p className="mt-3 text-xs text-slate-500">
                From: {t.from} | {new Date(t.date).toLocaleDateString()}
              </p>
            </div>
          ))}
          {!thankYouMessages.length && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
              No messages yet. As students receive aid, anonymized thank you notes will appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function DonorMyScholarshipsSection() {
  const { scholarships, loading, error, reload } = useScholarships();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [eligibilityCriteria, setEligibilityCriteria] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeCount = scholarships.filter(
    (item) => String(item.status ?? "").toLowerCase() !== "closed"
  ).length;
  const closedCount = scholarships.length - activeCount;
  const clearScholarshipForm = () => {
    setTitle("");
    setAmount("");
    setDeadline("");
    setEligibilityCriteria("");
    setApplicationLink("");
    setTags("");
    setActionError(null);
  };

  const createScholarship = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/donor/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: amount.trim(),
          deadline,
          eligibilityCriteria: eligibilityCriteria.trim(),
          applicationLink: applicationLink.trim(),
          tags: tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to create scholarship.");
        return;
      }

      setTitle("");
      setAmount("");
      setDeadline("");
      setEligibilityCriteria("");
      setApplicationLink("");
      setTags("");
      setShowCreateForm(false);
      await reload();
    } catch {
      setActionError("Unable to create scholarship.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (scholarshipId: string, status: "active" | "closed") => {
    setUpdatingId(scholarshipId);
    setActionError(null);
    try {
      const response = await fetch(`/api/donor/scholarships/${scholarshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to update scholarship.");
        return;
      }
      await reload();
    } catch {
      setActionError("Unable to update scholarship.");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteScholarship = async (scholarshipId: string) => {
    if (!window.confirm("Delete this scholarship?")) return;
    setDeletingId(scholarshipId);
    setActionError(null);
    try {
      const response = await fetch(`/api/donor/scholarships/${scholarshipId}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to delete scholarship.");
        return;
      }
      await reload();
    } catch {
      setActionError("Unable to delete scholarship.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50">
                  My scholarships
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Create and manage scholarship programs with a clearer donor workflow
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50/90">
                    Publish new opportunities, monitor active and closed listings, and keep every scholarship update in one easy-to-use blue-themed dashboard.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Total listings</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : scholarships.length}</p>
                  <p className="text-xs text-sky-50/80">Programs you manage</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Open for students</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : activeCount}</p>
                  <p className="text-xs text-sky-50/80">Visible scholarship opportunities</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total scholarships"
          value={loading ? "..." : String(scholarships.length)}
          description="Programs you created"
        />
        <StatCard
          label="Active"
          value={loading ? "..." : String(activeCount)}
          description="Visible to students"
        />
        <StatCard
          label="Closed"
          value={loading ? "..." : String(closedCount)}
          description="Not accepting new applications"
        />
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Manage the scholarships you sponsor. Students apply here, and university admins verify
        eligibility before final selection.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          {actionError}
        </p>
      ) : null}
      <Card className="space-y-5 border-slate-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Scholarship listings</h3>
            <p className="text-sm text-slate-500">
              Create new scholarship opportunities and manage the current status of each listing.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowCreateForm((prev) => !prev);
              if (showCreateForm) clearScholarshipForm();
            }}
            className="min-w-[170px] bg-primary text-white shadow-sm hover:bg-blue-700"
          >
            {showCreateForm ? "Cancel" : "Create scholarship"}
          </Button>
        </div>
        {showCreateForm ? (
          <form
            className="space-y-4 rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            onSubmit={createScholarship}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>Scholarship title</span>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="STEM Equity Scholarship"
                  required
                  className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>Amount</span>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="LKR 100000"
                  required
                  className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>Application deadline</span>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  required
                  className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>Tags (comma separated)</span>
                <Input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="need-based, undergraduate"
                  className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Eligibility criteria</span>
              <textarea
                className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={eligibilityCriteria}
                onChange={(event) => setEligibilityCriteria(event.target.value)}
                placeholder="Who can apply for this scholarship"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Application link (optional)</span>
              <Input
                value={applicationLink}
                onChange={(event) => setApplicationLink(event.target.value)}
                placeholder="https://..."
                className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
              />
            </label>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-w-[120px]"
                onClick={clearScholarshipForm}
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="min-w-[190px] bg-primary text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Publishing..." : "Publish scholarship"}
              </Button>
            </div>
          </form>
        ) : null}
        <div className="space-y-3 text-sm">
          {loading ? (
            <p className="py-3 text-sm text-slate-500">Loading scholarships...</p>
          ) : null}
          {scholarships.map((s) => (
            <div
              key={s._id ?? s.title}
              className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{s.title ?? "Scholarship"}</p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                      {String(s.status ?? "active").toLowerCase() === "closed" ? "Closed" : "Active"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Amount: {s.amount ?? "N/A"}
                    {s.deadline ? ` | Deadline: ${s.deadline}` : ""}
                  </p>
                  {s.eligibilityCriteria ? (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {s.eligibilityCriteria}
                    </p>
                  ) : null}
                  {s.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.tags.map((tag) => (
                        <span
                          key={`${s._id ?? s.title}-${tag}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {s.applicationLink ? (
                    <p className="mt-3 text-xs text-slate-500">Application link: {s.applicationLink}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {s._id ? (
                    <>
                      {String(s.status ?? "").toLowerCase() === "closed" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => updateStatus(s._id as string, "active")}
                          disabled={updatingId === s._id}
                          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {updatingId === s._id ? "Updating..." : "Reopen"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => updateStatus(s._id as string, "closed")}
                          disabled={updatingId === s._id}
                          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {updatingId === s._id ? "Updating..." : "Close"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteScholarship(s._id as string)}
                        disabled={deletingId === s._id}
                        className="rounded-full border border-rose-200 px-4 py-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
                      >
                        {deletingId === s._id ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {!loading && !scholarships.length && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
              No scholarships found yet. Use &quot;Create scholarship&quot; to add your first
              program.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
function DonorFundedStudentsSection() {
  const [overview, setOverview] = useState<DonorFundedStudentsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDetail, setUpdateDetail] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [updatingUpdate, setUpdatingUpdate] = useState(false);
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);

  const loadFundedStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/funded-students");
      const payload = (await response.json().catch(() => ({}))) as DonorFundedStudentsOverview & {
        message?: string;
      };
      if (!response.ok) {
        setError(payload.message ?? "Unable to load funded students.");
        setOverview(null);
        return;
      }
      setOverview(payload);
    } catch {
      setError("Unable to load funded students.");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFundedStudents();
  }, [loadFundedStudents]);

  const summary = overview?.summary;
  const students = overview?.students ?? [];
  const updates = overview?.updates ?? [];
  const clearUpdateForm = () => {
    setEditingUpdateId(null);
    setUpdateTitle("");
    setUpdateDetail("");
    setError(null);
  };

  const createUpdate = async () => {
    if (!updateTitle.trim() || !updateDetail.trim()) {
      setError("Update title and detail are required.");
      return;
    }
    setSavingUpdate(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/funded-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updateTitle.trim(),
          detail: updateDetail.trim()
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to add update.");
        return;
      }
      setUpdateTitle("");
      setUpdateDetail("");
      await loadFundedStudents();
    } catch {
      setError("Unable to add update.");
    } finally {
      setSavingUpdate(false);
    }
  };

  const saveEditedUpdate = async (id: string) => {
    if (!updateTitle.trim() || !updateDetail.trim()) {
      setError("Update title and detail are required.");
      return;
    }
    setUpdatingUpdate(true);
    setError(null);
    try {
      const response = await fetch(`/api/donor/funded-students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updateTitle.trim(),
          detail: updateDetail.trim()
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to update item.");
        return;
      }
      setEditingUpdateId(null);
      setUpdateTitle("");
      setUpdateDetail("");
      await loadFundedStudents();
    } catch {
      setError("Unable to update item.");
    } finally {
      setUpdatingUpdate(false);
    }
  };

  const deleteUpdate = async (id: string) => {
    if (!window.confirm("Delete this update?")) return;
    setDeletingUpdateId(id);
    setError(null);
    try {
      const response = await fetch(`/api/donor/funded-students/${id}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to delete item.");
        return;
      }
      await loadFundedStudents();
    } catch {
      setError("Unable to delete item.");
    } finally {
      setDeletingUpdateId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50">
                  Funded students
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Track funded student progress in a clearer donor view
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50/90">
                    Review support coverage, student progress signals, and recent donor-facing updates from one easy-to-scan dashboard section.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Students tracked</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : students.length}</p>
                  <p className="text-xs text-sky-50/80">Supported student profiles</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Recent updates</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : updates.length}</p>
                  <p className="text-xs text-sky-50/80">Shared donor progress notes</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Funded students",
            value: loading ? "..." : String(summary?.fundedStudents ?? 0),
            description: "Students with approved support",
            accent: "from-sky-500 to-blue-600"
          },
          {
            label: "Consented profiles",
            value: loading ? "..." : String(summary?.consentedProfiles ?? 0),
            description: "Identity shared with consent",
            accent: "from-cyan-500 to-sky-600"
          },
          {
            label: "Total funded (LKR)",
            value: loading ? "..." : String(summary?.totalFundedLkr ?? 0),
            description: "Approved support total",
            accent: "from-blue-600 to-indigo-600"
          },
          {
            label: "Average progress",
            value: loading ? "..." : `${summary?.avgProgressScore ?? 0}%`,
            description: "Aggregate progress signal",
            accent: "from-sky-600 to-cyan-600"
          }
        ].map((item) => (
          <div
            key={item.label}
            className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-md transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${item.accent}`} />
            <div className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.label}
              </p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
              <p className="text-sm text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        View funded students and progress updates. Identity details are shown only when explicit
        consent is available.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Current scholars</h3>
            <p className="text-sm text-slate-500">Monitor progress, support types, and recent milestones for funded students.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {loading ? "..." : `${students.length} profiles`}
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading funded students...</p>
        ) : !students.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No funded student records yet. Once approved aid cases exist, they will appear here.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{student.displayName}</p>
                    <p className="text-xs text-slate-500">
                      {student.university || "University details hidden"}
                      {student.program ? ` | ${student.program}` : ""}
                      {student.year ? ` | ${student.year}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                    {student.latestStatus}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Support: {student.supportCategories.join(", ")}
                  </p>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                    LKR {student.totalFundedLkr}
                  </span>
                </div>
                <div className="mt-5 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Progress overview
                    </p>
                    <p className="text-sm font-semibold text-primary dark:text-blue-200">
                      {student.progressScore}%
                    </p>
                  </div>
                  <div className="mt-3 h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-500 shadow-[0_0_18px_rgba(37,99,235,0.35)]"
                      style={{ width: `${Math.min(100, Math.max(0, student.progressScore))}%` }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Progress: {student.progressLabel} ({student.progressScore}%)
                </p>
                <p className="mt-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                  {student.recentMilestone}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Last update: {new Date(student.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-5 border-slate-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingUpdateId ? "Edit update" : "Add update"}
            </h3>
            <p className="text-sm text-slate-500">
              Share donor-facing progress notes so the funded student journey stays transparent and easy to follow.
            </p>
          </div>
          <span className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            {editingUpdateId ? "Editing selected update" : "Create a new update"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Update title</span>
            <Input
              value={updateTitle}
              onChange={(event) => setUpdateTitle(event.target.value)}
              placeholder="Update title"
              className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Update detail</span>
            <Input
              value={updateDetail}
              onChange={(event) => setUpdateDetail(event.target.value)}
              placeholder="Update detail"
              className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
            />
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {editingUpdateId ? (
            <>
              <Button
                variant="secondary"
                className="min-w-[120px]"
                onClick={clearUpdateForm}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="min-w-[170px] bg-primary text-white shadow-sm hover:bg-blue-700"
                onClick={() => saveEditedUpdate(editingUpdateId)}
                disabled={updatingUpdate}
              >
                {updatingUpdate ? "Saving..." : "Save changes"}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              className="min-w-[170px] bg-primary text-white shadow-sm hover:bg-blue-700"
              onClick={createUpdate}
              disabled={savingUpdate}
            >
              {savingUpdate ? "Adding..." : "Add update"}
            </Button>
          )}
        </div>
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent updates</h3>
            <p className="text-sm text-slate-500">Keep donor communication records organized and easy to manage.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {loading ? "..." : `${updates.length} updates`}
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading updates...</p>
        ) : !updates.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No updates available yet.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {updates.map((update) => (
              <div
                key={update.id}
                className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{update.title}</p>
                <p className="mt-2 text-sm text-slate-500">{update.detail}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="mt-3 text-xs text-slate-400">{new Date(update.date).toLocaleDateString()}</p>
                  {update.editable ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEditingUpdateId(update.id);
                          setUpdateTitle(update.title);
                          setUpdateDetail(update.detail);
                        }}
                        className="border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900/40"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteUpdate(update.id)}
                        disabled={deletingUpdateId === update.id}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/30"
                      >
                        {deletingUpdateId === update.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
function DonorDonationsSection() {
  const { contributions, loading, error, reload } = useDonorContributions();
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [editingContribution, setEditingContribution] = useState({
    contributionType: "general",
    program: "",
    category: "",
    amountLkr: "",
    note: ""
  });
  const [savingContribution, setSavingContribution] = useState(false);
  const [deletingContributionId, setDeletingContributionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const clearEditingContribution = () => {
    setEditingContributionId(null);
    setEditingContribution({
      contributionType: "general",
      program: "",
      category: "",
      amountLkr: "",
      note: ""
    });
    setActionError(null);
  };

  const totals = contributions.reduce(
    (acc, item) => {
      const amount = Number(item.amountLkr ?? 0);
      const type = String(item.contributionType ?? "general").toLowerCase();
      acc.total += amount;
      if (type === "emergency_fund") acc.emergency += amount;
      else if (type === "equipment") acc.equipment += amount;
      else if (type === "scholarship") acc.scholarship += amount;
      else acc.general += amount;
      return acc;
    },
    { total: 0, emergency: 0, equipment: 0, scholarship: 0, general: 0 }
  );

  const exportCsv = () => {
    if (!contributions.length) return;
    const header = ["Date", "Receipt", "Program", "Category", "Amount (LKR)"];
    const rows = contributions.map((item) => [
      item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "",
      item.receiptNumber ?? "",
      item.program ?? "",
      item.category ?? "",
      String(item.amountLkr ?? 0)
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (item: DonorContribution) => {
    setEditingContributionId(item._id ?? null);
    setEditingContribution({
      contributionType: String(item.contributionType ?? "general"),
      program: String(item.program ?? ""),
      category: String(item.category ?? ""),
      amountLkr: String(item.amountLkr ?? ""),
      note: String(item.note ?? "")
    });
    setActionError(null);
  };

  const saveContribution = async () => {
    if (!editingContributionId) return;
    setSavingContribution(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/donor/contributions/${editingContributionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingContribution)
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to save contribution.");
        return;
      }
      clearEditingContribution();
      await reload();
    } catch {
      setActionError("Unable to save contribution.");
    } finally {
      setSavingContribution(false);
    }
  };

  const deleteContribution = async (id: string) => {
    if (!window.confirm("Delete this contribution?")) return;
    setDeletingContributionId(id);
    setActionError(null);
    try {
      const response = await fetch(`/api/donor/contributions/${id}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setActionError(payload.message ?? "Unable to delete contribution.");
        return;
      }
      if (editingContributionId === id) {
        clearEditingContribution();
      }
      await reload();
    } catch {
      setActionError("Unable to delete contribution.");
    } finally {
      setDeletingContributionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50">
                  Donations
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Review donation activity in a cleaner and more actionable dashboard view
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50/90">
                    Track emergency fund, equipment, and scholarship contributions with clearer records, stronger actions, and export-ready history.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Donation entries</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : contributions.length}</p>
                  <p className="text-xs text-sky-50/80">Recorded contribution rows</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">All-time total</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : `LKR ${totals.total}`}</p>
                  <p className="text-xs text-sky-50/80">Across all donation types</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total contributed",
            value: `LKR ${totals.total}`,
            description: "All-time donations",
            accent: "from-sky-500 to-blue-600"
          },
          {
            label: "Emergency fund",
            value: `LKR ${totals.emergency}`,
            description: "Crisis response",
            accent: "from-cyan-500 to-sky-600"
          },
          {
            label: "Equipment",
            value: `LKR ${totals.equipment}`,
            description: "Devices & materials",
            accent: "from-blue-600 to-indigo-600"
          },
          {
            label: "Scholarships",
            value: `LKR ${totals.scholarship}`,
            description: "Tuition & grants",
            accent: "from-sky-600 to-cyan-600"
          }
        ].map((item) => (
          <div
            key={item.label}
            className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-md transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${item.accent}`} />
            <div className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.label}
              </p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
              <p className="text-sm text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Track your emergency fund, scholarship, and equipment contributions in one place. Receipts
        are generated automatically for logged donations.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
          {actionError}
        </p>
      ) : null}
      {editingContributionId ? (
        <Card className="space-y-5 border-slate-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit contribution</h3>
              <p className="text-sm text-slate-500">Update donation details with clearer fields and actions.</p>
            </div>
            <span className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
              Editing selected record
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={editingContribution.contributionType}
              onChange={(event) =>
                setEditingContribution((prev) => ({ ...prev, contributionType: event.target.value }))
              }
            >
              <option value="emergency_fund">Emergency fund</option>
              <option value="equipment">Equipment</option>
              <option value="scholarship">Scholarship</option>
              <option value="ngo_program">NGO Program</option>
              <option value="general">General</option>
            </select>
            <Input
              value={editingContribution.amountLkr}
              onChange={(event) => setEditingContribution((prev) => ({ ...prev, amountLkr: event.target.value }))}
              placeholder="Amount (LKR)"
              className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
            />
            <Input
              value={editingContribution.program}
              onChange={(event) => setEditingContribution((prev) => ({ ...prev, program: event.target.value }))}
              placeholder="Program"
              className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
            />
            <Input
              value={editingContribution.category}
              onChange={(event) => setEditingContribution((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
              className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
            />
          </div>
          <Input
            value={editingContribution.note}
            onChange={(event) => setEditingContribution((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="Note"
            className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" className="min-w-[120px]" onClick={clearEditingContribution}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="min-w-[150px] bg-primary text-white shadow-sm hover:bg-blue-700"
              onClick={saveContribution}
              disabled={savingContribution}
            >
              {savingContribution ? "Saving..." : "Save"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Donation history</h3>
            <p className="text-sm text-slate-500">Review receipts, program records, and contribution details in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              onClick={() => reload()}
            >
              Refresh
            </Button>
            <Button
              type="button"
              onClick={exportCsv}
              disabled={!contributions.length}
              className="bg-primary text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download receipts CSV
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading donations...</p>
        ) : !contributions.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No donations logged yet. Use the Partner Home form to record new contributions.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {contributions.map((item) => (
              <div
                key={item._id ?? item.receiptNumber ?? item.program}
                className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.program ?? "Donation"}</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                        {item.category ?? "General support"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Receipt: {item.receiptNumber ?? "Pending"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                    </p>
                    {item.note ? (
                      <p className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                      LKR {item.amountLkr ?? 0}
                    </span>
                    {item._id ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEdit(item)}
                          className="border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900/40"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => deleteContribution(item._id as string)}
                          disabled={deletingContributionId === item._id}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/30"
                        >
                          {deletingContributionId === item._id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
function DonorImpactReportsSection() {
  const [report, setReport] = useState<DonorImpactReport | null>(null);
  const [ngoReports, setNgoReports] = useState<any[]>([]);
  const [rangeDays, setRangeDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      import("@/lib/ngo-demo-store").then(({ getNgoReports }) => {
        setNgoReports(getNgoReports());
      });
      const response = await fetch(`/api/donor/impact-reports?rangeDays=${rangeDays}`);
      const payload = (await response.json().catch(() => ({}))) as DonorImpactReport & { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to load impact reports.");
        setReport(null);
        return;
      }
      setReport(payload);
    } catch {
      setError("Unable to load impact reports.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Total contributed (LKR)", report.summary.totalContributedLkr],
      ["Active scholarships", report.summary.activeScholarships],
      ["Total scholarships", report.summary.totalScholarships],
      ["Aid approved (LKR)", report.summary.aidApprovedLkr],
      ["Approved aid requests", report.summary.approvedAidRequests],
      ["Funded students", report.summary.fundedStudents],
      ["Avg support per student (LKR)", report.summary.avgSupportPerStudent]
    ];
    const distributionRows = report.distribution.map((item) => [
      `Distribution: ${item.label}`,
      `${item.amountLkr} (${item.count})`
    ]);
    const csv = [...rows, ...distributionRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `impact-report-${report.rangeDays}d-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50">
                  Impact reports
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Present donor impact with a clearer and more professional reporting view
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50/90">
                    Review contribution impact, funding distribution, and NGO partner outcomes in a cleaner dashboard layout built for fast scanning.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Window</p>
                  <p className="mt-1 text-2xl font-semibold">{rangeDays} days</p>
                  <p className="text-xs text-sky-50/80">Current reporting range</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">NGO reports</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : ngoReports.length}</p>
                  <p className="text-xs text-sky-50/80">Partner reports available</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? null : report
          ? [
              {
                label: "Total contributed",
                value: `LKR ${report.summary.totalContributedLkr}`,
                description: "Donations recorded",
                accent: "from-sky-500 to-blue-600"
              },
              {
                label: "Approved aid",
                value: `LKR ${report.summary.aidApprovedLkr}`,
                description: "Aid disbursed",
                accent: "from-cyan-500 to-sky-600"
              },
              {
                label: "Funded students",
                value: String(report.summary.fundedStudents),
                description: "Unique recipients",
                accent: "from-blue-600 to-indigo-600"
              },
              {
                label: "Avg support/student",
                value: `LKR ${report.summary.avgSupportPerStudent}`,
                description: "Average approved aid",
                accent: "from-sky-600 to-cyan-600"
              }
            ].map((item) => (
              <div
                key={item.label}
                className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-md transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className={`h-2 w-full bg-gradient-to-r ${item.accent}`} />
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="text-3xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </div>
            ))
          : null}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Impact reports aggregate scholarship, aid, and donation data for CSR reporting. Results are
        anonymized and grouped at program level.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Impact summary</h3>
            <p className="text-sm text-slate-500">Rolling {rangeDays}-day window</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
            </select>
            <Button
              type="button"
              onClick={exportCsv}
              disabled={!report}
              className="bg-primary text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export CSV
            </Button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading impact report...</p>
        ) : report ? (
          <p className="text-sm text-slate-500">Summary metrics are shown in the header above.</p>
        ) : null}
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Funding distribution</h3>
          <p className="text-sm text-slate-500">See how funding is distributed across donor-supported categories.</p>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading distribution...</p>
        ) : !report?.distribution?.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">No distribution data available yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {report.distribution.map((item) => (
              <div
                key={item.label}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.count} allocations</p>
                </div>
                <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                  LKR {item.amountLkr}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Highlights</h3>
          <p className="text-sm text-slate-500">Important donor impact points presented in a cleaner summary view.</p>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading highlights...</p>
        ) : !report?.highlights?.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">No highlights yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {report.highlights.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-50 to-white p-4 text-sm shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">NGO Impact Reports</h3>
          <p className="text-sm text-slate-500">Partner NGO outcomes and program-level utilization reports.</p>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading NGO reports...</p>
        ) : !ngoReports.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">No NGO partner reports available yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {ngoReports.map((report) => (
              <div key={report._id} className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 text-sm shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900 dark:text-white">{report.title}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800">
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {report.organizationName} - Program: {report.programName}
                </p>
                <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                    Total Funds: LKR {report.totalFundsUtilized.toLocaleString()}
                  </span>
                  <span>Beneficiaries: {report.beneficiariesSupported}</span>
                </div>
                {report.keyOutcomes?.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-400">
                    {report.keyOutcomes.map((outcome: string, idx: number) => <li key={idx}>{outcome}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
function DonorRecognitionSection() {
  const [overview, setOverview] = useState<DonorRecognitionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState("");
  const [storySummary, setStorySummary] = useState("");
  const [storyCategory, setStoryCategory] = useState("Student support");
  const [storySaving, setStorySaving] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);

  const loadRecognition = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/recognition");
      const payload = (await response.json().catch(() => ({}))) as DonorRecognitionOverview & {
        message?: string;
      };
      if (!response.ok) {
        setError(payload.message ?? "Unable to load recognition highlights.");
        setOverview(null);
        return;
      }
      setOverview(payload);
    } catch {
      setError("Unable to load recognition highlights.");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecognition();
  }, [loadRecognition]);

  const metrics = overview?.metrics;
  const stories = overview?.stories ?? [];
  const clearStoryForm = () => {
    setEditingStoryId(null);
    setStoryTitle("");
    setStorySummary("");
    setStoryCategory("Student support");
    setError(null);
  };

  const createStory = async () => {
    if (!storyTitle.trim() || !storySummary.trim()) {
      setError("Story title and summary are required.");
      return;
    }
    setStorySaving(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/recognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: storyTitle.trim(),
          summary: storySummary.trim(),
          category: storyCategory.trim()
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to add story.");
        return;
      }
      clearStoryForm();
      await loadRecognition();
    } catch {
      setError("Unable to add story.");
    } finally {
      setStorySaving(false);
    }
  };

  const saveStory = async () => {
    if (!editingStoryId) return;
    if (!storyTitle.trim() || !storySummary.trim()) {
      setError("Story title and summary are required.");
      return;
    }
    setStorySaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/donor/recognition/${editingStoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: storyTitle.trim(),
          summary: storySummary.trim(),
          category: storyCategory.trim()
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to update story.");
        return;
      }
      clearStoryForm();
      await loadRecognition();
    } catch {
      setError("Unable to update story.");
    } finally {
      setStorySaving(false);
    }
  };

  const deleteStory = async (id: string) => {
    if (!window.confirm("Delete this story?")) return;
    setDeletingStoryId(id);
    setError(null);
    try {
      const response = await fetch(`/api/donor/recognition/${id}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to delete story.");
        return;
      }
      if (editingStoryId === id) {
        clearStoryForm();
      }
      await loadRecognition();
    } catch {
      setError("Unable to delete story.");
    } finally {
      setDeletingStoryId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50">
                  Recognition
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Present donor recognition stories in a cleaner and more professional way
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50/90">
                    Highlight anonymized student appreciation, donor impact stories, and recognition outcomes in a polished dashboard experience.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Stories</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : stories.length}</p>
                  <p className="text-xs text-sky-50/80">Recognition entries available</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Engagement</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : `${metrics?.engagementRate ?? 0}%`}</p>
                  <p className="text-xs text-sky-50/80">Recipient engagement rate</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Card>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Recognition highlights anonymized student stories and thank you messages. Individual
        identities are only shared if everyone has opted in.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Featured stories",
            value: loading ? "..." : String(metrics?.featuredStories ?? 0),
            description: "Published highlights",
            accent: "from-sky-500 to-blue-600"
          },
          {
            label: "Student testimonials",
            value: loading ? "..." : String(metrics?.studentTestimonials ?? 0),
            description: "Thank-you notes received",
            accent: "from-cyan-500 to-sky-600"
          },
          {
            label: "Anonymized highlights",
            value: loading ? "..." : String(metrics?.anonymizedHighlights ?? 0),
            description: "Stories without identity",
            accent: "from-blue-600 to-indigo-600"
          },
          {
            label: "Engagement rate",
            value: loading ? "..." : `${metrics?.engagementRate ?? 0}%`,
            description: "Recipient engagement",
            accent: "from-sky-600 to-cyan-600"
          }
        ].map((item) => (
          <div
            key={item.label}
            className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-md transition-transform hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${item.accent}`} />
            <div className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.label}
              </p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
              <p className="text-sm text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="space-y-5 border-slate-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingStoryId ? "Edit story" : "Add story"}
            </h3>
            <p className="text-sm text-slate-500">
              Capture donor recognition stories in a clearer format for professional presentation.
            </p>
          </div>
          <span className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            {editingStoryId ? "Editing selected story" : "Create a new story"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            value={storyTitle}
            onChange={(event) => setStoryTitle(event.target.value)}
            placeholder="Story title"
            className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
          />
          <Input
            value={storyCategory}
            onChange={(event) => setStoryCategory(event.target.value)}
            placeholder="Category"
            className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
          />
        </div>
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
          value={storySummary}
          onChange={(event) => setStorySummary(event.target.value)}
          placeholder="Story summary"
        />
        <div className="flex flex-wrap justify-end gap-2">
          {editingStoryId ? (
            <>
              <Button
                variant="secondary"
                className="min-w-[120px]"
                onClick={clearStoryForm}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="min-w-[150px] bg-primary text-white shadow-sm hover:bg-blue-700"
                onClick={saveStory}
                disabled={storySaving}
              >
                {storySaving ? "Saving..." : "Save story"}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              className="min-w-[150px] bg-primary text-white shadow-sm hover:bg-blue-700"
              onClick={createStory}
              disabled={storySaving}
            >
              {storySaving ? "Adding..." : "Add story"}
            </Button>
          )}
        </div>
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Featured stories</h3>
            <p className="text-sm text-slate-500">Recognition highlights and appreciation stories shared with donors.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={() => loadRecognition()}
          >
            Refresh
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading stories...</p>
        ) : !stories.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No recognition stories yet. As recipients share consented stories, they will appear here.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {stories.map((story) => (
              <div
                key={story.id}
                className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{story.title}</p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                    {story.category}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{story.summary}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">{new Date(story.date).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingStoryId(story.id);
                        setStoryTitle(story.title);
                        setStorySummary(story.summary);
                        setStoryCategory(story.category);
                      }}
                      className="border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900/40"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => deleteStory(story.id)}
                      disabled={deletingStoryId === story.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/30"
                    >
                      {deletingStoryId === story.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
function DonorCommunicationsSection() {
  const [audience, setAudience] = useState("students");
  const [messageType, setMessageType] = useState("General update");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<DonorCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const clearMessageForm = () => {
    setEditingId(null);
    setAudience("students");
    setMessageType("General update");
    setSubject("");
    setBody("");
    setError(null);
    setSuccess(null);
  };

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/communications");
      const payload = (await response.json().catch(() => [])) as DonorCommunication[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load messages.");
        setMessages([]);
        return;
      }
      setMessages(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load messages.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const sendMessage = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/donor/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          messageType,
          subject: subject.trim(),
          body: body.trim()
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to send message.");
        return;
      }
      setSubject("");
      setBody("");
      setSuccess("Message sent to recipients.");
      await loadMessages();
    } catch {
      setError("Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const startEdit = (message: DonorCommunication) => {
    setEditingId(message._id ?? null);
    const normalizedAudience = String(message.audience ?? "").toLowerCase();
    if (normalizedAudience.includes("students + university admin")) {
      setAudience("students_admin_faculty");
    } else if (normalizedAudience.includes("admin")) {
      setAudience("admin_faculty");
    } else {
      setAudience("students");
    }
    setMessageType(message.messageType ?? "General update");
    setSubject(message.subject ?? "");
    setBody(message.body ?? "");
    setError(null);
    setSuccess(null);
  };

  const updateMessage = async () => {
    if (!editingId) return;
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/donor/communications/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          messageType,
          subject: subject.trim(),
          body: body.trim()
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to update message.");
        return;
      }
      setSuccess("Message updated.");
      clearMessageForm();
      setSuccess("Message updated.");
      await loadMessages();
    } catch {
      setError("Unable to update message.");
    } finally {
      setUpdating(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/donor/communications/${id}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to delete message.");
        return;
      }
      if (editingId === id) {
        clearMessageForm();
      }
      setSuccess("Message deleted.");
      await loadMessages();
    } catch {
      setError("Unable to delete message.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-blue-700 to-cyan-600 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50">
                  Communications
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Communicate with recipients and university teams in a clearer professional workspace
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50/90">
                    Send updates, requests, and invitations through a cleaner donor communications view designed for easy message management.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Messages</p>
                  <p className="mt-1 text-2xl font-semibold">{loading ? "..." : messages.length}</p>
                  <p className="text-xs text-sky-50/80">Communication records</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-50/75">Audience</p>
                  <p className="mt-1 text-lg font-semibold">
                    {audience === "students"
                      ? "Students"
                      : audience === "admin_faculty"
                        ? "University Admin / Faculty"
                        : "Students + Admin"}
                  </p>
                  <p className="text-xs text-sky-50/80">Current message target</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Use this space to communicate with scholarship recipients and university admins. Students
        cannot modify your messages.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <Card className="space-y-5 border-slate-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingId ? "Edit message" : "Compose message"}
            </h3>
            <p className="text-sm text-slate-500">
              Send donor updates with clear targeting and a more readable composition flow.
            </p>
          </div>
          <span className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            {editingId ? "Editing selected message" : "Create a new message"}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Audience</label>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
            >
              <option value="students">Students</option>
              <option value="admin_faculty">University Admin / Faculty</option>
              <option value="students_admin_faculty">Students + University Admin / Faculty</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Communication type</label>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={messageType}
              onChange={(event) => setMessageType(event.target.value)}
            >
              <option>General update</option>
              <option>Interview / story request</option>
              <option>Event invitation</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Message subject"
            className="min-h-11 border-slate-200 bg-white dark:bg-slate-900"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Message</label>
          <textarea
            className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message to your recipients or the university team..."
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-xs text-slate-500">
            <p>Students can reply but cannot edit your original messages.</p>
            <p>You cannot message non-recipients from this workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            {editingId ? (
              <Button
                variant="secondary"
                className="min-w-[120px]"
                onClick={clearMessageForm}
              >
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={editingId ? updateMessage : sendMessage}
              disabled={sending || updating}
              className="min-w-[150px] bg-primary text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {editingId ? (updating ? "Saving..." : "Update") : sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 border-slate-100 p-5 shadow-md dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent messages</h3>
            <p className="text-sm text-slate-500">Review sent donor communications and manage existing messages.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={() => loadMessages()}
          >
            Refresh
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading messages...</p>
        ) : !messages.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">No messages sent yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {messages.map((item) => (
              <div
                key={item._id ?? item.subject}
                className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.subject ?? "Message"}</p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary dark:bg-primary/20 dark:text-blue-200">
                    {item.audience ?? "Recipients"}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{item.messageType ?? "General update"}</p>
                <p className="mt-2 text-sm text-slate-500">{item.body}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                  </p>
                  {item._id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEdit(item)}
                        className="border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900/40"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteMessage(item._id as string)}
                        disabled={deletingId === item._id}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/30"
                      >
                        {deletingId === item._id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
function DonorProfileSection() {
  const { user, refreshUser, updateUserProfile, requestPasswordReset } = useAuth();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.contact ?? "");
  const [profile, setProfile] = useState<DonorProfile>({
    organizationName: "",
    logoUrl: "",
    focusAreas: "",
    teamAccess: "Single admin",
    contactEmail: "",
    websiteUrl: ""
  });

  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [donorProfileSaving, setDonorProfileSaving] = useState(false);
  const [donorProfileLoading, setDonorProfileLoading] = useState(true);
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
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setDonorProfileLoading(true);
      try {
        const response = await fetch("/api/donor/profile", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as { profile?: DonorProfile; message?: string };
        if (!cancelled && response.ok && payload.profile) {
          setProfile(payload.profile);
        }
      } catch {
        if (!cancelled) {
          setMessage({ type: "err", text: "Unable to load donor profile." });
        }
      } finally {
        if (!cancelled) setDonorProfileLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const saveDonorProfile = async () => {
    setMessage(null);
    setDonorProfileSaving(true);
    try {
      const response = await fetch("/api/donor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const payload = (await response.json().catch(() => ({}))) as { profile?: DonorProfile; message?: string };
      if (!response.ok) {
        setMessage({ type: "err", text: payload.message ?? "Unable to save profile." });
        return;
      }
      if (payload.profile) {
        setProfile(payload.profile);
      }
      setMessage({ type: "ok", text: payload.message ?? "Organization profile updated." });
    } catch {
      setMessage({ type: "err", text: "Unable to save profile." });
    } finally {
      setDonorProfileSaving(false);
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
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Donor / CSR profile</p>
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
          Manage your organization profile, branding, and team access.
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Organization profile</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Update branding and contact details for your CSR or donor team.
              </p>
              {donorProfileLoading ? (
                <p className="text-sm text-slate-500">Loading organization profile...</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization name</label>
                    <Input
                      value={profile.organizationName}
                      onChange={(event) => setProfile((prev) => ({ ...prev, organizationName: event.target.value }))}
                      placeholder="Your organization or CSR unit"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Logo URL</label>
                    <Input
                      value={profile.logoUrl}
                      onChange={(event) => setProfile((prev) => ({ ...prev, logoUrl: event.target.value }))}
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Funding focus areas</label>
                    <Input
                      value={profile.focusAreas}
                      onChange={(event) => setProfile((prev) => ({ ...prev, focusAreas: event.target.value }))}
                      placeholder="STEM, first-gen students, rural access"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Team access level</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={profile.teamAccess}
                      onChange={(event) => setProfile((prev) => ({ ...prev, teamAccess: event.target.value }))}
                    >
                      <option>Single admin</option>
                      <option>Multiple viewers</option>
                      <option>Full team management</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact email</label>
                    <Input
                      value={profile.contactEmail}
                      onChange={(event) => setProfile((prev) => ({ ...prev, contactEmail: event.target.value }))}
                      placeholder="donor@org.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                    <Input
                      value={profile.websiteUrl}
                      onChange={(event) => setProfile((prev) => ({ ...prev, websiteUrl: event.target.value }))}
                      placeholder="https://"
                    />
                  </div>
                </div>
              )}
              <Button variant="primary" onClick={saveDonorProfile} disabled={donorProfileSaving || donorProfileLoading}>
                {donorProfileSaving ? "Saving..." : "Update organization profile"}
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
                Control what is shared with university admins and NGOs.
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
                  Share program focus areas with mentors
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
                  Share financial oversight activity with admins
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
                Choose how you receive updates about scholarships and impact.
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
                  Reminders for report deadlines
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
                  Weekly donor digest reminder
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


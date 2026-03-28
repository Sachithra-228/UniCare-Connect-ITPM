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
  contributionType?: "emergency_fund" | "equipment" | "scholarship" | "general";
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
    "emergency_fund" | "equipment" | "scholarship" | "general"
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

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active scholarships"
          value={loading ? "..." : String(summary?.activeScholarships ?? 0)}
          description="Currently accepting applications"
        />
        <StatCard
          label="Total scholarships created"
          value={loading ? "..." : String(summary?.totalScholarships ?? 0)}
          description="Across all programs"
        />
        <StatCard
          label="Emergency aid cases"
          value={loading ? "..." : String(summary?.emergencyAidCases ?? 0)}
          description="Approved emergency support cases"
        />
        <StatCard
          label="Total contributed (LKR)"
          value={loading ? "..." : String(summary?.totalContributedLkr ?? 0)}
          description={loading ? "Loading..." : `Upcoming deadlines: ${summary?.upcomingDeadlines ?? 0}`}
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">Log new contribution</h3>
        <form className="space-y-3" onSubmit={logContribution}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Contribution type</label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={contributionType}
                onChange={(event) =>
                  setContributionType(
                    event.target.value as "emergency_fund" | "equipment" | "scholarship" | "general"
                  )
                }
              >
                <option value="emergency_fund">Emergency fund</option>
                <option value="equipment">Equipment</option>
                <option value="scholarship">Scholarship</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Program / campaign</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={program}
                onChange={(event) => setProgram(event.target.value)}
                placeholder="Campaign name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Amount (LKR)</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={amountLkr}
                onChange={(event) => setAmountLkr(event.target.value)}
                placeholder="50000"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Note (optional)</label>
            <textarea
              className="min-h-[84px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Any note for internal tracking..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loggingContribution}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingContribution ? "Logging..." : "Log contribution"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">Recent donations</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading recent donations...</p>
        ) : !recentDonations.length ? (
          <p className="text-sm text-slate-500">No donations logged yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {recentDonations.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="font-medium">{item.program}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.category} | LKR {item.amountLkr}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(item.date).toLocaleDateString()}
                  {item.receiptNumber ? ` | Receipt: ${item.receiptNumber}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">Recent thank you messages</h3>
        <div className="space-y-3 text-sm">
          {thankYouMessages.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t.program}
              </p>
              <p className="mt-1 text-slate-800 dark:text-slate-100">{t.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                From: {t.from} | {new Date(t.date).toLocaleDateString()}
              </p>
            </div>
          ))}
          {!thankYouMessages.length && (
            <p className="text-sm text-slate-500">
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
  const [actionError, setActionError] = useState<string | null>(null);

  const activeCount = scholarships.filter(
    (item) => String(item.status ?? "").toLowerCase() !== "closed"
  ).length;
  const closedCount = scholarships.length - activeCount;

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

  return (
    <div className="space-y-4">
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total scholarships"
          value={String(scholarships.length)}
          description="Programs you created"
        />
        <StatCard
          label="Active"
          value={String(activeCount)}
          description="Visible to students"
        />
        <StatCard
          label="Closed"
          value={String(closedCount)}
          description="Not accepting new applications"
        />
      </div>
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Scholarship listings</h3>
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90"
          >
            {showCreateForm ? "Cancel" : "Create scholarship"}
          </button>
        </div>
        {showCreateForm ? (
          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            onSubmit={createScholarship}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Scholarship title
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="STEM Equity Scholarship"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Amount
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="LKR 100000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Application deadline
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Tags (comma separated)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="need-based, undergraduate"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Eligibility criteria
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={eligibilityCriteria}
                onChange={(event) => setEligibilityCriteria(event.target.value)}
                placeholder="Who can apply for this scholarship"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Application link (optional)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={applicationLink}
                onChange={(event) => setApplicationLink(event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Publishing..." : "Publish scholarship"}
              </button>
            </div>
          </form>
        ) : null}
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {loading ? (
            <p className="py-3 text-sm text-slate-500">Loading scholarships...</p>
          ) : null}
          {scholarships.map((s) => (
            <div
              key={s._id ?? s.title}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{s.title ?? "Scholarship"}</p>
                <p className="text-xs text-slate-500">
                  Amount: {s.amount ?? "N/A"}
                  {s.deadline ? ` | Deadline: ${s.deadline}` : ""}
                </p>
                {s.tags?.length ? (
                  <p className="text-xs text-slate-500">Tags: {s.tags.join(", ")}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {String(s.status ?? "active").toLowerCase() === "closed" ? "Closed" : "Active"}
                </span>
                {s._id ? (
                  String(s.status ?? "").toLowerCase() === "closed" ? (
                    <button
                      onClick={() => updateStatus(s._id as string, "active")}
                      disabled={updatingId === s._id}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(s._id as string, "closed")}
                      disabled={updatingId === s._id}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Close
                    </button>
                  )
                ) : null}
              </div>
            </div>
          ))}
          {!loading && !scholarships.length && (
            <p className="py-3 text-sm text-slate-500">
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        View funded students and progress updates. Identity details are shown only when explicit
        consent is available.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Funded students"
          value={loading ? "..." : String(summary?.fundedStudents ?? 0)}
          description="Students with approved support"
        />
        <StatCard
          label="Consented profiles"
          value={loading ? "..." : String(summary?.consentedProfiles ?? 0)}
          description="Identity shared with consent"
        />
        <StatCard
          label="Total funded (LKR)"
          value={loading ? "..." : String(summary?.totalFundedLkr ?? 0)}
          description="Approved support total"
        />
        <StatCard
          label="Average progress"
          value={loading ? "..." : `${summary?.avgProgressScore ?? 0}%`}
          description="Aggregate progress signal"
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Current scholars</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading funded students...</p>
        ) : !students.length ? (
          <p className="text-sm text-slate-500">
            No funded student records yet. Once approved aid cases exist, they will appear here.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {students.map((student) => (
              <div
                key={student.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{student.displayName}</p>
                    <p className="text-xs text-slate-500">
                      {student.university || "University details hidden"}
                      {student.program ? ` | ${student.program}` : ""}
                      {student.year ? ` | ${student.year}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {student.latestStatus}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Support: {student.supportCategories.join(", ")} | LKR {student.totalFundedLkr}
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, student.progressScore))}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Progress: {student.progressLabel} ({student.progressScore}%)
                </p>
                <p className="mt-1 text-xs text-slate-500">{student.recentMilestone}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Last update: {new Date(student.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Recent updates</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading updates...</p>
        ) : !updates.length ? (
          <p className="text-sm text-slate-500">No updates available yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {updates.map((update) => (
              <div key={update.id} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                <p className="font-medium">{update.title}</p>
                <p className="text-xs text-slate-500">{update.detail}</p>
                <p className="text-xs text-slate-400">{new Date(update.date).toLocaleDateString()}</p>
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Track your emergency fund, scholarship, and equipment contributions in one place. Receipts
        are generated automatically for logged donations.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total contributed" value={`LKR ${totals.total}`} description="All-time donations" />
        <StatCard label="Emergency fund" value={`LKR ${totals.emergency}`} description="Crisis response" />
        <StatCard label="Equipment" value={`LKR ${totals.equipment}`} description="Devices & materials" />
        <StatCard label="Scholarships" value={`LKR ${totals.scholarship}`} description="Tuition & grants" />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Donation history</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reload()}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={!contributions.length}
              className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download receipts CSV
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading donations...</p>
        ) : !contributions.length ? (
          <p className="text-sm text-slate-500">
            No donations logged yet. Use the Partner Home form to record new contributions.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
            {contributions.map((item) => (
              <div
                key={item._id ?? item.receiptNumber ?? item.program}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{item.program ?? "Donation"}</p>
                  <p className="text-xs text-slate-500">
                    {item.category ?? "General support"} | Receipt: {item.receiptNumber ?? "Pending"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">LKR {item.amountLkr ?? 0}</p>
                  {item.note ? <p className="text-xs text-slate-500">{item.note}</p> : null}
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
  const [rangeDays, setRangeDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Impact reports aggregate scholarship, aid, and donation data for CSR reporting. Results are
        anonymized and grouped at program level.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Impact summary</h3>
            <p className="text-xs text-slate-500">Rolling {rangeDays}-day window</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
            </select>
            <button
              onClick={exportCsv}
              disabled={!report}
              className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export CSV
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading impact report...</p>
        ) : report ? (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total contributed"
              value={`LKR ${report.summary.totalContributedLkr}`}
              description="Donations recorded"
            />
            <StatCard
              label="Approved aid"
              value={`LKR ${report.summary.aidApprovedLkr}`}
              description="Aid disbursed"
            />
            <StatCard
              label="Funded students"
              value={String(report.summary.fundedStudents)}
              description="Unique recipients"
            />
            <StatCard
              label="Avg support/student"
              value={`LKR ${report.summary.avgSupportPerStudent}`}
              description="Average approved aid"
            />
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Funding distribution</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading distribution...</p>
        ) : !report?.distribution?.length ? (
          <p className="text-sm text-slate-500">No distribution data available yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {report.distribution.map((item) => (
              <div
                key={item.label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.count} allocations</p>
                </div>
                <span className="text-sm font-semibold">LKR {item.amountLkr}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Highlights</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading highlights...</p>
        ) : !report?.highlights?.length ? (
          <p className="text-sm text-slate-500">No highlights yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {report.highlights.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Recognition highlights anonymized student stories and thank you messages. Individual
        identities are only shared if everyone has opted in.
      </p>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Featured stories"
          value={loading ? "..." : String(metrics?.featuredStories ?? 0)}
          description="Published highlights"
        />
        <StatCard
          label="Student testimonials"
          value={loading ? "..." : String(metrics?.studentTestimonials ?? 0)}
          description="Thank-you notes received"
        />
        <StatCard
          label="Anonymized highlights"
          value={loading ? "..." : String(metrics?.anonymizedHighlights ?? 0)}
          description="Stories without identity"
        />
        <StatCard
          label="Engagement rate"
          value={loading ? "..." : `${metrics?.engagementRate ?? 0}%`}
          description="Recipient engagement"
        />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Featured stories</h3>
          <button
            onClick={() => loadRecognition()}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading stories...</p>
        ) : !stories.length ? (
          <p className="text-sm text-slate-500">
            No recognition stories yet. As recipients share consented stories, they will appear here.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {stories.map((story) => (
              <div
                key={story.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{story.title}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {story.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{story.summary}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(story.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
function DonorCommunicationsSection() {
  const [audience, setAudience] = useState("Scholarship recipients");
  const [messageType, setMessageType] = useState("General update");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<DonorCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
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
      <Card className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Audience</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
            >
              <option>Scholarship recipients</option>
              <option>University admin (scholarship office)</option>
              <option>Specific cohort / batch</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Communication type</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
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
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Subject</label>
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Message subject"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Message</label>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message to your recipients or the university team..."
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-slate-500">
            <p>Students can reply but cannot edit your original messages.</p>
            <p>You cannot message non-recipients from this workspace.</p>
          </div>
          <button
            onClick={sendMessage}
            disabled={sending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent messages</h3>
          <button
            onClick={() => loadMessages()}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading messages...</p>
        ) : !messages.length ? (
          <p className="text-sm text-slate-500">No messages sent yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {messages.map((item) => (
              <div
                key={item._id ?? item.subject}
                className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.subject ?? "Message"}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item.audience ?? "Recipients"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{item.messageType ?? "General update"}</p>
                <p className="mt-1 text-xs text-slate-500">{item.body}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                </p>
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


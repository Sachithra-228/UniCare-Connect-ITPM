"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

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
  const [profile, setProfile] = useState<DonorProfile>({
    organizationName: "",
    logoUrl: "",
    focusAreas: "",
    teamAccess: "Single admin",
    contactEmail: "",
    websiteUrl: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donor/profile");
      const payload = (await response.json().catch(() => ({}))) as { profile?: DonorProfile; message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to load profile.");
        return;
      }
      if (payload.profile) {
        setProfile(payload.profile);
      }
    } catch {
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/donor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const payload = (await response.json().catch(() => ({}))) as { profile?: DonorProfile; message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to save profile.");
        return;
      }
      if (payload.profile) {
        setProfile(payload.profile);
      }
      setMessage(payload.message ?? "Profile saved.");
    } catch {
      setError("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleProfileShell roleLabel="Donor / CSR profile">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your organization profile, branding, and team access. You cannot modify other donor
          accounts.
        </p>
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            {message}
          </p>
        ) : null}
        <Card className="space-y-4 p-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading profile...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Organization name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={profile.organizationName}
                  onChange={(event) => setProfile((prev) => ({ ...prev, organizationName: event.target.value }))}
                  placeholder="Your organization or CSR unit"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Logo URL</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={profile.logoUrl}
                  onChange={(event) => setProfile((prev) => ({ ...prev, logoUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Funding focus areas
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={profile.focusAreas}
                  onChange={(event) => setProfile((prev) => ({ ...prev, focusAreas: event.target.value }))}
                  placeholder="E.g. STEM, first-gen students, rural access"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Team access level
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={profile.teamAccess}
                  onChange={(event) => setProfile((prev) => ({ ...prev, teamAccess: event.target.value }))}
                >
                  <option>Single admin</option>
                  <option>Multiple viewers</option>
                  <option>Full team management</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Contact email</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={profile.contactEmail}
                  onChange={(event) => setProfile((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  placeholder="donor@org.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Website</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={profile.websiteUrl}
                  onChange={(event) => setProfile((prev) => ({ ...prev, websiteUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </Card>
      </div>
    </RoleProfileShell>
  );
}

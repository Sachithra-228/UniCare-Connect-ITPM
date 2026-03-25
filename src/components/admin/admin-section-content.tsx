"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { AdminAnalytics } from "./admin-analytics";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

type AdminSectionContentProps = {
  sectionId: string;
};

export function AdminSectionContent({ sectionId }: AdminSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "overview":
        return AdminOverviewSection;
      case "verifications":
        return AdminVerificationsSection;
      case "financial-oversight":
        return AdminFinancialOversightSection;
      case "career-services":
        return AdminCareerServicesSection;
      case "mentorship-program":
        return AdminMentorshipProgramSection;
      case "reports":
        return AdminReportsSection;
      case "announcements":
        return AdminAnnouncementsSection;
      case "profile":
        return AdminProfileSection;
      default:
        return AdminOverviewSection;
    }
  }, [sectionId]);

  return <Section />;
}

function AdminOverviewSection() {
  const isDemo =
    typeof window === "undefined"
      ? true
      : process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.MONGODB_URI;

  const moderationQueue = [
    { id: "q1", type: "Aid request", status: "Verification needed", owner: "Student" },
    { id: "q2", type: "NGO onboarding", status: "Documents pending", owner: "NGO" }
  ];

  const upcomingDeadlines = [
    { id: "d1", label: "Emergency fund review window", date: "2026-02-28" },
    { id: "d2", label: "Scholarship disbursement cycle", date: "2026-03-05" },
    { id: "d3", label: "Placement report submission", date: "2026-03-10" }
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active students" value="-" description="All roles combined" />
        <StatCard label="Pending verifications" value="-" description="Students / NGOs / donors" />
        <StatCard label="Open aid requests" value="-" description="Awaiting decision" />
        <StatCard label="Open tickets" value="-" description="System & support alerts" />
      </div>

      <AdminAnalytics />

      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Recent activity</h3>
        <div className="space-y-3 text-sm">
          {moderationQueue.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <p className="font-semibold">{item.type}</p>
              <p className="text-slate-500">{item.status}</p>
              <p className="text-xs text-slate-400">Owner type: {item.owner}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold">Upcoming deadlines</h3>
          <ul className="space-y-2 text-sm">
            {upcomingDeadlines.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <span>{d.label}</span>
                <span className="text-xs text-slate-500">{d.date}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold">System health</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>Database connection</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                {isDemo ? "Demo / fallback mode" : "Connected"}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Auth service</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                OK
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Background jobs</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Sample data only
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function AdminVerificationsSection() {
  const items = [
    {
      id: "s1",
      type: "Student enrollment",
      role: "Student",
      status: "Pending",
      note: "Verify against university records"
    },
    {
      id: "f1",
      type: "Financial aid application",
      role: "Student",
      status: "Under review",
      note: "Check documents and eligibility"
    },
    {
      id: "n1",
      type: "NGO onboarding",
      role: "NGO",
      status: "Documents uploaded",
      note: "Validate registration certificates"
    },
    {
      id: "d1",
      type: "Donor organization",
      role: "Donor",
      status: "KYC complete",
      note: "Ready for funding workflows"
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Verifications connect to student, NGO, and donor records. Individual student data cannot be
        edited from here; only verification status is managed.
      </p>
      <Card>
        <div className="grid grid-cols-5 gap-3 border-b border-slate-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800">
          <span>Type</span>
          <span>Role</span>
          <span>Status</span>
          <span>Notes</span>
          <span className="text-right">Action</span>
        </div>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-5 gap-3 px-4 py-3">
              <span className="font-medium">{item.type}</span>
              <span>{item.role}</span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {item.status}
              </span>
              <span className="text-slate-500 dark:text-slate-400">{item.note}</span>
              <div className="flex items-center justify-end gap-2">
                <button className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Approve
                </button>
                <button className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminFinancialOversightSection() {
  type AidQueueItem = {
    _id?: string;
    id?: string;
    category?: string;
    amount?: string;
    status?: string;
    userId?: string;
    firebaseUid?: string;
    createdAt?: string;
    reviewNote?: string | null;
  };

  type FilterKey = "all" | "emergency" | "equipment" | "boarding" | "tuition";

  const [requests, setRequests] = useState<AidQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const normalizeCategory = (category?: string): FilterKey | "other" => {
    const value = String(category ?? "").trim().toLowerCase();
    if (!value || value.includes("emergency")) return "emergency";
    if (value.includes("equipment")) return "equipment";
    if (value.includes("meal") || value.includes("voucher") || value.includes("boarding")) return "boarding";
    if (value.includes("tuition") || value.includes("maintenance") || value.includes("fee")) return "tuition";
    return "other";
  };

  const formatCategory = (category?: string) => {
    const normalized = normalizeCategory(category);
    if (normalized === "emergency") return "Emergency aid";
    if (normalized === "equipment") return "Equipment support";
    if (normalized === "boarding") return "Meal voucher support";
    if (normalized === "tuition") return "Tuition support";
    return category || "Other aid";
  };

  const normalizeStatus = (status?: string): "Approved" | "Rejected" | "Pending" => {
    const value = String(status ?? "").trim().toLowerCase();
    if (value === "approved") return "Approved";
    if (value === "rejected") return "Rejected";
    return "Pending";
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/aid-requests?scope=all");
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError((body as { message?: string; error?: string }).message ?? "Unable to load aid requests.");
        setRequests([]);
        return;
      }

      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to load aid requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateRequestStatus = async (id: string, status: "Approved" | "Rejected") => {
    setUpdatingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/aid-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError((body as { message?: string; error?: string }).message ?? "Unable to update request status.");
        return;
      }

      await loadRequests();
    } catch {
      setError("Unable to update request status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (activeFilter === "all") return true;
    return normalizeCategory(request.category) === activeFilter;
  });

  const pendingApprovals = requests.filter((request) => normalizeStatus(request.status) === "Pending").length;
  const approvedCount = requests.filter((request) => normalizeStatus(request.status) === "Approved").length;
  const equipmentApproved = requests.filter(
    (request) => normalizeCategory(request.category) === "equipment" && normalizeStatus(request.status) === "Approved"
  ).length;

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "emergency", label: "Emergency" },
    { key: "equipment", label: "Equipment" },
    { key: "boarding", label: "Meal voucher" },
    { key: "tuition", label: "Tuition" }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Review and decide student aid requests by category. Changes here are reflected directly in student dashboards.
      </p>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeFilter === filter.key
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading funding queue...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No aid requests in this category.</p>
        ) : (
          <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
            {filteredRequests.map((request, index) => {
              const id = request._id || request.id || `request-${index}`;
              const status = normalizeStatus(request.status);
              return (
                <div key={id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{formatCategory(request.category)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Requester: {request.userId || request.firebaseUid || "N/A"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Amount: {request.amount ? `LKR ${request.amount}` : "N/A"}
                    </p>
                    {request.reviewNote ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Note: {request.reviewNote}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : status === "Rejected"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {status}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateRequestStatus(id, "Approved")}
                      disabled={updatingId === id || status === "Approved"}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-900/40 dark:text-emerald-300"
                    >
                      {updatingId === id ? "Updating..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRequestStatus(id, "Rejected")}
                      disabled={updatingId === id || status === "Rejected"}
                      className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-900/40 dark:text-rose-300"
                    >
                      {updatingId === id ? "Updating..." : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Approved requests" value={String(approvedCount)} description="All aid categories" />
        <StatCard label="Pending approvals" value={String(pendingApprovals)} description="Needs review now" />
        <StatCard label="Equipment approved" value={String(equipmentApproved)} description="Handover candidates" />
      </div>
    </div>
  );
}

function AdminCareerServicesSection() {
  const postings = [
    {
      id: "j1",
      title: "Software Engineering Intern",
      employer: "TechCorp Lanka",
      status: "Awaiting approval"
    },
    {
      id: "j2",
      title: "Part-time Data Analyst",
      employer: "Insight Analytics",
      status: "Approved - live"
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Career services connects student profiles with approved employer postings. Mentors and other
        external roles cannot change postings from this screen.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Job postings moderation</h3>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {postings.map((p) => (
            <div key={p.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-slate-500">Employer: {p.employer}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {p.status}
                </span>
                <button className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Approve
                </button>
                <button className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminMentorshipProgramSection() {
  const pairs = [
    { id: "m1", mentor: "Alumni mentor", mentee: "Student", status: "Active" },
    { id: "m2", mentor: "Industry mentor", mentee: "Student", status: "Pending first session" }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Mentorship program connects mentors and students only. Donors and NGOs are not visible in
        this workspace.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Active mentorship pairs</h3>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {pairs.map((p) => (
            <div key={p.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {p.mentor} {"->"} {p.mentee}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminReportsSection() {
  const reports = [
    {
      id: "rep1",
      name: "Student support metrics",
      description: "Utilization of aid, mentorship, and wellness programs",
      scope: "Anonymized"
    },
    {
      id: "rep2",
      name: "Financial aid distribution",
      description: "Breakdown by faculty, gender, and income band",
      scope: "Anonymized"
    },
    {
      id: "rep3",
      name: "Graduation outcomes",
      description: "Placement and higher study stats",
      scope: "Aggregated"
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Reports are anonymized and aggregated. Financial actors cannot see individual wellness or
        counseling details.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Available report templates</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="mt-1 text-xs text-slate-500">{r.description}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {r.scope}
                </span>
                <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90">
                  Generate
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminAnnouncementsSection() {
  const announcements = [
    {
      id: "a1",
      audience: "All students",
      title: "Emergency aid application window",
      visibility: "Students / Parents / Faculty"
    },
    {
      id: "a2",
      audience: "Final-year students",
      title: "Campus recruitment drive",
      visibility: "Students / Employers / Career office"
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Announcements reach students, parents, and faculty by default. External roles only see
        notices that are relevant to them.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Recent announcements</h3>
        <div className="space-y-3 text-sm">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {a.audience}
              </p>
              <p className="mt-1 font-semibold">{a.title}</p>
              <p className="mt-1 text-xs text-slate-500">Visible to: {a.visibility}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminProfileSection() {
  return (
    <RoleProfileShell roleLabel="Admin / faculty profile">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This profile controls only your own admin or faculty account. You cannot change other
          users from here.
        </p>
        <Card className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Display name
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Department / office
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="E.g. Student Affairs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Notification preferences
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
                <option>Email + in-app</option>
                <option>Email only</option>
                <option>In-app only</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Department-level permissions
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
                <option>View-only</option>
                <option>Approve financial aid</option>
                <option>Full admin (this faculty)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Save changes
            </button>
          </div>
        </Card>
      </div>
    </RoleProfileShell>
  );
}



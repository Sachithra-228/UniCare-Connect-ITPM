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
  type CampusPayload = {
    events?: Array<{ id: string; title: string; date: string; type?: string }>;
    announcements?: Array<{ id: string; title: string; date: string; body: string }>;
    volunteerRoles?: Array<{ id: string; title: string; org: string; hoursPerWeek: string }>;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [campusData, setCampusData] = useState<CampusPayload>({});

  const [publishType, setPublishType] = useState<
    "announcement" | "event" | "club" | "discount" | "volunteer"
  >("announcement");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [body, setBody] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState<"academic" | "social" | "career">("social");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [org, setOrg] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [description, setDescription] = useState("");

  const loadCampusData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/campus-life");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "Unable to load campus updates.");
        setCampusData({});
        return;
      }
      const data = (await response.json()) as CampusPayload;
      setCampusData(data ?? {});
    } catch {
      setError("Unable to load campus updates.");
      setCampusData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampusData();
  }, [loadCampusData]);

  const resetDraft = () => {
    setTitle("");
    setBody("");
    setTime("");
    setLocation("");
    setName("");
    setCategory("");
    setOrg("");
    setHoursPerWeek("");
    setDescription("");
  };

  const submitCampusUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload: Record<string, unknown> = { type: publishType };
    if (publishType === "announcement") {
      payload.title = title.trim();
      payload.date = date;
      payload.body = body.trim();
    } else if (publishType === "event") {
      payload.title = title.trim();
      payload.date = date;
      payload.time = time.trim();
      payload.location = location.trim();
      payload.eventType = eventType;
      payload.description = description.trim();
    } else if (publishType === "club") {
      payload.name = name.trim();
      payload.category = category.trim();
      payload.description = description.trim();
    } else if (publishType === "discount") {
      payload.name = name.trim();
      payload.category = category.trim();
      payload.description = description.trim();
      payload.location = location.trim();
    } else {
      payload.title = title.trim();
      payload.org = org.trim();
      payload.hoursPerWeek = hoursPerWeek.trim();
      payload.location = location.trim();
      payload.description = description.trim();
    }

    setSaving(true);
    try {
      const response = await fetch("/api/campus-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(data.message ?? "Unable to publish campus update.");
        return;
      }

      setMessage("Campus update published successfully.");
      resetDraft();
      await loadCampusData();
    } catch {
      setError("Unable to publish campus update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Publish campus updates for students. These updates appear in Student Campus Life and trigger
        role-based notifications.
      </p>

      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">Publish campus update</h3>
        <form className="space-y-3" onSubmit={submitCampusUpdate}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Update type</label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={publishType}
                onChange={(event) =>
                  setPublishType(event.target.value as "announcement" | "event" | "club" | "discount" | "volunteer")
                }
              >
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
                <option value="club">Club</option>
                <option value="discount">Discount</option>
                <option value="volunteer">Volunteer role</option>
              </select>
            </div>

            {(publishType === "announcement" || publishType === "event") && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {(publishType === "announcement" || publishType === "event" || publishType === "volunteer") && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Title</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
          )}

          {(publishType === "club" || publishType === "discount") && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          {publishType === "event" && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Time</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  placeholder="10:00-16:00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Location</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Event category</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value as "academic" | "social" | "career")}
                >
                  <option value="social">Social</option>
                  <option value="academic">Academic</option>
                  <option value="career">Career</option>
                </select>
              </div>
            </div>
          )}

          {(publishType === "discount" || publishType === "volunteer") && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Location</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  required
                />
              </div>
              {publishType === "volunteer" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Hours per week</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                    value={hoursPerWeek}
                    onChange={(event) => setHoursPerWeek(event.target.value)}
                    required
                  />
                </div>
              ) : null}
            </div>
          )}

          {(publishType === "club" || publishType === "discount") && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              />
            </div>
          )}

          {publishType === "volunteer" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Organization</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={org}
                onChange={(event) => setOrg(event.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {publishType === "announcement" ? "Message" : "Description"}
            </label>
            <textarea
              className="min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              value={publishType === "announcement" ? body : description}
              onChange={(event) =>
                publishType === "announcement"
                  ? setBody(event.target.value)
                  : setDescription(event.target.value)
              }
              required
            />
          </div>

          {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Publishing..." : "Publish update"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Recent announcements</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading announcements...</p>
        ) : !campusData.announcements?.length ? (
          <p className="text-sm text-slate-500">No announcements yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {(campusData.announcements ?? []).slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {item.date}
                </p>
                <p className="mt-1 font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Upcoming events and volunteer roles</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading campus feed...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Events</p>
              {(campusData.events ?? []).slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.date}</p>
                </div>
              ))}
              {!campusData.events?.length ? <p className="text-sm text-slate-500">No events yet.</p> : null}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Volunteer roles</p>
              {(campusData.volunteerRoles ?? []).slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.org} - {item.hoursPerWeek}</p>
                </div>
              ))}
              {!campusData.volunteerRoles?.length ? (
                <p className="text-sm text-slate-500">No volunteer roles yet.</p>
              ) : null}
            </div>
          </div>
        )}
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



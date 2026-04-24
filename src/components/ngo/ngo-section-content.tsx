"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "@/components/shared/Card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Megaphone, Sparkles, MessageCircle, Calendar, Users } from "lucide-react";
import { useAuth } from "@/context/auth-context";

import {
  defaultPreferences,
  mergePreferences,
  tabVariants,
  type ProfilePreferences,
  type ProfileTab
} from "@/components/profile/profile-preferences";
import {
  getNgoPrograms,
  getNgoBeneficiaries,
  getNgoApplications,
  getNgoVerificationNotifications,
  getNgoFundingRecords,
  getNgoPartnerships,
  getNgoCommunications,
  getNgoReports,
  getNgoImpactStories,
  getNgoSummaryStats,
  addNgoProgram,
  updateNgoProgram,
  deleteNgoProgram,
  disburseNgoPayment,
  addNgoPartnership,
  updateNgoPartnership,
  deleteNgoPartnership,
  getEligiblePartners,
  addNgoCommunication,
  addNgoFundingRecord,



  markReportGenerated,
  markNgoVerificationNotificationRead,
  markAllNgoVerificationNotificationsRead,
  type NgoProgram,
  type NgoReport,
  type NgoPartnership,
  type NgoVerificationNotification,
} from "@/lib/ngo-demo-store";


function fmtLKR(n: number) {
  if (n >= 1_000_000) return `LKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `LKR ${(n / 1_000).toFixed(0)}K`;
  return `LKR ${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  active:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  paused:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  draft:      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  received:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  allocated:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  disbursed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  canceled:   "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  graduated:  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",

  "on-track": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "at-risk":  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>
      {label ?? status}
    </span>
  );
}

function ConnBadge({ party }: { party: "student" | "admin" | "donor" }) {
  const cfg = {
    student: { bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", label: "Student" },
    admin: { bg: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", label: "University Admin" },
    donor: { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Donor" },
  }[party];

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}
type NgoSectionContentProps = { sectionId: string };

export function NgoSectionContent({ sectionId }: NgoSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "organization-home": return NgoOrganizationHomeSection;
      case "programs":          return NgoProgramsSection;
      case "funding":           return NgoFundingSection;
      case "beneficiaries":     return NgoBeneficiariesSection;
      case "reports":           return NgoReportsSection;
      case "partnerships":      return NgoPartnershipsSection;
      case "communications":    return NgoCommunicationsSection;
      case "profile":           return NgoProfileSection;
      default:                  return NgoOrganizationHomeSection;
    }
  }, [sectionId]);
  return <Section />;
}


function NgoOrganizationHomeSection() {
  const [stats, setStats] = useState(getNgoSummaryStats());
  const [stories, setStories] = useState(getNgoImpactStories());

  useEffect(() => {
    setStats(getNgoSummaryStats());
    setStories(getNgoImpactStories());
  }, []);

  const storyPartyColor: Record<string, string> = {
    student: "border-l-blue-500",
    admin: "border-l-violet-500",
    donor: "border-l-amber-500",
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Programs" value={String(stats.activeProgs)} description="Running support initiatives" />
        <StatCard label="Beneficiaries" value={String(stats.totalBeneficiaries)} description="Students receiving support" />
        <StatCard label="Total Budget" value={fmtLKR(stats.totalBudget)} description="Total allocated for programs" />
        <StatCard label="Donor Contributions" value={fmtLKR(stats.totalDonorContributions)} description="Actual funds received" />
      </div>


      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            party: "student" as const,
            label: "Student Connection",
            count: stats.totalBeneficiaries,
            detail: "Beneficiaries enrolled in active programs"
          },
          {
            party: "admin" as const,
            label: "University Admin Connection",
            count: 4,
            detail: "University partners verifying eligibility"
          },
          {
            party: "donor" as const,
            label: "Donor Connection",
            count: getNgoFundingRecords().filter((f) => f.status !== "pending").length,
            detail: "Active donor contributions"
          },
        ].map((item) => (
          <div key={item.party} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{item.count}</p>
            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            <div className="mt-2">
              <ConnBadge party={item.party} />
            </div>
          </div>
        ))}
      </div>

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Impact Stories</h3>
        <div className="space-y-3">
          {stories.slice(0, 4).map((s) => (
            <div
              key={s._id}
              className={`rounded-xl border-l-4 bg-slate-50 p-3 dark:bg-slate-800/50 ${storyPartyColor[s.connectedParty] ?? "border-l-slate-400"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{s.title}</p>
                <ConnBadge party={s.connectedParty} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{s.summary}</p>
              <p className="mt-1 text-[10px] text-slate-400">{fmtDate(s.date)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function NgoProgramsSection() {
  const [programs, setPrograms] = useState(getNgoPrograms());
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "completed">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    eligibility: "",
    targetUniversity: "",
    category: "education" as NgoProgram["category"],
    status: "active" as NgoProgram["status"]
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  const filtered = programs.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.targetUniversity.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    } else if (form.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!form.targetUniversity.trim()) {
      newErrors.targetUniversity = "Target university is required";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!form.budget) {
      newErrors.budget = "Budget is required";
    } else if (Number(form.budget) <= 0) {
      newErrors.budget = "Budget must be a positive number";
    }

    if (!form.eligibility.trim()) {
      newErrors.eligibility = "Eligibility criteria are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);

    setTimeout(() => {
      if (editingId) {
        const updated = updateNgoProgram(editingId, {
          title: form.title,
          description: form.description,
          category: form.category as NgoProgram["category"],
          status: form.status,
          budget: Number(form.budget) || 0,
          eligibility: form.eligibility,
          targetUniversity: form.targetUniversity,
        });
        if (updated) {
          setPrograms((prev) => prev.map((p) => (p._id === editingId ? updated : p)));
        }
      } else {
        const created = addNgoProgram({
          title: form.title,
          description: form.description,
          category: form.category,
          status: form.status,
          budget: Number(form.budget) || 0,
          disbursed: 0,
          beneficiaryCount: 0,
          eligibility: form.eligibility,
          targetUniversity: form.targetUniversity,
          connectedTo: ["student", "admin"],
        });
        setPrograms([created, ...programs]);
      }
      resetForm();
      setSaving(false);
    }, 600);
  };

  const handleDelete = () => {
    if (!editingId || !window.confirm("Are you sure you want to remove this program?")) return;
    deleteNgoProgram(editingId);
    setPrograms((prev) => prev.filter((p) => p._id !== editingId));
    resetForm();
  };

  const resetForm = () => {
    setForm({ title: "", description: "", budget: "", eligibility: "", targetUniversity: "", category: "education", status: "active" });
    setErrors({});
    setShowForm(false);
    setEditingId(null);
  };


  const openEdit = (p: NgoProgram) => {
    setEditingId(p._id);
    setForm({
      title: p.title,
      description: p.description,
      budget: String(p.budget),
      eligibility: p.eligibility,
      targetUniversity: p.targetUniversity,
      category: p.category,
      status: p.status
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex flex-wrap gap-1.5">
          {(["all", "active", "paused", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Button variant="primary" className="ml-auto" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? "Cancel" : "+ Create Program"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div key="form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="space-y-4 border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-800 dark:bg-emerald-900/10">
              <h3 className="text-sm font-semibold">{editingId ? "Update Program" : "New Support Program"}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Title *</label>
                  <Input 
                    value={form.title} 
                    onChange={(e) => {
                      setForm((f) => ({ ...f, title: e.target.value }));
                      if (errors.title) setErrors(prev => { const n = {...prev}; delete n.title; return n; });
                    }} 
                    placeholder="Program title"
                    className={errors.title ? "border-rose-500 focus:border-rose-500" : ""}
                  />
                  {errors.title && <p className="text-[10px] text-rose-500">{errors.title}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as NgoProgram["category"] }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                  >
                    {["education", "health", "emergency", "equipment", "general"].map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NgoProgram["status"] }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                  >
                    {["active", "paused", "completed"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Target University</label>
                  <Input 
                    value={form.targetUniversity} 
                    onChange={(e) => {
                      setForm((f) => ({ ...f, targetUniversity: e.target.value }));
                      if (errors.targetUniversity) setErrors(prev => { const n = {...prev}; delete n.targetUniversity; return n; });
                    }} 
                    placeholder="University name"
                    className={errors.targetUniversity ? "border-rose-500 focus:border-rose-500" : ""}
                  />
                  {errors.targetUniversity && <p className="text-[10px] text-rose-500">{errors.targetUniversity}</p>}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, description: e.target.value }));
                      if (errors.description) setErrors(prev => { const n = {...prev}; delete n.description; return n; });
                    }}
                    className={`min-h-[72px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:bg-slate-900 ${
                      errors.description ? "border-rose-500 focus:border-rose-500" : "border-slate-200 dark:border-slate-700"
                    }`}
                    placeholder="What does this program do?"
                  />
                  {errors.description && <p className="text-[10px] text-rose-500">{errors.description}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Budget (LKR)</label>
                  <Input 
                    type="number" 
                    value={form.budget} 
                    onChange={(e) => {
                      setForm((f) => ({ ...f, budget: e.target.value }));
                      if (errors.budget) setErrors(prev => { const n = {...prev}; delete n.budget; return n; });
                    }} 
                    placeholder="e.g. 1500000"
                    className={errors.budget ? "border-rose-500 focus:border-rose-500" : ""}
                  />
                  {errors.budget && <p className="text-[10px] text-rose-500">{errors.budget}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Eligibility Criteria</label>
                  <Input 
                    value={form.eligibility} 
                    onChange={(e) => {
                      setForm((f) => ({ ...f, eligibility: e.target.value }));
                      if (errors.eligibility) setErrors(prev => { const n = {...prev}; delete n.eligibility; return n; });
                    }} 
                    placeholder="e.g. Financial need: High | GPA >= 2.5"
                    className={errors.eligibility ? "border-rose-500 focus:border-rose-500" : ""}
                  />
                  {errors.eligibility && <p className="text-[10px] text-rose-500">{errors.eligibility}</p>}
                </div>

              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Student applications are routed to university admin verification.</p>
                <div className="flex items-center gap-3">
                  {editingId && (
                    <button type="button" onClick={handleDelete} className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400">
                      Remove Program
                    </button>
                  )}
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Program" : "Create Program"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No programs match your filter.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <motion.div key={p._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => openEdit(p)} className="cursor-pointer">
              <Card className="space-y-3 p-5 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.title}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">{p.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>{p.targetUniversity}</span>
                  <span>{p.beneficiaryCount} beneficiaries</span>
                  <span>{fmtLKR(p.budget)}</span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                    <span>Disbursed</span>
                    <span>{fmtLKR(p.disbursed)} / {fmtLKR(p.budget)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, p.budget > 0 ? (p.disbursed / p.budget) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Eligibility: {p.eligibility}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
function NgoFundingSection() {
  const [records, setRecords] = useState(getNgoFundingRecords());
  const programs = getNgoPrograms();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    donorName: "",
    donorType: "corporate" as const,
    amount: 0,
    programId: programs[0]?._id || "",
    status: "received" as const,
  });

  useEffect(() => {
    const sync = () => {
      setRecords(getNgoFundingRecords());
    };
    sync();
    const interval = window.setInterval(sync, 2000);
    return () => window.clearInterval(interval);
  }, []);

  const totalReceived = records.reduce((s, r) => s + r.amount, 0);
  const totalDisbursed = programs.reduce((s, p) => s + p.disbursed, 0);
  const totalAllocated = records
    .filter((r) => r.status === "allocated" || r.status === "disbursed")
    .reduce((s, r) => s + r.amount, 0);
  const pending = records
    .filter((r) => r.status === "pending" || r.status === "received")
    .reduce((s, r) => s + r.amount, 0);

  const handleAddRecord = () => {
    if (!newRecord.donorName || newRecord.amount <= 0) return;
    const prog = programs.find(p => p._id === newRecord.programId);
    addNgoFundingRecord({
      ...newRecord,
      allocatedTo: prog?.title || "General Fund",
      date: new Date().toISOString()
    });
    
    // Refresh local state immediately
    const updated = getNgoFundingRecords();
    setRecords(updated);
    setShowAddForm(false);
    
    // Reset form
    setNewRecord({
      donorName: "",
      donorType: "corporate",
      amount: 0,
      programId: programs[0]?._id || "",
      status: "received",
    });
  };


  const chartData = programs.map((p) => ({
    name: p.title.split(" ").slice(0, 3).join(" "),
    Budget: p.budget / 1000,
    Disbursed: p.disbursed / 1000,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Funding Overview</h3>
        <Button variant="primary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Funding Record"}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="space-y-4 p-5 border-primary/20 bg-primary/5">
              <p className="text-sm font-semibold">New Funding Contribution</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Donor Name</label>
                  <Input value={newRecord.donorName} onChange={e => setNewRecord({...newRecord, donorName: e.target.value})} placeholder="e.g. Dialog Axiata" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Type</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                    value={newRecord.donorType} onChange={e => setNewRecord({...newRecord, donorType: e.target.value as any})}>
                    <option value="corporate">Corporate</option>
                    <option value="government">Government</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Amount (LKR)</label>
                  <Input type="number" value={newRecord.amount || ""} onChange={e => setNewRecord({...newRecord, amount: Number(e.target.value)})} placeholder="500000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Program</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                    value={newRecord.programId} onChange={e => setNewRecord({...newRecord, programId: e.target.value})}>
                    <option value="">General Fund</option>
                    {programs.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" onClick={handleAddRecord} disabled={!newRecord.donorName || newRecord.amount <= 0}>Save Contribution</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Received" value={fmtLKR(totalReceived)} description="All donor contributions" />
        <StatCard label="Allocated" value={fmtLKR(totalAllocated)} description="Assigned to programs" />
        <StatCard label="Disbursed" value={fmtLKR(totalDisbursed)} description="Paid out to students" />
        <StatCard label="Pending" value={fmtLKR(pending)} description="Awaiting allocation" />
      </div>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-semibold">Budget vs Disbursed by Program (LKR 000s)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-semibold">Donor Contributions History</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="pb-2 text-left font-semibold text-slate-500">Donor</th>
                <th className="pb-2 text-left font-semibold text-slate-500">Amount</th>
                <th className="pb-2 text-left font-semibold text-slate-500">Allocated To</th>
                <th className="pb-2 text-left font-semibold text-slate-500">Date</th>
                <th className="pb-2 text-left font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((r) => (
                <tr key={r._id}>
                  <td className="py-2 font-medium text-slate-800 dark:text-white">
                    <div>{r.donorName}</div>
                    <span className="text-[10px] capitalize text-slate-400">{r.donorType}</span>
                  </td>
                  <td className="py-2 font-semibold text-slate-900 dark:text-slate-100">{fmtLKR(r.amount)}</td>
                  <td className="max-w-[120px] truncate py-2 text-slate-600 dark:text-slate-300">{r.allocatedTo}</td>
                  <td className="py-2 text-slate-500">{fmtDate(r.date)}</td>
                  <td className="py-2"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

}
function NgoBeneficiariesSection() {
  const [beneficiaries, setBeneficiaries] = useState(getNgoBeneficiaries());
  const [verificationNotifications, setVerificationNotifications] = useState<NgoVerificationNotification[]>(
    getNgoVerificationNotifications()
  );
  const programs = getNgoPrograms();
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "graduated" | "paused">("all");

  useEffect(() => {
    setBeneficiaries(getNgoBeneficiaries());
    setVerificationNotifications(getNgoVerificationNotifications());
    const intervalId = window.setInterval(() => {
      setBeneficiaries(getNgoBeneficiaries());
      setVerificationNotifications(getNgoVerificationNotifications());
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  const filtered = beneficiaries.filter((b) => {
    const matchProg = filterProgram === "all" || b.programId === filterProgram;
    const matchStat = filterStatus === "all" || b.status === filterStatus;
    return matchProg && matchStat;
  });

  const retentionMap: Record<string, string> = {
    "on-track": "On Track",
    "at-risk": "At Risk",
    graduated: "Graduated",
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = beneficiaries.find((b) => b._id === selectedId);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const unreadVerifiedCount = verificationNotifications.filter((item) => !item.readAt).length;
  const verifiedNotifications = verificationNotifications
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openBeneficiaryDetails = (beneficiaryId: string, notificationId?: string) => {
    setSelectedId(beneficiaryId);
    if (notificationId) {
      markNgoVerificationNotificationRead(notificationId);
      setVerificationNotifications(getNgoVerificationNotifications());
    }
  };

  const handleDonate = () => {
    if (!selectedId) return;
    setProcessing(true);
    setTimeout(() => {
      const updated = disburseNgoPayment(selectedId);
      if (updated) {
        setBeneficiaries(getNgoBeneficiaries());
        setVerificationNotifications(getNgoVerificationNotifications());
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
      setProcessing(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Admin-verified requests</p>
            <p className="text-xs text-slate-500">
              University Admin / Faculty approved these applicants. Review details and donate directly from here.
            </p>
          </div>
          {unreadVerifiedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                markAllNgoVerificationNotificationsRead();
                setVerificationNotifications(getNgoVerificationNotifications());
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all as seen ({unreadVerifiedCount})
            </button>
          )}
        </div>

        {verifiedNotifications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700">
            No admin-verified requests yet.
          </p>
        ) : (
          <div className="space-y-2">
            {verifiedNotifications.map((notification) => {
              const matchedBeneficiary = beneficiaries.find((item) => item.applicationId === notification.applicationId);
              return (
                <div
                  key={notification._id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {notification.studentInitials} - {notification.programTitle}
                      {!notification.readAt && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          new
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {notification.university} - Requested {fmtLKR(notification.amountRequested)} - Verified {fmtDate(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={matchedBeneficiary?.isDisbursed ? "disbursed" : "pending"}
                      label={matchedBeneficiary?.isDisbursed ? "Donated" : "Ready to donate"}
                    />
                    <button
                      type="button"
                      disabled={!matchedBeneficiary}
                      onClick={() =>
                        matchedBeneficiary
                          ? openBeneficiaryDetails(matchedBeneficiary._id, notification._id)
                          : undefined
                      }
                      className="text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All Programs</option>
          {programs.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(["all", "active", "graduated", "paused"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filterStatus === s
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 text-center sm:grid-cols-4">
        {[
          { label: "Total", val: beneficiaries.length, color: "text-slate-700" },
          { label: "Active", val: beneficiaries.filter((b) => b.status === "active").length, color: "text-emerald-600" },
          {
            label: "At Risk",
            val: beneficiaries.filter((b) => b.retentionIndicator === "at-risk").length,
            color: "text-red-600"
          },
          {
            label: "Graduated",
            val: beneficiaries.filter((b) => b.status === "graduated").length,
            color: "text-purple-600"
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-semibold">Beneficiary Records ({filtered.length})</p>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No beneficiaries match this filter.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => (
              <div
                key={b._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {b.initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {b.initials}{" "}
                        {!b.consentRecorded && <span className="text-[10px] text-slate-400">(identity protected)</span>}
                      </p>
                      <p className="text-[11px] text-slate-500">{b.university}</p>
                      <p className="text-[11px] text-slate-500">Program: {b.programTitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} />
                    <StatusBadge status={b.retentionIndicator} label={retentionMap[b.retentionIndicator]} />
                    <button
                      type="button"
                      onClick={() => openBeneficiaryDetails(b._id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Requested</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{fmtLKR(b.supportRequested)}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Received</p>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{fmtLKR(b.supportReceived)}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300">Remaining</p>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {fmtLKR(Math.max(b.supportRequested - b.supportReceived, 0))}
                    </p>
                  </div>
                </div>

                {typeof b.lastDisbursedAmount === "number" && b.lastDisbursedAmount > 0 && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Last donation: <span className="font-semibold text-emerald-600">{fmtLKR(b.lastDisbursedAmount)}</span>{" "}
                    {b.lastDisbursedAt ? `on ${fmtDate(b.lastDisbursedAt)}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="w-full max-w-md overflow-hidden p-0 shadow-2xl">
                <div className="bg-gradient-to-br from-primary to-emerald-600 px-6 py-8 text-center text-white">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                    {selected.initials}
                  </div>
                  <h3 className="text-xl font-bold">{selected.initials}</h3>
                  <p className="text-sm opacity-90">{selected.university}</p>
                </div>

                <div className="space-y-4 p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Requested</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{fmtLKR(selected.supportRequested)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Received</p>
                      <p className="text-lg font-bold text-emerald-600">{fmtLKR(selected.supportReceived)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span className="text-slate-500">Program</span>
                      <span className="font-medium">{selected.programTitle}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span className="text-slate-500">Enrollment Date</span>
                      <span className="font-medium">{fmtDate(selected.enrolledAt)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span className="text-slate-500">Academic Status</span>
                      <StatusBadge status={selected.retentionIndicator} label={retentionMap[selected.retentionIndicator]} />
                    </div>
                  </div>

                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                    >
                      Donation processed successfully. University Admin notified.
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setSelectedId(null)}>
                      Close
                    </Button>
                    {!selected.isDisbursed && (
                      <Button variant="primary" className="flex-1" onClick={handleDonate} disabled={processing}>
                        {processing ? "Processing..." : "Donate Now"}
                      </Button>
                    )}
                  </div>

                  <p className="text-center text-[10px] text-slate-400">
                    Processing a donation notifies the University Admin to confirm disbursement to the student bank account.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
function NgoReportsSection() {
  const [reports, setReports] = useState(getNgoReports());
  const [programs, setPrograms] = useState(getNgoPrograms());
  const [applications, setApplications] = useState(getNgoApplications());
  const [beneficiaries, setBeneficiaries] = useState(getNgoBeneficiaries());
  const [verificationNotifications, setVerificationNotifications] = useState(getNgoVerificationNotifications());
  const [fundingRecords, setFundingRecords] = useState(getNgoFundingRecords());
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const audienceBadge: Record<string, { label: string; cls: string }> = {
    donors: { label: "For Donors", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    admin: { label: "For Admin", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    both: { label: "For Donors & Admin", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  };

  useEffect(() => {
    const sync = () => {
      setReports(getNgoReports());
      setPrograms(getNgoPrograms());
      setApplications(getNgoApplications());
      setBeneficiaries(getNgoBeneficiaries());
      setVerificationNotifications(getNgoVerificationNotifications());
      setFundingRecords(getNgoFundingRecords());
    };
    sync();
    const timer = window.setInterval(sync, 1500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!programs.length) {
      setSelectedProgramId("");
      return;
    }
    setSelectedProgramId((prev) => (prev && programs.some((p) => p._id === prev) ? prev : programs[0]._id));
  }, [programs]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program._id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  );

  const selectedProgramApplications = useMemo(
    () => applications.filter((application) => application.programId === selectedProgramId),
    [applications, selectedProgramId]
  );

  const selectedProgramBeneficiaries = useMemo(
    () => beneficiaries.filter((beneficiary) => beneficiary.programId === selectedProgramId),
    [beneficiaries, selectedProgramId]
  );

  const selectedProgramVerificationUpdates = useMemo(
    () => verificationNotifications.filter((notification) => notification.programId === selectedProgramId),
    [verificationNotifications, selectedProgramId]
  );

  const selectedProgramFunding = useMemo(
    () => fundingRecords.filter((record) => record.programId === selectedProgramId),
    [fundingRecords, selectedProgramId]
  );

  const selectedProgramStats = useMemo(() => {
    const pendingCount = selectedProgramApplications.filter((application) => application.status === "pending_admin").length;
    const verifiedCount = selectedProgramApplications.filter((application) => application.status === "verified_by_admin").length;
    const approvedCount = selectedProgramApplications.filter((application) => application.status === "approved_by_ngo").length;
    const rejectedCount = selectedProgramApplications.filter((application) => application.status === "rejected").length;
    const requestedAmount = selectedProgramApplications.reduce((sum, application) => sum + Math.max(application.amountRequested, 0), 0);
    const receivedAmount = selectedProgramBeneficiaries.reduce((sum, beneficiary) => sum + Math.max(beneficiary.supportReceived, 0), 0);
    const remainingAmount = Math.max(requestedAmount - receivedAmount, 0);
    const onTrackCount = selectedProgramBeneficiaries.filter(
      (beneficiary) => beneficiary.retentionIndicator === "on-track" || beneficiary.retentionIndicator === "graduated"
    ).length;
    const retentionRate =
      selectedProgramBeneficiaries.length > 0 ? Math.round((onTrackCount / selectedProgramBeneficiaries.length) * 100) : 0;

    return {
      pendingCount,
      verifiedCount,
      approvedCount,
      rejectedCount,
      requestedAmount,
      receivedAmount,
      remainingAmount,
      retentionRate,
    };
  }, [selectedProgramApplications, selectedProgramBeneficiaries]);

  const selectedProgramUpdates = useMemo(() => {
    const updates = [
      ...selectedProgramApplications.map((application) => ({
        id: `application-${application._id}`,
        date: application.appliedAt,
        title: "Student application submitted",
        detail: `${application.studentInitials} requested ${fmtLKR(application.amountRequested)} (${String(application.status).replace(/_/g, " ")})`,
      })),
      ...selectedProgramVerificationUpdates.map((notification) => ({
        id: `verification-${notification._id}`,
        date: notification.createdAt,
        title: "University verification update",
        detail: `${notification.studentInitials} verified for ${fmtLKR(notification.amountRequested)}`,
      })),
      ...selectedProgramBeneficiaries.map((beneficiary) => ({
        id: `beneficiary-${beneficiary._id}`,
        date: beneficiary.lastDisbursedAt ?? beneficiary.enrolledAt,
        title: beneficiary.lastDisbursedAmount && beneficiary.lastDisbursedAmount > 0 ? "Donation completed" : "Beneficiary enrolled",
        detail:
          beneficiary.lastDisbursedAmount && beneficiary.lastDisbursedAmount > 0
            ? `${beneficiary.initials} received ${fmtLKR(beneficiary.lastDisbursedAmount)}`
            : `${beneficiary.initials} enrolled in beneficiary list`,
      })),
      ...selectedProgramFunding.map((record) => ({
        id: `funding-${record._id}`,
        date: record.date,
        title: "Funding status update",
        detail: `${record.donorName} ${record.status} ${fmtLKR(record.amount)}`,
      })),
    ];

    return updates
      .filter((update) => !!update.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [
    selectedProgramApplications,
    selectedProgramBeneficiaries,
    selectedProgramFunding,
    selectedProgramVerificationUpdates,
  ]);

  const handleGenerate = (id: string) => {
    setGeneratingId(id);
    setTimeout(() => {
      const updated = markReportGenerated(id);
      if (updated) {
        setReports((prev) => prev.map((r) => (r._id === id ? updated : r)));
        setToast(`Report \"${updated.title}\" generated successfully.`);
        setTimeout(() => setToast(null), 3500);
      }
      setGeneratingId(null);
    }, 1000);
  };

  const handleExportPdf = (report?: NgoReport) => {
    if (!selectedProgram) {
      setToast("Select a program before exporting the PDF report.");
      setTimeout(() => setToast(null), 3500);
      return;
    }

    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      setToast("Please allow pop-ups to export PDF.");
      setTimeout(() => setToast(null), 3500);
      return;
    }

    const esc = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const generatedAt = new Date().toLocaleString("en-LK");
    const selectedProgramChartSeries = [
      { label: "Applications", value: selectedProgramApplications.length, color: "#2563eb" },
      { label: "Approved + Verified", value: selectedProgramStats.approvedCount + selectedProgramStats.verifiedCount, color: "#10b981" },
      { label: "Beneficiaries", value: selectedProgramBeneficiaries.length, color: "#8b5cf6" },
      { label: "Retention %", value: selectedProgramStats.retentionRate, color: "#f59e0b" },
    ];
    const maxSeries = Math.max(...selectedProgramChartSeries.map((item) => item.value), 1);
    const svgWidth = 760;
    const rowHeight = 34;
    const chartPaddingTop = 10;
    const barLabelX = 10;
    const barX = 210;
    const barMaxWidth = 430;
    const valueX = barX + barMaxWidth + 16;
    const chartHeight = chartPaddingTop + selectedProgramChartSeries.length * rowHeight + 8;
    const chartRowsSvg = selectedProgramChartSeries
      .map((item, index) => {
        const y = chartPaddingTop + index * rowHeight;
        const barWidth = Math.max((item.value / maxSeries) * barMaxWidth, item.value > 0 ? 14 : 4);
        return `
          <text x="${barLabelX}" y="${y + 14}" font-size="12" fill="#334155">${esc(item.label)}</text>
          <rect x="${barX}" y="${y}" width="${barMaxWidth}" height="14" rx="7" fill="#ffffff" stroke="#cbd5e1" />
          <rect x="${barX}" y="${y}" width="${barWidth}" height="14" rx="7" fill="${item.color}" stroke="#1e293b" stroke-width="0.3" />
          <text x="${valueX}" y="${y + 14}" font-size="12" font-weight="700" fill="#0f172a">${item.value}</text>
        `;
      })
      .join("");
    const chartHtml = `
      <svg class="chart-svg" viewBox="0 0 ${svgWidth} ${chartHeight}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Program chart">
        ${chartRowsSvg}
      </svg>
    `;

    const updateHtml = selectedProgramUpdates.length
      ? selectedProgramUpdates
          .map(
            (update) =>
              `<li><strong>${esc(update.title)}</strong> - ${esc(update.detail)} <span class="muted">(${esc(fmtDate(update.date))})</span></li>`
          )
          .join("")
      : "<li>No updates recorded for this program yet.</li>";

    const exportTitle = report?.title ?? "Program Report";
    const exportDescription =
      report?.description ??
      "Program-level summary with applications, verification updates, donations, and retention indicators.";

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${exportTitle} - UniCare NGO Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            .header { margin-bottom: 16px; }
            .title { font-size: 24px; font-weight: 700; margin: 0 0 6px; }
            .meta { font-size: 12px; color: #475569; }
            .desc { margin: 14px 0 20px; font-size: 14px; line-height: 1.5; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
            .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
            .label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
            .value { font-size: 18px; font-weight: 700; }
            .section-title { margin: 24px 0 8px; font-size: 16px; font-weight: 700; }
            .list { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; }
            .muted { color: #64748b; font-size: 12px; }
            .bar-chart { margin-top: 10px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
            .chart-svg { display: block; width: 100%; height: auto; }
            @media print {
              body { padding: 12px; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">${esc(exportTitle)} - ${esc(selectedProgram.title)}</p>
            <p class="meta">Generated: ${generatedAt}</p>
          </div>
          <p class="desc">${esc(exportDescription)}</p>
          <p class="meta">
            Program status: ${esc(selectedProgram.status)} | University: ${esc(selectedProgram.targetUniversity)} | Budget: ${esc(fmtLKR(selectedProgram.budget))}
          </p>
          <p class="meta">
            Program created: ${esc(fmtDate(selectedProgram.createdAt))} | Last updated: ${esc(fmtDate(selectedProgram.updatedAt))}
          </p>
          <div class="grid">
            <div class="card">
              <div class="label">Applications</div>
              <div class="value">${selectedProgramApplications.length}</div>
            </div>
            <div class="card">
              <div class="label">Approved / Verified</div>
              <div class="value">${selectedProgramStats.approvedCount + selectedProgramStats.verifiedCount}</div>
            </div>
            <div class="card">
              <div class="label">Funds Received</div>
              <div class="value">${fmtLKR(selectedProgramStats.receivedAmount)}</div>
            </div>
            <div class="card">
              <div class="label">Remaining Need</div>
              <div class="value">${fmtLKR(selectedProgramStats.remainingAmount)}</div>
            </div>
            <div class="card">
              <div class="label">Total Requested</div>
              <div class="value">${fmtLKR(selectedProgramStats.requestedAmount)}</div>
            </div>
            <div class="card">
              <div class="label">Pending Requests</div>
              <div class="value">${selectedProgramStats.pendingCount}</div>
            </div>
          </div>
          <p class="section-title">Program Chart</p>
          <div class="bar-chart">
            ${chartHtml}
          </div>
          <p class="section-title">Program Updates</p>
          <ul class="list">
            ${updateHtml}
          </ul>
        </body>
      </html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 250);
  };

  const stats = getNgoSummaryStats();
  const chartData = [
    { name: "Students Helped", value: stats.totalBeneficiaries },
    { name: "Active Programs", value: stats.activeProgs * 20 },
    { name: "Retention %", value: stats.retentionRate },
  ];
  const barColors = ["#2563eb", "#10b981", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {toast}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Program-specific Report Export</p>
            <p className="mt-1 text-xs text-slate-500">
              Select a program to include its applications, verification updates, and donation progress in the exported PDF.
            </p>
          </div>
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Program</label>
              <select
                value={selectedProgramId}
                onChange={(event) => setSelectedProgramId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
              >
                {programs.length === 0 && <option value="">No program available</option>}
                {programs.map((program) => (
                  <option key={program._id} value={program._id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => {
                handleExportPdf();
              }}
              disabled={!selectedProgram}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {selectedProgram ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-[11px] text-slate-500">Applications</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedProgramApplications.length}</p>
              <p className="text-[11px] text-slate-500">
                Pending {selectedProgramStats.pendingCount} | Rejected {selectedProgramStats.rejectedCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-[11px] text-slate-500">Verified & Approved</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedProgramStats.verifiedCount + selectedProgramStats.approvedCount}
              </p>
              <p className="text-[11px] text-slate-500">Beneficiaries {selectedProgramBeneficiaries.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-[11px] text-slate-500">Funds Received</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{fmtLKR(selectedProgramStats.receivedAmount)}</p>
              <p className="text-[11px] text-slate-500">Remaining {fmtLKR(selectedProgramStats.remainingAmount)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-[11px] text-slate-500">Retention</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedProgramStats.retentionRate}%</p>
              <p className="text-[11px] text-slate-500">Budget {fmtLKR(selectedProgram.budget)}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
            Create at least one program to export program-specific reports.
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Program Updates</p>
          {selectedProgramUpdates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
              No updates yet for the selected program.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedProgramUpdates.map((update) => (
                <div key={update.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{update.title}</p>
                    <p className="text-[11px] text-slate-400">{fmtDate(update.date)}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{update.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-semibold">Key Metrics Overview</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 16 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={barColors[i % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => {
          const aud = audienceBadge[r.audience];
          return (
            <Card key={r._id} className="flex flex-col space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${aud.cls}`}>{aud.label}</span>
              </div>
              <p className="flex-1 text-xs text-slate-500">{r.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="text-slate-500">Students</p>
                  <p className="font-bold text-slate-800 dark:text-white">{r.metrics.studentsHelped}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="text-slate-500">Retention</p>
                  <p className="font-bold text-slate-800 dark:text-white">{r.metrics.retentionRate}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="text-slate-500">Funds Used</p>
                  <p className="font-bold text-slate-800 dark:text-white">{fmtLKR(r.metrics.fundsUtilized)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                  <p className="text-slate-500">Programs</p>
                  <p className="font-bold text-slate-800 dark:text-white">{r.metrics.programsActive}</p>
                </div>
              </div>
              {r.lastGenerated && (
                <p className="text-[10px] text-slate-400">Last generated: {fmtDate(r.lastGenerated)}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => handleGenerate(r._id)} disabled={generatingId === r._id}>
                  {generatingId === r._id ? "Generating..." : r.lastGenerated ? "Regenerate" : "Generate"}
                </Button>
                <Button onClick={() => handleExportPdf(r)} disabled={!selectedProgram}>
                  Export Selected Program PDF
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
function NgoPartnershipsSection() {
  const [partnerships, setPartnerships] = useState(getNgoPartnerships());
  const [eligiblePartners, setEligiblePartners] = useState<{_id: string; name: string; role: string; university?: string}[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    partnerUserId: "",
    partnerName: "",
    partnerType: "admin" as NgoPartnership["partnerType"],
    role: "",
    focusArea: "",
    status: "pending" as NgoPartnership["status"]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPartners() {
      setLoadingPartners(true);
      try {
        const res = await fetch("/api/users?roles=admin,faculty,donor");
        if (res.ok) {
          const data = await res.json();
          // The API returns an array directly in demo mode, or a paginated object in some cases.
          // Based on api/users/route.ts, it returns an array of mapped documents.
          setEligiblePartners(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch real partners:", err);
      } finally {
        setLoadingPartners(false);
      }
    }
    fetchPartners();
  }, []);

  // Filter eligible partners based on type
  const filteredEligible = eligiblePartners.filter(p => 
    (form.partnerType === "admin" && (p.role === "admin" || p.role === "faculty")) || 
    (form.partnerType === "donor" && p.role === "donor")
  );


  const handleSave = () => {
    if (!form.partnerName.trim() && !form.partnerUserId) return;
    setSaving(true);

    // If selecting a user from the system, use their name
    let finalPartnerName = form.partnerName;
    if (form.partnerUserId) {
      const selectedUser = eligiblePartners.find(u => u._id === form.partnerUserId);
      if (selectedUser) finalPartnerName = selectedUser.name;
    }

    setTimeout(() => {
      if (editingId) {
        const updated = updateNgoPartnership(editingId, {
          partnerUserId: form.partnerUserId,
          partnerName: finalPartnerName,
          partnerType: form.partnerType,
          role: form.role,
          focusArea: form.focusArea,
          status: form.status
        });
        if (updated) {
          setPartnerships((prev) => prev.map((p) => (p._id === editingId ? updated : p)));
        }
      } else {
        const p = addNgoPartnership({
          partnerUserId: form.partnerUserId,
          partnerName: finalPartnerName,
          partnerType: form.partnerType,
          role: form.role,
          focusArea: form.focusArea,
          status: "pending", 
          jointInitiatives: [],
          since: new Date().toISOString()
        });
        setPartnerships((prev) => [p, ...prev]);
      }
      resetForm();
      setSaving(false);
    }, 800);
  };

  const handleDelete = () => {
    if (!editingId || !window.confirm("Are you sure you want to remove this partnership?")) return;
    deleteNgoPartnership(editingId);
    setPartnerships((prev) => prev.filter((p) => p._id !== editingId));
    resetForm();
  };

  const resetForm = () => {
    setForm({ partnerUserId: "", partnerName: "", partnerType: "admin", role: "", focusArea: "", status: "pending" });
    setShowForm(false);
    setEditingId(null);
  };

  const openEdit = (p: NgoPartnership) => {
    setEditingId(p._id);
    setForm({
      partnerUserId: p.partnerUserId ?? "",
      partnerName: p.partnerName,
      partnerType: p.partnerType,
      role: p.role,
      focusArea: p.focusArea,
      status: p.status
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? "Cancel" : "+ Add Partnership"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div key="pform" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="space-y-4 border-violet-200 bg-violet-50/30 p-5 dark:border-violet-800 dark:bg-violet-900/10">
              <h3 className="text-sm font-semibold">{editingId ? "Update Partnership Request" : "New Partnership Request"}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Partner Type</label>
                  <select value={form.partnerType} onChange={(e) => setForm((f) => ({ ...f, partnerType: e.target.value as NgoPartnership["partnerType"], partnerUserId: "" }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900">
                    <option value="admin">University Admin</option>
                    <option value="donor">Donor / CSR</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Select User from System</label>
                  <select 
                    value={form.partnerUserId} 
                    onChange={(e) => setForm((f) => ({ ...f, partnerUserId: e.target.value, partnerName: "" }))}
                    disabled={loadingPartners}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">{loadingPartners ? "Loading users..." : "-- Choose an existing user --"}</option>
                    {filteredEligible.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.university && u.university !== "N/A" ? u.university : "Organization"})</option>
                    ))}
                    {!loadingPartners && <option value="manual">-- Manual Entry --</option>}
                  </select>
                </div>


                {form.partnerUserId === "manual" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Partner Name *</label>
                    <Input value={form.partnerName} onChange={(e) => setForm((f) => ({ ...f, partnerName: e.target.value }))} placeholder="Enter name manually" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Role / Collaboration</label>
                  <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Joint program design & verification" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Focus Area</label>
                  <Input value={form.focusArea} onChange={(e) => setForm((f) => ({ ...f, focusArea: e.target.value }))} placeholder="Emergency relief and tuition support" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NgoPartnership["status"] }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900">
                    <option value="pending">Request Sent (Pending)</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 italic">
                  {form.partnerUserId && form.partnerUserId !== "manual" 
                    ? "A partnership request will be sent to the selected user." 
                    : "Manual entries are for tracking external partners."}
                </p>
                <div className="flex items-center gap-3">
                  {editingId && (
                    <button type="button" onClick={handleDelete} className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400">
                      Remove Request
                    </button>
                  )}
                  <Button variant="primary" onClick={handleSave} disabled={saving || (!form.partnerName.trim() && !form.partnerUserId)}>
                    {saving ? "Sending..." : editingId ? "Update Request" : "Send Request"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2">
        {partnerships.map((p) => (
          <motion.div key={p._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => openEdit(p)} className="cursor-pointer">
            <Card className="space-y-3 p-5 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.partnerName}</p>
                  {p.partnerUserId && (
                    <span className="text-[10px] text-primary font-medium">Verified System User</span>
                  )}
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs text-slate-500">{p.partnerType === "admin" ? "University Admin" : "Donor / CSR"}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Role: {p.role}</p>
              <p className="text-xs text-slate-500">Focus: {p.focusArea}</p>
              {p.jointInitiatives.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Joint Initiatives</p>
                  <div className="flex flex-wrap gap-1">
                    {p.jointInitiatives.map((ji) => (
                      <span key={ji} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{ji}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-slate-400">Since {fmtDate(p.since)}</p>
            </Card>
          </motion.div>
        ))}
      </div>


    </div>
  );
}
function NgoCommunicationsSection() {
  const [history, setHistory] = useState<NgoCommunication[]>([]);
  const [activePartners, setActivePartners] = useState<NgoPartnership[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [audience, setAudience] = useState<NgoCommunication["audience"]>("beneficiaries");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [type, setType] = useState<NgoCommunication["type"]>("program-update");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ngo/communications");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.messages || []);
      } else {
        setHistory(getNgoCommunications());
      }
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistory(getNgoCommunications());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    setActivePartners(getNgoPartnerships().filter(p => p.status === "active"));
  }, [loadHistory]);


  const templates = [
    {
      label: "Program Update",
      subject: "Program update - [Month]",
      body: "Dear beneficiaries, we are pleased to share the latest update on your enrolled program...",
      audience: "beneficiaries" as const
    },
    {
      label: "Partner Update",
      subject: "Collaboration Status Update",
      body: "Dear partner, we are writing to share progress on our joint initiatives...",
      audience: "direct-message" as const
    },
    {
      label: "Impact Summary",
      subject: "Q[N] Impact Report - UniCare NGO",
      body: "This quarter, your contributions enabled [X] students to continue their studies. Key highlights:...",
      audience: "donors" as const
    },
  ];

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    if (audience === "direct-message" && !selectedPartnerId) return;

    setSending(true);
    setSuccess(null);
    setError(null);
    
    const partner = activePartners.find(p => p._id === selectedPartnerId);

    try {
      const response = await fetch("/api/ngo/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          type,
          subject,
          message,
          recipientId: audience === "direct-message" ? partner?.partnerUserId : undefined,
          recipientName: audience === "direct-message" ? partner?.partnerName : undefined,
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send message");
      }

      await loadHistory();
      setSending(false);
      setSent(true);
      setSubject("");
      setMessage("");
      setSelectedPartnerId("");
      setTimeout(() => setSent(false), 3000);

    } catch (err: any) {
      setError(err.message || "Failed to send communication.");
      setSending(false);
    }
  };


  const applyTemplate = (t: typeof templates[0]) => {
    setSubject(t.subject);
    setMessage(t.body);
    setAudience(t.audience);
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading communications...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" />
              </span>
              Compose New Message
            </h3>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                {success}
              </div>
            )}

            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Audience</label>
                <select 
                  value={audience} 
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 transition-colors"
                >
                  <option value="beneficiaries">Program Beneficiaries</option>
                  <option value="donors">All Donors & Sponsors</option>
                  <option value="all-applicants">All Past Applicants</option>
                  <option value="direct-message">Direct Message to Partner</option>
                </select>
              </div>

              {audience === "direct-message" ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Select Active Partner</label>
                  <select 
                    value={selectedPartnerId} 
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 transition-colors"
                  >
                    <option value="">-- Choose a partner --</option>
                    {activePartners.map(p => (
                      <option key={p._id} value={p._id}>{p.partnerName}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Message Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 transition-colors"
                  >
                    <option value="program-update">Program Update</option>
                    <option value="newsletter">Impact Newsletter</option>
                    <option value="feedback-request">Feedback Request</option>
                    <option value="awareness-campaign">Awareness Campaign</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Subject Line</label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Important update regarding..." 
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Message Content</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[160px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${sent ? 'bg-emerald-500 animate-pulse' : sending ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <p className="text-[10px] text-slate-500 italic">
                  {sent ? "Message delivered successfully." : sending ? "Broadcasting message..." : "Messages are sent within your organization scope."}
                </p>
              </div>
              <Button 
                variant="primary" 
                onClick={handleSend} 
                disabled={sending || !subject.trim() || !message.trim() || (audience === "direct-message" && !selectedPartnerId)}
                className="px-8"
              >
                {sending ? "Sending..." : "Deliver Message"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-3 shadow-sm border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Quick Templates
            </h4>
            <div className="space-y-2">
              {templates.map((t) => (
                <button 
                  key={t.label} 
                  onClick={() => applyTemplate(t)}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left text-xs font-medium transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-3 bg-primary/5 border-primary/20 shadow-sm">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              Audience Reach
            </h4>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span>Active Partners</span>
                <span className="font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-primary/10 shadow-sm">{activePartners.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Beneficiaries</span>
                <span className="font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-primary/10 shadow-sm">135</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Direct Donors</span>
                <span className="font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-primary/10 shadow-sm">8</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
              Reach counts are based on users currently connected to your organization.
            </p>
          </Card>
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Communication History
            <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{history.length} items</span>
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {history.length === 0 ? (
            <Card className="col-span-full p-12 flex flex-col items-center justify-center text-slate-400 border-dashed">
              <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm italic">No communication history found.</p>
            </Card>
          ) : history.map((comm) => (
            <Card key={comm._id} className="p-4 space-y-3 border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{comm.subject}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span className="font-medium text-primary">To:</span> 
                      {comm.audience === "direct-message" ? `Partner (${comm.recipientName})` : comm.audience.charAt(0).toUpperCase() + comm.audience.slice(1)}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase shrink-0">
                  {comm.type}
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{comm.message}</p>
              <div className="flex items-center justify-between pt-3 text-[10px] text-slate-400 border-t border-slate-50 dark:border-slate-800/50">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {fmtDate(comm.sentAt)}
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-500">
                  <Users className="h-3 w-3" />
                  Reach: {comm.recipientCount} {comm.recipientCount === 1 ? 'user' : 'users'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function NgoProfileSection() {
  const { user, refreshUser, updateUserProfile, requestPasswordReset } = useAuth();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.contact ?? "");
  const [organizationName, setOrganizationName] = useState(user?.roleDetails?.organizationName ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(user?.roleDetails?.registrationNumber ?? "");
  const [registrationDocuments, setRegistrationDocuments] = useState(user?.roleDetails?.registrationDocuments ?? "");
  const [focusAreas, setFocusAreas] = useState(user?.roleDetails?.focusAreas ?? "");
  const [teamAccess, setTeamAccess] = useState(user?.roleDetails?.teamAccess ?? "Single administrator");

  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [ngoSaving, setNgoSaving] = useState(false);
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
    setOrganizationName(user.roleDetails?.organizationName ?? "");
    setRegistrationNumber(user.roleDetails?.registrationNumber ?? "");
    setRegistrationDocuments(user.roleDetails?.registrationDocuments ?? "");
    setFocusAreas(user.roleDetails?.focusAreas ?? "");
    setTeamAccess(user.roleDetails?.teamAccess ?? "Single administrator");
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

  const saveNgoProfile = async () => {
    if (!user?.email) return;
    setMessage(null);
    setNgoSaving(true);

    const currentRoleDetails = { ...(user.roleDetails ?? {}) };
    const nextOrgName = organizationName.trim();
    const nextRegNumber = registrationNumber.trim();
    const nextRegDocs = registrationDocuments.trim();
    const nextFocusAreas = focusAreas.trim();

    if (nextOrgName) {
      currentRoleDetails.organizationName = nextOrgName;
    } else {
      delete currentRoleDetails.organizationName;
    }
    if (nextRegNumber) {
      currentRoleDetails.registrationNumber = nextRegNumber;
    } else {
      delete currentRoleDetails.registrationNumber;
    }
    if (nextRegDocs) {
      currentRoleDetails.registrationDocuments = nextRegDocs;
    } else {
      delete currentRoleDetails.registrationDocuments;
    }
    if (nextFocusAreas) {
      currentRoleDetails.focusAreas = nextFocusAreas;
    } else {
      delete currentRoleDetails.focusAreas;
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
        setMessage({ type: "ok", text: "Organization profile updated." });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setNgoSaving(false);
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
            <p className="text-sm font-medium uppercase tracking-wide text-primary">NGO profile</p>
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
          Maintain your organization profile and registration details.
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Organization details</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Registration and focus areas used by university admins for verification.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization name</label>
                  <Input
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="NGO or foundation name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Registration number</label>
                  <Input
                    value={registrationNumber}
                    onChange={(event) => setRegistrationNumber(event.target.value)}
                    placeholder="Official registration ID"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Registration documents (link or reference)
                  </label>
                  <Input
                    value={registrationDocuments}
                    onChange={(event) => setRegistrationDocuments(event.target.value)}
                    placeholder="Stored document link or reference ID"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Focus areas</label>
                  <Input
                    value={focusAreas}
                    onChange={(event) => setFocusAreas(event.target.value)}
                    placeholder="Education, health, emergency relief"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Team access</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={teamAccess}
                    onChange={(event) => setTeamAccess(event.target.value)}
                  >
                    <option>Single administrator</option>
                    <option>Admin + read-only members</option>
                    <option>Full team management</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" onClick={saveNgoProfile} disabled={ngoSaving}>
                {ngoSaving ? "Saving..." : "Update organization profile"}
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
                Control what is shared with donors and university admins.
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
                  Share program focus areas with university admins
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
                  Share funding status with university admins
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
                Choose how you receive updates about aid allocations and beneficiaries.
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
                  Reminders for program review tasks
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
                  Weekly NGO update reminder
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















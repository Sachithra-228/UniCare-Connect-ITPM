"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { AidRequestForm } from "@/components/financial/aid-request-form";
import { Input } from "@/components/shared/Input";
import {
  getNgoPrograms,
  getNgoApplications,
  getNgoBeneficiaries,
  addNgoApplication,
  type NgoProgram
} from "@/lib/ngo-demo-store";
import { useAuth } from "@/context/auth-context";

type AidRequest = {
  id?: string;
  _id?: string;
  category?: string;
  status?: string;
  submittedAt?: string;
  amount?: string;
  description?: string;
  createdAt?: string;
};

type FinancialSummary = {
  mealVoucherBalance?: number;
  tuitionSupportBalance?: number;
  currency?: string;
  lastUpdated?: string | null;
};

type AidCategoryKey = "emergency" | "equipment" | "boarding" | "tuition" | "other";

const TAB_IDS = ["emergency-aid", "equipment", "meal-voucher", "tuition", "ngo-programs"] as const;
type TabId = (typeof TAB_IDS)[number];

const STATUS_COLORS: Record<string, string> = {
  Approved: "#10b981",
  Rejected: "#ef4444",
  Pending: "#f59e0b"
};
const AUTO_REFRESH_MS = 30000;

function normalizeCategory(category?: string): AidCategoryKey {
  const value = String(category ?? "").trim().toLowerCase();
  if (!value) return "emergency";
  if (value.includes("equipment")) return "equipment";
  if (value.includes("meal") || value.includes("voucher") || value.includes("boarding")) return "boarding";
  if (value.includes("tuition") || value.includes("maintenance") || value.includes("fee")) return "tuition";
  if (value.includes("emergency")) return "emergency";
  return "other";
}

function formatCategory(category: string): string {
  const key = normalizeCategory(category);
  if (key === "emergency") return "Emergency academic aid";
  if (key === "equipment") return "Equipment & resources";
  if (key === "boarding") return "Meal vouchers & necessities";
  if (key === "tuition") return "Tuition & maintenance";
  return category || "Aid request";
}

function normalizeStatus(status?: string): "Approved" | "Rejected" | "Pending" {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  return "Pending";
}

function formatStatus(status?: string): string {
  if (!status) return "Under review";
  return status
    .split(" ")
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : part))
    .join(" ");
}

function getStatusBadgeVariant(status?: string): "success" | "warning" | "info" {
  const normalized = normalizeStatus(status);
  if (normalized === "Approved") return "success";
  if (normalized === "Rejected") return "warning";
  return "info";
}

function parseAmountValue(input?: string): number {
  if (!input) return 0;
  const cleaned = String(input).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function StudentFinancialAid() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("emergency-aid");
  const [aidRequests, setAidRequests] = useState<AidRequest[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loadingAid, setLoadingAid] = useState(true);
  const [loadingFin, setLoadingFin] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AidRequest | null>(null);
  const [showBalanceCardPopup, setShowBalanceCardPopup] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // NGO states
  const [ngoPrograms, setNgoPrograms] = useState<NgoProgram[]>([]);
  const [ngoApplications, setNgoApplications] = useState(getNgoApplications());
  const [ngoBeneficiaries, setNgoBeneficiaries] = useState(getNgoBeneficiaries());
  const [applyingNgoId, setApplyingNgoId] = useState<string | null>(null);
  const [ngoApplyReason, setNgoApplyReason] = useState("");
  const [ngoApplyAmount, setNgoApplyAmount] = useState("");

  const fetchAidRequests = useCallback((showLoader = true) => {
    if (showLoader) setLoadingAid(true);
    fetch("/api/aid-requests")
      .then((r) => r.json())
      .then((data) => setAidRequests(Array.isArray(data) ? data : []))
      .catch(() => setAidRequests([]))
      .finally(() => {
        if (showLoader) setLoadingAid(false);
      });
  }, []);

  const fetchFinancialSummary = useCallback((showLoader = true) => {
    if (showLoader) setLoadingFin(true);
    fetch("/api/students/financial-summary")
      .then((r) => r.json())
      .then((data) => setFinancialSummary(data || null))
      .catch(() => setFinancialSummary(null))
      .finally(() => {
        if (showLoader) setLoadingFin(false);
      });
  }, []);

  const refreshAidAndSummary = useCallback(
    (showLoader = false) => {
      fetchAidRequests(showLoader);
      fetchFinancialSummary(showLoader);
      setNgoPrograms(getNgoPrograms().filter((p) => p.status === "active"));
      setNgoApplications([...getNgoApplications()]);
      setNgoBeneficiaries([...getNgoBeneficiaries()]);
    },
    [fetchAidRequests, fetchFinancialSummary]
  );

  useEffect(() => {
    refreshAidAndSummary(true);
  }, [refreshAidAndSummary]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshAidAndSummary(false);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [refreshAidAndSummary]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const emergencyRequests = aidRequests.filter((request) => normalizeCategory(request.category) === "emergency");
  const equipmentRequests = aidRequests.filter((request) => normalizeCategory(request.category) === "equipment");
  const mealVoucherRequests = aidRequests.filter((request) => normalizeCategory(request.category) === "boarding");
  const tuitionRequests = aidRequests.filter((request) => normalizeCategory(request.category) === "tuition");

  const emergencyStatusCounts = emergencyRequests.reduce(
    (acc, request) => {
      const key = normalizeStatus(request.status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<"Approved" | "Rejected" | "Pending", number>
  );

  const pieData = [
    { name: "Pending", value: emergencyStatusCounts.Pending || 0, color: STATUS_COLORS.Pending },
    { name: "Approved", value: emergencyStatusCounts.Approved || 0, color: STATUS_COLORS.Approved },
    { name: "Rejected", value: emergencyStatusCounts.Rejected || 0, color: STATUS_COLORS.Rejected }
  ].filter((entry) => entry.value > 0);

  const mealBalance = financialSummary?.mealVoucherBalance ?? 0;
  const tuitionBalance = financialSummary?.tuitionSupportBalance ?? 0;
  const currency = financialSummary?.currency ?? "LKR";
  const displayName = (user?.name || "Student").trim();
  const displayEmail = (user?.email || "student@university.edu").trim();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "ST";
  const currentStudentId = user?.firebaseUid || user?._id || "student-demo";
  const studentNgoApplications = ngoApplications.filter((app) => app.studentId === currentStudentId);
  const studentNgoApplicationIds = new Set(studentNgoApplications.map((app) => app._id));
  const ngoTotalReceived = ngoBeneficiaries.reduce((sum, beneficiary) => {
    if (!beneficiary.applicationId || !studentNgoApplicationIds.has(beneficiary.applicationId)) return sum;
    return sum + (beneficiary.supportReceived || 0);
  }, 0);
  const emergencyAidReceived = aidRequests.reduce((sum, request) => {
    const isEmergency = normalizeCategory(request.category) === "emergency";
    const isApproved = normalizeStatus(request.status) === "Approved";
    if (!isEmergency || !isApproved) return sum;
    return sum + parseAmountValue(request.amount);
  }, 0);
  const totalBalance = mealBalance + tuitionBalance + ngoTotalReceived + emergencyAidReceived;

  const tabs = [
    { id: "emergency-aid" as const, label: "Emergency aid applications" },
    { id: "equipment" as const, label: "Equipment support" },
    { id: "meal-voucher" as const, label: "Meal voucher support" },
    { id: "tuition" as const, label: "Tuition support" },
    { id: "ngo-programs" as const, label: "NGO Support Programs" }
  ];
  const tabPanelCardClass =
    "border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-sky-50 dark:border-blue-500/30 dark:from-[#0f1f3f] dark:via-slate-900 dark:to-[#102a59]";
  const formContainerClass =
    "mt-6 rounded-xl border border-white/25 bg-gradient-to-br from-[#0b1f45] via-[#102a59] to-[#0c1d3d] p-4 text-white shadow-[0_14px_34px_-22px_rgba(2,6,23,0.95)]";

  const renderBalanceCardContent = (isPopup = false) => {
    const profileSize = isPopup ? 72 : 64;
    const profileClass = isPopup ? "h-[72px] w-[72px]" : "h-16 w-16";
    const nameClass = isPopup ? "text-base" : "text-sm";
    const balanceClass = isPopup ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl";

    return (
      <>
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-10 right-8 h-32 w-32 rounded-full bg-primary/50 blur-3xl" />
        </div>
        <div className={isPopup ? "relative px-6 py-6" : "relative px-5 py-5"}>
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {user?.profilePic ? (
                  <Image
                    src={user.profilePic}
                    alt={displayName}
                    width={profileSize}
                    height={profileSize}
                    className={`${profileClass} rounded-full border border-white/30 object-cover`}
                  />
                ) : (
                  <div
                    className={`flex ${profileClass} items-center justify-center rounded-full border border-white/30 bg-white/10 text-base font-semibold text-white`}
                  >
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`truncate font-semibold text-white ${nameClass}`}>{displayName}</p>
                  <p className="truncate text-xs text-slate-300">{displayEmail}</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total balance</p>
              {loadingFin ? (
                <p className="mt-2 text-2xl font-bold text-slate-300">Loading...</p>
              ) : (
                <p className={`mt-2 font-bold ${balanceClass}`}>
                  {currency} {totalBalance.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-3 text-xs text-slate-300">
            {loadingFin ? (
              <span>Fetching latest balances...</span>
            ) : (
              <span>
                Meal vouchers {currency} {mealBalance.toLocaleString()} + Tuition support {currency}{" "}
                {tuitionBalance.toLocaleString()} + NGO {currency} {ngoTotalReceived.toLocaleString()} + Emergency aid{" "}
                {currency} {emergencyAidReceived.toLocaleString()}
              </span>
            )}
            {financialSummary?.lastUpdated && (
              <p className="mt-1 text-[11px] text-slate-400">Updated: {financialSummary.lastUpdated}</p>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderRequestList = (requests: AidRequest[], emptyMessage: string) => {
    if (requests.length === 0) {
      return <p className="text-sm text-slate-500">{emptyMessage}</p>;
    }

    return (
      <ul className="space-y-2">
        {requests.map((request, index) => (
          <li key={request._id || request.id || index}>
            <button
              type="button"
              onClick={() => setSelectedRequest(request)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-primary/30 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary/40 dark:hover:bg-slate-800/80"
            >
              <div>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCategory(request.category || "")}
                </span>
                {request.amount && <span className="ml-2 text-sm text-slate-500">{request.amount} {currency}</span>}
              </div>
              <Badge variant={getStatusBadgeVariant(request.status)}>{formatStatus(request.status)}</Badge>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowBalanceCardPopup(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setShowBalanceCardPopup(true);
          }
        }}
        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
        aria-label="Open balance card"
      >
        <Card className="relative overflow-hidden border-slate-900/60 bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white shadow-lg transition-transform duration-200 hover:scale-[1.01]">
          {renderBalanceCardContent()}
        </Card>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" aria-label="Financial aid sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border border-b-0 border-blue-300 bg-blue-600 text-white dark:border-blue-300/40 dark:bg-blue-500/30 dark:text-blue-100"
                  : "border border-transparent text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-500/15 dark:hover:text-blue-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "emergency-aid" && (
        <Card className={`overflow-hidden p-5 ${tabPanelCardClass}`}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Emergency aid applications</h3>
          {loadingAid ? (
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                {pieData.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No emergency aid requests yet.</p>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Recent emergency requests</p>
                {renderRequestList(emergencyRequests.slice(0, 5), "No emergency requests found.")}
              </div>
            </div>
          )}

          <div className={formContainerClass}>
            <h4 className="text-sm font-semibold text-white">Apply for emergency academic aid</h4>
            <AidRequestForm
              defaultCategory="emergency"
              lockCategory
              submitLabel="Submit emergency aid request"
              onSuccess={() => refreshAidAndSummary(false)}
              onShowSuccessPopup={() => setShowSuccessPopup(true)}
            />
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Emergency request history</h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Click a request to view details or delete.</p>
            <div className="mt-3">{renderRequestList(emergencyRequests, "No previous emergency requests.")}</div>
          </div>
        </Card>
      )}

      {activeTab === "equipment" && (
        <Card className={`p-5 ${tabPanelCardClass}`}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Equipment & resource support</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Request laptops, books, and lab equipment. Your requests are tracked with live status updates.
          </p>

          <div className={formContainerClass}>
            <h4 className="text-sm font-semibold text-white">Request equipment</h4>
            <AidRequestForm
              defaultCategory="equipment"
              lockCategory
              submitLabel="Submit equipment request"
              onSuccess={() => refreshAidAndSummary(false)}
              onShowSuccessPopup={() => setShowSuccessPopup(true)}
            />
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Equipment request history</h4>
            <div className="mt-3">{renderRequestList(equipmentRequests, "No equipment requests yet.")}</div>
          </div>
        </Card>
      )}

      {activeTab === "meal-voucher" && (
        <div className="space-y-6">
          <Card className={`overflow-hidden ${tabPanelCardClass}`}>
            <div className="border-b border-blue-200/70 bg-blue-100/70 px-5 py-4 dark:border-blue-400/25 dark:bg-blue-500/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Meal voucher support</h3>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Track your meal voucher balance and request top-ups when needed.
              </p>
            </div>
            {loadingFin ? (
              <p className="p-6 text-sm text-slate-500">Loading...</p>
            ) : (
              <div className="p-5">
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300/80 bg-white/90 py-10 dark:border-blue-300/40 dark:bg-slate-800/50">
                  <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Current balance</p>
                  <p className="mt-2 text-4xl font-bold text-primary">
                    {currency} {mealBalance.toLocaleString()}
                  </p>
                  {financialSummary?.lastUpdated && (
                    <p className="mt-2 text-xs text-slate-500">Last updated: {financialSummary.lastUpdated}</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className={`p-5 ${tabPanelCardClass}`}>
            <div className={formContainerClass}>
              <h4 className="text-sm font-semibold text-white">Request meal voucher top-up</h4>
              <AidRequestForm
                defaultCategory="boarding"
                lockCategory
                submitLabel="Submit meal voucher request"
                onSuccess={() => refreshAidAndSummary(false)}
                onShowSuccessPopup={() => setShowSuccessPopup(true)}
              />
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Meal voucher request history</h4>
              <div className="mt-3">{renderRequestList(mealVoucherRequests, "No meal voucher requests yet.")}</div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "tuition" && (
        <div className="space-y-6">
          <Card className={`overflow-hidden ${tabPanelCardClass}`}>
            <div className="border-b border-blue-200/70 bg-blue-100/70 px-5 py-4 dark:border-blue-400/25 dark:bg-blue-500/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tuition & maintenance support</h3>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Monitor allocated support and submit new tuition assistance requests.
              </p>
            </div>
            {loadingFin ? (
              <p className="p-6 text-sm text-slate-500">Loading...</p>
            ) : (
              <div className="p-5">
                <div className="rounded-2xl border-2 border-blue-200 bg-white p-6 dark:border-blue-300/35 dark:bg-slate-800/50">
                  <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Allocated support balance
                  </p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {currency} {tuitionBalance.toLocaleString()}
                  </p>
                  {financialSummary?.lastUpdated && (
                    <p className="mt-1 text-xs text-slate-500">Last updated: {financialSummary.lastUpdated}</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className={`p-5 ${tabPanelCardClass}`}>
            <div className={formContainerClass}>
              <h4 className="text-sm font-semibold text-white">Apply for tuition aid</h4>
              <AidRequestForm
                defaultCategory="tuition"
                lockCategory
                submitLabel="Submit tuition request"
                onSuccess={() => refreshAidAndSummary(false)}
                onShowSuccessPopup={() => setShowSuccessPopup(true)}
              />
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Tuition request history</h4>
              <div className="mt-3">{renderRequestList(tuitionRequests, "No tuition support requests yet.")}</div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "ngo-programs" && (
        <Card className={`p-5 ${tabPanelCardClass}`}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active NGO Support Programs</h3>
          <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-300">
            External organizations have partnered with the university to provide these support initiatives. Apply here, and your university admin will verify your eligibility with the NGO.
          </p>

          <div className="space-y-4">
            {ngoPrograms.length === 0 ? (
              <p className="text-sm text-slate-500">No active NGO programs at this time.</p>
            ) : (
              ngoPrograms.map((prog) => {
                const hasApplied = studentNgoApplications.some((application) => application.programId === prog._id);
                return (
                <div key={prog._id} className="rounded-xl border border-blue-200 bg-white/95 p-4 dark:border-blue-400/25 dark:bg-blue-500/10">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{prog.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">{prog.description}</p>
                      <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Eligibility: {prog.eligibility}
                      </div>
                    </div>
                    {applyingNgoId === prog._id ? (
                      <div className="w-full sm:w-64 space-y-2 rounded-lg bg-slate-50 p-3 outline outline-1 outline-slate-200 dark:bg-slate-900 dark:outline-slate-700">
                        <Input 
                          placeholder="Amount requested (LKR)" 
                          type="number"
                          value={ngoApplyAmount} 
                          onChange={(e) => setNgoApplyAmount(e.target.value)} 
                        />
                        <textarea 
                          placeholder="Brief reason for application..."
                          value={ngoApplyReason}
                          onChange={(e) => setNgoApplyReason(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button variant="primary" className="flex-1 py-1.5 text-xs" onClick={() => {
                            if (!ngoApplyReason.trim()) return;
                            const studentId = currentStudentId;
                            const studentInitials = initials || "ST";
                            const studentUniversity = user?.university?.trim() || "University";
                            const hasExistingApplication = getNgoApplications().some(
                              (app) =>
                                app.programId === prog._id &&
                                app.studentId === studentId
                            );
                            if (hasExistingApplication) {
                              setToastMessage("You already applied for this program.");
                              return;
                            }
                            addNgoApplication({
                              studentId,
                              studentInitials,
                              university: studentUniversity,
                              programId: prog._id,
                              programTitle: prog.title,
                              amountRequested: Number(ngoApplyAmount) || 0,
                              reason: ngoApplyReason
                            });
                            setApplyingNgoId(null);
                            setNgoApplyReason("");
                            setNgoApplyAmount("");
                            refreshAidAndSummary(false);
                            setToastMessage("Application submitted to Administrative review.");
                          }}>
                            Submit
                          </Button>
                          <Button className="py-1.5 text-xs" onClick={() => setApplyingNgoId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        disabled={hasApplied}
                        className={hasApplied ? "cursor-not-allowed opacity-60" : ""}
                        onClick={() => {
                          if (hasApplied) return;
                          setApplyingNgoId(prog._id);
                          setNgoApplyReason("");
                          setNgoApplyAmount("");
                        }}
                      >
                        {hasApplied ? "Applied" : "Apply"}
                      </Button>
                    )}
                  </div>
                </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {showSuccessPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
          onClick={() => setShowSuccessPopup(false)}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <Card className="w-full max-w-sm border-primary/20 bg-white p-6 shadow-xl dark:bg-slate-900">
              <p id="success-title" className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                Request submitted
              </p>
              <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                Your request has been submitted for university verification. You can track it in the relevant tab history.
              </p>
              <div className="mt-6 flex justify-center">
                <Button type="button" onClick={() => setShowSuccessPopup(false)}>
                  OK
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {showBalanceCardPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Balance card preview"
          onClick={() => setShowBalanceCardPopup(false)}
        >
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl">
            <Card className="relative overflow-hidden border-slate-900/60 bg-gradient-to-br from-slate-950 via-black to-slate-900 p-0 text-white shadow-2xl">
              {renderBalanceCardContent(true)}
            </Card>
          </div>
        </div>
      )}

      {selectedRequest && (() => {
        const submittedRaw = selectedRequest.submittedAt || selectedRequest.createdAt;
        const submittedFormatted =
          submittedRaw &&
          (() => {
            try {
              const date = new Date(submittedRaw);
              return Number.isNaN(date.getTime())
                ? submittedRaw
                : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
            } catch {
              return submittedRaw;
            }
          })();

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onClick={() => setSelectedRequest(null)}
          >
            <div onClick={(event) => event.stopPropagation()}>
              <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                  <h3 id="detail-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Request details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    aria-label="Close"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 px-6 py-4">
                  <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</span>
                    <span className="text-slate-900 dark:text-white">{formatCategory(selectedRequest.category || "")}</span>
                  </div>

                  {selectedRequest.amount && (
                    <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedRequest.amount} {currency}</span>
                    </div>
                  )}

                  {selectedRequest.description && (
                    <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Summary</span>
                      <p className="text-slate-900 dark:text-white">{selectedRequest.description}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</span>
                    <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>{formatStatus(selectedRequest.status)}</Badge>
                  </div>

                  {submittedFormatted && (
                    <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Submitted</span>
                      <span className="text-slate-900 dark:text-white">{submittedFormatted}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
                  <Button
                    type="button"
                    className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                    disabled={!!deletingId}
                    onClick={async () => {
                      const id = selectedRequest._id || selectedRequest.id;
                      if (!id) return;
                      setDeletingId(id);
                      try {
                        const response = await fetch(`/api/aid-requests/${id}`, { method: "DELETE" });
                        if (response.ok) {
                          setSelectedRequest(null);
                          refreshAidAndSummary(false);
                          setToastMessage("Request deleted successfully.");
                        }
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    {deletingId ? "Deleting..." : "Delete request"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        );
      })()}

      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg dark:border-emerald-800 dark:bg-emerald-700"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

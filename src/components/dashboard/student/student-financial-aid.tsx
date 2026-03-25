"use client";

import { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { AidRequestForm } from "@/components/financial/aid-request-form";

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

const TAB_IDS = ["emergency-aid", "equipment", "meal-voucher", "tuition"] as const;
type TabId = (typeof TAB_IDS)[number];

const STATUS_COLORS: Record<string, string> = {
  Approved: "#10b981",
  Rejected: "#ef4444",
  Pending: "#f59e0b"
};

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

export function StudentFinancialAid() {
  const [activeTab, setActiveTab] = useState<TabId>("emergency-aid");
  const [aidRequests, setAidRequests] = useState<AidRequest[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loadingAid, setLoadingAid] = useState(true);
  const [loadingFin, setLoadingFin] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AidRequest | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAidRequests = useCallback(() => {
    setLoadingAid(true);
    fetch("/api/aid-requests")
      .then((r) => r.json())
      .then((data) => setAidRequests(Array.isArray(data) ? data : []))
      .catch(() => setAidRequests([]))
      .finally(() => setLoadingAid(false));
  }, []);

  const fetchFinancialSummary = useCallback(() => {
    setLoadingFin(true);
    fetch("/api/students/financial-summary")
      .then((r) => r.json())
      .then((data) => setFinancialSummary(data || null))
      .catch(() => setFinancialSummary(null))
      .finally(() => setLoadingFin(false));
  }, []);

  useEffect(() => {
    fetchAidRequests();
    fetchFinancialSummary();
  }, [fetchAidRequests, fetchFinancialSummary]);

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
  const totalBalance = mealBalance + tuitionBalance;
  const currency = financialSummary?.currency ?? "LKR";

  const tabs = [
    { id: "emergency-aid" as const, label: "Emergency aid applications" },
    { id: "equipment" as const, label: "Equipment support" },
    { id: "meal-voucher" as const, label: "Meal voucher support" },
    { id: "tuition" as const, label: "Tuition support" }
  ];

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
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-white to-primary/5 shadow-sm dark:from-primary/20 dark:via-slate-900/90 dark:to-primary/15">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Your total financial support balance
          </p>
          {loadingFin ? (
            <p className="mt-2 text-2xl font-bold text-slate-400 dark:text-slate-500">Loading...</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-primary md:text-4xl">
                {currency} {totalBalance.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Meal vouchers ({currency} {mealBalance.toLocaleString()}) + Tuition support ({currency} {tuitionBalance.toLocaleString()})
              </p>
              {financialSummary?.lastUpdated && (
                <p className="mt-0.5 text-xs text-slate-500">Updated: {financialSummary.lastUpdated}</p>
              )}
            </>
          )}
        </div>
      </Card>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" aria-label="Financial aid sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border border-b-0 border-slate-200 bg-white text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-primary"
                  : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "emergency-aid" && (
        <Card className="overflow-hidden border-slate-200/80 p-5 dark:border-slate-700/50">
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

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Apply for emergency academic aid</h4>
            <AidRequestForm
              defaultCategory="emergency"
              lockCategory
              submitLabel="Submit emergency aid request"
              onSuccess={fetchAidRequests}
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
        <Card className="border-slate-200/80 p-5 dark:border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Equipment & resource support</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Request laptops, books, and lab equipment. Your requests are tracked with live status updates.
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Request equipment</h4>
            <AidRequestForm
              defaultCategory="equipment"
              lockCategory
              submitLabel="Submit equipment request"
              onSuccess={fetchAidRequests}
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
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white dark:from-primary/10 dark:via-slate-900/90 dark:to-slate-900/80">
            <div className="border-b border-primary/10 bg-primary/5 px-5 py-4 dark:border-primary/20 dark:bg-primary/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Meal voucher support</h3>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Track your meal voucher balance and request top-ups when needed.
              </p>
            </div>
            {loadingFin ? (
              <p className="p-6 text-sm text-slate-500">Loading...</p>
            ) : (
              <div className="p-5">
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-white py-10 dark:border-primary/40 dark:bg-slate-800/50">
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

          <Card className="border-slate-200/80 p-5 dark:border-slate-700/50">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Request meal voucher top-up</h4>
            <AidRequestForm
              defaultCategory="boarding"
              lockCategory
              submitLabel="Submit meal voucher request"
              onSuccess={fetchAidRequests}
              onShowSuccessPopup={() => setShowSuccessPopup(true)}
            />

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Meal voucher request history</h4>
              <div className="mt-3">{renderRequestList(mealVoucherRequests, "No meal voucher requests yet.")}</div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "tuition" && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white dark:from-primary/10 dark:via-slate-900/90 dark:to-slate-900/80">
            <div className="border-b border-primary/10 bg-primary/5 px-5 py-4 dark:border-primary/20 dark:bg-primary/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tuition & maintenance support</h3>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Monitor allocated support and submit new tuition assistance requests.
              </p>
            </div>
            {loadingFin ? (
              <p className="p-6 text-sm text-slate-500">Loading...</p>
            ) : (
              <div className="p-5">
                <div className="rounded-2xl border-2 border-primary/20 bg-white p-6 dark:border-primary/30 dark:bg-slate-800/50">
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

          <Card className="border-slate-200/80 p-5 dark:border-slate-700/50">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Apply for tuition aid</h4>
            <AidRequestForm
              defaultCategory="tuition"
              lockCategory
              submitLabel="Submit tuition request"
              onSuccess={fetchAidRequests}
              onShowSuccessPopup={() => setShowSuccessPopup(true)}
            />

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Tuition request history</h4>
              <div className="mt-3">{renderRequestList(tuitionRequests, "No tuition support requests yet.")}</div>
            </div>
          </Card>
        </div>
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
                          fetchAidRequests();
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useAuth } from "@/context/auth-context";
import type { DashboardRole } from "@/lib/role-dashboard-config";

type PartnershipRecipient = "admin_staff" | "donor_csr";
type PartnershipStatus = "pending" | "in_review" | "accepted" | "declined";

type PartnershipRequest = {
  _id: string;
  ngoName: string;
  title: string;
  description: string;
  focusArea: string;
  recipients: PartnershipRecipient[];
  status: PartnershipStatus;
  responseNote?: string;
  createdAt?: string;
  updatedAt?: string;
};

type NgoPartnershipSectionProps = {
  viewerRole: DashboardRole;
  cardClassName?: string;
};

function statusClass(status: PartnershipStatus) {
  if (status === "accepted") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "declined") return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  if (status === "in_review") return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
}

function recipientLabel(value: PartnershipRecipient) {
  return value === "admin_staff" ? "Admin staff" : "Donor CSR";
}

export function NgoPartnershipSection({ viewerRole, cardClassName }: NgoPartnershipSectionProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [notifyAdmin, setNotifyAdmin] = useState(true);
  const [notifyDonor, setNotifyDonor] = useState(true);
  const [responseNoteDraft, setResponseNoteDraft] = useState<Record<string, string>>({});

  const canCreate = viewerRole === "ngo";
  const canReview =
    viewerRole === "admin" ||
    viewerRole === "faculty" ||
    viewerRole === "donor";

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ngo/partnership-requests");
      const payload = (await response.json().catch(() => [])) as PartnershipRequest[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load partnership requests.");
        setRequests([]);
        return;
      }
      setRequests(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load partnership requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const summary = useMemo(
    () =>
      requests.reduce(
        (acc, item) => {
          acc.total += 1;
          if (item.status === "pending") acc.pending += 1;
          if (item.status === "accepted") acc.accepted += 1;
          return acc;
        },
        { total: 0, pending: 0, accepted: 0 }
      ),
    [requests]
  );

  const createRequest = async () => {
    const recipients: PartnershipRecipient[] = [];
    if (notifyAdmin) recipients.push("admin_staff");
    if (notifyDonor) recipients.push("donor_csr");
    if (!title.trim() || !description.trim() || recipients.length === 0) {
      setError("Title, description, and at least one recipient are required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/ngo/partnership-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          focusArea: focusArea.trim(),
          recipients
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to create partnership request.");
        return;
      }
      setTitle("");
      setDescription("");
      setFocusArea("");
      setNotifyAdmin(true);
      setNotifyDonor(true);
      setSuccess(payload.message ?? "Partnership request submitted.");
      await loadRequests();
    } catch {
      setError("Unable to create partnership request.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: PartnershipStatus) => {
    setUpdatingId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/ngo/partnership-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          responseNote: responseNoteDraft[id]?.trim() || undefined
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to update status.");
        return;
      }
      setSuccess(payload.message ?? "Partnership request updated.");
      await loadRequests();
    } catch {
      setError("Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!window.confirm("Delete this partnership request?")) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/ngo/partnership-requests/${id}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Unable to delete request.");
        return;
      }
      setSuccess(payload.message ?? "Partnership request deleted.");
      await loadRequests();
    } catch {
      setError("Unable to delete request.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Coordinate NGO partnership requests with Admin staff and Donor CSR teams.
      </p>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{success}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={cardClassName ? `p-4 ${cardClassName}` : "p-4"}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total requests</p>
          <p className="mt-1 text-2xl font-semibold">{summary.total}</p>
        </Card>
        <Card className={cardClassName ? `p-4 ${cardClassName}` : "p-4"}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending review</p>
          <p className="mt-1 text-2xl font-semibold">{summary.pending}</p>
        </Card>
        <Card className={cardClassName ? `p-4 ${cardClassName}` : "p-4"}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Accepted</p>
          <p className="mt-1 text-2xl font-semibold">{summary.accepted}</p>
        </Card>
      </div>

      {canCreate ? (
        <Card className={cardClassName ? `space-y-3 p-4 ${cardClassName}` : "space-y-3 p-4"}>
          <h3 className="text-sm font-semibold">Create NGO partnership request</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Partnership title"
            />
            <Input
              value={focusArea}
              onChange={(event) => setFocusArea(event.target.value)}
              placeholder="Focus area"
            />
          </div>
          <textarea
            className="min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the partnership goals and expected collaboration"
          />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded"
                checked={notifyAdmin}
                onChange={(event) => setNotifyAdmin(event.target.checked)}
              />
              Notify Admin staff
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded"
                checked={notifyDonor}
                onChange={(event) => setNotifyDonor(event.target.checked)}
              />
              Notify Donor CSR
            </label>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={createRequest} disabled={saving}>
              {saving ? "Submitting..." : "Submit request"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className={cardClassName ? `space-y-3 p-4 ${cardClassName}` : "space-y-3 p-4"}>
        <h3 className="text-sm font-semibold">
          {canCreate ? "My partnership requests" : "NGO partnership requests"}
        </h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading requests...</p>
        ) : !requests.length ? (
          <p className="text-sm text-slate-500">No partnership requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      NGO: {item.ngoName}
                      {item.focusArea ? ` · ${item.focusArea}` : ""}
                      {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Recipients: {item.recipients.map(recipientLabel).join(", ")}
                </p>
                {item.responseNote ? (
                  <p className="mt-1 text-xs text-slate-500">Response note: {item.responseNote}</p>
                ) : null}

                {canReview ? (
                  <div className="mt-2 space-y-2">
                    <Input
                      value={responseNoteDraft[item._id] ?? ""}
                      onChange={(event) =>
                        setResponseNoteDraft((current) => ({
                          ...current,
                          [item._id]: event.target.value
                        }))
                      }
                      placeholder="Optional response note"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(item._id, "in_review")}
                        disabled={updatingId === item._id}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(item._id, "accepted")}
                        disabled={updatingId === item._id}
                        className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(item._id, "declined")}
                        disabled={updatingId === item._id}
                        className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : null}

                {canCreate ? (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteRequest(item._id)}
                      disabled={deletingId === item._id}
                      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60 dark:text-rose-400"
                    >
                      {deletingId === item._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {canCreate ? (
        <p className="text-xs text-slate-500">
          Submissions notify selected recipients immediately. Signed in as{" "}
          <span className="font-medium">{user?.email ?? "NGO user"}</span>.
        </p>
      ) : null}
    </div>
  );
}

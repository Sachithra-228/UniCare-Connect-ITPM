
"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/shared/Card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  sectionId?: string;
  read?: boolean;
  date?: string;
  createdAt?: string;
};

type AidRequest = {
  _id: string;
  category: string;
  status: string;
  submittedAt?: string;
  updatedAt?: string;
};

type Application = {
  _id: string;
  kind: string;
  title: string;
  organization?: string;
  status: string;
  submittedAt?: string;
  updatedAt?: string;
};

type MentorshipSession = {
  _id: string;
  mentorName: string;
  topic: string;
  status: string;
  scheduledTime?: string;
  updatedAt?: string;
};

type Scholarship = {
  _id: string;
  title: string;
  deadline?: string;
  status?: string;
};

type Job = {
  _id: string;
  title: string;
  applicationDeadline?: string;
  status?: string;
  moderationStatus?: string;
};

type UpcomingDate = {
  id: string;
  label: string;
  date: string;
  source: string;
};

type ParentResource = {
  _id: string;
  title: string;
  type: string;
  description: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ParentTrackerNote = {
  _id: string;
  title: string;
  note: string;
  tag: string;
  isPinned?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

type ParentMessage = {
  _id: string;
  audience: string;
  subject: string;
  body: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

type ParentLinkedStudent = {
  _id: string;
  name: string;
  email?: string;
  university?: string;
  linkSource?: string;
};

type ParentDashboardPayload = {
  linkedStudent: ParentLinkedStudent | null;
  stats: {
    unreadAlerts: number;
    notifications: number;
    aidRequests: number;
    pendingAidRequests: number;
    applications: number;
    pendingApplications: number;
    mentorshipSessions: number;
    upcomingDeadlines: number;
    privateTrackingNotes: number;
  };
  notifications: Notification[];
  alerts: Notification[];
  aidRequests: AidRequest[];
  applications: Application[];
  mentorshipSessions: MentorshipSession[];
  scholarships: Scholarship[];
  jobs: Job[];
  upcomingDates: UpcomingDate[];
  resources: ParentResource[];
  trackerNotes: ParentTrackerNote[];
  communications: ParentMessage[];
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function toObjectIdLike(input: string) {
  return /^[a-f0-9]{24}$/i.test(input);
}

function useParentDashboard() {
  const [data, setData] = useState<ParentDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/parent/dashboard", { cache: "no-store" });
      const payload = (await response.json()) as ParentDashboardPayload & { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Could not load parent dashboard data.");
        setData(null);
        return;
      }
      setData(payload);
    } catch {
      setError("Could not load parent dashboard data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const cls =
    normalized === "approved" || normalized === "completed" || normalized === "sent"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
      : normalized === "rejected" || normalized === "cancelled"
        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{value}</span>;
}

function SectionNotice({ text }: { text: string }) {
  return (
    <Card className="border-primary/20 bg-primary/5 p-4">
      <p className="text-sm text-slate-700 dark:text-slate-200">{text}</p>
    </Card>
  );
}

export function ParentLiveHomeSection() {
  const { data, loading, error } = useParentDashboard();
  const unreadAlerts = data?.stats.unreadAlerts ?? 0;
  const pendingAid = data?.stats.pendingAidRequests ?? 0;
  const pendingApplications = data?.stats.pendingApplications ?? 0;
  const upcomingDeadlines = data?.stats.upcomingDeadlines ?? 0;
  const hasPriorityItems = unreadAlerts + pendingAid + pendingApplications > 0;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-0 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                Parent Dashboard
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Parent Home</h2>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Keep a confident view of your child&apos;s progress with live updates on alerts,
                support requests, and upcoming deadlines.
              </p>
            </div>
            <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-200">
              Live data
            </span>
          </div>

          {data?.linkedStudent ? (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="font-semibold">Linked student:</span> {data.linkedStudent.name}
              {data.linkedStudent.email ? ` (${data.linkedStudent.email})` : ""}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
              No student linked yet. Go to &quot;My Student&quot; and connect your child profile.
            </div>
          )}
        </div>
      </Card>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Unread alerts"
          value={String(unreadAlerts)}
          description="Needs parent attention"
        />
        <StatCard
          label="Aid requests"
          value={String(data?.stats.aidRequests ?? 0)}
          description={`${pendingAid} pending`}
        />
        <StatCard
          label="Applications"
          value={String(data?.stats.applications ?? 0)}
          description={`${pendingApplications} pending`}
        />
        <StatCard
          label="Upcoming deadlines"
          value={String(upcomingDeadlines)}
          description="Jobs, scholarships, aid"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <Card className="space-y-3 border-slate-100 p-4 shadow-sm dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent activity</h3>
            <span className="text-xs text-slate-500">Last 8 updates</span>
          </div>
          {loading && !data ? <p className="text-sm text-slate-500">Loading activity...</p> : null}
          <div className="space-y-2">
            {(data?.notifications ?? []).slice(0, 8).map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-white dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                  {item.read ? null : (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-200">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.message}</p>
                <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.createdAt || item.date)}</p>
              </div>
            ))}
            {!loading && !(data?.notifications?.length ?? 0) ? (
              <p className="text-sm text-slate-500">No live notifications yet.</p>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-3 border-slate-100 p-4 shadow-sm dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Priority snapshot</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">Unread alerts</span>
              <span className="font-semibold text-slate-900 dark:text-white">{unreadAlerts}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">Pending aid requests</span>
              <span className="font-semibold text-slate-900 dark:text-white">{pendingAid}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">Pending applications</span>
              <span className="font-semibold text-slate-900 dark:text-white">{pendingApplications}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">Upcoming deadlines</span>
              <span className="font-semibold text-slate-900 dark:text-white">{upcomingDeadlines}</span>
            </div>
          </div>

          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              hasPriorityItems
                ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            }`}
          >
            {hasPriorityItems
              ? "You have items that may need follow-up this week."
              : "Everything looks up to date. No immediate follow-up needed."}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ParentLiveMyStudentSection() {
  const { data, loading, error, refresh } = useParentDashboard();
  const [info, setInfo] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteTag, setNoteTag] = useState("general");
  const [notePinned, setNotePinned] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTag, setEditTag] = useState("general");
  const [editPinned, setEditPinned] = useState(false);

  useEffect(() => {
    if (!data?.linkedStudent || linkInput) return;
    setLinkInput(data.linkedStudent.email || data.linkedStudent.name || "");
  }, [data?.linkedStudent, linkInput]);

  const linkStudent = async () => {
    const value = linkInput.trim();
    if (!value) {
      setInfo({ type: "err", text: "Enter student email, name, or id." });
      return;
    }

    setLinkSaving(true);
    setInfo(null);
    try {
      const payload: Record<string, string> = value.includes("@")
        ? { linkedStudentEmail: value }
        : toObjectIdLike(value)
          ? { linkedStudentId: value }
          : { linkedStudentName: value };

      const response = await fetch("/api/parent/student-link", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not link student." });
        return;
      }
      setInfo({ type: "ok", text: "Student linked successfully." });
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not link student." });
    } finally {
      setLinkSaving(false);
    }
  };

  const unlinkStudent = async () => {
    setLinkSaving(true);
    setInfo(null);
    try {
      const response = await fetch("/api/parent/student-link", { method: "DELETE" });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not unlink student." });
        return;
      }
      setInfo({ type: "ok", text: "Student link removed." });
      setLinkInput("");
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not unlink student." });
    } finally {
      setLinkSaving(false);
    }
  };

  const addPrivateNote = async () => {
    if (!noteTitle.trim() || !noteBody.trim()) {
      setInfo({ type: "err", text: "Title and note are required." });
      return;
    }

    setNoteSaving(true);
    setInfo(null);
    try {
      const response = await fetch("/api/parent/tracker-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteTitle, note: noteBody, tag: noteTag, isPinned: notePinned })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not add private note." });
        return;
      }
      setNoteTitle("");
      setNoteBody("");
      setNoteTag("general");
      setNotePinned(false);
      setInfo({ type: "ok", text: "Private tracking note saved." });
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not add private note." });
    } finally {
      setNoteSaving(false);
    }
  };

  const startEdit = (item: ParentTrackerNote) => {
    setEditingId(item._id);
    setEditTitle(item.title);
    setEditBody(item.note);
    setEditTag(item.tag || "general");
    setEditPinned(Boolean(item.isPinned));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setInfo(null);
    try {
      const response = await fetch(`/api/parent/tracker-notes/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, note: editBody, tag: editTag, isPinned: editPinned })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not update private note." });
        return;
      }
      setInfo({ type: "ok", text: "Private note updated." });
      setEditingId(null);
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not update private note." });
    }
  };

  const deleteNote = async (id: string) => {
    if (!window.confirm("Delete this private note?")) return;
    setInfo(null);
    try {
      const response = await fetch(`/api/parent/tracker-notes/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not delete private note." });
        return;
      }
      setInfo({ type: "ok", text: "Private note deleted." });
      if (editingId === id) setEditingId(null);
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not delete private note." });
    }
  };

  return (
    <div className="space-y-5">
      <SectionNotice text="Parent private tracker is visible only to parent accounts. Students cannot see these notes." />
      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</Card> : null}
      {info ? <Card className={`p-3 text-sm ${info.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"}`}>{info.text}</Card> : null}

      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">Link student</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Enter student email, name, or student id to connect this parent profile with live student data.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input value={linkInput} onChange={(event) => setLinkInput(event.target.value)} placeholder="student@email.com or full name" className="max-w-md" />
          <Button variant="primary" onClick={linkStudent} disabled={linkSaving}>{linkSaving ? "Saving..." : "Save link"}</Button>
          <Button variant="ghost" onClick={unlinkStudent} disabled={linkSaving || !data?.linkedStudent}>Remove link</Button>
        </div>
        {data?.linkedStudent ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{data.linkedStudent.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.linkedStudent.email || "No email"}
              {data.linkedStudent.university ? ` • ${data.linkedStudent.university}` : ""}
              {data.linkedStudent.linkSource ? ` • linked by ${data.linkedStudent.linkSource}` : ""}
            </p>
          </div>
        ) : <p className="text-sm text-slate-500">No linked student yet.</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Aid requests" value={String(data?.stats.aidRequests ?? 0)} description={`${data?.stats.pendingAidRequests ?? 0} pending`} />
        <StatCard label="Applications" value={String(data?.stats.applications ?? 0)} description={`${data?.stats.pendingApplications ?? 0} pending`} />
        <StatCard label="Mentorship sessions" value={String(data?.stats.mentorshipSessions ?? 0)} description="Live student-linked sessions" />
      </div>

      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">Private tracker (parent only)</h3>
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Note title" />
          <Input value={noteTag} onChange={(event) => setNoteTag(event.target.value)} placeholder="Tag" />
        </div>
        <textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Private note" className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={notePinned} onChange={(event) => setNotePinned(event.target.checked)} className="rounded" />Pin this note</label>
        <Button variant="primary" onClick={addPrivateNote} disabled={noteSaving || loading}>{noteSaving ? "Saving..." : "Add note"}</Button>

        <div className="space-y-2">
          {(data?.trackerNotes ?? []).map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              {editingId === item._id ? (
                <div className="space-y-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                    <Input value={editTag} onChange={(event) => setEditTag(event.target.value)} />
                  </div>
                  <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={editPinned} onChange={(event) => setEditPinned(event.target.checked)} className="rounded" />Pinned</label>
                  <div className="flex gap-2"><Button variant="primary" onClick={saveEdit}>Save</Button><Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <div className="flex items-center gap-2">{item.isPinned ? <span className="text-xs font-medium text-primary">Pinned</span> : null}<span className="text-xs text-slate-500">{item.tag}</span></div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.note}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatDateTime(item.updatedAt || item.createdAt)}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(item)} className="font-medium text-primary hover:underline">Edit</button>
                      <button type="button" onClick={() => void deleteNote(item._id)} className="font-medium text-rose-600 hover:underline dark:text-rose-300">Delete</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {!loading && !(data?.trackerNotes?.length ?? 0) ? <p className="text-sm text-slate-500">No private tracking notes yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}

export function ParentLiveFinancialOverviewSection() {
  const { data, loading, error } = useParentDashboard();

  return (
    <div className="space-y-5">
      <SectionNotice text="Financial overview is generated from live aid requests and student applications." />
      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</Card> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Aid requests" value={String(data?.stats.aidRequests ?? 0)} description="Total" />
        <StatCard label="Pending aid" value={String(data?.stats.pendingAidRequests ?? 0)} description="Needs review" />
        <StatCard label="Applications" value={String(data?.stats.applications ?? 0)} description="Jobs + scholarships" />
        <StatCard label="Pending applications" value={String(data?.stats.pendingApplications ?? 0)} description="Awaiting updates" />
      </div>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Aid request timeline</h3>
        <div className="space-y-2">
          {(data?.aidRequests ?? []).map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-2"><p className="font-medium text-slate-900 dark:text-slate-100">{item.category}</p><StatusPill value={item.status} /></div>
              <p className="mt-1 text-xs text-slate-500">Submitted: {formatDate(item.submittedAt)}</p>
            </div>
          ))}
          {!loading && !(data?.aidRequests?.length ?? 0) ? <p className="text-sm text-slate-500">No aid requests found for linked student.</p> : null}
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Application timeline</h3>
        <div className="space-y-2">
          {(data?.applications ?? []).map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-2"><p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p><StatusPill value={item.status} /></div>
              <p className="mt-1 text-xs text-slate-500">{item.kind.toUpperCase()}{item.organization ? ` • ${item.organization}` : ""}{item.submittedAt ? ` • ${formatDate(item.submittedAt)}` : ""}</p>
            </div>
          ))}
          {!loading && !(data?.applications?.length ?? 0) ? <p className="text-sm text-slate-500">No student applications found yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}

export function ParentLiveImportantDatesSection() {
  const { data, loading, error } = useParentDashboard();

  return (
    <div className="space-y-5">
      <SectionNotice text="Deadlines are fetched from live scholarship and job data plus aid activity updates." />
      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</Card> : null}
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Upcoming dates</h3>
        <div className="space-y-2">
          {(data?.upcomingDates ?? []).map((item) => (
            <div key={`${item.source}-${item.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div><p className="font-medium text-slate-900 dark:text-slate-100">{item.label}</p><p className="text-[11px] uppercase tracking-wide text-slate-500">{item.source}</p></div>
              <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
            </div>
          ))}
          {!loading && !(data?.upcomingDates?.length ?? 0) ? <p className="text-sm text-slate-500">No upcoming dates right now.</p> : null}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2 p-4">
          <h4 className="text-sm font-semibold">Scholarships feed</h4>
          {(data?.scholarships ?? []).slice(0, 8).map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
              <p className="text-xs text-slate-500">Deadline: {formatDate(item.deadline)}</p>
            </div>
          ))}
        </Card>
        <Card className="space-y-2 p-4">
          <h4 className="text-sm font-semibold">Jobs feed</h4>
          {(data?.jobs ?? []).slice(0, 8).map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
              <p className="text-xs text-slate-500">Deadline: {formatDate(item.applicationDeadline)}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function ParentLiveCommunicationsSection() {
  const { data, loading, error, refresh } = useParentDashboard();
  const [info, setInfo] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [audience, setAudience] = useState("admin_faculty");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const sendMessage = async () => {
    if (!subject.trim() || !body.trim()) {
      setInfo({ type: "err", text: "Subject and message are required." });
      return;
    }
    setSaving(true);
    setInfo(null);
    try {
      const response = await fetch("/api/parent/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, subject, body })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not send message." });
        return;
      }
      setSubject("");
      setBody("");
      setInfo({ type: "ok", text: "Message sent." });
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not send message." });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: ParentMessage) => {
    setEditingId(item._id);
    setEditSubject(item.subject);
    setEditBody(item.body);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const response = await fetch(`/api/parent/communications/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, body: editBody })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not update message." });
        return;
      }
      setEditingId(null);
      setInfo({ type: "ok", text: "Message updated." });
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not update message." });
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const response = await fetch(`/api/parent/communications/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not delete message." });
        return;
      }
      setInfo({ type: "ok", text: "Message deleted." });
      if (editingId === id) setEditingId(null);
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not delete message." });
    }
  };

  return (
    <div className="space-y-5">
      <SectionNotice text="Communications support full CRUD for parent-sent messages, with live inbound updates from notifications." />
      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</Card> : null}
      {info ? <Card className={`p-3 text-sm ${info.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"}`}>{info.text}</Card> : null}
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Send message</h3>
        <div className="grid gap-2 md:grid-cols-2">
          <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={audience} onChange={(event) => setAudience(event.target.value)}>
            <option value="admin_faculty">University Admin / Faculty</option>
            <option value="mentor">Mentor</option>
          </select>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
        </div>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message" className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        <Button variant="primary" onClick={sendMessage} disabled={saving || loading}>{saving ? "Sending..." : "Send"}</Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">Inbound updates</h3>
          {(data?.notifications ?? []).slice(0, 10).map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.message}</p>
              <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(item.createdAt || item.date)}</p>
            </div>
          ))}
          {!loading && !(data?.notifications?.length ?? 0) ? <p className="text-sm text-slate-500">No inbound updates yet.</p> : null}
        </Card>
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">Sent messages</h3>
          {(data?.communications ?? []).map((item) => (
            <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              {editingId === item._id ? (
                <div className="space-y-2">
                  <Input value={editSubject} onChange={(event) => setEditSubject(event.target.value)} />
                  <textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                  <div className="flex gap-2"><Button variant="primary" onClick={saveEdit}>Save</Button><Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2"><p className="font-medium text-slate-900 dark:text-slate-100">{item.subject}</p><StatusPill value={item.status} /></div>
                  <p className="mt-1 text-xs text-slate-500">To: {item.audience}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.body}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatDateTime(item.updatedAt || item.createdAt)}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(item)} className="font-medium text-primary hover:underline">Edit</button>
                      <button type="button" onClick={() => void deleteMessage(item._id)} className="font-medium text-rose-600 hover:underline dark:text-rose-300">Delete</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {!loading && !(data?.communications?.length ?? 0) ? <p className="text-sm text-slate-500">No sent messages yet.</p> : null}
        </Card>
      </div>
    </div>
  );
}

export function ParentLiveResourcesSection() {
  const { data, loading, error, refresh } = useParentDashboard();
  const [info, setInfo] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Guide");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("Guide");
  const [editDescription, setEditDescription] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const addResource = async () => {
    if (!title.trim() || !description.trim()) {
      setInfo({ type: "err", text: "Title and description are required." });
      return;
    }
    setSaving(true);
    setInfo(null);
    try {
      const response = await fetch("/api/parent/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, description, url })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not add resource." });
        return;
      }
      setTitle("");
      setType("Guide");
      setDescription("");
      setUrl("");
      setInfo({ type: "ok", text: "Resource added." });
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not add resource." });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: ParentResource) => {
    setEditingId(item._id);
    setEditTitle(item.title);
    setEditType(item.type || "Guide");
    setEditDescription(item.description || "");
    setEditUrl(item.url || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const response = await fetch(`/api/parent/resources/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, type: editType, description: editDescription, url: editUrl })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not update resource." });
        return;
      }
      setEditingId(null);
      setInfo({ type: "ok", text: "Resource updated." });
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not update resource." });
    }
  };

  const deleteResource = async (id: string) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      const response = await fetch(`/api/parent/resources/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setInfo({ type: "err", text: result.message ?? "Could not delete resource." });
        return;
      }
      setInfo({ type: "ok", text: "Resource deleted." });
      if (editingId === id) setEditingId(null);
      await refresh();
    } catch {
      setInfo({ type: "err", text: "Could not delete resource." });
    }
  };

  return (
    <div className="space-y-5">
      <SectionNotice text="Resources now use live parent-managed entries with full CRUD." />
      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</Card> : null}
      {info ? <Card className={`p-3 text-sm ${info.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"}`}>{info.text}</Card> : null}
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Add resource</h3>
        <div className="grid gap-2 md:grid-cols-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Resource title" /><Input value={type} onChange={(event) => setType(event.target.value)} placeholder="Type" /></div>
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Optional URL" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        <Button variant="primary" onClick={addResource} disabled={saving || loading}>{saving ? "Saving..." : "Add resource"}</Button>
      </Card>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Resource list</h3>
        {(data?.resources ?? []).map((item) => (
          <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            {editingId === item._id ? (
              <div className="space-y-2">
                <div className="grid gap-2 md:grid-cols-2"><Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /><Input value={editType} onChange={(event) => setEditType(event.target.value)} /></div>
                <Input value={editUrl} onChange={(event) => setEditUrl(event.target.value)} placeholder="Optional URL" />
                <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <div className="flex gap-2"><Button variant="primary" onClick={saveEdit}>Save</Button><Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p><span className="text-xs text-slate-500">{item.type}</span></div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">Open link</a> : null}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{formatDateTime(item.updatedAt || item.createdAt)}</span>
                  <div className="flex gap-2"><button type="button" onClick={() => startEdit(item)} className="font-medium text-primary hover:underline">Edit</button><button type="button" onClick={() => void deleteResource(item._id)} className="font-medium text-rose-600 hover:underline dark:text-rose-300">Delete</button></div>
                </div>
              </>
            )}
          </div>
        ))}
        {!loading && !(data?.resources?.length ?? 0) ? <p className="text-sm text-slate-500">No resources added yet.</p> : null}
      </Card>
    </div>
  );
}

export function ParentLiveAlertsSection() {
  const { data, loading, error } = useParentDashboard();
  return (
    <div className="space-y-5">
      <SectionNotice text="Alerts are pulled from live notifications and student-linked updates." />
      {error ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</Card> : null}
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Alert feed</h3>
        {(data?.alerts ?? []).map((item) => (
          <div key={item._id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
            <p className="font-medium text-amber-900 dark:text-amber-100">{item.title}</p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">{item.message}</p>
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">{formatDateTime(item.createdAt || item.date)}</p>
          </div>
        ))}
        {!loading && !(data?.alerts?.length ?? 0) ? <p className="text-sm text-slate-500">No urgent alerts at the moment.</p> : null}
      </Card>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Mentorship sessions</h3>
        {(data?.mentorshipSessions ?? []).slice(0, 10).map((item) => (
          <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-2"><p className="font-medium text-slate-900 dark:text-slate-100">{item.topic}</p><StatusPill value={item.status} /></div>
            <p className="mt-1 text-xs text-slate-500">Mentor: {item.mentorName}{item.scheduledTime ? ` • ${formatDateTime(item.scheduledTime)}` : ""}</p>
          </div>
        ))}
        {!loading && !(data?.mentorshipSessions?.length ?? 0) ? <p className="text-sm text-slate-500">No mentorship sessions found.</p> : null}
      </Card>
    </div>
  );
}


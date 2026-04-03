"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Pencil, Trash2, Video } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/text-area";

type WebinarItem = {
  _id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: "online" | "in-person" | "hybrid";
  joinLink?: string;
  description: string;
  status: "upcoming" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
};

type WebinarFormState = {
  title: string;
  scheduledAt: string;
  durationMinutes: string;
  mode: "online" | "in-person" | "hybrid";
  joinLink: string;
  description: string;
  status: "upcoming" | "completed" | "cancelled";
};

const initialForm: WebinarFormState = {
  title: "",
  scheduledAt: "",
  durationMinutes: "60",
  mode: "online",
  joinLink: "",
  description: "",
  status: "upcoming"
};

function toDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function MentorWebinarsCrudSection() {
  const [items, setItems] = useState<WebinarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebinarFormState>(initialForm);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mentor/webinars", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { items?: WebinarItem[] };
      if (!response.ok) {
        setFeedback({ type: "err", text: "Unable to load webinars." });
        setItems([]);
        return;
      }
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch {
      setFeedback({ type: "err", text: "Unable to load webinars." });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const onSave = async () => {
    if (!form.title.trim() || !form.scheduledAt || !form.description.trim()) {
      setFeedback({ type: "err", text: "Title, schedule, and description are required." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(editingId ? `/api/mentor/webinars/${editingId}` : "/api/mentor/webinars", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMinutes: Number(form.durationMinutes)
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback({ type: "err", text: payload.message ?? "Unable to save webinar." });
        return;
      }
      setFeedback({ type: "ok", text: editingId ? "Webinar updated." : "Webinar published." });
      resetForm();
      await loadItems();
    } catch {
      setFeedback({ type: "err", text: "Unable to save webinar." });
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: WebinarItem) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      scheduledAt: toDateTimeLocal(item.scheduledAt),
      durationMinutes: String(item.durationMinutes || 60),
      mode: item.mode || "online",
      joinLink: item.joinLink || "",
      description: item.description,
      status: item.status || "upcoming"
    });
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/mentor/webinars/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback({ type: "err", text: payload.message ?? "Unable to delete webinar." });
        return;
      }
      setFeedback({ type: "ok", text: "Webinar deleted." });
      if (editingId === id) resetForm();
      await loadItems();
    } catch {
      setFeedback({ type: "err", text: "Unable to delete webinar." });
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const upcoming = items.filter((item) => item.status === "upcoming").length;
    const completed = items.filter((item) => item.status === "completed").length;
    return { total: items.length, upcoming, completed };
  }, [items]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-indigo-100/70 via-white to-cyan-100/60 p-5 dark:from-indigo-950/30 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Webinars</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Manage mentorship webinars</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Create sessions, update schedules, and track attendance status.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 dark:bg-slate-900/60">
              <p className="font-semibold text-slate-900 dark:text-white">{stats.total}</p>
              <p className="text-slate-500">Total</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 dark:bg-slate-900/60">
              <p className="font-semibold text-slate-900 dark:text-white">{stats.upcoming}</p>
              <p className="text-slate-500">Upcoming</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-white/80 px-3 py-2 dark:bg-slate-900/60">
              <p className="font-semibold text-slate-900 dark:text-white">{stats.completed}</p>
              <p className="text-slate-500">Completed</p>
            </div>
          </div>
        </div>
      </Card>

      {feedback ? (
        <p
          className={`rounded-xl border px-4 py-2 text-sm ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <Card className="space-y-4 p-5">
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          {editingId ? "Edit webinar" : "Create webinar"}
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Webinar title"
          />
          <Input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
          />
          <Input
            type="number"
            min={15}
            max={600}
            value={form.durationMinutes}
            onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
            placeholder="Duration in minutes"
          />
          <select
            value={form.mode}
            onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value as WebinarFormState["mode"] }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <Input
            value={form.joinLink}
            onChange={(event) => setForm((prev) => ({ ...prev, joinLink: event.target.value }))}
            placeholder="Join link (optional)"
          />
          <select
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, status: event.target.value as WebinarFormState["status"] }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="md:col-span-2">
            <TextArea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe what attendees will learn..."
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {editingId ? (
            <Button variant="ghost" onClick={resetForm} disabled={saving}>
              Cancel edit
            </Button>
          ) : null}
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update webinar" : "Publish webinar"}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Webinar schedule</h4>
        {loading ? (
          <p className="text-sm text-slate-500">Loading webinars...</p>
        ) : !items.length ? (
          <p className="text-sm text-slate-500">No webinars yet. Publish one above.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(item.scheduledAt).toLocaleString()} · {item.durationMinutes} min · {item.mode}
                    </p>
                    {item.joinLink ? (
                      <a
                        href={item.joinLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Open join link
                      </a>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium capitalize text-primary">
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-primary dark:hover:bg-slate-900"
                      title="Edit webinar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-500 disabled:opacity-60 dark:hover:bg-slate-900"
                      title="Delete webinar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{item.description}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

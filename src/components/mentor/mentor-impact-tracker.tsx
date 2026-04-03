"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { TextArea } from "@/components/shared/text-area";
import type { MentorshipSession } from "@/types";

type SuccessStoryItem = {
  _id: string;
  title: string;
  studentLabel?: string;
  summary: string;
  impactMetric?: string;
  createdAt?: string;
  updatedAt?: string;
};

type StoryFormState = {
  title: string;
  studentLabel: string;
  summary: string;
  impactMetric: string;
};

const initialForm: StoryFormState = {
  title: "",
  studentLabel: "",
  summary: "",
  impactMetric: ""
};

export function MentorImpactTrackerCrudSection() {
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [stories, setStories] = useState<SuccessStoryItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StoryFormState>(initialForm);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadSessions = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await fetch("/api/mentorship-sessions", { cache: "no-store" });
      const payload = (await response.json().catch(() => [])) as MentorshipSession[];
      setSessions(Array.isArray(payload) ? payload : []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadStories = useCallback(async () => {
    setLoadingStories(true);
    try {
      const response = await fetch("/api/mentor/success-stories", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { items?: SuccessStoryItem[] };
      if (!response.ok) {
        setFeedback({ type: "err", text: "Unable to load success stories." });
        setStories([]);
        return;
      }
      setStories(Array.isArray(payload.items) ? payload.items : []);
    } catch {
      setFeedback({ type: "err", text: "Unable to load success stories." });
      setStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadStories();
  }, [loadSessions, loadStories]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const onSave = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      setFeedback({ type: "err", text: "Title and summary are required." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(
        editingId ? `/api/mentor/success-stories/${editingId}` : "/api/mentor/success-stories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback({ type: "err", text: payload.message ?? "Unable to save story." });
        return;
      }
      setFeedback({ type: "ok", text: editingId ? "Story updated." : "Story added." });
      resetForm();
      await loadStories();
    } catch {
      setFeedback({ type: "err", text: "Unable to save story." });
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: SuccessStoryItem) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      studentLabel: item.studentLabel || "",
      summary: item.summary,
      impactMetric: item.impactMetric || ""
    });
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/mentor/success-stories/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback({ type: "err", text: payload.message ?? "Unable to delete story." });
        return;
      }
      setFeedback({ type: "ok", text: "Story deleted." });
      if (editingId === id) resetForm();
      await loadStories();
    } catch {
      setFeedback({ type: "err", text: "Unable to delete story." });
    } finally {
      setDeletingId(null);
    }
  };

  const completedSessions = useMemo(
    () => sessions.filter((session) => String(session.status).toLowerCase() === "completed").length,
    [sessions]
  );
  const uniqueMentees = useMemo(() => new Set(sessions.map((session) => session.studentId)).size, [sessions]);
  const avgRating = useMemo(() => {
    const ratings = sessions
      .map((session) => (typeof session.rating === "number" ? session.rating : null))
      .filter((value): value is number => value !== null);
    if (!ratings.length) return "-";
    const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    return average.toFixed(1);
  }, [sessions]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-emerald-100/70 via-white to-amber-100/60 p-5 dark:from-emerald-950/20 dark:via-slate-900 dark:to-amber-950/20">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Impact Tracker</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Measure mentorship outcomes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Track your completed sessions and maintain verifiable success stories.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-xs font-medium text-primary dark:bg-slate-900/60">
            <Sparkles className="h-4 w-4" />
            {stories.length} stories
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Completed sessions"
          value={loadingStats ? "..." : String(completedSessions)}
          description="Total finished mentorship sessions"
        />
        <StatCard
          label="Students mentored"
          value={loadingStats ? "..." : String(uniqueMentees)}
          description="Unique mentees across all sessions"
        />
        <StatCard
          label="Average rating"
          value={loadingStats ? "..." : String(avgRating)}
          description="Based on student feedback"
        />
      </div>

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
          {editingId ? "Edit success story" : "Add success story"}
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Story title"
          />
          <Input
            value={form.studentLabel}
            onChange={(event) => setForm((prev) => ({ ...prev, studentLabel: event.target.value }))}
            placeholder="Student initials (optional)"
          />
          <Input
            value={form.impactMetric}
            onChange={(event) => setForm((prev) => ({ ...prev, impactMetric: event.target.value }))}
            placeholder="Impact metric (e.g., Internship in 6 weeks)"
            className="md:col-span-2"
          />
          <div className="md:col-span-2">
            <TextArea
              rows={4}
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Describe measurable outcomes from your mentorship..."
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
            {saving ? "Saving..." : editingId ? "Update story" : "Add story"}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">Success story log</h4>
        </div>
        {loadingStories ? (
          <p className="text-sm text-slate-500">Loading stories...</p>
        ) : !stories.length ? (
          <p className="text-sm text-slate-500">No stories added yet.</p>
        ) : (
          <div className="space-y-3">
            {stories.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.studentLabel ? `Student: ${item.studentLabel}` : "Student anonymized"}
                      {item.impactMetric ? ` · ${item.impactMetric}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-primary dark:hover:bg-slate-900"
                      title="Edit story"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-500 disabled:opacity-60 dark:hover:bg-slate-900"
                      title="Delete story"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{item.summary}</p>
                <p className="mt-3 text-[11px] text-slate-500">
                  Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "just now"}
                </p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

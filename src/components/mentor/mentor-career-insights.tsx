"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { TextArea } from "@/components/shared/text-area";

type CareerInsightItem = {
  _id: string;
  title: string;
  category: string;
  content: string;
  referenceUrl?: string;
  visibility: "mentees" | "public";
  createdAt?: string;
  updatedAt?: string;
};

type InsightFormState = {
  title: string;
  category: string;
  content: string;
  referenceUrl: string;
  visibility: "mentees" | "public";
};

const initialForm: InsightFormState = {
  title: "",
  category: "General",
  content: "",
  referenceUrl: "",
  visibility: "mentees"
};

export function MentorCareerInsightsCrudSection() {
  const [items, setItems] = useState<CareerInsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InsightFormState>(initialForm);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mentor/career-insights", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { items?: CareerInsightItem[] };
      if (!response.ok) {
        setFeedback({ type: "err", text: "Unable to load career insights." });
        setItems([]);
        return;
      }
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch {
      setFeedback({ type: "err", text: "Unable to load career insights." });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFeedback({ type: "err", text: "Title and content are required." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(
        editingId ? `/api/mentor/career-insights/${editingId}` : "/api/mentor/career-insights",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback({ type: "err", text: payload.message ?? "Unable to save insight." });
        return;
      }
      setFeedback({ type: "ok", text: editingId ? "Insight updated." : "Insight published." });
      resetForm();
      await loadItems();
    } catch {
      setFeedback({ type: "err", text: "Unable to save insight." });
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: CareerInsightItem) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      category: item.category || "General",
      content: item.content,
      referenceUrl: item.referenceUrl || "",
      visibility: item.visibility || "mentees"
    });
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/mentor/career-insights/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setFeedback({ type: "err", text: payload.message ?? "Unable to delete insight." });
        return;
      }
      setFeedback({ type: "ok", text: "Insight deleted." });
      if (editingId === id) resetForm();
      await loadItems();
    } catch {
      setFeedback({ type: "err", text: "Unable to delete insight." });
    } finally {
      setDeletingId(null);
    }
  };

  const count = useMemo(() => items.length, [items]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-sky-50 p-5 dark:from-primary/20 dark:via-slate-900 dark:to-sky-950/20">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Career Insights</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Publish mentor insights</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Share guides, referral advice, and interview strategies with your mentees.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-xs font-medium text-primary dark:bg-slate-900/60">
            <Compass className="h-4 w-4" />
            {count} insights
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
          {editingId ? "Edit insight" : "Create insight"}
        </h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Insight title"
          />
          <Input
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            placeholder="Category (Interview, Portfolio, Internships)"
          />
          <div className="md:col-span-2">
            <TextArea
              rows={5}
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Share practical guidance for mentees..."
            />
          </div>
          <Input
            value={form.referenceUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, referenceUrl: event.target.value }))}
            placeholder="Reference URL (optional)"
          />
          <select
            value={form.visibility}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, visibility: event.target.value as InsightFormState["visibility"] }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="mentees">Mentees only</option>
            <option value="public">All students</option>
          </select>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {editingId ? (
            <Button variant="ghost" onClick={resetForm} disabled={saving}>
              Cancel edit
            </Button>
          ) : null}
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update insight" : "Publish insight"}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Published insights</h4>
        {loading ? (
          <p className="text-sm text-slate-500">Loading insights...</p>
        ) : !items.length ? (
          <p className="text-sm text-slate-500">No insights yet. Publish your first one above.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((item) => (
              <article
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.category} · {item.visibility === "public" ? "Public" : "Mentees"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-primary dark:hover:bg-slate-900"
                      title="Edit insight"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      disabled={deletingId === item._id}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-500 disabled:opacity-60 dark:hover:bg-slate-900"
                      title="Delete insight"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{item.content}</p>
                {item.referenceUrl ? (
                  <a
                    href={item.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
                  >
                    Open reference
                  </a>
                ) : null}
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

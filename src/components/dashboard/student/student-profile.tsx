"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { useAuth } from "@/context/auth-context";

export function StudentProfile() {
  const { user, refreshUser, updateUserProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.contact ?? "");
  const [university, setUniversity] = useState(user?.university ?? "");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setContact(user.contact ?? "");
      setUniversity(user.university ?? "");
    }
  }, [user]);

  const savePersonal = async () => {
    if (!user?.email) return;
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
          email: user.email,
          name: name.trim() || user.name,
          contact: contact.trim() || undefined
        })
      });
      const data = (await res.json()) as { user?: { name?: string; contact?: string }; message?: string };
      if (res.ok && data.user) {
        updateUserProfile({ name: data.user.name, contact: data.user.contact });
        await refreshUser();
        setMessage({ type: "ok", text: "Saved." });
      } else {
        setMessage({ type: "err", text: (data as { message?: string }).message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const saveAcademic = async () => {
    if (!user?.email) return;
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
          email: user.email,
          name: user.name,
          university: university.trim() || undefined
        })
      });
      const data = (await res.json()) as { user?: { university?: string }; message?: string };
      if (res.ok && data.user) {
        updateUserProfile({ university: data.user.university });
        await refreshUser();
        setMessage({ type: "ok", text: "Academic info updated." });
      } else {
        setMessage({ type: "err", text: (data as { message?: string }).message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <p className={`rounded-xl border px-4 py-2 text-sm ${message.type === "ok" ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"}`}>
          {message.text}
        </p>
      )}
      <Card className="border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Profile visibility is controlled by privacy settings. Some fields are hidden from certain roles.
        </p>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <Input type="email" defaultValue={user?.email ?? ""} placeholder="Email" disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact</label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone number" />
          </div>
        </div>
        <Button variant="primary" onClick={savePersonal} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Academic info</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          University, degree, and year. Used for eligibility and recommendations.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">University</label>
            <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Degree / program</label>
            <Input placeholder="e.g. BSc Computer Science" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
            <Input placeholder="e.g. 2" />
          </div>
        </div>
        <Button variant="primary" onClick={saveAcademic} disabled={saving}>
          {saving ? "Saving…" : "Update academic info"}
        </Button>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload documents</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ID, transcripts, and other documents required for applications.
        </p>
        <Button variant="secondary" disabled>Upload document (coming soon)</Button>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy preferences</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Control which roles can see which parts of your profile.
        </p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            Allow mentors to see my career interests
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            Allow admins to see my financial aid status
          </label>
        </div>
        <Button variant="secondary" disabled>Save privacy settings (coming soon)</Button>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification settings</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Choose how you receive updates on applications, sessions, and deadlines.
        </p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            Email for application status changes
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            Reminders for mentorship sessions
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            Weekly wellness check-in reminder
          </label>
        </div>
        <Button variant="secondary" disabled>Save notification settings (coming soon)</Button>
      </Card>
    </div>
  );
}

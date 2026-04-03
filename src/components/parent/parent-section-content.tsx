"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { useAuth } from "@/context/auth-context";
import {
  defaultPreferences,
  mergePreferences,
  tabVariants,
  type ProfilePreferences,
  type ProfileTab
} from "@/components/profile/profile-preferences";
import {
  ParentLiveAlertsSection,
  ParentLiveCommunicationsSection,
  ParentLiveFinancialOverviewSection,
  ParentLiveHomeSection,
  ParentLiveImportantDatesSection,
  ParentLiveMyStudentSection,
  ParentLiveResourcesSection
} from "@/components/parent/parent-live-sections";

type Notification = {
  id?: string;
  _id?: string;
  title?: string;
  message?: string;
  date?: string;
  type?: string;
  read?: boolean;
};

type AidRequest = {
  _id?: string;
  category?: string;
  status?: string;
  submittedAt?: string;
};

type Scholarship = {
  _id?: string;
  title?: string;
  deadline?: string;
  status?: string;
};

type Job = {
  _id?: string;
  title?: string;
  applicationDeadline?: string;
};

type ParentSectionContentProps = {
  sectionId: string;
};

export function ParentSectionContent({ sectionId }: ParentSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "parent-home":
        return ParentLiveHomeSection;
      case "my-student":
        return ParentLiveMyStudentSection;
      case "financial-overview":
        return ParentLiveFinancialOverviewSection;
      case "important-dates":
        return ParentLiveImportantDatesSection;
      case "communications":
        return ParentLiveCommunicationsSection;
      case "resources":
        return ParentLiveResourcesSection;
      case "alerts":
        return ParentLiveAlertsSection;
      case "profile":
        return ParentProfileSection;
      default:
        return ParentHomeSection;
    }
  }, [sectionId]);

  return <Section />;
}

function useParentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray((data as { notifications?: unknown[] }).notifications)) {
          setNotifications(
            ((data as { notifications: Notification[] }).notifications ?? []).map((n) => ({
              ...n,
              id: n.id ?? n._id
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return notifications;
}

function useAidRequests() {
  const [requests, setRequests] = useState<AidRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/aid-requests")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setRequests(data);
        }
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return requests;
}

function useScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/scholarships")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setScholarships(data);
        }
      })
      .catch(() => {
        if (!cancelled) setScholarships([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return scholarships;
}

function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/jobs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setJobs(data);
        }
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return jobs;
}

function ParentHomeSection() {
  const notifications = useParentNotifications();
  const scholarships = useScholarships();
  const jobs = useJobs();

  const today = new Date().toISOString().split("T")[0];
  const upcomingDeadlines = [
    ...scholarships.map((s) => s.deadline).filter(Boolean),
    ...jobs.map((j) => j.applicationDeadline).filter(Boolean)
  ].filter((d) => (d as string) >= today).length;

  const unreadAlerts = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-8">
      <Card className="space-y-2 p-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Welcome, Parent / Guardian
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This space gives you a high‑level view of your child&apos;s academic and financial
          journey, without exposing private wellness details.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Unread alerts"
          value={String(unreadAlerts)}
          description="Messages that may need your attention"
        />
        <StatCard
          label="Scholarship & aid items"
          value={String(scholarships.length)}
          description="Applications or opportunities related to your child"
        />
        <StatCard
          label="Upcoming deadlines"
          value={String(upcomingDeadlines)}
          description="Applications, events, or payments"
        />
        <StatCard
          label="Recent notifications"
          value={String(notifications.length)}
          description="Updates from university or mentors"
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Recent activity summary</h3>
        <div className="space-y-2 text-sm">
          {notifications.slice(0, 5).map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-medium">{n.title ?? "Update"}</p>
              <p className="text-xs text-slate-500">{n.message}</p>
              {n.date && (
                <p className="mt-1 text-[11px] text-slate-400">
                  {n.date}
                </p>
              )}
            </div>
          ))}
          {!notifications.length && (
            <p className="text-sm text-slate-500">
              No recent updates yet. When the university or mentors send messages, they&apos;ll
              appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ParentMyStudentSection() {
  const aidRequests = useAidRequests();

  const inProgressAid = aidRequests.filter(
    (r) => r.status && !["approved", "Approved", "rejected", "Rejected"].includes(r.status)
  ).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        View a high‑level picture of your child&apos;s journey. Academic and wellness details are
        summarized and may require explicit consent for deeper access.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Progress overview</h3>
        <p className="text-sm text-slate-500">
          This section will connect to your child&apos;s academic records and anonymized wellness
          trends. For now, it summarizes support activity such as aid requests and applications.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Active aid / support cases"
            value={String(inProgressAid)}
            description="Requests still being processed"
          />
          <StatCard
            label="Support history"
            value={String(aidRequests.length)}
            description="Total recorded requests"
          />
          <StatCard
            label="Achievements"
            value="—"
            description="Hook into academic & co‑curricular data"
          />
        </div>
      </Card>
    </div>
  );
}

function ParentFinancialOverviewSection() {
  const aidRequests = useAidRequests();
  const scholarships = useScholarships();

  const approvedAid = aidRequests.filter((r) =>
    ["approved", "Approved"].includes(r.status ?? "")
  ).length;
  const pendingAid = aidRequests.filter(
    (r) => r.status && !["approved", "Approved", "rejected", "Rejected"].includes(r.status)
  ).length;

  const activeScholarships = scholarships.filter(
    (s) => !s.status || s.status === "active" || s.status === "Active"
  ).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Track scholarships and aid related to your child. This view focuses on statuses and key
        milestones, not on private financial or wellness details.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Approved aid"
          value={String(approvedAid)}
          description="Scholarships or emergency funds"
        />
        <StatCard
          label="Pending applications"
          value={String(pendingAid)}
          description="Waiting on decisions"
        />
        <StatCard
          label="Open scholarship opportunities"
          value={String(activeScholarships)}
          description="You can encourage your child to apply"
        />
      </div>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Recent financial activity</h3>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {aidRequests.slice(0, 5).map((r) => (
            <div key={r._id ?? r.category} className="py-3">
              <p className="font-medium">{r.category ?? "Support request"}</p>
              <p className="text-xs text-slate-500">
                Status: {r.status ?? "In progress"} • Submitted: {r.submittedAt ?? "N/A"}
              </p>
            </div>
          ))}
          {!aidRequests.length && (
            <p className="py-3 text-sm text-slate-500">
              No recorded aid activity yet. When your child applies for scholarships or assistance,
              you&apos;ll see a summary here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ParentImportantDatesSection() {
  const scholarships = useScholarships();
  const jobs = useJobs();

  const today = new Date().toISOString().split("T")[0];
  const upcomingItems: { id: string; label: string; date: string }[] = [];

  scholarships.forEach((s) => {
    if (s.deadline && s.deadline >= today) {
      upcomingItems.push({
        id: String(s._id ?? s.title),
        label: s.title ?? "Scholarship deadline",
        date: s.deadline
      });
    }
  });

  jobs.forEach((j) => {
    if (j.applicationDeadline && j.applicationDeadline >= today) {
      upcomingItems.push({
        id: String(j._id ?? j.title),
        label: j.title ?? "Application deadline",
        date: j.applicationDeadline
      });
    }
  });

  upcomingItems.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Keep track of important dates for your child, including applications, meetings, and
        university events. You can&apos;t change applications from here, but you can stay informed.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Upcoming deadlines & events</h3>
        <ul className="space-y-2 text-sm">
          {upcomingItems.slice(0, 10).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <span>{item.label}</span>
              <span className="text-xs text-slate-500">{item.date}</span>
            </li>
          ))}
          {!upcomingItems.length && (
            <li className="text-sm text-slate-500">
              No upcoming items from scholarships or job applications right now.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function ParentCommunicationsSection() {
  const notifications = useParentNotifications();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        See messages from the university, mentors, and other official channels. You can reply or
        contact admins, but cannot change calendars or official records from here.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Messages & announcements</h3>
        <div className="space-y-2 text-sm">
          {notifications.slice(0, 8).map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-medium">{n.title ?? "Message"}</p>
              <p className="text-xs text-slate-500">{n.message}</p>
            </div>
          ))}
          {!notifications.length && (
            <p className="text-sm text-slate-500">
              No messages yet. When the university or mentors send updates to parents, they will
              appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ParentResourcesSection() {
  const resources = [
    {
      id: "r1",
      title: "Planning university finances together",
      type: "Financial planning",
      description: "Guidance on budgeting, fees, and using scholarships or aid effectively."
    },
    {
      id: "r2",
      title: "Supporting your child&apos;s mental health",
      type: "Parenting & wellness",
      description:
        "Tips on listening, spotting burnout signs, and encouraging healthy study routines."
    },
    {
      id: "r3",
      title: "Understanding scholarship opportunities",
      type: "Scholarships",
      description:
        "Overview of common scholarship types and how parents can help with applications."
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Explore guides curated by the university. You can&apos;t message other parents from here,
        but you can learn how best to support your child.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Helpful resources</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {resources.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {item.type}
                </p>
                <p className="mt-1 font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ParentAlertsSection() {
  const notifications = useParentNotifications();

  const urgent = notifications.filter((n) =>
    (n.type ?? n.title ?? "").toLowerCase().includes("alert")
  );

  const list = urgent.length ? urgent : notifications;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Alerts highlight urgent issues related to your child&apos;s academics or finances. They do
        not include student‑only wellness resources or confidential counseling notes.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Urgent notifications</h3>
        <div className="space-y-2 text-sm">
          {list.slice(0, 8).map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/60 dark:bg-amber-900/30"
            >
              <p className="font-medium">{n.title ?? "Alert"}</p>
              <p className="text-xs text-amber-800 dark:text-amber-200">{n.message}</p>
            </div>
          ))}
          {!list.length && (
            <p className="text-sm text-slate-500">
              No urgent alerts at the moment. Any time there is a deadline, missing document, or
              emergency update affecting your child, it will appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function ParentProfileSection() {
  const { user, refreshUser, updateUserProfile, requestPasswordReset } = useAuth();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.contact ?? "");
  const [language, setLanguage] = useState(user?.roleDetails?.language ?? "English");
  const [notificationMode, setNotificationMode] = useState(user?.roleDetails?.notificationMode ?? "email_in_app");

  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [parentSaving, setParentSaving] = useState(false);
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
    setLanguage(user.roleDetails?.language ?? "English");
    setNotificationMode(user.roleDetails?.notificationMode ?? "email_in_app");
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

  const saveParentProfile = async () => {
    if (!user?.email) return;
    setMessage(null);
    setParentSaving(true);

    const currentRoleDetails = { ...(user.roleDetails ?? {}) };
    if (language) {
      currentRoleDetails.language = language;
    }
    if (notificationMode) {
      currentRoleDetails.notificationMode = notificationMode;
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
        setMessage({ type: "ok", text: "Parent profile updated." });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setParentSaving(false);
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
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Parent profile</p>
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
          Manage your own contact details and preferences. Student data is protected.
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Parent preferences</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Communication settings for updates from the university.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Communication language</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    <option>English</option>
                    <option>Sinhala</option>
                    <option>Tamil</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notification mode</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={notificationMode}
                    onChange={(event) => setNotificationMode(event.target.value)}
                  >
                    <option value="email_in_app">Email + in-app</option>
                    <option value="email_only">Email only</option>
                    <option value="in_app_only">In-app only</option>
                  </select>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Linked students are managed by the university or verified invitations. You cannot browse other students.
              </div>
              <Button variant="primary" onClick={saveParentProfile} disabled={parentSaving}>
                {parentSaving ? "Saving..." : "Update parent profile"}
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
                Control what is shared with mentors and university admins.
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
                  Share career interests with mentors
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
                  Share scholarship and aid status with admins
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
                Choose how you receive updates about your child.
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
                  Reminders for mentorship sessions
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
                  Weekly parent digest reminder
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



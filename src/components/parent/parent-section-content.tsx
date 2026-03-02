"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

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
        return ParentHomeSection;
      case "my-student":
        return ParentMyStudentSection;
      case "financial-overview":
        return ParentFinancialOverviewSection;
      case "important-dates":
        return ParentImportantDatesSection;
      case "communications":
        return ParentCommunicationsSection;
      case "resources":
        return ParentResourcesSection;
      case "alerts":
        return ParentAlertsSection;
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
  return (
    <RoleProfileShell roleLabel="Parent / guardian profile">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your own contact details and preferences. You can link multiple students to your
          account, but cannot see or change private wellness data.
        </p>
        <Card className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Full name
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Parent / guardian name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Contact number
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="+94 ..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Communication language
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
                <option>English</option>
                <option>Sinhala</option>
                <option>Tamil</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Notification preferences
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
                <option>Email + in‑app</option>
                <option>Email only</option>
                <option>In‑app only</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Linked students (summary)
            </label>
            <p className="text-xs text-slate-500">
              This section will show which student accounts are linked to you. Linking is managed by
              the university or via verified invitations—parents cannot browse other students.
            </p>
          </div>
          <div className="flex justify-end">
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Save changes
            </button>
          </div>
        </Card>
      </div>
    </RoleProfileShell>
  );
}


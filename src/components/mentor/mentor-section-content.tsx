"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import type { MentorshipSession } from "@/types";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

type Notification = {
  id?: string;
  _id?: string;
  title?: string;
  message?: string;
  date?: string;
  read?: boolean;
};

type MentorSectionContentProps = {
  sectionId: string;
};

type EnrichedSession = MentorshipSession & {
  menteeName?: string;
};

export function MentorSectionContent({ sectionId }: MentorSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "mentor-home":
        return MentorHomeSection;
      case "my-mentees":
        return MentorMyMenteesSection;
      case "sessions":
        return MentorSessionsSection;
      case "messages":
        return MentorMessagesSection;
      case "career-insights":
        return MentorCareerInsightsSection;
      case "webinars":
        return MentorWebinarsSection;
      case "impact-tracker":
        return MentorImpactTrackerSection;
      case "profile":
        return MentorProfileSection;
      default:
        return MentorHomeSection;
    }
  }, [sectionId]);

  return <Section />;
}

function useMentorSessions() {
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentorship-sessions")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setSessions(
            data.map((s: MentorshipSession) => ({
              ...s,
              menteeName: s.studentName
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return sessions;
}

function useMentorNotifications() {
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

function MentorHomeSection() {
  const sessions = useMentorSessions();
  const notifications = useMentorNotifications();

  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" || s.status === "confirmed"
  ).length;
  const totalMentees = new Set(sessions.map((s) => s.studentId)).size;
  const pendingRequests = sessions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-8">
      <Card className="space-y-2 p-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Welcome back, mentor
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Support your mentees, keep track of sessions, and share career insights with students.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active mentees"
          value={String(totalMentees)}
          description="Students currently connected to you"
        />
        <StatCard
          label="Upcoming sessions"
          value={String(upcomingSessions)}
          description="Confirmed or scheduled meetings"
        />
        <StatCard
          label="Pending requests"
          value={String(pendingRequests)}
          description="New mentee requests to review"
        />
        <StatCard
          label="Unread updates"
          value={String(notifications.filter((n) => !n.read).length)}
          description="Messages from mentees or admin"
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Upcoming sessions</h3>
        <div className="space-y-2 text-sm">
          {sessions
            .filter((s) => s.status === "scheduled" || s.status === "confirmed")
            .slice(0, 5)
            .map((s) => (
              <div
                key={s._id}
                className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="font-medium">
                  {s.topic}{" "}
                  {s.menteeName && (
                    <span className="text-xs font-normal text-slate-500">
                      with {s.menteeName}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">Status: {s.status}</p>
              </div>
            ))}
          {!sessions.length && (
            <p className="text-sm text-slate-500">
              No mentorship sessions yet. Once students request or you schedule sessions, they will
              appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function MentorMyMenteesSection() {
  const sessions = useMentorSessions();

  const menteeMap = new Map<
    string,
    {
      studentId: string;
      name?: string;
      activeSessions: number;
      lastTopic?: string;
    }
  >();

  sessions.forEach((s) => {
    const existing = menteeMap.get(s.studentId) ?? {
      studentId: s.studentId,
      name: s.studentName,
      activeSessions: 0,
      lastTopic: s.topic
    };
    const activeSessions =
      existing.activeSessions +
      (s.status === "scheduled" || s.status === "confirmed" || s.status === "completed" ? 1 : 0);
    menteeMap.set(s.studentId, {
      studentId: s.studentId,
      name: s.studentName ?? existing.name,
      activeSessions,
      lastTopic: s.topic ?? existing.lastTopic
    });
  });

  const mentees = [...menteeMap.values()];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        See students you&apos;re currently mentoring. Financial information is hidden; you only see
        mentoring‑related details and high‑level progress.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">My mentees</h3>
        <div className="space-y-2 text-sm">
          {mentees.map((m) => (
            <div
              key={m.studentId}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-medium">{m.name ?? "Student"}</p>
              <p className="text-xs text-slate-500">
                Sessions together: {m.activeSessions}{" "}
                {m.lastTopic && <>• Last topic: {m.lastTopic}</>}
              </p>
            </div>
          ))}
          {!mentees.length && (
            <p className="text-sm text-slate-500">
              You don&apos;t have any mentees yet. When students are matched to you, they&apos;ll
              appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function MentorSessionsSection() {
  const sessions = useMentorSessions();

  const upcoming = sessions.filter(
    (s) => s.status === "scheduled" || s.status === "confirmed" || s.status === "pending"
  );
  const history = sessions.filter((s) => s.status === "completed" || s.status === "cancelled");

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Schedule and track sessions with your mentees. University admins can use this information to
        understand engagement, but cannot see your private notes unless you share them.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">Upcoming & pending</h3>
          <div className="space-y-2 text-sm">
            {upcoming.map((s) => (
              <div
                key={s._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="font-medium">
                  {s.topic}{" "}
                  {s.studentName && (
                    <span className="text-xs font-normal text-slate-500">
                      with {s.studentName}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">Status: {s.status}</p>
              </div>
            ))}
            {!upcoming.length && (
              <p className="text-sm text-slate-500">
                No upcoming sessions yet. When students request or you schedule time slots, they will
                show up here.
              </p>
            )}
          </div>
        </Card>
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">Past sessions</h3>
          <div className="space-y-2 text-sm">
            {history.map((s) => (
              <div
                key={s._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="font-medium">
                  {s.topic}{" "}
                  {s.studentName && (
                    <span className="text-xs font-normal text-slate-500">
                      with {s.studentName}
                    </span>
                  )}
                </p>
                {s.feedback && (
                  <p className="text-xs text-slate-500">Feedback: {s.feedback}</p>
                )}
              </div>
            ))}
            {!history.length && (
              <p className="text-sm text-slate-500">
                No completed sessions recorded yet. Once you finish sessions, they&apos;ll appear
                here as history.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MentorMessagesSection() {
  const notifications = useMentorNotifications();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Use this space to coordinate with mentees. External roles like donors or NGOs cannot see
        these message threads.
      </p>
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">Recent messages</h3>
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
              Chat features can be wired to a dedicated messaging service. For now, this area
              reflects system notifications relevant to your mentoring role.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function MentorCareerInsightsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Share trends, openings, and advice with your mentees and relevant students. You won&apos;t
        be able to message students who are not connected to you or your programs.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Career insights hub</h3>
        <p className="text-sm text-slate-500">
          This section can be connected to a content API to store posts, job referrals, and
          articles. For now, it&apos;s a placeholder where mentors can plan what to share with their
          mentees.
        </p>
      </Card>
    </div>
  );
}

function MentorWebinarsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Host or contribute to webinars that are visible to interested students. Donors and NGOs are
        not part of this workspace.
      </p>
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-semibold">Webinar scheduling</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Session title
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
              placeholder="E.g. Breaking into data science"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Time
            </label>
            <input
              type="time"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Session description
          </label>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Describe what students will learn, target audience, and how to join..."
          />
        </div>
        <div className="flex justify-end">
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Publish webinar
          </button>
        </div>
      </Card>
    </div>
  );
}

function MentorImpactTrackerSection() {
  const sessions = useMentorSessions();

  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const uniqueMentees = new Set(sessions.map((s) => s.studentId)).size;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Track your contribution in terms of hours mentored and students helped. Only mentors and
        admins can access this view.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Completed sessions"
          value={String(completedSessions)}
          description="Total conversations with mentees"
        />
        <StatCard
          label="Students helped"
          value={String(uniqueMentees)}
          description="Unique mentees you&apos;ve supported"
        />
        <StatCard
          label="Recognition badges"
          value="—"
          description="Configured with admin criteria"
        />
      </div>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Success stories</h3>
        <p className="text-sm text-slate-500">
          This section can later show anonymized mentee success stories curated by the university,
          based on your completed sessions and feedback.
        </p>
      </Card>
    </div>
  );
}

function MentorProfileSection() {
  return (
    <RoleProfileShell roleLabel="Mentor profile">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Update how students see you as a mentor. You can tune your expertise areas, availability,
          and how you&apos;re contacted, but cannot edit other users&apos; profiles.
        </p>
        <Card className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Expertise areas
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="E.g. software engineering, data science, product management"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Availability
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="E.g. weekends, evenings, limited slots"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                LinkedIn profile
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="https://linkedin.com/in/..."
              />
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
          <div className="flex justify-end">
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Save profile
            </button>
          </div>
        </Card>
      </div>
    </RoleProfileShell>
  );
}


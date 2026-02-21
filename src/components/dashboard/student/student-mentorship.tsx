"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { MentorMatch } from "@/components/mentorship/mentor-match";

type MentorshipSession = {
  _id: string;
  topic: string;
  scheduledTime: string;
  status: string;
  feedback?: string;
};

export function StudentMentorship() {
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);

  useEffect(() => {
    fetch("/api/mentorship-sessions")
      .then((r) => r.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]));
  }, []);

  const mySessions = sessions.filter((s) => s.status !== "cancelled");
  const pending = mySessions.filter((s) => s.status === "pending");
  const upcoming = mySessions.filter((s) => s.status === "confirmed" || s.status === "scheduled");
  const completed = mySessions.filter((s) => s.status === "completed");

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Browse mentors & send requests
        </h3>
        <MentorMatch />
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Current mentors & session history
        </h3>
        {pending.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending requests</p>
            {pending.map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
              >
                <span>{s.topic}</span>
                <Badge variant="info">{s.status}</Badge>
              </div>
            ))}
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Upcoming sessions</p>
            {upcoming.map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
              >
                <span>{s.topic} — {new Date(s.scheduledTime).toLocaleString()}</span>
                <Badge variant="success">{s.status}</Badge>
              </div>
            ))}
          </div>
        )}
        {completed.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Past sessions</p>
            {completed.map((s) => (
              <div
                key={s._id}
                className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span>{s.topic}</span>
                  <Badge variant="outline">Completed</Badge>
                </div>
                {s.feedback && <p className="mt-1 text-slate-500">Feedback: {s.feedback}</p>}
                <Button variant="ghost" size="sm" className="mt-2">Rate & review</Button>
              </div>
            ))}
          </div>
        )}
        {mySessions.length === 0 && (
          <p className="text-sm text-slate-500">No sessions yet. Send a mentorship request above.</p>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { MoodTracker } from "@/components/wellness/mood-tracker";
import { CounselorBooking } from "@/components/wellness/counselor-booking";
import { WellnessChallenges } from "@/components/wellness/wellness-challenges";
import { PeerSupport } from "@/components/wellness/peer-support";
import { HealthContent } from "@/components/wellness/health-content";

type HealthLog = { _id: string; date: string; mood?: string; stressLevel?: number; sleepHours?: number };

export function StudentWellness() {
  const [logs, setLogs] = useState<HealthLog[]>([]);

  useEffect(() => {
    fetch("/api/health-logs")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  }, []);

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Log daily mood, stress & sleep
        </h3>
        <MoodTracker />
      </Card>

      {logs.length > 0 && (
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Wellness trends</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your recent check-ins. Mentors can check on mentee wellness; admins see anonymized trends.
          </p>
          <div className="flex flex-wrap gap-2">
            {logs.slice(0, 7).map((log) => (
              <div
                key={log._id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                {log.date}: {log.mood ?? "—"} · stress {log.stressLevel ?? "—"} · sleep {log.sleepHours ?? "—"}h
              </div>
            ))}
          </div>
        </Card>
      )}

      <CounselorBooking />

      <WellnessChallenges />

      <PeerSupport />

      <HealthContent />
    </div>
  );
}

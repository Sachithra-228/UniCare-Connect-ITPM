"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { MoodTracker } from "@/components/wellness/mood-tracker";
import { CounselorBooking } from "@/components/wellness/counselor-booking";
import { PeerSupport } from "@/components/wellness/peer-support";

type HealthLog = { _id: string; date: string; mood?: string; stressLevel?: number; sleepHours?: number };

type WellnessTab = "checkins" | "counselor" | "peers";

export function StudentWellness() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [activeTab, setActiveTab] = useState<WellnessTab>("checkins");

  const refreshLogs = useCallback(() => {
    fetch("/api/health-logs")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  useEffect(() => {
    if (activeTab !== "checkins") return;
    const intervalId = window.setInterval(refreshLogs, 30000);
    return () => window.clearInterval(intervalId);
  }, [activeTab, refreshLogs]);

  const tabs: { id: WellnessTab; label: string; description: string; eyebrow: string }[] = [
    {
      id: "checkins",
      label: "Mood & check-ins",
      description: "Daily mood, stress and sleep updates in a simple check-in flow.",
      eyebrow: "Daily"
    },
    {
      id: "counselor",
      label: "Counselor support",
      description: "Browse support options and request counseling sessions with clarity.",
      eyebrow: "Support"
    },
    {
      id: "peers",
      label: "Peer support",
      description: "Connect with students in a safer, more welcoming discussion space.",
      eyebrow: "Community"
    }
  ];

  const tabContentVariants = {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.98 }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-950 via-cyan-900 to-emerald-700 p-0 text-white shadow-xl">
        <div className="relative p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                  Student wellness
                </span>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    A calmer, clearer space to manage your wellbeing
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-sky-100/90">
                    Track daily check-ins, request counselor support, and join peer conversations from one simple dashboard.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 sm:gap-2">
                {tabs.map(({ id, label, eyebrow }) => (
                  <div
                    key={`${id}-summary`}
                    className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-100/75">
                      {eyebrow}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <nav className="grid gap-3 md:grid-cols-3" role="tablist" aria-label="Wellness sections">
              {tabs.map(({ id, label, description }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => setActiveTab(id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    activeTab === id
                      ? "border-white bg-white text-slate-900 shadow-lg"
                      : "border-white/15 bg-white/10 text-white hover:border-white/35 hover:bg-white/15"
                  }`}
                >
                  <div className="space-y-1">
                    <p
                      className={`text-sm font-semibold ${
                        activeTab === id ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {label}
                    </p>
                    <p
                      className={`text-xs leading-5 ${
                        activeTab === id ? "text-slate-600" : "text-sky-100/80"
                      }`}
                    >
                      {description}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {activeTab === "checkins" && (
          <motion.div
            key="checkins"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className="space-y-4 overflow-hidden border-primary/10 bg-gradient-to-r from-white via-sky-50 to-emerald-50 p-5 shadow-md dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Mood, stress & sleep check-ins
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Take a 10-second check-in to help us spot patterns and suggest support.
                  </p>
                </div>
              </div>
              <MoodTracker onSaved={refreshLogs} />
            </Card>

            {logs.length > 0 && (
              <Card className="space-y-3 border-slate-100 p-5 shadow-md dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent wellness trends</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  A quick snapshot of your last few check-ins.
                </p>
                <motion.div
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {logs.slice(0, 7).map((log, index) => (
                    <motion.div
                      key={log._id}
                      className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.15 }}
                    >
                      {log.date}: {log.mood ?? "-"} · stress {log.stressLevel ?? "-"} · sleep {log.sleepHours ?? "-"}h
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === "counselor" && (
          <motion.div
            key="counselor"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <CounselorBooking />
          </motion.div>
        )}

        {activeTab === "peers" && (
          <motion.div
            key="peers"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <PeerSupport />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

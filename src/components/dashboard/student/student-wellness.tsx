"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/card";
import { MoodTracker } from "@/components/wellness/mood-tracker";
import { CounselorBooking } from "@/components/wellness/counselor-booking";
import { WellnessChallenges } from "@/components/wellness/wellness-challenges";
import { PeerSupport } from "@/components/wellness/peer-support";
import { HealthContent } from "@/components/wellness/health-content";

type HealthLog = { _id: string; date: string; mood?: string; stressLevel?: number; sleepHours?: number };

type WellnessTab = "checkins" | "counselor" | "challenges" | "peers" | "resources";

export function StudentWellness() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [activeTab, setActiveTab] = useState<WellnessTab>("checkins");

  useEffect(() => {
    fetch("/api/health-logs")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  }, []);

  const tabs: { id: WellnessTab; label: string; description: string }[] = [
    {
      id: "checkins",
      label: "Mood & check-ins",
      description: "Daily mood, stress and sleep with gentle animations."
    },
    {
      id: "counselor",
      label: "Counselor support",
      description: "Find support options and booking info."
    },
    {
      id: "challenges",
      label: "Wellness challenges",
      description: "Short, fun challenges to build healthy habits."
    },
    {
      id: "peers",
      label: "Peer support",
      description: "Safe space to connect with other students."
    },
    {
      id: "resources",
      label: "Resources",
      description: "Curated mental health & wellness content."
    }
  ];

  const tabContentVariants = {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.98 }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Wellness sections">
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
            <Card className="space-y-4 overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-emerald-50 p-5 dark:from-primary/10 dark:via-slate-900 dark:to-emerald-900/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Mood, stress & sleep check‑ins
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Take a 10‑second check‑in to help us spot patterns and suggest support.
                  </p>
                </div>
              </div>
              <MoodTracker />
            </Card>

            {logs.length > 0 && (
              <Card className="space-y-3 p-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent wellness trends</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  A quick snapshot of your last few check‑ins.
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
                      className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.15 }}
                    >
                      {log.date}: {log.mood ?? "—"} · stress {log.stressLevel ?? "—"} · sleep {log.sleepHours ?? "—"}h
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

        {activeTab === "challenges" && (
          <motion.div
            key="challenges"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <WellnessChallenges />
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

        {activeTab === "resources" && (
          <motion.div
            key="resources"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <HealthContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

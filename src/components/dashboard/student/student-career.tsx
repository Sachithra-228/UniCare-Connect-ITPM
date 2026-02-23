"use client";

import { useState } from "react";
import { PartTimeJobBoardFull } from "@/components/career/part-time-job-board-full";
import { ResumeBuilder } from "@/components/career/resume-builder";

type CareerTab = "job-board" | "resume-builder";

export function StudentCareer() {
  const [activeTab, setActiveTab] = useState<CareerTab>("job-board");

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-1" role="tablist" aria-label="Career sections">
          {[
            { id: "job-board" as const, label: "Part-time & internship job board" },
            { id: "resume-builder" as const, label: "Resume builder" }
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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

      {activeTab === "job-board" && (
        <PartTimeJobBoardFull />
      )}

      {activeTab === "resume-builder" && <ResumeBuilder />}
    </div>
  );
}

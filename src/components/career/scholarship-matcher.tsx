"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import type { Scholarship } from "@/types";

export function ScholarshipMatcher() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scholarships")
      .then((r) => r.json())
      .then((data) => setScholarships(Array.isArray(data) ? data : []))
      .catch(() => setScholarships([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="space-y-4 border-slate-200/80 dark:border-slate-700/50">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">AI scholarship matching</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Recommendations based on financial need, academic performance, and interests.
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : scholarships.length === 0 ? (
        <p className="text-sm text-slate-500">No scholarships available at the moment.</p>
      ) : (
        <div className="space-y-3">
          {scholarships.map((scholarship) => (
            <div
              key={scholarship._id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/30"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{scholarship.title}</p>
                <Badge variant="success">{scholarship.status}</Badge>
              </div>
              <p className="text-slate-500">{scholarship.provider}</p>
              <p className="text-xs text-slate-400">Deadline: {scholarship.deadline}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

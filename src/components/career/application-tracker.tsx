"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";

type AidRequest = {
  _id?: string;
  id?: string;
  category?: string;
  status?: string;
  submittedAt?: string;
};

export function ApplicationTracker() {
  const [applications, setApplications] = useState<AidRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/aid-requests")
      .then((r) => r.json())
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Application tracker</h3>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-slate-500">No applications yet. Apply for aid, scholarships, or jobs to see them here.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((item, i) => (
            <div
              key={item._id ?? item.id ?? i}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <div>
                <p className="font-semibold">{item.category ?? "Aid request"}</p>
                {item.submittedAt && (
                  <p className="text-xs text-slate-500">Submitted: {item.submittedAt}</p>
                )}
              </div>
              <Badge variant={item.status === "Approved" ? "success" : "info"}>
                {item.status ?? "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

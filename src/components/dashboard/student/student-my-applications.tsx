"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";

type AidRequest = { _id?: string; category?: string; status?: string; submittedAt?: string };

export function StudentMyApplications() {
  const [aidRequests, setAidRequests] = useState<AidRequest[]>([]);

  useEffect(() => {
    fetch("/api/aid-requests")
      .then((r) => r.json())
      .then((data) => setAidRequests(Array.isArray(data) ? data : []))
      .catch(() => setAidRequests([]));
  }, []);

  const statusVariant = (s: string) => {
    if (s === "Approved" || s === "approved") return "success";
    if (s === "rejected" || s === "Rejected") return "destructive";
    return "info";
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Only you see all your applications in one place. University Admin, Employer, and Donor see only the applications sent to them.
        </p>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          All applications (scholarships, jobs, aid)
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Scholarship applications</h4>
            <p className="text-sm text-slate-500">No scholarship applications yet. Apply from the Financial Aid section to see them here.</p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Job applications</h4>
            <p className="text-sm text-slate-500">No job applications yet. Apply from the Career section to see them here.</p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Aid requests</h4>
            {aidRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No aid requests.</p>
            ) : (
              <div className="space-y-2">
                {aidRequests.map((req, i) => (
                  <div
                    key={req._id || i}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                  >
                    <span className="font-medium">{req.category || "Aid request"}</span>
                    <Badge variant={statusVariant(req.status || "pending")}>{req.status || "Pending"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload missing documents</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          If an application requested additional documents, upload them here.
        </p>
        <Button variant="secondary">Upload document</Button>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Feedback on rejections</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          View feedback from reviewers when an application is rejected.
        </p>
        <p className="text-sm text-slate-500">No rejection feedback at the moment.</p>
      </Card>
    </div>
  );
}

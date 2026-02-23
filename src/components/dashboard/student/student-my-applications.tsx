"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";

type AidRequest = { _id?: string; category?: string; status?: string; submittedAt?: string };

type MyAppsTab = "overview" | "aid" | "documents" | "feedback";

type UploadedDoc = {
  id: string;
  name: string;
  size: number;
  linkedTo?: string;
};

const tabVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 }
};

export function StudentMyApplications() {
  const [aidRequests, setAidRequests] = useState<AidRequest[]>([]);
  const [activeTab, setActiveTab] = useState<MyAppsTab>("overview");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [docLink, setDocLink] = useState("");

  useEffect(() => {
    fetch("/api/aid-requests")
      .then((r) => r.json())
      .then((data) => setAidRequests(Array.isArray(data) ? data : []))
      .catch(() => setAidRequests([]));
  }, []);

  const statusVariant = (s: string) => {
    if (s === "Approved" || s === "approved") return "success";
    if (s === "rejected" || s === "Rejected") return "warning";
    return "info";
  };

  const tabs: { id: MyAppsTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "aid", label: "Aid requests" },
    { id: "documents", label: "Documents" },
    { id: "feedback", label: "Feedback" }
  ];

  const totalAid = aidRequests.length;
  const approvedAid = aidRequests.filter((r) => (r.status || "").toLowerCase() === "approved").length;
  const pendingAid = aidRequests.filter((r) => !r.status || (r.status || "").toLowerCase() === "pending").length;
  const rejectedAid = aidRequests.filter((r) => (r.status || "").toLowerCase() === "rejected").length;

  const handleDocUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setDocs((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        size: file.size,
        linkedTo: docLink || undefined
      }))
    ]);
    event.target.value = "";
    setDocLink("");
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Only you see all your applications in one place. University Admin, Employer, and Donor see only the
          applications sent to them.
        </p>
      </Card>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="My applications sections">
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
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                All applications (scholarships, jobs, aid)
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Scholarships</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">0</p>
                  <p className="mt-1 text-xs text-slate-500">Apply from Financial Aid → Tuition.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Jobs</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">0</p>
                  <p className="mt-1 text-xs text-slate-500">Apply from Career → Job board.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Aid requests</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{totalAid}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {approvedAid} approved · {pendingAid} pending · {rejectedAid} rejected
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <h4 className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Scholarship applications
                  </h4>
                  <p className="text-sm text-slate-500">
                    No scholarship applications yet. Apply from the Financial Aid section to see them here.
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Job applications</h4>
                  <p className="text-sm text-slate-500">
                    No job applications yet. Apply from the Career section to see them here.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "aid" && (
          <motion.div
            key="aid"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aid requests</h3>
              {aidRequests.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No aid requests. Submit a request from the Financial Aid section to see it here.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {aidRequests.map((req, i) => (
                    <div
                      key={req._id || i}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {req.category || "Aid request"}
                        </p>
                        {req.submittedAt && (
                          <p className="text-xs text-slate-500">
                            Submitted {new Date(req.submittedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusVariant(req.status || "pending")}>
                        {req.status || "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "documents" && (
          <motion.div
            key="documents"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload missing documents</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                If an application requested additional documents, upload them here and keep track of what you’ve
                shared.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[160px]">
                    <label
                      htmlFor="doc-link"
                      className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Optional note (e.g. aid request category or application id)
                    </label>
                    <input
                      id="doc-link"
                      value={docLink}
                      onChange={(e) => setDocLink(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Example: Emergency aid request #123"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="doc-upload"
                      className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Upload file
                    </label>
                    <input
                      id="doc-upload"
                      type="file"
                      multiple
                      onChange={handleDocUpload}
                      className="block text-xs text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>
                {docs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{doc.name}</p>
                          <p className="text-slate-500">
                            {formatSize(doc.size)}
                            {doc.linkedTo ? ` · Linked to: ${doc.linkedTo}` : ""}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => removeDoc(doc.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "feedback" && (
          <motion.div
            key="feedback"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="space-y-3 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Feedback on rejections</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                When reviewers share feedback on rejected applications, it will appear here so you can improve future
                submissions.
              </p>
              <p className="text-sm text-slate-500">No rejection feedback at the moment.</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

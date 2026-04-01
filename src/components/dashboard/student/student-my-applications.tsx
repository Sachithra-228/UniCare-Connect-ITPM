"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import type {
  ApplicationDocumentEntry,
  ApplicationEntry,
  ApplicationFeedbackEntry,
  ApplicationStatus,
  MyApplicationsPayload
} from "@/lib/my-applications-types";
import { getNgoApplications } from "@/lib/ngo-demo-store";

type MyAppsTab = "overview" | "aid" | "documents" | "feedback";

type LogApplicationForm = {
  kind: "job" | "scholarship";
  title: string;
  organization: string;
  source: string;
  submittedAt: string;
};

const tabVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 }
};

function statusVariant(status: ApplicationStatus) {
  if (status === "Approved") return "success";
  if (status === "Rejected") return "warning";
  return "info";
}

function formatSize(bytes: number) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function StudentMyApplications() {
  const [activeTab, setActiveTab] = useState<MyAppsTab>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [aidRequests, setAidRequests] = useState<ApplicationEntry[]>([]);
  const [jobApplications, setJobApplications] = useState<ApplicationEntry[]>([]);
  const [scholarshipApplications, setScholarshipApplications] = useState<ApplicationEntry[]>([]);
  const [ngoApplications, setNgoApplications] = useState<ApplicationEntry[]>([]);
  const [documents, setDocuments] = useState<ApplicationDocumentEntry[]>([]);
  const [feedback, setFeedback] = useState<ApplicationFeedbackEntry[]>([]);

  const [docLink, setDocLink] = useState("");
  const [logForm, setLogForm] = useState<LogApplicationForm>({
    kind: "job",
    title: "",
    organization: "",
    source: "",
    submittedAt: new Date().toISOString().slice(0, 10)
  });

  const refreshApplications = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/my-applications")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const payload = (data ?? {}) as Partial<MyApplicationsPayload>;
        setAidRequests(Array.isArray(payload.aidRequests) ? payload.aidRequests : []);
        setJobApplications(Array.isArray(payload.jobApplications) ? payload.jobApplications : []);
        setScholarshipApplications(
          Array.isArray(payload.scholarshipApplications) ? payload.scholarshipApplications : []
        );
        setDocuments(Array.isArray(payload.documents) ? payload.documents : []);
        setFeedback(Array.isArray(payload.feedback) ? payload.feedback : []);
        
        // Add NGO applications from the demo store
        const demoNgoApps = getNgoApplications().filter(a => a.studentId === "student-123" || a.studentId === "std123");
        setNgoApplications(demoNgoApps.map(a => ({
          _id: a._id,
          title: a.programTitle,
          organization: "NGO Partner",
          kind: "ngo",
          status: a.status === "pending_admin" ? "Pending" : a.status === "approved_by_ngo" ? "Approved" : a.status === "rejected" ? "Rejected" : "Under review",
          submittedAt: a.appliedAt.split("T")[0]
        } as ApplicationEntry)));

      })
      .catch(() => {
        setAidRequests([]);
        setJobApplications([]);
        setScholarshipApplications([]);
        setNgoApplications([]);
        setDocuments([]);
        setFeedback([]);
        setError("Unable to load applications right now.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  const allApplications = useMemo(() => {
    const merged = [...aidRequests, ...scholarshipApplications, ...jobApplications, ...ngoApplications];
    return merged.sort((a, b) => Date.parse(b.submittedAt ?? "") - Date.parse(a.submittedAt ?? ""));
  }, [aidRequests, scholarshipApplications, jobApplications, ngoApplications]);

  const submitLoggedApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!logForm.title.trim()) {
      setError("Application title is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/my-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: logForm.kind,
          title: logForm.title.trim(),
          organization: logForm.organization.trim() || undefined,
          source: logForm.source.trim() || undefined,
          submittedAt: logForm.submittedAt
        })
      });

      const body = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(body.message ?? "Unable to log application.");
        return;
      }

      setMessage("Application logged successfully.");
      setLogForm((prev) => ({ ...prev, title: "", organization: "", source: "" }));
      refreshApplications();
    } catch {
      setError("Unable to log application.");
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const response = await fetch("/api/my-applications/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              linkedTo: docLink.trim() || undefined,
              mimeType: file.type || undefined
            })
          });
          const body = await response.json().catch(() => ({} as { message?: string }));
          return { ok: response.ok, message: body.message };
        })
      );

      const failed = results.find((result) => !result.ok);
      if (failed) {
        setError(failed.message ?? "Unable to upload one or more documents.");
      } else {
        setMessage("Document metadata saved successfully.");
        setDocLink("");
        refreshApplications();
      }
    } catch {
      setError("Unable to upload documents.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeDoc = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/my-applications/documents/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(body.message ?? "Unable to remove document.");
        return;
      }
      setMessage("Document removed.");
      refreshApplications();
    } catch {
      setError("Unable to remove document.");
    }
  };

  const tabs: { id: MyAppsTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "aid", label: "Aid requests" },
    { id: "documents", label: "Documents" },
    { id: "feedback", label: "Feedback" }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Only you see all your applications in one place. University Admin, Employer, and Donor see only the
          applications sent to them.
        </p>
      </Card>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          {message}
        </p>
      ) : null}

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
              {loading ? (
                <p className="text-sm text-slate-500">Loading application summary...</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Scholarships</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                        {scholarshipApplications.length}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Tracked scholarship applications.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Jobs</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                        {jobApplications.length}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Tracked job applications.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Aid requests</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{aidRequests.length}</p>
                      <p className="mt-1 text-xs text-slate-500">From Financial Aid submissions.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-xs uppercase tracking-wide text-slate-500">NGO Programs</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{ngoApplications.length}</p>
                      <p className="mt-1 text-xs text-slate-500">Tracked NGO support applications.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent application activity</h4>
                    {!allApplications.length ? (
                      <p className="text-sm text-slate-500">No tracked applications yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {allApplications.slice(0, 6).map((item) => (
                          <div
                            key={`${item.kind}-${item._id}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                              <p className="text-xs text-slate-500">
                                {item.kind.toUpperCase()} {item.organization ? `- ${item.organization}` : ""}
                                {item.submittedAt ? ` - ${item.submittedAt}` : ""}
                              </p>
                            </div>
                            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>

            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Log job or scholarship application</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Add applications you submitted externally so they are tracked in one place.
              </p>
              <form className="space-y-3" onSubmit={submitLoggedApplication}>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    value={logForm.kind}
                    onChange={(event) =>
                      setLogForm((prev) => ({ ...prev, kind: event.target.value as "job" | "scholarship" }))
                    }
                  >
                    <option value="job">Job application</option>
                    <option value="scholarship">Scholarship application</option>
                  </select>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    value={logForm.submittedAt}
                    onChange={(event) => setLogForm((prev) => ({ ...prev, submittedAt: event.target.value }))}
                  />
                </div>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Application title"
                  value={logForm.title}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Organization (optional)"
                    value={logForm.organization}
                    onChange={(event) => setLogForm((prev) => ({ ...prev, organization: event.target.value }))}
                  />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Source section (optional)"
                    value={logForm.source}
                    onChange={(event) => setLogForm((prev) => ({ ...prev, source: event.target.value }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Log application"}
                  </Button>
                </div>
              </form>
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
              {loading ? (
                <p className="text-sm text-slate-500">Loading aid requests...</p>
              ) : aidRequests.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No aid requests. Submit a request from the Financial Aid section to see it here.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {aidRequests.map((request) => (
                    <div
                      key={request._id}
                      className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">{request.title}</p>
                          {request.submittedAt ? (
                            <p className="text-xs text-slate-500">Submitted {request.submittedAt}</p>
                          ) : null}
                        </div>
                        <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                      </div>
                      {request.reviewNote ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300">Review note: {request.reviewNote}</p>
                      ) : null}
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
                Upload requested documents and link them to an application note for quick review.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[180px] flex-1">
                    <label
                      htmlFor="doc-link"
                      className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Optional note (application id or category)
                    </label>
                    <input
                      id="doc-link"
                      value={docLink}
                      onChange={(event) => setDocLink(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Example: Emergency aid request"
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
                      disabled={uploading}
                      className="block text-xs text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>

                {uploading ? <p className="text-sm text-slate-500">Uploading...</p> : null}

                {!documents.length ? (
                  <p className="text-sm text-slate-500">No uploaded documents yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{doc.name}</p>
                          <p className="text-slate-500">
                            {formatSize(doc.size)}
                            {doc.linkedTo ? ` - Linked to: ${doc.linkedTo}` : ""}
                            {doc.uploadedAt ? ` - Uploaded ${doc.uploadedAt}` : ""}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => removeDoc(doc._id)}
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
                Reviewer feedback is listed here to help improve your next submission.
              </p>
              {loading ? (
                <p className="text-sm text-slate-500">Loading feedback...</p>
              ) : !feedback.length ? (
                <p className="text-sm text-slate-500">No rejection feedback at the moment.</p>
              ) : (
                <div className="space-y-2">
                  {feedback.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{item.kind.toUpperCase()}</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.feedback}</p>
                      {item.updatedAt ? <p className="mt-1 text-xs text-slate-500">Updated: {item.updatedAt}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

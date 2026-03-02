"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { TextArea } from "@/components/shared/text-area";
import type { MentorshipSession } from "@/types";

type Mentor = {
  _id: string;
  name: string;
  email?: string;
  profilePic?: string | null;
  expertise?: string;
  availability?: string;
};

type MentorshipTab = "browse" | "requests" | "mentors-history" | "schedule" | "rate-review";

function ScheduleCalendar({ selectedDate, onSelectDate }: { selectedDate: string; onSelectDate: (d: string) => void }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const toYmd = (d: number) => {
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    return `${year}-${m}-${day}`;
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1);
  };

  return (
    <div className="inline-block rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Previous month">←</button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {first.toLocaleString("default", { month: "long" })} {year}
        </span>
        <button type="button" onClick={nextMonth} className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Next month">→</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} className="py-1 font-medium text-slate-500 dark:text-slate-400">{w}</div>
        ))}
        {days.map((d, i) => {
          if (d === null) return <div key={`pad-${i}`} />;
          const ymd = toYmd(d);
          const isSelected = selectedDate === ymd;
          const isPast = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <button
              key={d}
              type="button"
              onClick={() => !isPast && onSelectDate(ymd)}
              disabled={isPast}
              className={`min-h-[32px] rounded-md py-1 ${
                isSelected
                  ? "bg-primary text-white"
                  : isPast
                    ? "text-slate-300 dark:text-slate-600"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StudentMentorship() {
  const [activeTab, setActiveTab] = useState<MentorshipTab>("browse");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [requestTopic, setRequestTopic] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState<Mentor | null>(null);
  const [selectedMentorDetail, setSelectedMentorDetail] = useState<Mentor | null>(null);
  const [scheduleSessionId, setScheduleSessionId] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTimeOnly, setScheduleTimeOnly] = useState("");

  const fetchMentors = useCallback(() => {
    setLoadingMentors(true);
    fetch("/api/mentors")
      .then((r) => r.json())
      .then((data) => setMentors(Array.isArray(data) ? data : []))
      .catch(() => setMentors([]))
      .finally(() => setLoadingMentors(false));
  }, []);

  const fetchSessions = useCallback(() => {
    setLoadingSessions(true);
    fetch("/api/mentorship-sessions")
      .then((r) => r.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMentorDetail(null);
    };
    if (selectedMentorDetail) {
      window.addEventListener("keydown", onEscape);
      return () => window.removeEventListener("keydown", onEscape);
    }
  }, [selectedMentorDetail]);

  // Sessions where I am the student (API returns only my sessions)
  const pendingRequests = sessions.filter((s) => s.status === "pending");
  const upcomingSessions = sessions.filter(
    (s) => (s.status === "confirmed" || s.status === "scheduled") && s.scheduledTime
  );
  const pastSessions = sessions.filter((s) => s.status === "completed");
  const completedWithoutReview = pastSessions.filter((s) => s.rating == null && s.review == null);
  const canSchedule = sessions.filter(
    (s) => (s.status === "confirmed" || s.status === "scheduled") && (!s.scheduledTime || !s.scheduledTime.trim())
  );

  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  };

  const sendRequest = (mentor: Mentor) => {
    if (!requestTopic.trim()) {
      showToast("Please enter a topic.");
      return;
    }
    setSendingRequest(mentor._id);
    fetch("/api/mentorship-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mentorId: mentor._id,
        topic: requestTopic.trim(),
        message: requestMessage.trim() || undefined
      })
    })
      .then((r) => r.json())
      .then((data) => {
        if (r.ok) {
          setSelectedMentorForRequest(null);
          setRequestTopic("");
          setRequestMessage("");
          fetchSessions();
          showToast("Your request has been sent.");
        } else {
          showToast(data.message || "Failed to send request.");
        }
      })
      .catch(() => showToast("Failed to send request."))
      .finally(() => setSendingRequest(null));
  };

  const cancelRequest = (sessionId: string) => {
    setCancelSubmitting(sessionId);
    fetch(`/api/mentorship-sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" })
    })
      .then((r) => r.json())
      .then((data) => {
        if (r.ok) {
          showToast("Request cancelled.");
          fetchSessions();
        } else {
          showToast(data.message || "Failed to cancel.");
        }
      })
      .catch(() => showToast("Failed to cancel."))
      .finally(() => setCancelSubmitting(null));
  };

  const submitScheduleTime = () => {
    const dateTime = scheduleDate && scheduleTimeOnly ? `${scheduleDate}T${scheduleTimeOnly}:00` : "";
    if (!scheduleSessionId || !dateTime) return;
    setScheduleSubmitting(true);
    fetch(`/api/mentorship-sessions/${scheduleSessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledTime: dateTime, status: "scheduled" })
    })
      .then((r) => r.json())
      .then((data) => {
        if (r.ok) {
          showToast("Session scheduled.");
          setScheduleSessionId(null);
          setScheduleTime("");
          setScheduleDate("");
          setScheduleTimeOnly("");
          fetchSessions();
        } else {
          showToast(data.message || "Failed to schedule.");
        }
      })
      .catch(() => showToast("Failed to schedule."))
      .finally(() => setScheduleSubmitting(false));
  };

  const submitReview = () => {
    if (!reviewSessionId || reviewRating < 1 || reviewRating > 5) return;
    setReviewSubmitting(true);
    fetch(`/api/mentorship-sessions/${reviewSessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, review: reviewText.trim() || undefined })
    })
      .then((r) => r.json())
      .then((data) => {
        if (r.ok) {
          showToast("Thank you for your feedback.");
          setReviewSessionId(null);
          setReviewRating(0);
          setReviewText("");
          fetchSessions();
        } else {
          showToast(data.message || "Failed to submit review.");
        }
      })
      .catch(() => showToast("Failed to submit review."))
      .finally(() => setReviewSubmitting(false));
  };

  const tabs: { id: MentorshipTab; label: string }[] = [
    { id: "browse", label: "Browse available mentors" },
    { id: "requests", label: "Send mentorship requests" },
    { id: "mentors-history", label: "My mentors & session history" },
    { id: "schedule", label: "Schedule sessions" },
    { id: "rate-review", label: "Rate & review" }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Mentorship sections">
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

      {/* Tab: Browse available mentors */}
      {activeTab === "browse" && (
        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Browse available mentors (alumni / industry)
          </h3>
          {loadingMentors ? (
            <p className="text-sm text-slate-500">Loading mentors…</p>
          ) : mentors.length === 0 ? (
            <p className="text-sm text-slate-500">No mentors available at the moment. Check back later.</p>
          ) : (
            <div className={selectedMentorDetail ? "grid gap-6 lg:grid-cols-[1fr_320px]" : ""}>
              <div
                className={`space-y-4 ${selectedMentorDetail ? "cursor-pointer" : ""}`}
                onClick={() => selectedMentorDetail && setSelectedMentorDetail(null)}
              >
                {mentors.map((mentor) => {
                  const initials = mentor.name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  const isSelected = selectedMentorDetail?._id === mentor._id;
                  return (
                    <div
                      key={mentor._id}
                      className={`flex items-start justify-between gap-4 rounded-xl border p-4 dark:border-slate-700 ${
                        isSelected ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-slate-200"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
                          {mentor.profilePic ? (
                            <img src={mentor.profilePic} alt="" className="h-16 w-16 object-cover" />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center bg-primary/10 text-lg font-bold text-primary dark:bg-primary/20">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedMentorDetail(mentor)}
                            className="text-left font-semibold text-slate-900 hover:text-primary hover:underline dark:text-white dark:hover:text-primary"
                          >
                            {mentor.name}
                          </button>
                          <p className="mt-0.5 text-sm text-slate-500">{mentor.expertise ?? "Career guidance"}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Availability: {mentor.availability ?? "By request"}</p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        className="shrink-0"
                        onClick={() => setSelectedMentorForRequest(mentor)}
                      >
                        Request session
                      </Button>
                    </div>
                  );
                })}
              </div>
              {selectedMentorDetail && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30">
                <div className="p-5">
                    <div className="flex flex-col items-center">
                      <div className="flex h-32 w-32 shrink-0 overflow-hidden rounded-xl border-2 border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
                        {selectedMentorDetail.profilePic ? (
                          <img
                            src={selectedMentorDetail.profilePic}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-bold text-primary dark:bg-primary/20">
                            {selectedMentorDetail.name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedMentorDetail.name}
                      </p>
                    </div>
                    <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Details
                      </p>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-500 dark:text-slate-400">Expertise</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">
                            {selectedMentorDetail.expertise ?? "Career guidance"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-500 dark:text-slate-400">Availability</dt>
                          <dd className="font-medium text-slate-900 dark:text-white">
                            {selectedMentorDetail.availability ?? "By request"}
                          </dd>
                        </div>
                        {selectedMentorDetail.email && (
                          <div className="flex justify-between gap-2">
                            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                            <dd className="truncate font-medium text-slate-900 dark:text-white">
                              {selectedMentorDetail.email}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
              </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Send mentorship requests (pending I sent) */}
      {activeTab === "requests" && (
        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            My mentorship requests
          </h3>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Requests you sent. Cancel if needed, or wait for the mentor to confirm.
          </p>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-slate-500">No pending requests. Browse mentors and send a request from the first tab.</p>
          ) : (
            <ul className="space-y-3">
              {pendingRequests.map((s) => (
                <li
                  key={s._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div>
                    <p className="font-medium">{s.topic}</p>
                    <p className="text-sm text-slate-500">Mentor: {s.mentorName ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">Pending</Badge>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={cancelSubmitting === s._id}
                      onClick={() => cancelRequest(s._id)}
                    >
                      {cancelSubmitting === s._id ? "Cancelling…" : "Cancel"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Tab: My mentors and session history */}
      {activeTab === "mentors-history" && (
        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Current mentors & session history
          </h3>
          {loadingSessions ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500">No sessions yet. Send a mentorship request from the first tab.</p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Upcoming</h4>
                  <ul className="space-y-2">
                    {upcomingSessions.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <span>{s.topic} — {s.mentorName} — {s.scheduledTime ? new Date(s.scheduledTime).toLocaleString() : "Time TBD"}</span>
                        <Badge variant="success">{s.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pastSessions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Past sessions</h4>
                  <ul className="space-y-2">
                    {pastSessions.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <span>{s.topic} — {s.mentorName}</span>
                        <Badge variant="success">Completed</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pendingRequests.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Pending</h4>
                  <ul className="space-y-2">
                    {pendingRequests.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <span>{s.topic} — {s.mentorName}</span>
                        <Badge variant="info">Pending</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Schedule sessions */}
      {activeTab === "schedule" && (
        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Schedule sessions with mentors
          </h3>
          {loadingSessions ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Scheduled</h4>
                  <ul className="space-y-2">
                    {upcomingSessions.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <span>{s.topic} — {s.mentorName} — {new Date(s.scheduledTime).toLocaleString()}</span>
                        <Badge variant="success">Scheduled</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {canSchedule.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Pick a time</h4>
                  <p className="mb-2 text-sm text-slate-500">These sessions are confirmed but need a date/time.</p>
                  <ul className="space-y-3">
                    {canSchedule.map((s) => (
                      <li
                        key={s._id}
                        className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <p className="font-medium">{s.topic} — {s.mentorName}</p>
                        {scheduleSessionId === s._id ? (
                          <div className="mt-3 space-y-4">
                            <div>
                              <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Pick date</p>
                              <ScheduleCalendar
                                selectedDate={scheduleDate}
                                onSelectDate={setScheduleDate}
                              />
                            </div>
                            <div>
                              <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">Pick time</p>
                              <Input
                                type="time"
                                value={scheduleTimeOnly}
                                onChange={(e) => setScheduleTimeOnly(e.target.value)}
                                className="max-w-[140px]"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="primary"
                                disabled={scheduleSubmitting || !scheduleDate || !scheduleTimeOnly}
                                onClick={submitScheduleTime}
                              >
                                {scheduleSubmitting ? "Saving…" : "Save time"}
                              </Button>
                              <Button variant="ghost" onClick={() => { setScheduleSessionId(null); setScheduleDate(""); setScheduleTimeOnly(""); setScheduleTime(""); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            className="mt-2"
                            onClick={() => { setScheduleSessionId(s._id); setScheduleDate(""); setScheduleTimeOnly(""); setScheduleTime(""); }}
                          >
                            Set date & time
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {upcomingSessions.length === 0 && canSchedule.length === 0 && (
                <p className="text-sm text-slate-500">No sessions to schedule. When a mentor confirms your request, you can set a time here.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Rate and review */}
      {activeTab === "rate-review" && (
        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Rate and review mentorship experience
          </h3>
          {loadingSessions ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : completedWithoutReview.length === 0 ? (
            <p className="text-sm text-slate-500">No completed sessions to review yet.</p>
          ) : (
            <ul className="space-y-4">
              {completedWithoutReview.map((s) => (
                <li
                  key={s._id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <p className="font-medium">{s.topic} — {s.mentorName}</p>
                  {reviewSessionId === s._id ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="mb-1 text-sm font-medium">Rating (1–5)</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`rounded p-1 text-lg ${reviewRating >= star ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
                              aria-label={`${star} star${star > 1 ? "s" : ""}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-medium">Review (optional)</p>
                        <TextArea
                          placeholder="Share your experience..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          disabled={reviewSubmitting || reviewRating < 1}
                          onClick={submitReview}
                        >
                          {reviewSubmitting ? "Submitting…" : "Submit"}
                        </Button>
                        <Button variant="ghost" onClick={() => { setReviewSessionId(null); setReviewRating(0); setReviewText(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => { setReviewSessionId(s._id); setReviewRating(0); setReviewText(""); }}
                    >
                      Rate & review
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Request-session popup modal */}
      {selectedMentorForRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-modal-title"
          onClick={() => { setSelectedMentorForRequest(null); setRequestTopic(""); setRequestMessage(""); }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="request-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Send request to {selectedMentorForRequest.name}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {selectedMentorForRequest.expertise ?? "Career guidance"}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="request-topic" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Topic (e.g. Career planning)
                </label>
                <Input
                  id="request-topic"
                  placeholder="Topic (e.g. Career planning)"
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="request-message" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Message (optional)
                </label>
                <TextArea
                  id="request-message"
                  placeholder="Message (optional)"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  disabled={sendingRequest !== null || !requestTopic.trim()}
                  onClick={() => sendRequest(selectedMentorForRequest)}
                >
                  {sendingRequest === selectedMentorForRequest._id ? "Sending…" : "Send request"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setSelectedMentorForRequest(null); setRequestTopic(""); setRequestMessage(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-700">
          {toast.message}
        </div>
      )}
    </div>
  );
}

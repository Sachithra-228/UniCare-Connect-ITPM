"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Select } from "@/components/shared/Select";
import { TextArea } from "@/components/shared/text-area";

type Counselor = {
  _id: string;
  name: string;
  specialization: string;
  availability: string;
  mode: "online" | "in-person" | "hybrid";
  contactEmail?: string;
};

type Booking = {
  _id: string;
  counselorId: string;
  counselorName?: string;
  preferredDate: string;
  preferredTime: string;
  note?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt?: string;
};

export function CounselorBooking() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/wellness-counselors").then((response) => (response.ok ? response.json() : [])),
      fetch("/api/counselor-bookings").then((response) => (response.ok ? response.json() : []))
    ])
      .then(([counselorData, bookingData]) => {
        setCounselors(Array.isArray(counselorData) ? counselorData : []);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      })
      .catch(() => {
        setCounselors([]);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const canPoll = () => document.visibilityState === "visible" && document.hasFocus();
    const poll = () => {
      if (canPoll()) refreshData();
    };
    const intervalId = window.setInterval(poll, 30000);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [refreshData]);

  const selectedCounselor = useMemo(
    () => counselors.find((item) => item._id === selectedCounselorId),
    [counselors, selectedCounselorId]
  );

  const clearForm = () => {
    setSelectedCounselorId("");
    setPreferredDate("");
    setPreferredTime("");
    setNote("");
    setError(null);
    setMessage(null);
  };

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!selectedCounselorId || !preferredDate || !preferredTime) {
      setError("Please choose counselor, date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/counselor-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId: selectedCounselorId,
          preferredDate,
          preferredTime,
          note: note.trim() || undefined
        })
      });
      const body = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(body.message ?? "Unable to submit booking.");
        return;
      }
      clearForm();
      setMessage("Booking request submitted successfully.");
      refreshData();
    } catch {
      setError("Unable to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/counselor-bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      });
      const body = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(body.message ?? "Unable to cancel booking.");
        return;
      }
      setMessage("Booking cancelled.");
      refreshData();
    } catch {
      setError("Unable to cancel booking.");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-0 text-white shadow-xl">
        <div className="relative p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50">
                Counselor support
              </span>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">Book trusted support with confidence</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                  Browse available counselors, compare support modes, and request a time slot through a cleaner booking flow.
                </p>
              </div>
            </div>
            <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-50/75">Available</p>
                <p className="mt-1 text-2xl font-semibold">{counselors.length}</p>
                <p className="text-xs text-emerald-50/80">Counselor profiles</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-50/75">My requests</p>
                <p className="mt-1 text-2xl font-semibold">{bookings.length}</p>
                <p className="text-xs text-emerald-50/80">Current booking records</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 overflow-hidden border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-md dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Available counselors</h3>
            <p className="text-sm text-slate-500">
              Compare support styles and choose the counselor that feels right for you.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            Wellness
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading counselors...</p>
        ) : counselors.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            No counselors available right now.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {counselors.map((counselor) => (
              <div
                key={counselor._id}
                className={`rounded-3xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  selectedCounselorId === counselor._id
                    ? "border-emerald-400 bg-emerald-50/90 ring-2 ring-emerald-200 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
                    : "border-emerald-100 bg-white/90 dark:border-slate-700 dark:bg-slate-900/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{counselor.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {counselor.specialization}
                    </p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold capitalize text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-200">
                    {counselor.mode}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Availability:
                    </span>{" "}
                    {counselor.availability}
                  </p>
                  {counselor.contactEmail ? <p className="truncate">{counselor.contactEmail}</p> : null}
                </div>
                <Button
                  type="button"
                  variant={selectedCounselorId === counselor._id ? "primary" : "secondary"}
                  className={`mt-5 w-full ${
                    selectedCounselorId === counselor._id
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                  onClick={() => setSelectedCounselorId(counselor._id)}
                >
                  {selectedCounselorId === counselor._id ? "Selected counselor" : "Choose counselor"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-5 border-slate-100 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Request a counseling slot
          </h3>
          <p className="text-sm text-slate-500">
            Pick your counselor, date, and time. We will confirm once they approve.
          </p>
        </div>
        <form className="space-y-4" onSubmit={submitBooking}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Choose counselor</span>
              <Select
                value={selectedCounselorId}
                onChange={(event) => setSelectedCounselorId(event.target.value)}
                required
                className="min-h-11 border-slate-200 bg-slate-50/70 dark:bg-slate-950"
              >
                <option value="">Select counselor</option>
                {counselors.map((counselor) => (
                  <option key={counselor._id} value={counselor._id}>
                    {counselor.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Preferred date</span>
              <Input
                type="date"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                required
                className="min-h-11 border-slate-200 bg-slate-50/70 dark:bg-slate-950"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Preferred time</span>
              <Input
                type="time"
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                required
                className="min-h-11 border-slate-200 bg-slate-50/70 dark:bg-slate-950"
              />
            </label>
          </div>
          {selectedCounselor ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              Selected counselor: <span className="font-semibold">{selectedCounselor.name}</span> ({selectedCounselor.mode})
            </div>
          ) : null}
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Notes for the counselor</span>
            <TextArea
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="border-slate-200 bg-slate-50/70 dark:bg-slate-950"
              placeholder="Optional note about what you want to discuss"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-w-[130px] border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              onClick={clearForm}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[220px] bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            >
              {submitting ? "Submitting..." : "Submit booking request"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 border-slate-100 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              My counseling bookings
            </h3>
            <p className="text-sm text-slate-500">
              Track pending requests, confirmed sessions, and cancellations in one place.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {bookings.length} total
          </span>
        </div>
        {!bookings.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
            No bookings yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {booking.counselorName ?? "Counselor"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.preferredDate} at {booking.preferredTime}
                  </p>
                  {booking.note ? <p className="mt-1 text-xs text-slate-500">{booking.note}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "success"
                        : booking.status === "cancelled"
                          ? "warning"
                          : "info"
                    }
                  >
                    {booking.status}
                  </Badge>
                  {booking.status === "pending" ? (
                    <Button
                      variant="ghost"
                      className="rounded-full border border-rose-100 px-4 py-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-400/20 dark:hover:bg-rose-500/10"
                      onClick={() => cancelBooking(booking._id)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

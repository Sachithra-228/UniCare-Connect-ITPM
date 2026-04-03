"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Select } from "@/components/shared/select";
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
      setMessage("Booking request submitted successfully.");
      setSelectedCounselorId("");
      setPreferredDate("");
      setPreferredTime("");
      setNote("");
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
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <h3 className="text-lg font-semibold">Counselor support</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading counselors...</p>
        ) : counselors.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
            No counselors available right now.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {counselors.map((counselor) => (
              <div
                key={counselor._id}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="font-medium text-slate-900 dark:text-white">{counselor.name}</p>
                <p className="text-sm text-slate-500">{counselor.specialization}</p>
                <p className="text-xs text-slate-500">Availability: {counselor.availability}</p>
                <p className="text-xs text-slate-500">Mode: {counselor.mode}</p>
                {counselor.contactEmail ? (
                  <p className="truncate text-xs text-slate-500">{counselor.contactEmail}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-4">
        <h3 className="text-lg font-semibold">Request a counseling slot</h3>
        <form className="space-y-3" onSubmit={submitBooking}>
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={selectedCounselorId}
              onChange={(event) => setSelectedCounselorId(event.target.value)}
              required
            >
              <option value="">Select counselor</option>
              {counselors.map((counselor) => (
                <option key={counselor._id} value={counselor._id}>
                  {counselor.name}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
              required
            />
            <Input
              type="time"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              required
            />
          </div>
          {selectedCounselor ? (
            <p className="text-xs text-slate-500">
              Selected: {selectedCounselor.name} ({selectedCounselor.mode})
            </p>
          ) : null}
          <TextArea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note about what you want to discuss"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit booking request"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">My counseling bookings</h3>
        {!bookings.length ? (
          <p className="text-sm text-slate-500">No bookings yet.</p>
        ) : (
          <ul className="space-y-2">
            {bookings.map((booking) => (
              <li
                key={booking._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/30"
              >
                <div>
                  <p className="font-medium">{booking.counselorName ?? "Counselor"}</p>
                  <p className="text-xs text-slate-500">
                    {booking.preferredDate} at {booking.preferredTime}
                  </p>
                  {booking.note ? <p className="text-xs text-slate-500">{booking.note}</p> : null}
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
                    <Button variant="ghost" onClick={() => cancelBooking(booking._id)}>
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

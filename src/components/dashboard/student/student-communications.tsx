"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/Card";
import { studentBlueCardClass } from "@/components/dashboard/student/student-card-theme";

type CommunicationMessage = {
  _id: string;
  subject: string;
  body: string;
  messageType: string;
  donorName: string;
  donorOrganization?: string | null;
  createdAt: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function StudentCommunications() {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/communications", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        messages?: CommunicationMessage[];
      };
      if (!response.ok) {
        setError(payload.message ?? "Unable to load communications.");
        setMessages([]);
        return;
      }
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
    } catch {
      setError("Unable to load communications.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const canPoll = () => document.visibilityState === "visible" && document.hasFocus();
    const poll = () => {
      if (canPoll()) loadMessages();
    };
    const intervalId = window.setInterval(poll, 30000);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [loadMessages]);

  const totalMessages = useMemo(() => messages.length, [messages]);

  return (
    <div className="space-y-6">
      <Card className={`space-y-2 p-5 ${studentBlueCardClass}`}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Donor communications</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Messages sent by donors and CSR partners to students appear here.
        </p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Total messages: {totalMessages}
        </p>
      </Card>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <Card className={`space-y-3 p-5 ${studentBlueCardClass}`}>
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Inbox</h4>
        {loading ? (
          <p className="text-sm text-slate-500">Loading communications...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">No donor communications yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((item) => (
              <article
                key={item._id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{item.subject}</p>
                    <p className="text-xs text-slate-500">
                      From: {item.donorName}
                      {item.donorOrganization ? ` · ${item.donorOrganization}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium capitalize text-primary">
                    {item.messageType}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{item.body}</p>
                <p className="mt-3 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

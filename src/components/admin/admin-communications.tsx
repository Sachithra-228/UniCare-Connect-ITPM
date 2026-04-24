"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/Card";

type CommunicationMessage = {
  _id: string;
  subject: string;
  body: string;
  messageType: string;
  donorName: string;
  donorOrganization?: string | null;
  audience?: string;
  createdAt: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function AdminCommunicationsSection() {
  const [activeSubTab, setActiveSubTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Composer state
  const [audience, setAudience] = useState("donors");
  const [messageType, setMessageType] = useState("Partnership update");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const loadInbox = useCallback(async () => {
    setLoading(true);
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

  const loadSentMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Re-using the donor communications API structure for admin sent messages
      // This will need a dedicated admin communications API for production
      const response = await fetch("/api/donor/communications"); 
      const payload = (await response.json().catch(() => [])) as any[] | { message?: string };
      if (!response.ok) {
        setError((payload as { message?: string }).message ?? "Unable to load sent messages.");
        setSentMessages([]);
        return;
      }
      setSentMessages(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Unable to load sent messages.");
      setSentMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === "inbox") {
      loadInbox();
    } else {
      loadSentMessages();
    }
  }, [activeSubTab, loadInbox, loadSentMessages]);

  const handleSendMessage = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/donor/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          messageType,
          subject: subject.trim(),
          body: body.trim()
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to send message.");
      }
      setSubject("");
      setBody("");
      setSuccess("Message sent successfully.");
      await loadSentMessages();
    } catch (err: any) {
      setError(err.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const totalMessages = useMemo(() => messages.length, [messages]);

  return (
    <div className="space-y-6">
      <Card className="space-y-2 p-5 border-primary/20 bg-primary/5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Partner communications</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Exchange updates with NGO partners, donors, and corporate sponsors.
        </p>
      </Card>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab("inbox")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeSubTab === "inbox" ? "border-b-2 border-primary text-primary" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
        >
          Inbox ({totalMessages})
        </button>
        <button
          onClick={() => setActiveSubTab("sent")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeSubTab === "sent" ? "border-b-2 border-primary text-primary" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
        >
          Sent Messages & Compose
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      {activeSubTab === "inbox" ? (
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Recent Inbox</h4>
            <button
              onClick={() => loadInbox()}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading communications...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500">No partner communications yet.</p>
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
                  <p className="mt-3 text-[10px] text-slate-500">
                    {formatDateTime(item.createdAt)}
                    {item.audience ? ` · Audience: ${item.audience}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <h4 className="text-base font-semibold">Compose Message</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Audience</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="donors">Donors & CSR Partners</option>
                  <option value="ngos">NGO Partners</option>
                  <option value="students">Recipients (Students)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Message Type</label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                >
                  <option>Partnership update</option>
                  <option>Verification request</option>
                  <option>Event invitation</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Subject</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Message</label>
              <textarea
                className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={sending}
                className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-70"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h4 className="text-base font-semibold">Sent History</h4>
            {loading ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : sentMessages.length === 0 ? (
              <p className="text-sm text-slate-500">No sent messages yet.</p>
            ) : (
              <div className="space-y-3">
                {sentMessages.map((item) => (
                  <div key={item._id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold">{item.subject}</p>
                      <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-primary mt-1">To: {item.audience}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{item.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}


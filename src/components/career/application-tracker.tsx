"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { useLanguage } from "@/context/language-context";

type AidRequest = {
  _id?: string;
  id?: string;
  category?: string;
  status?: string;
  submittedAt?: string;
};

export function ApplicationTracker() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "අයදුම්පත් නිරීක්ෂකය",
          loading: "පූරණය වෙමින්...",
          empty: "තවම අයදුම්පත් නැත. ආධාර, ශිෂ්‍යත්ව හෝ රැකියා සඳහා අයදුම් කර මෙහි බලන්න.",
          submitted: "යොමු කළේ",
          defaultCategory: "ආධාර ඉල්ලීම",
          pending: "බලාපොරොත්තුවෙන්"
        }
      : language === "ta"
        ? {
            title: "விண்ணப்ப கண்காணிப்பான்",
            loading: "ஏற்றப்படுகிறது...",
            empty: "இன்னும் விண்ணப்பங்கள் இல்லை. உதவி, உதவித்தொகை அல்லது வேலைகளுக்கு விண்ணப்பித்து இங்கே பாருங்கள்.",
            submitted: "சமர்ப்பிப்பு",
            defaultCategory: "உதவி கோரிக்கை",
            pending: "நிலுவையில்"
          }
        : {
            title: "Application tracker",
            loading: "Loading...",
            empty: "No applications yet. Apply for aid, scholarships, or jobs to see them here.",
            submitted: "Submitted",
            defaultCategory: "Aid request",
            pending: "Pending"
          };

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
      <h3 className="text-lg font-semibold">{text.title}</h3>
      {loading ? (
        <p className="text-sm text-slate-500">{text.loading}</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-slate-500">{text.empty}</p>
      ) : (
        <div className="space-y-3">
          {applications.map((item, i) => (
            <div
              key={item._id ?? item.id ?? i}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <div>
                <p className="font-semibold">{item.category ?? text.defaultCategory}</p>
                {item.submittedAt && <p className="text-xs text-slate-500">{text.submitted}: {item.submittedAt}</p>}
              </div>
              <Badge variant={item.status === "Approved" ? "success" : "info"}>{item.status ?? text.pending}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

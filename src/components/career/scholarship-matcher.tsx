"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import type { Scholarship } from "@/types";
import { useLanguage } from "@/context/language-context";

export function ScholarshipMatcher() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "AI ශිෂ්‍යත්ව ගැලපීම්",
          body: "මූල්‍ය අවශ්‍යතා, අධ්‍යයන ප්‍රතිඵල සහ රුචි මත නිර්දේශ.",
          loading: "පූරණය වෙමින්...",
          empty: "මෙම අවස්ථාවේ ශිෂ්‍යත්ව නොමැත.",
          deadline: "අවසාන දිනය"
        }
      : language === "ta"
        ? {
            title: "AI உதவித்தொகை பொருத்தம்",
            body: "நிதி தேவைகள், கல்வி செயல்திறன், மற்றும் ஆர்வங்களை அடிப்படையாகக் கொண்ட பரிந்துரைகள்.",
            loading: "ஏற்றப்படுகிறது...",
            empty: "தற்போது உதவித்தொகைகள் இல்லை.",
            deadline: "கடைசி தேதி"
          }
        : {
            title: "AI scholarship matching",
            body: "Recommendations based on financial need, academic performance, and interests.",
            loading: "Loading...",
            empty: "No scholarships available at the moment.",
            deadline: "Deadline"
          };

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scholarships")
      .then((r) => r.json())
      .then((data) => setScholarships(Array.isArray(data) ? data : []))
      .catch(() => setScholarships([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="space-y-4 border-slate-200/80 dark:border-slate-700/50">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{text.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{text.body}</p>
      {loading ? (
        <p className="text-sm text-slate-500">{text.loading}</p>
      ) : scholarships.length === 0 ? (
        <p className="text-sm text-slate-500">{text.empty}</p>
      ) : (
        <div className="space-y-3">
          {scholarships.map((scholarship) => (
            <div
              key={scholarship._id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/30"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{scholarship.title}</p>
                <Badge variant="success">{scholarship.status}</Badge>
              </div>
              <p className="text-slate-500">{scholarship.provider}</p>
              <p className="text-xs text-slate-400">{text.deadline}: {scholarship.deadline}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { useLanguage } from "@/context/language-context";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type EngagementPoint = {
  month: string;
  users: number;
  aid: number;
};

type WellnessPoint = {
  week: string;
  score: number;
};

type AnalyticsResponse = {
  engagement: EngagementPoint[];
  wellness: WellnessPoint[];
};

const FALLBACK_ENGAGEMENT: EngagementPoint[] = [
  { month: "Sep", users: 320, aid: 40 },
  { month: "Oct", users: 420, aid: 58 },
  { month: "Nov", users: 520, aid: 72 },
  { month: "Dec", users: 610, aid: 91 },
  { month: "Jan", users: 780, aid: 120 }
];

const FALLBACK_WELLNESS: WellnessPoint[] = [
  { week: "W1", score: 72 },
  { week: "W2", score: 68 },
  { week: "W3", score: 75 },
  { week: "W4", score: 80 }
];

export function AdminAnalytics() {
  const { language } = useLanguage();
  const [engagement, setEngagement] = useState<EngagementPoint[]>(FALLBACK_ENGAGEMENT);
  const [wellness, setWellness] = useState<WellnessPoint[]>(FALLBACK_WELLNESS);
  const text =
    language === "si"
      ? { userEngagement: "පරිශීලක සම්බන්ධතාව", wellnessTrend: "යහපැවැත්ම ප්‍රවණතාව" }
      : language === "ta"
        ? { userEngagement: "பயனர் ஈடுபாடு", wellnessTrend: "நலப்போக்கு" }
        : { userEngagement: "User engagement", wellnessTrend: "Wellness trend" };

  useEffect(() => {
    let cancelled = false;

    fetch("/api/analytics")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as AnalyticsResponse;
      })
      .then((data) => {
        if (!data || cancelled) return;
        if (Array.isArray(data.engagement) && data.engagement.length) {
          setEngagement(data.engagement);
        }
        if (Array.isArray(data.wellness) && data.wellness.length) {
          setWellness(data.wellness);
        }
      })
      .catch(() => {
        // Keep fallback demo data on error.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <h3 className="text-lg font-semibold">{text.userEngagement}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="aid" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="space-y-4">
        <h3 className="text-lg font-semibold">{text.wellnessTrend}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wellness}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

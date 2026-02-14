"use client";

import { Card } from "@/components/shared/card";
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

const engagementData = [
  { month: "Sep", users: 320, aid: 40 },
  { month: "Oct", users: 420, aid: 58 },
  { month: "Nov", users: 520, aid: 72 },
  { month: "Dec", users: 610, aid: 91 },
  { month: "Jan", users: 780, aid: 120 }
];

const wellnessData = [
  { week: "W1", score: 72 },
  { week: "W2", score: 68 },
  { week: "W3", score: 75 },
  { week: "W4", score: 80 }
];

export function AdminAnalytics() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <h3 className="text-lg font-semibold">User engagement</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementData}>
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
        <h3 className="text-lg font-semibold">Wellness trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wellnessData}>
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

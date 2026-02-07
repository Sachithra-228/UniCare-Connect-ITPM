import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatCard } from "@/components/shared/StatCard";
import { Card } from "@/components/shared/Card";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

const moderationQueue = [
  { id: "q1", type: "Forum post", status: "Pending review", owner: "Sajini P." },
  { id: "q2", type: "Aid request", status: "Verification needed", owner: "Kasun M." }
];

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow="Admin panel"
        title="Analytics & system oversight"
        subtitle="Monitor engagement, approve applications, and manage content."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Users" value="2,480" description="All roles" />
        <StatCard label="Aid Applications" value="320" description="This semester" />
        <StatCard label="Job Placements" value="86" description="2025/2026" />
        <StatCard label="Wellness Alerts" value="14" description="High priority" />
      </div>
      <AdminAnalytics />
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Content moderation</h3>
        <div className="space-y-3 text-sm">
          {moderationQueue.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="font-semibold">{item.type}</p>
              <p className="text-slate-500">{item.status}</p>
              <p className="text-xs text-slate-400">Owner: {item.owner}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

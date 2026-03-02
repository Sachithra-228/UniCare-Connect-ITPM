import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/shared/card";
import { AdminAnalytics } from "@/components/admin/admin-analytics";

const moderationQueue = [
  { id: "q1", type: "Forum post", status: "Pending review", owner: "Sajini P." },
  { id: "q2", type: "Aid request", status: "Verification needed", owner: "Kasun M." }
];

const upcomingDeadlines = [
  { id: "d1", label: "Emergency fund review", date: "2026-02-28" },
  { id: "d2", label: "Scholarship disbursement window", date: "2026-03-05" },
  { id: "d3", label: "Placement report submission", date: "2026-03-10" }
];

export default function AdminPage() {
  const isDemo =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.MONGODB_URI;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow="Admin panel"
        title="Analytics & system oversight"
        subtitle="Monitor engagement, verify records, and keep the system healthy."
      />

      {/* Platform stats / snapshots */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active students" value="2,480" description="All campuses" />
        <StatCard label="Pending verifications" value="32" description="Enrollment, aid, NGOs" />
        <StatCard label="Open aid requests" value="120" description="Awaiting decision" />
        <StatCard label="Open tickets" value="8" description="System & support alerts" />
      </div>

      {/* Engagement + wellness analytics */}
      <AdminAnalytics />

      {/* Recent activity */}
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Recent activity</h3>
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

      {/* Upcoming deadlines + system health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold">Upcoming deadlines</h3>
          <ul className="space-y-2 text-sm">
            {upcomingDeadlines.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <span>{d.label}</span>
                <span className="text-xs text-slate-500">{d.date}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold">System health</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>Database connection</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                {isDemo ? "Demo / fallback mode" : "Connected"}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Auth service</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                OK
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Background jobs</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Sample data (no jobs configured)
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

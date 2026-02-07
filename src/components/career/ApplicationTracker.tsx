import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";

const applications = [
  { id: "a1", title: "Women in Tech Grant", status: "Under Review", deadline: "2026-03-10" },
  { id: "a2", title: "Frontend Intern", status: "Interview", deadline: "2026-02-28" },
  { id: "a3", title: "Lab Assistant", status: "Submitted", deadline: "2026-03-05" }
];

export function ApplicationTracker() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Application tracker</h3>
      <div className="space-y-3">
        {applications.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
          >
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-slate-500">Deadline: {item.deadline}</p>
            </div>
            <Badge variant="info">{item.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

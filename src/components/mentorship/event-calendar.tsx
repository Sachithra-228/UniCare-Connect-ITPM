import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";

const events = [
  { id: "e1", title: "Career Fair 2026", date: "Feb 20", type: "Campus" },
  { id: "e2", title: "Wellness Workshop", date: "Feb 24", type: "Student Club" },
  { id: "e3", title: "AI Hackathon", date: "Mar 3", type: "Industry" }
];

export function EventCalendar() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Campus events & clubs</h3>
      <div className="space-y-3 text-sm">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <div>
              <p className="font-semibold">{event.title}</p>
              <p className="text-slate-500">{event.date}</p>
            </div>
            <Badge variant="info">{event.type}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

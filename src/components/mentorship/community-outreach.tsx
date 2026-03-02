import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";

const outreach = [
  { id: "o1", title: "Coastal cleanup", date: "Feb 18", hours: 4 },
  { id: "o2", title: "STEM tutoring", date: "Feb 26", hours: 2 }
];

export function CommunityOutreach() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Community outreach & volunteering</h3>
      <div className="space-y-3 text-sm">
        {outreach.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="font-semibold">{item.title}</p>
            <p className="text-slate-500">
              {item.date} • {item.hours} hours
            </p>
            <Button variant="secondary" className="mt-2">
              Join activity
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

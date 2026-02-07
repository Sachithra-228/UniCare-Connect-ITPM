import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";

const challenges = [
  { id: "w1", title: "7-day sleep reset", status: "Active" },
  { id: "w2", title: "Hydration tracker", status: "Active" },
  { id: "w3", title: "30-min daily walk", status: "Upcoming" }
];

export function WellnessChallenges() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Wellness challenges</h3>
      <div className="space-y-3 text-sm">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <p className="font-semibold">{challenge.title}</p>
            <Badge variant="info">{challenge.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

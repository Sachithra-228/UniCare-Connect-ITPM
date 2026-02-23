import { Card } from "@/components/shared/card";

export function WellnessChallenges() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Wellness challenges</h3>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        No active challenges right now. New challenges will appear here when your university or wellness team adds them.
      </p>
    </Card>
  );
}

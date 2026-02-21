import { Card } from "@/components/shared/card";

export function HealthContent() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Health & wellness resources</h3>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        No resources listed yet. Your university can add multilingual wellness content here.
      </p>
    </Card>
  );
}

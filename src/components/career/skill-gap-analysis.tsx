import { Card } from "@/components/shared/card";

export function SkillGapAnalysis() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Skill gap analysis</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Personalized course recommendations based on your career goals.
      </p>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        Complete your profile and career interests in the Profile section to get personalized skill recommendations here.
      </p>
    </Card>
  );
}

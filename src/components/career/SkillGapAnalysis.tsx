import { Card } from "@/components/shared/Card";

const skills = [
  { skill: "React", level: "Intermediate", action: "Complete React Hooks module" },
  { skill: "Data Analytics", level: "Beginner", action: "Enroll in Google Data Analytics" },
  { skill: "Interview Prep", level: "Needs focus", action: "Schedule mock interview" }
];

export function SkillGapAnalysis() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Skill gap analysis</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Personalized course recommendations based on your career goals.
      </p>
      <div className="space-y-3 text-sm">
        {skills.map((item) => (
          <div key={item.skill} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="font-semibold">{item.skill}</p>
            <p className="text-slate-500">Level: {item.level}</p>
            <p className="text-slate-500">Next: {item.action}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

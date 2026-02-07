import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

const mentors = [
  { id: "m1", name: "Ravindu Fernando", expertise: "Product Management", availability: "Thu 6PM" },
  { id: "m2", name: "Nethmi Silva", expertise: "Software Engineering", availability: "Sat 10AM" }
];

export function MentorMatch() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Mentor matching</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Match with alumni and industry mentors based on your goals.
      </p>
      <div className="space-y-3 text-sm">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="font-semibold">{mentor.name}</p>
            <p className="text-slate-500">{mentor.expertise}</p>
            <p className="text-slate-500">Availability: {mentor.availability}</p>
            <Button variant="secondary" className="mt-2">
              Request session
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

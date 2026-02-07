import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

const counselors = [
  { id: "c1", name: "Dr. A. Senanayake", specialty: "Stress management", slots: "Mon/Wed" },
  { id: "c2", name: "Ms. T. Perera", specialty: "Career anxiety", slots: "Tue/Thu" }
];

export function CounselorBooking() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Counselor booking</h3>
      <div className="space-y-3 text-sm">
        {counselors.map((counselor) => (
          <div
            key={counselor.id}
            className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <p className="font-semibold">{counselor.name}</p>
            <p className="text-slate-500">{counselor.specialty}</p>
            <p className="text-slate-500">Availability: {counselor.slots}</p>
            <Button variant="secondary" className="mt-2">
              Book session
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

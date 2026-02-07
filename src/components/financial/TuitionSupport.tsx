import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

export function TuitionSupport() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Tuition & maintenance support</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Discover scholarships, fee waivers, payment plans, and corporate sponsorships.
      </p>
      <ul className="text-sm text-slate-500">
        <li>• Fee waiver matching based on financial need</li>
        <li>• Payment plan requests with university finance offices</li>
        <li>• Student loan guidance and partner banks</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary">Check eligibility</Button>
        <Button variant="ghost">View scholarship matches</Button>
      </div>
    </Card>
  );
}

import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { demoScholarships } from "@/lib/demo-data";

export function ScholarshipMatcher() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">AI scholarship matching</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Recommendations based on financial need, academic performance, and interests.
      </p>
      <div className="space-y-3">
        {demoScholarships.map((scholarship) => (
          <div
            key={scholarship._id}
            className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{scholarship.title}</p>
              <Badge variant="success">{scholarship.status}</Badge>
            </div>
            <p className="text-slate-500">{scholarship.provider}</p>
            <p className="text-xs text-slate-400">Deadline: {scholarship.deadline}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

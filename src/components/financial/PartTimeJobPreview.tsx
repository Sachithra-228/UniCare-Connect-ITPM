import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { demoJobs } from "@/lib/demo-data";

export function PartTimeJobPreview() {
  const jobs = demoJobs.slice(0, 2);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Part-time job portal</h3>
        <Link className="text-sm text-primary" href="/career">
          View full board
        </Link>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job._id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
          >
            <div>
              <p className="font-semibold">{job.title}</p>
              <p className="text-slate-500">{job.company}</p>
            </div>
            <Badge variant="info">{job.type}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

import { Card } from "@/components/shared/card";

export function CounselorBooking() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Counselor booking</h3>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        No counselors listed at the moment. Contact student services to book a session, or check back when availability is added here.
      </p>
    </Card>
  );
}

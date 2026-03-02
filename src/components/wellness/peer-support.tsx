import { Card } from "@/components/shared/card";

export function PeerSupport() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Peer support forum</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Moderated discussions with quick report tools for safety.
      </p>
      <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
        No discussions yet. Start a topic when the forum is open, or check back later.
      </p>
    </Card>
  );
}

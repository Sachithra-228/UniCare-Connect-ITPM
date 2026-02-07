import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

const threads = [
  { id: "p1", title: "Managing exam stress", replies: 12 },
  { id: "p2", title: "Staying healthy in hostel life", replies: 8 }
];

export function PeerSupport() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Peer support forum</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Moderated discussions with quick report tools for safety.
      </p>
      <div className="space-y-3 text-sm">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <p className="font-semibold">{thread.title}</p>
            <span className="text-slate-500">{thread.replies} replies</span>
          </div>
        ))}
      </div>
      <Button variant="secondary">Start a new discussion</Button>
    </Card>
  );
}

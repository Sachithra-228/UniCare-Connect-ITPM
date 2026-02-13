import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";

const content = [
  { id: "h1", title: "Mindfulness basics", language: "Sinhala" },
  { id: "h2", title: "Stress relief guide", language: "Tamil" },
  { id: "h3", title: "Healthy sleep habits", language: "English" }
];

export function HealthContent() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Multilingual wellness content</h3>
      <div className="space-y-3 text-sm">
        {content.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <p className="font-semibold">{item.title}</p>
            <Badge variant="info">{item.language}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

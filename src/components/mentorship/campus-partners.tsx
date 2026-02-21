import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";

const partners = [
  { id: "p1", name: "HealthPlus Pharmacy", offer: "10% student discount" },
  { id: "p2", name: "GreenLeaf Cafe", offer: "Meal vouchers" },
  { id: "p3", name: "City Bookstore", offer: "15% discount" }
];

export function CampusPartners() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Local partnerships</h3>
      <div className="space-y-3 text-sm">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <div>
              <p className="font-semibold">{partner.name}</p>
              <p className="text-slate-500">{partner.offer}</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

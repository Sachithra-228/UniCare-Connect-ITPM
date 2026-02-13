import { Card } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";

const offers = [
  { title: "Meal voucher program", detail: "200 vouchers this semester", status: "active" },
  { title: "Host family matching", detail: "12 hosts near Kandy campus", status: "active" },
  { title: "Subsidized groceries", detail: "10% partner discount", status: "active" }
];

export function BoardingSupport() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Boarding & daily necessities</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Access safe housing matches, meal vouchers, and utility bill support.
      </p>
      <div className="space-y-3">
        {offers.map((offer) => (
          <div
            key={offer.title}
            className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
          >
            <div>
              <p className="font-semibold">{offer.title}</p>
              <p className="text-slate-500">{offer.detail}</p>
            </div>
            <Badge variant="success">{offer.status}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

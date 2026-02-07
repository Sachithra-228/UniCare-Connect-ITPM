import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

const partners = [
  "SL Tech Alliance",
  "LaptopLanka",
  "Dialog Axiata",
  "Microsoft Sri Lanka"
];

export function EquipmentSupport() {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Equipment & resource support</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Request laptops, books, and lab equipment through verified university partners. Devices
        are allocated via an equitable scoring system.
      </p>
      <ul className="text-sm text-slate-500">
        {partners.map((partner) => (
          <li key={partner}>• {partner}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary">Request equipment</Button>
        <Button variant="ghost">View donation inventory</Button>
      </div>
    </Card>
  );
}

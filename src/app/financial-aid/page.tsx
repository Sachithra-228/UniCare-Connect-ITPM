import { Card } from "@/components/shared/Card";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { AidRequestForm } from "@/components/financial/AidRequestForm";
import { EquipmentSupport } from "@/components/financial/EquipmentSupport";
import { BoardingSupport } from "@/components/financial/BoardingSupport";
import { TuitionSupport } from "@/components/financial/TuitionSupport";
import { PartTimeJobPreview } from "@/components/financial/PartTimeJobPreview";

export default function FinancialAidPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
      <SectionHeading
        eyebrow="Financial support & job portal"
        title="Apply for academic aid and daily necessities"
        subtitle="Emergency academic support, device loans, boarding help, and tuition assistance."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">Emergency academic aid application</h3>
          <AidRequestForm />
        </Card>
        <div className="space-y-6">
          <EquipmentSupport />
          <PartTimeJobPreview />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BoardingSupport />
        <TuitionSupport />
      </div>
    </div>
  );
}

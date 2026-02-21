import { Card } from "@/components/shared/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { AidRequestForm } from "@/components/financial/aid-request-form";
import { EquipmentSupport } from "@/components/financial/equipment-support";
import { BoardingSupport } from "@/components/financial/boarding-support";
import { TuitionSupport } from "@/components/financial/tuition-support";
import { PartTimeJobPreview } from "@/components/financial/part-time-job-preview";

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

import { SectionHeading } from "@/components/shared/section-heading";
import { MoodTracker } from "@/components/wellness/mood-tracker";
import { CounselorBooking } from "@/components/wellness/counselor-booking";
import { WellnessChallenges } from "@/components/wellness/wellness-challenges";
import { PeerSupport } from "@/components/wellness/peer-support";
import { HealthContent } from "@/components/wellness/health-content";

export default function WellnessPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow="Health & wellness module"
        title="Support your mental and physical wellbeing"
        subtitle="Track mood, book counselors, and join wellness challenges."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <MoodTracker />
        <CounselorBooking />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <WellnessChallenges />
        <PeerSupport />
      </div>
      <HealthContent />
    </div>
  );
}

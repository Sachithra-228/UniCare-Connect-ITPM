import { SectionHeading } from "@/components/shared/SectionHeading";
import { MoodTracker } from "@/components/wellness/MoodTracker";
import { CounselorBooking } from "@/components/wellness/CounselorBooking";
import { WellnessChallenges } from "@/components/wellness/WellnessChallenges";
import { PeerSupport } from "@/components/wellness/PeerSupport";
import { HealthContent } from "@/components/wellness/HealthContent";

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

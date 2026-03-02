import { SectionHeading } from "@/components/shared/section-heading";
import { MentorMatch } from "@/components/mentorship/mentor-match";
import { EventCalendar } from "@/components/mentorship/event-calendar";
import { CampusPartners } from "@/components/mentorship/campus-partners";
import { CommunityOutreach } from "@/components/mentorship/community-outreach";
import { Card } from "@/components/shared/card";

export default function MentorshipPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow="Mentorship & campus integration"
        title="Connect with mentors and campus communities"
        subtitle="Alumni matching, campus events, partnerships, and outreach."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <MentorMatch />
        <EventCalendar />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CampusPartners />
        <CommunityOutreach />
      </div>
      <Card className="space-y-2">
        <h3 className="text-lg font-semibold">University LMS integration</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Single sign-on with campus LMS allows students to sync course schedules and receive
          automated reminders for academic milestones.
        </p>
      </Card>
    </div>
  );
}

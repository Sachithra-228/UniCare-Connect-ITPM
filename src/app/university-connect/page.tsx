import { SectionHeading } from "@/components/shared/SectionHeading";
import { Card } from "@/components/shared/Card";
import { EventCalendar } from "@/components/mentorship/EventCalendar";

const clubs = [
  { id: "c1", name: "IEEE Student Branch", members: 120 },
  { id: "c2", name: "Entrepreneurship Club", members: 80 },
  { id: "c3", name: "Nature Society", members: 60 }
];

const resources = [
  "Library digital access",
  "Exam timetable sync",
  "Campus transport schedules",
  "Student services directory"
];

export default function UniversityConnectPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow="University connect"
        title="Campus events, clubs, and resources"
        subtitle="Stay connected with university communities and essential resources."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <EventCalendar />
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">Student clubs</h3>
          <div className="space-y-3 text-sm">
            {clubs.map((club) => (
              <div key={club.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-semibold">{club.name}</p>
                <p className="text-slate-500">{club.members} active members</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">Campus resources</h3>
        <ul className="text-sm text-slate-500">
          {resources.map((resource) => (
            <li key={resource}>• {resource}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

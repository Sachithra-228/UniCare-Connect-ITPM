import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/shared/card";

export default function StoriesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-14">
      <SectionHeading
        eyebrow="Stories"
        title="Real stories from Sri Lankan campuses"
        subtitle="Impact-focused outcomes for students and universities."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            name: "Ishara P.",
            quote:
              "UniCare helped me secure a laptop within a week and connected me to a part-time lab role."
          },
          {
            name: "Prof. D. Jayasekara",
            quote: "Our faculty finally has visibility into student needs across the campus."
          },
          {
            name: "Alumni Mentor",
            quote: "Mentorship scheduling is seamless, and students arrive prepared every time."
          }
        ].map((testimonial) => (
          <Card key={testimonial.name} className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              “{testimonial.quote}”
            </p>
            <p className="text-sm font-semibold">{testimonial.name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { ModuleHero } from "@/components/shared/module-hero";
import { useLanguage } from "@/context/language-context";

export default function MentorshipPage() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          eyebrow: "à¶¸à·à¶»à·Šà¶œà·à¶´à¶¯à·šà·à¶±à¶º à·ƒà·„ à¶šà·à¶¸à·Šà¶´à·ƒà·Š à¶’à¶šà·à¶¶à¶¯à·Šà¶°à¶­à·à·€",
          title: "à¶¸à·™à¶±à·Šà¶§à¶»à·Šà·€à¶»à·”à¶±à·Š à·ƒà·„ à¶šà·à¶¸à·Šà¶´à·ƒà·Š à¶´à·Šâ€à¶»à¶¢à·à·€à¶±à·Š à·ƒà¶¸à¶Ÿ à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à·€à¶±à·Šà¶±",
          subtitle: "à¶´à·”à¶»à·à¶œà·à¶¸à·“ à¶œà·à¶½à¶´à·“à¶¸à·Š, à¶šà·à¶¸à·Šà¶´à·ƒà·Š à·ƒà·’à¶¯à·”à·€à·“à¶¸à·Š, à·„à·€à·”à¶½à·Šà¶šà·à¶»à·“à¶­à·Šà·€ à·ƒà·„ à¶´à·Šâ€à¶»à¶¢à· à¶šà·Šâ€à¶»à·’à¶ºà·à¶šà·à¶»à¶šà¶¸à·Š.",
          highlights: ["Mentor matching", "Campus events", "Community outreach"],
          stats: [
            { label: "Available mentors", value: "18" },
            { label: "Upcoming events", value: "6" },
            { label: "Active partners", value: "9" }
          ],
          primaryAction: "Find a mentor",
          secondaryAction: "View events"
        }
      : language === "ta"
        ? {
            eyebrow: "à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®µà®³à®¾à®• à®’à®°à¯à®™à¯à®•à®¿à®£à¯ˆà®ªà¯à®ªà¯",
            title: "à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà®¿à®•à®³à¯à®®à¯ à®µà®³à®¾à®•à®•à¯ à®•à¯à®´à¯à®•à¯à®•à®³à¯à®®à¯ à®‡à®£à¯ˆà®¨à¯à®¤à®¿à®Ÿà¯à®™à¯à®•à®³à¯",
            subtitle: "à®…à®²à¯à®®à¯à®©à®¿ à®ªà¯Šà®°à¯à®¤à¯à®¤à®®à¯, à®µà®³à®¾à®• à®¨à®¿à®•à®´à¯à®µà¯à®•à®³à¯, à®•à¯‚à®Ÿà¯à®Ÿà®¾à®£à¯à®®à¯ˆà®•à®³à¯, à®®à®±à¯à®±à¯à®®à¯ à®šà®®à¯‚à®• à®šà¯†à®¯à®²à¯à®ªà®¾à®Ÿà¯à®•à®³à¯.",
            highlights: ["Mentor matching", "Campus events", "Community outreach"],
            stats: [
              { label: "Available mentors", value: "18" },
              { label: "Upcoming events", value: "6" },
              { label: "Active partners", value: "9" }
            ],
            primaryAction: "Find a mentor",
            secondaryAction: "View events"
          }
        : {
            eyebrow: "Mentorship & campus integration",
            title: "Connect with mentors and campus communities",
            subtitle: "Alumni matching, campus events, partnerships, and outreach.",
            highlights: ["Mentor matching", "Campus events", "Community outreach"],
            stats: [
              { label: "Available mentors", value: "18" },
              { label: "Upcoming events", value: "6" },
              { label: "Active partners", value: "9" }
            ],
            primaryAction: "Find a mentor",
            secondaryAction: "View events"
          };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <ModuleHero
        eyebrow={text.eyebrow}
        title={text.title}
        subtitle={text.subtitle}
        accent="from-violet-400/45 via-violet-400/15 to-transparent"
        highlights={text.highlights}
        stats={text.stats}
        actions={[
          { label: text.primaryAction, href: "/mentorship" },
          { label: text.secondaryAction, href: "/mentorship", variant: "ghost" }
        ]}
      />
    </div>
  );
}

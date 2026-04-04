"use client";

import { ModuleHero } from "@/components/shared/module-hero";
import { useLanguage } from "@/context/language-context";

export default function CareerPage() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          eyebrow: "à·€à·˜à¶­à·Šà¶­à·“à¶º à·ƒà·„ à·à·’à·‚à·Šâ€à¶ºà¶­à·Šà·€ à¶¸à·œà¶©à·’à¶ºà·”à¶½à¶º",
          title: "à¶”à¶¶à¶œà·š à·€à·˜à¶­à·Šà¶­à·“à¶º à¶œà¶¸à¶± à¶‰à¶¯à·’à¶»à·’à¶ºà¶§ à¶œà·™à¶± à¶ºà¶±à·Šà¶±",
          subtitle: "à·à·’à·‚à·Šâ€à¶ºà¶­à·Šà·€ à¶œà·à¶½à¶´à·“à¶¸à·Š, à¶´à·”à·„à·”à¶«à·” à¶…à·€à·ƒà·Šà¶®à· à·ƒà·„ à¶¯à¶šà·Šà·‚à¶­à· à¶±à·’à¶»à·Šà¶¯à·šà·.",
          highlights: ["Scholarships", "Internships", "Skill gaps"],
          stats: [
            { label: "Matches this week", value: "38" },
            { label: "Active roles", value: "120" },
            { label: "Profile strength", value: "72%" }
          ],
          primaryAction: "Get matches",
          secondaryAction: "Browse jobs"
        }
      : language === "ta"
        ? {
            eyebrow: "à®¤à¯Šà®´à®¿à®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®‰à®¤à®µà®¿à®¤à¯à®¤à¯Šà®•à¯ˆ à®¤à¯Šà®•à¯à®¤à®¿",
            title: "à®‰à®™à¯à®•à®³à¯ à®¤à¯Šà®´à®¿à®²à¯ à®ªà®¯à®£à®¤à¯à®¤à¯ˆ à®®à¯à®©à¯à®©à¯‡à®±à¯à®±à¯à®™à¯à®•à®³à¯",
            subtitle: "à®‰à®¤à®µà®¿à®¤à¯à®¤à¯Šà®•à¯ˆ à®ªà¯Šà®°à¯à®¤à¯à®¤à®®à¯, à®‡à®©à¯à®Ÿà®°à¯à®©à¯à®·à®¿à®ªà¯, à®®à®±à¯à®±à¯à®®à¯ à®¤à®¿à®±à®©à¯ à®ªà®°à®¿à®¨à¯à®¤à¯à®°à¯ˆà®•à®³à¯.",
            highlights: ["Scholarships", "Internships", "Skill gaps"],
            stats: [
              { label: "Matches this week", value: "38" },
              { label: "Active roles", value: "120" },
              { label: "Profile strength", value: "72%" }
            ],
            primaryAction: "Get matches",
            secondaryAction: "Browse jobs"
          }
        : {
            eyebrow: "Career & scholarship module",
            title: "Advance your career journey",
            subtitle: "Scholarship matching, internships, and skill recommendations.",
            highlights: ["Scholarships", "Internships", "Skill gaps"],
            stats: [
              { label: "Matches this week", value: "38" },
              { label: "Active roles", value: "120" },
              { label: "Profile strength", value: "72%" }
            ],
            primaryAction: "Get matches",
            secondaryAction: "Browse jobs"
          };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <ModuleHero
        eyebrow={text.eyebrow}
        title={text.title}
        subtitle={text.subtitle}
        accent="from-sky-400/45 via-sky-400/15 to-transparent"
        highlights={text.highlights}
        stats={text.stats}
        actions={[
          { label: text.primaryAction, href: "/career" },
          { label: text.secondaryAction, href: "/career", variant: "ghost" }
        ]}
      />
    </div>
  );
}

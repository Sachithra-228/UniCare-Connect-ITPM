"use client";

import { ModuleHero } from "@/components/shared/module-hero";
import { useLanguage } from "@/context/language-context";

export default function WellnessPage() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          eyebrow: "à·ƒà·žà¶›à·Šâ€à¶º à·ƒà·„ à·ƒà·”à·€à¶­à· à¶¸à·œà¶©à·’à¶ºà·”à¶½à¶º",
          title: "à¶”à¶¶à¶œà·š à¶¸à·à¶±à·ƒà·’à¶š à·ƒà·„ à·à·à¶»à·“à¶»à·’à¶š à·ƒà·”à·€à¶­à·à·€à¶§ à·ƒà·„à·à¶º à¶¯à·™à¶±à·Šà¶±",
          subtitle: "à¶¸à¶±à·à¶·à·à·€à¶º à·ƒà¶§à·„à¶±à·Š à¶šà¶»à¶±à·Šà¶±, à¶‹à¶´à¶¯à·šà·à¶šà¶ºà¶±à·Š à¶¶à·”à¶šà·Š à¶šà¶»à¶±à·Šà¶±, à·ƒà·„ à·ƒà·”à·€à¶­à· à¶…à¶·à·’à¶ºà·à¶œà·€à¶½à¶§ à¶‘à¶šà·Šà·€à¶±à·Šà¶±.",
          highlights: ["Mood check-ins", "Counselor booking", "Wellness challenges"],
          stats: [
            { label: "Check-ins today", value: "24" },
            { label: "Counselor slots", value: "5" },
            { label: "Active challenges", value: "2" }
          ],
          primaryAction: "Log a check-in",
          secondaryAction: "Book a counselor"
        }
      : language === "ta"
        ? {
            eyebrow: "à®†à®°à¯‹à®•à¯à®•à®¿à®¯à®®à¯ à®®à®±à¯à®±à¯à®®à¯ à®¨à®²à®©à¯ à®¤à¯Šà®•à¯à®¤à®¿",
            title: "à®‰à®™à¯à®•à®³à¯ à®®à®© à®®à®±à¯à®±à¯à®®à¯ à®‰à®Ÿà®²à¯ à®¨à®²à®©à¯ˆ à®†à®¤à®°à®¿à®•à¯à®•à®µà¯à®®à¯",
            subtitle: "à®®à¯‚à®Ÿà¯ à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯à®¯à®µà¯à®®à¯, à®†à®²à¯‹à®šà®•à®°à¯ à®¨à¯‡à®°à®®à¯ à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯à®¯à®µà¯à®®à¯, à®¨à®²à®©à¯ à®šà®µà®¾à®²à¯à®•à®³à®¿à®²à¯ à®šà¯‡à®°à®µà¯à®®à¯.",
            highlights: ["Mood check-ins", "Counselor booking", "Wellness challenges"],
            stats: [
              { label: "Check-ins today", value: "24" },
              { label: "Counselor slots", value: "5" },
              { label: "Active challenges", value: "2" }
            ],
            primaryAction: "Log a check-in",
            secondaryAction: "Book a counselor"
          }
        : {
            eyebrow: "Health & wellness module",
            title: "Support your mental and physical wellbeing",
            subtitle: "Track mood, book counselors, and join wellness challenges.",
            highlights: ["Mood check-ins", "Counselor booking", "Wellness challenges"],
            stats: [
              { label: "Check-ins today", value: "24" },
              { label: "Counselor slots", value: "5" },
              { label: "Active challenges", value: "2" }
            ],
            primaryAction: "Log a check-in",
            secondaryAction: "Book a counselor"
          };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <ModuleHero
        eyebrow={text.eyebrow}
        title={text.title}
        subtitle={text.subtitle}
        accent="from-rose-400/45 via-rose-400/15 to-transparent"
        highlights={text.highlights}
        stats={text.stats}
        actions={[
          { label: text.primaryAction, href: "/wellness" },
          { label: text.secondaryAction, href: "/wellness", variant: "ghost" }
        ]}
      />
    </div>
  );
}

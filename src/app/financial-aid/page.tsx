"use client";

import { ModuleHero } from "@/components/shared/module-hero";
import { useLanguage } from "@/context/language-context";

export default function FinancialAidPage() {
  const { language } = useLanguage();

  const text =
    language === "si"
      ? {
          eyebrow: "à¶¸à·–à¶½à·Šâ€à¶º à·ƒà·„à·à¶º à·ƒà·„ à¶»à·à¶šà·’à¶ºà· à¶¯à·Šà·€à·à¶»à¶º",
          title: "à¶…à¶°à·Šâ€à¶ºà¶ºà¶± à¶†à¶°à·à¶» à·ƒà·„ à¶¯à·›à¶±à·’à¶š à¶…à·€à·à·Šâ€à¶ºà¶­à· à·ƒà¶³à·„à· à¶…à¶ºà¶¯à·”à¶¸à·Š à¶šà¶»à¶±à·Šà¶±",
          subtitle: "à·„à¶¯à·’à·ƒà·’ à¶…à¶°à·Šâ€à¶ºà¶ºà¶± à·ƒà·„à·à¶º, à¶‹à¶´à·à¶‚à¶œ à¶«à¶º, à¶±à·€à·à¶­à·à¶±à·Š à·ƒà·„à·à¶º à·ƒà·„ à¶´à·à¶¨à¶¸à·à¶½à· à¶†à¶°à·à¶».",
          highlights: ["Emergency aid", "Device loans", "Tuition support"],
          stats: [
            { label: "Avg approval time", value: "3 days" },
            { label: "Partner donors", value: "12" },
            { label: "Active requests", value: "28" }
          ],
          primaryAction: "Start aid request",
          secondaryAction: "See job portal"
        }
      : language === "ta"
        ? {
            eyebrow: "à®¨à®¿à®¤à®¿ à®†à®¤à®°à®µà¯ à®®à®±à¯à®±à¯à®®à¯ à®µà¯‡à®²à¯ˆ à®¤à®³à®®à¯",
            title: "à®•à®²à¯à®µà®¿ à®‰à®¤à®µà®¿ à®®à®±à¯à®±à¯à®®à¯ à®…à®©à¯à®±à®¾à®Ÿ à®¤à¯‡à®µà¯ˆà®•à®³à¯à®•à¯à®•à¯ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯",
            subtitle: "à®…à®µà®šà®° à®•à®²à¯à®µà®¿ à®†à®¤à®°à®µà¯, à®šà®¾à®¤à®©à®•à¯ à®•à®Ÿà®©à¯, à®¤à®™à¯à®•à¯à®®à®¿à®Ÿà®®à¯ à®‰à®¤à®µà®¿, à®®à®±à¯à®±à¯à®®à¯ à®•à®Ÿà¯à®Ÿà®£ à®‰à®¤à®µà®¿.",
            highlights: ["Emergency aid", "Device loans", "Tuition support"],
            stats: [
              { label: "Avg approval time", value: "3 days" },
              { label: "Partner donors", value: "12" },
              { label: "Active requests", value: "28" }
            ],
            primaryAction: "Start aid request",
            secondaryAction: "See job portal"
          }
        : {
            eyebrow: "Financial support & job portal",
            title: "Apply for academic aid and daily necessities",
            subtitle: "Emergency academic support, device loans, boarding help, and tuition assistance.",
            highlights: ["Emergency aid", "Device loans", "Tuition support"],
            stats: [
              { label: "Avg approval time", value: "3 days" },
              { label: "Partner donors", value: "12" },
              { label: "Active requests", value: "28" }
            ],
            primaryAction: "Start aid request",
            secondaryAction: "See job portal"
          };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <ModuleHero
        eyebrow={text.eyebrow}
        title={text.title}
        subtitle={text.subtitle}
        accent="from-emerald-400/45 via-emerald-400/15 to-transparent"
        highlights={text.highlights}
        stats={text.stats}
        actions={[
          { label: text.primaryAction, href: "/financial-aid" },
          { label: text.secondaryAction, href: "/career", variant: "ghost" }
        ]}
      />
    </div>
  );
}

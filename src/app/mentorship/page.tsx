"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { MentorMatch } from "@/components/mentorship/mentor-match";
import { EventCalendar } from "@/components/mentorship/event-calendar";
import { CampusPartners } from "@/components/mentorship/campus-partners";
import { CommunityOutreach } from "@/components/mentorship/community-outreach";
import { Card } from "@/components/shared/card";
import { useLanguage } from "@/context/language-context";

export default function MentorshipPage() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          eyebrow: "මාර්ගෝපදේශනය සහ කැම්පස් ඒකාබද්ධතාව",
          title: "මෙන්ටර්වරුන් සහ කැම්පස් ප්‍රජාවන් සමඟ සම්බන්ධ වන්න",
          subtitle: "පුරෝගාමී ගැලපීම්, කැම්පස් සිදුවීම්, හවුල්කාරීත්ව සහ ප්‍රජා ක්‍රියාකාරකම්.",
          lmsTitle: "විශ්වවිද්‍යාල LMS ඒකාබද්ධ කිරීම",
          lmsBody:
            "කැම්පස් LMS සමඟ single sign-on මගින් පාඨමාලා කාලසටහන් සම්බන්ධ කර අධ්‍යයන වැදගත් අවස්ථා සඳහා ස්වයංක්‍රීය මතක් කිරීම් ලබාගත හැක."
        }
      : language === "ta"
        ? {
            eyebrow: "வழிகாட்டல் மற்றும் வளாக ஒருங்கிணைப்பு",
            title: "வழிகாட்டிகளும் வளாகக் குழுக்களும் இணைந்திடுங்கள்",
            subtitle: "அலும்னி பொருத்தம், வளாக நிகழ்வுகள், கூட்டாண்மைகள், மற்றும் சமூக செயல்பாடுகள்.",
            lmsTitle: "பல்கலைக்கழக LMS ஒருங்கிணைப்பு",
            lmsBody:
              "வளாக LMS உடன் single sign-on மூலம் மாணவர்கள் பாட அட்டவணையை ஒத்திசைத்து கல்வி மைல்கற்களுக்கு தானியங்கி நினைவூட்டல்கள் பெறலாம்."
          }
        : {
            eyebrow: "Mentorship & campus integration",
            title: "Connect with mentors and campus communities",
            subtitle: "Alumni matching, campus events, partnerships, and outreach.",
            lmsTitle: "University LMS integration",
            lmsBody:
              "Single sign-on with campus LMS allows students to sync course schedules and receive automated reminders for academic milestones."
          };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading eyebrow={text.eyebrow} title={text.title} subtitle={text.subtitle} />
      <div className="grid gap-6 lg:grid-cols-2">
        <MentorMatch />
        <EventCalendar />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CampusPartners />
        <CommunityOutreach />
      </div>
      <Card className="space-y-2">
        <h3 className="text-lg font-semibold">{text.lmsTitle}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">{text.lmsBody}</p>
      </Card>
    </div>
  );
}

"use client";

import { StudentHome } from "./student-home";
import { StudentFinancialAid } from "./student-financial-aid";
import { StudentCareer } from "./student-career";
import { StudentMentorship } from "./student-mentorship";
import { StudentWellness } from "./student-wellness";
import { StudentCampusLife } from "./student-campus-life";
import { StudentMyApplications } from "./student-my-applications";
import { StudentProfile } from "./student-profile";

const STUDENT_SECTIONS: Record<
  string,
  React.ComponentType
> = {
  home: StudentHome,
  "financial-aid": StudentFinancialAid,
  career: StudentCareer,
  mentorship: StudentMentorship,
  wellness: StudentWellness,
  "campus-life": StudentCampusLife,
  "my-applications": StudentMyApplications,
  profile: StudentProfile
};

type StudentSectionContentProps = {
  sectionId: string;
};

export function StudentSectionContent({ sectionId }: StudentSectionContentProps) {
  const Section = STUDENT_SECTIONS[sectionId];
  if (!Section) return null;
  return <Section />;
}

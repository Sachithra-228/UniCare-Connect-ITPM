import {
  Home,
  CircleDollarSign,
  Briefcase,
  Users,
  Heart,
  Calendar,
  FileStack,
  User,
  type LucideIcon
} from "lucide-react";

const SECTION_ICONS: Record<string, LucideIcon> = {
  home: Home,
  "financial-aid": CircleDollarSign,
  career: Briefcase,
  mentorship: Users,
  wellness: Heart,
  "campus-life": Calendar,
  "my-applications": FileStack,
  profile: User
};

export function getSectionIcon(sectionId: string): LucideIcon {
  return SECTION_ICONS[sectionId] ?? FileStack;
}

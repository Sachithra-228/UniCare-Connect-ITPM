import {
  Home,
  CircleDollarSign,
  Briefcase,
  Users,
  Heart,
  Calendar,
  FileStack,
  User,
  ShieldCheck,
  BarChart3,
  Megaphone,
  MessageCircle,
  Video,
  Award,
  HandCoins,
  PieChart,
  Target,
  Building2,
  Sparkles,
  CalendarClock,
  WalletCards,
  GraduationCap,
  Handshake,
  BookOpen,
  Bell,
  CalendarDays,
  ClipboardList,
  type LucideIcon
} from "lucide-react";

const SECTION_ICONS: Record<string, LucideIcon> = {
  // Student
  home: Home,
  "financial-aid": CircleDollarSign,
  career: Briefcase,
  mentorship: Users,
  wellness: Heart,
  "campus-life": Calendar,
  "my-applications": FileStack,
  profile: User,

  // Admin / faculty
  overview: Home,
  verifications: ShieldCheck,
  "financial-oversight": CircleDollarSign,
  "career-services": Briefcase,
  "mentorship-program": Users,
  reports: BarChart3,
  announcements: Megaphone,

  // Mentor
  "mentor-home": Home,
  "my-mentees": Users,
  sessions: Calendar,
  messages: MessageCircle,
  "career-insights": Briefcase,
  webinars: Video,
  "impact-tracker": BarChart3,

  // Donor / CSR
  "partner-home": Home,
  "my-scholarships": CircleDollarSign,
  "funded-students": GraduationCap,
  donations: HandCoins,
  "impact-reports": PieChart,
  recognition: Award,
  communications: MessageCircle,

  // Employer
  "employer-home": Home,
  "job-listings": ClipboardList,
  applicants: Users,
  "talent-pool": Sparkles,
  interviews: CalendarClock,
  "campus-connect": Building2,
  analytics: BarChart3,

  // NGO / Funding org
  "organization-home": Building2,
  programs: Target,
  funding: CircleDollarSign,
  beneficiaries: Users,
  partnerships: Handshake,

  // Parent / guardian
  "parent-home": Home,
  "my-student": GraduationCap,
  "financial-overview": WalletCards,
  "important-dates": CalendarDays,
  resources: BookOpen,
  alerts: Bell
};

export function getSectionIcon(sectionId: string): LucideIcon {
  return SECTION_ICONS[sectionId] ?? FileStack;
}

import { UserRole } from "@/types";

export type DashboardRole =
  | "student"
  | "admin"
  | "mentor"
  | "donor"
  | "employer"
  | "ngo"
  | "parent";

export type DashboardSection = {
  id: string;
  menuLabel: string;
  icon: string;
  title: string;
  items: string[];
};

export type DashboardRoleConfig = {
  label: string;
  workspaceLabel: string;
  description: string;
  sections: DashboardSection[];
};

export const DASHBOARD_ROLE_ORDER: DashboardRole[] = [
  "student",
  "admin",
  "mentor",
  "donor",
  "employer",
  "ngo",
  "parent"
];

export const DASHBOARD_ROLE_CONFIG: Record<DashboardRole, DashboardRoleConfig> = {
  student: {
    label: "Student",
    workspaceLabel: "Student Dashboard",
    description: "Track support, growth, and campus life from one place.",
    sections: [
      {
        id: "home",
        menuLabel: "Home",
        icon: "🏠",
        title: "Student Home",
        items: [
          "Welcome message",
          "Personalized recommendations",
          "Recent activity"
        ]
      },
      {
        id: "financial-aid",
        menuLabel: "Financial Aid",
        icon: "💰",
        title: "Financial Aid",
        items: [
          "Active scholarship matches",
          "Emergency aid status",
          "Equipment requests",
          "Meal voucher balance"
        ]
      },
      {
        id: "career",
        menuLabel: "Career",
        icon: "💼",
        title: "Career",
        items: [
          "Recommended jobs/internships",
          "Application tracker",
          "Resume builder status",
          "Upcoming deadlines"
        ]
      },
      {
        id: "mentorship",
        menuLabel: "Mentorship",
        icon: "👥",
        title: "Mentorship",
        items: [
          "My mentors",
          "Pending session requests",
          "Recommended mentors",
          "Past session history"
        ]
      },
      {
        id: "wellness",
        menuLabel: "Wellness",
        icon: "❤️",
        title: "Wellness",
        items: [
          "Mood tracker (today's log)",
          "Counselor booking",
          "Wellness challenge progress",
          "Peer support groups"
        ]
      },
      {
        id: "campus-life",
        menuLabel: "Campus Life",
        icon: "📅",
        title: "Campus Life",
        items: [
          "Upcoming events",
          "My clubs/societies",
          "Campus announcements"
        ]
      },
      {
        id: "my-applications",
        menuLabel: "My Applications",
        icon: "📚",
        title: "My Applications",
        items: [
          "Scholarship applications",
          "Job applications",
          "Aid requests (status tracker)"
        ]
      },
      {
        id: "profile",
        menuLabel: "Profile",
        icon: "👤",
        title: "Profile",
        items: [
          "Personal details",
          "Academic info",
          "Document storage",
          "Settings"
        ]
      }
    ]
  },
  admin: {
    label: "University Admin / Faculty",
    workspaceLabel: "Admin & Faculty Dashboard",
    description: "Oversee support operations, approvals, and institutional impact.",
    sections: [
      {
        id: "overview",
        menuLabel: "Overview",
        icon: "🏠",
        title: "Overview",
        items: [
          "Student stats (total, active)",
          "Pending verifications badge",
          "Recent activity feed"
        ]
      },
      {
        id: "verifications",
        menuLabel: "Verifications",
        icon: "✅",
        title: "Verifications",
        items: [
          "Student enrollment verifications",
          "Financial aid applications",
          "Scholarship eligibility checks",
          "Document validation queue"
        ]
      },
      {
        id: "financial-oversight",
        menuLabel: "Financial Oversight",
        icon: "💰",
        title: "Financial Oversight",
        items: [
          "Emergency fund requests",
          "Fee waiver applications",
          "Equipment requests from students",
          "Disbursement tracking"
        ]
      },
      {
        id: "career-services",
        menuLabel: "Career Services",
        icon: "💼",
        title: "Career Services",
        items: [
          "Job postings from employers",
          "Internship opportunities",
          "Placement statistics"
        ]
      },
      {
        id: "mentorship-program",
        menuLabel: "Mentorship Program",
        icon: "👥",
        title: "Mentorship Program",
        items: [
          "Mentor approval queue",
          "Active mentorship pairs",
          "Session reports"
        ]
      },
      {
        id: "reports",
        menuLabel: "Reports",
        icon: "📊",
        title: "Reports",
        items: [
          "Student support metrics",
          "Financial aid distribution",
          "Mental health trends (anonymized)",
          "Export data"
        ]
      },
      {
        id: "announcements",
        menuLabel: "Announcements",
        icon: "📢",
        title: "Announcements",
        items: [
          "Post campus-wide notices",
          "Event promotions",
          "Emergency alerts"
        ]
      },
      {
        id: "profile",
        menuLabel: "Profile",
        icon: "👤",
        title: "Profile",
        items: [
          "Admin settings",
          "Department management"
        ]
      }
    ]
  },
  mentor: {
    label: "Alumni / Industry Mentor",
    workspaceLabel: "Mentor Dashboard",
    description: "Support mentees, host sessions, and share career opportunities.",
    sections: [
      {
        id: "mentor-home",
        menuLabel: "Mentor Home",
        icon: "🏠",
        title: "Mentor Home",
        items: [
          "Welcome back",
          "Mentorship stats",
          "Recent mentee activity"
        ]
      },
      {
        id: "my-mentees",
        menuLabel: "My Mentees",
        icon: "👥",
        title: "My Mentees",
        items: [
          "Current mentees list",
          "Pending requests",
          "Past mentees",
          "Quick message"
        ]
      },
      {
        id: "sessions",
        menuLabel: "Sessions",
        icon: "📅",
        title: "Sessions",
        items: [
          "Upcoming sessions",
          "Session scheduler",
          "Session history",
          "Feedback received"
        ]
      },
      {
        id: "messages",
        menuLabel: "Messages",
        icon: "💬",
        title: "Messages",
        items: [
          "Chat with mentees",
          "Group discussions",
          "Announcements"
        ]
      },
      {
        id: "career-insights",
        menuLabel: "Career Insights",
        icon: "💼",
        title: "Career Insights",
        items: [
          "Share industry trends",
          "Post job openings",
          "Company referrals"
        ]
      },
      {
        id: "webinars",
        menuLabel: "Webinars",
        icon: "🎤",
        title: "Webinars",
        items: [
          "Host career talks",
          "Upcoming sessions",
          "Recorded content"
        ]
      },
      {
        id: "impact-tracker",
        menuLabel: "Impact Tracker",
        icon: "📈",
        title: "Impact Tracker",
        items: [
          "Hours mentored",
          "Students helped",
          "Success stories"
        ]
      },
      {
        id: "profile",
        menuLabel: "Profile",
        icon: "👤",
        title: "Profile",
        items: [
          "Expertise areas",
          "Availability settings",
          "LinkedIn integration"
        ]
      }
    ]
  },
  donor: {
    label: "Donor / CSR Partner",
    workspaceLabel: "Donor & CSR Dashboard",
    description: "Track scholarships, donations, and measurable student impact.",
    sections: [
      {
        id: "partner-home",
        menuLabel: "Partner Home",
        icon: "🏠",
        title: "Partner Home",
        items: [
          "Impact summary",
          "Recent donations",
          "Student thank you messages"
        ]
      },
      {
        id: "my-scholarships",
        menuLabel: "My Scholarships",
        icon: "💰",
        title: "My Scholarships",
        items: [
          "Active scholarship listings",
          "Application review queue",
          "Selected recipients",
          "Disbursement tracking"
        ]
      },
      {
        id: "funded-students",
        menuLabel: "Funded Students",
        icon: "🎓",
        title: "Funded Students",
        items: [
          "Current scholars",
          "Academic progress",
          "Success stories"
        ]
      },
      {
        id: "donations",
        menuLabel: "Donations",
        icon: "🤝",
        title: "Donations",
        items: [
          "Emergency fund contributions",
          "Equipment donations",
          "Donation history",
          "Tax receipts"
        ]
      },
      {
        id: "impact-reports",
        menuLabel: "Impact Reports",
        icon: "📊",
        title: "Impact Reports",
        items: [
          "Scholarship impact metrics",
          "Student demographics",
          "ROI visualization",
          "Annual report generator"
        ]
      },
      {
        id: "recognition",
        menuLabel: "Recognition",
        icon: "🏆",
        title: "Recognition",
        items: [
          "Featured stories",
          "Student testimonials",
          "CSR branding opportunities"
        ]
      },
      {
        id: "communications",
        menuLabel: "Communications",
        icon: "💬",
        title: "Communications",
        items: [
          "Message recipients",
          "Interview requests",
          "Event invitations"
        ]
      },
      {
        id: "profile",
        menuLabel: "Profile",
        icon: "👤",
        title: "Profile",
        items: [
          "Organization details",
          "Branding settings",
          "Team management"
        ]
      }
    ]
  },
  employer: {
    label: "Employer (Job Provider)",
    workspaceLabel: "Employer Dashboard",
    description: "Post opportunities, manage applicants, and connect with campuses.",
    sections: [
      {
        id: "employer-home",
        menuLabel: "Employer Home",
        icon: "🏠",
        title: "Employer Home",
        items: [
          "Job post stats",
          "Recent applicants",
          "Recommended talent"
        ]
      },
      {
        id: "job-listings",
        menuLabel: "Job Listings",
        icon: "📋",
        title: "Job Listings",
        items: [
          "Active jobs",
          "Drafts",
          "Expired listings",
          "Create new posting"
        ]
      },
      {
        id: "applicants",
        menuLabel: "Applicants",
        icon: "👥",
        title: "Applicants",
        items: [
          "New applications",
          "Shortlisted candidates",
          "Interview schedule",
          "Hired students"
        ]
      },
      {
        id: "talent-pool",
        menuLabel: "Talent Pool",
        icon: "⭐",
        title: "Talent Pool",
        items: [
          "Student profiles by skill",
          "Recommended matches",
          "Save for later"
        ]
      },
      {
        id: "interviews",
        menuLabel: "Interviews",
        icon: "📅",
        title: "Interviews",
        items: [
          "Scheduled interviews",
          "Calendar integration",
          "Feedback forms"
        ]
      },
      {
        id: "campus-connect",
        menuLabel: "Campus Connect",
        icon: "🏫",
        title: "Campus Connect",
        items: [
          "Upcoming career fairs",
          "Campus recruitment events",
          "Partner universities"
        ]
      },
      {
        id: "analytics",
        menuLabel: "Analytics",
        icon: "📊",
        title: "Analytics",
        items: [
          "Application trends",
          "Time-to-hire metrics",
          "Diversity stats"
        ]
      },
      {
        id: "profile",
        menuLabel: "Profile",
        icon: "👤",
        title: "Profile",
        items: [
          "Company profile",
          "Branding",
          "Team access management"
        ]
      }
    ]
  },
  ngo: {
    label: "NGO / Funding Organization",
    workspaceLabel: "NGO Dashboard",
    description: "Manage programs, disbursements, and beneficiary outcomes.",
    sections: [
      {
        id: "organization-home",
        menuLabel: "Organization Home",
        icon: "🏠",
        title: "Organization Home",
        items: [
          "Active programs",
          "Beneficiary stats",
          "Funding overview"
        ]
      },
      {
        id: "programs",
        menuLabel: "Programs",
        icon: "🎯",
        title: "Programs",
        items: [
          "Current initiatives",
          "Application forms",
          "Beneficiary management"
        ]
      },
      {
        id: "funding",
        menuLabel: "Funding",
        icon: "💰",
        title: "Funding",
        items: [
          "Grant allocations",
          "Emergency relief funds",
          "Disbursement tracking"
        ]
      },
      {
        id: "beneficiaries",
        menuLabel: "Beneficiaries",
        icon: "👥",
        title: "Beneficiaries",
        items: [
          "Student profiles",
          "Application reviews",
          "Impact stories"
        ]
      },
      {
        id: "reports",
        menuLabel: "Reports",
        icon: "📊",
        title: "Reports",
        items: [
          "Program impact metrics",
          "Financial reports",
          "Donor reporting"
        ]
      },
      {
        id: "partnerships",
        menuLabel: "Partnerships",
        icon: "🤝",
        title: "Partnerships",
        items: [
          "University collaborations",
          "Corporate partners",
          "Joint initiatives"
        ]
      },
      {
        id: "communications",
        menuLabel: "Communications",
        icon: "📢",
        title: "Communications",
        items: [
          "Newsletter to students",
          "Awareness campaigns",
          "Event promotions"
        ]
      },
      {
        id: "profile",
        menuLabel: "Profile",
        icon: "👤",
        title: "Profile",
        items: [
          "Organization details",
          "Focus areas",
          "Team management"
        ]
      }
    ]
  },
  parent: {
    label: "Parent / Guardian",
    workspaceLabel: "Parent Dashboard",
    description: "Stay informed about your child's progress and important updates.",
    sections: [
      {
        id: "parent-home",
        menuLabel: "Parent Home",
        icon: "🏠",
        title: "Parent Home",
        items: [
          "Child's activity summary",
          "Recent updates",
          "Important alerts"
        ]
      },
      {
        id: "my-student",
        menuLabel: "My Student",
        icon: "👨‍🎓",
        title: "My Student",
        items: [
          "Profile view",
          "Academic progress",
          "Financial aid status"
        ]
      },
      {
        id: "financial-overview",
        menuLabel: "Financial Overview",
        icon: "💰",
        title: "Financial Overview",
        items: [
          "Scholarship applications",
          "Aid received",
          "Pending documents"
        ]
      },
      {
        id: "important-dates",
        menuLabel: "Important Dates",
        icon: "📅",
        title: "Important Dates",
        items: [
          "Application deadlines",
          "Parent meetings",
          "University events"
        ]
      },
      {
        id: "communications",
        menuLabel: "Communications",
        icon: "💬",
        title: "Communications",
        items: [
          "Messages from university",
          "Counselor updates",
          "Mentor feedback"
        ]
      },
      {
        id: "resources",
        menuLabel: "Resources",
        icon: "📚",
        title: "Resources",
        items: [
          "Financial planning guides",
          "Scholarship tips",
          "Parent community"
        ]
      },
      {
        id: "alerts",
        menuLabel: "Alerts",
        icon: "⚠️",
        title: "Alerts",
        items: [
          "Missing documents",
          "Urgent notifications"
        ]
      },
      {
        id: "profile",
        menuLabel: "Profile",
        icon: "👤",
        title: "Profile",
        items: [
          "Contact details",
          "Linked students",
          "Notification preferences"
        ]
      }
    ]
  }
};

const AUTH_ROLE_TO_DASHBOARD_ROLE: Record<UserRole, DashboardRole> = {
  student: "student",
  mentor: "mentor",
  donor: "donor",
  admin: "admin",
  super_admin: "admin",
  employer: "employer",
  ngo: "ngo",
  parent: "parent"
};

export function resolveDashboardRole(role?: UserRole | null): DashboardRole {
  if (!role) {
    return "student";
  }
  return AUTH_ROLE_TO_DASHBOARD_ROLE[role] ?? "student";
}

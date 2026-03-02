import { HealthLog, JobListing, MentorshipSession, Scholarship, UserProfile } from "@/types";

export const demoUsers: UserProfile[] = [
  {
    _id: "u1",
    email: "student@unicare.lk",
    name: "Sajini Perera",
    role: "student",
    university: "University of Colombo",
    contact: "+94 77 123 4567",
    financialNeedLevel: "high",
    healthPreferences: ["mindfulness", "nutrition"],
    careerInterests: ["web development", "data analytics"]
  },
  {
    _id: "u2",
    email: "mentor@unicare.lk",
    name: "Ravindu Fernando",
    role: "mentor",
    university: "University of Moratuwa",
    contact: "+94 71 987 6543",
    careerInterests: ["product management", "cloud"]
  },
  {
    _id: "u3",
    email: "admin@unicare.lk",
    name: "University Admin",
    role: "admin",
    university: "University of Peradeniya",
    contact: "+94 11 223 4455"
  }
];

export const demoScholarships: Scholarship[] = [
  {
    _id: "s1",
    title: "Mahapola Scholarship Support",
    provider: "Ministry of Higher Education",
    amount: "LKR 15,000/month",
    deadline: "2026-03-15",
    eligibilityCriteria: "Low-income undergraduates with GPA > 3.0",
    applicationLink: "https://example.com/mahapola",
    tags: ["need-based", "undergraduate"],
    status: "active"
  },
  {
    _id: "s2",
    title: "Women in Tech Grant",
    provider: "SL Tech Alliance",
    amount: "LKR 200,000",
    deadline: "2026-04-10",
    eligibilityCriteria: "Female students in ICT programs",
    applicationLink: "https://example.com/women-tech",
    tags: ["ict", "leadership"],
    status: "active"
  }
];

export const demoJobs: JobListing[] = [
  {
    _id: "j1",
    title: "Part-time Lab Assistant",
    company: "Faculty of Science",
    location: "Colombo",
    salary: "LKR 1,200/hour",
    type: "part-time",
    requirements: ["Basic lab safety", "Weekend availability"],
    applicationDeadline: "2026-03-05",
    contactEmail: "labs@university.lk"
  },
  {
    _id: "j2",
    title: "Frontend Intern",
    company: "TechNova",
    location: "Remote",
    salary: "LKR 40,000/month",
    type: "internship",
    requirements: ["React basics", "Portfolio link"],
    applicationDeadline: "2026-02-28",
    contactEmail: "careers@technova.lk"
  }
];

export const demoHealthLogs: HealthLog[] = [
  {
    _id: "h1",
    userId: "u1",
    mood: "okay",
    stressLevel: 6,
    sleepHours: 6,
    notes: "Midterm week stress",
    date: "2026-02-05",
    recommendations: ["Try the 10-min breathing exercise", "Book a counseling slot"]
  }
];

export const demoMentorshipSessions: MentorshipSession[] = [
  {
    _id: "m1",
    mentorId: "u2",
    studentId: "u1",
    mentorName: "Ravindu Fernando",
    studentName: "Sajini Perera",
    topic: "Career planning",
    scheduledTime: "2026-02-12T10:00:00+05:30",
    status: "scheduled",
    feedback: "Focus on portfolio building"
  },
  {
    _id: "m2",
    mentorId: "u2",
    studentId: "u1",
    mentorName: "Ravindu Fernando",
    studentName: "Sajini Perera",
    topic: "Product management intro",
    scheduledTime: "",
    status: "pending"
  },
  {
    _id: "m3",
    mentorId: "u2",
    studentId: "u1",
    mentorName: "Ravindu Fernando",
    studentName: "Sajini Perera",
    topic: "Resume review",
    scheduledTime: "2026-01-15T14:00:00+05:30",
    status: "completed"
  }
];

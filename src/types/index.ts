export type UserRole = "student" | "mentor" | "donor" | "admin" | "super_admin";

export type UserProfile = {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  university?: string;
  contact?: string;
  profilePic?: string;
  financialNeedLevel?: "low" | "medium" | "high";
  healthPreferences?: string[];
  careerInterests?: string[];
};

export type Scholarship = {
  _id: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  eligibilityCriteria: string;
  applicationLink: string;
  tags: string[];
  status: "active" | "expired";
};

export type JobListing = {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: "part-time" | "full-time" | "internship";
  requirements: string[];
  applicationDeadline: string;
  contactEmail: string;
};

export type HealthLog = {
  _id: string;
  userId: string;
  mood: "great" | "good" | "okay" | "low" | "anxious";
  stressLevel: number;
  sleepHours: number;
  notes?: string;
  date: string;
  recommendations: string[];
};

export type MentorshipSession = {
  _id: string;
  mentorId: string;
  studentId: string;
  topic: string;
  scheduledTime: string;
  status: "pending" | "confirmed" | "completed";
  feedback?: string;
};

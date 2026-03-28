"use client";

import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/shared/card";
import { AdminAnalytics } from "@/components/admin/admin-analytics";
import { useLanguage, type Language } from "@/context/language-context";

type AdminText = {
  eyebrow: string;
  title: string;
  subtitle: string;
  activeStudents: string;
  pendingVerifications: string;
  openAidRequests: string;
  openTickets: string;
  allCampuses: string;
  pendingDesc: string;
  awaitingDecision: string;
  systemAlerts: string;
  recentActivity: string;
  forumPost: string;
  aidRequest: string;
  pendingReview: string;
  verificationNeeded: string;
  owner: string;
  upcomingDeadlines: string;
  emergencyFundReview: string;
  scholarshipWindow: string;
  placementReport: string;
  systemHealth: string;
  dbConnection: string;
  authService: string;
  backgroundJobs: string;
  demoFallback: string;
  connected: string;
  sampleData: string;
};

const ADMIN_TEXT: Record<Language, AdminText> = {
  en: {
    eyebrow: "Admin panel",
    title: "Analytics & system oversight",
    subtitle: "Monitor engagement, verify records, and keep the system healthy.",
    activeStudents: "Active students",
    pendingVerifications: "Pending verifications",
    openAidRequests: "Open aid requests",
    openTickets: "Open tickets",
    allCampuses: "All campuses",
    pendingDesc: "Enrollment, aid, NGOs",
    awaitingDecision: "Awaiting decision",
    systemAlerts: "System & support alerts",
    recentActivity: "Recent activity",
    forumPost: "Forum post",
    aidRequest: "Aid request",
    pendingReview: "Pending review",
    verificationNeeded: "Verification needed",
    owner: "Owner",
    upcomingDeadlines: "Upcoming deadlines",
    emergencyFundReview: "Emergency fund review",
    scholarshipWindow: "Scholarship disbursement window",
    placementReport: "Placement report submission",
    systemHealth: "System health",
    dbConnection: "Database connection",
    authService: "Auth service",
    backgroundJobs: "Background jobs",
    demoFallback: "Demo / fallback mode",
    connected: "Connected",
    sampleData: "Sample data (no jobs configured)"
  },
  si: {
    eyebrow: "පරිපාලක පැනලය",
    title: "විශ්ලේෂණ සහ පද්ධති අධීක්ෂණය",
    subtitle: "සම්බන්ධතාව නිරීක්ෂණය කර, වාර්තා තහවුරු කර, පද්ධතිය ස්ථාවරව තබාගන්න.",
    activeStudents: "ක්‍රියාකාරී ශිෂ්‍යයන්",
    pendingVerifications: "පොරොත්තුවේ තහවුරු කිරීම්",
    openAidRequests: "විවෘත ආධාර ඉල්ලීම්",
    openTickets: "විවෘත ටිකට්",
    allCampuses: "සියලු කැම්පස්",
    pendingDesc: "ලියාපදිංචි, ආධාර, NGO",
    awaitingDecision: "තීරණය සඳහා බලාපොරොත්තුවේ",
    systemAlerts: "පද්ධති හා සහය දැනුම්දීම්",
    recentActivity: "මෑත ක්‍රියාකාරකම්",
    forumPost: "සංවාද පුවරු සටහන",
    aidRequest: "ආධාර ඉල්ලීම",
    pendingReview: "සමාලෝචනය බලාපොරොත්තුවේ",
    verificationNeeded: "තහවුරු කිරීම අවශ්‍යයි",
    owner: "වගකිවයුතු",
    upcomingDeadlines: "ඉදිරි අවසන් දින",
    emergencyFundReview: "හදිසි අරමුදල් සමාලෝචනය",
    scholarshipWindow: "ශිෂ්‍යත්ව ගෙවීම් කාලය",
    placementReport: "ස්ථානගත කිරීමේ වාර්තා ඉදිරිපත් කිරීම",
    systemHealth: "පද්ධති තත්ත්වය",
    dbConnection: "දත්ත සමුදා සම්බන්ධතාවය",
    authService: "සත්‍යාපන සේවාව",
    backgroundJobs: "පසුබිම් කාර්යයන්",
    demoFallback: "Demo / fallback mode",
    connected: "සම්බන්ධයි",
    sampleData: "නියැදි දත්ත (කාර්යයන් සකසා නොමැත)"
  },
  ta: {
    eyebrow: "நிர்வாக பலகம்",
    title: "பகுப்பாய்வு மற்றும் அமைப்பு கண்காணிப்பு",
    subtitle: "பயன்பாட்டை கண்காணித்து, பதிவுகளை சரிபார்த்து, அமைப்பை நலமாக வைத்திருங்கள்.",
    activeStudents: "செயலில் உள்ள மாணவர்கள்",
    pendingVerifications: "நிலுவை சரிபார்ப்புகள்",
    openAidRequests: "திறந்த நிதி உதவி கோரிக்கைகள்",
    openTickets: "திறந்த டிக்கெட்டுகள்",
    allCampuses: "அனைத்து வளாகங்களும்",
    pendingDesc: "சேர்க்கை, நிதி உதவி, NGO",
    awaitingDecision: "முடிவுக்காக காத்திருக்கிறது",
    systemAlerts: "அமைப்பு மற்றும் ஆதரவு எச்சரிக்கைகள்",
    recentActivity: "சமீபத்திய செயல்பாடு",
    forumPost: "விவாத பதிவுகள்",
    aidRequest: "நிதி உதவி கோரிக்கை",
    pendingReview: "மதிப்பாய்வு நிலுவையில்",
    verificationNeeded: "சரிபார்ப்பு தேவை",
    owner: "பொறுப்பு",
    upcomingDeadlines: "வரவிருக்கும் கடைசி தேதிகள்",
    emergencyFundReview: "அவசர நிதி மதிப்பாய்வு",
    scholarshipWindow: "கல்வியுதவி வழங்கும் காலம்",
    placementReport: "பணியமர்த்தல் அறிக்கை சமர்ப்பிப்பு",
    systemHealth: "அமைப்பு நிலை",
    dbConnection: "தரவுத்தள இணைப்பு",
    authService: "அங்கீகார சேவை",
    backgroundJobs: "பின்னணி பணிகள்",
    demoFallback: "Demo / fallback mode",
    connected: "இணைக்கப்பட்டுள்ளது",
    sampleData: "மாதிரி தரவு (பணிகள் அமைக்கப்படவில்லை)"
  }
};

export default function AdminPage() {
  const { language } = useLanguage();
  const t = ADMIN_TEXT[language];

  const moderationQueue = [
    { id: "q1", type: t.forumPost, status: t.pendingReview, owner: "Sajini P." },
    { id: "q2", type: t.aidRequest, status: t.verificationNeeded, owner: "Kasun M." }
  ];

  const upcomingDeadlines = [
    { id: "d1", label: t.emergencyFundReview, date: "2026-02-28" },
    { id: "d2", label: t.scholarshipWindow, date: "2026-03-05" },
    { id: "d3", label: t.placementReport, date: "2026-03-10" }
  ];

  const isDemo =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.MONGODB_URI;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label={t.activeStudents} value="2,480" description={t.allCampuses} />
        <StatCard label={t.pendingVerifications} value="32" description={t.pendingDesc} />
        <StatCard label={t.openAidRequests} value="120" description={t.awaitingDecision} />
        <StatCard label={t.openTickets} value="8" description={t.systemAlerts} />
      </div>

      <AdminAnalytics />

      <Card className="space-y-3">
        <h3 className="text-lg font-semibold">{t.recentActivity}</h3>
        <div className="space-y-3 text-sm">
          {moderationQueue.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="font-semibold">{item.type}</p>
              <p className="text-slate-500">{item.status}</p>
              <p className="text-xs text-slate-400">{t.owner}: {item.owner}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold">{t.upcomingDeadlines}</h3>
          <ul className="space-y-2 text-sm">
            {upcomingDeadlines.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
              >
                <span>{d.label}</span>
                <span className="text-xs text-slate-500">{d.date}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold">{t.systemHealth}</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>{t.dbConnection}</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                {isDemo ? t.demoFallback : t.connected}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>{t.authService}</span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                OK
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>{t.backgroundJobs}</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t.sampleData}
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

import type { Language } from "@/context/language-context";

type TopNavTranslations = {
  overview: string;
  universities: string;
  studentSupport: string;
  financialAid: string;
  career: string;
  mentorship: string;
  wellness: string;
  stories: string;
  dashboard: string;
  signOut: string;
  signIn: string;
};

type HomeHeroTranslations = {
  title: string;
  description: string;
  dashboardCta: string;
  aidCta: string;
};

type CoreJourneySlideTranslation = {
  step: string;
  module: string;
  thought: string;
  resolved: string;
};

type CoreJourneyTranslations = {
  heading: string;
  description: string;
  currentModule: string;
  stepDone: string;
  finalTitle: string;
  finalSummary: string;
  resolvedBy: string;
  previousThought: string;
  nextThought: string;
  goToStep: string;
  slides: CoreJourneySlideTranslation[];
};

type StoryCardTranslation = {
  name: string;
  role: string;
  quote: string;
};

type StoriesTranslations = {
  heading: string;
  description: string;
  cards: StoryCardTranslation[];
};

type SupportPanelsTranslations = {
  heading: string;
  description: string;
  studentOverviewAria: string;
  snapshotTitle: string;
  snapshotSubtitle: string;
  financialPending: string;
  careerMatches: string;
  wellnessCheckins: string;
  resizeHorizontalAria: string;
  supportOperationsAria: string;
  priorityQueueTitle: string;
  priority1: string;
  priority2: string;
  priority3: string;
  resizeVerticalAria: string;
  actionPlannerTitle: string;
  action1: string;
  action2: string;
  action3: string;
  mobileStudentTitle: string;
  mobileStudentBody: string;
  mobilePriorityTitle: string;
  mobilePriorityBody: string;
  mobileActionTitle: string;
  mobileActionBody: string;
};

type FaqItemTranslation = {
  question: string;
  answer: string;
};

type FaqTranslations = {
  previousQuestion: string;
  nextQuestion: string;
  goToQuestion: string;
  items: FaqItemTranslation[];
};

type FooterTranslations = {
  tagline: string;
  description: string;
  navigation: string;
  studentSupport: string;
  socials: string;
  copyright: string;
};

type UiTranslations = {
  topNav: TopNavTranslations;
  homeHero: HomeHeroTranslations;
  coreJourney: CoreJourneyTranslations;
  stories: StoriesTranslations;
  supportPanels: SupportPanelsTranslations;
  faq: FaqTranslations;
  footer: FooterTranslations;
};

const uiTranslations: Record<Language, UiTranslations> = {
  en: {
    topNav: {
      overview: "Overview",
      universities: "Universities",
      studentSupport: "Student Support",
      financialAid: "Financial Aid",
      career: "Career",
      mentorship: "Mentorship",
      wellness: "Wellness",
      stories: "Stories",
      dashboard: "Dashboard",
      signOut: "Sign out",
      signIn: "Sign in"
    },
    homeHero: {
      title: "UniCare Connect powers student success in Sri Lanka.",
      description:
        "Bring financial aid, career growth, wellness services, and mentorship together in one secure platform aligned with university needs.",
      dashboardCta: "Go to dashboard",
      aidCta: "Apply for aid"
    },
    coreJourney: {
      heading: "Everything students need in one place",
      description: "Follow one student story module-by-module. Use arrows to move through each thought and resolution.",
      currentModule: "Current Module",
      stepDone: "Step Done",
      finalTitle: "unicare always with you",
      finalSummary: "From first worry to final outcome, every support module is now resolved.",
      resolvedBy: "Resolved by UniCare",
      previousThought: "Previous thought",
      nextThought: "Next thought",
      goToStep: "Go to step",
      slides: [
        {
          step: "01",
          module: "Financial Support",
          thought: "I am worried about tuition fees and emergency costs this semester.",
          resolved: "UniCare matched grants and fee-relief options, and my request got approved."
        },
        {
          step: "02",
          module: "Career & Scholarships",
          thought: "I am not sure which internships and scholarships fit my profile.",
          resolved: "UniCare suggested role-based opportunities and scholarship matches in one dashboard."
        },
        {
          step: "03",
          module: "Mentorship & Campus",
          thought: "I feel disconnected and I do not know who can guide me.",
          resolved: "UniCare connected me with mentors and relevant campus communities."
        },
        {
          step: "04",
          module: "Health & Wellness",
          thought: "Stress is affecting my focus and I need support quickly.",
          resolved: "UniCare routed me to wellness resources and counselor booking without delay."
        },
        {
          step: "Done",
          module: "Journey Complete",
          thought: "All my key challenges are now structured and manageable.",
          resolved: "UNICARE always with you."
        }
      ]
    },
    stories: {
      heading: "Real stories from Sri Lankan campuses",
      description: "Scroll to bring each story forward.",
      cards: [
        {
          name: "Ishara P.",
          role: "Engineering student",
          quote: "UniCare helped me secure a laptop within a week and connected me to a part-time lab role."
        },
        {
          name: "Prof. D. Jayasekara",
          role: "Faculty mentor",
          quote: "The admin analytics dashboard gives our faculty instant visibility on student needs."
        },
        {
          name: "Alumni Mentor",
          role: "Campus volunteer",
          quote: "Mentorship scheduling is seamless, and students arrive prepared every time."
        },
        {
          name: "Dinithi K.",
          role: "First-year student",
          quote: "Emergency bursary support arrived on time and helped me continue my semester."
        }
      ]
    },
    supportPanels: {
      heading: "Resize panels to prioritize support operations",
      description: "Drag separators, or focus a handle and use arrow keys, Home, and End.",
      studentOverviewAria: "Student overview",
      snapshotTitle: "Student Snapshot",
      snapshotSubtitle: "Semester health at a glance",
      financialPending: "Financial requests pending review",
      careerMatches: "Career matches generated this week",
      wellnessCheckins: "Wellness check-ins completed",
      resizeHorizontalAria: "Resize left and right panels",
      supportOperationsAria: "Support operations",
      priorityQueueTitle: "Priority Queue",
      priority1: "Emergency tuition case requires same-day approval.",
      priority2: "6 students waiting for internship placement confirmation.",
      priority3: "Mentor reassignment needed for 2 high-risk students.",
      resizeVerticalAria: "Resize top and bottom panels",
      actionPlannerTitle: "Action Planner",
      action1: "Approve aid batch before 3:00 PM.",
      action2: "Finalize mentor pairing for week 4.",
      action3: "Export weekly wellbeing summary for faculty.",
      mobileStudentTitle: "Student Snapshot",
      mobileStudentBody: "Desktop view has keyboard-resizable panels.",
      mobilePriorityTitle: "Priority Queue",
      mobilePriorityBody: "Emergency tuition case requires same-day approval.",
      mobileActionTitle: "Action Planner",
      mobileActionBody: "Approve aid batch and finalize mentor pairing."
    },
    faq: {
      previousQuestion: "Previous question",
      nextQuestion: "Next question",
      goToQuestion: "Go to question",
      items: [
        {
          question: "Who can use UniCare Connect?",
          answer:
            "University students, mentors, and support staff can use UniCare to manage aid, career pathways, wellbeing, and mentoring in one platform."
        },
        {
          question: "How fast can a student request be reviewed?",
          answer:
            "Urgent cases are prioritized by the support queue, and teams can review and act on requests through the action planner dashboard."
        },
        {
          question: "Does UniCare support both public and private universities?",
          answer:
            "Yes. UniCare is designed for collaboration across Sri Lankan public and private institutions with configurable workflows."
        },
        {
          question: "Can students track outcomes after submitting requests?",
          answer:
            "Yes. Students can follow progress, view updates, and see final outcomes for financial, mentorship, career, and wellness requests."
        },
        {
          question: "Can I apply for financial aid directly from the platform?",
          answer:
            "Yes. Students can submit aid requests, upload required details, and track every status update in real time."
        },
        {
          question: "How does the mentorship matching process work?",
          answer:
            "UniCare maps student goals with available mentors and suggests the best-fit options based on profile and support needs."
        }
      ]
    },
    footer: {
      tagline: "One platform for student success.",
      description:
        "A connected ecosystem for financial aid, career pathways, mentorship, and wellness support across Sri Lankan universities.",
      navigation: "Navigation",
      studentSupport: "Student support",
      socials: "Socials",
      copyright: "© 2026 UniCare Connect. Built for IT3040 IT Project Management."
    }
  },
  si: {
    topNav: {
      overview: "දළ විශ්ලේෂණය",
      universities: "විශ්වවිද්‍යාල",
      studentSupport: "ශිෂ්‍ය සහාය",
      financialAid: "මූල්‍ය ආධාර",
      career: "වෘත්තීය",
      mentorship: "මාර්ගෝපදේශනය",
      wellness: "සුවතා",
      stories: "කතා",
      dashboard: "පුවරුව",
      signOut: "ඉවත් වන්න",
      signIn: "ඇතුල් වන්න"
    },
    homeHero: {
      title: "UniCare Connect ශ්‍රී ලංකාවේ ශිෂ්‍ය සාර්ථකත්වය බලගන්වයි.",
      description:
        "විශ්වවිද්‍යාල අවශ්‍යතා සමඟ ගැලපෙන ආරක්ෂිත වේදිකාවක මූල්‍ය ආධාර, වෘත්තීය වර්ධනය, සුවතා සේවා සහ මාර්ගෝපදේශනය එකට ගෙන එන්න.",
      dashboardCta: "පුවරුවට යන්න",
      aidCta: "ආධාර සඳහා අයදුම් කරන්න"
    },
    coreJourney: {
      heading: "ශිෂ්‍යයන්ට අවශ්‍ය දේ සියල්ල එක් තැනක",
      description: "එක් ශිෂ්‍ය කතාවක් මොඩියුලය අනුව අනුගමනය කරන්න. එක් එක් අදහස හා විසඳුම බලන්න ඊතල භාවිතා කරන්න.",
      currentModule: "වත්මන් මොඩියුලය",
      stepDone: "පියවර සම්පූර්ණයි",
      finalTitle: "unicare සැමවිටම ඔබ සමඟ",
      finalSummary: "පළමු ගැටලුවේ සිට අවසාන ප්‍රතිඵලය දක්වා, සියලුම සහාය මොඩියුල විසඳී ඇත.",
      resolvedBy: "UniCare විසින් විසඳන ලදී",
      previousThought: "පෙර අදහස",
      nextThought: "ඊළඟ අදහස",
      goToStep: "පියවරට යන්න",
      slides: [
        {
          step: "01",
          module: "මූල්‍ය සහාය",
          thought: "මෙම සෙමෙස්ටරයේ පාඨමාලා ගාස්තු සහ හදිසි වියදම් ගැන මම කනස්සල්ලෙන් ඉන්නවා.",
          resolved: "UniCare මට ප්‍රදාන සහ ගාස්තු සහන විකල්ප ගලපලා දුන්නා, මගේ ඉල්ලීම අනුමත වුණා."
        },
        {
          step: "02",
          module: "වෘත්තීය හා ශිෂ්‍යත්ව",
          thought: "මගේ පැතිකඩට ගැළපෙන පුහුණු අවස්ථා සහ ශිෂ්‍යත්ව මොනවාද කියලා මට පැහැදිලි නැහැ.",
          resolved: "UniCare එකම පුවරුවකින් භූමිකාවට ගැළපෙන අවස්ථා සහ ශිෂ්‍යත්ව ගැලපීම් යෝජනා කළා."
        },
        {
          step: "03",
          module: "මාර්ගෝපදේශනය හා කැම්පස්",
          thought: "මට වෙන්වී ගිය බවක් දැනෙනවා, මට මඟ පෙන්වන්න කවුද කියලා නොදන්නවා.",
          resolved: "UniCare මාව මෙන්ටර්වරුන්ටත් අදාළ කැම්පස් ප්‍රජාවන්ටත් සම්බන්ධ කළා."
        },
        {
          step: "04",
          module: "සෞඛ්‍ය හා සුවතා",
          thought: "ආතතිය මගේ අවධානයට බලපානවා, ඉක්මනින් සහාය ඕනේ.",
          resolved: "UniCare ප්‍රමාදයකින් තොරව මාව සුවතා සම්පත් සහ උපදේශක බුකින් වෙත යොමු කළා."
        },
        {
          step: "Done",
          module: "ගමන සම්පූර්ණයි",
          thought: "මගේ ප්‍රධාන අභියෝග දැන් ව්‍යුහගතව සහ කළමනාකරණය කළ හැකි ලෙස තියෙනවා.",
          resolved: "UNICARE සැමවිටම ඔබ සමඟ."
        }
      ]
    },
    stories: {
      heading: "ශ්‍රී ලාංකික කැම්පස්වල සැබෑ කතා",
      description: "සෑම කතාවක්ම ඉදිරියට ගෙන එන්න ස්ක්‍රෝල් කරන්න.",
      cards: [
        {
          name: "Ishara P.",
          role: "ඉංජිනේරු ශිෂ්‍යාව",
          quote: "UniCare මට සතියක් ඇතුළත ලැප්ටොප් එකක් ලබාගන්න උදව් කළා, සහ අර්ධකාලීන ලැබ් භූමිකාවකට සම්බන්ධ කළා."
        },
        {
          name: "Prof. D. Jayasekara",
          role: "පීඨ මෙන්ටර්",
          quote: "පරිපාලන විශ්ලේෂණ පුවරුව අපේ පීඨයට ශිෂ්‍ය අවශ්‍යතා ගැන ඉක්මන් දෘශ්‍යතාවක් දෙයි."
        },
        {
          name: "Alumni Mentor",
          role: "කැම්පස් ස්වේච්ඡා දායක",
          quote: "මාර්ගෝපදේශන සැලසුම් කිරීම ඉතා පහසුයි, ශිෂ්‍යයන් සෑම වතාවකම සූදානම්ව එනවා."
        },
        {
          name: "Dinithi K.",
          role: "පළමු වසර ශිෂ්‍යාව",
          quote: "හදිසි බර්සරි සහාය වෙලාවට ලැබුණා, ඒ නිසා මට සෙමෙස්ටරය දිගටම කරගෙන යන්න පුළුවන් වුණා."
        }
      ]
    },
    supportPanels: {
      heading: "සහාය මෙහෙයුම් ප්‍රමුඛතාව අනුව පැනල් ප්‍රමාණය වෙනස් කරන්න",
      description: "වෙන්කරන රේඛා ඇදගෙන යන්න, හෝ හැන්ඩලයක් තෝරලා ඊතල යතුරු, Home, End භාවිතා කරන්න.",
      studentOverviewAria: "ශිෂ්‍ය දළ විශ්ලේෂණය",
      snapshotTitle: "ශිෂ්‍ය ස්නැප්ෂොට්",
      snapshotSubtitle: "සෙමෙස්ටර් තත්ත්වය එක බැල්මකින්",
      financialPending: "සමාලෝචනය සඳහා බලාසිටි මූල්‍ය ඉල්ලීම්",
      careerMatches: "මෙම සතියේ ජනනය කළ වෘත්තීය ගැලපීම්",
      wellnessCheckins: "සම්පූර්ණ කළ සුවතා පරීක්ෂා",
      resizeHorizontalAria: "වම සහ දකුණ පැනල් ප්‍රමාණය වෙනස් කරන්න",
      supportOperationsAria: "සහාය මෙහෙයුම්",
      priorityQueueTitle: "ප්‍රමුඛ පෝලිම",
      priority1: "හදිසි පාඨමාලා ගාස්තු කේස් එකට එදිනම අනුමැතිය අවශ්‍යයි.",
      priority2: "සිසුන් 6 දෙනෙක් පුහුණු අවස්ථා තහවුරු කිරීම බලාසිටිනවා.",
      priority3: "අධි අවදානම් ශිෂ්‍යයන් 2 දෙනෙකු සඳහා මෙන්ටර් නැවත පවරන්න අවශ්‍යයි.",
      resizeVerticalAria: "ඉහළ සහ පහළ පැනල් ප්‍රමාණය වෙනස් කරන්න",
      actionPlannerTitle: "ක්‍රියා සැලසුම්කරු",
      action1: "ප.ව. 3:00 ට පෙර ආධාර කණ්ඩායම අනුමත කරන්න.",
      action2: "4 වන සතිය සඳහා මෙන්ටර් යුගල කිරීම අවසන් කරන්න.",
      action3: "පීඨය සඳහා සතිපතා සුවතා සාරාංශය අපනයනය කරන්න.",
      mobileStudentTitle: "ශිෂ්‍ය ස්නැප්ෂොට්",
      mobileStudentBody: "ඩෙස්ක්ටොප් දර්ශනයේ යතුරුපුවරුවෙන් ප්‍රමාණය වෙනස් කළ හැකි පැනල් ඇත.",
      mobilePriorityTitle: "ප්‍රමුඛ පෝලිම",
      mobilePriorityBody: "හදිසි පාඨමාලා ගාස්තු කේස් එකට එදිනම අනුමැතිය අවශ්‍යයි.",
      mobileActionTitle: "ක්‍රියා සැලසුම්කරු",
      mobileActionBody: "ආධාර කණ්ඩායම අනුමත කර මෙන්ටර් යුගල කිරීම අවසන් කරන්න."
    },
    faq: {
      previousQuestion: "පෙර ප්‍රශ්නය",
      nextQuestion: "ඊළඟ ප්‍රශ්නය",
      goToQuestion: "ප්‍රශ්නයට යන්න",
      items: [
        {
          question: "UniCare Connect භාවිතා කළ හැක්කේ කාටද?",
          answer:
            "විශ්වවිද්‍යාල ශිෂ්‍යයන්, මෙන්ටර්වරු සහ සහාය කාර්ය මණ්ඩලයට UniCare භාවිතා කර ආධාර, වෘත්තීය මාර්ග, සුවතා සහ මාර්ගෝපදේශනය එකම වේදිකාවක කළමනාකරණය කළ හැක."
        },
        {
          question: "ශිෂ්‍ය ඉල්ලීමක් සමාලෝචනය කිරීමට කොපමණ වේගයෙන් හැකිද?",
          answer:
            "හදිසි කේස් ප්‍රමුඛ පෝලිම මගින් ඉහළට ගෙන එයි. කණ්ඩායම් වලට ක්‍රියා සැලසුම්කරු පුවරුවෙන් ඉල්ලීම් සමාලෝචනය කර ක්‍රියා කළ හැක."
        },
        {
          question: "UniCare රජයේ සහ පෞද්ගලික විශ්වවිද්‍යාල දෙකටම සහාය දෙනවාද?",
          answer:
            "ඔව්. ශ්‍රී ලංකාවේ රජයේ සහ පෞද්ගලික ආයතන අතර සහයෝගයට UniCare නිර්මාණය කර ඇති අතර ක්‍රියාවලි අභිරුචිකරණය කළ හැක."
        },
        {
          question: "ඉල්ලීම් යැවූ පසු ප්‍රතිඵල නිරීක්ෂණය කළ හැකිද?",
          answer:
            "ඔව්. ශිෂ්‍යයන්ට ප්‍රගතිය අනුගමනය කර යාවත්කාලීනීකරණ බලන්න සහ මූල්‍ය, මාර්ගෝපදේශන, වෘත්තීය, සුවතා ඉල්ලීම්වල අවසාන ප්‍රතිඵල දැකගන්න පුළුවන්."
        },
        {
          question: "මම වේදිකාවෙන්ම මූල්‍ය ආධාරයට අයදුම් කළ හැකිද?",
          answer:
            "ඔව්. ශිෂ්‍යයන්ට ආධාර ඉල්ලීම් යොමු කර අවශ්‍ය විස්තර උඩුගත කර තත්ත්ව යාවත්කාලීනීකරණ සියල්ල තත්‍ය කාලීනව නිරීක්ෂණය කළ හැක."
        },
        {
          question: "මාර්ගෝපදේශන ගැලපීම ක්‍රියාවලිය ක්‍රියාකරන්නේ කෙසේද?",
          answer:
            "UniCare ශිෂ්‍ය ඉලක්ක සහ ලබාගත හැකි මෙන්ටර්වරු ගලපලා, පැතිකඩ සහ සහාය අවශ්‍යතා මත හොඳම විකල්ප යෝජනා කරයි."
        }
      ]
    },
    footer: {
      tagline: "ශිෂ්‍ය සාර්ථකත්වය සඳහා එකම වේදිකාව.",
      description:
        "ශ්‍රී ලංකා විශ්වවිද්‍යාල හරහා මූල්‍ය ආධාර, වෘත්තීය මාර්ග, මාර්ගෝපදේශනය සහ සුවතා සහාය සඳහා සම්බන්ධ පරිසරයක්.",
      navigation: "සංචාලනය",
      studentSupport: "ශිෂ්‍ය සහාය",
      socials: "සමාජ සබැඳි",
      copyright: "© 2026 UniCare Connect. IT3040 IT Project Management සඳහා නිර්මාණය කරන ලදී."
    }
  },
  ta: {
    topNav: {
      overview: "மேலோட்டம்",
      universities: "பல்கலைக்கழகங்கள்",
      studentSupport: "மாணவர் ஆதரவு",
      financialAid: "நிதி உதவி",
      career: "தொழில்",
      mentorship: "வழிகாட்டுதல்",
      wellness: "நலன்",
      stories: "கதைகள்",
      dashboard: "டாஷ்போர்டு",
      signOut: "வெளியேறு",
      signIn: "உள்நுழை"
    },
    homeHero: {
      title: "UniCare Connect இலங்கையில் மாணவர் வெற்றியை முன்னேடுக்கிறது.",
      description:
        "பல்கலைக்கழக தேவைகளுக்கு ஏற்ப நிதி உதவி, தொழில் வளர்ச்சி, நல சேவைகள் மற்றும் வழிகாட்டுதலை ஒரு பாதுகாப்பான தளத்தில் ஒன்றிணைக்கவும்.",
      dashboardCta: "டாஷ்போர்டுக்கு செல்",
      aidCta: "உதவிக்கு விண்ணப்பிக்கவும்"
    },
    coreJourney: {
      heading: "மாணவர்களுக்கு தேவையான அனைத்தும் ஒரே இடத்தில்",
      description: "ஒரு மாணவர் கதையை தொகுதி தொகுதியாகப் பின்தொடருங்கள். ஒவ்வொரு சிந்தனையும் தீர்வையும் பார்க்க அம்புகளை பயன்படுத்துங்கள்.",
      currentModule: "தற்போதைய தொகுதி",
      stepDone: "படி முடிந்தது",
      finalTitle: "unicare எப்போதும் உங்களுடன்",
      finalSummary: "முதல் கவலையிலிருந்து இறுதி முடிவுவரை, அனைத்து ஆதரவு தொகுதிகளும் இப்போது தீர்க்கப்பட்டுள்ளன.",
      resolvedBy: "UniCare மூலம் தீர்க்கப்பட்டது",
      previousThought: "முந்தைய சிந்தனை",
      nextThought: "அடுத்த சிந்தனை",
      goToStep: "படிக்குச் செல்ல",
      slides: [
        {
          step: "01",
          module: "நிதி ஆதரவு",
          thought: "இந்த செமஸ்டரில் கட்டணங்களும் அவசர செலவுகளும் பற்றி நான் கவலைப்படுகிறேன்.",
          resolved: "UniCare உதவித்தொகை மற்றும் கட்டண தளர்வு விருப்பங்களை பொருத்தி, என் கோரிக்கை அங்கீகரிக்கப்பட்டது."
        },
        {
          step: "02",
          module: "தொழில் & உதவித்தொகைகள்",
          thought: "என் சுயவிவரத்திற்கு ஏற்ற பயிற்சியும் உதவித்தொகைகளும் எவை என்று உறுதி இல்லை.",
          resolved: "UniCare ஒரே டாஷ்போர்டில் பங்கு அடிப்படையிலான வாய்ப்புகளையும் உதவித்தொகை பொருத்தங்களையும் பரிந்துரைத்தது."
        },
        {
          step: "03",
          module: "வழிகாட்டுதல் & வளாகம்",
          thought: "நான் தனிமையாக உணர்கிறேன்; யார் வழிகாட்டுவார்கள் என தெரியவில்லை.",
          resolved: "UniCare என்னை வழிகாட்டிகளுடனும் தொடர்புடைய வளாகக் குழுக்களுடனும் இணைத்தது."
        },
        {
          step: "04",
          module: "ஆரோக்கியம் & நலன்",
          thought: "மன அழுத்தம் என் கவனத்தை பாதிக்கிறது; உடனடி ஆதரவு வேண்டும்.",
          resolved: "UniCare தாமதமின்றி நலன் வளங்களுக்கும் ஆலோசகர் முன்பதிவுக்கும் என்னை வழிமாற்றியது."
        },
        {
          step: "Done",
          module: "பயணம் முடிந்தது",
          thought: "என் முக்கிய சவால்கள் அனைத்தும் இப்போது ஒழுங்குபடுத்தப்பட்டும் கையாளக்கூடியதாகவும் உள்ளன.",
          resolved: "UNICARE எப்போதும் உங்களுடன்."
        }
      ]
    },
    stories: {
      heading: "இலங்கை வளாகங்களிலிருந்து உண்மையான கதைகள்",
      description: "ஒவ்வொரு கதையையும் முன்வரச் செய்ய ஸ்க்ரோல் செய்யவும்.",
      cards: [
        {
          name: "Ishara P.",
          role: "பொறியியல் மாணவி",
          quote: "UniCare ஒரு வாரத்திற்குள் எனக்கு லேப்டாப் கிடைக்க உதவியது மற்றும் பகுதி நேர ஆய்வக பணியுடன் இணைத்தது."
        },
        {
          name: "Prof. D. Jayasekara",
          role: "பீட வழிகாட்டி",
          quote: "நிர்வாக பகுப்பாய்வு டாஷ்போர்டு எங்கள் பீடத்திற்கு மாணவர் தேவைகளின் உடனடி கண்ணோட்டத்தை வழங்குகிறது."
        },
        {
          name: "Alumni Mentor",
          role: "வளாக தன்னார்வலர்",
          quote: "வழிகாட்டல் அட்டவணை அமைப்பு மிகவும் எளிது; மாணவர்கள் எப்போதும் தயார் நிலையில் வருகிறார்கள்."
        },
        {
          name: "Dinithi K.",
          role: "முதல் ஆண்டு மாணவி",
          quote: "அவசர நிதி ஆதரவு நேரத்திற்கு கிடைத்ததால் என் செமஸ்டரை தொடர முடிந்தது."
        }
      ]
    },
    supportPanels: {
      heading: "ஆதரவு செயல்பாடுகளுக்கு முன்னுரிமை அளிக்க பேனல்களின் அளவை மாற்றுங்கள்",
      description: "பிரிப்புகளை இழுக்கவும், அல்லது கைப்பிடியை தேர்ந்தெடுத்து அம்புக்குறி விசைகள், Home, End பயன்படுத்தவும்.",
      studentOverviewAria: "மாணவர் மேலோட்டம்",
      snapshotTitle: "மாணவர் நிலைச் சுருக்கம்",
      snapshotSubtitle: "செமஸ்டர் நிலை ஒரே பார்வையில்",
      financialPending: "மதிப்பாய்வுக்காக நிலுவையில் உள்ள நிதி கோரிக்கைகள்",
      careerMatches: "இந்த வாரம் உருவாக்கப்பட்ட தொழில் பொருத்தங்கள்",
      wellnessCheckins: "முடிக்கப்பட்ட நலன் சரிபார்ப்புகள்",
      resizeHorizontalAria: "இடது மற்றும் வலது பேனல்களின் அளவை மாற்றவும்",
      supportOperationsAria: "ஆதரவு செயல்பாடுகள்",
      priorityQueueTitle: "முன்னுரிமை வரிசை",
      priority1: "அவசர கட்டண வழக்குக்கு அதே நாள் அங்கீகாரம் தேவை.",
      priority2: "6 மாணவர்கள் இன்டர்ன்ஷிப் உறுதிப்படுத்தலை காத்திருக்கின்றனர்.",
      priority3: "அதிக ஆபத்து மாணவர்கள் 2 பேருக்கு வழிகாட்டி மறுபிரிவு தேவை.",
      resizeVerticalAria: "மேல் மற்றும் கீழ் பேனல்களின் அளவை மாற்றவும்",
      actionPlannerTitle: "செயல் திட்டமிடுபவர்",
      action1: "மாலை 3:00 முன் உதவி தொகுதியை அங்கீகரிக்கவும்.",
      action2: "வாரம் 4 க்கான வழிகாட்டி இணைப்பை முடிக்கவும்.",
      action3: "பீடத்திற்கான வாராந்த நலன் சுருக்கத்தை ஏற்றுமதி செய்யவும்.",
      mobileStudentTitle: "மாணவர் நிலைச் சுருக்கம்",
      mobileStudentBody: "டெஸ்க்டாப் பார்வையில் விசைப்பலகை மூலம் அளவு மாற்றக்கூடிய பேனல்கள் உள்ளன.",
      mobilePriorityTitle: "முன்னுரிமை வரிசை",
      mobilePriorityBody: "அவசர கட்டண வழக்குக்கு அதே நாள் அங்கீகாரம் தேவை.",
      mobileActionTitle: "செயல் திட்டமிடுபவர்",
      mobileActionBody: "உதவி தொகுதியை அங்கீகரித்து வழிகாட்டி இணைப்பை முடிக்கவும்."
    },
    faq: {
      previousQuestion: "முந்தைய கேள்வி",
      nextQuestion: "அடுத்த கேள்வி",
      goToQuestion: "கேள்விக்குச் செல்ல",
      items: [
        {
          question: "UniCare Connect யாரால் பயன்படுத்தப்படலாம்?",
          answer:
            "பல்கலைக்கழக மாணவர்கள், வழிகாட்டிகள் மற்றும் ஆதரவு பணியாளர்கள் UniCare ஐ பயன்படுத்தி நிதி உதவி, தொழில் பாதை, நலன் மற்றும் வழிகாட்டலை ஒரே தளத்தில் நிர்வகிக்கலாம்."
        },
        {
          question: "மாணவர் கோரிக்கை எவ்வளவு விரைவாக மதிப்பாய்வு செய்யப்படும்?",
          answer:
            "அவசர வழக்குகள் முன்னுரிமை வரிசையில் மேலிடப்படுகின்றன; குழுக்கள் செயல் திட்ட டாஷ்போர்டின் மூலம் கோரிக்கைகளை மதிப்பாய்வு செய்து நடவடிக்கை எடுக்கலாம்."
        },
        {
          question: "UniCare அரசு மற்றும் தனியார் பல்கலைக்கழகங்களையும் ஆதரிக்கிறதா?",
          answer:
            "ஆம். இலங்கையின் அரசு மற்றும் தனியார் நிறுவனங்களுக்கு இடையேயான ஒத்துழைப்புக்காக UniCare வடிவமைக்கப்பட்டு மாற்றக்கூடிய பணிப்பாய்வுகளை கொண்டுள்ளது."
        },
        {
          question: "கோரிக்கை அனுப்பிய பிறகு மாணவர்கள் முடிவுகளை கண்காணிக்க முடியுமா?",
          answer:
            "ஆம். நிதி, வழிகாட்டல், தொழில் மற்றும் நலன் கோரிக்கைகளின் முன்னேற்றம், புதுப்பிப்புகள் மற்றும் இறுதி முடிவுகளை மாணவர்கள் காணலாம்."
        },
        {
          question: "தளத்திலிருந்தே நான் நேரடியாக நிதி உதவிக்கு விண்ணப்பிக்கலாமா?",
          answer:
            "ஆம். மாணவர்கள் உதவி கோரிக்கைகளை சமர்ப்பித்து தேவையான விவரங்களை பதிவேற்றி ஒவ்வொரு நிலை மாற்றத்தையும் நேரடியாக கண்காணிக்கலாம்."
        },
        {
          question: "வழிகாட்டி பொருத்தும் செயல்முறை எப்படி வேலை செய்கிறது?",
          answer:
            "UniCare மாணவர் இலக்குகளை கிடைக்கக்கூடிய வழிகாட்டிகளுடன் பொருத்தி, சுயவிவரம் மற்றும் ஆதரவு தேவைகள் அடிப்படையில் சிறந்த தேர்வுகளை பரிந்துரைக்கிறது."
        }
      ]
    },
    footer: {
      tagline: "மாணவர் வெற்றிக்கான ஒரே தளம்.",
      description:
        "இலங்கை பல்கலைக்கழகங்களுக்குள் நிதி உதவி, தொழில் பாதைகள், வழிகாட்டல் மற்றும் நலன் ஆதரவுக்கான இணைந்த சூழல்.",
      navigation: "வழிசெலுத்தல்",
      studentSupport: "மாணவர் ஆதரவு",
      socials: "சமூக இணைப்புகள்",
      copyright: "© 2026 UniCare Connect. IT3040 IT Project Management க்காக உருவாக்கப்பட்டது."
    }
  }
};

export function getUiTranslations(language: Language): UiTranslations {
  return uiTranslations[language];
}

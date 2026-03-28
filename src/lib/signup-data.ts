/**
 * Sri Lankan universities and degree programs for sign-up Field 1 & 2.
 * Used for Student and University Admin roles.
 */
import type { Language } from "@/context/language-context";

export const GOVERNMENT_UNIVERSITIES = [
  "University of Colombo",
  "University of Peradeniya",
  "University of Moratuwa",
  "University of Sri Jayewardenepura",
  "University of Kelaniya",
  "University of Ruhuna",
  "University of Jaffna",
  "Eastern University, Sri Lanka",
  "South Eastern University of Sri Lanka",
  "Rajarata University of Sri Lanka",
  "Sabaragamuwa University of Sri Lanka",
  "Wayamba University of Sri Lanka",
  "Uva Wellassa University",
  "Open University of Sri Lanka",
  "General Sir John Kotelawala Defence University"
] as const;

export const PRIVATE_UNIVERSITIES = [
  "SLIIT (Sri Lanka Institute of Information Technology)",
  "NSBM Green University",
  "IIT (Informatics Institute of Technology)",
  "CINEC Campus",
  "APIIT (Asia Pacific Institute of Information Technology)",
  "ICBT Campus",
  "NIBM (National Institute of Business Management)",
  "Esoft Metro Campus",
  "American College of Higher Education",
  "Malabe Metropolitan College"
] as const;

export const OTHER_UNIVERSITY_VALUE = "__other__";

/** Degree programs by university (sample). Universities not listed get GENERIC_DEGREE_PROGRAMS. */
export const DEGREE_PROGRAMS_BY_UNIVERSITY: Record<string, readonly string[]> = {
  "University of Moratuwa": [
    "Computer Science and Engineering",
    "Electronic and Telecommunication Engineering",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Architecture",
    "Quantity Surveying",
    "Town & Country Planning",
    "Materials Engineering",
    "Earth Resources Engineering",
    "Transport and Logistics Management",
    "Naval Architecture and Marine Engineering",
    "Chemical and Process Engineering",
    "Textile and Clothing Technology",
    "BSc in IT (Information Technology)"
  ],
  "University of Colombo": [
    "Computer Science",
    "Information Technology",
    "Physical Sciences",
    "Biological Sciences",
    "Law",
    "Management",
    "Commerce",
    "Arts",
    "Medicine",
    "Education"
  ],
  "University of Peradeniya": [
    "Engineering (Civil, Mechanical, Electrical, etc.)",
    "Agriculture",
    "Science",
    "Arts",
    "Medicine",
    "Dental Sciences",
    "Veterinary Medicine",
    "Management"
  ],
  "University of Sri Jayewardenepura": [
    "Management",
    "Commerce",
    "Humanities",
    "Science",
    "Medical Sciences",
    "Applied Sciences",
    "Technology"
  ],
  "University of Kelaniya": [
    "Humanities",
    "Science",
    "Commerce",
    "Social Sciences",
    "Computing and Technology"
  ],
  "University of Ruhuna": [
    "Engineering",
    "Science",
    "Medicine",
    "Agriculture",
    "Humanities and Social Sciences",
    "Management and Finance"
  ],
  "University of Jaffna": [
    "Engineering",
    "Science",
    "Medicine",
    "Arts",
    "Management",
    "Agriculture"
  ],
  "SLIIT (Sri Lanka Institute of Information Technology)": [
    "BSc (Hons) in IT",
    "BSc (Hons) in Computer Science",
    "BSc (Hons) in Software Engineering",
    "BSc (Hons) in Information Systems",
    "BSc (Hons) in Cyber Security",
    "BEng (Hons) in Software Engineering",
    "BSc (Hons) in Business Information Systems",
    "MBA",
    "Other"
  ],
  "NSBM Green University": [
    "Computing",
    "Business",
    "Engineering",
    "Law",
    "Other"
  ],
  "IIT (Informatics Institute of Technology)": [
    "Computer Science",
    "Software Engineering",
    "Information Technology",
    "Business Information Systems",
    "Other"
  ],
  "CINEC Campus": [
    "Maritime",
    "Engineering",
    "Business",
    "IT",
    "Other"
  ]
};

export const GENERIC_DEGREE_PROGRAMS = [
  "Computer Science / IT",
  "Engineering",
  "Business / Management",
  "Commerce",
  "Arts / Humanities",
  "Science",
  "Law",
  "Medicine / Health",
  "Other (Please specify)"
] as const;

export const OTHER_DEGREE_VALUE = "__other__";

/** Support type options for Donor / CSR (Field 2). */
export const SUPPORT_TYPES = [
  "Emergency bursaries / scholarships",
  "Merit-based scholarships",
  "Need-based financial aid",
  "Equipment / resources",
  "Mentorship programs",
  "Other (Please specify)"
] as const;

/** Hiring focus options for Employer (Field 2). */
export const HIRING_FOCUS_OPTIONS = [
  "Internships",
  "Graduate roles",
  "Part-time / casual",
  "Placements / industrial training",
  "All of the above",
  "Other (Please specify)"
] as const;

/** Funding focus options for NGO (Field 2). */
export const FUNDING_FOCUS_OPTIONS = [
  "Education and wellbeing",
  "Emergency relief",
  "Scholarships and bursaries",
  "Community development",
  "Health and nutrition",
  "Other (Please specify)"
] as const;

/** Relationship options for Parent/Guardian (Field 2). */
export const RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Guardian",
  "Other (Please specify)"
] as const;

const SIGNUP_OPTION_LABELS: Record<Exclude<Language, "en">, Record<string, string>> = {
  si: {
    "Computer Science / IT": "පරිගණක විද්‍යාව / තොරතුරු තාක්ෂණය",
    Engineering: "ඉංජිනේරු",
    "Business / Management": "ව්‍යාපාර / කළමනාකරණය",
    Commerce: "වාණිජ",
    "Arts / Humanities": "කලා / මානව ශාස්ත්‍ර",
    Science: "විද්‍යාව",
    Law: "නීතිය",
    "Medicine / Health": "වෛද්‍ය / සෞඛ්‍ය",
    "Emergency bursaries / scholarships": "හදිසි බර්සරි / ශිෂ්‍යත්ව",
    "Merit-based scholarships": "කාර්ය සාධන පදනම් ශිෂ්‍යත්ව",
    "Need-based financial aid": "අවශ්‍යතා පදනම් මූල්‍ය ආධාර",
    "Equipment / resources": "උපකරණ / සම්පත්",
    "Mentorship programs": "මඟපෙන්වීම් වැඩසටහන්",
    Internships: "පුහුණු අවස්ථා",
    "Graduate roles": "උපාධිධාරී තනතුරු",
    "Part-time / casual": "අර්ධකාලීන / තාවකාලික",
    "Placements / industrial training": "ස්ථානගත කිරීම / කාර්මික පුහුණුව",
    "All of the above": "ඉහත සියල්ල",
    "Education and wellbeing": "අධ්‍යාපනය සහ යහපැවැත්ම",
    "Emergency relief": "හදිසි සහන",
    "Scholarships and bursaries": "ශිෂ්‍යත්ව සහ බර්සරි",
    "Community development": "සමාජ සංවර්ධනය",
    "Health and nutrition": "සෞඛ්‍ය සහ පෝෂණය",
    Mother: "මව",
    Father: "පියා",
    Guardian: "භාරකරු",
    "Other (Please specify)": "වෙනත් (විස්තර කරන්න)",
    Other: "වෙනත්"
  },
  ta: {
    "Computer Science / IT": "கணினி அறிவியல் / தகவல் தொழில்நுட்பம்",
    Engineering: "பொறியியல்",
    "Business / Management": "வணிகம் / மேலாண்மை",
    Commerce: "வர்த்தகம்",
    "Arts / Humanities": "கலை / மனிதவியல்",
    Science: "அறிவியல்",
    Law: "சட்டம்",
    "Medicine / Health": "மருத்துவம் / சுகாதாரம்",
    "Emergency bursaries / scholarships": "அவசர உதவித்தொகை / கல்வியுதவி",
    "Merit-based scholarships": "திறமை அடிப்படையிலான கல்வியுதவி",
    "Need-based financial aid": "தேவை அடிப்படையிலான நிதி உதவி",
    "Equipment / resources": "உபகரணங்கள் / வளங்கள்",
    "Mentorship programs": "வழிகாட்டல் திட்டங்கள்",
    Internships: "பயிற்சி வேலைகள்",
    "Graduate roles": "பட்டதாரி பணியிடங்கள்",
    "Part-time / casual": "பகுதி நேர / தற்காலிக",
    "Placements / industrial training": "பணியமர்த்தல் / தொழில் பயிற்சி",
    "All of the above": "மேலே உள்ள அனைத்தும்",
    "Education and wellbeing": "கல்வி மற்றும் நலன்",
    "Emergency relief": "அவசர நிவாரணம்",
    "Scholarships and bursaries": "கல்வியுதவித்தொகைகள்",
    "Community development": "சமூக மேம்பாடு",
    "Health and nutrition": "சுகாதாரம் மற்றும் ஊட்டச்சத்து",
    Mother: "அம்மா",
    Father: "அப்பா",
    Guardian: "பாதுகாவலர்",
    "Other (Please specify)": "மற்றவை (தயவுசெய்து குறிப்பிடவும்)",
    Other: "மற்றவை"
  }
};

export function localizeSignupOptionLabel(option: string, language: Language): string {
  if (language === "en") {
    if (option === OTHER_DEGREE_VALUE || option === "Other") return "Other (Please specify)";
    return option;
  }
  return SIGNUP_OPTION_LABELS[language][option] ?? option;
}

export function isOtherSelection(value: string): boolean {
  return value === OTHER_DEGREE_VALUE || value === "Other (Please specify)" || value === "Other";
}

export function getDegreeProgramsForUniversity(university: string): string[] {
  if (!university || university === "__other__") return [...GENERIC_DEGREE_PROGRAMS];
  const programs = DEGREE_PROGRAMS_BY_UNIVERSITY[university];
  if (programs) return [...programs];
  return [...GENERIC_DEGREE_PROGRAMS];
}

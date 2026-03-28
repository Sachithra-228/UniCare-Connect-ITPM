import { UserRole as AppUserRole } from "@/types";
import type { Language } from "@/context/language-context";
import {
  SUPPORT_TYPES,
  HIRING_FOCUS_OPTIONS,
  FUNDING_FOCUS_OPTIONS,
  RELATIONSHIP_OPTIONS
} from "./signup-data";

export type UserRole = Exclude<AppUserRole, "super_admin">;

export type RoleField = {
  key: "fieldA" | "fieldB" | "fieldC";
  label: string;
  placeholder: string;
  type?: "text" | "tel" | "url";
  optional?: boolean;
  helpText?: string;
};

export type RoleConfig = {
  label: string;
  helper: string;
  fields: [RoleField, RoleField, RoleField];
  field1Kind?: "university" | "text";
  field2Kind?: "degree" | "dropdown" | "text";
  field2Options?: readonly string[];
};

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  student: {
    label: "Student",
    helper: "Set up your student support profile.",
    field1Kind: "university",
    field2Kind: "degree",
    fields: [
      { key: "fieldA", label: "University", placeholder: "Select your university" },
      { key: "fieldB", label: "Degree program", placeholder: "Select after choosing university" },
      { key: "fieldC", label: "Student ID (Optional)", placeholder: "e.g. IT23152700", optional: true }
    ]
  },
  admin: {
    label: "University Admin / Faculty",
    helper: "Connect your institution and department.",
    field1Kind: "university",
    field2Kind: "text",
    fields: [
      { key: "fieldA", label: "University / Faculty", placeholder: "Select your university" },
      { key: "fieldB", label: "Department / Office", placeholder: "e.g. Student Affairs Office" },
      { key: "fieldC", label: "Staff ID (Optional)", placeholder: "e.g. STAFF-00192", optional: true }
    ]
  },
  mentor: {
    label: "Alumni / Industry Mentor",
    helper: "Create your mentor identity and expertise profile.",
    field1Kind: "text",
    field2Kind: "text",
    fields: [
      { key: "fieldA", label: "Organization", placeholder: "e.g. ABC Technologies" },
      { key: "fieldB", label: "Expertise area", placeholder: "e.g. Software Engineering" },
      {
        key: "fieldC",
        label: "LinkedIn profile (Optional)",
        placeholder: "https://linkedin.com/in/username",
        type: "url",
        optional: true,
        helpText: "Enter full URL including https://"
      }
    ]
  },
  donor: {
    label: "Donor / CSR Partner",
    helper: "Register your support profile and contribution focus.",
    field1Kind: "text",
    field2Kind: "dropdown",
    field2Options: SUPPORT_TYPES,
    fields: [
      { key: "fieldA", label: "Organization", placeholder: "e.g. XYZ Foundation" },
      { key: "fieldB", label: "Support type", placeholder: "Select support type" },
      { key: "fieldC", label: "CSR / Donor reference (Optional)", placeholder: "e.g. CSR-UNICARE-2026", optional: true }
    ]
  },
  employer: {
    label: "Employer (Job Provider)",
    helper: "Set your hiring profile for student opportunities.",
    field1Kind: "text",
    field2Kind: "dropdown",
    field2Options: HIRING_FOCUS_OPTIONS,
    fields: [
      { key: "fieldA", label: "Company", placeholder: "e.g. Tech Lanka Pvt Ltd" },
      { key: "fieldB", label: "Hiring focus", placeholder: "Select hiring focus" },
      {
        key: "fieldC",
        label: "Company website (Optional)",
        placeholder: "https://company.lk",
        type: "url",
        optional: true,
        helpText: "Enter full URL including https://"
      }
    ]
  },
  ngo: {
    label: "NGO / Funding Organization",
    helper: "Define your funding and community support profile.",
    field1Kind: "text",
    field2Kind: "dropdown",
    field2Options: FUNDING_FOCUS_OPTIONS,
    fields: [
      { key: "fieldA", label: "Organization name", placeholder: "e.g. Youth Impact NGO" },
      { key: "fieldB", label: "Funding focus", placeholder: "Select funding focus" },
      {
        key: "fieldC",
        label: "Registration number",
        placeholder: "e.g. NGO/SL/2026/XX",
        helpText: "Required for NGO accounts"
      }
    ]
  },
  parent: {
    label: "Parent / Guardian",
    helper: "Set up parent access to monitor student progress.",
    field1Kind: "text",
    field2Kind: "dropdown",
    field2Options: RELATIONSHIP_OPTIONS,
    fields: [
      { key: "fieldA", label: "Student full name", placeholder: "Full name of the student" },
      { key: "fieldB", label: "Relationship", placeholder: "Select relationship" },
      {
        key: "fieldC",
        label: "Contact number",
        placeholder: "0771234567",
        type: "tel",
        helpText: "10-digit Sri Lanka number (e.g. 0771234567)"
      }
    ]
  }
};

const ROLE_TEXT_TRANSLATIONS: Record<Exclude<Language, "en">, Record<string, string>> = {
  si: {
    Student: "ශිෂ්‍ය",
    "University Admin / Faculty": "විශ්වවිද්‍යාල පරිපාලක / ආචාර්ය මණ්ඩලය",
    "Alumni / Industry Mentor": "පුරෝගාමී / කර්මාන්ත මඟපෙන්වන්නා",
    "Donor / CSR Partner": "දායක / CSR හවුල්කරු",
    "Employer (Job Provider)": "රැකියා දායකයා",
    "NGO / Funding Organization": "NGO / අරමුදල් ආයතනය",
    "Parent / Guardian": "මාපිය / භාරකරු",
    "Set up your student support profile.": "ඔබගේ ශිෂ්‍ය සහය පැතිකඩ සකසන්න.",
    "Connect your institution and department.": "ඔබගේ ආයතනය සහ දෙපාර්තමේන්තුව සම්බන්ධ කරන්න.",
    "Create your mentor identity and expertise profile.": "ඔබගේ මඟපෙන්වන්නා පැතිකඩ සහ දක්ෂතා සකසන්න.",
    "Register your support profile and contribution focus.": "ඔබගේ සහය පැතිකඩ සහ දායකත්ව අරමුණ ලියාපදිංචි කරන්න.",
    "Set your hiring profile for student opportunities.": "ශිෂ්‍ය අවස්ථා සඳහා බඳවා ගැනීමේ පැතිකඩ සකසන්න.",
    "Define your funding and community support profile.": "ඔබගේ අරමුදල් සහ සමාජ සහය පැතිකඩ නිර්වචනය කරන්න.",
    "Set up parent access to monitor student progress.": "ශිෂ්‍ය ප්‍රගතිය නිරීක්ෂණයට මාපිය ප්‍රවේශය සකසන්න.",
    University: "විශ්වවිද්‍යාලය",
    "Degree program": "උපාධි වැඩසටහන",
    "Student ID (Optional)": "ශිෂ්‍ය හැඳුනුම් අංකය (විකල්ප)",
    "Select your university": "ඔබගේ විශ්වවිද්‍යාලය තෝරන්න",
    "Select after choosing university": "විශ්වවිද්‍යාලය තේරූ පසු තෝරන්න",
    "e.g. IT23152700": "උදා: IT23152700",
    "University / Faculty": "විශ්වවිද්‍යාලය / පීඨය",
    "Department / Office": "දෙපාර්තමේන්තුව / කාර්යාලය",
    "Staff ID (Optional)": "කාර්ය මණ්ඩල හැඳුනුම් අංකය (විකල්ප)",
    "e.g. Student Affairs Office": "උදා: ශිෂ්‍ය කටයුතු කාර්යාලය",
    "e.g. STAFF-00192": "උදා: STAFF-00192",
    Organization: "ආයතනය",
    "Expertise area": "විශේෂ දක්ෂතා ක්ෂේත්‍රය",
    "LinkedIn profile (Optional)": "LinkedIn පැතිකඩ (විකල්ප)",
    "e.g. ABC Technologies": "උදා: ABC Technologies",
    "e.g. Software Engineering": "උදා: Software Engineering",
    "Enter full URL including https://": "https:// සමඟ සම්පූර්ණ URL එක ඇතුළත් කරන්න",
    "Support type": "සහාය වර්ගය",
    "CSR / Donor reference (Optional)": "CSR / දායක සන්දර්භය (විකල්ප)",
    "e.g. XYZ Foundation": "උදා: XYZ Foundation",
    "Select support type": "සහාය වර්ගය තෝරන්න",
    "e.g. CSR-UNICARE-2026": "උදා: CSR-UNICARE-2026",
    Company: "සමාගම",
    "Hiring focus": "බඳවා ගැනීමේ අරමුණ",
    "Company website (Optional)": "සමාගම් වෙබ් අඩවිය (විකල්ප)",
    "e.g. Tech Lanka Pvt Ltd": "උදා: Tech Lanka Pvt Ltd",
    "Select hiring focus": "බඳවා ගැනීමේ අරමුණ තෝරන්න",
    "https://company.lk": "https://company.lk",
    "Organization name": "ආයතන නම",
    "Funding focus": "අරමුදල් අරමුණ",
    "Registration number": "ලියාපදිංචි අංකය",
    "e.g. Youth Impact NGO": "උදා: Youth Impact NGO",
    "Select funding focus": "අරමුදල් අරමුණ තෝරන්න",
    "e.g. NGO/SL/2026/XX": "උදා: NGO/SL/2026/XX",
    "Required for NGO accounts": "NGO ගිණුම් සඳහා අනිවාර්යයි",
    "Student full name": "ශිෂ්‍යයාගේ සම්පූර්ණ නම",
    Relationship: "සම්බන්ධතාවය",
    "Contact number": "සම්බන්ධතා අංකය",
    "Full name of the student": "ශිෂ්‍යයාගේ සම්පූර්ණ නම",
    "Select relationship": "සම්බන්ධතාවය තෝරන්න",
    "10-digit Sri Lanka number (e.g. 0771234567)": "අංක 10ක ශ්‍රී ලංකා දුරකථන අංකය (උදා: 0771234567)"
  },
  ta: {
    Student: "மாணவர்",
    "University Admin / Faculty": "பல்கலைக்கழக நிர்வாகம் / பேராசிரியர் குழு",
    "Alumni / Industry Mentor": "பழைய மாணவர் / தொழில் வழிகாட்டி",
    "Donor / CSR Partner": "நன்கொடையாளர் / CSR கூட்டாளர்",
    "Employer (Job Provider)": "பணியாளர் (வேலை வழங்குபவர்)",
    "NGO / Funding Organization": "NGO / நிதி அமைப்பு",
    "Parent / Guardian": "பெற்றோர் / பாதுகாவலர்",
    "Set up your student support profile.": "உங்கள் மாணவர் ஆதரவு சுயவிவரத்தை அமைக்கவும்.",
    "Connect your institution and department.": "உங்கள் நிறுவனம் மற்றும் துறையை இணைக்கவும்.",
    "Create your mentor identity and expertise profile.": "உங்கள் வழிகாட்டி அடையாளம் மற்றும் நிபுணத்துவ சுயவிவரத்தை உருவாக்கவும்.",
    "Register your support profile and contribution focus.": "உங்கள் ஆதரவு சுயவிவரம் மற்றும் பங்களிப்பு கவனத்தை பதிவு செய்யவும்.",
    "Set your hiring profile for student opportunities.": "மாணவர் வாய்ப்புகளுக்கான பணியமர்த்தல் சுயவிவரத்தை அமைக்கவும்.",
    "Define your funding and community support profile.": "உங்கள் நிதி மற்றும் சமூக ஆதரவு சுயவிவரத்தை வரையறுக்கவும்.",
    "Set up parent access to monitor student progress.": "மாணவர் முன்னேற்றத்தை கண்காணிக்க பெற்றோர் அணுகலை அமைக்கவும்.",
    University: "பல்கலைக்கழகம்",
    "Degree program": "பட்டப்படிப்பு திட்டம்",
    "Student ID (Optional)": "மாணவர் அடையாள எண் (விருப்பம்)",
    "Select your university": "உங்கள் பல்கலைக்கழகத்தை தேர்ந்தெடுக்கவும்",
    "Select after choosing university": "பல்கலைக்கழகத்தை தேர்ந்தெடுத்த பின் தேர்வு செய்யவும்",
    "e.g. IT23152700": "எ.கா. IT23152700",
    "University / Faculty": "பல்கலைக்கழகம் / பீடம்",
    "Department / Office": "துறை / அலுவலகம்",
    "Staff ID (Optional)": "பணியாளர் அடையாள எண் (விருப்பம்)",
    "e.g. Student Affairs Office": "எ.கா. மாணவர் விவகார அலுவலகம்",
    "e.g. STAFF-00192": "எ.கா. STAFF-00192",
    Organization: "அமைப்பு",
    "Expertise area": "நிபுணத்துவ பகுதி",
    "LinkedIn profile (Optional)": "LinkedIn சுயவிவரம் (விருப்பம்)",
    "e.g. ABC Technologies": "எ.கா. ABC Technologies",
    "e.g. Software Engineering": "எ.கா. Software Engineering",
    "Enter full URL including https://": "https:// உடன் முழு URL ஐ உள்ளிடவும்",
    "Support type": "ஆதரவு வகை",
    "CSR / Donor reference (Optional)": "CSR / நன்கொடையாளர் குறிப்பு (விருப்பம்)",
    "e.g. XYZ Foundation": "எ.கா. XYZ Foundation",
    "Select support type": "ஆதரவு வகையை தேர்ந்தெடுக்கவும்",
    "e.g. CSR-UNICARE-2026": "எ.கா. CSR-UNICARE-2026",
    Company: "நிறுவனம்",
    "Hiring focus": "பணியமர்த்தல் கவனம்",
    "Company website (Optional)": "நிறுவன இணையதளம் (விருப்பம்)",
    "e.g. Tech Lanka Pvt Ltd": "எ.கா. Tech Lanka Pvt Ltd",
    "Select hiring focus": "பணியமர்த்தல் கவனத்தை தேர்ந்தெடுக்கவும்",
    "https://company.lk": "https://company.lk",
    "Organization name": "அமைப்பின் பெயர்",
    "Funding focus": "நிதி கவனம்",
    "Registration number": "பதிவு எண்",
    "e.g. Youth Impact NGO": "எ.கா. Youth Impact NGO",
    "Select funding focus": "நிதி கவனத்தை தேர்ந்தெடுக்கவும்",
    "e.g. NGO/SL/2026/XX": "எ.கா. NGO/SL/2026/XX",
    "Required for NGO accounts": "NGO கணக்குகளுக்கு அவசியம்",
    "Student full name": "மாணவர் முழுப்பெயர்",
    Relationship: "உறவு",
    "Contact number": "தொடர்பு எண்",
    "Full name of the student": "மாணவரின் முழுப்பெயர்",
    "Select relationship": "உறவை தேர்ந்தெடுக்கவும்",
    "10-digit Sri Lanka number (e.g. 0771234567)": "10 இலக்க இலங்கை எண் (எ.கா. 0771234567)"
  }
};

function translateRoleText(language: Language, text: string): string {
  if (language === "en") return text;
  return ROLE_TEXT_TRANSLATIONS[language][text] ?? text;
}

export function getRoleConfigs(language: Language): Record<UserRole, RoleConfig> {
  if (language === "en") return ROLE_CONFIGS;
  return (Object.entries(ROLE_CONFIGS) as Array<[UserRole, RoleConfig]>).reduce(
    (acc, [role, config]) => {
      acc[role] = {
        ...config,
        label: translateRoleText(language, config.label),
        helper: translateRoleText(language, config.helper),
        fields: config.fields.map((field) => ({
          ...field,
          label: translateRoleText(language, field.label),
          placeholder: translateRoleText(language, field.placeholder),
          helpText: field.helpText ? translateRoleText(language, field.helpText) : undefined
        })) as [RoleField, RoleField, RoleField]
      };
      return acc;
    },
    {} as Record<UserRole, RoleConfig>
  );
}

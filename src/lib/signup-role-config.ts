import { UserRole as AppUserRole } from "@/types";
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

/**
 * Sri Lankan universities and degree programs for sign-up Field 1 & 2.
 * Used for Student and University Admin roles.
 */

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

export function getDegreeProgramsForUniversity(university: string): string[] {
  if (!university || university === "__other__") return [...GENERIC_DEGREE_PROGRAMS];
  const programs = DEGREE_PROGRAMS_BY_UNIVERSITY[university];
  if (programs) return [...programs];
  return [...GENERIC_DEGREE_PROGRAMS];
}

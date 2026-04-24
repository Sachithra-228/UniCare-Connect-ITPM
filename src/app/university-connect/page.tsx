"use client";

import clsx from "clsx";
import Image from "next/image";
import { useMemo, useState } from "react";
import { SriLankaDistrictMap } from "@/components/shared/sri-lanka-district-map";
import { SRI_LANKA_DISTRICTS } from "@/lib/data/theme-mappings";
import { useLanguage } from "@/context/language-context";

type DirectoryItem = {
  name: string;
  location: string;
  focus: string;
  logo?: string;
};

type DirectorySection = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  fallbackImage: string;
  items: DirectoryItem[];
};

const instituteLogoByName: Record<string, string> = {
  "Sri Lanka Institute of Advanced Technological Education (SLIATE)":
    "/Sri Lanka Institute of Advanced Technological Education (SLIATE).jpg",
  "National Institute of Business Management (NIBM)":
    "/National Institute of Business Management (NIBM).jpg",
  "Institute of Chemistry Ceylon": "/Institute of Chemistry Ceylon.jpg",
  "Sri Lanka School of Agriculture": "/Sri Lanka School of Agriculture.jpg",
  "National Institute of Fisheries and Nautical Engineering":
    "/National Institute of Fisheries and Nautical Engineering.jpg",
  "Sri Lanka Institute of Information Technology (SLIIT)":
    "/Sri Lanka Institute of Information Technology (SLIIT).jpg",
  "NSBM Green University": "/NSBM Green University.jpg",
  "Informatics Institute of Technology (IIT)": "/Informatics Institute of Technology (IIT).jpg",
  "International Institute of Health Sciences (IIHS)":
    "/International Institute of Health Sciences (IIHS).jpg",
  "CINEC Campus": "/CINEC Campus.jpg",
  "ICBT Campus": "/ICBT Campus.jpg",
  "Horizon Campus": "/Horizon Campus.jpg",
  "Colombo International Nautical and Engineering College":
    "/Colombo International Nautical and Engineering College.jpg",
  "British College of Applied Studies (BCAS)":
    "/British College of Applied Studies (BCAS).png",
  "Australian College of Business and Technology (ACBT)":
    "/Australian College of Business and Technology (ACBT).jpg",
  "Academy of Design (AOD)": "/Academy of Design (AOD).png",
  "Rajarata University External Degrees": "/Rajarata University External Degrees.jpg",
  "University of Plymouth - SLIIT Campus": "/University of Plymouth - SLIIT Campus.jpg",
  "University of Central Lancashire - Sri Lanka":
    "/University of Central Lancashire - Sri Lanka.jpg",
  "University of Wales - Sri Lanka Campus": "/University of Wales - Sri Lanka Campus.jpg",
  "American College of Higher Education": "/American College of Higher Education.jpg",
  "Lincoln University College (Sri Lanka Campus)": "/Lincoln University College (Sri Lanka Campus).jpg",
  "Imperial College of Business Studies": "/Imperial College of Business Studies.jpg",
  "European College of Business and Management":
    "/European College of Business and Management.png",
  "Sri Lanka Technological Campus": "/Sri Lanka Technological Campus.jpg",
  "Institute of Bankers of Sri Lanka (IBSL)": "/Institute of Bankers of Sri Lanka (IBSL).jpg",
  "Chartered Institute of Management Accountants (CIMA)":
    "/Chartered Institute of Management Accountants (CIMA).png",
  "Association of Accounting Technicians (AAT)":
    "/Association of Accounting Technicians (AAT).jpg",
  "Sri Lanka Institute of Marketing (SLIM)": "/Sri Lanka Institute of Marketing (SLIM).png",
  "Institute of Chartered Accountants of Sri Lanka (CA Sri Lanka)":
    "/Institute of Chartered Accountants of Sri Lanka (CA Sri Lanka).jpg",
  "Sri Lanka Institute of Tourism and Hotel Management (SLITHM)":
    "/Sri Lanka Institute of Tourism and Hotel Management (SLITHM).jpg"
};

function attachLogos(items: DirectoryItem[]) {
  return items.map((item) => ({
    ...item,
    logo: item.logo ?? instituteLogoByName[item.name]
  }));
}

const governmentUniversities: DirectoryItem[] = [
  { name: "University of Colombo", location: "Colombo", focus: "Medicine, Law, Arts, Science", logo: "/colombo.jpg" },
  { name: "University of Peradeniya", location: "Peradeniya", focus: "Engineering, Medicine, Agriculture", logo: "/peradeniya.jpg" },
  { name: "University of Sri Jayewardenepura", location: "Nugegoda", focus: "Management, Humanities, Science", logo: "/jayawardenapura.jpg" },
  { name: "University of Kelaniya", location: "Kelaniya", focus: "Science, Humanities, Commerce", logo: "/kelaniya.jpg" },
  { name: "University of Moratuwa", location: "Moratuwa", focus: "Engineering, Architecture, IT", logo: "/moratuwa.jpg" },
  { name: "University of Jaffna", location: "Jaffna", focus: "Medicine, Engineering, Arts", logo: "/jaffna.jpg" },
  { name: "University of Ruhuna", location: "Matara", focus: "Medicine, Agriculture, Engineering", logo: "/ruhuna.jpg" },
  { name: "Eastern University, Sri Lanka", location: "Batticaloa", focus: "Science, Agriculture, Medicine", logo: "/eastern.jpg" },
  { name: "Rajarata University of Sri Lanka", location: "Mihintale", focus: "Medicine, Agriculture, Management", logo: "/rajarata.jpg" },
  { name: "Sabaragamuwa University of Sri Lanka", location: "Belihuloya", focus: "Science, Management, Agriculture", logo: "/sabaragamuwa.jpg" },
  { name: "Wayamba University of Sri Lanka", location: "Kuliyapitiya", focus: "Agriculture, Business, Technology", logo: "/wayamba.jpg" },
  { name: "Uva Wellassa University", location: "Badulla", focus: "Science, Management, Animal Science", logo: "/uvawellassa.jpg" },
  { name: "South Eastern University of Sri Lanka", location: "Oluvil", focus: "Islamic Studies, Management, Science", logo: "/southeastern.jpg" },
  { name: "Open University of Sri Lanka", location: "Colombo (Nawala)", focus: "Distance Education", logo: "/open.jpg" },
  { name: "University of the Visual and Performing Arts", location: "Colombo", focus: "Music, Dance, Drama, Visual Arts", logo: "/visual.jpg" },
  { name: "Gampaha Wickramarachchi University of Indigenous Medicine", location: "Yakkala", focus: "Indigenous Medicine", logo: "/gampaha.jpg" },
  { name: "University of Vavuniya", location: "Vavuniya", focus: "Business, Technology, Humanities", logo: "/vavuniya.jpg" }
];

const governmentInstitutes: DirectoryItem[] = [
  { name: "Sri Lanka Institute of Advanced Technological Education (SLIATE)", location: "Multiple", focus: "Technology Education" },
  { name: "National Institute of Business Management (NIBM)", location: "Colombo", focus: "Business Management" },
  { name: "Institute of Chemistry Ceylon", location: "Colombo", focus: "Chemistry" },
  { name: "Sri Lanka School of Agriculture", location: "Multiple", focus: "Agriculture" },
  { name: "National Institute of Fisheries and Nautical Engineering", location: "Colombo", focus: "Fisheries, Nautical" }
];

const privateInstitutes: DirectoryItem[] = [
  { name: "Sri Lanka Institute of Information Technology (SLIIT)", location: "Malabe", focus: "IT, Engineering, Business, Architecture" },
  { name: "NSBM Green University", location: "Homagama", focus: "IT, Business, Engineering" },
  { name: "Informatics Institute of Technology (IIT)", location: "Colombo", focus: "Computing, Business" },
  { name: "International Institute of Health Sciences (IIHS)", location: "Kalubowila", focus: "Nursing, Biomedical Sciences" },
  { name: "CINEC Campus", location: "Malabe", focus: "Maritime, Engineering, Management" },
  { name: "ICBT Campus", location: "Colombo, Kandy, Negombo", focus: "IT, Business, Engineering" },
  { name: "Horizon Campus", location: "Malabe", focus: "IT, Business, Law" },
  { name: "Colombo International Nautical and Engineering College", location: "Malabe", focus: "Maritime, Engineering" },
  { name: "British College of Applied Studies (BCAS)", location: "Colombo", focus: "IT, Business" },
  { name: "Australian College of Business and Technology (ACBT)", location: "Colombo", focus: "Business, IT" },
  { name: "Academy of Design (AOD)", location: "Colombo", focus: "Design, Fashion" },
  { name: "Rajarata University External Degrees", location: "Multiple", focus: "Management, IT" },
  { name: "University of Plymouth - SLIIT Campus", location: "Malabe", focus: "Engineering, Computing" },
  { name: "University of Central Lancashire - Sri Lanka", location: "Colombo", focus: "Law, Business, Computing" },
  { name: "University of Wales - Sri Lanka Campus", location: "Colombo", focus: "Business, IT, Law" },
  { name: "American College of Higher Education", location: "Colombo", focus: "Business, IT" },
  { name: "Lincoln University College (Sri Lanka Campus)", location: "Colombo", focus: "Business, IT, Law" },
  { name: "Imperial College of Business Studies", location: "Colombo", focus: "Business, Management" },
  { name: "European College of Business and Management", location: "Colombo", focus: "Business, Finance" },
  { name: "Sri Lanka Technological Campus", location: "Padukka", focus: "Engineering, Technology" }
];

const professionalInstitutes: DirectoryItem[] = [
  { name: "Institute of Bankers of Sri Lanka (IBSL)", location: "Colombo", focus: "Banking and Finance" },
  { name: "Chartered Institute of Management Accountants (CIMA)", location: "Colombo", focus: "Management Accounting" },
  { name: "Association of Accounting Technicians (AAT)", location: "Colombo", focus: "Accounting" },
  { name: "Sri Lanka Institute of Marketing (SLIM)", location: "Colombo", focus: "Marketing" },
  { name: "Institute of Chartered Accountants of Sri Lanka (CA Sri Lanka)", location: "Colombo", focus: "Chartered Accounting" },
  { name: "Sri Lanka Institute of Tourism and Hotel Management (SLITHM)", location: "Colombo", focus: "Tourism, Hospitality" }
];

const sections: DirectorySection[] = [
  {
    id: "government-universities",
    label: "Government Universities",
    title: "Public university network",
    subtitle: "Select a university card to view details.",
    fallbackImage: "/top-hero.png",
    items: governmentUniversities
  },
  {
    id: "government-higher",
    label: "Government Higher Institutes",
    title: "Applied and technical institutes",
    subtitle: "Select an institute card to view details.",
    fallbackImage: "/teacher.png",
    items: attachLogos(governmentInstitutes)
  },
  {
    id: "private-degree",
    label: "Private and Degree Institutes",
    title: "Private and international pathways",
    subtitle: "Select an institute card to view details.",
    fallbackImage: "/hero-student.png",
    items: attachLogos(privateInstitutes)
  },
  {
    id: "professional",
    label: "Professional Institutes",
    title: "Career-focused credential pathways",
    subtitle: "Select an institute card to view details.",
    fallbackImage: "/parent.png",
    items: attachLogos(professionalInstitutes)
  }
];

function initialsOf(name: string) {
  const words = name.split(" ").filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function getLocationDistricts(location: string) {
  const normalized = location.toLowerCase();
  return SRI_LANKA_DISTRICTS.filter((district) => normalized.includes(district.toLowerCase()));
}

export default function UniversityConnectPage() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          heading: "ශ්‍රී ලංකා විශ්වවිද්‍යාල සහ ආයතන පරිසරය",
          subheading: "අන්තර්ක්‍රියාත්මක කොටස් හරහා ශ්‍රී ලංකාවේ උසස් අධ්‍යාපන විකල්ප සොයා බලන්න.",
          districtFilters: "දිස්ත්‍රික් පෙරහන්",
          clearAll: "සියල්ල ඉවත් කරන්න",
          profile: "ආයතන පැතිකඩ",
          focus: "අධ්‍යයන අවධානය",
          clickHint: "පහළ කාඩ්පත් ක්ලික් කර පැතිකඩ තොරතුරු මාරු කරන්න.",
          empty: "තෝරාගත් දිස්ත්‍රික් පෙරහන් සඳහා මෙම කාණ්ඩයේ ආයතන නොමැත."
        }
      : language === "ta"
        ? {
            heading: "இலங்கை பல்கலைக்கழக மற்றும் நிறுவனர் சூழல்",
            subheading: "இலங்கையின் உயர்கல்வி விருப்பங்களை தொடர்பாடல் கூறுகள் மூலம் ஆராயுங்கள்.",
            districtFilters: "மாவட்ட வடிப்பான்கள்",
            clearAll: "அனைத்தையும் அழிக்கவும்",
            profile: "நிறுவன சுயவிவரம்",
            focus: "கல்வி கவனம்",
            clickHint: "கீழே உள்ள அட்டைகளை அழுத்தி சுயவிவர விவரங்களை மாற்றுங்கள்.",
            empty: "தேர்ந்தெடுத்த மாவட்ட வடிப்பான்களுக்கு இந்த பிரிவில் நிறுவனங்கள் இல்லை."
          }
        : {
            heading: "Sri Lankan university and institute ecosystem",
            subheading: "Explore Sri Lanka's higher education options through interactive components.",
            districtFilters: "District filters",
            clearAll: "Clear all",
            profile: "Institution Profile",
            focus: "Academic Focus",
            clickHint: "Click any component card below to switch profile details.",
            empty: "No institutions found for the selected district filters in this category."
          };

  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const [selectedBySection, setSelectedBySection] = useState<Record<string, string>>({});

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId]
  );

  const serviceDistricts = useMemo(
    () => Array.from(new Set(activeSection.items.flatMap((item) => getLocationDistricts(item.location)))),
    [activeSection]
  );
  const visibleItems = activeSection.items;

  const selectedName = selectedBySection[activeSection.id];
  const selectedItem =
    visibleItems.find((item) => item.name === selectedName) ?? visibleItems[0] ?? activeSection.items[0];

  const selectItem = (index: number) => {
    const item = visibleItems[index];
    if (!item) return;
    setSelectedBySection((previous) => ({ ...previous, [activeSection.id]: item.name }));
  };

  return (
    <div className="w-full pb-10 pt-0">
      <section className="w-full bg-gradient-to-br from-[#0b1f45] via-[#102a59] to-[#0c1d3d]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-slate-100 md:text-5xl">
              {text.heading}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-blue-100/90">
              {text.subheading}
            </p>
          </div>
          <div className="w-full justify-self-center lg:justify-self-end">
            <SriLankaDistrictMap
              selectedDistricts={[]}
              serviceDistricts={serviceDistricts}
              selectable={false}
              minimal
            />
          </div>
        </div>
      </section>

      <div className="w-full bg-white py-8 text-slate-900">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "border border-slate-200 text-slate-700 hover:border-primary/30 hover:text-primary"
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        <section className="space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">{activeSection.title}</h2>
            <p className="text-slate-600">{activeSection.subtitle}</p>
          </div>

          {selectedItem ? (
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="relative min-h-[340px] overflow-hidden rounded-3xl">
                <Image
                  src={selectedItem.logo ?? activeSection.fallbackImage}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">{text.profile}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedItem.name}</h3>
                <p className="mt-1 text-slate-600">{selectedItem.location}</p>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">{text.focus}</p>
                  <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                    {selectedItem.focus.split(",").map((focus) => (
                      <li
                        key={`${selectedItem.name}-${focus.trim()}`}
                        className="rounded-lg border border-blue-100/70 bg-blue-50/55 px-3 py-2"
                      >
                        {focus.trim()}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-5 text-sm text-slate-500">{text.clickHint}</p>
              </article>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              {text.empty}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item, index) => {
              const isSelected = item.name === selectedItem?.name;

              return (
                <button
                  key={`${activeSection.id}-${item.name}`}
                  type="button"
                  onClick={() => selectItem(index)}
                  className={clsx(
                    "rounded-2xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-primary/35 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                      {item.logo ? (
                        <Image src={item.logo} alt={`${item.name} logo`} fill className="object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-500">
                          {initialsOf(item.name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.location}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}

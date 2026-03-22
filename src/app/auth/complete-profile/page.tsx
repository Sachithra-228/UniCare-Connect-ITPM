"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage, type Language } from "@/context/language-context";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { getDashboardPathForRole } from "@/lib/auth-redirect";
import { optionalUrlSchema, sriLankaPhoneSchema } from "@/lib/validation";
import {
  OTHER_UNIVERSITY_VALUE,
  getDegreeProgramsForUniversity,
  isOtherSelection,
  localizeSignupOptionLabel
} from "@/lib/signup-data";
import { getRoleConfigs, type UserRole } from "@/lib/signup-role-config";
import { UniversityPicker } from "@/components/auth/university-picker";
import { RolePicker } from "@/components/auth/role-picker";
import { DegreePicker } from "@/components/auth/degree-picker";
import Link from "next/link";

type FormData = {
  role: UserRole | "";
  fieldA: string;
  fieldB: string;
  fieldC: string;
  fieldAOther: string;
  fieldBOther: string;
};

const INITIAL: FormData = {
  role: "",
  fieldA: "",
  fieldB: "",
  fieldC: "",
  fieldAOther: "",
  fieldBOther: ""
};

function resolveFieldA(data: FormData): string {
  if (data.fieldA === OTHER_UNIVERSITY_VALUE) return data.fieldAOther.trim();
  return data.fieldA.trim();
}

function resolveFieldB(data: FormData): string {
  if (isOtherSelection(data.fieldB)) return data.fieldBOther.trim();
  return data.fieldB.trim();
}

type CompleteProfileText = {
  selectRoleError: string;
  selectOrEnterUniversity: string;
  selectOrEnterDegree: string;
  enterField: (fieldLabel: string) => string;
  enterValidUrl: string;
  invalidPhone: string;
  completeRequired: string;
  saveFailed: string;
  somethingWentWrong: string;
  loading: string;
  title: string;
  subtitle: string;
  name: string;
  email: string;
  selectRole: string;
  rolePlaceholder: string;
  roleAria: string;
  universityPlaceholder: string;
  enterUniversityName: string;
  degreePlaceholder: string;
  degreeAria: string;
  enterDegreeProgram: string;
  pleaseSpecify: string;
  optionalLabel: string;
  saving: string;
  saveContinue: string;
  signOutAnother: string;
};

const COMPLETE_PROFILE_TEXT: Record<Language, CompleteProfileText> = {
  en: {
    selectRoleError: "Please select your role.",
    selectOrEnterUniversity: "Please select or enter your university.",
    selectOrEnterDegree: "Please select or enter your degree program.",
    enterField: (fieldLabel) => `Please enter ${fieldLabel.toLowerCase()}.`,
    enterValidUrl: "Enter a valid URL (e.g. https://linkedin.com/in/username).",
    invalidPhone: "Invalid phone number.",
    completeRequired: "Please complete the required fields.",
    saveFailed: "Failed to save profile. Please try again.",
    somethingWentWrong: "Something went wrong. Please try again.",
    loading: "Loading...",
    title: "Complete your profile",
    subtitle:
      "You signed in with Google. Choose your role and add a few details so we can take you to the right dashboard.",
    name: "Name",
    email: "Email",
    selectRole: "Select your role",
    rolePlaceholder: "Search or choose your role",
    roleAria: "Role",
    universityPlaceholder: "Search or choose your university",
    enterUniversityName: "Enter university name",
    degreePlaceholder: "Search or select degree program",
    degreeAria: "Degree program",
    enterDegreeProgram: "Enter degree program",
    pleaseSpecify: "Please specify",
    optionalLabel: "(Optional)",
    saving: "Saving...",
    saveContinue: "Save and continue",
    signOutAnother: "Sign out and use another account"
  },
  si: {
    selectRoleError: "කරුණාකර ඔබගේ භූමිකාව තෝරන්න.",
    selectOrEnterUniversity: "කරුණාකර ඔබගේ විශ්වවිද්‍යාලය තෝරන්න හෝ ඇතුළත් කරන්න.",
    selectOrEnterDegree: "කරුණාකර ඔබගේ උපාධි වැඩසටහන තෝරන්න හෝ ඇතුළත් කරන්න.",
    enterField: (fieldLabel) => `${fieldLabel} ඇතුළත් කරන්න.`,
    enterValidUrl: "වලංගු URL එකක් ඇතුළත් කරන්න (උදා: https://linkedin.com/in/username).",
    invalidPhone: "වලංගු නොවන දුරකථන අංකය.",
    completeRequired: "කරුණාකර අවශ්‍ය ක්ෂේත්‍ර පුරවන්න.",
    saveFailed: "පැතිකඩ සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
    somethingWentWrong: "යම් දෝෂයක් ඇතිවිය. නැවත උත්සාහ කරන්න.",
    loading: "පූරණය වෙමින්...",
    title: "ඔබගේ පැතිකඩ සම්පූර්ණ කරන්න",
    subtitle:
      "ඔබ Google මඟින් පිවිසී ඇත. නිවැරදි ඩෑෂ්බෝඩ් එකට ගෙන යාමට ඔබගේ භූමිකාව තෝරා තොරතුරු කිහිපයක් එක් කරන්න.",
    name: "නම",
    email: "ඊමේල්",
    selectRole: "ඔබගේ භූමිකාව තෝරන්න",
    rolePlaceholder: "ඔබගේ භූමිකාව සොයන්න හෝ තෝරන්න",
    roleAria: "භූමිකාව",
    universityPlaceholder: "ඔබගේ විශ්වවිද්‍යාලය සොයන්න හෝ තෝරන්න",
    enterUniversityName: "විශ්වවිද්‍යාල නම ඇතුළත් කරන්න",
    degreePlaceholder: "උපාධි වැඩසටහන සොයන්න හෝ තෝරන්න",
    degreeAria: "උපාධි වැඩසටහන",
    enterDegreeProgram: "උපාධි වැඩසටහන ඇතුළත් කරන්න",
    pleaseSpecify: "විස්තර කරන්න",
    optionalLabel: "(විකල්ප)",
    saving: "සුරකිමින්...",
    saveContinue: "සුරකින්න සහ ඉදිරියට යන්න",
    signOutAnother: "ඉවත් වී වෙනත් ගිණුමක් භාවිතා කරන්න"
  },
  ta: {
    selectRoleError: "தயவுசெய்து உங்கள் பங்கை தேர்ந்தெடுக்கவும்.",
    selectOrEnterUniversity: "தயவுசெய்து உங்கள் பல்கலைக்கழகத்தை தேர்ந்தெடுக்கவும் அல்லது உள்ளிடவும்.",
    selectOrEnterDegree: "தயவுசெய்து உங்கள் பட்டப்படிப்பு திட்டத்தை தேர்ந்தெடுக்கவும் அல்லது உள்ளிடவும்.",
    enterField: (fieldLabel) => `${fieldLabel} ஐ உள்ளிடவும்.`,
    enterValidUrl: "சரியான URL ஐ உள்ளிடவும் (எ.கா. https://linkedin.com/in/username).",
    invalidPhone: "தவறான தொலைபேசி எண்.",
    completeRequired: "தயவுசெய்து தேவையான புலங்களை பூர்த்தி செய்யவும்.",
    saveFailed: "சுயவிவரத்தை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    somethingWentWrong: "ஏதோ பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    loading: "ஏற்றப்படுகிறது...",
    title: "உங்கள் சுயவிவரத்தை பூர்த்தி செய்யவும்",
    subtitle:
      "நீங்கள் Google மூலம் உள்நுழைந்துள்ளீர்கள். சரியான டாஷ்போர்டுக்கு செல்ல உங்கள் பங்கை தேர்ந்து சில விவரங்களை சேர்க்கவும்.",
    name: "பெயர்",
    email: "மின்னஞ்சல்",
    selectRole: "உங்கள் பங்கை தேர்ந்தெடுக்கவும்",
    rolePlaceholder: "உங்கள் பங்கை தேடவும் அல்லது தேர்ந்தெடுக்கவும்",
    roleAria: "பங்கு",
    universityPlaceholder: "உங்கள் பல்கலைக்கழகத்தை தேடவும் அல்லது தேர்ந்தெடுக்கவும்",
    enterUniversityName: "பல்கலைக்கழக பெயரை உள்ளிடவும்",
    degreePlaceholder: "பட்டப்படிப்பு திட்டத்தை தேடவும் அல்லது தேர்ந்தெடுக்கவும்",
    degreeAria: "பட்டப்படிப்பு திட்டம்",
    enterDegreeProgram: "பட்டப்படிப்பு திட்டத்தை உள்ளிடவும்",
    pleaseSpecify: "தயவுசெய்து குறிப்பிடவும்",
    optionalLabel: "(விருப்பம்)",
    saving: "சேமிக்கப்படுகிறது...",
    saveContinue: "சேமித்து தொடரவும்",
    signOutAnother: "வெளியேறி வேறு கணக்கைப் பயன்படுத்தவும்"
  }
};

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const t = COMPLETE_PROFILE_TEXT[language];
  const roleConfigs = getRoleConfigs(language);

  const [form, setForm] = useState<FormData>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<{ fieldA?: string; fieldB?: string; fieldC?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as { user?: { needsProfileCompletion?: boolean; role?: string } };
      if (!data.user?.needsProfileCompletion) {
        router.replace(getDashboardPathForRole(data.user?.role));
        return;
      }
      setChecking(false);
    }
    check();
  }, [router]);

  const update = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const config = form.role ? roleConfigs[form.role] : null;
  const isStudent = form.role === "student";
  const degreePrograms = isStudent
    ? getDegreeProgramsForUniversity(form.fieldA === OTHER_UNIVERSITY_VALUE ? "" : form.fieldA)
    : [];

  const validate = (): boolean => {
    if (!config) {
      setSubmitError(t.selectRoleError);
      return false;
    }

    setFieldErrors({});
    const err: { fieldA?: string; fieldB?: string; fieldC?: string } = {};
    const a = resolveFieldA(form);
    const b = resolveFieldB(form);
    const c = form.fieldC.trim();

    if (!a) {
      err.fieldA =
        config.field1Kind === "university"
          ? t.selectOrEnterUniversity
          : t.enterField(config.fields[0].label.replace(" (Optional)", ""));
    }

    if (!b) {
      err.fieldB =
        config.field2Kind === "degree"
          ? t.selectOrEnterDegree
          : t.enterField(config.fields[1].label.replace(" (Optional)", ""));
    }

    const field3Optional = config.fields[2].optional;
    if (!field3Optional && !c) {
      err.fieldC = t.enterField(config.fields[2].label.replace(" (Optional)", ""));
    } else if (c) {
      if (config.fields[2].type === "url") {
        const result = optionalUrlSchema.safeParse(c);
        if (!result.success) err.fieldC = t.enterValidUrl;
      } else if (config.fields[2].type === "tel") {
        const result = sriLankaPhoneSchema.safeParse(c);
        if (!result.success) err.fieldC = result.error.errors[0]?.message ?? t.invalidPhone;
      }
    }

    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      setSubmitError(t.completeRequired);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate() || !form.role || !user) return;

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.firebaseUid ?? undefined,
          email: user.email,
          name: user.name,
          role: form.role,
          roleDetails: {
            fieldA: resolveFieldA(form),
            fieldB: resolveFieldB(form),
            fieldC: form.fieldC.trim()
          },
          needsProfileCompletion: false
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError((data as { error?: string }).error ?? t.saveFailed);
        setLoading(false);
        return;
      }

      const path = getDashboardPathForRole(form.role);
      window.location.href = path;
    } catch {
      setSubmitError(t.somethingWentWrong);
      setLoading(false);
    }
  };

  if (checking || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-500">{t.loading}</p>
      </div>
    );
  }

  const roleOptions = (Object.keys(roleConfigs) as UserRole[]).map((role) => ({
    value: role,
    label: roleConfigs[role].label
  }));

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <p>
            <span className="font-medium">{t.name}:</span> {user.name}
          </p>
          <p>
            <span className="font-medium">{t.email}:</span> {user.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              {t.selectRole} <span className="text-red-500">*</span>
            </label>
            <RolePicker
              options={roleOptions}
              value={form.role}
              onChange={(v) => update("role", v)}
              placeholder={t.rolePlaceholder}
              aria-label={t.roleAria}
            />
            {config && <p className="text-xs text-slate-500">{config.helper}</p>}
          </div>

          {config && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  {config.fields[0].label}
                  {!config.fields[0].optional && <span className="text-red-500">*</span>}
                </label>
                {config.field1Kind === "university" ? (
                  <>
                    <UniversityPicker
                      value={form.fieldA}
                      onChange={(v) => {
                        update("fieldA", v);
                        if (v !== OTHER_UNIVERSITY_VALUE) update("fieldB", "");
                      }}
                      placeholder={t.universityPlaceholder}
                    />
                    {form.fieldA === OTHER_UNIVERSITY_VALUE && (
                      <Input
                        value={form.fieldAOther}
                        onChange={(e) => update("fieldAOther", e.target.value)}
                        placeholder={t.enterUniversityName}
                        className="mt-2"
                      />
                    )}
                  </>
                ) : (
                  <Input
                    value={form.fieldA}
                    onChange={(e) => update("fieldA", e.target.value)}
                    placeholder={config.fields[0].placeholder}
                  />
                )}
                {fieldErrors.fieldA && <p className="text-xs text-red-500">{fieldErrors.fieldA}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  {config.fields[1].label}
                  {!config.fields[1].optional && <span className="text-red-500">*</span>}
                </label>
                {config.field2Kind === "degree" ? (
                  <>
                    <DegreePicker
                      options={degreePrograms}
                      value={form.fieldB}
                      onChange={(v) => update("fieldB", v)}
                      placeholder={t.degreePlaceholder}
                      disabled={!resolveFieldA(form)}
                      aria-label={t.degreeAria}
                    />
                    {isOtherSelection(form.fieldB) && (
                      <Input
                        value={form.fieldBOther}
                        onChange={(e) => update("fieldBOther", e.target.value)}
                        placeholder={t.enterDegreeProgram}
                        className="mt-2"
                      />
                    )}
                  </>
                ) : config.field2Kind === "dropdown" && config.field2Options ? (
                  <>
                    <select
                      value={form.fieldB}
                      onChange={(e) => update("fieldB", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="">{config.fields[1].placeholder}</option>
                      {config.field2Options.map((opt) => (
                        <option key={opt} value={opt}>
                          {localizeSignupOptionLabel(opt, language)}
                        </option>
                      ))}
                    </select>
                    {isOtherSelection(form.fieldB) && (
                      <Input
                        value={form.fieldBOther}
                        onChange={(e) => update("fieldBOther", e.target.value)}
                        placeholder={t.pleaseSpecify}
                        className="mt-2"
                      />
                    )}
                  </>
                ) : (
                  <Input
                    value={form.fieldB}
                    onChange={(e) => update("fieldB", e.target.value)}
                    placeholder={config.fields[1].placeholder}
                  />
                )}
                {fieldErrors.fieldB && <p className="text-xs text-red-500">{fieldErrors.fieldB}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  {config.fields[2].label}
                  {!config.fields[2].optional && <span className="text-red-500"> *</span>}
                  {config.fields[2].optional && (
                    <span className="ml-1 text-slate-400">{t.optionalLabel}</span>
                  )}
                </label>
                {config.fields[2].type === "tel" ? (
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.fieldC}
                    onChange={(e) => update("fieldC", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder={config.fields[2].placeholder}
                  />
                ) : (
                  <Input
                    type={config.fields[2].type ?? "text"}
                    value={form.fieldC}
                    onChange={(e) => update("fieldC", e.target.value)}
                    placeholder={config.fields[2].placeholder}
                  />
                )}
                {config.fields[2].helpText && (
                  <p className="text-xs text-slate-500">{config.fields[2].helpText}</p>
                )}
                {fieldErrors.fieldC && <p className="text-xs text-red-500">{fieldErrors.fieldC}</p>}
              </div>
            </>
          )}

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? t.saving : t.saveContinue}
            </Button>
            <Link href="/login" className="text-sm text-slate-500 hover:underline">
              {t.signOutAnother}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

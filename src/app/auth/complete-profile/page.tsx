"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { getDashboardPathForRole } from "@/lib/auth-redirect";
import { optionalUrlSchema, sriLankaPhoneSchema } from "@/lib/validation";
import {
  OTHER_UNIVERSITY_VALUE,
  getDegreeProgramsForUniversity,
  OTHER_DEGREE_VALUE
} from "@/lib/signup-data";
import { ROLE_CONFIGS, type UserRole } from "@/lib/signup-role-config";
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
  const otherValues = [OTHER_DEGREE_VALUE, "Other (Please specify)", "Other"];
  if (otherValues.includes(data.fieldB)) return data.fieldBOther.trim();
  return data.fieldB.trim();
}

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
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

  const config = form.role ? ROLE_CONFIGS[form.role] : null;
  const isStudent = form.role === "student";
  const isUniversityRole = form.role === "student" || form.role === "admin";
  const degreePrograms = isStudent ? getDegreeProgramsForUniversity(form.fieldA === OTHER_UNIVERSITY_VALUE ? "" : form.fieldA) : [];

  const validate = (): boolean => {
    if (!config) {
      setSubmitError("Please select your role.");
      return false;
    }
    setFieldErrors({});
    const err: { fieldA?: string; fieldB?: string; fieldC?: string } = {};
    const a = resolveFieldA(form);
    const b = resolveFieldB(form);
    const c = form.fieldC.trim();

    if (!a) err.fieldA = config.field1Kind === "university" ? "Please select or enter your university." : `Please enter ${config.fields[0].label.toLowerCase()}.`;
    if (!b) err.fieldB = config.field2Kind === "degree" ? "Please select or enter your degree program." : `Please enter ${config.fields[1].label.toLowerCase()}.`;
    const field3Optional = config.fields[2].optional;
    if (!field3Optional && !c) err.fieldC = `Please enter ${config.fields[2].label.replace(" (Optional)", "").toLowerCase()}.`;
    else if (c) {
      if (config.fields[2].type === "url") {
        const r = optionalUrlSchema.safeParse(c);
        if (!r.success) err.fieldC = "Enter a valid URL (e.g. https://linkedin.com/in/username).";
      } else if (config.fields[2].type === "tel") {
        const r = sriLankaPhoneSchema.safeParse(c);
        if (!r.success) err.fieldC = r.error.errors[0]?.message ?? "Invalid phone number.";
      }
    }

    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      setSubmitError("Please complete the required fields.");
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
        setSubmitError((data as { error?: string }).error ?? "Failed to save profile. Please try again.");
        setLoading(false);
        return;
      }
      const path = getDashboardPathForRole(form.role);
      window.location.href = path;
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (checking || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  const roleOptions = (Object.keys(ROLE_CONFIGS) as UserRole[]).map((role) => ({
    value: role,
    label: ROLE_CONFIGS[role].label
  }));

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Complete your profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          You signed in with Google. Choose your role and add a few details so we can take you to the right dashboard.
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <p><span className="font-medium">Name:</span> {user.name}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Select your role <span className="text-red-500">*</span></label>
            <RolePicker
              options={roleOptions}
              value={form.role}
              onChange={(v) => update("role", v)}
              placeholder="Search or choose your role"
              aria-label="Role"
            />
            {config && <p className="text-xs text-slate-500">{config.helper}</p>}
          </div>

          {config && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">{config.fields[0].label} {!config.fields[0].optional && <span className="text-red-500">*</span>}</label>
                {config.field1Kind === "university" ? (
                  <>
                    <UniversityPicker
                      value={form.fieldA}
                      onChange={(v) => { update("fieldA", v); if (v !== OTHER_UNIVERSITY_VALUE) update("fieldB", ""); }}
                      placeholder="Search or choose your university"
                    />
                    {form.fieldA === OTHER_UNIVERSITY_VALUE && (
                      <Input
                        value={form.fieldAOther}
                        onChange={(e) => update("fieldAOther", e.target.value)}
                        placeholder="Enter university name"
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
                <label className="text-sm font-medium text-slate-900">{config.fields[1].label} {!config.fields[1].optional && <span className="text-red-500">*</span>}</label>
                {config.field2Kind === "degree" ? (
                  <>
                    <DegreePicker
                      options={degreePrograms}
                      value={form.fieldB}
                      onChange={(v) => update("fieldB", v)}
                      placeholder="Search or select degree program"
                      disabled={!resolveFieldA(form)}
                    />
                    {(form.fieldB === OTHER_DEGREE_VALUE || form.fieldB === "Other (Please specify)" || form.fieldB === "Other") && (
                      <Input
                        value={form.fieldBOther}
                        onChange={(e) => update("fieldBOther", e.target.value)}
                        placeholder="Enter degree program"
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
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {form.fieldB === "Other (Please specify)" && (
                      <Input
                        value={form.fieldBOther}
                        onChange={(e) => update("fieldBOther", e.target.value)}
                        placeholder="Please specify"
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
                  {config.fields[2].optional && <span className="ml-1 text-slate-400">(Optional)</span>}
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
                {config.fields[2].helpText && <p className="text-xs text-slate-500">{config.fields[2].helpText}</p>}
                {fieldErrors.fieldC && <p className="text-xs text-red-500">{fieldErrors.fieldC}</p>}
              </div>
            </>
          )}

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save and continue"}
            </Button>
            <Link href="/login" className="text-sm text-slate-500 hover:underline">
              Sign out and use another account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

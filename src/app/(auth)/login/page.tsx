"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { getDashboardPathForRole } from "@/lib/auth-redirect";
import { loginSchema, registerSchema, optionalUrlSchema, sriLankaPhoneSchema } from "@/lib/validation";
import { UserRole as AppUserRole } from "@/types";
import {
  OTHER_UNIVERSITY_VALUE,
  getDegreeProgramsForUniversity,
  OTHER_DEGREE_VALUE
} from "@/lib/signup-data";
import { ROLE_CONFIGS, type UserRole } from "@/lib/signup-role-config";
import { UniversityPicker } from "@/components/auth/university-picker";
import { RolePicker } from "@/components/auth/role-picker";
import { DegreePicker } from "@/components/auth/degree-picker";

type AuthMode = "signin" | "signup";

type SignUpData = {
  role: UserRole | "";
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  fieldA: string;
  fieldB: string;
  fieldC: string;
  fieldAOther: string;
  fieldBOther: string;
  acceptedTerms: boolean;
};

const INITIAL_SIGNUP_DATA: SignUpData = {
  role: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  fieldA: "",
  fieldB: "",
  fieldC: "",
  fieldAOther: "",
  fieldBOther: "",
  acceptedTerms: false
};

function resolveFieldA(data: SignUpData): string {
  if (data.fieldA === OTHER_UNIVERSITY_VALUE) return data.fieldAOther.trim();
  return data.fieldA.trim();
}
function resolveFieldB(data: SignUpData): string {
  const otherValues = [OTHER_DEGREE_VALUE, "Other (Please specify)", "Other"];
  if (otherValues.includes(data.fieldB)) return data.fieldBOther.trim();
  return data.fieldB.trim();
}

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, registerWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const isVerifiedRedirect = searchParams.get("verified") === "1";
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [signUpPopupMessage, setSignUpPopupMessage] = useState<string | null>(null);
  const [signUpStep, setSignUpStep] = useState(1);
  const [signUpData, setSignUpData] = useState<SignUpData>(INITIAL_SIGNUP_DATA);
  const [recentlyRegisteredEmail, setRecentlyRegisteredEmail] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fieldA?: string; fieldB?: string; fieldC?: string }>({});
  const [step2Errors, setStep2Errors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const selectedRoleConfig = signUpData.role ? ROLE_CONFIGS[signUpData.role] : null;
  const isStudent = signUpData.role === "student";
  const isUniversityRole = signUpData.role === "student" || signUpData.role === "admin";
  const degreePrograms = isStudent
    ? getDegreeProgramsForUniversity(
        signUpData.fieldA === OTHER_UNIVERSITY_VALUE ? "" : signUpData.fieldA
      )
    : [];

  const isDatabaseErrorMessage = (msg: string) =>
    /Mongo|MONGODB|connection|ECONNREFUSED|ETIMEDOUT|timed out|not configured/i.test(msg);

  const getReadableAuthError = (error: unknown) => {
    if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
      return "Please verify your email first, then sign in.";
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return "No account profile found. Please contact support.";
    }
    if (error instanceof Error && error.message === "ACCOUNT_DELETED") {
      return "This account has been deleted.";
    }
    if (error instanceof Error && error.message === "ACCOUNT_BLOCKED") {
      return "Your account is blocked. Please contact support.";
    }
    if (error instanceof Error && error.message === "DB_CONNECTION_FAILED") {
      return "Database connection failed. Please try again in a minute.";
    }
    if (error instanceof Error && isDatabaseErrorMessage(error.message)) {
      return `Database connection failed. ${error.message}`;
    }
    if (error instanceof Error && error.message === "SIGNIN_PRECHECK_FAILED") {
      return "Unable to validate account status right now. Please try again.";
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;

      if (code === "auth/invalid-credential") {
        return "Incorrect email or password. Please try again.";
      }
      if (code === "auth/user-not-found") {
        return "No account found for this email.";
      }
      if (code === "auth/wrong-password") {
        return "Incorrect password. Please try again.";
      }
      if (code === "auth/too-many-requests") {
        return "Too many login attempts. Please wait and try again.";
      }
      if (code === "auth/network-request-failed") {
        return "Network issue. Check your connection and try again.";
      }
      if (code === "auth/invalid-email") {
        return "Please enter a valid email address.";
      }
    }

    return "Unable to sign in. Please try again.";
  };

  const getPostSignInPath = async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) {
      return "/dashboard";
    }

    const data = (await response.json()) as {
      user?: { role?: string; needsProfileCompletion?: boolean };
    };
    if (data.user?.needsProfileCompletion) {
      return "/auth/complete-profile";
    }
    return getDashboardPathForRole(data.user?.role);
  };

  const getReadableSignUpError = (error: unknown) => {
    if (error instanceof Error && error.message === "ACCOUNT_SYNC_FAILED") {
      return "Account creation failed while saving your profile. Please try again.";
    }
    if (error instanceof Error && error.message === "DB_CONNECTION_FAILED") {
      return "Database connection failed. Please try again in a minute.";
    }
    if (error instanceof Error && isDatabaseErrorMessage(error.message)) {
      return `Database connection failed. ${error.message}`;
    }
    if (error instanceof Error && error.message === "VERIFICATION_EMAIL_SEND_FAILED") {
      return "Your account was created, but verification email failed. Please try again.";
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;

      if (code === "auth/email-already-in-use") {
        return "An account with this email already exists.";
      }
      if (code === "auth/invalid-email") {
        return "Please enter a valid email address.";
      }
      if (code === "auth/weak-password") {
        return "Use a stronger password (at least 6 characters).";
      }
      if (code === "auth/network-request-failed") {
        return "Network issue. Check your connection and try again.";
      }
    }

    return "Unable to create account. Please try again.";
  };

  const handleSignInSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignInError(null);

    const data = new FormData(event.currentTarget);
    const values = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? "")
    };

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setSignInError("Please provide a valid email and password.");
      return;
    }

    try {
      await signInWithEmail(result.data.email, result.data.password);
      const nextPath = await getPostSignInPath();
      router.push(nextPath);
    } catch (error) {
      setSignInError(getReadableAuthError(error));
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInError(null);
    try {
      await signInWithGoogle();
      const nextPath = await getPostSignInPath();
      router.push(nextPath);
    } catch (error) {
      setSignInError(getReadableAuthError(error));
    }
  };

  const updateSignUpField = (field: keyof SignUpData, value: string | boolean) => {
    setSignUpData((previous) => ({ ...previous, [field]: value }));
  };

  const validateSignUpStep = (step: number): string | null => {
    setFieldErrors({});
    if (step === 1) {
      if (!signUpData.role) return "Please select your role to continue.";
      return null;
    }

    if (step === 2) {
      setStep2Errors({});
      const err: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
      if (!signUpData.name.trim()) err.name = "Full name is required.";
      else if (signUpData.name.trim().length < 2) err.name = "Please enter at least 2 characters.";
      const emailResult = registerSchema.shape.email.safeParse(signUpData.email);
      if (!signUpData.email.trim()) err.email = "Email is required.";
      else if (!emailResult.success) err.email = "Please enter a valid email address.";
      if (!signUpData.password) err.password = "Password is required.";
      else if (signUpData.password.length < 6) err.password = "Password must be at least 6 characters.";
      if (!signUpData.confirmPassword) err.confirmPassword = "Please confirm your password.";
      else if (signUpData.password !== signUpData.confirmPassword)
        err.confirmPassword = "Passwords do not match.";
      if (Object.keys(err).length > 0) {
        setStep2Errors(err);
        return "Please complete all required fields and fix any errors.";
      }
      return null;
    }

    if (step === 3 && selectedRoleConfig) {
      const a = resolveFieldA(signUpData);
      const b = resolveFieldB(signUpData);
      const c = signUpData.fieldC.trim();
      const err: { fieldA?: string; fieldB?: string; fieldC?: string } = {};

      if (!a) {
        err.fieldA =
          selectedRoleConfig.field1Kind === "university"
            ? "Please select or enter your university."
            : `Please enter ${selectedRoleConfig.fields[0].label.toLowerCase()}.`;
      }
      if (!b) {
        err.fieldB =
          selectedRoleConfig.field2Kind === "degree"
            ? "Please select or enter your degree program."
            : `Please enter ${selectedRoleConfig.fields[1].label.toLowerCase()}.`;
      }

      const field3Optional = selectedRoleConfig.fields[2].optional;
      if (!field3Optional && !c) {
        err.fieldC = `Please enter ${selectedRoleConfig.fields[2].label.replace(" (Optional)", "").toLowerCase()}.`;
      } else if (c) {
        if (selectedRoleConfig.fields[2].type === "url") {
          const urlResult = optionalUrlSchema.safeParse(c);
          if (!urlResult.success) err.fieldC = urlResult.error.errors[0]?.message ?? "Invalid URL.";
        } else if (selectedRoleConfig.fields[2].type === "tel") {
          const phoneResult = sriLankaPhoneSchema.safeParse(c);
          if (!phoneResult.success) err.fieldC = phoneResult.error.errors[0]?.message ?? "Invalid phone number.";
        }
      }

      if (Object.keys(err).length > 0) {
        setFieldErrors(err);
        return "Please complete the required fields and fix any errors.";
      }
      return null;
    }

    if (!signUpData.acceptedTerms) {
      return "Please accept the terms to create your account.";
    }
    return null;
  };

  const goToNextSignUpStep = () => {
    setSignUpError(null);
    const error = validateSignUpStep(signUpStep);
    if (error) {
      setSignUpError(error);
      return;
    }

    setSignUpStep((previous) => Math.min(4, previous + 1));
  };

  const goToPreviousSignUpStep = () => {
    setSignUpError(null);
    setFieldErrors({});
    setStep2Errors({});
    setSignUpStep((previous) => Math.max(1, previous - 1));
  };

  const handleSignUpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    const error = validateSignUpStep(4);
    if (error) {
      setSignUpError(error);
      return;
    }

    try {
      await registerWithEmail(signUpData.email, signUpData.password, {
        name: signUpData.name,
        role: signUpData.role || undefined,
        fieldA: resolveFieldA(signUpData),
        fieldB: resolveFieldB(signUpData),
        fieldC: signUpData.fieldC.trim()
      });
      const successMessage =
        "Your account was created successfully. Please check your email and verify your account before signing in.";
      setRecentlyRegisteredEmail(signUpData.email);
      setSignUpSuccess(successMessage);
      setSignUpPopupMessage(successMessage);
      setMode("signin");
      setSignUpStep(1);
      setSignUpData(INITIAL_SIGNUP_DATA);
    } catch (error) {
      setSignUpError(getReadableSignUpError(error));
    }
  };

  const renderSignUpStep = () => {
    if (signUpStep === 1) {
      const roleOptions = (Object.keys(ROLE_CONFIGS) as UserRole[]).map((role) => ({
        value: role,
        label: ROLE_CONFIGS[role].label
      }));
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="role">
            Select your role
          </label>
          <RolePicker
            id="role"
            options={roleOptions}
            value={signUpData.role}
            onChange={(v) => updateSignUpField("role", v)}
            placeholder="Search or choose your role"
            aria-label="Role"
          />
          {selectedRoleConfig ? (
            <p className="text-xs text-slate-500">{selectedRoleConfig.helper}</p>
          ) : null}
        </div>
      );
    }

    if (signUpStep === 2) {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-name">
              Full name <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-name"
              value={signUpData.name}
              onChange={(event) => {
                updateSignUpField("name", event.target.value);
                if (step2Errors.name) setStep2Errors((e) => ({ ...e, name: undefined }));
              }}
              placeholder="Your full name"
              required
              className={step2Errors.name ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.name && <p className="text-xs text-red-500">{step2Errors.name}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-email">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-email"
              type="email"
              value={signUpData.email}
              onChange={(event) => {
                updateSignUpField("email", event.target.value);
                if (step2Errors.email) setStep2Errors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="name@domain.com"
              required
              className={step2Errors.email ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.email && <p className="text-xs text-red-500">{step2Errors.email}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-password">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-password"
              type="password"
              value={signUpData.password}
              onChange={(event) => {
                updateSignUpField("password", event.target.value);
                if (step2Errors.password) setStep2Errors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="Minimum 6 characters"
              required
              className={step2Errors.password ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.password && <p className="text-xs text-red-500">{step2Errors.password}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-confirm-password">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-confirm-password"
              type="password"
              value={signUpData.confirmPassword}
              onChange={(event) => {
                updateSignUpField("confirmPassword", event.target.value);
                if (step2Errors.confirmPassword) setStep2Errors((e) => ({ ...e, confirmPassword: undefined }));
              }}
              placeholder="Re-enter password"
              required
              className={step2Errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.confirmPassword && (
              <p className="text-xs text-red-500">{step2Errors.confirmPassword}</p>
            )}
          </div>
        </div>
      );
    }

    if (signUpStep === 3 && selectedRoleConfig) {
      const config = selectedRoleConfig;
      const f1 = config.fields[0];
      const f2 = config.fields[1];
      const f3 = config.fields[2];
      const showFieldAOther = isUniversityRole && signUpData.fieldA === OTHER_UNIVERSITY_VALUE;
      const isFieldBOther =
        signUpData.fieldB === OTHER_DEGREE_VALUE ||
        signUpData.fieldB === "Other (Please specify)" ||
        signUpData.fieldB === "Other";
      const showFieldBOther =
        (isStudent && isFieldBOther) ||
        (!isStudent && config.field2Kind === "dropdown" && signUpData.fieldB === "Other (Please specify)");

      return (
        <div className="grid gap-4">
          {/* Field 1 - University dropdown or text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="fieldA">
              {f1.label}
              {!f1.optional && <span className="text-red-500"> *</span>}
            </label>
            {config.field1Kind === "university" ? (
              <>
                <UniversityPicker
                  id="fieldA"
                  value={signUpData.fieldA}
                  onChange={(v) => {
                    updateSignUpField("fieldA", v);
                    if (v !== OTHER_UNIVERSITY_VALUE) updateSignUpField("fieldB", "");
                  }}
                  placeholder="Search or choose your university"
                  aria-label="University"
                />
                {showFieldAOther && (
                  <Input
                    value={signUpData.fieldAOther}
                    onChange={(e) => updateSignUpField("fieldAOther", e.target.value)}
                    placeholder="Enter university name"
                    className="mt-2"
                  />
                )}
              </>
            ) : (
              <Input
                id="fieldA"
                value={signUpData.fieldA}
                onChange={(e) => updateSignUpField("fieldA", e.target.value)}
                placeholder={f1.placeholder}
              />
            )}
            {fieldErrors.fieldA && <p className="text-xs text-red-500">{fieldErrors.fieldA}</p>}
          </div>

          {/* Field 2 - Degree (dynamic), dropdown, or text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="fieldB">
              {f2.label}
              {!f2.optional && <span className="text-red-500"> *</span>}
            </label>
            {config.field2Kind === "degree" ? (
              <>
                <DegreePicker
                  id="fieldB"
                  options={degreePrograms}
                  value={signUpData.fieldB}
                  onChange={(v) => updateSignUpField("fieldB", v)}
                  placeholder="Search or select degree program"
                  disabled={!resolveFieldA(signUpData)}
                  aria-label="Degree program"
                />
                {showFieldBOther && (
                  <Input
                    value={signUpData.fieldBOther}
                    onChange={(e) => updateSignUpField("fieldBOther", e.target.value)}
                    placeholder="Enter degree program"
                    className="mt-2"
                  />
                )}
              </>
            ) : config.field2Kind === "dropdown" && config.field2Options ? (
              <>
                <select
                  id="fieldB"
                  value={signUpData.fieldB}
                  onChange={(e) => updateSignUpField("fieldB", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">{f2.placeholder}</option>
                  {config.field2Options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {showFieldBOther && (
                  <Input
                    value={signUpData.fieldBOther}
                    onChange={(e) => updateSignUpField("fieldBOther", e.target.value)}
                    placeholder="Please specify"
                    className="mt-2"
                  />
                )}
              </>
            ) : (
              <Input
                id="fieldB"
                value={signUpData.fieldB}
                onChange={(e) => updateSignUpField("fieldB", e.target.value)}
                placeholder={f2.placeholder}
              />
            )}
            {fieldErrors.fieldB && <p className="text-xs text-red-500">{fieldErrors.fieldB}</p>}
          </div>

          {/* Field 3 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="fieldC">
              {f3.label}
              {!f3.optional && <span className="text-red-500"> *</span>}
              {f3.optional && <span className="ml-1 text-slate-400">(Optional)</span>}
            </label>
            {f3.type === "tel" ? (
              <Input
                id="fieldC"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={signUpData.fieldC}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  updateSignUpField("fieldC", digits);
                }}
                placeholder={f3.placeholder}
                className={
                  fieldErrors.fieldC
                    ? "border-red-400 focus-visible:ring-red-400/30"
                    : f3.optional
                      ? "border-slate-200 bg-slate-50/50 dark:bg-slate-800/50"
                      : ""
                }
              />
            ) : (
              <Input
                id="fieldC"
                type={f3.type ?? "text"}
                value={signUpData.fieldC}
                onChange={(e) => updateSignUpField("fieldC", e.target.value)}
                placeholder={f3.placeholder}
                className={f3.optional ? "border-slate-200 bg-slate-50/50 dark:bg-slate-800/50" : ""}
              />
            )}
            {f3.helpText && <p className="text-xs text-slate-500">{f3.helpText}</p>}
            {fieldErrors.fieldC && <p className="text-xs text-red-500">{fieldErrors.fieldC}</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:bg-slate-800/50 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Review details</p>
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            <li>Name: {signUpData.name}</li>
            <li>Email: {signUpData.email}</li>
            <li>Role: {signUpData.role ? ROLE_CONFIGS[signUpData.role].label : "-"}</li>
            <li>{selectedRoleConfig?.fields[0].label}: {resolveFieldA(signUpData) || "-"}</li>
            <li>{selectedRoleConfig?.fields[1].label}: {resolveFieldB(signUpData) || "-"}</li>
            <li>{selectedRoleConfig?.fields[2].label}: {signUpData.fieldC.trim() || "-"}</li>
          </ul>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={signUpData.acceptedTerms}
            onChange={(event) => {
              updateSignUpField("acceptedTerms", event.target.checked);
              if (signUpError === "Please accept the terms to create your account.") setSignUpError(null);
            }}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          I agree to UniCare Connect terms and understand this account is for verified support access.
        </label>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)]">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === "signin" ? "bg-primary text-white" : "text-slate-600"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === "signup" ? "bg-primary text-white" : "text-slate-600"
              }`}
            >
              Sign up
            </button>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            {mode === "signin" ? "Welcome back to UniCare Connect" : "Create your UniCare account"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "signin"
              ? "Sign in to continue your support journey."
              : "Complete a simple 4-step setup based on your role."}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {mode === "signin" ? (
            <form className="space-y-4" onSubmit={handleSignInSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  aria-required="true"
                  defaultValue={recentlyRegisteredEmail ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input id="password" name="password" type="password" required aria-required="true" />
              </div>
              {isVerifiedRedirect ? (
                <p className="text-sm text-green-600">
                  Email verified successfully. You can now sign in.
                </p>
              ) : null}
              {signUpSuccess ? <p className="text-sm text-green-600">{signUpSuccess}</p> : null}
              {signInError ? <p className="text-sm text-red-500">{signInError}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="submit">Sign in</Button>
                <Button type="button" variant="secondary" onClick={handleGoogleSignIn}>
                  Sign in with Google
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <Link href="/forgot-password">Forgot password?</Link>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setSignInError(null);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Create account
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSignUpSubmit}>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="space-y-2">
                    <div
                      className={`h-1 rounded-full ${
                        signUpStep >= step ? "bg-primary" : "bg-slate-200"
                      }`}
                    />
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                      Step {step}
                    </p>
                  </div>
                ))}
              </div>

              {renderSignUpStep()}
              {signUpError ? <p className="text-sm text-red-500">{signUpError}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToPreviousSignUpStep}
                  disabled={signUpStep === 1}
                  className={signUpStep === 1 ? "cursor-not-allowed opacity-50" : ""}
                >
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Already have an account?
                  </button>
                  {signUpStep < 4 ? (
                    <Button type="button" onClick={goToNextSignUpStep}>
                      Continue
                    </Button>
                  ) : (
                    <Button type="submit">Create account</Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {signUpPopupMessage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">Account Created</h2>
            <p className="mt-2 text-sm text-slate-600">{signUpPopupMessage}</p>
            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setSignUpPopupMessage(null)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

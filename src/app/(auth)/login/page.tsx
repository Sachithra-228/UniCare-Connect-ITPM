"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { getDashboardPathForRole } from "@/lib/auth-redirect";
import { loginSchema, registerSchema } from "@/lib/validation";
import { UserRole as AppUserRole } from "@/types";

type AuthMode = "signin" | "signup";
type UserRole = Exclude<AppUserRole, "super_admin">;

type RoleField = {
  key: "fieldA" | "fieldB" | "fieldC";
  label: string;
  placeholder: string;
  type?: "text" | "tel" | "url";
};

type RoleConfig = {
  label: string;
  helper: string;
  fields: [RoleField, RoleField, RoleField];
};

type SignUpData = {
  role: UserRole | "";
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  fieldA: string;
  fieldB: string;
  fieldC: string;
  acceptedTerms: boolean;
};

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  student: {
    label: "Student",
    helper: "Set up your student support profile.",
    fields: [
      { key: "fieldA", label: "University", placeholder: "University of Moratuwa" },
      { key: "fieldB", label: "Degree program", placeholder: "BSc in IT" },
      { key: "fieldC", label: "Student ID", placeholder: "UGC-2026-XXXX" }
    ]
  },
  admin: {
    label: "University Admin / Faculty",
    helper: "Connect your institution and department.",
    fields: [
      { key: "fieldA", label: "University / Faculty", placeholder: "University of Colombo" },
      { key: "fieldB", label: "Department / Office", placeholder: "Student Affairs Office" },
      { key: "fieldC", label: "Staff ID", placeholder: "STAFF-00192" }
    ]
  },
  mentor: {
    label: "Alumni / Industry Mentor",
    helper: "Create your mentor identity and expertise profile.",
    fields: [
      { key: "fieldA", label: "Organization", placeholder: "ABC Technologies" },
      { key: "fieldB", label: "Expertise area", placeholder: "Software Engineering" },
      { key: "fieldC", label: "LinkedIn profile", placeholder: "https://linkedin.com/in/your-name", type: "url" }
    ]
  },
  donor: {
    label: "Donor / CSR Partner",
    helper: "Register your support profile and contribution focus.",
    fields: [
      { key: "fieldA", label: "Organization", placeholder: "XYZ Foundation" },
      { key: "fieldB", label: "Support type", placeholder: "Emergency bursaries / scholarships" },
      { key: "fieldC", label: "CSR / Donor reference", placeholder: "CSR-UNICARE-2026" }
    ]
  },
  employer: {
    label: "Employer (Job Provider)",
    helper: "Set your hiring profile for student opportunities.",
    fields: [
      { key: "fieldA", label: "Company", placeholder: "Tech Lanka Pvt Ltd" },
      { key: "fieldB", label: "Hiring focus", placeholder: "Internships, graduate roles" },
      { key: "fieldC", label: "Company website", placeholder: "https://company.lk", type: "url" }
    ]
  },
  ngo: {
    label: "NGO / Funding Organization",
    helper: "Define your funding and community support profile.",
    fields: [
      { key: "fieldA", label: "Organization name", placeholder: "Youth Impact NGO" },
      { key: "fieldB", label: "Funding focus", placeholder: "Education and wellbeing" },
      { key: "fieldC", label: "Registration number", placeholder: "NGO/SL/2026/XX" }
    ]
  },
  parent: {
    label: "Parent / Guardian",
    helper: "Set up parent access to monitor student progress.",
    fields: [
      { key: "fieldA", label: "Student full name", placeholder: "Student name" },
      { key: "fieldB", label: "Relationship", placeholder: "Mother / Father / Guardian" },
      { key: "fieldC", label: "Contact number", placeholder: "+94 7X XXX XXXX", type: "tel" }
    ]
  }
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
  acceptedTerms: false
};

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

  const selectedRoleConfig = signUpData.role ? ROLE_CONFIGS[signUpData.role] : null;

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
      user?: { role?: string };
    };
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

  const validateSignUpStep = (step: number) => {
    if (step === 1) {
      if (!signUpData.role) return "Please select your role to continue.";
      return null;
    }

    if (step === 2) {
      const result = registerSchema.safeParse({
        name: signUpData.name,
        email: signUpData.email,
        password: signUpData.password
      });

      if (!result.success) {
        return "Please complete full name, valid email, and password (minimum 6 characters).";
      }

      if (signUpData.password !== signUpData.confirmPassword) {
        return "Passwords do not match.";
      }
      return null;
    }

    if (step === 3) {
      if (!signUpData.fieldA.trim() || !signUpData.fieldB.trim() || !signUpData.fieldC.trim()) {
        return "Please complete all role details.";
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
        fieldA: signUpData.fieldA,
        fieldB: signUpData.fieldB,
        fieldC: signUpData.fieldC
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
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="role">
            Select your role
          </label>
          <select
            id="role"
            value={signUpData.role}
            onChange={(event) => updateSignUpField("role", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Choose one role</option>
            {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((role) => (
              <option key={role} value={role}>
                {ROLE_CONFIGS[role].label}
              </option>
            ))}
          </select>
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
            <label className="text-sm font-medium" htmlFor="signup-name">
              Full name
            </label>
            <Input
              id="signup-name"
              value={signUpData.name}
              onChange={(event) => updateSignUpField("name", event.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="signup-email">
              Email
            </label>
            <Input
              id="signup-email"
              type="email"
              value={signUpData.email}
              onChange={(event) => updateSignUpField("email", event.target.value)}
              placeholder="name@domain.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-password">
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              value={signUpData.password}
              onChange={(event) => updateSignUpField("password", event.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <Input
              id="signup-confirm-password"
              type="password"
              value={signUpData.confirmPassword}
              onChange={(event) => updateSignUpField("confirmPassword", event.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>
        </div>
      );
    }

    if (signUpStep === 3 && selectedRoleConfig) {
      return (
        <div className="grid gap-3">
          {selectedRoleConfig.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-medium" htmlFor={field.key}>
                {field.label}
              </label>
              <Input
                id={field.key}
                type={field.type ?? "text"}
                value={signUpData[field.key]}
                onChange={(event) => updateSignUpField(field.key, event.target.value)}
                placeholder={field.placeholder}
                required
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-900">Review details</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            <li>Name: {signUpData.name}</li>
            <li>Email: {signUpData.email}</li>
            <li>Role: {signUpData.role ? ROLE_CONFIGS[signUpData.role].label : "-"}</li>
            <li>{selectedRoleConfig?.fields[0].label}: {signUpData.fieldA}</li>
            <li>{selectedRoleConfig?.fields[1].label}: {signUpData.fieldB}</li>
            <li>{selectedRoleConfig?.fields[2].label}: {signUpData.fieldC}</li>
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

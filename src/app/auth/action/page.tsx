"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

type VerificationState = "loading" | "success" | "error";

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Verifying your account...");

  const params = useMemo(
    () => ({
      mode: searchParams.get("mode"),
      code: searchParams.get("oobCode"),
      continueUrl: searchParams.get("continueUrl")
    }),
    [searchParams]
  );

  useEffect(() => {
    const verify = async () => {
      if (params.mode !== "verifyEmail" || !params.code) {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new email.");
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth) {
        setStatus("error");
        setMessage("Authentication is not configured in this environment.");
        return;
      }

      try {
        await applyActionCode(auth, params.code);
        setStatus("success");
        setMessage("Email verified. Redirecting to login...");
        const nextUrl = "/login?mode=signin&verified=1";
        window.setTimeout(() => {
          router.replace(nextUrl);
        }, 1600);
      } catch {
        setStatus("error");
        setMessage("Verification link expired or already used. Request a new verification email.");
      }
    };

    void verify();
  }, [params, router]);

  const successUrl = "/login?mode=signin&verified=1";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-12">
        <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-slate-950/50 md:p-10">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {status === "success" ? (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : status === "error" ? (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            UniCare Connect
          </p>
          <h1 className="mt-3 text-center text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
            {status === "success"
              ? "Your email has been verified"
              : status === "error"
                ? "Verification failed"
                : "Verify your account"}
          </h1>
          <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">{message}</p>
          {status === "success" && (
            <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              You can now sign in with your new account.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={params.continueUrl ? decodeURIComponent(params.continueUrl) : successUrl}
              className="flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {status === "success" ? "Continue" : "Go to Login"}
            </Link>
            {params.continueUrl && status === "success" && (
              <Link
                href={successUrl}
                className="text-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400"
              >
                Or sign in here
              </Link>
            )}
          </div>

          {(status === "loading" || status === "error") && (
            <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              {status === "loading" ? "Processing verification…" : "You can request a new verification email from the sign-up flow."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

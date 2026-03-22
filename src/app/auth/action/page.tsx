"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useLanguage } from "@/context/language-context";

type VerificationState = "loading" | "success" | "error";

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const copy =
    language === "si"
      ? {
          verifying: "ඔබගේ ගිණුම සත්‍යාපනය වෙමින්...",
          invalidLink: "අවලංගු සත්‍යාපන සබැඳිය. කරුණාකර නව විද්‍යුත් තැපෑලක් ඉල්ලන්න.",
          authNotConfigured: "මෙම පරිසරයේ සත්‍යාපන සේවාව සකසා නැත.",
          verifiedRedirecting: "විද්‍යුත් තැපෑල සත්‍යාපිතයි. ඇතුල් වීම වෙත යොමු කරමින්...",
          expired: "සබැඳිය කල් ඉකුත්වී ඇත හෝ දැනටමත් භාවිතා කර ඇත. නව සත්‍යාපන විද්‍යුත් තැපෑලක් ඉල්ලන්න.",
          headingSuccess: "ඔබගේ විද්‍යුත් තැපෑල සත්‍යාපිතයි",
          headingError: "සත්‍යාපනය අසාර්ථකයි",
          headingLoading: "ඔබගේ ගිණුම සත්‍යාපනය කරන්න",
          canSignIn: "දැන් ඔබගේ නව ගිණුමෙන් ඇතුල් විය හැක.",
          continue: "ඉදිරියට යන්න",
          goLogin: "ඇතුල් වීම වෙත යන්න",
          orSignIn: "හෝ මෙහි ඇතුල් වන්න",
          processing: "සත්‍යාපනය සැකසෙමින්...",
          requestNew: "ලියාපදිංචි වීමේ ප්‍රවාහයෙන් නව සත්‍යාපන විද්‍යුත් තැපෑලක් ඉල්ලන්න."
        }
      : language === "ta"
        ? {
            verifying: "உங்கள் கணக்கு சரிபார்க்கப்படுகிறது...",
            invalidLink: "தவறான சரிபார்ப்பு இணைப்பு. புதிய மின்னஞ்சல் கோருங்கள்.",
            authNotConfigured: "இந்த சூழலில் அங்கீகாரம் அமைக்கப்படவில்லை.",
            verifiedRedirecting: "மின்னஞ்சல் சரிபார்க்கப்பட்டது. உள்நுழைவு பக்கத்துக்கு மாற்றப்படுகிறது...",
            expired: "சரிபார்ப்பு இணைப்பு காலாவதியானது அல்லது ஏற்கனவே பயன்படுத்தப்பட்டது. புதிய இணைப்பை கோருங்கள்.",
            headingSuccess: "உங்கள் மின்னஞ்சல் சரிபார்க்கப்பட்டது",
            headingError: "சரிபார்ப்பு தோல்வி",
            headingLoading: "உங்கள் கணக்கை சரிபார்க்கவும்",
            canSignIn: "இப்போது உங்கள் புதிய கணக்கில் உள்நுழையலாம்.",
            continue: "தொடரவும்",
            goLogin: "உள்நுழைவு பக்கம் செல்லவும்",
            orSignIn: "அல்லது இங்கே உள்நுழைக",
            processing: "சரிபார்ப்பு செயலாக்கப்படுகிறது...",
            requestNew: "பதிவு செயல்முறையில் இருந்து புதிய சரிபார்ப்பு மின்னஞ்சலை கோரலாம்."
          }
        : {
            verifying: "Verifying your account...",
            invalidLink: "Invalid verification link. Please request a new email.",
            authNotConfigured: "Authentication is not configured in this environment.",
            verifiedRedirecting: "Email verified. Redirecting to login...",
            expired: "Verification link expired or already used. Request a new verification email.",
            headingSuccess: "Your email has been verified",
            headingError: "Verification failed",
            headingLoading: "Verify your account",
            canSignIn: "You can now sign in with your new account.",
            continue: "Continue",
            goLogin: "Go to Login",
            orSignIn: "Or sign in here",
            processing: "Processing verification...",
            requestNew: "You can request a new verification email from the sign-up flow."
          };

  const [status, setStatus] = useState<VerificationState>("loading");
  const [message, setMessage] = useState(copy.verifying);

  const params = useMemo(
    () => ({
      mode: searchParams.get("mode"),
      code: searchParams.get("oobCode"),
      continueUrl: searchParams.get("continueUrl")
    }),
    [searchParams]
  );

  useEffect(() => {
    setMessage(copy.verifying);
  }, [copy.verifying]);

  useEffect(() => {
    const verify = async () => {
      if (params.mode !== "verifyEmail" || !params.code) {
        setStatus("error");
        setMessage(copy.invalidLink);
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth) {
        setStatus("error");
        setMessage(copy.authNotConfigured);
        return;
      }

      try {
        await applyActionCode(auth, params.code);
        setStatus("success");
        setMessage(copy.verifiedRedirecting);
        const nextUrl = "/login?mode=signin&verified=1";
        window.setTimeout(() => {
          router.replace(nextUrl);
        }, 1600);
      } catch {
        setStatus("error");
        setMessage(copy.expired);
      }
    };

    void verify();
  }, [copy.authNotConfigured, copy.expired, copy.invalidLink, copy.verifiedRedirecting, params, router]);

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
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-primary">UniCare Connect</p>
          <h1 className="mt-3 text-center text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
            {status === "success"
              ? copy.headingSuccess
              : status === "error"
                ? copy.headingError
                : copy.headingLoading}
          </h1>
          <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">{message}</p>
          {status === "success" && <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{copy.canSignIn}</p>}

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={params.continueUrl ? decodeURIComponent(params.continueUrl) : successUrl}
              className="flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {status === "success" ? copy.continue : copy.goLogin}
            </Link>
            {params.continueUrl && status === "success" && (
              <Link href={successUrl} className="text-center text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400">
                {copy.orSignIn}
              </Link>
            )}
          </div>

          {(status === "loading" || status === "error") && (
            <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              {status === "loading" ? copy.processing : copy.requestNew}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

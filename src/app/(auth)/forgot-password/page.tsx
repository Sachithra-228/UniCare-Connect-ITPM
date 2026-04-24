"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useLanguage } from "@/context/language-context";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          invalid: "වලංගු විද්‍යුත් තැපෑලක් ඇතුල් කරන්න.",
          sent: "මුරපද යළි සැකසුම් සබැඳිය ඔබගේ විද්‍යුත් තැපෑලට යවා ඇත.",
          failed: "දැනට යළි සැකසුම් සබැඳිය යැවිය නොහැක. කරුණාකර නැවත උත්සාහ කරන්න.",
          sending: "යවමින්...",
          title: "ඔබගේ මුරපදය යළි සකසන්න",
          subtitle: "තත්පර කිහිපයකින් ආරක්ෂිත යළි සැකසුම් සබැඳිය ඔබගේ විද්‍යුත් තැපෑලට ලැබේ.",
          badge: "ආරක්ෂිත ප්‍රවේශය",
          email: "විද්‍යුත් තැපෑල",
          emailPlaceholder: "name@example.com",
          submit: "යළි සැකසුම් සබැඳිය යවන්න",
          tipTitle: "ඊළඟට සිදුවෙන්නේ",
          tip1: "ඔබගේ ලියාපදිංචි විද්‍යුත් තැපෑල ඇතුල් කරන්න",
          tip2: "Inbox සහ Spam ෆෝල්ඩර දෙකම පරීක්ෂා කරන්න",
          tip3: "ආරක්ෂාව සඳහා සබැඳිය කෙටි කාලයකින් කල් ඉකුත් වේ",
          backToSignIn: "පිවිසුමට ආපසු යන්න"
        }
      : language === "ta"
        ? {
            invalid: "சரியான மின்னஞ்சலை உள்ளிடவும்.",
            sent: "கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.",
            failed: "தற்போது மீட்டமைப்பு இணைப்பை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
            sending: "அனுப்புகிறது...",
            title: "உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்",
            subtitle: "சில வினாடிகளில் பாதுகாப்பான மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சலுக்கு வரும்.",
            badge: "பாதுகாப்பான அணுகல்",
            email: "மின்னஞ்சல்",
            emailPlaceholder: "name@example.com",
            submit: "மீட்டமைப்பு இணைப்பை அனுப்பவும்",
            tipTitle: "அடுத்து என்ன நடக்கும்",
            tip1: "உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சலை உள்ளிடவும்",
            tip2: "Inbox மற்றும் Spam கோப்புறைகளையும் சரிபார்க்கவும்",
            tip3: "பாதுகாப்புக்காக இணைப்பு விரைவில் காலாவதியாகும்",
            backToSignIn: "உள்நுழைவுக்கு திரும்பவும்"
          }
        : {
            invalid: "Please enter a valid email.",
            sent: "Password reset link sent to your email.",
            failed: "Unable to send reset link right now. Please try again.",
            sending: "Sending...",
            title: "Reset your password",
            subtitle: "A secure reset link will arrive in your inbox in a few seconds.",
            badge: "Secure access",
            email: "Email",
            emailPlaceholder: "name@example.com",
            submit: "Send reset link",
            tipTitle: "What happens next",
            tip1: "Enter the email used for your UniCare account",
            tip2: "Check both inbox and spam folders",
            tip3: "For security, the link expires shortly",
            backToSignIn: "Back to sign in"
          };
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage({ type: "error", text: text.invalid });
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(email);
      setMessage({ type: "success", text: text.sent });
    } catch {
      setMessage({ type: "error", text: text.failed });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute bottom-8 right-0 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-8">
        <section className="w-full">
          <div className="w-full rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 space-y-3">
              <div className="inline-flex items-center rounded-xl bg-white p-2 shadow-md ring-1 ring-slate-200">
                <Image src="/logo.png" alt="UniCare Connect" width={120} height={48} className="h-10 w-auto" priority />
              </div>
              <h1 className="text-3xl font-semibold text-slate-900">{text.title}</h1>
              <p className="text-sm text-slate-600">{text.subtitle}</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="email">
                  {text.email}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18v12H3z" />
                      <path d="m3 7 9 7 9-7" />
                    </svg>
                  </span>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    aria-required="true"
                    placeholder={text.emailPlaceholder}
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              {message ? (
                <p
                  role="status"
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    message.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {message.text}
                </p>
              ) : null}

              <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-sm font-semibold">
                {isSubmitting ? text.sending : text.submit}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">{text.tipTitle}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>{text.tip1}</li>
                <li>{text.tip2}</li>
                <li>{text.tip3}</li>
              </ul>
            </div>

            <div className="mt-6">
              <Link href="/login" className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline">
                {text.backToSignIn}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

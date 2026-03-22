"use client";

import Link from "next/link";
import { useLanguage } from "@/context/language-context";

export default function NotFound() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "පිටුව හමු නොවීය",
          body: "ඔබ සොයන පිටුව නොපවතී. පුවරුවට හෝ මුල් පිටුවට ආපසු යන්න.",
          home: "මුල් පිටුව",
          dashboard: "පුවරුව"
        }
      : language === "ta"
        ? {
            title: "பக்கம் கிடைக்கவில்லை",
            body: "நீங்கள் தேடும் பக்கம் இல்லை. டாஷ்போர்டு அல்லது முதற்பக்கத்துக்கு திரும்பவும்.",
            home: "முகப்பு",
            dashboard: "டாஷ்போர்டு"
          }
        : {
            title: "Page not found",
            body: "The page you are looking for does not exist. Return to the dashboard or home page.",
            home: "Home",
            dashboard: "Dashboard"
          };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-semibold">{text.title}</h1>
      <p className="text-sm text-slate-500">{text.body}</p>
      <div className="flex gap-3">
        <Link className="rounded-full bg-primary px-4 py-2 text-sm text-white" href="/">
          {text.home}
        </Link>
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
          href="/dashboard"
        >
          {text.dashboard}
        </Link>
      </div>
    </div>
  );
}

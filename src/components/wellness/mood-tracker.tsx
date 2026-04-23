"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Select } from "@/components/shared/Select";
import { Input } from "@/components/shared/Input";
import { useLanguage } from "@/context/language-context";

type MoodTrackerProps = {
  onSaved?: () => void;
};

export function MoodTracker({ onSaved }: MoodTrackerProps) {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "මනෝභාව නිරීක්ෂකය",
          subtitle: "ඔබගේ දෛනික හැඟීම්, නින්ද සහ ආතතිය ඉක්මනින් සටහන් කර ගන්න.",
          invalid: "කරුණාකර මනෝභාවය, නින්ද පැය, සහ ආතති මට්ටම පුරවන්න.",
          saveFail: "මනෝභාව සටහන සුරැකීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
          saved: "මනෝභාව සටහන සුරකිණි. පුද්ගලීකරණ කළ උපදෙස් ඔබගේ පුවරුවට එක් කළා.",
          saveNetwork: "මනෝභාව සටහන සුරැකීමට නොහැකි විය. සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
          selectMood: "මනෝභාවය තෝරන්න",
          moodPlaceholder: "මනෝභාවය තෝරන්න",
          moodLabel: "අද මනෝභාවය",
          moods: ["ඉතා හොඳයි", "හොඳයි", "සාමාන්‍යයි", "අඩුයි", "ආතතියක් ඇත"],
          sleepLabel: "නින්ද පැය",
          sleepPlaceholder: "නින්ද පැය",
          stressLabel: "ආතති මට්ටම",
          stressPlaceholder: "ආතති මට්ටම (1-10)",
          submit: "අද සටහන් කරන්න",
          quickStats: [
            { label: "Check-in", value: "10 sec" },
            { label: "Focus", value: "Mood + Sleep" },
            { label: "Support", value: "Quick insights" }
          ]
        }
      : language === "ta"
        ? {
            title: "மூட் கண்காணிப்பு",
            subtitle: "உங்கள் தினசரி உணர்வு, தூக்கம், மன அழுத்தத்தை விரைவாக பதிவு செய்யுங்கள்.",
            invalid: "மூட், தூக்க மணி, மற்றும் மன அழுத்த அளவை பூர்த்தி செய்யவும்.",
            saveFail: "மூட் பதிவை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
            saved: "மூட் பதிவு சேமிக்கப்பட்டது. தனிப்பயன் ஆலோசனைகள் டாஷ்போர்டில் சேர்க்கப்பட்டுள்ளன.",
            saveNetwork: "மூட் பதிவை சேமிக்க முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
            selectMood: "மூட் தேர்வு",
            moodPlaceholder: "மூட் தேர்வு செய்யவும்",
            moodLabel: "இன்றைய மூட்",
            moods: ["மிக நன்று", "நன்று", "சரி", "குறைவு", "பதட்டம்"],
            sleepLabel: "தூக்க மணி",
            sleepPlaceholder: "தூக்க மணி",
            stressLabel: "மன அழுத்த அளவு",
            stressPlaceholder: "மன அழுத்த அளவு (1-10)",
            submit: "இன்றைய பதிவு",
            quickStats: [
              { label: "Check-in", value: "10 sec" },
              { label: "Focus", value: "Mood + Sleep" },
              { label: "Support", value: "Quick insights" }
            ]
          }
        : {
            title: "Mood tracker",
            subtitle: "Capture your daily mood, sleep, and stress in a quick guided check-in.",
            invalid: "Please complete mood, sleep hours, and stress level.",
            saveFail: "Unable to save mood log. Please try again.",
            saved: "Mood log saved. Personalized tips added to your dashboard.",
            saveNetwork: "Unable to save mood log. Please check your connection and try again.",
            selectMood: "Select mood",
            moodPlaceholder: "Select mood",
            moodLabel: "Today's mood",
            moods: ["Great", "Good", "Okay", "Low", "Anxious"],
            sleepLabel: "Sleep hours",
            sleepPlaceholder: "Sleep hours",
            stressLabel: "Stress level",
            stressPlaceholder: "Stress level (1-10)",
            submit: "Log today",
            quickStats: [
              { label: "Check-in", value: "10 sec" },
              { label: "Focus", value: "Mood + Sleep" },
              { label: "Support", value: "Quick insights" }
            ]
          };

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setMessageType(null);

    const formData = new FormData(event.currentTarget);
    const mood = String(formData.get("mood") ?? "");
    const sleepHours = Number(formData.get("sleepHours") ?? 0);
    const stressLevel = Number(formData.get("stressLevel") ?? 0);

    if (!mood || Number.isNaN(sleepHours) || Number.isNaN(stressLevel)) {
      setMessage(text.invalid);
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch("/api/health-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mood,
          sleepHours,
          stressLevel,
          date: new Date().toISOString().split("T")[0]
        })
      });

      if (!response.ok) {
        setMessage(text.saveFail);
        setMessageType("error");
        return;
      }

      setMessage(text.saved);
      setMessageType("success");
      event.currentTarget.reset();
      onSaved?.();
    } catch {
      setMessage(text.saveNetwork);
      setMessageType("error");
    }
  };

  return (
    <Card className="overflow-hidden border-0 bg-transparent p-0 shadow-none">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              Daily check-in
            </span>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{text.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{text.subtitle}</p>
            </div>
          </div>
          <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 sm:gap-2">
            {text.quickStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>{text.moodLabel}</span>
              <Select
                name="mood"
                aria-label={text.selectMood}
                required
                aria-required="true"
                className="min-h-11 border-slate-200 bg-white/90 dark:bg-slate-950"
              >
                <option value="">{text.moodPlaceholder}</option>
                <option value="great">{text.moods[0]}</option>
                <option value="good">{text.moods[1]}</option>
                <option value="okay">{text.moods[2]}</option>
                <option value="low">{text.moods[3]}</option>
                <option value="anxious">{text.moods[4]}</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>{text.sleepLabel}</span>
              <Input
                name="sleepHours"
                type="number"
                placeholder={text.sleepPlaceholder}
                aria-label={text.sleepPlaceholder}
                min={0}
                max={12}
                required
                aria-required="true"
                className="min-h-11 border-slate-200 bg-white/90 dark:bg-slate-950"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>{text.stressLabel}</span>
              <Input
                name="stressLevel"
                type="number"
                placeholder={text.stressPlaceholder}
                aria-label={text.stressPlaceholder}
                min={1}
                max={10}
                required
                aria-required="true"
                className="min-h-11 border-slate-200 bg-white/90 dark:bg-slate-950"
              />
            </label>
          </div>

          {message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
              }`}
            >
              {message}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="submit"
              className="min-w-[160px] bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            >
              {text.submit}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

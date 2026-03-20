"use client";

import { useState } from "react";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Select } from "@/components/shared/select";
import { Input } from "@/components/shared/input";
import { useLanguage } from "@/context/language-context";

export function MoodTracker() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "මනෝභාව නිරීක්ෂකය",
          invalid: "කරුණාකර මනෝභාවය, නින්ද පැය, සහ ආතති මට්ටම පුරවන්න.",
          saveFail: "මනෝභාව සටහන සුරැකීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
          saved: "මනෝභාව සටහන සුරකිණි. පුද්ගලීකරණ කළ උපදෙස් ඔබගේ පුවරුවට එක් කළා.",
          saveNetwork: "මනෝභාව සටහන සුරැකීමට නොහැකි විය. සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
          selectMood: "මනෝභාවය තෝරන්න",
          moodPlaceholder: "මනෝභාවය තෝරන්න",
          moods: ["ඉතා හොඳයි", "හොඳයි", "සාමාන්‍යයි", "අඩුයි", "ආතතියක් ඇත"],
          sleepPlaceholder: "නින්ද පැය",
          stressPlaceholder: "ආතති මට්ටම (1-10)",
          submit: "අද සටහන් කරන්න"
        }
      : language === "ta"
        ? {
            title: "மூட் கண்காணிப்பு",
            invalid: "மூட், தூக்க மணி, மற்றும் மன அழுத்த அளவை பூர்த்தி செய்யவும்.",
            saveFail: "மூட் பதிவை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
            saved: "மூட் பதிவு சேமிக்கப்பட்டது. தனிப்பயன் ஆலோசனைகள் டாஷ்போர்டில் சேர்க்கப்பட்டுள்ளன.",
            saveNetwork: "மூட் பதிவை சேமிக்க முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
            selectMood: "மூட் தேர்வு",
            moodPlaceholder: "மூட் தேர்வு செய்யவும்",
            moods: ["மிக நன்று", "நன்று", "சரி", "குறைவு", "பதட்டம்"],
            sleepPlaceholder: "தூக்க மணி",
            stressPlaceholder: "மன அழுத்த அளவு (1-10)",
            submit: "இன்றைய பதிவு"
          }
        : {
            title: "Mood tracker",
            invalid: "Please complete mood, sleep hours, and stress level.",
            saveFail: "Unable to save mood log. Please try again.",
            saved: "Mood log saved. Personalized tips added to your dashboard.",
            saveNetwork: "Unable to save mood log. Please check your connection and try again.",
            selectMood: "Select mood",
            moodPlaceholder: "Select mood",
            moods: ["Great", "Good", "Okay", "Low", "Anxious"],
            sleepPlaceholder: "Sleep hours",
            stressPlaceholder: "Stress level (1-10)",
            submit: "Log today"
          };

  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const mood = String(formData.get("mood") ?? "");
    const sleepHours = Number(formData.get("sleepHours") ?? 0);
    const stressLevel = Number(formData.get("stressLevel") ?? 0);

    if (!mood || Number.isNaN(sleepHours) || Number.isNaN(stressLevel)) {
      setMessage(text.invalid);
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
        return;
      }

      setMessage(text.saved);
      event.currentTarget.reset();
    } catch {
      setMessage(text.saveNetwork);
    }
  };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">{text.title}</h3>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Select name="mood" aria-label={text.selectMood} required aria-required="true">
          <option value="">{text.moodPlaceholder}</option>
          <option value="great">{text.moods[0]}</option>
          <option value="good">{text.moods[1]}</option>
          <option value="okay">{text.moods[2]}</option>
          <option value="low">{text.moods[3]}</option>
          <option value="anxious">{text.moods[4]}</option>
        </Select>
        <Input
          name="sleepHours"
          type="number"
          placeholder={text.sleepPlaceholder}
          aria-label={text.sleepPlaceholder}
          min={0}
          max={12}
          required
          aria-required="true"
        />
        <Input
          name="stressLevel"
          type="number"
          placeholder={text.stressPlaceholder}
          aria-label={text.stressPlaceholder}
          min={1}
          max={10}
          required
          aria-required="true"
        />
        <Button type="submit">{text.submit}</Button>
      </form>
      {message ? <p className="text-sm text-secondary">{message}</p> : null}
    </Card>
  );
}

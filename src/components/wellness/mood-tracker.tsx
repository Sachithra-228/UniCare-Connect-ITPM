"use client";

import { useState } from "react";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Select } from "@/components/shared/select";
import { Input } from "@/components/shared/input";

export function MoodTracker() {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const mood = String(formData.get("mood") ?? "");
    const sleepHours = Number(formData.get("sleepHours") ?? 0);
    const stressLevel = Number(formData.get("stressLevel") ?? 0);

    if (!mood || Number.isNaN(sleepHours) || Number.isNaN(stressLevel)) {
      setMessage("Please complete mood, sleep hours, and stress level.");
      return;
    }

    setMessage("Mood log saved. Personalized tips added to your dashboard.");
    event.currentTarget.reset();
  };

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Mood tracker</h3>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Select name="mood" aria-label="Select mood" required aria-required="true">
          <option value="">Select mood</option>
          <option value="great">Great</option>
          <option value="good">Good</option>
          <option value="okay">Okay</option>
          <option value="low">Low</option>
          <option value="anxious">Anxious</option>
        </Select>
        <Input
          name="sleepHours"
          type="number"
          placeholder="Sleep hours"
          aria-label="Sleep hours"
          min={0}
          max={12}
          required
          aria-required="true"
        />
        <Input
          name="stressLevel"
          type="number"
          placeholder="Stress level (1-10)"
          aria-label="Stress level"
          min={1}
          max={10}
          required
          aria-required="true"
        />
        <Button type="submit">Log today</Button>
      </form>
      {message ? <p className="text-sm text-secondary">{message}</p> : null}
    </Card>
  );
}

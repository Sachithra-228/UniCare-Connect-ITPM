"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";

type Challenge = {
  _id: string;
  title: string;
  description: string;
  category: string;
  durationDays: number;
  points: number;
  joined?: boolean;
  completed?: boolean;
  progress?: number;
};

export function WellnessChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftProgress, setDraftProgress] = useState<Record<string, number>>({});

  const refreshChallenges = useCallback(() => {
    setLoading(true);
    fetch("/api/wellness-challenges")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setChallenges(list);
        const drafts: Record<string, number> = {};
        list.forEach((item: Challenge) => {
          drafts[item._id] = Number(item.progress ?? 0);
        });
        setDraftProgress(drafts);
      })
      .catch(() => setChallenges([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshChallenges();
  }, [refreshChallenges]);

  const saveProgress = async (challengeId: string, progress: number, completed: boolean) => {
    setSavingId(challengeId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/wellness-challenge-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, progress, completed })
      });
      const body = await response.json().catch(() => ({} as { message?: string }));
      if (!response.ok) {
        setError(body.message ?? "Unable to save challenge progress.");
        return;
      }
      setMessage(completed ? "Challenge marked as completed." : "Challenge progress saved.");
      refreshChallenges();
    } catch {
      setError("Unable to save challenge progress.");
    } finally {
      setSavingId(null);
    }
  };

  const stats = useMemo(() => {
    const joined = challenges.filter((item) => item.joined).length;
    const completed = challenges.filter((item) => item.completed).length;
    const points = challenges
      .filter((item) => item.completed)
      .reduce((total, item) => total + Number(item.points ?? 0), 0);
    return { joined, completed, points };
  }, [challenges]);

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Joined</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.joined}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.completed}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Points earned</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.points}</p>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">Wellness challenges</h3>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {loading ? (
          <p className="text-sm text-slate-500">Loading challenges...</p>
        ) : challenges.length === 0 ? (
          <p className="text-sm text-slate-500">No active challenges available.</p>
        ) : (
          <ul className="space-y-3">
            {challenges.map((challenge) => {
              const progress = Number(draftProgress[challenge._id] ?? challenge.progress ?? 0);
              return (
                <li
                  key={challenge._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{challenge.title}</p>
                      <p className="text-sm text-slate-500">{challenge.description}</p>
                      <p className="text-xs text-slate-500">
                        {challenge.category} · {challenge.durationDays} days · {challenge.points} points
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {challenge.completed ? <Badge variant="success">Completed</Badge> : null}
                      {!challenge.completed && challenge.joined ? <Badge variant="info">In progress</Badge> : null}
                      {!challenge.joined ? <Badge variant="warning">Not joined</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        disabled={challenge.completed || savingId === challenge._id}
                        value={progress}
                        onChange={(event) =>
                          setDraftProgress((prev) => ({
                            ...prev,
                            [challenge._id]: Number(event.target.value)
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!challenge.joined ? (
                        <Button
                          variant="secondary"
                          disabled={savingId === challenge._id}
                          onClick={() => saveProgress(challenge._id, 0, false)}
                        >
                          {savingId === challenge._id ? "Saving..." : "Join challenge"}
                        </Button>
                      ) : null}

                      {challenge.joined && !challenge.completed ? (
                        <>
                          <Button
                            variant="secondary"
                            disabled={savingId === challenge._id}
                            onClick={() => saveProgress(challenge._id, progress, false)}
                          >
                            {savingId === challenge._id ? "Saving..." : "Save progress"}
                          </Button>
                          <Button
                            disabled={savingId === challenge._id}
                            onClick={() => saveProgress(challenge._id, 100, true)}
                          >
                            {savingId === challenge._id ? "Saving..." : "Mark completed"}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

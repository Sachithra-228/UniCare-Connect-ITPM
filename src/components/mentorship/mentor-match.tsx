"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";

type Mentor = {
  _id: string;
  name: string;
  email?: string;
  expertise?: string;
  availability?: string;
};

export function MentorMatch() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentors")
      .then((r) => r.json())
      .then((data) => setMentors(Array.isArray(data) ? data : []))
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Mentor matching</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Match with alumni and industry mentors based on your goals.
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : mentors.length === 0 ? (
        <p className="text-sm text-slate-500">No mentors available at the moment. Check back later.</p>
      ) : (
        <div className="space-y-3 text-sm">
          {mentors.map((mentor) => (
            <div key={mentor._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-slate-500">{mentor.expertise ?? "Career guidance"}</p>
              <p className="text-slate-500">Availability: {mentor.availability ?? "By request"}</p>
              <Button variant="secondary" className="mt-2">
                Request session
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

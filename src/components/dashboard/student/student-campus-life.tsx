"use client";

import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";

export function StudentCampusLife() {
  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming campus events</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Posted by University Admin; mentors can participate.
        </p>
        <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
          No upcoming events at the moment. Events will appear here when posted by your university.
        </p>
      </Card>

      <Card className="space-y-4 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Student clubs & societies</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">Browse and join clubs.</p>
        <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
          No clubs listed yet. Your university can add clubs here.
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Campus announcements</h3>
        <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
          No announcements at the moment.
        </p>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Local business discounts</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Student discounts at partner cafés, bookshops, and transport.
          </p>
          <Button variant="secondary" disabled>View offers (coming soon)</Button>
        </Card>
        <Card className="space-y-3 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Volunteer opportunities</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Campus and community volunteering. External roles (Donor/Employer) don’t access this.
          </p>
          <Button variant="secondary" disabled>Browse opportunities (coming soon)</Button>
        </Card>
      </div>
    </div>
  );
}

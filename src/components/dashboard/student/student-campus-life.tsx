"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import type {
  CampusAnnouncementItem,
  CampusClubItem,
  CampusDiscountItem,
  CampusEventItem,
  CampusLifeInteractionType,
  CampusLifePayload,
  CampusVolunteerItem
} from "@/lib/campus-life-types";

type CampusTab = "events" | "clubs" | "announcements" | "discounts" | "volunteer";

const tabContentVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 }
};

export function StudentCampusLife() {
  const [activeTab, setActiveTab] = useState<CampusTab>("events");
  const [events, setEvents] = useState<CampusEventItem[]>([]);
  const [clubs, setClubs] = useState<CampusClubItem[]>([]);
  const [announcements, setAnnouncements] = useState<CampusAnnouncementItem[]>([]);
  const [discounts, setDiscounts] = useState<CampusDiscountItem[]>([]);
  const [volunteerRoles, setVolunteerRoles] = useState<CampusVolunteerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: CampusTab; label: string }[] = [
    { id: "events", label: "Campus events" },
    { id: "clubs", label: "Clubs & societies" },
    { id: "announcements", label: "Announcements" },
    { id: "discounts", label: "Local discounts" },
    { id: "volunteer", label: "Volunteer" }
  ];

  const refreshCampusLife = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/campus-life")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const payload = (data ?? {}) as Partial<CampusLifePayload>;
        setEvents(Array.isArray(payload.events) ? payload.events : []);
        setClubs(Array.isArray(payload.clubs) ? payload.clubs : []);
        setAnnouncements(Array.isArray(payload.announcements) ? payload.announcements : []);
        setDiscounts(Array.isArray(payload.discounts) ? payload.discounts : []);
        setVolunteerRoles(Array.isArray(payload.volunteerRoles) ? payload.volunteerRoles : []);
      })
      .catch(() => {
        setEvents([]);
        setClubs([]);
        setAnnouncements([]);
        setDiscounts([]);
        setVolunteerRoles([]);
        setError("Unable to load campus life data right now.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshCampusLife();
  }, [refreshCampusLife]);

  const persistInteraction = async (
    itemType: CampusLifeInteractionType,
    itemId: string,
    value: boolean
  ) => {
    setSavingKey(`${itemType}:${itemId}`);
    try {
      const response = await fetch("/api/campus-life/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: itemType, itemId, value })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({} as { message?: string }));
        throw new Error(body.message ?? "Unable to save your update.");
      }
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your update.");
      refreshCampusLife();
      return false;
    } finally {
      setSavingKey(null);
    }
  };

  const toggleInterested = async (id: string) => {
    const current = events.find((event) => event.id === id)?.interested ?? false;
    const next = !current;
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, interested: next } : event)));
    await persistInteraction("event", id, next);
  };

  const toggleJoinedClub = async (id: string) => {
    const current = clubs.find((club) => club.id === id)?.joined ?? false;
    const next = !current;
    setClubs((prev) => prev.map((club) => (club.id === id ? { ...club, joined: next } : club)));
    await persistInteraction("club", id, next);
  };

  const toggleAnnouncementRead = async (id: string) => {
    const current = announcements.find((announcement) => announcement.id === id)?.read ?? false;
    const next = !current;
    setAnnouncements((prev) =>
      prev.map((announcement) => (announcement.id === id ? { ...announcement, read: next } : announcement))
    );
    await persistInteraction("announcement", id, next);
  };

  const toggleDiscountUsed = async (id: string) => {
    const current = discounts.find((discount) => discount.id === id)?.used ?? false;
    const next = !current;
    setDiscounts((prev) => prev.map((discount) => (discount.id === id ? { ...discount, used: next } : discount)));
    await persistInteraction("discount", id, next);
  };

  const toggleVolunteerSignup = async (id: string) => {
    const current = volunteerRoles.find((role) => role.id === id)?.signedUp ?? false;
    const next = !current;
    setVolunteerRoles((prev) =>
      prev.map((role) => (role.id === id ? { ...role, signedUp: next } : role))
    );
    await persistInteraction("volunteer", id, next);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Campus life sections">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        {activeTab === "events" && (
          <motion.div
            key="events"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming campus events</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                See what is happening on campus and mark events you are interested in.
              </p>
              {loading ? (
                <p className="text-sm text-slate-500">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No upcoming events at the moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const key = `event:${event.id}`;
                    const isSaving = savingKey === key;
                    return (
                      <div
                        key={event.id}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                            {event.date} · {event.time} · {event.location}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {event.type === "academic"
                              ? "Academic"
                              : event.type === "career"
                                ? "Career"
                                : "Wellness / Social"}
                          </p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">{event.description}</p>
                        </div>
                        <Button
                          variant={event.interested ? "secondary" : "primary"}
                          className="shrink-0"
                          disabled={isSaving}
                          onClick={() => toggleInterested(event.id)}
                        >
                          {isSaving
                            ? "Saving..."
                            : event.interested
                              ? "Interested ✓"
                              : "I'm interested"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "clubs" && (
          <motion.div
            key="clubs"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Student clubs & societies</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Browse clubs across tech, community and creativity. Join or leave anytime.
              </p>
              {loading ? (
                <p className="text-sm text-slate-500">Loading clubs...</p>
              ) : clubs.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No clubs listed yet.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {clubs.map((club) => {
                    const key = `club:${club.id}`;
                    const isSaving = savingKey === key;
                    return (
                      <div
                        key={club.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{club.name}</p>
                          <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{club.category}</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">{club.description}</p>
                        </div>
                        <Button
                          variant={club.joined ? "secondary" : "primary"}
                          className="mt-3 self-start"
                          disabled={isSaving}
                          onClick={() => toggleJoinedClub(club.id)}
                        >
                          {isSaving ? "Saving..." : club.joined ? "Joined ✓" : "Join club"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "announcements" && (
          <motion.div
            key="announcements"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="space-y-3 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Campus announcements</h3>
              {loading ? (
                <p className="text-sm text-slate-500">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No announcements at the moment.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {announcements.map((announcement) => {
                    const key = `announcement:${announcement.id}`;
                    const isSaving = savingKey === key;
                    return (
                      <li
                        key={announcement.id}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3 dark:border-slate-700 ${
                          announcement.read
                            ? "bg-slate-50/60 dark:bg-slate-800/40"
                            : "bg-white dark:bg-slate-900/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">{announcement.title}</p>
                          <p className="text-xs text-slate-500">{announcement.date}</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">{announcement.body}</p>
                        </div>
                        <Button
                          variant="secondary"
                          className="shrink-0 text-xs"
                          disabled={isSaving}
                          onClick={() => toggleAnnouncementRead(announcement.id)}
                        >
                          {isSaving ? "Saving..." : announcement.read ? "Mark unread" : "Mark read"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "discounts" && (
          <motion.div
            key="discounts"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="space-y-3 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Local business discounts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Student-only deals at cafes, bookshops and more.
              </p>
              {loading ? (
                <p className="text-sm text-slate-500">Loading discounts...</p>
              ) : discounts.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No offers listed yet.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {discounts.map((discount) => {
                    const key = `discount:${discount.id}`;
                    const isSaving = savingKey === key;
                    return (
                      <div
                        key={discount.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{discount.name}</p>
                          <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{discount.category}</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">{discount.description}</p>
                          <p className="mt-1 text-xs text-slate-500">Near: {discount.location}</p>
                        </div>
                        <Button
                          variant={discount.used ? "secondary" : "primary"}
                          className="mt-3 self-start"
                          disabled={isSaving}
                          onClick={() => toggleDiscountUsed(discount.id)}
                        >
                          {isSaving ? "Saving..." : discount.used ? "Saved ✓" : "Save to use"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === "volunteer" && (
          <motion.div
            key="volunteer"
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card className="space-y-3 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Volunteer opportunities</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Get experience and give back through campus and community projects.
              </p>
              {loading ? (
                <p className="text-sm text-slate-500">Loading volunteer roles...</p>
              ) : volunteerRoles.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No volunteer roles listed yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {volunteerRoles.map((role) => {
                    const key = `volunteer:${role.id}`;
                    const isSaving = savingKey === key;
                    return (
                      <div
                        key={role.id}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">{role.title}</p>
                          <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                            {role.org} · {role.location}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Time: {role.hoursPerWeek}</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">{role.description}</p>
                        </div>
                        <Button
                          variant={role.signedUp ? "secondary" : "primary"}
                          className="shrink-0"
                          disabled={isSaving}
                          onClick={() => toggleVolunteerSignup(role.id)}
                        >
                          {isSaving ? "Saving..." : role.signedUp ? "Signed up ✓" : "Sign up"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

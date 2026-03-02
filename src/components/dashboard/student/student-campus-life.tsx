"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";

type CampusTab = "events" | "clubs" | "announcements" | "discounts" | "volunteer";

type CampusEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "academic" | "social" | "career";
  description: string;
  interested: boolean;
};

type Club = {
  id: string;
  name: string;
  category: string;
  description: string;
  joined: boolean;
};

type Announcement = {
  id: string;
  title: string;
  date: string;
  body: string;
  read: boolean;
};

type Discount = {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  used: boolean;
};

type VolunteerRole = {
  id: string;
  title: string;
  org: string;
  hoursPerWeek: string;
  location: string;
  description: string;
  signedUp: boolean;
};

const initialEvents: CampusEvent[] = [
  {
    id: "e1",
    title: "Career fair – Tech & Startups",
    date: "2026-03-10",
    time: "10:00–16:00",
    location: "Main Hall",
    type: "career",
    description: "Meet Sri Lankan startups and global tech companies hiring interns and graduates.",
    interested: false
  },
  {
    id: "e2",
    title: "Mindfulness evening",
    date: "2026-03-05",
    time: "17:30–19:00",
    location: "Counseling Centre",
    type: "social",
    description: "Guided meditation and breathing session with the university counseling team.",
    interested: false
  }
];

const initialClubs: Club[] = [
  {
    id: "c1",
    name: "Developer Student Club",
    category: "Tech",
    description: "Workshops on web, mobile and cloud. Project nights and hackathons.",
    joined: false
  },
  {
    id: "c2",
    name: "Rotaract – Community Service",
    category: "Community",
    description: "Community and environmental projects around your university.",
    joined: false
  }
];

const initialAnnouncements: Announcement[] = [
  {
    id: "a1",
    title: "Library opening hours (mid-term)",
    date: "2026-02-15",
    body: "Library will be open 8.00am – 9.00pm Monday to Friday during mid-term.",
    read: false
  },
  {
    id: "a2",
    title: "New shuttle route to campus",
    date: "2026-02-12",
    body: "A new shuttle route from Fort to campus via Town Hall will start next week.",
    read: false
  }
];

const initialDiscounts: Discount[] = [
  {
    id: "d1",
    name: "Cafe Colombo",
    category: "Food & drink",
    description: "15% off hot drinks with your student ID.",
    location: "Near main gate",
    used: false
  },
  {
    id: "d2",
    name: "BookNest",
    category: "Books",
    description: "10% off textbooks and stationery.",
    location: "Opposite science faculty",
    used: false
  }
];

const initialVolunteerRoles: VolunteerRole[] = [
  {
    id: "v1",
    title: "Peer mentor – First year students",
    org: "Student Affairs",
    hoursPerWeek: "2–3 hours",
    location: "On campus",
    description: "Support first years with settling in, time management and finding resources.",
    signedUp: false
  },
  {
    id: "v2",
    title: "Community tutoring – Maths",
    org: "Community Outreach Unit",
    hoursPerWeek: "3 hours",
    location: "Online / nearby schools",
    description: "Tutor O/L or A/L students in mathematics once a week.",
    signedUp: false
  }
];

const tabContentVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 }
};

export function StudentCampusLife() {
  const [activeTab, setActiveTab] = useState<CampusTab>("events");
  const [events, setEvents] = useState<CampusEvent[]>(initialEvents);
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>(initialVolunteerRoles);

  const tabs: { id: CampusTab; label: string }[] = [
    { id: "events", label: "Campus events" },
    { id: "clubs", label: "Clubs & societies" },
    { id: "announcements", label: "Announcements" },
    { id: "discounts", label: "Local discounts" },
    { id: "volunteer", label: "Volunteer" }
  ];

  const toggleInterested = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, interested: !e.interested } : e))
    );
  };

  const toggleJoinedClub = (id: string) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c))
    );
  };

  const toggleAnnouncementRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: !a.read } : a))
    );
  };

  const toggleDiscountUsed = (id: string) => {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, used: !d.used } : d))
    );
  };

  const toggleVolunteerSignup = (id: string) => {
    setVolunteerRoles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, signedUp: !v.signedUp } : v))
    );
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
                See what is happening on campus and mark events you’re interested in.
              </p>
              {events.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No upcoming events at the moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
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
                        onClick={() => toggleInterested(event.id)}
                      >
                        {event.interested ? "Interested ✓" : "I’m interested"}
                      </Button>
                    </div>
                  ))}
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
              {clubs.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No clubs listed yet.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {clubs.map((club) => (
                    <div
                      key={club.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{club.name}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                          {club.category}
                        </p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{club.description}</p>
                      </div>
                      <Button
                        variant={club.joined ? "secondary" : "primary"}
                        className="mt-3 self-start"
                        onClick={() => toggleJoinedClub(club.id)}
                      >
                        {club.joined ? "Joined ✓" : "Join club"}
                      </Button>
                    </div>
                  ))}
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
              {announcements.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No announcements at the moment.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {announcements.map((a) => (
                    <li
                      key={a.id}
                      className={`flex items-start justify-between gap-3 rounded-xl border p-3 dark:border-slate-700 ${
                        a.read ? "bg-slate-50/60 dark:bg-slate-800/40" : "bg-white dark:bg-slate-900/60"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
                        <p className="text-xs text-slate-500">{a.date}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{a.body}</p>
                      </div>
                      <Button
                        variant="secondary"
                        className="shrink-0 text-xs"
                        onClick={() => toggleAnnouncementRead(a.id)}
                      >
                        {a.read ? "Mark unread" : "Mark read"}
                      </Button>
                    </li>
                  ))}
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
                Student‑only deals at cafés, bookshops and more.
              </p>
              {discounts.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No offers listed yet.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {discounts.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{d.name}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{d.category}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{d.description}</p>
                        <p className="mt-1 text-xs text-slate-500">Near: {d.location}</p>
                      </div>
                      <Button
                        variant={d.used ? "secondary" : "primary"}
                        className="mt-3 self-start"
                        onClick={() => toggleDiscountUsed(d.id)}
                      >
                        {d.used ? "Saved ✓" : "Save to use"}
                      </Button>
                    </div>
                  ))}
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
              {volunteerRoles.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  No volunteer roles listed yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {volunteerRoles.map((v) => (
                    <div
                      key={v.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{v.title}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                          {v.org} · {v.location}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Time: {v.hoursPerWeek}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{v.description}</p>
                      </div>
                      <Button
                        variant={v.signedUp ? "secondary" : "primary"}
                        className="shrink-0"
                        onClick={() => toggleVolunteerSignup(v.id)}
                      >
                        {v.signedUp ? "Signed up ✓" : "Sign up"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

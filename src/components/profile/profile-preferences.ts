"use client";

import type { Variants } from "framer-motion";

export type ProfileTab = "profile" | "settings" | "security";

export type ProfilePreferences = {
  privacy: {
    shareCareerInterestsWithMentors: boolean;
    shareFinancialAidWithAdmins: boolean;
  };
  notifications: {
    emailApplicationStatus: boolean;
    mentorshipSessionReminders: boolean;
    weeklyWellnessReminder: boolean;
  };
  updatedAt?: string;
};

export const defaultPreferences: ProfilePreferences = {
  privacy: {
    shareCareerInterestsWithMentors: true,
    shareFinancialAidWithAdmins: true
  },
  notifications: {
    emailApplicationStatus: true,
    mentorshipSessionReminders: true,
    weeklyWellnessReminder: false
  }
};

export const tabVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 }
};

export function mergePreferences(payload: Partial<ProfilePreferences> | null | undefined): ProfilePreferences {
  return {
    privacy: {
      shareCareerInterestsWithMentors:
        payload?.privacy?.shareCareerInterestsWithMentors ?? defaultPreferences.privacy.shareCareerInterestsWithMentors,
      shareFinancialAidWithAdmins:
        payload?.privacy?.shareFinancialAidWithAdmins ?? defaultPreferences.privacy.shareFinancialAidWithAdmins
    },
    notifications: {
      emailApplicationStatus:
        payload?.notifications?.emailApplicationStatus ?? defaultPreferences.notifications.emailApplicationStatus,
      mentorshipSessionReminders:
        payload?.notifications?.mentorshipSessionReminders ?? defaultPreferences.notifications.mentorshipSessionReminders,
      weeklyWellnessReminder:
        payload?.notifications?.weeklyWellnessReminder ?? defaultPreferences.notifications.weeklyWellnessReminder
    },
    updatedAt: payload?.updatedAt
  };
}

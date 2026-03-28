type DemoProfilePreferences = {
  privacy: {
    shareCareerInterestsWithMentors: boolean;
    shareFinancialAidWithAdmins: boolean;
  };
  notifications: {
    emailApplicationStatus: boolean;
    mentorshipSessionReminders: boolean;
    weeklyWellnessReminder: boolean;
  };
  updatedAt: string;
};

type DemoDeleteRequest = {
  _id: string;
  userId?: string;
  firebaseUid?: string;
  email?: string;
  name?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
};

const defaultPreferences: DemoProfilePreferences = {
  privacy: {
    shareCareerInterestsWithMentors: true,
    shareFinancialAidWithAdmins: true
  },
  notifications: {
    emailApplicationStatus: true,
    mentorshipSessionReminders: true,
    weeklyWellnessReminder: false
  },
  updatedAt: new Date().toISOString()
};

let preferenceStore = new Map<string, DemoProfilePreferences>();
let deleteRequests: DemoDeleteRequest[] = [];

function keyFor(userId?: string, firebaseUid?: string) {
  return userId || firebaseUid || "default";
}

function clonePreferences(prefs: DemoProfilePreferences) {
  return {
    privacy: { ...prefs.privacy },
    notifications: { ...prefs.notifications },
    updatedAt: prefs.updatedAt
  };
}

export function getDemoProfilePreferences(input: { userId?: string; firebaseUid?: string }) {
  const key = keyFor(input.userId, input.firebaseUid);
  const existing = preferenceStore.get(key);
  if (existing) return clonePreferences(existing);
  return clonePreferences(defaultPreferences);
}

export function saveDemoProfilePreferences(input: {
  userId?: string;
  firebaseUid?: string;
  privacy?: Partial<DemoProfilePreferences["privacy"]>;
  notifications?: Partial<DemoProfilePreferences["notifications"]>;
}) {
  const key = keyFor(input.userId, input.firebaseUid);
  const current = preferenceStore.get(key) ?? clonePreferences(defaultPreferences);
  const next: DemoProfilePreferences = {
    privacy: {
      shareCareerInterestsWithMentors:
        input.privacy?.shareCareerInterestsWithMentors ?? current.privacy.shareCareerInterestsWithMentors,
      shareFinancialAidWithAdmins:
        input.privacy?.shareFinancialAidWithAdmins ?? current.privacy.shareFinancialAidWithAdmins
    },
    notifications: {
      emailApplicationStatus:
        input.notifications?.emailApplicationStatus ?? current.notifications.emailApplicationStatus,
      mentorshipSessionReminders:
        input.notifications?.mentorshipSessionReminders ?? current.notifications.mentorshipSessionReminders,
      weeklyWellnessReminder:
        input.notifications?.weeklyWellnessReminder ?? current.notifications.weeklyWellnessReminder
    },
    updatedAt: new Date().toISOString()
  };
  preferenceStore.set(key, next);
  return clonePreferences(next);
}

export function addDemoDeleteRequest(input: {
  userId?: string;
  firebaseUid?: string;
  email?: string;
  name?: string;
  reason?: string;
}) {
  const now = new Date().toISOString();
  const row: DemoDeleteRequest = {
    _id: `ddr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: input.userId,
    firebaseUid: input.firebaseUid,
    email: input.email,
    name: input.name,
    reason: input.reason,
    status: "pending",
    requestedAt: now,
    createdAt: now,
    updatedAt: now
  };
  deleteRequests = [row, ...deleteRequests];
  return { ...row };
}

export function findPendingDemoDeleteRequest(input: { userId?: string; firebaseUid?: string }) {
  return (
    deleteRequests.find((item) => {
      const userMatch = input.userId && item.userId === input.userId;
      const firebaseMatch = input.firebaseUid && item.firebaseUid === input.firebaseUid;
      return (userMatch || firebaseMatch) && item.status === "pending";
    }) ?? null
  );
}

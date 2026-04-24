"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { useAuth } from "@/context/auth-context";
import { studentBlueCardClass } from "@/components/dashboard/student/student-card-theme";

type ProfileTab = "profile" | "settings" | "security";

type ProfilePreferences = {
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

const defaultPreferences: ProfilePreferences = {
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

const tabVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 }
};

function mergePreferences(payload: Partial<ProfilePreferences> | null | undefined): ProfilePreferences {
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

export function StudentProfile() {
  const { user, refreshUser, updateUserProfile, requestPasswordReset } = useAuth();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.contact ?? "");
  const [university, setUniversity] = useState(user?.university ?? "");
  const [degreeProgram, setDegreeProgram] = useState(user?.roleDetails?.degreeProgram ?? "");
  const [studyYear, setStudyYear] = useState(user?.roleDetails?.studyYear ?? "");

  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [academicSaving, setAcademicSaving] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferences, setPreferences] = useState<ProfilePreferences>(defaultPreferences);

  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setContact(user.contact ?? "");
    setUniversity(user.university ?? "");
    setDegreeProgram(user.roleDetails?.degreeProgram ?? "");
    setStudyYear(user.roleDetails?.studyYear ?? "");
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    async function loadProfilePreferences() {
      setPreferencesLoading(true);
      try {
        const response = await fetch("/api/profile/preferences", { cache: "no-store" });
        const payload = (await response.json()) as Partial<ProfilePreferences>;
        if (!cancelled && response.ok) {
          setPreferences(mergePreferences(payload));
        }
      } catch {
        if (!cancelled) {
          setPreferences(mergePreferences(null));
        }
      } finally {
        if (!cancelled) {
          setPreferencesLoading(false);
        }
      }
    }

    async function loadDeleteRequestStatus() {
      try {
        const response = await fetch("/api/profile/delete-request", { cache: "no-store" });
        const payload = (await response.json()) as {
          pending?: boolean;
          request?: { status?: "pending" | "approved" | "rejected" } | null;
        };
        if (!cancelled && response.ok) {
          const isPending = Boolean(payload.pending || payload.request?.status === "pending");
          setDeletePending(isPending);
        }
      } catch {
        if (!cancelled) {
          setDeletePending(false);
        }
      }
    }

    loadProfilePreferences();
    loadDeleteRequestStatus();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const savePersonal = async () => {
    if (!user?.email) return;
    setMessage(null);
    setPersonalSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
          email: user.email,
          name: name.trim() || user.name,
          contact: contact.trim() || undefined
        })
      });
      const payload = (await response.json()) as {
        user?: { name?: string; contact?: string };
        message?: string;
      };
      if (response.ok && payload.user) {
        updateUserProfile({ name: payload.user.name, contact: payload.user.contact });
        await refreshUser();
        setMessage({ type: "ok", text: "Personal details updated." });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setPersonalSaving(false);
    }
  };

  const saveAcademic = async () => {
    if (!user?.email) return;
    setMessage(null);
    setAcademicSaving(true);

    const currentRoleDetails = { ...(user.roleDetails ?? {}) };
    const nextDegree = degreeProgram.trim();
    const nextYear = studyYear.trim();

    if (nextDegree) {
      currentRoleDetails.degreeProgram = nextDegree;
    } else {
      delete currentRoleDetails.degreeProgram;
    }

    if (nextYear) {
      currentRoleDetails.studyYear = nextYear;
    } else {
      delete currentRoleDetails.studyYear;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
          email: user.email,
          name: user.name,
          university: university.trim() || undefined,
          roleDetails: currentRoleDetails
        })
      });
      const payload = (await response.json()) as {
        user?: { university?: string; roleDetails?: Record<string, string> };
        message?: string;
      };
      if (response.ok && payload.user) {
        updateUserProfile({ university: payload.user.university, roleDetails: payload.user.roleDetails });
        await refreshUser();
        setMessage({ type: "ok", text: "Academic info updated." });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setAcademicSaving(false);
    }
  };

  const savePreferences = async (successText: string) => {
    setMessage(null);
    setPreferencesSaving(true);
    try {
      const response = await fetch("/api/profile/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privacy: preferences.privacy,
          notifications: preferences.notifications
        })
      });
      const payload = (await response.json()) as {
        message?: string;
        preferences?: Partial<ProfilePreferences>;
      };
      if (response.ok) {
        if (payload.preferences) {
          setPreferences(mergePreferences(payload.preferences));
        }
        setMessage({ type: "ok", text: successText });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save preferences." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save preferences. Try again." });
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setProfilePicUploading(true);
      setMessage(null);
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
            email: user.email,
            profilePic: dataUrl
          })
        });
        const payload = (await response.json()) as { user?: { profilePic?: string }; message?: string };
        if (response.ok && payload.user) {
          updateUserProfile({ profilePic: payload.user.profilePic });
          await refreshUser();
          setMessage({ type: "ok", text: "Profile picture updated." });
        } else {
          setMessage({ type: "err", text: payload.message ?? "Could not update picture." });
        }
      } catch {
        setMessage({ type: "err", text: "Could not update picture. Try again." });
      } finally {
        setProfilePicUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setSecurityMessage(null);
    try {
      await requestPasswordReset(user.email);
      setSecurityMessage({ type: "ok", text: "Password reset link sent to your email." });
    } catch {
      setSecurityMessage({ type: "err", text: "Could not send reset email. Try again." });
    }
  };

  const handleSubmitDeleteRequest = async () => {
    if (!window.confirm("Submit account deletion request for admin review?")) {
      return;
    }

    setSecurityMessage(null);
    setDeleteSubmitting(true);
    try {
      const response = await fetch("/api/profile/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: deleteReason.trim() || undefined
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (response.ok || response.status === 409) {
        setDeletePending(true);
        setSecurityMessage({
          type: "ok",
          text: payload.message ?? "Deletion request submitted for admin review."
        });
      } else {
        setSecurityMessage({
          type: "err",
          text: payload.message ?? "Could not submit deletion request. Try again."
        });
      }
    } catch {
      setSecurityMessage({ type: "err", text: "Could not submit deletion request. Try again." });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "settings", label: "Preferences" },
    { id: "security", label: "Security" }
  ];

  const initials =
    (user?.name ?? user?.email ?? "U")
      .split(/\s+/)
      .map((segment) => segment[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`rounded-xl border px-4 py-2 text-sm ${
            message.type === "ok"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {securityMessage && (
        <p
          className={`rounded-xl border px-4 py-2 text-sm ${
            securityMessage.type === "ok"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {securityMessage.text}
        </p>
      )}

      <Card className={`flex flex-wrap items-center justify-between gap-4 p-5 ${studentBlueCardClass}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-slate-100 dark:border-primary/60 dark:bg-slate-800">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary">{initials}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Student profile</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name ?? "Your name"}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePicChange}
              disabled={profilePicUploading}
            />
            {profilePicUploading ? "Uploading..." : "Change picture"}
          </label>
        </div>
      </Card>

      <Card className={`p-4 ${studentBlueCardClass}`}>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Profile visibility is controlled by privacy settings. Some fields are hidden from certain roles.
        </p>
      </Card>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Profile sections">
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
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className={`space-y-4 p-5 ${studentBlueCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <Input type="email" defaultValue={user?.email ?? ""} placeholder="Email" disabled />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact</label>
                  <Input
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <Button variant="primary" onClick={savePersonal} disabled={personalSaving}>
                {personalSaving ? "Saving..." : "Save changes"}
              </Button>
            </Card>

            <Card className={`space-y-4 p-5 ${studentBlueCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Academic info</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                University, degree, and year. Used for eligibility and recommendations.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">University</label>
                  <Input
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                    placeholder="University"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Degree / program</label>
                  <Input
                    value={degreeProgram}
                    onChange={(event) => setDegreeProgram(event.target.value)}
                    placeholder="e.g. BSc Computer Science"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
                  <Input
                    value={studyYear}
                    onChange={(event) => setStudyYear(event.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>
              <Button variant="primary" onClick={saveAcademic} disabled={academicSaving}>
                {academicSaving ? "Saving..." : "Update academic info"}
              </Button>
            </Card>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className={`space-y-4 p-5 ${studentBlueCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy preferences</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Control which roles can see which parts of your profile.
              </p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.privacy.shareCareerInterestsWithMentors}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        privacy: {
                          ...current.privacy,
                          shareCareerInterestsWithMentors: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Allow mentors to see my career interests
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.privacy.shareFinancialAidWithAdmins}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        privacy: {
                          ...current.privacy,
                          shareFinancialAidWithAdmins: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Allow admins to see my financial aid status
                </label>
              </div>
              <Button
                variant="secondary"
                onClick={() => savePreferences("Privacy settings saved.")}
                disabled={preferencesLoading || preferencesSaving}
              >
                {preferencesSaving ? "Saving..." : "Save privacy settings"}
              </Button>
            </Card>

            <Card className={`space-y-4 p-5 ${studentBlueCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification settings</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Choose how you receive updates on applications, sessions, and deadlines.
              </p>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.notifications.emailApplicationStatus}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        notifications: {
                          ...current.notifications,
                          emailApplicationStatus: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Email for application status changes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.notifications.mentorshipSessionReminders}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        notifications: {
                          ...current.notifications,
                          mentorshipSessionReminders: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Reminders for mentorship sessions
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={preferences.notifications.weeklyWellnessReminder}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        notifications: {
                          ...current.notifications,
                          weeklyWellnessReminder: event.target.checked
                        }
                      }))
                    }
                    disabled={preferencesLoading}
                  />
                  Weekly wellness check-in reminder
                </label>
              </div>
              <Button
                variant="secondary"
                onClick={() => savePreferences("Notification settings saved.")}
                disabled={preferencesLoading || preferencesSaving}
              >
                {preferencesSaving ? "Saving..." : "Save notification settings"}
              </Button>
              {preferences.updatedAt ? (
                <p className="text-xs text-slate-500">Last updated: {new Date(preferences.updatedAt).toLocaleString()}</p>
              ) : null}
            </Card>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            key="security"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card className={`space-y-3 p-5 ${studentBlueCardClass}`}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Password and sign-in</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Send yourself a secure link to reset your password. This uses your login email address.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Input type="email" value={user?.email ?? ""} disabled className="max-w-xs" />
                <Button variant="secondary" onClick={handleSendResetEmail} disabled={!user?.email}>
                  Send reset link
                </Button>
              </div>
            </Card>

            <Card className="space-y-3 border-red-200 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/40">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Delete account request</h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                Submit a request and the university admin team will review it. Your account is not deleted instantly.
              </p>
              <textarea
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Optional reason for deletion request"
                className="min-h-[90px] w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-red-300 dark:border-red-700 dark:bg-slate-900 dark:text-slate-100"
                disabled={deletePending || deleteSubmitting}
              />
              <Button
                variant="secondary"
                className="border-red-400 text-red-800 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/40"
                onClick={handleSubmitDeleteRequest}
                disabled={deletePending || deleteSubmitting}
              >
                {deletePending ? "Deletion request pending" : deleteSubmitting ? "Submitting..." : "Request account deletion"}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

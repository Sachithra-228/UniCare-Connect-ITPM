"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { useAuth } from "@/context/auth-context";
import {
  defaultPreferences,
  mergePreferences,
  tabVariants,
  type ProfilePreferences,
  type ProfileTab
} from "@/components/profile/profile-preferences";

type ScholarshipOrProgram = {
  _id?: string;
  title?: string;
  amount?: string | number;
  status?: string;
};

type AidRequest = {
  _id?: string;
  category?: string;
  status?: string;
  submittedAt?: string;
};

type NgoSectionContentProps = {
  sectionId: string;
};

export function NgoSectionContent({ sectionId }: NgoSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "organization-home":
        return NgoOrganizationHomeSection;
      case "programs":
        return NgoProgramsSection;
      case "funding":
        return NgoFundingSection;
      case "beneficiaries":
        return NgoBeneficiariesSection;
      case "reports":
        return NgoReportsSection;
      case "partnerships":
        return NgoPartnershipsSection;
      case "communications":
        return NgoCommunicationsSection;
      case "profile":
        return NgoProfileSection;
      default:
        return NgoOrganizationHomeSection;
    }
  }, [sectionId]);

  return <Section />;
}

function usePrograms() {
  const [programs, setPrograms] = useState<ScholarshipOrProgram[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Reuse scholarships as NGO support programs until a dedicated programs API exists.
    fetch("/api/scholarships")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setPrograms(data);
        }
      })
      .catch(() => {
        // Silent fallback; UI will show empty state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return programs;
}

function useAidRequests() {
  const [requests, setRequests] = useState<AidRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/aid-requests")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setRequests(data);
        }
      })
      .catch(() => {
        // Silent fallback; UI will show empty state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return requests;
}

function NgoOrganizationHomeSection() {
  const programs = usePrograms();
  const aidRequests = useAidRequests();

  const activePrograms = programs.length;
  const beneficiaries = aidRequests.length;
  const pendingCases = aidRequests.filter(
    (r) => r.status && !["Approved", "approved", "Completed"].includes(r.status)
  ).length;

  const impactStories = [
    {
      id: "i1",
      title: "Keeping students enrolled during crisis",
      summary: "Emergency stipends helped students from low‑income families continue their studies."
    },
    {
      id: "i2",
      title: "Supporting student mental health",
      summary:
        "Wellness support programs funded by NGOs reduced dropout risk in high‑stress semesters."
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active programs"
          value={String(activePrograms)}
          description="Scholarships / relief initiatives"
        />
        <StatCard
          label="Beneficiaries"
          value={String(beneficiaries)}
          description="Students linked to your support"
        />
        <StatCard
          label="Cases pending review"
          value={String(pendingCases)}
          description="Awaiting allocation / decision"
        />
        <StatCard
          label="Highlighted needs"
          value="—"
          description="Configured with university & donors"
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">Recent impact stories</h3>
        <div className="space-y-3 text-sm">
          {impactStories.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-xs text-slate-500">{s.summary}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NgoProgramsSection() {
  const programs = usePrograms();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Create and manage NGO support programs. Students apply here, and university admins help
        verify eligibility. This workspace is not connected to jobs or mentorship data.
      </p>
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Programs</h3>
          <button className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90">
            Create program
          </button>
        </div>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {programs.map((p) => (
            <div
              key={p._id ?? p.title}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{p.title ?? "Support program"}</p>
                <p className="text-xs text-slate-500">
                  Typical support: {p.amount ?? "N/A"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {p.status ?? "Open"}
              </span>
            </div>
          ))}
          {!programs.length && (
            <p className="py-3 text-sm text-slate-500">
              No programs found yet. Use &quot;Create program&quot; to define your first support
              initiative.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function NgoFundingSection() {
  const aidRequests = useAidRequests();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Allocate grants, manage emergency relief funds, and track disbursement. Donors fund these
        programs; university admins help verify final distribution to students.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Funding queue</h3>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {aidRequests.map((r) => (
            <div
              key={r._id ?? r.category}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{r.category ?? "Aid request"}</p>
                <p className="text-xs text-slate-500">
                  Submitted: {r.submittedAt ?? "N/A"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {r.status ?? "Pending"}
              </span>
            </div>
          ))}
          {!aidRequests.length && (
            <p className="py-3 text-sm text-slate-500">
              No funding records yet. As students apply to your programs and receive support, those
              entries will appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function NgoBeneficiariesSection() {
  const aidRequests = useAidRequests();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Track students who benefit from your programs. Mentors and employers do not see this view;
        it is limited to program participation and high‑level progress.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Beneficiaries</h3>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {aidRequests.map((r) => (
            <div key={r._id ?? r.category} className="flex flex-col gap-1 py-3">
              <p className="font-medium">{r.category ?? "Support record"}</p>
              <p className="text-xs text-slate-500">
                Status: {r.status ?? "In progress"} • Student identity protected unless consent is
                recorded.
              </p>
            </div>
          ))}
          {!aidRequests.length && (
            <p className="py-3 text-sm text-slate-500">
              Once students are linked to your programs, anonymized beneficiary records will appear
              here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function NgoReportsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Generate program impact reports and fund utilization summaries for donors and university
        stakeholders. Only program‑related data is included here.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Program reports</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="font-semibold">Program impact summary</p>
              <p className="mt-1 text-xs text-slate-500">
                Reach, retention indicators, and key outcomes across all active programs.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                For donors & admin
              </span>
              <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90">
                Generate
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="font-semibold">Fund utilization & compliance</p>
              <p className="mt-1 text-xs text-slate-500">
                Allocation vs. disbursement, outstanding balances, and audit‑ready exports.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Compliance export
              </span>
              <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90">
                Export
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NgoPartnershipsSection() {
  const partners = [
    {
      id: "p1",
      name: "University student affairs office",
      type: "University admin",
      role: "Joint program design & verification"
    },
    {
      id: "p2",
      name: "Corporate CSR partner",
      type: "Donor",
      role: "Co‑funded scholarships and relief funds"
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Manage collaborations with university teams and donors. Individual student data is
        protected; only program‑level information is shared here.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Partners</h3>
        <div className="space-y-3 text-sm">
          {partners.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-slate-500">{p.type}</p>
              <p className="mt-1 text-xs text-slate-500">Role: {p.role}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NgoCommunicationsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Share updates with beneficiaries and donors. This channel is dedicated to programs and
        awareness campaigns, not job postings or mentorship.
      </p>
      <Card className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Audience
            </label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
              <option>Program beneficiaries</option>
              <option>All applicants</option>
              <option>Donor partners</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Communication type
            </label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
              <option>Program update</option>
              <option>Newsletter</option>
              <option>Feedback request</option>
              <option>Awareness campaign</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Message
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Write a program update or newsletter..."
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-slate-500">
            <p>Only students linked to your programs can receive these messages.</p>
            <p>Communications here are not connected to the job portal or mentorship flows.</p>
          </div>
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Send
          </button>
        </div>
      </Card>
    </div>
  );
}

function NgoProfileSection() {
  const { user, refreshUser, updateUserProfile, requestPasswordReset } = useAuth();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.contact ?? "");
  const [organizationName, setOrganizationName] = useState(user?.roleDetails?.organizationName ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(user?.roleDetails?.registrationNumber ?? "");
  const [registrationDocuments, setRegistrationDocuments] = useState(user?.roleDetails?.registrationDocuments ?? "");
  const [focusAreas, setFocusAreas] = useState(user?.roleDetails?.focusAreas ?? "");
  const [teamAccess, setTeamAccess] = useState(user?.roleDetails?.teamAccess ?? "Single administrator");

  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [ngoSaving, setNgoSaving] = useState(false);
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
    setOrganizationName(user.roleDetails?.organizationName ?? "");
    setRegistrationNumber(user.roleDetails?.registrationNumber ?? "");
    setRegistrationDocuments(user.roleDetails?.registrationDocuments ?? "");
    setFocusAreas(user.roleDetails?.focusAreas ?? "");
    setTeamAccess(user.roleDetails?.teamAccess ?? "Single administrator");
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    async function loadPreferences() {
      setPreferencesLoading(true);
      try {
        const response = await fetch("/api/profile/preferences", { cache: "no-store" });
        const payload = (await response.json()) as Partial<ProfilePreferences>;
        if (!cancelled && response.ok) {
          setPreferences(mergePreferences(payload));
        }
      } catch {
        if (!cancelled) setPreferences(mergePreferences(null));
      } finally {
        if (!cancelled) setPreferencesLoading(false);
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
        if (!cancelled) setDeletePending(false);
      }
    }

    void loadPreferences();
    void loadDeleteRequestStatus();

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
      const payload = (await response.json()) as { user?: { name?: string; contact?: string }; message?: string };
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

  const saveNgoProfile = async () => {
    if (!user?.email) return;
    setMessage(null);
    setNgoSaving(true);

    const currentRoleDetails = { ...(user.roleDetails ?? {}) };
    const nextOrgName = organizationName.trim();
    const nextRegNumber = registrationNumber.trim();
    const nextRegDocs = registrationDocuments.trim();
    const nextFocusAreas = focusAreas.trim();

    if (nextOrgName) {
      currentRoleDetails.organizationName = nextOrgName;
    } else {
      delete currentRoleDetails.organizationName;
    }
    if (nextRegNumber) {
      currentRoleDetails.registrationNumber = nextRegNumber;
    } else {
      delete currentRoleDetails.registrationNumber;
    }
    if (nextRegDocs) {
      currentRoleDetails.registrationDocuments = nextRegDocs;
    } else {
      delete currentRoleDetails.registrationDocuments;
    }
    if (nextFocusAreas) {
      currentRoleDetails.focusAreas = nextFocusAreas;
    } else {
      delete currentRoleDetails.focusAreas;
    }
    if (teamAccess) {
      currentRoleDetails.teamAccess = teamAccess;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
          email: user.email,
          name: user.name,
          roleDetails: currentRoleDetails
        })
      });
      const payload = (await response.json()) as {
        user?: { roleDetails?: Record<string, string> };
        message?: string;
      };
      if (response.ok && payload.user) {
        updateUserProfile({ roleDetails: payload.user.roleDetails });
        await refreshUser();
        setMessage({ type: "ok", text: "Organization profile updated." });
      } else {
        setMessage({ type: "err", text: payload.message ?? "Could not save." });
      }
    } catch {
      setMessage({ type: "err", text: "Could not save. Try again." });
    } finally {
      setNgoSaving(false);
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
      const payload = (await response.json()) as { message?: string; preferences?: Partial<ProfilePreferences> };
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

      <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/20 bg-gradient-to-r from-primary/5 via-white to-emerald-50 p-5 dark:from-primary/10 dark:via-slate-900 dark:to-emerald-900/20">
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
            <p className="text-sm font-medium uppercase tracking-wide text-primary">NGO profile</p>
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

      <Card className="border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Maintain your organization profile and registration details.
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
            <Card className="space-y-4 p-5">
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

            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Organization details</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Registration and focus areas used by university admins for verification.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization name</label>
                  <Input
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="NGO or foundation name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Registration number</label>
                  <Input
                    value={registrationNumber}
                    onChange={(event) => setRegistrationNumber(event.target.value)}
                    placeholder="Official registration ID"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Registration documents (link or reference)
                  </label>
                  <Input
                    value={registrationDocuments}
                    onChange={(event) => setRegistrationDocuments(event.target.value)}
                    placeholder="Stored document link or reference ID"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Focus areas</label>
                  <Input
                    value={focusAreas}
                    onChange={(event) => setFocusAreas(event.target.value)}
                    placeholder="Education, health, emergency relief"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Team access</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={teamAccess}
                    onChange={(event) => setTeamAccess(event.target.value)}
                  >
                    <option>Single administrator</option>
                    <option>Admin + read-only members</option>
                    <option>Full team management</option>
                  </select>
                </div>
              </div>
              <Button variant="primary" onClick={saveNgoProfile} disabled={ngoSaving}>
                {ngoSaving ? "Saving..." : "Update organization profile"}
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
            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Privacy preferences</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Control what is shared with donors and university admins.
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
                  Share program focus areas with mentors
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
                  Share funding status with university admins
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

            <Card className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification settings</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Choose how you receive updates about aid allocations and beneficiaries.
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
                  Reminders for review tasks
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
                  Weekly NGO update reminder
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
            <Card className="space-y-3 p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Password and sign-in</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Send yourself a secure link to reset your password.
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
                Submit a request and the university admin team will review it.
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



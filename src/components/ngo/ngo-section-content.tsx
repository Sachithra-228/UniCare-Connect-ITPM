"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

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
  return (
    <RoleProfileShell roleLabel="NGO / funding organization profile">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Maintain your organization profile, registration documents, and focus areas. You can only
          manage your own NGO account from here.
        </p>
        <Card className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Organization name
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="NGO / foundation name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Registration number
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Official registration ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Registration documents (link or reference)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Stored document link or reference ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Focus areas
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="E.g. education, health, emergency relief"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Team access
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
                <option>Single administrator</option>
                <option>Admin + read‑only members</option>
                <option>Full team management</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Save profile
            </button>
          </div>
        </Card>
      </div>
    </RoleProfileShell>
  );
}


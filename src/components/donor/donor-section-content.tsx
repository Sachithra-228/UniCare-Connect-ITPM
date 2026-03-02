"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { StatCard } from "@/components/shared/stat-card";
import { RoleProfileShell } from "@/components/profile/role-profile-shell";

type Scholarship = {
  _id?: string;
  title?: string;
  amount?: string | number;
  status?: string;
  deadline?: string;
};

type AidRequest = {
  _id?: string;
  category?: string;
  status?: string;
  submittedAt?: string;
};

type DonorSectionContentProps = {
  sectionId: string;
};

export function DonorSectionContent({ sectionId }: DonorSectionContentProps) {
  const Section = useMemo(() => {
    switch (sectionId) {
      case "partner-home":
        return DonorPartnerHomeSection;
      case "my-scholarships":
        return DonorMyScholarshipsSection;
      case "funded-students":
        return DonorFundedStudentsSection;
      case "donations":
        return DonorDonationsSection;
      case "impact-reports":
        return DonorImpactReportsSection;
      case "recognition":
        return DonorRecognitionSection;
      case "communications":
        return DonorCommunicationsSection;
      case "profile":
        return DonorProfileSection;
      default:
        return DonorPartnerHomeSection;
    }
  }, [sectionId]);

  return <Section />;
}

function useScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/scholarships")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setScholarships(data);
        }
      })
      .catch(() => {
        // Silent fallback; component will render empty state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return scholarships;
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
        // Silent fallback; component will render empty state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return requests;
}

function DonorPartnerHomeSection() {
  const scholarships = useScholarships();
  const aidRequests = useAidRequests();

  const totalScholarships = scholarships.length;
  const openScholarships = scholarships.filter(
    (s) => !s.status || !["closed", "Closed"].includes(s.status)
  ).length;

  const emergencyAidCount = aidRequests.filter((r) =>
    (r.category ?? "").toLowerCase().includes("emergency")
  ).length;

  const thankYouMessages = [
    {
      id: "t1",
      from: "Student (anonymized)",
      message: "Your scholarship allowed me to stay enrolled this semester.",
      program: "Emergency Support Fund"
    },
    {
      id: "t2",
      from: "Student (anonymized)",
      message: "Thank you for funding my laptop; it changed how I learn.",
      program: "Digital Access Grant"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active scholarships"
          value={String(openScholarships)}
          description="Currently accepting applications"
        />
        <StatCard
          label="Total scholarships created"
          value={String(totalScholarships)}
          description="Across all programs"
        />
        <StatCard
          label="Emergency aid cases"
          value={String(emergencyAidCount)}
          description="Requests linked to your funds"
        />
        <StatCard
          label="Upcoming deadlines"
          value={String(
            scholarships.filter((s) => s.deadline && s.deadline >= new Date().toISOString().split("T")[0])
              .length
          )}
          description="Scholarship application cut‑offs"
        />
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">Recent thank you messages</h3>
        <div className="space-y-3 text-sm">
          {thankYouMessages.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t.program}
              </p>
              <p className="mt-1 text-slate-800 dark:text-slate-100">{t.message}</p>
              <p className="mt-1 text-xs text-slate-500">From: {t.from}</p>
            </div>
          ))}
          {!thankYouMessages.length && (
            <p className="text-sm text-slate-500">
              No messages yet. As students receive aid, anonymized thank you notes will appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function DonorMyScholarshipsSection() {
  const scholarships = useScholarships();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Manage the scholarships you sponsor. Students apply here, and university admins verify
        eligibility before final selection.
      </p>
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Scholarship listings</h3>
          <button className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary/90">
            Create scholarship
          </button>
        </div>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {scholarships.map((s) => (
            <div key={s._id ?? s.title} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{s.title ?? "Scholarship"}</p>
                <p className="text-xs text-slate-500">
                  Amount: {s.amount ?? "N/A"}{" "}
                  {s.deadline && <>• Deadline: {s.deadline}</>}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {s.status ?? "Open"}
              </span>
            </div>
          ))}
          {!scholarships.length && (
            <p className="py-3 text-sm text-slate-500">
              No scholarships found yet. Use &quot;Create scholarship&quot; to add your first
              program.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function DonorFundedStudentsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        View funded students and high‑level progress (only with consent). Detailed wellness data is
        never shared in this view.
      </p>
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Current scholars</h3>
          <span className="text-xs text-slate-500">
            Student identities anonymized unless explicit consent is recorded.
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Backend wiring for linking individual funded students to donor programs will use the
          scholarship and aid records. For now, this section is ready for integrating that mapping
          once the data model is finalized.
        </p>
      </Card>
    </div>
  );
}

function DonorDonationsSection() {
  const aidRequests = useAidRequests();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Track emergency fund support and other contributions. Academic details are only visible
        where students have consented.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Emergency fund distribution</h3>
        <div className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {aidRequests.map((r) => (
            <div key={r._id ?? r.category} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
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
              No linked emergency fund requests yet. As students receive support through your funds,
              those records will appear here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function DonorImpactReportsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Impact reports aggregate scholarship and aid data into anonymized, CSR‑ready views.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Impact report templates</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="font-semibold">Scholarship impact overview</p>
              <p className="mt-1 text-xs text-slate-500">
                Students supported, retention impact, and graduation rates (anonymized).
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                CSR ready
              </span>
              <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90">
                Generate
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="font-semibold">Student demographics</p>
              <p className="mt-1 text-xs text-slate-500">
                Breakdown by gender, region, income band, and field of study.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Aggregated only
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

function DonorRecognitionSection() {
  const stories = [
    {
      id: "s1",
      title: "First‑gen graduate from rural district",
      summary: "Emergency tuition support helped this student complete their degree on time."
    },
    {
      id: "s2",
      title: "STEM scholar builds community robotics club",
      summary: "Equipment funding enabled hands‑on learning for dozens of younger students."
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Recognition highlights anonymized student stories and thank you messages. Individual
        identities are only shared if everyone has opted in.
      </p>
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Featured stories</h3>
        <div className="space-y-3 text-sm">
          {stories.map((s) => (
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

function DonorCommunicationsSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Use this space to communicate with scholarship recipients and university admins. Students
        cannot modify your messages.
      </p>
      <Card className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Audience
            </label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
              <option>Scholarship recipients</option>
              <option>University admin (scholarship office)</option>
              <option>Specific cohort / batch</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Communication type
            </label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
              <option>General update</option>
              <option>Interview / story request</option>
              <option>Event invitation</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Message
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="Write a message to your recipients or the university team..."
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-slate-500">
            <p>Students can reply but cannot edit your original messages.</p>
            <p>You cannot message non‑recipients from this workspace.</p>
          </div>
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Send
          </button>
        </div>
      </Card>
    </div>
  );
}

function DonorProfileSection() {
  return (
    <RoleProfileShell roleLabel="Donor / CSR profile">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your own organization profile, branding, and team access. You cannot modify other
          donor accounts.
        </p>
        <Card className="space-y-4 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Organization name
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="Your organization or CSR unit"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Logo URL
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Funding focus areas
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                placeholder="E.g. STEM, first‑gen students, rural access"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Team access level
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900">
                <option>Single admin</option>
                <option>Multiple viewers</option>
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


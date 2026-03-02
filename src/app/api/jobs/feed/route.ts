import { jsonResponse } from "@/lib/api";
import type { JobListing } from "@/types";

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs?limit=20";

type RemotiveJob = {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  salary: string;
  job_type: string;
  publication_date: string;
  url: string;
};

function mapRemotiveType(jobType: string): "part-time" | "full-time" | "internship" {
  const t = (jobType || "").toLowerCase();
  if (t === "part_time" || t === "part-time") return "part-time";
  if (t === "internship") return "internship";
  return "full-time";
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return iso.slice(0, 10) || "";
  }
}

export async function GET() {
  try {
    const res = await fetch(REMOTIVE_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      return jsonResponse([]);
    }
    const data = (await res.json()) as { jobs?: RemotiveJob[] };
    const jobs = data.jobs ?? [];
    const mapped: JobListing[] = jobs.map((j) => ({
      _id: `remotive-${j.id}`,
      title: j.title || "Untitled",
      company: j.company_name || "Company",
      location: j.candidate_required_location || "Remote",
      salary: j.salary || "Not specified",
      type: mapRemotiveType(j.job_type),
      requirements: [],
      applicationDeadline: formatDate(j.publication_date),
      contactEmail: "",
      source: "Remotive",
      externalUrl: j.url || undefined
    }));
    return jsonResponse(mapped);
  } catch {
    return jsonResponse([]);
  }
}

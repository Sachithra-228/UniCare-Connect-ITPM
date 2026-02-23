"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import type { JobListing } from "@/types";

const PAGE_SIZE = 4;

export function JobBoard() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase());
      const matchesLocation = location ? job.location === location : true;
      const matchesType = type ? job.type === type : true;
      return matchesQuery && matchesLocation && matchesType;
    });
  }, [jobs, query, location, type]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const pageJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="space-y-4 border-slate-200/80 dark:border-slate-700/50">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">Part-time & internship job board</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder="Search by title"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          aria-label="Search jobs by title"
        />
        <Select
          value={location}
          onChange={(event) => {
            setLocation(event.target.value);
            setPage(1);
          }}
          aria-label="Filter jobs by location"
        >
          <option value="">All locations</option>
          <option value="Colombo">Colombo</option>
          <option value="Remote">Remote</option>
        </Select>
        <Select
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
          aria-label="Filter jobs by type"
        >
          <option value="">All types</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
        </Select>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
      <div className="space-y-3">
        {pageJobs.map((job) => (
          <div
            key={job._id}
            className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{job.title}</p>
                <p className="text-slate-500">{job.company}</p>
              </div>
              <Badge variant="info">{job.type}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>{job.location}</span>
              <span>{job.salary}</span>
              <span>Apply by {job.applicationDeadline}</span>
            </div>
          </div>
        ))}
        {pageJobs.length === 0 ? (
          <p className="text-sm text-slate-500">No jobs match the filters.</p>
        ) : null}
      </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

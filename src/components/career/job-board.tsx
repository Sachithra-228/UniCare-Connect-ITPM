"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { Input } from "@/components/shared/input";
import { Select } from "@/components/shared/select";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import type { JobListing } from "@/types";
import { useLanguage } from "@/context/language-context";

const PAGE_SIZE = 4;

export function JobBoard() {
  const { language } = useLanguage();
  const text =
    language === "si"
      ? {
          title: "අර්ධකාලීන සහ පුහුණු රැකියා පුවරුව",
          searchPlaceholder: "තනතුරෙන් සොයන්න",
          allLocations: "සියලු ස්ථාන",
          allTypes: "සියලු වර්ග",
          partTime: "අර්ධකාලීන",
          internship: "පුහුණු",
          loading: "පූරණය වෙමින්...",
          applyBy: "අයදුම් අවසන්",
          noJobs: "පෙරහන්වලට ගැලපෙන රැකියා නැත.",
          page: "පිටුව",
          of: "නින්",
          previous: "පෙර",
          next: "ඊළඟ"
        }
      : language === "ta"
        ? {
            title: "பகுதி நேர மற்றும் இன்டர்ன்ஷிப் வேலை பலகை",
            searchPlaceholder: "பதவியால் தேடுக",
            allLocations: "அனைத்து இடங்கள்",
            allTypes: "அனைத்து வகைகள்",
            partTime: "பகுதி நேரம்",
            internship: "இன்டர்ன்ஷிப்",
            loading: "ஏற்றப்படுகிறது...",
            applyBy: "விண்ணப்பிக்க கடைசி",
            noJobs: "வடிப்பான்களுக்கு பொருந்தும் வேலை இல்லை.",
            page: "பக்கம்",
            of: "இல்",
            previous: "முந்தையது",
            next: "அடுத்தது"
          }
        : {
            title: "Part-time & internship job board",
            searchPlaceholder: "Search by title",
            allLocations: "All locations",
            allTypes: "All types",
            partTime: "Part-time",
            internship: "Internship",
            loading: "Loading...",
            applyBy: "Apply by",
            noJobs: "No jobs match the filters.",
            page: "Page",
            of: "of",
            previous: "Previous",
            next: "Next"
          };

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
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{text.title}</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder={text.searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          aria-label={text.searchPlaceholder}
        />
        <Select
          value={location}
          onChange={(event) => {
            setLocation(event.target.value);
            setPage(1);
          }}
          aria-label="Filter jobs by location"
        >
          <option value="">{text.allLocations}</option>
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
          <option value="">{text.allTypes}</option>
          <option value="part-time">{text.partTime}</option>
          <option value="internship">{text.internship}</option>
        </Select>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">{text.loading}</p>
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
              <span>{text.applyBy} {job.applicationDeadline}</span>
            </div>
          </div>
        ))}
        {pageJobs.length === 0 ? <p className="text-sm text-slate-500">{text.noJobs}</p> : null}
      </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span>
          {text.page} {page} {text.of} {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            {text.previous}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            {text.next}
          </Button>
        </div>
      </div>
    </Card>
  );
}

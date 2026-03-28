"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { Select } from "@/components/shared/select";
import { Input } from "@/components/shared/input";

type WellnessResource = {
  _id: string;
  title: string;
  description: string;
  url?: string;
  category: "mental-health" | "self-care" | "nutrition" | "sleep" | "crisis-support";
  language: "en" | "si" | "ta";
};

export function HealthContent() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/wellness-resources")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      const languageMatch = language === "all" || item.language === language;
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return categoryMatch && languageMatch && queryMatch;
    });
  }, [category, language, query, resources]);

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <h3 className="text-lg font-semibold">Health and wellness resources</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Trusted guides, helplines, and self-care content to support your wellbeing.
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources"
          />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            <option value="mental-health">Mental health</option>
            <option value="self-care">Self care</option>
            <option value="nutrition">Nutrition</option>
            <option value="sleep">Sleep</option>
            <option value="crisis-support">Crisis support</option>
          </Select>
          <Select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="all">All languages</option>
            <option value="en">English</option>
            <option value="si">Sinhala</option>
            <option value="ta">Tamil</option>
          </Select>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h4 className="text-base font-semibold">Resource list</h4>
        {loading ? (
          <p className="text-sm text-slate-500">Loading resources...</p>
        ) : !filtered.length ? (
          <p className="text-sm text-slate-500">No resources match your filters right now.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((resource) => (
              <li
                key={resource._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <p className="font-medium text-slate-900 dark:text-white">{resource.title}</p>
                <p className="text-sm text-slate-500">{resource.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {resource.category} · {resource.language.toUpperCase()}
                </p>
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Open resource
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

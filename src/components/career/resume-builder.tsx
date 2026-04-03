"use client";

import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { TextArea } from "@/components/shared/text-area";

export type ResumePersonal = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
};

export type ResumeEducation = {
  id: string;
  institution: string;
  degree: string;
  period: string;
  description: string;
};

export type ResumeExperience = {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
};

export type ResumeProject = {
  id: string;
  name: string;
  period: string;
  description: string;
};

export type ResumeReference = {
  id: string;
  name: string;
  role: string;
  contact: string;
};

export type ResumeData = {
  personal: ResumePersonal;
  summary: string;
  education: ResumeEducation[];
  experience: ResumeExperience[];
  skills: string;
  projects: ResumeProject[];
  references: ResumeReference[];
};

const defaultPersonal: ResumePersonal = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedIn: ""
};

const defaultResume: ResumeData = {
  personal: defaultPersonal,
  summary: "",
  education: [{ id: "e1", institution: "", degree: "", period: "", description: "" }],
  experience: [{ id: "x1", company: "", role: "", period: "", description: "" }],
  skills: "",
  projects: [{ id: "p1", name: "", period: "", description: "" }],
  references: [{ id: "r1", name: "", role: "", contact: "" }]
};

function ResumePreview({ data }: { data: ResumeData }) {
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") return;
    const prevTitle = document.title;
    document.title = data.personal.fullName ? `${data.personal.fullName} - Resume` : "Resume";
    window.print();
    document.title = prevTitle;
  }, [data.personal.fullName]);

  const hasEmptyState =
    !data.personal.fullName &&
    !data.personal.email &&
    !data.summary &&
    data.experience.every((e) => !e.company && !e.role) &&
    data.education.every((e) => !e.institution && !e.degree) &&
    !data.skills.trim() &&
    data.projects.every((p) => !p.name && !p.description) &&
    data.references.every((r) => !r.name && !r.contact);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={previewRef}
        className="resume-preview-document flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900 print:border-0 print:shadow-none"
        style={{ minHeight: "420px" }}
      >
        <div className="mx-auto max-w-[21cm] text-slate-800 dark:text-slate-200">
          {(data.personal.fullName || data.personal.email) && (
            <header className="border-b border-slate-200 pb-4 dark:border-slate-600">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data.personal.fullName || "Your Name"}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0 text-sm text-slate-600 dark:text-slate-400">
                {data.personal.email && <span>{data.personal.email}</span>}
                {data.personal.phone && <span>{data.personal.phone}</span>}
                {data.personal.location && <span>{data.personal.location}</span>}
                {data.personal.linkedIn && (
                  <a
                    href={
                      data.personal.linkedIn.startsWith("http")
                        ? data.personal.linkedIn
                        : `https://${data.personal.linkedIn}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </header>
          )}

          {data.summary && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Summary</h2>
              <p className="mt-1 text-sm leading-relaxed">{data.summary}</p>
            </section>
          )}

          {data.experience.some((e) => e.company || e.role) && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Experience</h2>
              <ul className="mt-3 space-y-4">
                {data.experience.map(
                  (exp) =>
                    (exp.company || exp.role) && (
                      <li key={exp.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold">{exp.role || "Role"}</span>
                          <span className="text-xs text-slate-500">{exp.period}</span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{exp.company}</div>
                        {exp.description && <p className="mt-1 text-sm leading-relaxed">{exp.description}</p>}
                      </li>
                    )
                )}
              </ul>
            </section>
          )}

          {data.education.some((e) => e.institution || e.degree) && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Education</h2>
              <ul className="mt-3 space-y-4">
                {data.education.map(
                  (edu) =>
                    (edu.institution || edu.degree) && (
                      <li key={edu.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold">{edu.degree || "Degree"}</span>
                          <span className="text-xs text-slate-500">{edu.period}</span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{edu.institution}</div>
                        {edu.description && <p className="mt-1 text-sm leading-relaxed">{edu.description}</p>}
                      </li>
                    )
                )}
              </ul>
            </section>
          )}

          {data.skills.trim() && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Skills</h2>
              <p className="mt-1 text-sm leading-relaxed">{data.skills.trim()}</p>
            </section>
          )}

          {data.projects.some((p) => p.name || p.description) && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Projects</h2>
              <ul className="mt-3 space-y-4">
                {data.projects.map(
                  (project) =>
                    (project.name || project.description) && (
                      <li key={project.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold">{project.name || "Project"}</span>
                          <span className="text-xs text-slate-500">{project.period}</span>
                        </div>
                        {project.description && <p className="mt-1 text-sm leading-relaxed">{project.description}</p>}
                      </li>
                    )
                )}
              </ul>
            </section>
          )}

          {data.references.some((r) => r.name || r.contact) && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">References</h2>
              <ul className="mt-3 space-y-3">
                {data.references.map(
                  (ref) =>
                    (ref.name || ref.contact) && (
                      <li key={ref.id} className="text-sm">
                        <p className="font-semibold">{ref.name || "Reference"}</p>
                        {ref.role && <p className="text-slate-600 dark:text-slate-400">{ref.role}</p>}
                        {ref.contact && <p className="text-slate-600 dark:text-slate-400">{ref.contact}</p>}
                      </li>
                    )
                )}
              </ul>
            </section>
          )}

          {hasEmptyState && (
            <p className="text-slate-400 dark:text-slate-500">Fill the form on the left to see your resume here.</p>
          )}
        </div>
      </div>

      <div className="mt-4 print:hidden">
        <Button type="button" onClick={handlePrint} variant="primary" className="w-full">
          Export as PDF
        </Button>
      </div>
    </div>
  );
}

export function ResumeBuilder() {
  const [data, setData] = useState<ResumeData>(defaultResume);

  const setPersonal = (field: keyof ResumePersonal, value: string) => {
    setData((d) => ({ ...d, personal: { ...d.personal, [field]: value } }));
  };

  const setSummary = (value: string) => setData((d) => ({ ...d, summary: value }));

  const setEducation = (id: string, field: keyof ResumeEducation, value: string) => {
    setData((d) => ({
      ...d,
      education: d.education.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    }));
  };

  const addEducation = () => {
    setData((d) => ({
      ...d,
      education: [...d.education, { id: `e${Date.now()}`, institution: "", degree: "", period: "", description: "" }]
    }));
  };

  const removeEducation = (id: string) => {
    setData((d) => ({ ...d, education: d.education.filter((e) => e.id !== id) }));
  };

  const setExperience = (id: string, field: keyof ResumeExperience, value: string) => {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    }));
  };

  const addExperience = () => {
    setData((d) => ({
      ...d,
      experience: [...d.experience, { id: `x${Date.now()}`, company: "", role: "", period: "", description: "" }]
    }));
  };

  const removeExperience = (id: string) => {
    setData((d) => ({ ...d, experience: d.experience.filter((e) => e.id !== id) }));
  };

  const setSkills = (value: string) => setData((d) => ({ ...d, skills: value }));

  const setProject = (id: string, field: keyof ResumeProject, value: string) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    }));
  };

  const addProject = () => {
    setData((d) => ({
      ...d,
      projects: [...d.projects, { id: `p${Date.now()}`, name: "", period: "", description: "" }]
    }));
  };

  const removeProject = (id: string) => {
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
  };

  const setReference = (id: string, field: keyof ResumeReference, value: string) => {
    setData((d) => ({
      ...d,
      references: d.references.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    }));
  };

  const addReference = () => {
    setData((d) => ({
      ...d,
      references: [...d.references, { id: `r${Date.now()}`, name: "", role: "", contact: "" }]
    }));
  };

  const removeReference = (id: string) => {
    setData((d) => ({ ...d, references: d.references.filter((r) => r.id !== id) }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr] print:block">
      <Card className="space-y-6 p-5 print:hidden">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resume form</h3>

        <section>
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Personal details</h4>
          <div className="space-y-3">
            <Input placeholder="Full name" value={data.personal.fullName} onChange={(e) => setPersonal("fullName", e.target.value)} />
            <Input type="email" placeholder="Email" value={data.personal.email} onChange={(e) => setPersonal("email", e.target.value)} />
            <Input type="tel" placeholder="Phone" value={data.personal.phone} onChange={(e) => setPersonal("phone", e.target.value)} />
            <Input placeholder="City, Country" value={data.personal.location} onChange={(e) => setPersonal("location", e.target.value)} />
            <Input
              placeholder="LinkedIn (optional)"
              value={data.personal.linkedIn ?? ""}
              onChange={(e) => setPersonal("linkedIn", e.target.value)}
            />
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Summary</h4>
          <TextArea placeholder="Short professional summary..." value={data.summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Experience</h4>
            <Button type="button" variant="ghost" className="text-xs" onClick={addExperience}>
              + Add
            </Button>
          </div>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex justify-end">
                  {data.experience.length > 1 && (
                    <button type="button" onClick={() => removeExperience(exp.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Job title / Role" value={exp.role} onChange={(e) => setExperience(exp.id, "role", e.target.value)} />
                  <Input placeholder="Company" value={exp.company} onChange={(e) => setExperience(exp.id, "company", e.target.value)} />
                </div>
                <Input
                  placeholder="Period (e.g. 2022 - Present)"
                  value={exp.period}
                  onChange={(e) => setExperience(exp.id, "period", e.target.value)}
                  className="mt-2"
                />
                <TextArea
                  placeholder="Description (responsibilities, achievements)"
                  value={exp.description}
                  onChange={(e) => setExperience(exp.id, "description", e.target.value)}
                  rows={2}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Education</h4>
            <Button type="button" variant="ghost" className="text-xs" onClick={addEducation}>
              + Add
            </Button>
          </div>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex justify-end">
                  {data.education.length > 1 && (
                    <button type="button" onClick={() => removeEducation(edu.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Degree" value={edu.degree} onChange={(e) => setEducation(edu.id, "degree", e.target.value)} />
                  <Input placeholder="Institution" value={edu.institution} onChange={(e) => setEducation(edu.id, "institution", e.target.value)} />
                </div>
                <Input
                  placeholder="Period (e.g. 2018 - 2022)"
                  value={edu.period}
                  onChange={(e) => setEducation(edu.id, "period", e.target.value)}
                  className="mt-2"
                />
                <TextArea
                  placeholder="Details (optional)"
                  value={edu.description}
                  onChange={(e) => setEducation(edu.id, "description", e.target.value)}
                  rows={2}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Skills</h4>
          <TextArea
            placeholder="e.g. JavaScript, React, Python, Communication..."
            value={data.skills}
            onChange={(e) => setSkills(e.target.value)}
            rows={3}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Projects</h4>
            <Button type="button" variant="ghost" className="text-xs" onClick={addProject}>
              + Add
            </Button>
          </div>
          <div className="space-y-4">
            {data.projects.map((project) => (
              <div key={project.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex justify-end">
                  {data.projects.length > 1 && (
                    <button type="button" onClick={() => removeProject(project.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Project name" value={project.name} onChange={(e) => setProject(project.id, "name", e.target.value)} />
                  <Input
                    placeholder="Period (e.g. 2023 - 2024)"
                    value={project.period}
                    onChange={(e) => setProject(project.id, "period", e.target.value)}
                  />
                </div>
                <TextArea
                  placeholder="Description (what you built and impact)"
                  value={project.description}
                  onChange={(e) => setProject(project.id, "description", e.target.value)}
                  rows={2}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">References</h4>
            <Button type="button" variant="ghost" className="text-xs" onClick={addReference}>
              + Add
            </Button>
          </div>
          <div className="space-y-4">
            {data.references.map((ref) => (
              <div key={ref.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex justify-end">
                  {data.references.length > 1 && (
                    <button type="button" onClick={() => removeReference(ref.id)} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Reference name" value={ref.name} onChange={(e) => setReference(ref.id, "name", e.target.value)} />
                  <Input
                    placeholder="Role / relationship"
                    value={ref.role}
                    onChange={(e) => setReference(ref.id, "role", e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Contact info (email / phone)"
                  value={ref.contact}
                  onChange={(e) => setReference(ref.id, "contact", e.target.value)}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </section>
      </Card>

      <Card className="flex flex-col p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white print:hidden">Live preview</h3>
        <ResumePreview data={data} />
      </Card>
    </div>
  );
}

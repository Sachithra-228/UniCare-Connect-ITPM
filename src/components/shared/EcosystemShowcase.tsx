"use client";

import { useState } from "react";
import { FeatureOrbit, orbitFeatures, type OrbitFeature } from "@/components/shared/FeatureOrbit";
import { SectionHeading } from "@/components/shared/SectionHeading";

type FeatureKey = OrbitFeature["key"];

export function EcosystemShowcase() {
  const [activeKey, setActiveKey] = useState<FeatureKey>(orbitFeatures[0].key);

  return (
    <section>
      <SectionHeading
        title="Core modules around one student experience"
        subtitle="Explore the four key features from the accordion on the right."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <FeatureOrbit
          activeKey={activeKey}
          onSelect={setActiveKey}
          className="mt-0"
        />

        <div className="h-full min-h-[500px] rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {orbitFeatures.map((feature, index) => {
            const isActive = feature.key === activeKey;
            const isLast = index === orbitFeatures.length - 1;

            return (
              <div
                key={feature.key}
                className={`px-4 py-1 ${isLast ? "" : "border-b border-slate-200 dark:border-slate-800"}`}
              >
                <button
                  type="button"
                  aria-expanded={isActive}
                  onClick={() => setActiveKey(feature.key)}
                  className="flex w-full items-center justify-between gap-3 py-4 text-left"
                >
                  <span
                    className={`text-base font-semibold ${
                      isActive ? "text-primary" : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {feature.title}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      isActive ? "rotate-180 text-primary" : ""
                    }`}
                    fill="none"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isActive ? (
                  <div className="space-y-3 pb-5">
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {feature.subtitle}
                    </p>
                    <ul className="space-y-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {feature.details.map((detail) => (
                        <li key={detail} className="pl-2">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

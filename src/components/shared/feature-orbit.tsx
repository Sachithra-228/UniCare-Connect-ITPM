"use client";

import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

export type OrbitFeature = {
  key: "financial" | "career" | "wellness" | "campus";
  title: string;
  subtitle: string;
  details: string[];
  icon: string;
  angle: number;
  radius: number;
  duration: number;
  clockwise: boolean;
};

export const orbitFeatures: OrbitFeature[] = [
  {
    key: "financial",
    title: "Financial Support",
    subtitle:
      "Access emergency grants, scholarship matching, and fee relief workflows through one guided flow.",
    details: [
      "Students can submit requests with documents and track each approval step in real time.",
      "Advisors can prioritize urgent cases and connect learners to university and external funding channels."
    ],
    icon: "\u20B9",
    angle: 24,
    radius: 84,
    duration: 14,
    clockwise: true
  },
  {
    key: "career",
    title: "Career Development",
    subtitle:
      "Find internships, campus jobs, and role-based learning opportunities matched to your current profile.",
    details: [
      "Skill-gap suggestions highlight what to improve before applying for competitive roles.",
      "Application progress and mentor feedback stay visible in one timeline for faster decisions."
    ],
    icon: "\u2699",
    angle: 122,
    radius: 128,
    duration: 19,
    clockwise: false
  },
  {
    key: "wellness",
    title: "Health & Wellness",
    subtitle:
      "Monitor wellbeing patterns, request support early, and access trusted counselors without delays.",
    details: [
      "Private check-ins help identify stress trends before they impact attendance or grades.",
      "Students can quickly route to peer circles, counselor slots, and self-care resources."
    ],
    icon: "\u2665",
    angle: 228,
    radius: 172,
    duration: 22,
    clockwise: true
  },
  {
    key: "campus",
    title: "Campus Integration",
    subtitle:
      "Stay active in campus life with mentor programs, events, and communities aligned to your goals.",
    details: [
      "Event reminders and participation history make engagement measurable for students and staff.",
      "Community channels connect new students with seniors, clubs, and support groups."
    ],
    icon: "\u2302",
    angle: 310,
    radius: 216,
    duration: 27,
    clockwise: false
  }
];

type FeatureOrbitProps = {
  activeKey?: OrbitFeature["key"];
  onSelect?: (key: OrbitFeature["key"]) => void;
  className?: string;
};

export function FeatureOrbit({ activeKey, onSelect, className }: FeatureOrbitProps) {
  return (
    <div
      className={twMerge(
        "relative mx-auto mt-8 flex h-[500px] w-full max-w-[520px] items-center justify-center",
        className
      )}
    >
      {orbitFeatures.map((feature) => (
        <div
          key={`${feature.key}-ring`}
          className="absolute rounded-full border border-primary/15"
          style={{ width: feature.radius * 2, height: feature.radius * 2 }}
        />
      ))}
      <div className="absolute grid h-24 w-24 place-items-center rounded-full bg-primary text-sm font-semibold text-white shadow-lg">
        UNICARE
      </div>
      <div className="orbit absolute inset-0">
        {orbitFeatures.map((feature) => {
          const isActive = activeKey === feature.key;

          return (
            <div
              key={feature.key}
              className={`orbit-item ${feature.clockwise ? "orbit-cw" : "orbit-ccw"}`}
              style={
                {
                  "--angle": `${feature.angle}deg`,
                  "--radius": `${feature.radius}px`,
                  "--duration": `${feature.duration}s`
                } as CSSProperties
              }
            >
              <button
                type="button"
                aria-label={feature.title}
                onClick={() => onSelect?.(feature.key)}
                className={`grid h-10 w-10 place-items-center rounded-full border bg-primary/5 text-lg text-primary shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:bg-primary/10 ${
                  isActive
                    ? "border-primary/80 ring-2 ring-primary/30"
                    : "border-primary/30"
                }`}
              >
                {feature.icon}
              </button>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .orbit:hover .orbit-item {
          animation-play-state: paused;
        }

        .orbit-item {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--radius))
            rotate(calc(-1 * var(--angle)));
          animation-duration: var(--duration);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          transform-origin: center;
        }

        .orbit-item:hover {
          animation-play-state: paused;
        }

        .orbit-cw {
          animation-name: orbit-cw;
        }

        .orbit-ccw {
          animation-name: orbit-ccw;
        }

        @keyframes orbit-cw {
          from {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--radius))
              rotate(calc(-1 * var(--angle)));
          }
          to {
            transform: translate(-50%, -50%) rotate(calc(360deg + var(--angle)))
              translateX(var(--radius))
              rotate(calc(-360deg - var(--angle)));
          }
        }

        @keyframes orbit-ccw {
          from {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--radius))
              rotate(calc(-1 * var(--angle)));
          }
          to {
            transform: translate(-50%, -50%) rotate(calc(-360deg + var(--angle)))
              translateX(var(--radius)) rotate(calc(360deg - var(--angle)));
          }
        }
      `}</style>
    </div>
  );
}

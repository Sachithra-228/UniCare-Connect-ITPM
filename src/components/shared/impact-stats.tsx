"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StatItem = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function AnimatedNumber({
  value,
  prefix,
  suffix,
  start
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  start: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTs: number | null = null;
    const duration = 1200;

    const step = (timestamp: number) => {
      if (startTs === null) startTs = timestamp;
      const progress = Math.min((timestamp - startTs) / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplayValue(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, start]);

  const formatted = useMemo(
    () => displayValue.toLocaleString("en-US"),
    [displayValue]
  );

  return (
    <span className="text-2xl font-semibold text-slate-900 dark:text-white">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function ImpactStats({
  stats,
  startOnView = false
}: {
  stats: StatItem[];
  startOnView?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(!startOnView);

  useEffect(() => {
    if (!startOnView || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnView]);

  return (
    <div ref={containerRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              {stat.icon}
            </div>
            <AnimatedNumber
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              start={started}
            />
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

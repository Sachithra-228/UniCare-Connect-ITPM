"use client";

import { CalendarCheck2, GraduationCap, HandCoins, HeartPulse } from "lucide-react";
import { Libre_Baskerville } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const H_MIN = 32;
const H_MAX = 72;
const V_MIN = 28;
const V_MAX = 72;
const STEP = 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"]
});

export function SupportWorkspacePanels() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const horizontalRef = useRef<HTMLDivElement | null>(null);
  const verticalRef = useRef<HTMLDivElement | null>(null);
  const horizontalDragRef = useRef<{ pointerId: number | null; startX: number; startSize: number }>({
    pointerId: null,
    startX: 0,
    startSize: 56
  });
  const verticalDragRef = useRef<{ pointerId: number | null; startY: number; startSize: number }>({
    pointerId: null,
    startY: 0,
    startSize: 44
  });

  const [leftSize, setLeftSize] = useState(56);
  const [topSize, setTopSize] = useState(44);
  const [headingVisible, setHeadingVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeadingVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const startHorizontalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    horizontalDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startSize: leftSize
    };
  };

  const moveHorizontalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (horizontalDragRef.current.pointerId !== event.pointerId || !horizontalRef.current) return;
    const delta = event.clientX - horizontalDragRef.current.startX;
    const next = horizontalDragRef.current.startSize + (delta / horizontalRef.current.clientWidth) * 100;
    setLeftSize(clamp(next, H_MIN, H_MAX));
  };

  const endHorizontalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (horizontalDragRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    horizontalDragRef.current.pointerId = null;
  };

  const startVerticalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    verticalDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startSize: topSize
    };
  };

  const moveVerticalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (verticalDragRef.current.pointerId !== event.pointerId || !verticalRef.current) return;
    const delta = event.clientY - verticalDragRef.current.startY;
    const next = verticalDragRef.current.startSize + (delta / verticalRef.current.clientHeight) * 100;
    setTopSize(clamp(next, V_MIN, V_MAX));
  };

  const endVerticalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (verticalDragRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    verticalDragRef.current.pointerId = null;
  };

  const onHorizontalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setLeftSize((value) => clamp(value - STEP, H_MIN, H_MAX));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setLeftSize((value) => clamp(value + STEP, H_MIN, H_MAX));
    } else if (event.key === "Home") {
      event.preventDefault();
      setLeftSize(H_MIN);
    } else if (event.key === "End") {
      event.preventDefault();
      setLeftSize(H_MAX);
    }
  };

  const onVerticalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setTopSize((value) => clamp(value - STEP, V_MIN, V_MAX));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setTopSize((value) => clamp(value + STEP, V_MIN, V_MAX));
    } else if (event.key === "Home") {
      event.preventDefault();
      setTopSize(V_MIN);
    } else if (event.key === "End") {
      event.preventDefault();
      setTopSize(V_MAX);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] py-16"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:38px_38px] opacity-35" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <div
          className={`mx-auto w-full text-center transition-all duration-700 ${
            headingVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h3
            className={`${libreBaskerville.className} text-4xl font-bold tracking-tight text-white md:text-5xl lg:whitespace-nowrap`}
          >
            Resize panels to prioritize support operations
          </h3>
          <p
            className={`${libreBaskerville.className} mt-3 text-base text-slate-300 md:text-lg lg:whitespace-nowrap`}
          >
            Drag separators, or focus a handle and use arrow keys, Home, and End.
          </p>
        </div>

        <div
          ref={horizontalRef}
          className="mt-8 hidden h-[460px] rounded-2xl border border-white/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.24),rgba(255,255,255,0.1))] p-3 shadow-[0_24px_60px_-30px_rgba(8,47,110,0.65)] backdrop-blur-xl md:flex"
        >
          <section
            id="student-overview-panel"
            aria-label="Student overview"
            className="h-full overflow-hidden rounded-xl border border-blue-200 bg-white p-5"
            style={{ width: `${leftSize}%` }}
          >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">Student Snapshot</p>
          <h4 className="mt-2 text-xl font-semibold">Semester health at a glance</h4>
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border border-white/20 bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] p-4">
              <div className="flex items-center gap-3">
                <HandCoins className="h-4 w-4 text-blue-200" />
                <p className="text-sm font-medium text-slate-100">Financial requests pending review</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">12</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-blue-200" />
                <p className="text-sm font-medium text-slate-100">Career matches generated this week</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">38</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] p-4">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-4 w-4 text-blue-200" />
                <p className="text-sm font-medium text-slate-100">Wellness check-ins completed</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">27</p>
            </div>
          </div>
        </section>

        <div
          role="separator"
          aria-label="Resize left and right panels"
          aria-controls="student-overview-panel support-operations-panel"
          aria-orientation="vertical"
          aria-valuemin={H_MIN}
          aria-valuemax={H_MAX}
          aria-valuenow={Math.round(leftSize)}
          tabIndex={0}
          className="mx-2 flex w-3 cursor-col-resize items-center justify-center rounded-full bg-transparent outline-none ring-primary/40 transition-colors hover:bg-blue-50 focus-visible:ring-2"
          onPointerDown={startHorizontalDrag}
          onPointerMove={moveHorizontalDrag}
          onPointerUp={endHorizontalDrag}
          onPointerCancel={endHorizontalDrag}
          onKeyDown={onHorizontalKeyDown}
        >
          <div className="h-16 w-1.5 rounded-full bg-blue-300" />
        </div>

        <section
          id="support-operations-panel"
          ref={verticalRef}
          aria-label="Support operations"
          className="flex h-full overflow-hidden rounded-xl border border-blue-200 bg-white"
          style={{ width: `${100 - leftSize}%` }}
        >
          <div className="flex w-full flex-col p-3">
            <div
              id="priority-queue-panel"
              className="overflow-hidden rounded-xl border border-blue-200 bg-white p-5"
              style={{ height: `${topSize}%` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">Priority Queue</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-white/20 bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] p-3 text-sm text-slate-100">
                  Emergency tuition case requires same-day approval.
                </div>
                <div className="rounded-lg border border-white/20 bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] p-3 text-sm text-slate-100">
                  6 students waiting for internship placement confirmation.
                </div>
                <div className="rounded-lg border border-white/20 bg-gradient-to-br from-[#0b1732] via-[#0b1d3f] to-[#0a1632] p-3 text-sm text-slate-100">
                  Mentor reassignment needed for 2 high-risk students.
                </div>
              </div>
            </div>

            <div
              role="separator"
              aria-label="Resize top and bottom panels"
              aria-controls="priority-queue-panel action-planner-panel"
              aria-orientation="horizontal"
              aria-valuemin={V_MIN}
              aria-valuemax={V_MAX}
              aria-valuenow={Math.round(topSize)}
              tabIndex={0}
              className="my-2 flex h-3 cursor-row-resize items-center justify-center rounded-full bg-transparent outline-none ring-primary/40 transition-colors hover:bg-blue-50 focus-visible:ring-2"
              onPointerDown={startVerticalDrag}
              onPointerMove={moveVerticalDrag}
              onPointerUp={endVerticalDrag}
              onPointerCancel={endVerticalDrag}
              onKeyDown={onVerticalKeyDown}
            >
              <div className="h-1.5 w-16 rounded-full bg-blue-300" />
            </div>

            <div
              id="action-planner-panel"
              className="overflow-hidden rounded-xl border border-blue-200 bg-white p-5"
              style={{ height: `${100 - topSize}%` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">Action Planner</p>
              <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-primary" />
                  Approve aid batch before 3:00 PM.
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-primary" />
                  Finalize mentor pairing for week 4.
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-primary" />
                  Export weekly wellbeing summary for faculty.
                </div>
              </div>
            </div>
          </div>
        </section>
        </div>

        <div className="mt-6 grid gap-3 md:hidden">
          <div className="rounded-xl border border-blue-200 bg-white p-4">
            <p className="text-sm font-semibold">Student Snapshot</p>
            <p className="mt-1 text-sm text-slate-600">Desktop view has keyboard-resizable panels.</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white p-4">
            <p className="text-sm font-semibold">Priority Queue</p>
            <p className="mt-1 text-sm text-slate-600">Emergency tuition case requires same-day approval.</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white p-4">
            <p className="text-sm font-semibold">Action Planner</p>
            <p className="mt-1 text-sm text-slate-600">Approve aid batch and finalize mentor pairing.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

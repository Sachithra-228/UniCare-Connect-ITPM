"use client";

import { useEffect, useRef, useState } from "react";

type ScrollSwapProps = {
  first: React.ReactNode;
  second: React.ReactNode;
  className?: string;
};

export function ScrollSwap({ first, second, className }: ScrollSwapProps) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showSecond, setShowSecond] = useState(false);

  useEffect(() => {
    if (!topRef.current || !bottomRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === topRef.current && entry.isIntersecting) {
            setShowSecond(false);
          }
          if (entry.target === bottomRef.current && entry.isIntersecting) {
            setShowSecond(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(topRef.current);
    observer.observe(bottomRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className={`relative min-h-[90vh] ${className ?? ""}`}>
      <div ref={topRef} className="absolute top-0 h-12 w-full" />
      <div ref={bottomRef} className="absolute bottom-0 h-12 w-full" />
      <div className="sticky top-24">
        <div className="relative">
          <div
            className={`transition-all duration-700 ${
              showSecond
                ? "opacity-0 pointer-events-none -translate-y-6"
                : "opacity-100 translate-y-0"
            }`}
          >
            {first}
          </div>
          <div
            className={`absolute inset-0 transition-all duration-700 ${
              showSecond
                ? "opacity-100 translate-y-0"
                : "opacity-0 pointer-events-none translate-y-6"
            }`}
          >
            {second}
          </div>
        </div>
      </div>
    </section>
  );
}

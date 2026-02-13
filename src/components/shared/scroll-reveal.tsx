"use client";

import { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  direction?: "left" | "right" | "up" | "down";
  children: React.ReactNode;
  className?: string;
};

const directionMap: Record<NonNullable<ScrollRevealProps["direction"]>, string> = {
  left: "-translate-x-10",
  right: "translate-x-10",
  up: "translate-y-10",
  down: "-translate-y-10"
};

export function ScrollReveal({ direction = "up", children, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${directionMap[direction]}`
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

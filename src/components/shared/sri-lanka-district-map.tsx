"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import mapData from "@svg-maps/sri-lanka";

interface SriLankaDistrictMapProps {
  selectedDistricts: string[];
  onSelectDistrict?: (district: string) => void;
  serviceDistricts?: string[];
  minimal?: boolean;
  selectable?: boolean;
  className?: string;
}

type DistrictLocation = {
  id: string;
  name: string;
  path: string;
};

const DISTRICT_IMAGES: Record<string, string> = {
  Colombo: "/colombo.jpg",
  Gampaha: "/gampaha.jpg",
  Kalutara: "/top-hero.png",
  Kandy: "/peradeniya.jpg",
  Matale: "/peradeniya.jpg",
  "Nuwara Eliya": "/top-hero.png",
  Galle: "/top-hero.png",
  Matara: "/ruhuna.jpg",
  Hambantota: "/southeastern.jpg",
  Jaffna: "/jaffna.jpg",
  Kilinochchi: "/vavuniya.jpg",
  Mannar: "/open.jpg",
  Vavuniya: "/vavuniya.jpg",
  Mullaitivu: "/vavuniya.jpg",
  Batticaloa: "/eastern.jpg",
  Ampara: "/eastern.jpg",
  Trincomalee: "/open.jpg",
  Anuradhapura: "/rajarata.jpg",
  Polonnaruwa: "/rajarata.jpg",
  Badulla: "/uvawellassa.jpg",
  Monaragala: "/uvawellassa.jpg",
  Ratnapura: "/sabaragamuwa.jpg",
  Kegalle: "/sabaragamuwa.jpg",
  Puttalam: "/wayamba.jpg",
  Kurunegala: "/wayamba.jpg"
};

const DISTRICT_ALIASES: Record<string, string> = {
  Moneragala: "Monaragala"
};

const normalizeDistrictName = (name: string) => {
  const cleaned = name.replace(/ District$/i, "").replace(/-/g, " ").trim();
  return DISTRICT_ALIASES[cleaned] ?? cleaned;
};

export function SriLankaDistrictMap({
  selectedDistricts,
  onSelectDistrict,
  serviceDistricts = [],
  minimal = false,
  selectable = true,
  className
}: SriLankaDistrictMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 10, y: 10 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const serviceSet = useMemo(
    () => new Set(serviceDistricts.map(normalizeDistrictName)),
    [serviceDistricts]
  );
  const selectedSet = useMemo(
    () => new Set(selectedDistricts.map(normalizeDistrictName)),
    [selectedDistricts]
  );
  const locations = mapData.locations as DistrictLocation[];
  const isHeroPreviewMode = minimal && !selectable;

  const setHoverFromEvent = (district: string, event: ReactMouseEvent<SVGPathElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tooltipW = 216;
    const tooltipH = 164;
    const x = Math.min(Math.max(event.clientX - rect.left + 12, 8), Math.max(8, rect.width - tooltipW));
    const y = Math.min(Math.max(event.clientY - rect.top + 12, 8), Math.max(8, rect.height - tooltipH));

    setHoverPos({ x, y });
    setHoveredDistrict(district);
  };

  return (
    <div
      className={
        minimal
          ? className ?? ""
          : `rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm md:p-6 ${className ?? ""}`
      }
    >
      {!minimal ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">District Explorer</p>
            <p className="text-sm text-slate-600">
              {selectable ? "Hover to preview, click to filter institutions." : "Hover districts to preview."}
            </p>
          </div>
          {selectable ? (
            <div className="text-xs text-slate-500">
              Selected: <span className="font-semibold text-slate-700">{selectedDistricts.length}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        ref={wrapperRef}
        className={`relative mx-auto ${minimal ? "max-w-[320px] md:max-w-[360px]" : "max-w-[460px]"}`}
      >
        <svg viewBox={mapData.viewBox} className="h-auto w-full">
          {locations.map((location) => {
            const district = normalizeDistrictName(location.name);
            const isSelected = selectedSet.has(district);
            const hasService = serviceSet.size === 0 || serviceSet.has(district);
            const isHovered = hoveredDistrict === district;

            const fill = isHeroPreviewMode
              ? isHovered
                ? "#93c5fd"
                : "#f8fafc"
              : isSelected
                ? "#dbeafe"
                : hasService
                  ? "#f8fafc"
                  : "#f8fafc";
            const stroke = isHeroPreviewMode
              ? isHovered
                ? "rgba(2,6,23,0.82)"
                : "rgba(2,6,23,0.48)"
              : isSelected
                ? "#3b82f6"
                : isHovered
                  ? "#93c5fd"
                  : "#d1d5db";
            const opacity = isHeroPreviewMode ? (isHovered ? 1 : 0.96) : isSelected ? 0.98 : hasService ? 0.92 : 0.6;

            return (
              <path
                key={location.id}
                d={location.path}
                fill={fill}
                stroke={stroke}
                strokeWidth={isHeroPreviewMode ? (isHovered ? 1.4 : 1.05) : isSelected || isHovered ? 1.35 : 1}
                opacity={opacity}
                className={`${selectable ? "cursor-pointer" : "cursor-default"} transition-all duration-200`}
                onClick={selectable && onSelectDistrict ? () => onSelectDistrict(district) : undefined}
                onMouseEnter={(event) => setHoverFromEvent(district, event)}
                onMouseMove={(event) => setHoverFromEvent(district, event)}
                onMouseLeave={() => setHoveredDistrict(null)}
              />
            );
          })}
        </svg>

        {hoveredDistrict ? (
          <div
            className="pointer-events-none absolute w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            style={{ left: hoverPos.x, top: hoverPos.y }}
          >
            <div className="relative h-28 w-full">
              <Image
                src={DISTRICT_IMAGES[hoveredDistrict] ?? "/top-hero.png"}
                alt={hoveredDistrict}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-slate-900">{hoveredDistrict}</p>
              <p className="mt-1 text-xs text-slate-500">
                {selectable
                  ? selectedSet.has(hoveredDistrict)
                    ? "Selected filter"
                    : "Click marker to filter"
                  : "Hover preview"}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

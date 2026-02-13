"use client";

import { useEffect, useRef } from "react";

type LonLat = [number, number];

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
};

const CONTINENT_POLYGONS: LonLat[][] = [
  [
    [-17, 37],
    [8, 37],
    [22, 34],
    [34, 31],
    [43, 12],
    [51, 11],
    [43, 1],
    [41, -6],
    [39, -12],
    [33, -24],
    [17, -35],
    [4, -35],
    [-8, -30],
    [-16, -12],
    [-12, 6],
    [-17, 20],
    [-17, 37]
  ],
  [
    [-10, 35],
    [0, 43],
    [14, 48],
    [24, 52],
    [40, 56],
    [62, 61],
    [86, 61],
    [108, 58],
    [132, 53],
    [152, 53],
    [170, 47],
    [156, 37],
    [132, 32],
    [112, 24],
    [90, 21],
    [72, 22],
    [58, 28],
    [44, 36],
    [32, 43],
    [18, 45],
    [4, 42],
    [-10, 35]
  ],
  [
    [68, 24],
    [78, 30],
    [90, 27],
    [98, 20],
    [101, 11],
    [95, 7],
    [88, 9],
    [80, 15],
    [74, 21],
    [68, 24]
  ],
  [
    [112, -10],
    [155, -10],
    [153, -44],
    [115, -44],
    [112, -10]
  ],
  [
    [43, -12],
    [51, -12],
    [50, -25],
    [44, -25],
    [43, -12]
  ],
  [
    [-82, 12],
    [-68, 9],
    [-54, -5],
    [-50, -18],
    [-55, -33],
    [-67, -51],
    [-74, -53],
    [-78, -35],
    [-80, -10],
    [-82, 12]
  ],
  [
    [-168, 15],
    [-140, 25],
    [-120, 37],
    [-110, 47],
    [-98, 58],
    [-82, 56],
    [-62, 46],
    [-70, 30],
    [-82, 18],
    [-110, 14],
    [-136, 12],
    [-168, 15]
  ]
];

function pointInPolygon(point: LonLat, polygon: LonLat[]) {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

function generateContinentDots(step = 2.8) {
  const dots: LonLat[] = [];

  CONTINENT_POLYGONS.forEach((polygon) => {
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    polygon.forEach(([lon, lat]) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    for (let lat = minLat; lat <= maxLat; lat += step) {
      for (let lon = minLon; lon <= maxLon; lon += step) {
        if (pointInPolygon([lon, lat], polygon)) {
          dots.push([lon, lat]);
        }
      }
    }
  });

  return dots;
}

const continentDots = generateContinentDots();
const sphereDots: LonLat[] = [];

for (let lat = -84; lat <= 84; lat += 4) {
  for (let lon = -180; lon < 180; lon += 4) {
    sphereDots.push([lon, lat]);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function projectPoint(lonDeg: number, latDeg: number, rotY: number, rotX: number, radius: number, cx: number, cy: number): ProjectedPoint {
  const lon = (lonDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;

  const x = Math.cos(lat) * Math.cos(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.sin(lon);

  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return {
    x: cx + x1 * radius,
    y: cy - y2 * radius,
    depth: z2
  };
}

export function WireframeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragState = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    rotationY: 0.9,
    rotationX: -0.17,
    spinVelocity: 0.0032
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let animationId = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const { isDragging } = dragState.current;
      if (!isDragging) {
        dragState.current.rotationY += dragState.current.spinVelocity;
      }

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.42;

      const rotY = dragState.current.rotationY;
      const rotX = dragState.current.rotationX;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const latStep = 12;
      const lonStep = 12;
      const precision = 4;

      for (let lat = -84; lat <= 84; lat += latStep) {
        for (let lon = -180; lon < 180; lon += precision) {
          const a = projectPoint(lon, lat, rotY, rotX, radius, cx, cy);
          const b = projectPoint(lon + precision, lat, rotY, rotX, radius, cx, cy);
          const depth = (a.depth + b.depth) * 0.5;
          const alpha = 0.08 + ((depth + 1) / 2) * 0.34;

          ctx.strokeStyle = `rgba(226, 232, 240, ${clamp(alpha, 0.05, 0.44)})`;
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let lon = -180; lon < 180; lon += lonStep) {
        for (let lat = -90; lat < 90; lat += precision) {
          const a = projectPoint(lon, lat, rotY, rotX, radius, cx, cy);
          const b = projectPoint(lon, lat + precision, rotY, rotX, radius, cx, cy);
          const depth = (a.depth + b.depth) * 0.5;
          const alpha = 0.07 + ((depth + 1) / 2) * 0.3;

          ctx.strokeStyle = `rgba(226, 232, 240, ${clamp(alpha, 0.04, 0.4)})`;
          ctx.lineWidth = 0.62;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      sphereDots.forEach(([lon, lat], idx) => {
        if ((idx + frame) % 2 !== 0) return;

        const point = projectPoint(lon, lat, rotY, rotX, radius, cx, cy);
        if (point.depth <= -0.2) return;

        const alpha = 0.05 + ((point.depth + 1) / 2) * 0.17;
        ctx.fillStyle = `rgba(248, 250, 252, ${clamp(alpha, 0.04, 0.18)})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 0.78, 0, Math.PI * 2);
        ctx.fill();
      });

      continentDots.forEach(([lon, lat]) => {
        const point = projectPoint(lon, lat, rotY, rotX, radius, cx, cy);
        if (point.depth <= 0) return;

        const alpha = 0.34 + point.depth * 0.54;
        const size = 1.2 + point.depth * 0.9;
        ctx.fillStyle = `rgba(241, 245, 249, ${clamp(alpha, 0.3, 0.96)})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      ctx.strokeStyle = "rgba(241, 245, 249, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      frame += 1;
      animationId = window.requestAnimationFrame(render);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragState.current.isDragging = true;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragState.current.isDragging) return;

      const dx = event.clientX - dragState.current.lastX;
      const dy = event.clientY - dragState.current.lastY;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;

      dragState.current.rotationY += dx * 0.009;
      dragState.current.rotationX = clamp(dragState.current.rotationX + dy * 0.006, -0.65, 0.65);

      if (Math.abs(dx) > 0.2) {
        dragState.current.spinVelocity = clamp(dx * 0.00014, -0.015, 0.015);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragState.current.isDragging) return;
      dragState.current.isDragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      dragState.current.spinVelocity *= 0.92;
      if (Math.abs(dragState.current.spinVelocity) < 0.0018) {
        dragState.current.spinVelocity = 0.0032;
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    render();

    return () => {
      window.cancelAnimationFrame(animationId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[390px] select-none">
      <div className="pointer-events-none absolute inset-0 rounded-full bg-cyan-400/10 blur-3xl" />
      <canvas
        ref={canvasRef}
        className="relative aspect-square w-full touch-none rounded-full border border-white/25 bg-black/20 shadow-inner shadow-cyan-300/10"
        aria-label="Interactive rotating globe"
      />
    </div>
  );
}

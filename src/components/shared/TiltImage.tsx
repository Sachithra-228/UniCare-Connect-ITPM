"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

type TiltImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function TiltImage({ src, alt, width, height, className }: TiltImageProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 10;
    const rotateX = -((y - midY) / midY) * 10;
    setTransform(`rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`);
  };

  const handleLeave = () => setTransform("rotateX(0deg) rotateY(0deg)");

  const style = useMemo(
    () => ({
      transform,
      transition: "transform 150ms ease"
    }),
    [transform]
  );

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`perspective-[900px] ${className ?? ""}`}
    >
      <div style={style} className="will-change-transform">
        <Image src={src} alt={alt} width={width} height={height} priority />
      </div>
    </div>
  );
}

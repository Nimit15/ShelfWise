"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  glass?: boolean;
  stone?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 6,
  perspective = 1200,
  scale = 1.02,
  glass = true,
  stone = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(springY, [-1, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-1, 1], [-maxTilt, maxTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    x.set(Math.max(-1, Math.min(1, deltaX)));
    y.set(Math.max(-1, Math.min(1, deltaY)));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const baseClass = `
    relative overflow-hidden transition-all duration-200
    ${glass ? "glass-card" : ""}
    ${stone ? "stone-card" : ""}
    ${!glass && !stone ? "bg-white border border-[var(--ca-border)] rounded-2xl" : ""}
  `;

  return (
    <div
      ref={ref}
      className={`${baseClass} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseLeave();
        onMouseLeave?.();
      }}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <motion.div
        style={{
          transformPerspective: perspective,
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
          scale: isHovered ? scale : 1,
          willChange: "transform",
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>

      {/* Specular highlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse at ${useTransform(springX, [-1, 1], ["20%", "80%"])} ${useTransform(springY, [-1, 1], ["20%", "80%"])},
              rgba(255,255,255,0.15) 0%,
              transparent 60%
            )
          `,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 300ms ease",
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}
"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export interface TiltCardProps {
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
  scale = 1.015,
  glass = true,
  stone = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);

  const springConfig = { stiffness: 280, damping: 28, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-maxTilt, maxTilt]), springConfig);

  const spotlightBackground = useMotionTemplate`radial-gradient(360px circle at ${spotX}px ${spotY}px, rgba(229, 193, 133, 0.14), transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
    spotX.set(e.clientX - rect.left);
    spotY.set(e.clientY - rect.top);
  };

  const handleEnter = () => {
    setHovered(true);
    onMouseEnter?.();
  };

  const handleLeave = () => {
    setHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
    onMouseLeave?.();
  };

  const baseSurface = stone
    ? "bg-[#221D18]/90 border border-white/12"
    : glass
      ? "bg-white/[0.045] backdrop-blur-2xl border border-white/12"
      : "";

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        perspective,
        rotateX: hovered ? rotateX : 0,
        rotateY: hovered ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-2xl transition-colors duration-300 ${baseSurface} ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {hovered && (
        <motion.div
          className="pointer-events-none absolute -inset-px z-0 transition-opacity duration-300"
          style={{ background: spotlightBackground }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

export default TiltCard;
"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Info, Star } from "lucide-react";
import { YouCamConcern } from "@/types/youcam";

export interface DermalLayer {
  id: string;
  name: string;
  description: string;
  depthIndex: number;
  concerns: string[];
  color: string;
  opacity: number;
  icon: React.ReactNode;
}

export interface DermalLayer3DProps {
  concerns: YouCamConcern[];
  concernScores: Record<string, number>;
  className?: string;
}

const LAYERS: DermalLayer[] = [
  {
    id: "stratum-corneum",
    name: "Stratum Corneum",
    description:
      "The outermost layer — 15–20 dead corneocytes. Your barrier's first line of defense. Compromises here show as redness, moisture loss, and sensitivity.",
    depthIndex: 0,
    concerns: ["moisture", "redness", "texture", "oiliness"],
    color: "#e74c3c",
    opacity: 0.35,
    icon: <Star className="h-4 w-4" />,
  },
  {
    id: "viable-epidermis",
    name: "Viable Epidermis",
    description:
      "Living keratinocytes undergoing differentiation. Melanin, collagen I production, and cellular turnover happen here. Wrinkles, pigmentation, and texture originate at this level.",
    depthIndex: 1,
    concerns: ["wrinkle", "age_spot", "dark_circle", "firmness", "texture", "acne"],
    color: "#f39c12",
    opacity: 0.3,
    icon: <Star className="h-4 w-4" />,
  },
  {
    id: "papillary-dermis",
    name: "Papillary Dermis",
    description:
      "Loose connective tissue with fine collagen (Type III) and elastin fibers. Supports superficial vasculature. Dark circles and early periorbital changes originate here.",
    depthIndex: 2,
    concerns: ["dark_circle", "eye_bag", "tear_trough", "wrinkle"],
    color: "#3498db",
    opacity: 0.25,
    icon: <Star className="h-4 w-4" />,
  },
  {
    id: "reticular-dermis",
    name: "Reticular Dermis",
    description:
      "Dense connective tissue with thick collagen (Type I) and elastin. Structural integrity of the skin. Aging, sagging, and deep wrinkles show up here.",
    depthIndex: 3,
    concerns: ["wrinkle", "firmness", "droopy_upper_eyelid", "droopy_lower_eyelid"],
    color: "#9b59b6",
    opacity: 0.2,
    icon: <Star className="h-4 w-4" />,
  },
  {
    id: "hypodermis",
    name: "Hypodermis (Subcutis)",
    description:
      "Fat and loose connective tissue. Provides cushioning and structural support. Volume loss and contour changes appear here.",
    depthIndex: 4,
    concerns: ["droopy_upper_eyelid", "droopy_lower_eyelid", "tear_trough", "eye_bag"],
    color: "#2ecc71",
    opacity: 0.15,
    icon: <Star className="h-4 w-4" />,
  },
];

export function DermalLayer3D({
  concerns,
  concernScores,
  className = "",
}: DermalLayer3DProps) {
  const [activeLayer, setActiveLayer] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), {
    stiffness: 260,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), {
    stiffness: 260,
    damping: 25,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handlePrev = () => {
    setActiveLayer((prev) => (prev - 1 + LAYERS.length) % LAYERS.length);
  };

  const handleNext = () => {
    setActiveLayer((prev) => (prev + 1) % LAYERS.length);
  };

  const layer = LAYERS[activeLayer];

  const layerConcerns = layer.concerns
    .map((concernId) => {
      const score = concernScores[concernId] ?? 0;
      if (score === 0) return null;
      const concern = concerns.find((c) => c.type.includes(concernId));
      return { id: concernId, score, uiScore: concern?.uiScore ?? score };
    })
    .filter(Boolean) as Array<{ id: string; score: number; uiScore: number }>;

  return (
    <div
      className={`relative rounded-2xl border border-white/12 bg-white/[0.035] p-6 ${className}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-[11px] uppercase tracking-[0.18em] text-[#E5C185]">
              3D Dermal Layer Map
            </span>
            <Info className="h-3.5 w-3.5 text-[#8A8177]" />
          </div>
          <h3 className="mt-1 font-serif-editorial text-2xl font-normal text-[#F7F4EF]">
            {layer.name}
          </h3>
          <p className="mt-1 max-w-lg text-xs text-[#C4BDB3]/80">
            {layer.description}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-white/12 bg-black/35 p-1">
          <button
            type="button"
            onClick={handlePrev}
            className="rounded-full p-1.5 text-[#C4BDB3] hover:bg-white/10 hover:text-[#F7F4EF]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-mono-tech text-[11px] text-[#8A8177]">
            {activeLayer + 1}/{LAYERS.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full p-1.5 text-[#C4BDB3] hover:bg-white/10 hover:text-[#F7F4EF]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative h-80 w-full">
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative h-full w-full"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-52 w-40">
              {LAYERS.map((l, index) => {
                const depthOffset = (index - activeLayer) * 4;
                const isActive = index === activeLayer;
                const zIndex = isActive ? 30 : 20 - Math.abs(activeLayer - index);

                return (
                  <motion.div
                    key={l.id}
                    className="absolute inset-0 rounded-xl border"
                    style={{
                      backgroundColor: `${l.color}10`,
                      borderColor: isActive ? l.color : `${l.color}30`,
                      transform: `translateZ(${depthOffset}px) scale(${
                        isActive ? 1 : 1 - Math.abs(index - activeLayer) * 0.04
                      })`,
                      opacity: isActive ? 1 : 0.4,
                      zIndex,
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `radial-gradient(ellipse at 50% 50%, ${l.color}20 0%, transparent 70%)`,
                        opacity: isActive ? l.opacity + 0.1 : 0,
                      }}
                    />
                    <div
                      className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-1"
                    >
                      <span
                        className="flex h-2 w-2 items-center justify-center rounded-full"
                        style={{ backgroundColor: l.color }}
                      />
                      <span
                        className={`font-mono-tech text-xs font-medium`}
                        style={{ color: l.color, opacity: isActive ? 1 : 0.4 }}
                      >
                        {l.name}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border border-white/12 bg-black/30 p-3">
          <span className="font-mono-tech text-xs text-[#C4BDB3]">
            Concern Depth Mapping
          </span>
          <div className="flex items-center gap-1.5">
            {layer.concerns.slice(0, 3).map((concernId) => {
              const scores = concernScores[concernId] ?? 0;
              const concern = concerns.find((c) =>
                c.type.includes(concernId)
              );
              const uiScore = concern?.uiScore ?? scores;
              return (
                <div
                  key={concernId}
                  className="flex items-center gap-0.5 rounded-full bg-white/5 px-1.5 py-0.5"
                >
                  <span
                    className={`font-mono-tech text-[10px] font-medium`}
                    style={{
                      color:
                        uiScore >= 85
                          ? "#34D399"
                          : uiScore >= 60
                            ? "#E5C185"
                            : "#F87171",
                    }}
                  >
                    {concernId}: {uiScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/12 bg-black/30 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono-tech text-xs text-[#C4BDB3]">
              Active Concerns in Layer
            </span>
            <span className="font-mono-tech text-xs text-[#8A8177]">
              ({layerConcerns.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {layerConcerns.map(({ id, uiScore }) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2 py-0.5 font-mono-tech text-[10px]"
                style={{
                  backgroundColor: `${layer.color}20`,
                  color: layer.color,
                }}
              >
                {id}
                <span className="font-medium">
                  ({uiScore})
                </span>
              </span>
            ))}
            {layerConcerns.length === 0 && (
              <span className="text-xs text-[#8A8177]">No active concerns at this layer</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DermalLayer3D;
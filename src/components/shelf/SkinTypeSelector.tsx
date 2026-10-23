"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Droplet, Flame, Sparkles, Shield, AlertTriangle, Info } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";

export type SkinType = "oily" | "dry" | "combination" | "normal";
export type Sensitivity = boolean;

interface SkinTypeSelectorProps {
  value: { type: SkinType; sensitive: Sensitivity };
  onChange: (value: { type: SkinType; sensitive: Sensitivity }) => void;
  youcamDetected?: SkinType | null;
  className?: string;
}

const skinTypeData: Record<SkinType, {
  label: string;
  description: string;
  icon: React.ReactNode;
  traits: string[];
  needs: string[];
  avoids: string[];
  accentColor: string;
  accentGlow: string;
}> = {
  oily: {
    label: "Oily",
    description: "High Sebum / Enlarged Pores",
    icon: <Flame className="h-6 w-6" />,
    traits: ["Excess shine", "Visible pores", "Prone to congestion"],
    needs: ["Lightweight gel/fluid vehicles", "Oil-control actives (Niacinamide, BHA, Zinc PCA)", "Non-comedogenic SPF"],
    avoids: ["Heavy occlusive creams", "Rich balms", "Mineral oil-based products"],
    accentColor: "var(--ca-emerald)",
    accentGlow: "var(--ca-emerald-glow)",
  },
  dry: {
    label: "Dry",
    description: "Lipid-Depleted / Tightness & Flaking",
    icon: <Droplet className="h-6 w-6" />,
    traits: ["Tight feeling", "Flaking/rough texture", "Fine lines more visible"],
    needs: ["Rich ceramide creams", "Squalane, Panthenol, HA", "Non-stripping cream/milk cleansers"],
    avoids: ["Foaming cleansers", "High % glycolic acid", "Alcohol-based toners"],
    accentColor: "var(--ca-amber)",
    accentGlow: "var(--ca-amber-glow)",
  },
  combination: {
    label: "Combination",
    description: "Oily T-Zone / Normal-Dry Cheeks",
    icon: <Sparkles className="h-6 w-6" />,
    traits: ["Shiny T-zone", "Normal/dry cheeks", "Different needs per zone"],
    needs: ["Balanced gel-cream textures", "Gentle multi-zone hydration", "Targeted BHA/PHA"],
    avoids: ["Heavy creams on T-zone", "Stripping cleansers on cheeks", "One-size-fits-all products"],
    accentColor: "var(--ca-obsidian)",
    accentGlow: "rgba(20,22,21,0.1)",
  },
  normal: {
    label: "Normal",
    description: "Eudermic / Well-Balanced Barrier",
    icon: <Shield className="h-6 w-6" />,
    traits: ["Balanced hydration", "Minimal concerns", "Good tolerance"],
    needs: ["Barrier maintenance", "Antioxidant protection (Vit C)", "Daily broad-spectrum SPF"],
    avoids: ["Unnecessary aggressive actives", "Over-layering", "Barrier disruption"],
    accentColor: "var(--ca-emerald)",
    accentGlow: "var(--ca-emerald-glow)",
  },
};

export function SkinTypeSelector({
  value,
  onChange,
  youcamDetected,
  className = "",
}: SkinTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<SkinType | null>(null);

  return (
    <div className={`animate-slide-up stagger-2 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-subheading">Skin Type & Sensitivity</p>
          <h3 className="text-h3 mt-1">Your Skin Profile</h3>
        </div>
        {youcamDetected && (
          <motion.span
            className="badge-emerald flex items-center gap-1.5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Info className="h-3 w-3" />
            Detected by YouCam AI: {skinTypeData[youcamDetected].label}
          </motion.span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(skinTypeData) as SkinType[]).map((type) => {
          const data = skinTypeData[type];
          const isSelected = value.type === type;
          const isDetected = youcamDetected === type;

          return (
            <TiltCard
              key={type}
              maxTilt={4}
              glass={!isSelected}
              stone={isSelected}
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => onChange({ ...value, type })}
            >
              <div className="p-5 relative">
                {/* Selected indicator */}
                <AnimatePresence mode="popLayout">
                  {isSelected && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Check className="h-5 w-5 text-white" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* YouCam detected badge */}
                <AnimatePresence mode="popLayout">
                  {isDetected && !isSelected && (
                    <motion.span
                      className="absolute -top-2 -right-2 badge-emerald text-xs"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      YouCam AI
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <motion.div
                  className="mb-4 flex items-center justify-center w-14 h-14 rounded-2xl"
                  style={{
                    backgroundColor: isSelected
                      ? data.accentColor
                      : hoveredType === type
                      ? data.accentGlow
                      : "var(--ca-stone)",
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                >
                  <motion.span
                    style={{ color: isSelected ? "white" : data.accentColor }}
                    initial={{ rotate: -180 }}
                    animate={{ rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {data.icon}
                  </motion.span>
                </motion.div>

                {/* Label & Description */}
                <div className="mb-3">
                  <h4 className="font-semibold text-lg text-[var(--ca-obsidian)]">
                    {data.label}
                  </h4>
                  <p className="text-body-sm text-[var(--ca-slate)] mt-0.5">
                    {data.description}
                  </p>
                </div>

                {/* Traits */}
                <div className="mb-4 space-y-1.5">
                  {data.traits.map((trait, i) => (
                    <motion.div
                      key={trait}
                      className="flex items-center gap-2 text-body-sm text-[var(--ca-slate-light)]"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: data.accentColor }}
                      />
                      {trait}
                    </motion.div>
                  ))}
                </div>

                {/* Needs summary */}
                <div className="pt-3 border-t border-[var(--ca-border)]">
                  <p className="text-xs font-medium text-[var(--ca-slate-light)] uppercase tracking-wider mb-2">
                    Recommended Vehicle & Actives
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.needs.slice(0, 2).map((need, i) => (
                      <motion.span
                        key={need}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: data.accentGlow,
                          color: data.accentColor,
                          border: `1px solid ${data.accentColor}33`,
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + i * 0.05 }}
                      >
                        {need}
                      </motion.span>
                    ))}
                    {data.needs.length > 2 && (
                      <motion.span
                        className="text-xs px-2.5 py-1 rounded-full text-[var(--ca-slate-light)]"
                        style={{
                          backgroundColor: "var(--ca-stone)",
                          border: "1px solid var(--ca-border)",
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 }}
                      >
                        +{data.needs.length - 2} more
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* Sensitivity Toggle */}
      <motion.div
        className="mt-6 glass-card p-5 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: value.sensitive
                  ? "var(--ca-crimson-glow)"
                  : "var(--ca-stone)",
              }}
            >
              <AlertTriangle
                className="h-6 w-6"
                style={{
                  color: value.sensitive
                    ? "var(--ca-crimson)"
                    : "var(--ca-slate-light)",
                }}
              />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--ca-obsidian)]">
                Sensitive / Reactive Barrier
              </h4>
              <p className="text-body-sm text-[var(--ca-slate)]">
                Redness, stinging, fragrance intolerance
              </p>
            </div>
          </div>
          <button
            onClick={() => onChange({ ...value, sensitive: !value.sensitive })}
            className="relative w-14 h-8 rounded-full transition-all duration-200 flex items-center"
            style={{
              backgroundColor: value.sensitive
                ? "var(--ca-crimson)"
                : "var(--ca-border)",
            }}
            aria-label={value.sensitive ? "Disable sensitive mode" : "Enable sensitive mode"}
          >
            <motion.div
              className="absolute w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
              style={{
                left: value.sensitive ? "calc(100% - 10px)" : "4px",
                boxShadow: value.sensitive
                  ? "0 2px 8px rgba(153,27,27,0.3)"
                  : "0 2px 8px rgba(20,22,21,0.15)",
              }}
              animate={{ x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Check
                className="h-4 w-4"
                style={{ color: value.sensitive ? "var(--ca-crimson)" : "transparent" }}
              />
            </motion.div>
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          {value.sensitive && (
            <motion.div
              className="mt-4 p-4 rounded-xl"
              style={{ backgroundColor: "var(--ca-crimson-glow)", border: "1px solid var(--ca-crimson-glow)" }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "var(--ca-crimson)" }} />
                <div className="text-body-sm text-[var(--ca-crimson)] space-y-1">
                  <p><strong>Strictly avoiding:</strong> Fragrance, essential oils, high-% glycolic acid, harsh retinoids</p>
                  <p><strong>Prioritizing:</strong> Centella Asiatica, Azelaic Acid, Panthenol, Ceramides</p>
                  <p>All shelf conflicts and recommendations will recalculate with this sensitivity filter.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
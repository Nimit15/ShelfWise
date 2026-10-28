"use client";

import React from "react";
import { motion } from "framer-motion";
import { Droplets, Sun, Layers, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

export type SkinType = "oily" | "dry" | "combination" | "normal";
export type Sensitivity = "sensitive" | "normal";

export interface SkinProfile {
  type: SkinType;
  sensitive: Sensitivity;
}

export interface SkinTypeSelectorProps {
  value: SkinProfile;
  onChange: (profile: SkinProfile) => void;
  youcamDetected?: SkinType;
  compact?: boolean;
  className?: string;
}

const SKIN_TYPE_META: Array<{
  id: SkinType;
  label: string;
  traits: string;
  vehicleRule: string;
  avoids: string;
  icon: React.ElementType;
}> = [
  {
    id: "oily",
    label: "Oily",
    traits: "Excess sebum · Enlarged pores",
    vehicleRule: "Best with Gel, Light Fluid & BHA/Niacinamide",
    avoids: "Flags heavy occlusive creams & balms",
    icon: Droplets,
  },
  {
    id: "dry",
    label: "Dry",
    traits: "Lipid-depleted · Tightness",
    vehicleRule: "Best with Rich Ceramide Creams & Milky Cleansers",
    avoids: "Flags stripping foaming cleansers & high acids",
    icon: Sun,
  },
  {
    id: "combination",
    label: "Combination",
    traits: "Oily T-Zone · Dry cheeks",
    vehicleRule: "Best with Balanced Lotions & Multi-zone Actives",
    avoids: "Flags extreme drying or overly heavy oils",
    icon: Layers,
  },
  {
    id: "normal",
    label: "Normal",
    traits: "Balanced sebum & hydration",
    vehicleRule: "Best with Barrier Maintenance & Antioxidants",
    avoids: "Flags unnecessary overlapping actives",
    icon: ShieldCheck,
  },
];

export function SkinTypeSelector({
  value,
  onChange,
  youcamDetected,
  compact = false,
  className = "",
}: SkinTypeSelectorProps) {
  const activeMeta = SKIN_TYPE_META.find((m) => m.id === value.type) ?? SKIN_TYPE_META[2];
  const isSensitive = value.sensitive === "sensitive";

  if (compact) {
    return (
      <div className={`flex flex-col gap-2.5 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C4BDB3]">
            Skin Profile & Vehicle Calibration
          </span>
          {youcamDetected && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E5C185]/40 bg-[#E5C185]/10 px-2.5 py-0.5 font-mono-tech text-[10px] text-[#E5C185]">
              <Sparkles className="h-2.5 w-2.5"/>
              AI Detected: {youcamDetected.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-white/14 bg-black/35 p-1.5 backdrop-blur-xl">
          {SKIN_TYPE_META.map((item) => {
            const active = value.type === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({ ...value, type: item.id })}
                className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  active ? "text-[#141210]" : "text-[#C4BDB3] hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="compact-skin-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#F7F4EF]"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.label}
                  {youcamDetected === item.id && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-[#141210]" : "bg-[#E5C185]"
                      }`}
                    />
                  )}
                </span>
              </button>
            );
          })}

          <div className="mx-1 h-4 w-px bg-white/15" />

          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                sensitive: isSensitive ? "normal" : "sensitive",
              })
            }
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              isSensitive
                ? "border border-[#F87171]/50 bg-[#F87171]/20 text-[#FCA5A5]"
                : "text-[#8A8177] hover:text-[#C4BDB3]"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5"/>
            Sensitive Barrier
          </button>
        </div>

        <p className="text-xs text-[#C4BDB3]/90">
          <span className="font-medium text-[#E5C185]">{activeMeta.label} Protocol:</span>{" "}
          {activeMeta.vehicleRule}.{" "}
          {isSensitive && (
            <span className="text-[#FCA5A5]">
              · Reactive Barrier Active (blocks fragrance & high-strength acids).
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-white/12 bg-white/[0.035] p-5 backdrop-blur-2xl ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-[11px] uppercase tracking-[0.18em] text-[#E5C185]">
              Biometric Skin Profile
            </span>
            {youcamDetected && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2.5 py-0.5 font-mono-tech text-[10px] text-[#34D399]">
                <Sparkles className="h-3 w-3"/>
                YouCam AI: {youcamDetected.toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="mt-1 font-serif-editorial text-2xl font-normal text-[#F7F4EF]">
            Calibrate Formulation Vehicles & Active Thresholds
          </h3>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              sensitive: isSensitive ? "normal" : "sensitive",
            })
          }
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
            isSensitive
              ? "border-[#F87171]/60 bg-[#F87171]/15 text-[#FCA5A5] shadow-[0_0_25px_rgba(248,113,113,0.2)]"
              : "border-white/15 bg-white/[0.04] text-[#C4BDB3] hover:border-white/30 hover:text-white"
          }`}
        >
          <ShieldAlert className="h-4 w-4"/>
          <span>Sensitive / Reactive Barrier: {isSensitive ? "ON" : "OFF"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SKIN_TYPE_META.map((item) => {
          const Icon = item.icon;
          const active = value.type === item.id;
          const isAiMatch = youcamDetected === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ ...value, type: item.id })}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                active
                  ? "border-[#F7F4EF] bg-[#F7F4EF] text-[#141210] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                  : "border-white/10 bg-white/[0.03] text-[#F7F4EF] hover:border-white/25 hover:bg-white/[0.06]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      active ? "bg-[#141210] text-[#F7F4EF]" : "bg-white/10 text-[#E5C185]"
                    }`}
                  >
                    <Icon className="h-4 w-4"/>
                  </div>
                  {isAiMatch && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono-tech text-[10px] uppercase ${
                        active
                          ? "bg-[#141210]/15 text-[#141210]"
                          : "bg-[#E5C185]/15 text-[#E5C185]"
                      }`}
                    >
                      AI Match
                    </span>
                  )}
                </div>

                <div className="mt-3 font-serif-editorial text-xl font-medium">
                  {item.label} Skin
                </div>
                <p
                  className={`mt-0.5 text-xs ${
                    active ? "text-[#141210]/75" : "text-[#C4BDB3]"
                  }`}
                >
                  {item.traits}
                </p>
              </div>

              <div
                className={`mt-4 border-t pt-2.5 text-[11px] leading-relaxed ${
                  active
                    ? "border-[#141210]/15 text-[#141210]/85"
                    : "border-white/10 text-[#8A8177]"
                }`}
              >
                <div className="font-medium">{item.vehicleRule}</div>
                <div className="mt-0.5 opacity-80">{item.avoids}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SkinTypeSelector;
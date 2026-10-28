"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  BarChart2,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  Map,
  FileText,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { SkinTypeSelector, SkinProfile } from "@/components/shelf/SkinTypeSelector";
import { DermalLayer3D } from "@/components/scan/DermalLayer3D";
import { ParsedScan, CONCERN_LABELS, CONCERN_COLORS, getConcernColor } from "@/lib/mock-scan";
import { SkinType } from "@/components/shelf/SkinTypeSelector";

export interface ScanResultsViewProps {
  scan: ParsedScan;
  onAudit: () => void;
  onBack: () => void;
  skinProfile: SkinProfile;
  onSkinProfileChange: (profile: SkinProfile) => void;
  selectedImage: string | null;
}

function starRating(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

const ZONE_LABELS: Record<string, string> = {
  t_zone: "T-Zone",
  u_zone: "U-Zone (Cheeks)",
  whole: "Whole Face",
  periorbital: "Periorbital",
  nasolabial: "Nasolabial Fold",
  forehead: "Forehead",
};

const CONCERN_ZONES: Record<string, string[]> = {
  oiliness: ["t_zone"],
  pore: ["t_zone", "cheeks"],
  acne: ["t_zone", "cheeks", "jawline"],
  wrinkle: ["periorbital", "nasolabial"],
  dark_circle: ["periorbital"],
  tear_trough: ["periorbital"],
  eye_bag: ["periorbital"],
  firmness: ["whole"],
  texture: ["whole"],
  radiance: ["whole"],
  moisture: ["whole"],
  redness: ["cheeks", "t_zone"],
};

export function ScanResultsView({
  scan,
  onAudit,
  onBack,
  skinProfile,
  onSkinProfileChange,
  selectedImage,
}: ScanResultsViewProps) {
  const concernScores: Record<string, number> = {};
  for (const c of scan.concerns) {
    const baseId = c.type.replace("hd_", "").replace("v2", "");
    concernScores[baseId] = c.uiScore;
  }

  const priorityConcerns = scan.concerns
    .filter((c) => c.type !== "hd_skin_type" && c.uiScore !== undefined)
    .sort((a, b) => a.uiScore - b.uiScore)
    .slice(0, 6);

  const strengthConcerns = scan.concerns
    .filter((c) => c.type !== "hd_skin_type" && c.uiScore !== undefined)
    .sort((a, b) => b.uiScore - a.uiScore)
    .slice(0, 4);

  const skinTypeLabel = scan.skinType.type;
  const skinAge = scan.skinAge;
  const overallScore = scan.overallScore;

  const primaryConcern = priorityConcerns[0];
  const primaryLabel = primaryConcern
    ? CONCERN_LABELS[primaryConcern.type] || primaryConcern.type
    : "N/A";

  return (
    <div className="min-h-screen bg-[#161310]">
      <div className="atelier-studio-backdrop" />

      <div className="relative mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center justify-between"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-[#C4BDB3] hover:text-[#F7F4EF]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="font-mono-tech text-xs">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAudit}
              className="flex items-center gap-2 rounded-full border border-[#E5C185]/30 bg-[#E5C185]/10 px-4 py-2 font-mono-tech text-xs text-[#E5C185] transition-all hover:bg-[#E5C185]/20"
            >
              <FileText className="h-3.5 w-3.5" />
              Shelf Audit
            </button>
          </div>
        </motion.div>

        {/* Hero Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="font-serif-editorial mb-2 text-4xl text-[#F7F4EF]">
            Scan Results: {skinTypeLabel} Skin
          </h1>
          <p className="text-[#C4BDB3]">
            Skin Age: {skinAge} • Overall Score: {overallScore.toFixed(1)}
          </p>
        </motion.div>

        {/* Image Display */}
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-2xl border border-white/12 bg-white/[0.035] p-3"
          >
            <img
              src={selectedImage}
              alt="Skin analysis mask overlay"
              className="h-64 w-full rounded-xl object-cover"
            />
          </motion.div>
        )}

        {/* 3D Dermal Layer Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <DermalLayer3D concerns={scan.concerns} concernScores={concernScores} />
        </motion.div>

        {/* Priority Concerns & Strengths Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* Priority Concerns */}
          <TiltCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#F87171]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Priority Concerns
              </h3>
            </div>

            <div className="space-y-3">
              {priorityConcerns.map((concern) => {
                const label = CONCERN_LABELS[concern.type] || concern.type;
                const color = getConcernColor(concern.uiScore);
                const stars = starRating(concern.uiScore);
                const zones = CONCERN_ZONES[concern.type.replace("hd_", "")] || [];

                return (
                  <div
                    key={concern.type}
                    className="rounded-xl border border-white/8 bg-black/30 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="font-serif-editorial text-sm text-[#F7F4EF]"
                      >
                        {label}
                      </span>
                      <div
                        className="flex items-center gap-1"
                        style={{ color }}
                      >
                        {Array.from({ length: stars }).map((_, i) => (
                          <Sparkles key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-tech text-[#8A8177]">
                        Severity Score
                      </span>
                      <span
                        className="font-mono-tech font-medium"
                        style={{ color }}
                      >
                        {concern.uiScore}/100
                      </span>
                    </div>

                    {zones.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {zones.map((zone) => (
                          <span
                            key={zone}
                            className="font-mono-tech text-[10px] text-[#8A8177]"
                          >
                            {ZONE_LABELS[zone] || zone}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TiltCard>

          {/* Strengths */}
          <TiltCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#34D399]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Skin Strengths
              </h3>
            </div>

            <div className="space-y-3">
              {strengthConcerns.map((concern) => {
                const label = CONCERN_LABELS[concern.type] || concern.type;
                const color = getConcernColor(concern.uiScore);
                const stars = starRating(concern.uiScore);

                return (
                  <div
                    key={concern.type}
                    className="rounded-xl border border-white/8 bg-black/30 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                        {label}
                      </span>
                      <div className="flex items-center gap-1 text-[#34D399]">
                        {Array.from({ length: 5 - stars }).map((_, i) => (
                          <CheckCircle key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-tech text-[#8A8177]">Score</span>
                      <span className="font-mono-tech font-medium text-[#34D399]">
                        {concern.uiScore}/100
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TiltCard>
        </motion.div>

        {/* Skin Profile Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <TiltCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#E5C185]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Refine Your Profile
              </h3>
            </div>
            <p className="mb-4 text-sm text-[#C4BDB3]">
              Adjust your skin type and sensitivity. This affects how the bio-inventory
              engine flags conflicts and recommends products.
            </p>

            <SkinTypeSelector
              value={skinProfile}
              onChange={(profile) => onSkinProfileChange(profile)}
              youcamDetected={scan.skinType.type.toLowerCase() as SkinType}
              compact
            />
          </TiltCard>
        </motion.div>

        {/* Biometric Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <TiltCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Clinical Summary
              </h3>
              <span className="font-mono-tech text-xs text-[#8A8177]">
                Primary Concern: {primaryLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-white/8 bg-black/30 p-4 text-center">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                  Overall Score
                </div>
                <div className="font-serif-editorial mt-1 text-2xl text-[#F7F4EF]">
                  {overallScore.toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-black/30 p-4 text-center">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                  Skin Age
                </div>
                <div className="font-serif-editorial mt-1 text-2xl text-[#F7F4EF]">
                  {skinAge}
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-black/30 p-4 text-center">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                  Concerns Analyzed
                </div>
                <div className="font-serif-editorial mt-1 text-2xl text-[#F7F4EF]">
                  {scan.concerns.filter((c) => c.type !== "hd_skin_type").length}
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-black/30 p-4 text-center">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                  Skin Type
                </div>
                <div className="font-serif-editorial mt-1 text-2xl text-[#F7F4EF]">
                  {skinTypeLabel}
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}

export default ScanResultsView;
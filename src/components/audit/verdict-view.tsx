"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ShoppingCart,
  TrendingUp,
  Shield,
  Package,
  BarChart3,
  CheckCircle,
  Wallet,
  Calendar,
  ExternalLink,
  RefreshCw,
  Award,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { EngineOutput, ShelfProduct } from "@/types/engine";
import { FunctionalRole } from "@/data/catalog";

import { YouCamConcern, YouCamSkinType } from "@/types/youcam";

export interface VerdictViewProps {
  engineResult: EngineOutput | null;
  scan: { concerns: YouCamConcern[]; skinType: YouCamSkinType; skinAge: number; overallScore: number };
  onRestart: () => void;
  onBack: () => void;
  onHome: () => void;
}

function verdictIcon(type: EngineOutput["verdict"]["type"]): React.ElementType {
  switch (type) {
    case "buy_nothing": return Award;
    case "minimal_addition": return ShoppingCart;
    case "targeted_addition": return TrendingUp;
    default: return Shield;
  }
}

function verdictColor(type: EngineOutput["verdict"]["type"]): string {
  switch (type) {
    case "buy_nothing": return "text-[#34D399] bg-[#34D399]/10 border-[#34D399]/40";
    case "minimal_addition": return "text-[#E5C185] bg-[#E5C185]/10 border-[#E5C185]/40";
    case "targeted_addition": return "text-[#2ECC71] bg-[#2ECC71]/10 border-[#2ECC71]/40";
    default: return "text-[#8A8177] bg-white/5 border-white/10";
  }
}

function verdictDescription(type: EngineOutput["verdict"]["type"]): string {
  switch (type) {
    case "buy_nothing":
      return "Your existing shelf fully addresses your clinical needs. No new purchases required — save your budget for treatments.";
    case "minimal_addition":
      return "A small gap exists in your routine. One targeted addition will complete your shelf without redundancy.";
    case "targeted_addition":
      return "Multiple gaps detected. Targeted additions will complete your routine with maximum clinical impact.";
    default:
      return "Analysis complete.";
  }
}

function roleLabel(role: FunctionalRole): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function VerdictView({
  engineResult,
  scan,
  onRestart,
  onBack,
  onHome,
}: VerdictViewProps) {
  if (!engineResult) {
    return (
      <div className="min-h-screen bg-[#161310]">
        <div className="atelier-studio-backdrop" />
        <div className="relative mx-auto max-w-6xl px-4 py-8">
          <p className="font-serif-editorial text-center text-lg text-[#F7F4EF]">
            No verdict data available.
          </p>
        </div>
      </div>
    );
  }

  const { verdict, finalRoutine, auditTrail } = engineResult;
  const Icon = verdictIcon(verdict.type);
  const colorClass = verdictColor(verdict.type);
  const totalSaved = verdict.moneySavedInr;

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
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-[#C4BDB3] hover:text-[#F7F4EF]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-mono-tech text-xs">Back to Audit</span>
            </button>
            <button
              type="button"
              onClick={onHome}
              className="flex items-center gap-2 text-[#C4BDB3] hover:text-[#F7F4EF]"
            >
              <span className="font-mono-tech text-xs">Home</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 font-mono-tech text-xs text-[#C4BDB3] hover:border-white/25 hover:text-[#F7F4EF]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New Analysis
          </button>
        </motion.div>

        {/* Verdict Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10"
        >
          <TiltCard stone className="p-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <motion.div
                className={`rounded-full p-4 ${colorClass}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon className="h-8 w-8" />
              </motion.div>

              <div>
                <h1 className="font-serif-editorial mb-2 text-3xl text-[#F7F4EF]">
                  Clinical Verdict
                </h1>
                <p className="font-serif-editorial text-2xl text-[#E5C185]">
                  {verdict.type.replace(/_/g, " ").toUpperCase()}
                </p>
              </div>

              <p className="max-w-2xl text-lg text-[#C4BDB3]">
                {verdict.message}
              </p>

              {verdict.totalCostInr > 0 && (
                <motion.div
                  className="rounded-xl border border-[#E5C185]/30 bg-[#E5C185]/5 px-6 py-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="font-mono-tech text-xs uppercase tracking-[0.1em] text-[#8A8177]">
                    Recommended Spend
                  </span>
                  <div className="font-serif-editorial mt-1 text-2xl text-[#E5C185]">
                    ₹{verdict.totalCostInr.toFixed(0)}
                  </div>
                  <span className="font-mono-tech text-[10px] text-[#8A8177]">
                    (${verdict.totalCostUsd.toFixed(2)} USD)
                  </span>
                </motion.div>
              )}

              {totalSaved > 0 && (
                <motion.div
                  className="flex items-center gap-2 text-[#2ECC71]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Wallet className="h-4 w-4" />
                  <span className="font-mono-tech text-sm">
                    Potential savings: ₹{totalSaved.toFixed(0)}
                  </span>
                </motion.div>
              )}
            </div>
          </TiltCard>
        </motion.div>

        {/* Audit Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="font-serif-editorial mb-4 text-xl text-[#F7F4EF]">
            Audit Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <TiltCard className="p-4 text-center">
              <Package className="mx-auto mb-2 h-5 w-5 text-[#E5C185]" />
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                Products
              </div>
              <div className="font-serif-editorial mt-1 text-xl text-[#F7F4EF]">
                {auditTrail.productsAnalyzed}
              </div>
            </TiltCard>

            <TiltCard className="p-4 text-center">
              <Shield className="mx-auto mb-2 h-5 w-5 text-[#F87171]" />
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                Conflicts
              </div>
              <div className="font-serif-editorial mt-1 text-xl text-[#F87171]">
                {auditTrail.conflictsFound}
              </div>
            </TiltCard>

            <TiltCard className="p-4 text-center">
              <BarChart3 className="mx-auto mb-2 h-5 w-5 text-[#E5C185]" />
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                Redundancies
              </div>
              <div className="font-serif-editorial mt-1 text-xl text-[#E5C185]">
                {auditTrail.redundanciesFound}
              </div>
            </TiltCard>

            <TiltCard className="p-4 text-center">
              <Award className="mx-auto mb-2 h-5 w-5 text-[#34D399]" />
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                Gaps
              </div>
              <div className="font-serif-editorial mt-1 text-xl text-[#34D399]">
                {auditTrail.gapsIdentified}
              </div>
            </TiltCard>

            <TiltCard className="p-4 text-center">
              <Shield className="mx-auto mb-2 h-5 w-5 text-[#2ECC71]" />
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                Compat Score
              </div>
              <div className="font-serif-editorial mt-1 text-xl text-[#2ECC71]">
                {auditTrail.compatibilityScore.toFixed(0)}
              </div>
            </TiltCard>
          </div>
        </motion.div>

        {/* Final Routine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-10"
        >
          <h2 className="font-serif-editorial mb-4 text-xl text-[#F7F4EF]">
            Final Routine
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {(["AM", "PM"] as const).map((period) => (
              <TiltCard key={period} className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`rounded-lg p-1.5 ${
                      period === "AM"
                        ? "bg-[#E5C185]/10 text-[#E5C185]"
                        : "bg-[#34D399]/10 text-[#34D399]"
                    }`}
                  >
                    {period === "AM" ? (
                      <Calendar className="h-4 w-4" />
                    ) : (
                      <Calendar className="h-4 w-4" />
                    )}
                  </div>
                  <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                    {period} Routine
                  </h3>
                </div>

                <div className="space-y-2">
                  {finalRoutine[period].map((step) => (
                    <div
                      key={`${step.productId}-${step.step}`}
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/30 p-3"
                    >
                      <span className="font-mono-tech text-xs text-[#8A8177]">
                        Step {step.step}:
                      </span>
                      <div className="flex-1">
                        <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                          {step.productName}
                        </span>
                        <span className="font-mono-tech text-[10px] text-[#8A8177]">
                          {" · " + roleLabel(step.role)}
                        </span>
                      </div>
                      <span className="font-mono-tech text-xs text-[#34D399]">
                        ✓
                      </span>
                    </div>
                  ))}
                  {finalRoutine[period].length === 0 && (
                    <span className="font-mono-tech text-xs text-[#8A8177]">
                      No products in this period.
                    </span>
                  )}
                </div>
              </TiltCard>
            ))}
          </div>
        </motion.div>

        {/* Clinical Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <TiltCard className="p-6">
            <h3 className="font-serif-editorial mb-3 text-lg text-[#F7F4EF]">
              Clinical Notes
            </h3>
            <div className="space-y-3 text-sm text-[#C4BDB3]">
              <p>
                {verdictDescription(verdict.type)}
              </p>
              <p>
                Analysis based on {scan.concerns.filter((c: { type: string }) => c.type !== "hd_skin_type").length} biometric concern channels,
                skin type {scan.skinType.type}, age {scan.skinAge}, barrier load score {auditTrail.barrierLoadScore.toFixed(1)}.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <CheckCircle className="h-4 w-4 text-[#34D399]" />
                <span>
                  Report generated on {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}

export default VerdictView;

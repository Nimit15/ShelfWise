"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  Package,
  ShoppingCart,
  Droplets,
  Sun,
  Shield,
  Sparkles,
  BarChart3,
  Zap,
  TrendingUp,
  ExternalLink,
  Settings,
  Banknote,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { SkinTypeSelector, SkinType, SkinProfile } from "@/components/shelf/SkinTypeSelector";
import { ShelfProduct, EngineOutput, EngineConstraints, BiometricConflict, ChemicalConflict, RedundancyAlert, GapRecommendation } from "@/types/engine";
import { FunctionalRole } from "@/data/catalog";

import { YouCamConcern, YouCamSkinType } from "@/types/youcam";

export interface ShelfAuditViewProps {
  scan: { concerns: YouCamConcern[]; skinType: YouCamSkinType; skinAge: number; overallScore: number };
  engineResult: EngineOutput | null;
  shelf: ShelfProduct[];
  onShelfChange: (shelf: ShelfProduct[]) => void;
  onProductSelect: (id: string) => void;
  onVerdict: () => void;
  onBack: () => void;
  onHome: () => void;
  constraints: EngineConstraints;
  setConstraints: (c: EngineConstraints) => void;
  skinProfile: SkinProfile;
  onSkinProfileChange: (profile: SkinProfile) => void;
}

function severityColor(severity: BiometricConflict["severity"]): string {
  switch (severity) {
    case "high": return "text-[#F87171] bg-[#F87171]/15 border border-[#F87171]/40";
    case "medium": return "text-[#E5C185] bg-[#E5C185]/10 border border-[#E5C185]/40";
    case "low": return "text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/40";
    default: return "text-[#8A8177] bg-white/5 border border-white/10";
  }
}

function conflictTypeIcon(conflictType: BiometricConflict["conflictType"]): React.ElementType {
  switch (conflictType) {
    case "barrier": return Shield;
    case "irritancy": return Zap;
    case "sensitivity": return Droplets;
    default: return AlertTriangle;
  }
}

function resolutionLabel(resolution: ChemicalConflict["resolution"]): string {
  switch (resolution) {
    case "separate_am_pm": return "Separate AM/PM";
    case "alternate_days": return "Alternate Days";
    case "pause_one": return "Pause One";
    default: return resolution;
  }
}

function roleLabel(role: FunctionalRole): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function priceDisplay(product: ShelfProduct, currency: "INR" | "USD"): string {
  const price = currency === "INR" ? product.priceInr : product.priceUsd;
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${price}`;
}

export function ShelfAuditView({
  scan,
  engineResult,
  shelf,
  onShelfChange,
  onProductSelect,
  onVerdict,
  onBack,
  onHome,
  constraints,
  setConstraints,
  skinProfile,
  onSkinProfileChange,
}: ShelfAuditViewProps) {
  const [showSettings, setShowSettings] = React.useState(false);

  if (!engineResult) {
    return (
      <div className="min-h-screen bg-[#161310]">
        <div className="atelier-studio-backdrop" />
        <div className="relative mx-auto max-w-6xl px-4 py-8">
          <p className="font-serif-editorial text-center text-lg text-[#F7F4EF]">
            No audit data available.
          </p>
        </div>
      </div>
    );
  }

  const {
    biometricConflicts,
    chemicalConflicts,
    redundancyAlerts,
    gapRecommendations,
    finalRoutine,
    verdict,
    auditTrail,
  } = engineResult;

  const activeConflicts = biometricConflicts.filter((c) => c.severity === "high").length;
  const totalConflicts = biometricConflicts.length + chemicalConflicts.length;
  const totalSaved = constraints.currency === "INR" ? verdict.moneySavedInr : verdict.moneySavedUsd;
  const currencySymbol = constraints.currency === "INR" ? "₹" : "$";

  return (
    <div className="min-h-screen bg-[#161310] bg-[url('/grid-pattern.svg')] bg-[length:60px_60px] opacity-[0.02]">
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
              <span className="font-mono-tech text-xs">Back</span>
            </button>
            <button
              type="button"
              onClick={onHome}
              className="flex items-center gap-2 text-[#C4BDB3] hover:text-[#F7F4EF]"
            >
              <span className="font-mono-tech text-xs">Home</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-mono-tech text-[#C4BDB3] hover:border-white/25 hover:text-[#F7F4EF]"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onVerdict}
              className="flex items-center gap-2 rounded-full border border-[#E5C185]/30 bg-[#E5C185] px-4 py-2 font-mono-tech text-xs text-[#141210] transition-all hover:bg-[#E5C185]/90"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Final Verdict
            </button>
          </div>
        </motion.div>

        {/* Audit Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-5"
        >
          <div className="rounded-xl border border-[#F87171]/20 bg-[#F87171]/5 p-4 text-center">
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#F87171]">
              High Severity
            </div>
            <div className="font-serif-editorial mt-1 text-2xl text-[#F87171]">
              {activeConflicts}
            </div>
          </div>

          <div className="rounded-xl border border-[#E5C185]/20 bg-[#E5C185]/5 p-4 text-center">
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#E5C185]">
              Total Conflicts
            </div>
            <div className="font-serif-editorial mt-1 text-2xl text-[#E5C185]">
              {totalConflicts}
            </div>
          </div>

          <div className="rounded-xl border border-[#34D399]/20 bg-[#34D399]/5 p-4 text-center">
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#34D399]">
              Barrier Load
            </div>
            <div className="font-serif-editorial mt-1 text-2xl text-[#34D399]">
              {auditTrail.barrierLoadScore.toFixed(1)}
            </div>
          </div>

          <div className="rounded-xl border border-[#2ECC71]/20 bg-[#2ECC71]/5 p-4 text-center">
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#2ECC71]">
              Savings Identified
            </div>
            <div className="font-serif-editorial mt-1 text-2xl text-[#2ECC71]">
              {currencySymbol}{totalSaved.toFixed(0)}
            </div>
          </div>

          <div className="rounded-xl border border-white/12 bg-black/30 p-4 text-center">
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
              Verdict
            </div>
            <div className="font-serif-editorial mt-1 text-xl text-[#F7F4EF]">
              {verdict.type.replace(/_/g, " ")}
            </div>
          </div>
        </motion.div>

        {/* Skin Profile Calibration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <TiltCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#E5C185]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Skin Profile & Constraints
              </h3>
            </div>

            <SkinTypeSelector
              value={{
                type: skinProfile.type,
                sensitive: skinProfile.sensitive,
              }}
              onChange={(profile) => {
                onSkinProfileChange(profile);
              }}
              youcamDetected={scan.skinType.type.toLowerCase() as SkinType}
              compact
            />

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="font-mono-tech text-[10px] uppercase tracking-[0.1em] text-[#8A8177]">
                  Budget ({constraints.currency})
                </label>
                <input
                  type="number"
                  value={constraints.currency === "INR" ? constraints.budgetInr : constraints.budgetUsd}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const field = constraints.currency === "INR" ? "budgetInr" : "budgetUsd";
                    setConstraints({ ...constraints, [field]: val });
                  }}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 font-mono-tech text-sm text-[#F7F4EF] focus:border-[#E5C185] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono-tech text-[10px] uppercase tracking-[0.1em] text-[#8A8177]">
                  Currency
                </label>
                <select
                  value={constraints.currency}
                  onChange={(e) => setConstraints({ ...constraints, currency: e.target.value as "INR" | "USD" })}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 font-mono-tech text-sm text-[#F7F4EF] focus:border-[#E5C185] focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="font-mono-tech text-[10px] uppercase tracking-[0.1em] text-[#8A8177]">
                  Routine Preference
                </label>
                <select
                  value={constraints.routinePreference}
                  onChange={(e) => setConstraints({ ...constraints, routinePreference: e.target.value as "minimalist" | "targeted" })}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 font-mono-tech text-sm text-[#F7F4EF] focus:border-[#E5C185] focus:outline-none"
                >
                  <option value="minimalist">Minimalist</option>
                  <option value="targeted">Targeted</option>
                </select>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Conflicts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-serif-editorial mb-4 text-2xl text-[#F7F4EF]">
            Bio-Inventory Conflicts
          </h2>

          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {biometricConflicts.length === 0 ? (
                <TiltCard className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#34D399]" />
                    <span className="text-[#C4BDB3]">No biometric conflicts detected.</span>
                  </div>
                </TiltCard>
              ) : (
                biometricConflicts.map((conflict) => {
                  const Icon = conflictTypeIcon(conflict.conflictType);
                  return (
                    <TiltCard key={`${conflict.productId}-${conflict.concern}`} className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`rounded-lg p-2 ${severityColor(conflict.severity)}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                              {conflict.productName}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${severityColor(conflict.severity)}`}>
                              {conflict.severity.toUpperCase()}
                            </span>
                          </div>

                          <div className="mb-2 flex items-center gap-4 text-xs font-mono-tech text-[#8A8177]">
                            <span>Concern: {conflict.concern}</span>
                            <span>Score: {conflict.concernScore}/100</span>
                            <span>Type: {conflict.conflictType}</span>
                          </div>

                          <p className="text-sm text-[#C4BDB3]">
                            {conflict.explanation}
                          </p>

                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 text-[#E5C185]">
                              <Zap className="h-3 w-3" />
                              Action: {conflict.recommendation.replace(/_/g, " ")}
                            </span>
                            <span className="flex items-center gap-1 text-[#8A8177]">
                              <Settings className="h-3 w-3" />
                              Pause: {conflict.daysToPause} days
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onProductSelect(conflict.productId)}
                          className="rounded-lg p-1 text-[#8A8177] hover:bg-white/5 hover:text-[#F7F4EF]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </TiltCard>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Chemical Conflicts */}
        {chemicalConflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="font-serif-editorial mb-4 text-2xl text-[#F7F4EF]">
              Chemical Compatibility Conflicts
            </h2>
            <div className="space-y-4">
              {chemicalConflicts.map((conflict, i) => (
                <TiltCard key={`${conflict.productIdA}-${conflict.productIdB}`} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-[#E5C185]/10 p-2 text-[#E5C185]">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                          {conflict.productNameA}
                        </span>
                        <span className="font-mono-tech text-xs text-[#8A8177]">+</span>
                        <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                          {conflict.productNameB}
                        </span>
                      </div>

                      <div className="mb-2 text-xs font-mono-tech text-[#8A8177]">
                        Type: {conflict.conflictType} • Resolution: {resolutionLabel(conflict.resolution)}
                      </div>

                      <p className="mb-2 text-sm text-[#C4BDB3]">
                        {conflict.explanation}
                      </p>

                      {conflict.ingredients.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {conflict.ingredients.map((ing) => (
                            <span
                              key={ing}
                              className="rounded-full bg-white/5 px-2 py-0.5 font-mono-tech text-[10px] text-[#C4BDB3]"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="font-mono-tech text-xs text-[#E5C185]">
                        Affected: {conflict.affectedSlot}
                      </span>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Redundancy Alerts */}
        {redundancyAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="font-serif-editorial mb-4 text-2xl text-[#F7F4EF]">
              Redundancy Alerts
            </h2>
            <div className="space-y-4">
              {redundancyAlerts.map((alert, i) => (
                <TiltCard key={alert.role} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-[#34D399]/10 p-2 text-[#34D399]">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                          Role: {roleLabel(alert.role)}
                        </span>
                        <span className="font-mono-tech text-xs text-[#2ECC71]">
                          Save {currencySymbol}{constraints.currency === "INR" ? alert.redundantValueInr : alert.redundantValueUsd}
                        </span>
                      </div>

                      <p className="mb-3 text-sm text-[#C4BDB3]">
                        {alert.recommendation === "keep_best"
                          ? "Keep only the most effective product for this role."
                          : "Consolidate to reduce redundancy."}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {alert.products.map((product) => {
                          const isKept = product.id === alert.keptProductId;
                          const isRemoved = alert.removedProductIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => onProductSelect(product.id)}
                              className={`rounded-lg border px-3 py-2 text-left transition-all ${
                                isKept
                                  ? "border-[#34D399]/40 bg-[#34D399]/10"
                                  : isRemoved
                                    ? "border-[#F87171]/40 bg-[#F87171]/10"
                                    : "border-white/12 bg-black/30"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isKept && <CheckCircle className="h-3 w-3 text-[#34D399]" />}
                                {isRemoved && <AlertTriangle className="h-3 w-3 text-[#F87171]" />}
                                <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                                  {product.name}
                                </span>
                              </div>
                              <span className="font-mono-tech text-[10px] text-[#8A8177]">
                                {priceDisplay(product, constraints.currency)} · {roleLabel(product.roles[0])}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gap Recommendations */}
        {gapRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="font-serif-editorial mb-4 text-2xl text-[#F7F4EF]">
              Gap Recommendations
            </h2>
            <div className="space-y-4">
              {gapRecommendations.map((gap, i) => (
                <TiltCard key={gap.concern} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-[#E5C185]/10 p-2 text-[#E5C185]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                          {gap.concern.charAt(0).toUpperCase() + gap.concern.slice(1)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            gap.concernScore >= 85
                              ? "text-[#F87171] bg-[#F87171]/15"
                              : gap.concernScore >= 60
                                ? "text-[#E5C185] bg-[#E5C185]/10"
                                : "text-[#34D399] bg-[#34D399]/10"
                          }`}
                        >
                          Score: {gap.concernScore}
                        </span>
                      </div>

                      <p className="mb-3 text-sm text-[#C4BDB3]">
                        {gap.rationale}
                      </p>

                      {gap.recommendedProduct && (
                        <div className="mb-3 rounded-xl border border-white/12 bg-black/30 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-serif-editorial text-sm text-[#F7F4EF]">
                                {gap.recommendedProduct.name}
                              </div>
                              <div className="font-mono-tech text-[10px] text-[#8A8177]">
                                {gap.recommendedProduct.brand} · {gap.recommendedProduct.description.slice(0, 80)}...
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-serif-editorial text-sm text-[#E5C185]">
                                {priceDisplay(gap.recommendedProduct, constraints.currency)}
                              </div>
                              <div className="font-mono-tech text-[10px] text-[#8A8177]">
                                Cost/day: {currencySymbol}{(constraints.currency === "INR" ? gap.costPerDayInr : gap.costPerDayUsd).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {gap.exclusionRationales.length > 0 && (
                        <div className="space-y-1.5">
                          {gap.exclusionRationales.map((ex, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs">
                              <span className="font-mono-tech text-[#8A8177] mt-0.5">•</span>
                              <span className="font-mono-tech text-[#C4BDB3]">
                                {ex.productName}: {ex.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Final Routine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-8"
        >
          <h2 className="font-serif-editorial mb-4 text-2xl text-[#F7F4EF]">
            Optimized Routine
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
                    {period === "AM" ? <Sun className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
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
                        {step.step}.
                      </span>
                      <div className="flex-1">
                        <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                          {step.productName}
                        </span>
                        <span className="font-mono-tech text-[10px] text-[#8A8177]">
                          {" · " + roleLabel(step.role)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onProductSelect(step.productId)}
                        className="rounded p-1 text-[#8A8177] hover:text-[#F7F4EF]"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </TiltCard>
            ))}
          </div>
        </motion.div>

        {/* Shelf Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <h2 className="font-serif-editorial mb-4 text-2xl text-[#F7F4EF]">
            Your Shelf
          </h2>
          <div className="space-y-3">
            {shelf.map((product) => {
              const inRoutine =
                finalRoutine.AM.some((s) => s.productId === product.id) ||
                finalRoutine.PM.some((s) => s.productId === product.id);
              const hasConflict = biometricConflicts.some((c) => c.productId === product.id);
              const isRedundant = redundancyAlerts.some((a) =>
                a.removedProductIds.includes(product.id)
              );

              return (
                <TiltCard key={product.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          inRoutine
                            ? "bg-[#34D399]/10 text-[#34D399]"
                            : "bg-white/5 text-[#8A8177]"
                        }`}
                      >
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-serif-editorial text-sm text-[#F7F4EF]">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tech text-[10px] text-[#8A8177]">
                            {product.brand} · {priceDisplay(product, constraints.currency)}
                          </span>
                          {hasConflict && (
                            <span className="rounded-full bg-[#F87171]/15 px-1.5 py-0.5 font-mono-tech text-[10px] text-[#F87171]">
                              Conflict
                            </span>
                          )}
                          {isRedundant && !hasConflict && (
                            <span className="rounded-full bg-[#E5C185]/15 px-1.5 py-0.5 font-mono-tech text-[10px] text-[#E5C185]">
                              Redundant
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onProductSelect(product.id)}
                      className="rounded p-1.5 text-[#8A8177] hover:bg-white/5 hover:text-[#F7F4EF]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </motion.div>

        {/* Verdict Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <TiltCard stone className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-[#161310] p-2 text-[#E5C185]">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif-editorial mb-1 text-xl text-[#F7F4EF]">
                  {verdict.message}
                </h3>
                <p className="text-sm text-[#C4BDB3]">
                  {verdict.totalCostInr > 0
                    ? `Buy ${currencySymbol}${constraints.currency === "INR" ? verdict.totalCostInr : verdict.totalCostUsd} worth of products.`
                    : "No new purchases needed — your existing routine covers everything."}
                  {totalSaved > 0 && ` Potential savings: ${currencySymbol}${totalSaved.toFixed(0)}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={onVerdict}
                className="rounded-full border border-[#E5C185]/30 bg-[#E5C185]/10 px-4 py-2 font-mono-tech text-xs text-[#E5C185] hover:bg-[#E5C185]/20"
              >
                View Verdict
              </button>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}

export default ShelfAuditView;

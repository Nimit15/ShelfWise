"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BarChart3, Eye, Layers, Sparkles, Search, AlertTriangle, CheckCircle2, RotateCcw, Grid, Zap, MousePointer2 } from "lucide-react";
import { ParsedScan, CONCERN_LABELS, getConcernColor } from "@/lib/mock-scan";
import { YouCamConcern } from "@/types/youcam";
import { DermalLayer3D } from "@/components/scan/DermalLayer3D";
import { SkinTypeSelector, SkinType, Sensitivity } from "@/components/shelf/SkinTypeSelector";

interface ScanResultsViewProps {
  scan: ParsedScan;
  onAudit: () => void;
  onBack: () => void;
  skinProfile: { type: SkinType; sensitive: Sensitivity };
  onSkinProfileChange: (profile: { type: SkinType; sensitive: Sensitivity }) => void;
}

const priorityConcerns = [
  { concern: "moisture", score: 67, stars: 2, label: "Moisture / Hydration" },
  { concern: "dark_circle_v2", score: 83, stars: 3, label: "Dark Circles" },
  { concern: "redness", score: 85, stars: 3, label: "Redness / Irritation" },
];

const strengths = [
  { concern: "acne", score: 98, stars: 5, label: "Acne & Blemishes" },
  { concern: "age_spot", score: 98, stars: 5, label: "Age Spots" },
  { concern: "tear_trough", score: 97, stars: 5, label: "Tear Trough Depth" },
];

const allConcerns: Array<{ type: string; uiScore: number; label: string }> = [
  { type: "wrinkle", uiScore: 98, label: "Fine Lines & Wrinkles" },
  { type: "pore", uiScore: 91, label: "Pore Visibility" },
  { type: "texture", uiScore: 86, label: "Skin Texture" },
  { type: "acne", uiScore: 96, label: "Acne & Blemishes" },
  { type: "oiliness", uiScore: 83, label: "Oiliness / Sebum" },
  { type: "radiance", uiScore: 83, label: "Radiance" },
  { type: "eye_bag", uiScore: 83, label: "Eye Bags" },
  { type: "age_spot", uiScore: 96, label: "Age Spots / Hyperpigmentation" },
  { type: "dark_circle_v2", uiScore: 77, label: "Dark Circles" },
  { type: "droopy_upper_eyelid", uiScore: 84, label: "Drooping Upper Eyelid" },
  { type: "droopy_lower_eyelid", uiScore: 71, label: "Drooping Lower Eyelid" },
  { type: "firmness", uiScore: 91, label: "Firmness" },
  { type: "moisture", uiScore: 67, label: "Moisture / Hydration" },
  { type: "redness", uiScore: 83, label: "Redness / Irritation" },
  { type: "tear_trough", uiScore: 96, label: "Tear Trough Depth" },
];

export function ScanResultsView({ scan, onAudit, onBack, skinProfile, onSkinProfileChange }: ScanResultsViewProps) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [maskOpacity, setMaskOpacity] = useState(0.7);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
  };

  return (
    <div className="min-h-screen bg-[var(--ca-studiomid)] relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-[200px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-skin-neutral) 0%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-[150px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-gold-warm) 0%, transparent 70%)" }} />
      </div>

      {/* Top Navigation */}
      <header className="relative z-20 w-full border-b border-[var(--ca-stone-border)] bg-[var(--ca-studiomid)]/80 backdrop-blur-xl">
        <div className="atelier-container flex h-16 items-center justify-between">
          <nav className="flex items-center gap-6" aria-label="Atelier stages">
            <span className="atelier-stage-indicator" data-stage="1">
              <span className="text-mono-lg">01</span> Skin Telemetry
            </span>
            <span className="atelier-stage-indicator active" data-stage="2">
              <span className="text-mono-lg">02</span> Bio-Shelf Audit
            </span>
            <span className="atelier-stage-indicator" data-stage="3">
              <span className="text-mono-lg">03</span> Formulation Ledger
            </span>
          </nav>

          <h1 className="text-h2 font-light tracking-tight" style={{ fontFamily: "var(--font-cormorant)" }}>
            ShelfWise Atelier
          </h1>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-[var(--ca-glass-bg)] border border-[var(--ca-glass-border)] rounded-full px-3 py-1.5 backdrop-blur-xl">
              <span className="text-body-sm text-[var(--ca-ink-subtle)]">₹ INR</span>
              <span className="text-body-sm font-medium text-[var(--ca-paper)]">/</span>
              <span className="text-body-sm text-[var(--ca-gold-warm)]">$ USD</span>
            </div>
            <button onClick={onBack} className="atelier-btn-ghost">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="atelier-container py-8">
          {/* Scan Summary Header */}
          <div className="mb-12 animate-slide-up stagger-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-subheading">YouCam V2.1 SD Analysis</span>
                <h1 className="text-h1 font-light mt-1">Dermal Telemetry Studio</h1>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-[var(--ca-ink-subtle)]">
                <span className="text-mono-lg">Overall</span>
                <span className="text-[var(--ca-gold-warm)] text-mono-lg font-bold">{scan.overallScore.toFixed(1)}/100</span>
                <span className="text-mono-lg">Age</span>
                <span className="text-[var(--ca-gold-warm)] text-mono-lg font-bold">{scan.skinAge}yrs</span>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="atelier-grid-12 gap-4">
              <div className="atelier-col-span-6 atelier-col-span-12 atelier-glass p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "var(--ca-gold-glow)" }}>
                    <BarChart3 className="h-7 w-7" style={{ color: "var(--ca-gold-warm)" }} />
                  </div>
                  <div>
                    <p className="text-h3 font-light text-[var(--ca-paper)]">{scan.overallScore.toFixed(1)}</p>
                    <p className="text-body-sm text-[var(--ca-ink-subtle)]">Overall Score / 100</p>
                  </div>
                </div>
              </div>
              <div className="atelier-col-span-6 atelier-col-span-12 atelier-glass p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(217,175,160,0.15)" }}>
                    <Sparkles className="h-7 w-7" style={{ color: "var(--ca-skin-warm)" }} />
                  </div>
                  <div>
                    <p className="text-h3 font-light text-[var(--ca-paper)]">{scan.skinAge}</p>
                    <p className="text-body-sm text-[var(--ca-ink-subtle)]">Skin Age (years)</p>
                  </div>
                </div>
              </div>
              <div className="atelier-col-span-6 atelier-col-span-12 atelier-glass p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(153,27,27,0.15)" }}>
                    <AlertTriangle className="h-7 w-7" style={{ color: "var(--ca-crimson)" }} />
                  </div>
                  <div>
                    <p className="text-h3 font-light text-[var(--ca-paper)]">{allConcerns.filter(c => c.uiScore < 65).length}</p>
                    <p className="text-body-sm text-[var(--ca-ink-subtle)]">Priority Concerns</p>
                  </div>
                </div>
              </div>
              <div className="atelier-col-span-6 atelier-col-span-12 atelier-glass p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(15,83,56,0.15)" }}>
                    <CheckCircle2 className="h-7 w-7" style={{ color: "var(--ca-success)" }} />
                  </div>
                  <div>
                    <p className="text-h3 font-light text-[var(--ca-paper)]">{allConcerns.filter(c => c.uiScore >= 85).length}</p>
                    <p className="text-body-sm text-[var(--ca-ink-subtle)]">Strongest Attributes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Dermal Layer Visualizer */}
          <div className="mb-12 animate-slide-up stagger-2">
            <DermalLayer3D
              scanData={{
                concerns: scan.concerns.map(c => ({
                  type: c.type,
                  uiScore: c.uiScore || 0,
                  maskUrls: c.maskUrls || [`/demo-scan/${c.type}.png`],
                })),
                overallScore: scan.overallScore,
              }}
              selfieUrl="https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&h=1067&fit=crop&crop=face"
            />
          </div>

          {/* 2D Precision View - Concern Grid */}
          <div className="mb-12 animate-slide-up stagger-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-subheading">16-Concern Precision Matrix</span>
                <h2 className="text-h2 font-light mt-1">Ranked by Clinical Urgency</h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-body-sm text-[var(--ca-ink-subtle)]">Mask Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(maskOpacity * 100)}
                  onChange={(e) => setMaskOpacity(parseInt(e.target.value) / 100)}
                  className="w-32 accent-[var(--ca-gold-warm)]"
                />
                <span className="text-mono text-[var(--ca-gold-warm)] w-10 text-right">{Math.round(maskOpacity * 100)}%</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {allConcerns.map((concern, index) => {
                const color = getConcernColor(concern.uiScore);
                const isPriority = concern.uiScore < 65;
                const isStrength = concern.uiScore >= 85;

                return (
                  <motion.div
                    key={concern.type}
                    className={`atelier-telemetry-card group relative cursor-pointer ${selectedConcern === concern.type ? "ring-2" : ""}`}
                    style={{
                      borderColor: selectedConcern === concern.type ? "var(--ca-gold-warm)" : "var(--ca-glass-border)",
                      boxShadow: selectedConcern === concern.type
                        ? "0 0 0 1px var(--ca-gold-warm), 0 8px 32px rgba(184, 149, 90, 0.15)"
                        : undefined,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.03, duration: 400 }}
                    onClick={() => setSelectedConcern(selectedConcern === concern.type ? null : concern.type)}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                        }}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 + index * 0.03, type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <span className="text-mono-lg font-bold">{concern.uiScore}</span>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-[var(--ca-paper)] truncate">{concern.label}</h4>
                          {isPriority && (
                            <motion.span
                              className="atelier-badge-crimson text-xs"
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                            >
                              Priority
                            </motion.span>
                          )}
                          {isStrength && !isPriority && (
                            <motion.span
                              className="atelier-badge-gold text-xs"
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                            >
                              Strength
                            </motion.span>
                          )}
                        </div>
                        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color, width: `${concern.uiScore}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${concern.uiScore}%` }}
                            transition={{ delay: 0.2 + index * 0.03, duration: 600, ease: [0.25, 0.46, 0.45, 0.94] }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expandable detail */}
                    <AnimatePresence>
                      {selectedConcern === concern.type && (
                        <motion.div
                          className="mt-4 pt-4 border-t border-[var(--ca-stone-border)] animate-slide-up"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <span className="text-body-xs text-[var(--ca-ink-faint)] uppercase tracking-wider">Raw Score</span>
                              <p className="text-mono-lg font-bold text-[var(--ca-gold-warm)]">{scan.concerns.find(c => c.type === concern.type)?.rawScore.toFixed(0) || "N/A"}</p>
                            </div>
                            <div>
                              <span className="text-body-xs text-[var(--ca-ink-faint)] uppercase tracking-wider">UI Score</span>
                              <p className="text-mono-lg font-bold text-[var(--ca-paper)]">{concern.uiScore}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-body-xs text-[var(--ca-ink-faint)] uppercase tracking-wider">Clinical Note</span>
                              <p className="text-body-sm text-[var(--ca-ink-muted)] mt-1">
                                {isPriority
                                  ? "Requires immediate barrier-supportive intervention. Avoid actives that compromise stratum corneum."
                                  : isStrength
                                  ? "Excellent baseline. Maintenance protocol sufficient."
                                  : "Moderate concern. Targeted actives recommended within 90-day window."}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Priority vs Strengths Panels */}
          <div className="mb-12 animate-slide-up stagger-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Priority Concerns */}
              <div className="atelier-glass-elevated p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(153,27,27,0.15)" }}>
                    <AlertTriangle className="h-5 w-5" style={{ color: "var(--ca-crimson)" }} />
                  </div>
                  <div>
                    <h3 className="text-h3 font-light">Priority Focus (3)</h3>
                    <p className="text-body-sm text-[var(--ca-ink-subtle)]">Scores under 65 — Immediate clinical attention</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {priorityConcerns.map((pc, i) => (
                    <motion.div
                      key={pc.concern}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "rgba(153,27,27,0.08)", border: "1px solid rgba(153,27,27,0.15)" }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-mono-lg font-bold text-[var(--ca-crimson)] w-8 text-right">{pc.score}</span>
                        <div>
                          <p className="font-medium text-[var(--ca-paper)]">{pc.label}</p>
                          <div className="flex items-center gap-1.5">
                            {[...Array(pc.stars)].map((_, si) => (
                              <motion.span key={si} className="h-4 w-4" style={{ color: "var(--ca-crimson)" }}>
                                <CheckCircle2 className="h-4 w-4" />
                              </motion.span>
                            ))}
                            {[...Array(5 - pc.stars)].map((_, si) => (
                              <span key={si} className="h-4 w-4 text-[var(--ca-ink-faint)]">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="atelier-badge-crimson text-xs">Address First</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Strongest Attributes */}
              <div className="atelier-glass-elevated p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(15,83,56,0.15)" }}>
                    <CheckCircle2 className="h-5 w-5" style={{ color: "var(--ca-success)" }} />
                  </div>
                  <div>
                    <h3 className="text-h3 font-light">Strongest Attributes (3)</h3>
                    <p className="text-body-sm text-[var(--ca-ink-subtle)]">Scores ≥ 85 — Maintenance protocol sufficient</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {strengths.map((s, i) => (
                    <motion.div
                      key={s.concern}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "rgba(15,83,56,0.08)", border: "1px solid rgba(15,83,56,0.15)" }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-mono-lg font-bold text-[var(--ca-success)] w-8 text-right">{s.score}</span>
                        <div>
                          <p className="font-medium text-[var(--ca-paper)]">{s.label}</p>
                          <div className="flex items-center gap-1.5">
                            {[...Array(s.stars)].map((_, si) => (
                              <span key={si} className="h-4 w-4" style={{ color: "var(--ca-success)" }}>
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="atelier-badge-gold text-xs">Maintain</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skin Type Selector */}
          <div className="mb-12 animate-slide-up stagger-5">
            <SkinTypeSelector
              value={skinProfile}
              onChange={onSkinProfileChange}
              youcamDetected={scan.skinType?.type ? (() => {
                const lower = scan.skinType?.type?.toLowerCase();
                if (lower?.includes("oily")) return "oily";
                if (lower?.includes("dry")) return "dry";
                if (lower?.includes("combination") || lower?.includes("mix")) return "combination";
                return "normal";
              })() : undefined}
            />
          </div>

          {/* CTA to Audit */}
          <div className="flex justify-center animate-slide-up stagger-6">
            <button
              onClick={onAudit}
              className="atelier-btn-primary w-full max-w-md"
            >
              <Search className="h-5 w-5" />
              Proceed to Bio-Shelf Audit
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
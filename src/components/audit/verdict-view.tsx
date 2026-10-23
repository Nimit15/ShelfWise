"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Sparkles, Shield, TrendingDown, ArrowUpRight, Download, RefreshCw } from "lucide-react";
import { ParsedScan } from "@/lib/mock-scan";

interface VerdictViewProps {
  engineResult: any;
  scan: ParsedScan;
  onRestart: () => void;
  onBack: () => void;
}

export function VerdictView({ engineResult, scan, onRestart, onBack }: VerdictViewProps) {
  const verdict = engineResult?.verdict;
  const isBuyNothing = verdict?.type === "buy_nothing";

  const keepProducts = engineResult?.finalRoutine?.AM?.concat(engineResult?.finalRoutine?.PM || []) || [];
  const pauseProducts = engineResult?.biometricConflicts?.map((c: any) => c.productName) || [];
  const addProducts = engineResult?.gapRecommendations?.map((r: any) => r.recommendedProduct).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-[var(--ca-studiomid)] relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15 blur-[200px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-skin-neutral) 0%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[150px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-gold-warm) 0%, transparent 70%)" }} />
        {isBuyNothing && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[200px]"
            style={{ background: "radial-gradient(ellipse at center, var(--ca-success) 0%, transparent 70%)" }} />
        )}
      </div>

      {/* Top Navigation */}
      <header className="relative z-20 w-full border-b border-[var(--ca-stone-border)] bg-[var(--ca-studiomid)]/80 backdrop-blur-xl">
        <div className="atelier-container flex h-16 items-center justify-between">
          <nav className="flex items-center gap-6" aria-label="Atelier stages">
            <span className="atelier-stage-indicator" data-stage="1">
              <span className="text-mono-lg">01</span> Skin Telemetry
            </span>
            <span className="atelier-stage-indicator" data-stage="2">
              <span className="text-mono-lg">02</span> Bio-Shelf Audit
            </span>
            <span className="atelier-stage-indicator active" data-stage="3">
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
          {/* Verdict Header */}
          <div className="mb-12 animate-slide-up stagger-1 text-center">
            <span className="text-subheading">Final Clinical Verdict</span>
            <motion.h1
              className="text-h1 font-light mt-2"
              style={{ fontFamily: "var(--font-cormorant)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 600, delay: 0.1 }}
            >
              {isBuyNothing ? "Buy Nothing" : "Targeted Addition"}
            </motion.h1>

            <motion.div
              className="mt-4 flex items-center justify-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isBuyNothing ? "bg-[var(--ca-success)]/20" : "bg-[var(--ca-gold-warm)]/20"}`}>
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: isBuyNothing ? "var(--ca-success)" : "var(--ca-gold-warm)",
                    color: "var(--ca-paper)",
                  }}
                  initial={{ rotate: -180, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
                >
                  {isBuyNothing ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              className="mt-6 text-h2 font-medium text-[var(--ca-gold-warm)]"
              style={{ fontFamily: "var(--font-fira-code)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              ₹{verdict?.totalCostInr || 0} Needed
            </motion.p>

            <motion.p
              className="mt-4 max-w-2xl mx-auto text-body text-[var(--ca-ink-muted)] leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {verdict?.message || (isBuyNothing
                ? "Your existing shelf already safely covers all priority concerns. No new products needed — your regimen is clinically sound and cost-optimal."
                : "Your shelf has gaps. The recommended additions address your highest-priority concerns. Review ingredient compatibility before purchasing.")}
            </motion.p>
          </div>

          {/* Cost Breakdown Ledger */}
          <div className="mb-12 animate-slide-up stagger-2">
            <div className="grid gap-4 md:grid-cols-3">
              <CostLedgerCard
                title="Current Shelf Value"
                inr={engineResult?.auditTrail?.productsAnalyzed ? engineResult.auditTrail.productsAnalyzed * 799 : 0}
                usd={engineResult?.auditTrail?.productsAnalyzed ? engineResult.auditTrail.productsAnalyzed * 10 : 0}
                note="Estimated retail per product"
                accent="var(--ca-ink-subtle)"
                icon={Sparkles}
              />
              <CostLedgerCard
                title="New Purchases"
                inr={verdict?.totalCostInr || 0}
                usd={verdict?.totalCostUsd || 0}
                note={isBuyNothing ? "Nothing to purchase" : "Recommended additions"}
                accent={isBuyNothing ? "var(--ca-success)" : "var(--ca-gold-warm)"}
                icon={isBuyNothing ? Shield : ArrowUpRight}
                highlight={isBuyNothing}
              />
              <CostLedgerCard
                title="Money Saved"
                inr={verdict?.moneySavedInr || 0}
                usd={verdict?.moneySavedUsd || 0}
                note="vs. generic 6-product routine"
                accent="var(--ca-success)"
                icon={TrendingDown}
                highlight
              />
            </div>
          </div>

          {/* Three-Column Verdict Ledger */}
          <div className="mb-12 animate-slide-up stagger-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-subheading">Formulation Ledger</span>
                <h2 className="text-h2 font-light mt-1">Keep · Pause · Add</h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* KEEP COLUMN */}
              <VerdictColumn
                title="Keep Using"
                subtitle={`${keepProducts.length} products`}
                icon={Shield}
                accent="var(--ca-success)"
                items={keepProducts.map((p: any) => ({
                  name: p.productName,
                  role: p.role.replace(/_/g, " "),
                  step: p.step,
                  cost: "₹0",
                }))}
                emptyMessage="All current products retained"
              />

              {/* PAUSE COLUMN */}
              <VerdictColumn
                title="Pause / Conflict Alert"
                subtitle={`${pauseProducts.length} products`}
                icon={AlertCircle}
                accent="var(--ca-warning)"
                items={engineResult?.biometricConflicts?.map((c: any) => ({
                  name: c.productName,
                  role: c.conflictType,
                  step: c.severity,
                  cost: "₹0",
                  reason: c.explanation,
                })) || []}
                emptyMessage="No conflicts detected — barrier intact"
              />

              {/* ADD COLUMN */}
              <VerdictColumn
                title={isBuyNothing ? "Minimal Addition" : "Buy Nothing Cart"}
                subtitle={`${addProducts.length} products`}
                icon={Sparkles}
                accent="var(--ca-gold-warm)"
                items={addProducts.map((p: any) => ({
                  name: p.name,
                  role: p.roles[0]?.replace(/_/g, " ") || "Active",
                  step: `₹${p.priceInr}`,
                  cost: `₹${p.priceInr}`,
                  reason: p.description,
                }))}
                emptyMessage={isBuyNothing ? "Your regimen is complete" : "No additions required"}
              />
            </div>
          </div>

          {/* Routine Schedule */}
          {engineResult?.finalRoutine && (
            <div className="mb-12 animate-slide-up stagger-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-subheading">Clinical Protocol</span>
                  <h2 className="text-h2 font-light mt-1">AM / PM Routine Schedule</h2>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <RoutineScheduleColumn
                  title="AM Protocol"
                  items={engineResult.finalRoutine.AM}
                  accent="var(--ca-gold-warm)"
                  icon={Sparkles}
                />
                <RoutineScheduleColumn
                  title="PM Protocol"
                  items={engineResult.finalRoutine.PM}
                  accent="var(--ca-skin-neutral)"
                  icon={Shield}
                />
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div className="mb-12 animate-slide-up stagger-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-subheading">Audit Trail</span>
                <h2 className="text-h2 font-light mt-1">Quantified Analysis</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <AuditTrailCard
                title="Products Analyzed"
                value={String(engineResult?.auditTrail?.productsAnalyzed || 0)}
                icon={Sparkles}
                accent="var(--ca-ink-subtle)"
              />
              <AuditTrailCard
                title="Biometric Conflicts"
                value={String(engineResult?.auditTrail?.conflictsFound || 0)}
                icon={AlertCircle}
                accent="var(--ca-crimson)"
              />
              <AuditTrailCard
                title="Chemical Conflicts"
                value={String((engineResult?.chemicalConflicts?.length || 0))}
                icon={Shield}
                accent="var(--ca-warning)"
              />
              <AuditTrailCard
                title="Redundancies"
                value={String(engineResult?.auditTrail?.redundanciesFound || 0)}
                icon={RefreshCw}
                accent="var(--ca-gold-warm)"
              />
              <AuditTrailCard
                title="Gaps Addressed"
                value={String(engineResult?.auditTrail?.gapsIdentified || 0)}
                icon={ArrowUpRight}
                accent="var(--ca-success)"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center gap-4 animate-slide-up stagger-6">
            <button
              onClick={onRestart}
              className="atelier-btn-secondary w-full max-w-xs"
            >
              <RefreshCw className="h-4 w-4" />
              New Analysis
            </button>
            <button
              onClick={onRestart}
              className="atelier-btn-primary w-full max-w-xs"
            >
              <Download className="h-4 w-4" />
              Export Ledger
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function CostLedgerCard({
  title,
  inr,
  usd,
  note,
  accent,
  icon: Icon,
  highlight = false,
}: {
  title: string;
  inr: number;
  usd: number;
  note: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <motion.div
      className={`atelier-glass-elevated p-6 ${highlight ? "ring-2" : ""}`}
      style={{
        borderColor: highlight ? accent : "var(--ca-glass-border)",
        boxShadow: highlight
          ? `0 0 0 1px ${accent}, 0 12px 48px ${accent}33`
          : undefined,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 500 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-body-sm text-[var(--ca-ink-subtle)]">{title}</h3>
      </div>
      <div className="mb-2">
        <span className="text-h1 font-bold text-[var(--ca-paper)]" style={{ fontFamily: "var(--font-fira-code)" }}>₹{inr.toLocaleString()}</span>
        <span className="ml-3 text-body text-[var(--ca-ink-subtle)]">/</span>
        <span className="ml-3 text-h1 font-bold text-[var(--ca-gold-warm)]" style={{ fontFamily: "var(--font-fira-code)" }}>${usd.toLocaleString()}</span>
      </div>
      <p className="text-body-xs text-[var(--ca-ink-faint)]">{note}</p>
    </motion.div>
  );
}

function VerdictColumn({
  title,
  subtitle,
  icon: Icon,
  accent,
  items,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  items: Array<{ name: string; role: string; step: string | number; cost: string; reason?: string }>;
  emptyMessage: string;
}) {
  return (
    <div className="atelier-verdict-column">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-h3 font-light text-[var(--ca-paper)]">{title}</h3>
          <p className="text-body-sm text-[var(--ca-ink-subtle)]">{subtitle}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--ca-glass-border)" }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--ca-paper)] truncate">{item.name}</p>
                  <p className="text-body-xs text-[var(--ca-ink-subtle)] mt-0.5">{item.role}</p>
                  {item.reason && (
                    <p className="text-body-xs text-[var(--ca-ink-faint)] mt-1 line-clamp-2">{item.reason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-mono text-[var(--ca-gold-warm)]">{item.cost}</span>
                  <span className="text-body-xs text-[var(--ca-ink-faint)]">{item.step}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Icon className="mx-auto mb-3 h-8 w-8" />
          <p className="text-body text-[var(--ca-ink-subtle)]">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

function RoutineScheduleColumn({ title, items, accent, icon: Icon }: { title: string; items: any[]; accent: string; icon: React.ComponentType<{ className?: string }> }) {
  if (!items?.length) return null;

  return (
    <div className="atelier-glass-elevated p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-h3 font-light">{title}</h3>
      </div>
      <ol className="space-y-3">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--ca-glass-border)" }}>
            <span
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-mono"
              style={{ background: accent, color: "var(--ca-ink)" }}
            >
              {item.step}
            </span>
            <span className="text-body text-[var(--ca-paper)]">{item.productName}</span>
            <span className="ml-auto text-body-xs text-[var(--ca-ink-faint)] uppercase tracking-wider">{item.role.replace(/_/g, " ")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AuditTrailCard({ title, value, icon: Icon, accent }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="atelier-glass p-5 text-center">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${accent}20` }}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-h2 font-bold text-[var(--ca-paper)]" style={{ fontFamily: "var(--font-fira-code)" }}>
        {value}
      </p>
      <p className="text-body-xs text-[var(--ca-ink-faint)] mt-1">{title}</p>
    </div>
  );
}
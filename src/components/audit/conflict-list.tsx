"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Shield, DollarSign, ChevronDown, ChevronUp, FileText, Zap, FlaskConical, Sparkles } from "lucide-react";
import { BiometricConflict, ChemicalConflict, RedundancyAlert } from "@/types/engine";

interface ConflictListProps {
  biometricConflicts: BiometricConflict[];
  chemicalConflicts: ChemicalConflict[];
  redundancyAlerts: RedundancyAlert[];
}

export function ConflictList({
  biometricConflicts,
  chemicalConflicts,
  redundancyAlerts,
}: ConflictListProps) {
  const hasConflicts = (biometricConflicts?.length || 0) + (chemicalConflicts?.length || 0) > 0;

  if (!hasConflicts && (redundancyAlerts?.length || 0) === 0) {
    return (
      <motion.div
        className="atelier-glass p-6 text-center"
        style={{ borderColor: "rgba(15,83,56,0.3)", background: "rgba(15,83,56,0.05)" }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(15,83,56,0.15)" }}>
          <Shield className="h-8 w-8" style={{ color: "var(--ca-success)" }} />
        </div>
        <p className="font-medium text-[var(--ca-paper)] mb-1">No Conflicts Detected</p>
        <p className="text-body-sm text-[var(--ca-ink-subtle)]">
          All products are safe to use together with your current skin profile.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 400 }}
    >
      {/* Biometric Conflicts */}
      {(biometricConflicts?.length || 0) > 0 && (
        <ConflictSection
          title="Biometric Conflicts"
          subtitle="Scan-to-Shelf Incompatibility"
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="var(--ca-crimson)"
          glow="rgba(153,27,27,0.15)"
          border="rgba(153,27,27,0.3)"
          count={biometricConflicts.length}
          items={biometricConflicts.map((conflict, i) => ({
            key: `bio-${i}`,
            title: `${conflict.productName} — ${conflict.concern.replace(/_/g, " ")}`,
            description: conflict.explanation,
            severity: conflict.severity,
            resolution: conflict.recommendation === "pause" ? "Pause for 14 days" : "Reduce frequency",
            meta: {
              "Concern Score": `${conflict.concernScore}/100`,
              "Conflict Type": conflict.conflictType,
              "Days to Pause": String(conflict.daysToPause),
            },
          }))}
        />
      )}

      {/* Chemical Conflicts */}
      {(chemicalConflicts?.length || 0) > 0 && (
        <ConflictSection
          title="Chemical Conflicts"
          subtitle="Shelf-to-Shelf Incompatibility"
          icon={<FlaskConical className="h-5 w-5" />}
          accent="var(--ca-warning)"
          glow="rgba(180,83,9,0.15)"
          border="rgba(180,83,9,0.3)"
          count={chemicalConflicts.length}
          items={chemicalConflicts.map((conflict, i) => ({
            key: `chem-${i}`,
            title: `${conflict.productNameA} + ${conflict.productNameB}`,
            description: conflict.explanation,
            severity: conflict.conflictType === "same_slot_incompatible" ? "high" : "medium",
            resolution: conflict.resolution === "separate_am_pm" ? "Separate AM/PM" : conflict.resolution === "alternate_days" ? "Alternate days" : "Pause one product",
            meta: {
              "Ingredients": conflict.ingredients.join(", "),
              "Type": conflict.conflictType.replace(/_/g, " "),
              "Affected Slot": conflict.affectedSlot,
            },
          }))}
        />
      )}

      {/* Redundancy Alerts */}
      {(redundancyAlerts?.length || 0) > 0 && (
        <ConflictSection
          title="Redundancy Alerts"
          subtitle="Duplicate Functional Roles"
          icon={<Sparkles className="h-5 w-5" />}
          accent="var(--ca-gold-warm)"
          glow="rgba(184,149,90,0.15)"
          border="rgba(184,149,90,0.3)"
          count={redundancyAlerts.length}
          items={redundancyAlerts.map((alert, i) => ({
            key: `redun-${i}`,
            title: `Duplicate ${alert.role.replace(/_/g, " ")} (${alert.products.length} products)`,
            description: `Keep: ${alert.keptProductId}. Remove: ${alert.removedProductIds.join(", ")}. Save ₹${alert.redundantValueInr} / $${alert.redundantValueUsd}.`,
            severity: "low",
            resolution: alert.recommendation === "keep_best" ? "Keep best, remove duplicate" : "Consolidate to single product",
            meta: {
              "Redundant Value": `₹${alert.redundantValueInr} / $${alert.redundantValueUsd}`,
              "Products": String(alert.products.length),
              "Recommendation": alert.recommendation.replace(/_/g, " "),
            },
          }))}
        />
      )}
    </motion.div>
  );
}

function ConflictSection({
  title,
  subtitle,
  icon,
  accent,
  glow,
  border,
  count,
  items,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  glow: string;
  border: string;
  count: number;
  items: Array<{
    key: string;
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    resolution: string;
    meta: Record<string, string>;
  }>;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      className="atelier-glass-elevated overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 400 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between"
        style={{ background: glow, borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
            {icon}
          </div>
          <div>
            <h3 className="text-h3 font-light text-[var(--ca-paper)]">{title}</h3>
            <p className="text-body-sm text-[var(--ca-ink-subtle)]">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="atelier-badge" style={{ background: `${accent}20`, color: accent, borderColor: `${accent}40` }}>
            {count} detected
          </span>
          <motion.div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ca-ink-subtle)]"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ca-glass-border)" }}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="p-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 300 }}
          >
            <div className="space-y-3">
              {items.map((item, index) => (
                <ConflictItem
                  key={item.key}
                  item={item}
                  accent={accent}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ConflictItem({
  item,
  accent,
  index,
}: {
  item: {
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    resolution: string;
    meta: Record<string, string>;
  };
  accent: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    high: { bg: "rgba(153,27,27,0.1)", border: "rgba(153,27,27,0.3)", icon: <AlertTriangle className="h-4 w-4" />, label: "HIGH" },
    medium: { bg: "rgba(180,83,9,0.1)", border: "rgba(180,83,9,0.3)", icon: <Zap className="h-4 w-4" />, label: "MEDIUM" },
    low: { bg: "rgba(184,149,90,0.1)", border: "rgba(184,149,90,0.3)", icon: <Sparkles className="h-4 w-4" />, label: "LOW" },
  };

  const config = severityConfig[item.severity];

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}20`, color: accent }}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-medium text-[var(--ca-paper)] truncate">{item.title}</h4>
            <span className="text-body-xs font-medium uppercase px-2.5 py-1 rounded-full" style={{ background: accent, color: "var(--ca-ink)" }}>
              {config.label}
            </span>
          </div>
          <p className="mt-1.5 text-body-sm text-[var(--ca-ink-muted)] line-clamp-2">{item.description}</p>
          {!expanded && (
            <p className="mt-2 text-body-xs text-[var(--ca-gold-warm)] flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Click to expand →
            </p>
          )}
        </div>
        <motion.div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ca-ink-subtle)] flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ca-glass-border)" }}
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="px-4 pb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="border-t pt-4" style={{ borderColor: config.border }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}20`, color: accent }}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-body-sm font-medium text-[var(--ca-paper)]">Recommended Action</span>
              </div>
              <p className="text-body-sm text-[var(--ca-ink-muted)] mb-4">{item.resolution}</p>

              {Object.keys(item.meta).length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(item.meta).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--ca-glass-border)" }}>
                      <p className="text-body-xs uppercase tracking-wider text-[var(--ca-ink-faint)]">{key}</p>
                      <p className="text-body-sm font-medium text-[var(--ca-paper)] mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
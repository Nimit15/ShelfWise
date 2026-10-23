"use client";

import { Trash2, Plus, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ShelfProduct } from "@/types/engine";
import { Product } from "@/data/catalog";
import { FunctionalRole } from "@/data/catalog";
import { getConcernColor } from "@/lib/mock-scan";

interface ProductCardProps {
  product: ShelfProduct;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
  onSelect?: () => void;
  showRemove?: boolean;
  showAdd?: boolean;
}

const ROLE_LABELS: Record<FunctionalRole, string> = {
  sunscreen_spf: "Sunscreen",
  cleanser: "Cleanser",
  hydrator: "Hydrator",
  barrier_repair: "Barrier Repair",
  retinoid: "Retinoid",
  antioxidant_vit_c: "Antioxidant (Vitamin C)",
  niacinamide_pore: "Niacinamide / Pore Refining",
  azelaic_treatment: "Azelaic Treatment",
  exfoliant_aha_bha: "Exfoliant (AHA/BHA)",
  eye_treatment: "Eye Treatment",
};

const ROLE_ICONS: Record<FunctionalRole, React.ReactNode> = {
  sunscreen_spf: <Shield className="h-4 w-4" />,
  cleanser: <Droplet className="h-4 w-4" />,
  hydrator: <FlaskConical className="h-4 w-4" />,
  barrier_repair: <Shield className="h-4 w-4" />,
  retinoid: <Sparkles className="h-4 w-4" />,
  antioxidant_vit_c: <FlaskConical className="h-4 w-4" />,
  niacinamide_pore: <TestTube2 className="h-4 w-4" />,
  azelaic_treatment: <FlaskConical className="h-4 w-4" />,
  exfoliant_aha_bha: <Zap className="h-4 w-4" />,
  eye_treatment: <Eye className="h-4 w-4" />,
};

import { Shield, Droplet, FlaskConical, Sparkles, TestTube2, Zap, Eye } from "lucide-react";

export function ProductCard({
  product,
  onRemove,
  onAdd,
  onSelect,
  showRemove = false,
  showAdd = false,
}: ProductCardProps) {
  const isHighIrritancy = product.irritancyScore >= 5;
  const roleLabel = ROLE_LABELS[product.roles[0]] || product.roles[0];
  const roleIcon = ROLE_ICONS[product.roles[0]] || <FlaskConical className="h-4 w-4" />;
  const usageLabel = product.usageTime === "BOTH" ? "AM + PM" : product.usageTime;

  const costPerDayInr = (product.priceInr / product.daysSupply).toFixed(2);
  const costPerDayUsd = (product.priceUsd / product.daysSupply).toFixed(2);

  // Skin type compatibility
  const compatible = product.suitableSkinTypes;
  const incompatible = product.incompatibleSkinTypes;

  return (
    <div
      className="group relative h-full flex flex-col"
      onClick={onSelect}
      style={{ cursor: onSelect ? "pointer" : "default" }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--ca-paper)] truncate">{product.name}</h3>
          <p className="text-body-sm text-[var(--ca-ink-subtle)] mt-0.5">{product.brand}</p>
        </div>
        <div className="flex items-center gap-1.5 ml-3">
          {showRemove && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(product.id);
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ca-ink-faint)] opacity-0 transition-all hover:bg-[var(--ca-crimson-glow)] hover:text-[var(--ca-crimson)] group-hover:opacity-100"
              aria-label="Remove from shelf"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {showAdd && onAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ca-ink-faint)] opacity-0 transition-all hover:bg-[var(--ca-success)]/20 hover:text-[var(--ca-success)] group-hover:opacity-100"
              aria-label="Add to shelf"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Price + Usage + Role */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-mono font-medium text-[var(--ca-gold-warm)]">
            ₹{product.priceInr} / ${product.priceUsd}
          </span>
          <span className="text-body-xs text-[var(--ca-ink-faint)]">·</span>
          <span className="text-body-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ca-glass-border)", color: "var(--ca-ink-subtle)" }}>
            {usageLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--ca-gold-glow)", border: "1px solid rgba(184,149,90,0.3)" }}>
            {roleIcon}
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-4">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium"
          style={{
            backgroundColor: `${getConcernColor(product.irritancyScore * 10)}20`,
            color: getConcernColor(product.irritancyScore * 10),
            border: `1px solid ${getConcernColor(product.irritancyScore * 10)}33`,
          }}
        >
          {roleLabel}
        </span>
        {isHighIrritancy && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs"
            style={{ background: "rgba(153,27,27,0.15)", color: "var(--ca-crimson)", border: "1px solid rgba(153,27,27,0.3)" }}
          >
            <AlertTriangle className="h-3 w-3" />
            High Irritancy
          </span>
        )}
        {!product.safeForSensitive && !isHighIrritancy && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs"
            style={{ background: "rgba(180,83,9,0.15)", color: "var(--ca-warning)", border: "1px solid rgba(180,83,9,0.3)" }}
          >
            <Info className="h-3 w-3" />
            Not for Sensitive
          </span>
        )}
      </div>

      {/* Active Ingredients */}
      <div className="mb-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-body-xs uppercase tracking-wider text-[var(--ca-ink-faint)]">Active Ingredients</p>
          <span className="text-body-xs text-[var(--ca-gold-warm)]">{product.activeIngredients.length} actives</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {product.activeIngredients.slice(0, 4).map((ai) => (
            <span
              key={ai.name}
              className="text-body-xs px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--ca-glass-border)",
                color: "var(--ca-ink-muted)",
              }}
            >
              {ai.name} {ai.concentration && <span className="text-[var(--ca-ink-faint)]">@ {ai.concentration}</span>}
            </span>
          ))}
          {product.activeIngredients.length > 4 && (
            <span className="text-body-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--ca-glass-border)", color: "var(--ca-ink-faint)" }}>
              +{product.activeIngredients.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Clinical Metrics */}
      <div className="border-t border-[var(--ca-stone-border)] pt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricBadge
            label="Days Supply"
            value={String(product.daysSupply)}
            icon={<Calendar className="h-3 w-3" />}
          />
          <MetricBadge
            label="Cost / Day"
            value={`₹${costPerDayInr} / $${costPerDayUsd}`}
            icon={<Coins className="h-3 w-3" />}
          />
          <MetricBadge
            label="Irritancy"
            value={`${product.irritancyScore}/10`}
            icon={isHighIrritancy ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            accent={isHighIrritancy ? "var(--ca-crimson)" : "var(--ca-success)"}
          />
          <MetricBadge
            label="Vehicle"
            value={product.textureVehicle.replace(/_/g, " ")}
            icon={<FlaskConical className="h-3 w-3" />}
          />
        </div>

        {/* Skin Type Compatibility */}
        <div className="pt-2">
          <p className="text-body-xs uppercase tracking-wider text-[var(--ca-ink-faint)] mb-2">Skin Type Compatibility</p>
          <div className="flex flex-wrap gap-1.5">
            {["oily", "dry", "combination", "normal"].map((type) => {
              const isCompatible = compatible.includes(type as any);
              const isIncompatible = incompatible.includes(type as any);
              return (
                <span
                  key={type}
                  className="text-body-xs px-2.5 py-1 rounded-full capitalize"
                  style={{
                    background: isCompatible
                      ? "rgba(15,83,56,0.2)"
                      : isIncompatible
                      ? "rgba(153,27,27,0.15)"
                      : "rgba(255,255,255,0.05)",
                    border: isCompatible
                      ? "1px solid rgba(15,83,56,0.4)"
                      : isIncompatible
                      ? "1px solid rgba(153,27,27,0.3)"
                      : "1px solid var(--ca-glass-border)",
                    color: isCompatible
                      ? "var(--ca-success)"
                      : isIncompatible
                      ? "var(--ca-crimson)"
                      : "var(--ca-ink-faint)",
                  }}
                >
                  {type} {isCompatible && <CheckCircle2 className="h-3 w-3 ml-1" />}{isIncompatible && <X className="h-3 w-3 ml-1" />}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBadge({ label, value, icon, accent = "var(--ca-gold-warm)" }: { label: string; value: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--ca-glass-border)" }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}20`, color: accent }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-xs text-[var(--ca-ink-faint)]">{label}</p>
        <p className="text-body-sm font-medium text-[var(--ca-paper)] truncate">{value}</p>
      </div>
    </div>
  );
}

import { Calendar, Coins, X } from "lucide-react";
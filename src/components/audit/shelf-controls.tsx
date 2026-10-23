"use client";

import { ShelfProduct } from "@/types/engine";
import { CurrencyToggle } from "@/components/ui/currency-toggle";
import { BarChart3, Settings, Sparkles, Sliders } from "lucide-react";

interface ShelfControlsProps {
  shelf: ShelfProduct[];
  constraints: any;
  setConstraints: (c: any) => void;
  onClearShelf: () => void;
}

export function ShelfControls({
  shelf,
  constraints,
  setConstraints,
  onClearShelf,
}: ShelfControlsProps) {
  const totalValueInr = shelf.reduce((sum, p) => sum + p.priceInr, 0);
  const totalValueUsd = shelf.reduce((sum, p) => sum + p.priceUsd, 0);

  return (
    <div className="atelier-glass-elevated p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Shelf Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--ca-gold-glow)" }}>
              <BarChart3 className="h-6 w-6" style={{ color: "var(--ca-gold-warm)" }} />
            </div>
            <div>
              <p className="text-h3 font-light text-[var(--ca-paper)]">
                ₹{totalValueInr.toLocaleString()} <span className="text-body text-[var(--ca-ink-subtle)]">/ ${totalValueUsd.toLocaleString()}</span>
              </p>
              <p className="text-body-sm text-[var(--ca-ink-subtle)]">
                {shelf.length} product{shelf.length !== 1 ? "s" : ""} · {constraints.routinePreference} routine
              </p>
            </div>
          </div>

          {/* Budget Slider */}
          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="text-body-xs uppercase tracking-wider text-[var(--ca-ink-faint)] block mb-1.5">
                Budget: {constraints.currency === "INR" ? `₹${constraints.budgetInr.toLocaleString()}` : `$${constraints.budgetUsd.toLocaleString()}`}
              </label>
              <input
                type="range"
                min={constraints.currency === "INR" ? 500 : 10}
                max={constraints.currency === "INR" ? 20000 : 300}
                step={constraints.currency === "INR" ? 500 : 5}
                value={constraints.currency === "INR" ? constraints.budgetInr : constraints.budgetUsd}
                onChange={(e) =>
                  setConstraints({
                    ...constraints,
                    ...(constraints.currency === "INR"
                      ? { budgetInr: parseInt(e.target.value) }
                      : { budgetUsd: parseInt(e.target.value) }),
                  })
                }
                className="w-full accent-[var(--ca-gold-warm)] h-2"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Toggle */}
          <CurrencyToggle
            currency={constraints.currency}
            onChange={(c) => setConstraints({ ...constraints, currency: c })}
          />

          {/* Routine Preference */}
          <div className="flex items-center gap-2">
            <span className="text-body-xs uppercase tracking-wider text-[var(--ca-ink-faint)] hidden sm:block">Routine:</span>
            <div className="flex items-center gap-1 rounded-full bg-[var(--ca-glass-bg)] border border-[var(--ca-glass-border)] p-1 backdrop-blur-xl">
              <button
                onClick={() => setConstraints({ ...constraints, routinePreference: "minimalist" })}
                className={`rounded-full px-4 py-1.5 text-body-sm font-medium transition-all ${
                  constraints.routinePreference === "minimalist"
                    ? "bg-[var(--ca-gold-warm)] text-[var(--ca-ink)] shadow-lg"
                    : "text-[var(--ca-ink-subtle)] hover:text-[var(--ca-paper)] hover:bg-[var(--ca-glass-bg)]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Minimalist
              </button>
              <button
                onClick={() => setConstraints({ ...constraints, routinePreference: "targeted" })}
                className={`rounded-full px-4 py-1.5 text-body-sm font-medium transition-all ${
                  constraints.routinePreference === "targeted"
                    ? "bg-[var(--ca-gold-warm)] text-[var(--ca-ink)] shadow-lg"
                    : "text-[var(--ca-ink-subtle)] hover:text-[var(--ca-paper)] hover:bg-[var(--ca-glass-bg)]"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Targeted
              </button>
            </div>
          </div>

          {/* Clear Shelf */}
          <button
            onClick={onClearShelf}
            className="atelier-btn-ghost text-[var(--ca-crimson)] hover:bg-[var(--ca-crimson-glow)] px-4 py-1.5"
            disabled={shelf.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Shelf
          </button>
        </div>
      </div>
    </div>
  );
}

import { Trash2 } from "lucide-react";
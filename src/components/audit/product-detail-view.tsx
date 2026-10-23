"use client";

import { ChevronLeft, ShoppingCart, Trash2, Package } from "lucide-react";
import { ShelfProduct } from "@/types/engine";
import { getProductById } from "@/data/catalog";

interface ProductDetailViewProps {
  productId: string;
  shelf: ShelfProduct[];
  onShelfChange: (shelf: ShelfProduct[]) => void;
  onBack: () => void;
  onVerdict: () => void;
}

export function ProductDetailView({
  productId,
  shelf,
  onShelfChange,
  onBack,
  onVerdict,
}: ProductDetailViewProps) {
  const product = getProductById(productId);
  const onShelf = shelf.some((p) => p.id === productId);

  if (!product) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-[var(--ca-text-muted)]" />
        <p className="text-[var(--ca-text-secondary)]">Product not found.</p>
      </div>
    );
  }

  const handleToggleShelf = () => {
    if (onShelf) {
      onShelfChange(shelf.filter((p) => p.id !== productId));
    } else {
      onShelfChange([...shelf, { ...product }]);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="apothecary-title">{product.name}</h1>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--ca-text-secondary)] hover:text-[var(--ca-text-primary)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Audit
        </button>
      </div>

      {/* Product Detail Card */}
      <div className="mb-8 rounded-lg border border-[var(--ca-border)] bg-[var(--ca-cream)] p-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left: Product Info */}
          <div>
            <div className="mb-4">
              <h2 className="apothecary-heading text-[var(--ca-amber)]">{product.brand}</h2>
              <p className="text-sm text-[var(--ca-text-muted)]">{product.description}</p>
            </div>

            <div className="mb-4 flex items-center gap-4">
              <div>
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-fira)" }}>
                  ₹{product.priceInr}
                </span>
                <span className="text-sm text-[var(--ca-text-muted)]"> / ${product.priceUsd}</span>
              </div>
              <div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium`}
                  style={{
                    backgroundColor: `${getIrritancyColor(product.irritancyScore)}20`,
                    color: getIrritancyColor(product.irritancyScore),
                  }}
                >
                  Irritancy: {product.irritancyScore}/10
                </span>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-xs font-medium text-[var(--ca-text-secondary)] uppercase">
                Usage: {product.usageTime === "BOTH" ? "Morning & Night" : product.usageTime === "AM" ? "Morning Only" : "Night Only"}
              </span>
            </div>

            <button
              onClick={handleToggleShelf}
              className={`flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-all ${
                onShelf
                  ? "border border-[var(--ca-accent-red)] bg-[var(--ca-accent-red)]/10 text-[var(--ca-accent-red)] hover:bg-[var(--ca-accent-red)]/20"
                  : "bg-[var(--ca-amber)] text-[var(--ca-slate)] hover:bg-[var(--ca-amber-deep)]"
              }}`}
            >
              {onShelf ? <Trash2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {onShelf ? "Remove from Shelf" : "Add to Shelf"}
            </button>
          </div>

          {/* Right: Ingredients + INCI */}
          <div>
            <h3 className="apothecary-heading mb-3">Active Ingredients</h3>
            <div className="space-y-2">
              {product.activeIngredients.map((ai) => (
                <div
                  key={ai.name}
                  className="flex justify-between rounded border border-[var(--ca-border)] bg-[var(--ca-slate-light)]/10 px-3 py-2"
                >
                  <span className="font-medium">{ai.name}</span>
                  <span className="text-sm text-[var(--ca-text-secondary)]">
                    {ai.concentration}
                    {ai.pH && ` · pH ${ai.pH}`}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="apothecary-heading mt-6 mb-3">INCI List</h3>
            <p
              className="text-xs text-[var(--ca-text-secondary)] monospace-display break-words rounded border border-[var(--ca-border)] bg-[var(--ca-slate-light)]/10 p-3"
            >
              {product.inciList}
            </p>
          </div>
        </div>
      </div>


      {/* CTA */}
      <div className="flex justify-center">
        <button
          onClick={onVerdict}
          className="rounded-full bg-[var(--ca-slate)] px-8 py-3 text-[var(--ca-amber)] font-medium transition-all hover:bg-[var(--ca-slate-light)] hover:shadow-lg"
        >
          See Final Verdict →
        </button>
      </div>
    </div>
  );
}

function getIrritancyColor(score: number): string {
  if (score >= 7) return "var(--ca-accent-red)";
  if (score >= 4) return "var(--ca-warning)";
  if (score >= 2) return "var(--ca-amber)";
  return "var(--ca-success)";
}

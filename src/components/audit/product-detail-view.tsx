"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Package,
  Tag,
  DollarSign,
  Calendar,
  MapPin,
  Check,
  X,
  Info,
  ExternalLink,
  BarChart3,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { ShelfProduct } from "@/types/engine";
import { FunctionalRole, TextureVehicle, getProductById } from "@/data/catalog";

export interface ProductDetailViewProps {
  productId: string;
  shelf: ShelfProduct[];
  onShelfChange: (shelf: ShelfProduct[]) => void;
  onBack: () => void;
  onVerdict: () => void;
}

function roleLabel(role: FunctionalRole): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function vehicleLabel(vehicle: TextureVehicle): string {
  const labels: Record<TextureVehicle, string> = {
    gel: "Gel",
    light_fluid: "Light Fluid",
    lotion: "Lotion",
    rich_cream: "Rich Cream",
    balm_oil: "Balm/Oil",
    foam_cleanser: "Foam Cleanser",
    cream_cleanser: "Cream Cleanser",
    cream: "Cream",
  };
  return labels[vehicle] || vehicle;
}

function irritancyColor(score: number): string {
  if (score <= 2) return "text-[#34D399]";
  if (score <= 5) return "text-[#E5C185]";
  return "text-[#F87171]";
}

function irritancyLabel(score: number): string {
  if (score <= 1) return "Minimal";
  if (score <= 3) return "Low";
  if (score <= 5) return "Moderate";
  return "High";
}

export function ProductDetailView({
  productId,
  shelf,
  onShelfChange,
  onBack,
  onVerdict,
}: ProductDetailViewProps) {
  const product = shelf.find((p) => p.id === productId);
  const catalogProduct = product || getProductById(productId);

  if (!catalogProduct) {
    return (
      <div className="min-h-screen bg-[#161310]">
        <div className="atelier-studio-backdrop" />
        <div className="relative mx-auto max-w-6xl px-4 py-8">
          <p className="font-serif-editorial text-center text-lg text-[#F7F4EF]">
            Product not found.
          </p>
        </div>
      </div>
    );
  }

  const isOnShelf = !!product;
  const daysSupply = catalogProduct.daysSupply;
  const costPerDayInr = catalogProduct.priceInr / daysSupply;
  const costPerDayUsd = catalogProduct.priceUsd / daysSupply;
  const costPerMonthInr = costPerDayInr * 30;
  const costPerMonthUsd = costPerDayUsd * 30;

  const handleRemoveFromShelf = () => {
    if (!product) return;
    const newShelf = shelf.filter((p) => p.id !== product.id);
    onShelfChange(newShelf);
  };

  const handleAddToShelf = () => {
    if (!product) {
      const newProduct: ShelfProduct = {
        ...catalogProduct,
        quantity: 1,
      };
      onShelfChange([...shelf, newProduct]);
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const newQuantity = Math.max(1, (product.quantity || 1) + delta);
    const updated = { ...product, quantity: newQuantity };
    onShelfChange(
      shelf.map((p) => (p.id === product.id ? updated : p))
    );
  };

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
              onClick={onBack}
              className="flex items-center gap-2 text-[#C4BDB3] hover:text-[#F7F4EF]"
            >
              <span className="font-mono-tech text-xs">Shelf</span>
            </button>
          </div>

          {isOnShelf && (
            <button
              type="button"
              onClick={handleRemoveFromShelf}
              className="flex items-center gap-2 rounded-full border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-2 font-mono-tech text-xs text-[#F87171] hover:bg-[#F87171]/20"
            >
              <X className="h-3.5 w-3.5" />
              Remove from Shelf
            </button>
          )}
        </motion.div>

        {/* Product Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <TiltCard className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex-shrink-0">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.035]">
                  <Package className="h-12 w-12 text-[#E5C185]" />
                </div>
              </div>

              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#8A8177]">
                    {catalogProduct.brand}
                  </span>
                  {isOnShelf && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 font-mono-tech text-[10px] text-[#34D399]">
                      <Check className="h-3 w-3" />
                      On Shelf
                    </span>
                  )}
                  {!catalogProduct.safeForSensitive && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#F87171]/30 bg-[#F87171]/10 px-2 py-0.5 font-mono-tech text-[10px] text-[#F87171]">
                      <Shield className="h-3 w-3" />
                      Not Sensitive-Safe
                    </span>
                  )}
                </div>

                <h1 className="font-serif-editorial mb-2 text-2xl text-[#F7F4EF]">
                  {catalogProduct.name}
                </h1>

                <p className="mb-4 text-sm text-[#C4BDB3]">
                  {catalogProduct.description}
                </p>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {catalogProduct.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono-tech text-xs text-[#8A8177]"
                    >
                      {roleLabel(role)}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                      Price
                    </span>
                    <div className="font-serif-editorial text-xl text-[#F7F4EF]">
                      ₹{catalogProduct.priceInr} / ${catalogProduct.priceUsd}
                    </div>
                  </div>
                  <div>
                    <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                      Days Supply
                    </span>
                    <div className="font-serif-editorial text-xl text-[#F7F4EF]">
                      {catalogProduct.daysSupply}
                    </div>
                  </div>
                  <div>
                    <span className="font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#8A8177]">
                      Cost/Day
                    </span>
                    <div className="font-serif-editorial text-xl text-[#E5C185]">
                      ₹{costPerDayInr.toFixed(1)} / ${costPerDayUsd.toFixed(2)}
                    </div>
                  </div>
                </div>

                {isOnShelf ? (
                  <motion.button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    className="mt-4 flex items-center gap-2 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-4 py-2 font-mono-tech text-xs text-[#34D399] hover:bg-[#34D399]/20"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Quantity: {(product?.quantity || 1)}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleAddToShelf}
                    className="mt-4 flex items-center gap-2 rounded-full border border-[#E5C185]/30 bg-[#E5C185] px-4 py-2 font-mono-tech text-xs text-[#141210] hover:bg-[#E5C185]/90"
                    whileHover={{ scale: 1.02 }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add to Shelf
                  </motion.button>
                )}
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {/* Active Ingredients */}
          <TiltCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#E5C185]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Active Ingredients
              </h3>
            </div>
            <div className="space-y-2">
              {catalogProduct.activeIngredients.map((ing, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/8 bg-black/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                      {ing.name}
                    </span>
                    <span className="font-mono-tech text-xs text-[#8A8177]">
                      {ing.concentration}
                      {ing.pH !== undefined && ` (pH ${ing.pH})`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>

          {/* Target Concerns */}
          <TiltCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#34D399]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Target Concerns
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {catalogProduct.targetConcerns.map((concern) => (
                <span
                  key={concern}
                  className="rounded-full border border-[#34D399]/20 bg-[#34D399]/5 px-3 py-1 font-mono-tech text-xs text-[#34D399]"
                >
                  {concern.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </TiltCard>

          {/* Texture & Vehicle */}
          <TiltCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#E5C185]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Texture Vehicle
              </h3>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/30 p-3">
              <div className="font-serif-editorial text-sm text-[#F7F4EF]">
                {vehicleLabel(catalogProduct.textureVehicle)}
              </div>
              <div className="mt-1 font-mono-tech text-xs text-[#8A8177]">
                Irritancy Score: {catalogProduct.irritancyScore}/10 —{" "}
                <span className={irritancyColor(catalogProduct.irritancyScore)}>
                  {irritancyLabel(catalogProduct.irritancyScore)}
                </span>
              </div>
            </div>
          </TiltCard>

          {/* Skin Compatibility */}
          <TiltCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#2ECC71]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Skin Compatibility
              </h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.1em] text-[#8A8177]">
                  Suitable
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {catalogProduct.suitableSkinTypes.map((st) => (
                    <span
                      key={st}
                      className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/20 bg-[#34D399]/10 px-2 py-0.5 font-mono-tech text-[10px] text-[#34D399]"
                    >
                      <Check className="h-2.5 w-2.5" />
                      {st}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.1em] text-[#8A8177]">
                  Incompatible
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {catalogProduct.incompatibleSkinTypes.length === 0 ? (
                    <span className="font-mono-tech text-xs text-[#8A8177]">
                      None
                    </span>
                  ) : (
                    catalogProduct.incompatibleSkinTypes.map((st) => (
                      <span
                        key={st}
                        className="inline-flex items-center gap-1 rounded-full border border-[#F87171]/20 bg-[#F87171]/10 px-2 py-0.5 font-mono-tech text-[10px] text-[#F87171]"
                      >
                        <X className="h-2.5 w-2.5" />
                        {st}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TiltCard>

          {/* INCI List */}
          <TiltCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-[#E5C185]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                INCI List
              </h3>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/30 p-3">
              <p className="font-mono-tech text-[10px] text-[#C4BDB3]/70">
                {catalogProduct.inciList}
              </p>
            </div>
          </TiltCard>

          {/* Cost Metrics */}
          <TiltCard className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#34D399]" />
              <h3 className="font-serif-editorial text-lg text-[#F7F4EF]">
                Cost Metrics
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between rounded-xl border border-white/8 bg-black/30 p-3">
                <span className="font-mono-tech text-xs text-[#8A8177]">
                  Cost per day (INR)
                </span>
                <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                  ₹{costPerDayInr.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/8 bg-black/30 p-3">
                <span className="font-mono-tech text-xs text-[#8A8177]">
                  Cost per month (INR)
                </span>
                <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                  ₹{costPerMonthInr.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/8 bg-black/30 p-3">
                <span className="font-mono-tech text-xs text-[#8A8177]">
                  Cost per day (USD)
                </span>
                <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                  ${costPerDayUsd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/8 bg-black/30 p-3">
                <span className="font-mono-tech text-xs text-[#8A8177]">
                  Cost per month (USD)
                </span>
                <span className="font-serif-editorial text-sm text-[#F7F4EF]">
                  ${costPerMonthUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-end gap-3"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 font-mono-tech text-xs text-[#C4BDB3] hover:border-white/25 hover:text-[#F7F4EF]"
          >
            Back
          </button>
          {!isOnShelf && (
            <button
              type="button"
              onClick={handleAddToShelf}
              className="flex items-center gap-2 rounded-full border border-[#E5C185]/30 bg-[#E5C185] px-4 py-2 font-mono-tech text-xs text-[#141210] hover:bg-[#E5C185]/90"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add to Shelf
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ProductDetailView;

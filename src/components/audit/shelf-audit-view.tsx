"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Trash2, Package, Search, Settings, FileText, FlaskConical, TestTube2, Sparkles, User, Users, GraduationCap, Minus, Shield, AlertTriangle, CheckCircle2, ChevronRight, Download, Upload, X } from "lucide-react";
import { ShelfProduct } from "@/types/engine";
import { ParsedScan } from "@/lib/mock-scan";
import { ProductCard } from "@/components/audit/product-card";
import { ConflictList } from "@/components/audit/conflict-list";
import { ShelfControls } from "@/components/audit/shelf-controls";
import { SkinTypeSelector, SkinType, Sensitivity } from "@/components/shelf/SkinTypeSelector";
import { CATALOG, Product } from "@/data/catalog";

interface ShelfAuditViewProps {
  scan: ParsedScan;
  engineResult: any;
  shelf: ShelfProduct[];
  onShelfChange: (shelf: ShelfProduct[]) => void;
  onProductSelect: (id: string) => void;
  onVerdict: () => void;
  onBack: () => void;
  constraints: any;
  setConstraints: (c: any) => void;
  skinProfile: { type: SkinType; sensitive: Sensitivity };
  onSkinProfileChange: (profile: { type: SkinType; sensitive: Sensitivity }) => void;
}

function mapYouCamToSkinType(youCamType: string | undefined): SkinType {
  if (!youCamType) return "normal";
  const lower = youCamType.toLowerCase();
  if (lower.includes("oily")) return "oily";
  if (lower.includes("dry")) return "dry";
  if (lower.includes("combination") || lower.includes("mix")) return "combination";
  return "normal";
}

const personas = [
  {
    id: "student",
    title: "Over-Exfoliating Student",
    subtitle: "Barrier compromised by actives overload",
    icon: GraduationCap,
    traits: ["3+ exfoliants active", "Daily glycolic + retinol", "Stripping foaming cleanser"],
    conflicts: ["Barrier destruction", "Chemical irritation cascade", "Photosensitivity risk"],
    color: "var(--ca-crimson)",
    glow: "rgba(153,27,27,0.15)",
    border: "rgba(153,27,27,0.3)",
  },
  {
    id: "clutter",
    title: "7-Step Clutter",
    subtitle: "Redundant actives, wasted budget",
    icon: Users,
    traits: ["2 Vitamin C serums", "Niacinamide × 3 products", "Dual retinoid overlap"],
    conflicts: ["Role redundancy × 4", "Ingredient incompatibility", "₹12,400/yr overspend"],
    color: "var(--ca-warning)",
    glow: "rgba(180,83,9,0.15)",
    border: "rgba(180,83,9,0.3)",
  },
  {
    id: "minimalist",
    title: "Balanced Minimalist",
    subtitle: "Clinically sound, cost-optimal",
    icon: Shield,
    traits: ["4 essential products", "AM/PM separation clean", "No conflicts detected"],
    conflicts: ["Zero biometric conflicts", "Zero chemical conflicts", "₹0 needed"],
    color: "var(--ca-success)",
    glow: "rgba(15,83,56,0.15)",
    border: "rgba(15,83,56,0.3)",
  },
];

export function ShelfAuditView({
  scan,
  engineResult,
  shelf,
  onShelfChange,
  onProductSelect,
  onVerdict,
  onBack,
  constraints,
  setConstraints,
  skinProfile,
  onSkinProfileChange,
}: ShelfAuditViewProps) {
  const [showINCIDrawer, setShowINCIDrawer] = useState(false);
  const [inciText, setInciText] = useState("");
  const [parsedINCI, setParsedINCI] = useState<string[]>([]);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleAddProduct = (product: Product) => {
    const newProduct: ShelfProduct = { ...product };
    onShelfChange([...shelf, newProduct]);
    setShowAddModal(false);
  };

  const handleRemoveProduct = (id: string) => {
    onShelfChange(shelf.filter((p) => p.id !== id));
  };

  const handleClearShelf = () => {
    onShelfChange([]);
  };

  const parseINCI = (text: string) => {
    const ingredients = text
      .split(/[,;]/)
      .map(i => i.trim())
      .filter(i => i.length > 1);
    setParsedINCI(ingredients);
  };

  const filteredCatalog = CATALOG.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.activeIngredients.some(ai => ai.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || p.roles.includes(selectedCategory as any);
    return matchesSearch && matchesCategory && !shelf.some((s) => s.id === p.id);
  });

  const categories = ["all", "cleanser", "hydrator", "exfoliant_aha_bha", "retinoid", "antioxidant_vit_c", "barrier_repair", "azelaic_treatment", "niacinamide_pore", "eye_treatment", "sunscreen_spf"];

  return (
    <div className="min-h-screen bg-[var(--ca-studiomid)] relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15 blur-[200px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-skin-neutral) 0%, transparent 70%)" }} />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[150px]"
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

      {/* INCI Drawer */}
      <AnimatePresence>
        {showINCIDrawer && (
          <>
            <motion.div
              className="atelier-diagnostic-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowINCIDrawer(false)}
            />
            <motion.div
              className="atelier-diagnostic-panel atelier-glass-elevated p-6 max-w-2xl w-full mx-4"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h3 font-light">INCI Formulation Studio</h2>
                <button onClick={() => setShowINCIDrawer(false)} className="atelier-btn-ghost p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <textarea
                value={inciText}
                onChange={(e) => {
                  setInciText(e.target.value);
                  parseINCI(e.target.value);
                }}
                placeholder="Paste full INCI list here…&#10;e.g., Water, Niacinamide, Zinc PCA, Glycerin, Ceramide NP, Panthenol, Dimethicone, Carbomer, Phenoxyethanol"
                className="atelier-input mb-4 min-h-[120px] font-mono text-sm resize-none"
                rows={4}
              />

              {parsedINCI.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  <p className="text-body-sm text-[var(--ca-ink-subtle)] mb-3">Parsed Ingredients ({parsedINCI.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedINCI.map((ing, i) => (
                      <motion.span
                        key={i}
                        className="text-body-xs px-3 py-1.5 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid var(--ca-glass-border)",
                          color: "var(--ca-ink-muted)",
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        {ing}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="atelier-container py-8">
          {/* Header */}
          <div className="mb-10 animate-slide-up stagger-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-subheading">Bio-Inventory Intelligence</span>
                <h1 className="text-h1 font-light mt-1">Shelf Audit Studio</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowINCIDrawer(true)}
                  className="atelier-btn-secondary"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Paste INCI</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="atelier-btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Product</span>
                </button>
              </div>
            </div>

            {/* Scan Summary Bar */}
            <div className="atelier-glass p-4">
              <div className="flex flex-wrap items-center gap-4 text-body-sm">
                <span className="text-[var(--ca-ink-subtle)]">Scan:</span>
                <span className="font-medium text-[var(--ca-paper)]">Overall {scan.overallScore.toFixed(1)}/100</span>
                <span className="text-[var(--ca-ink-subtle)]">•</span>
                <span className="font-medium text-[var(--ca-paper)]">Skin Age {scan.skinAge}</span>
                <span className="text-[var(--ca-ink-subtle)]">•</span>
                <span className="font-medium text-[var(--ca-gold-warm)]">{scan.skinType.type}</span>
                <span className="text-[var(--ca-ink-subtle)]">•</span>
                <span className="font-medium text-[var(--ca-paper)]">
                  {engineResult?.scanSummary.priorityConcerns.map((pc: any) => pc.concern).join(", ") || "No priority concerns"}
                </span>
              </div>
            </div>
          </div>

          {/* Skin Type Selector */}
          <div className="mb-10 animate-slide-up stagger-2">
            <SkinTypeSelector
              value={skinProfile}
              onChange={onSkinProfileChange}
              youcamDetected={scan.skinType?.type ? mapYouCamToSkinType(scan.skinType.type) : undefined}
            />
          </div>

          {/* Persona Quick-Select */}
          <div className="mb-10 animate-slide-up stagger-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-subheading">Clinical Personas</span>
                <h2 className="text-h2 font-light mt-1">One-Click Shelf Archetypes</h2>
              </div>
              <span className="text-body-sm text-[var(--ca-ink-subtle)]">Click to load archetype</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {personas.map((persona, i) => (
                <motion.button
                  key={persona.id}
                  onClick={() => setActivePersona(activePersona === persona.id ? null : persona.id)}
                  className={`atelier-glass-elevated p-6 relative group ${activePersona === persona.id ? "ring-2" : ""}`}
                  style={{
                    borderColor: activePersona === persona.id ? persona.color : "var(--ca-glass-border)",
                    boxShadow: activePersona === persona.id
                      ? `0 0 0 1px ${persona.color}, 0 12px 48px ${persona.glow}`
                      : undefined,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: persona.glow }}
                      initial={{ scale: 0.8, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <persona.icon className="h-6 w-6" style={{ color: persona.color }} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--ca-paper)]">{persona.title}</h3>
                      <p className="text-body-sm text-[var(--ca-ink-subtle)] mt-0.5">{persona.subtitle}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {persona.traits.map((trait, ti) => (
                          <motion.span
                            key={ti}
                            className="text-body-xs px-2.5 py-1 rounded-full"
                            style={{
                              background: persona.glow,
                              color: persona.color,
                              border: `1px solid ${persona.border}`,
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + ti * 0.05 }}
                          >
                            {trait}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {activePersona === persona.id && (
                      <motion.div
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: persona.border }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <p className="text-body-sm text-[var(--ca-ink-subtle)] mb-3">Conflicts detected:</p>
                        <div className="flex flex-wrap gap-2">
                          {persona.conflicts.map((conflict, ci) => (
                            <motion.span
                              key={ci}
                              className="text-body-xs px-2.5 py-1 rounded-full"
                              style={{
                                background: persona.glow,
                                color: persona.color,
                                border: `1px solid ${persona.border}`,
                              }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 + ci * 0.05 }}
                            >
                              {conflict}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Shelf Controls */}
          <div className="mb-8 animate-slide-up stagger-4">
            <ShelfControls
              shelf={shelf}
              constraints={constraints}
              setConstraints={setConstraints}
              onClearShelf={handleClearShelf}
            />
          </div>

          {/* Current Shelf - 3D Tilt Cards */}
          <div className="mb-10 animate-slide-up stagger-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-subheading">Current Shelf</span>
                <h2 className="text-h2 font-light mt-1">{shelf.length} Products Loaded</h2>
              </div>
              {shelf.length > 0 && (
                <button
                  onClick={handleClearShelf}
                  className="atelier-btn-ghost text-[var(--ca-crimson)] hover:bg-[var(--ca-crimson-glow)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Shelf
                </button>
              )}
            </div>

            {shelf.length === 0 ? (
              <div className="atelier-glass p-12 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-[var(--ca-ink-faint)]" />
                <p className="text-[var(--ca-ink-muted)]">Your shelf is empty. Add products from the catalog below or load a persona.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shelf.map((product, index) => (
                  <motion.div
                    key={product.id}
                    className="atelier-tilt-card"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="atelier-tilt-inner atelier-glass p-4 h-full">
                      <ProductCard
                        product={product}
                        onRemove={handleRemoveProduct}
                        onSelect={() => onProductSelect(product.id)}
                        showRemove={true}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Catalog - Add Products Modal */}
          <AnimatePresence>
            {showAddModal && (
              <>
                <motion.div
                  className="atelier-diagnostic-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                />
                <motion.div
                  className="atelier-diagnostic-panel atelier-glass-elevated p-6 max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col"
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 40, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-h3 font-light">Apothecary Catalog</h2>
                      <p className="text-body-sm text-[var(--ca-ink-subtle)]">{filteredCatalog.length} products available</p>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="atelier-btn-ghost p-2">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Search & Filter */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ca-ink-faint)]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products, brands, actives…"
                        className="atelier-input pl-10"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="atelier-input w-full sm:w-48"
                    >
                      <option value="all">All Categories</option>
                      {categories.filter(c => c !== "all").map(cat => (
                        <option key={cat} value={cat}>
                          {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Grid */}
                  <div className="flex-1 overflow-y-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-2">
                    {filteredCatalog.map((product, index) => (
                      <motion.div
                        key={product.id}
                        className="atelier-tilt-card cursor-pointer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleAddProduct(product)}
                      >
                        <div className="atelier-tilt-inner atelier-glass p-4 h-full">
                          <ProductCard
                            product={product as ShelfProduct}
                            onAdd={() => handleAddProduct(product)}
                            onSelect={() => onProductSelect(product.id)}
                            showAdd={true}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {filteredCatalog.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-[var(--ca-ink-faint)]">
                      No products match your search.
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Engine Results Summary */}
          {engineResult && (
            <div className="mb-10 animate-slide-up stagger-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-subheading">Audit Intelligence</span>
                  <h2 className="text-h2 font-light mt-1">Conflict & Gap Analysis</h2>
                </div>
              </div>

              <ConflictList
                biometricConflicts={engineResult.biometricConflicts}
                chemicalConflicts={engineResult.chemicalConflicts}
                redundancyAlerts={engineResult.redundancyAlerts}
              />

              {/* Metric Cards */}
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Biometric Conflicts"
                  value={String(engineResult.biometricConflicts?.length || 0)}
                  subtitle="scan-to-shelf"
                  color={engineResult.biometricConflicts?.length > 0 ? "var(--ca-crimson)" : "var(--ca-success)"}
                  icon={AlertTriangle}
                />
                <MetricCard
                  title="Chemical Conflicts"
                  value={String(engineResult.chemicalConflicts?.length || 0)}
                  subtitle="shelf-to-shelf"
                  color={engineResult.chemicalConflicts?.length > 0 ? "var(--ca-warning)" : "var(--ca-success)"}
                  icon={FlaskConical}
                />
                <MetricCard
                  title="Redundancies"
                  value={String(engineResult.redundancyAlerts?.length || 0)}
                  subtitle="duplicate roles"
                  color={engineResult.redundancyAlerts?.length > 0 ? "var(--ca-gold-warm)" : "var(--ca-success)"}
                  icon={Sparkles}
                />
                <MetricCard
                  title="Gaps Identified"
                  value={String(engineResult.gapRecommendations?.length || 0)}
                  subtitle="priority concerns"
                  color={engineResult.gapRecommendations?.length > 0 ? "var(--ca-gold-warm)" : "var(--ca-success)"}
                  icon={TestTube2}
                />
              </div>

              {/* AM/PM Routine */}
              {engineResult.finalRoutine && (
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <RoutineColumn
                    title="AM Routine"
                    items={engineResult.finalRoutine.AM}
                    icon={Sparkles}
                    accent="var(--ca-gold-warm)"
                  />
                  <RoutineColumn
                    title="PM Routine"
                    items={engineResult.finalRoutine.PM}
                    icon={TestTube2}
                    accent="var(--ca-skin-neutral)"
                  />
                </div>
              )}

              {/* CTA to Verdict */}
              <div className="mt-10 flex justify-center">
                <button
                  onClick={onVerdict}
                  className="atelier-btn-primary w-full max-w-md"
                >
                  <ChevronRight className="h-5 w-5" />
                  View Formulation Ledger
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="atelier-glass p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-body-sm text-[var(--ca-ink-subtle)]">{title}</p>
          <p className="text-body-xs text-[var(--ca-ink-faint)]">{subtitle}</p>
        </div>
      </div>
      <div className="text-h1 font-bold text-[var(--ca-paper)]" style={{ fontFamily: "var(--font-fira-code)" }}>
        {value}
      </div>
    </div>
  );
}

function RoutineColumn({ title, items, icon: Icon, accent }: { title: string; items: any[]; icon: React.ComponentType<{ className?: string }>; accent: string }) {
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
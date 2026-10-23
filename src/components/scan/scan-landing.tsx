"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Upload, Image, ChevronRight, ChevronLeft, Search, Eye, Layers, Sparkles, Flame, Droplet, Shield, Sparkles as SparklesIcon, Settings, Menu, X, ChevronDown } from "lucide-react";
import { mockScan } from "@/lib/mock-scan";
import { ParsedScan } from "@/lib/mock-scan";
import { SkinTypeSelector, SkinType, Sensitivity } from "@/components/shelf/SkinTypeSelector";

interface ScanLandingProps {
  onStart: () => void;
  scanData: ParsedScan;
  setScanData: (data: ParsedScan) => void;
}

const skinTypeLabels: Record<SkinType, string> = {
  oily: "Oily",
  dry: "Dry",
  combination: "Combination",
  normal: "Normal",
};

const reticleZones = [
  { id: "cheek", label: "Cheek · Redness", score: 58, x: 32, y: 45, concern: "redness" },
  { id: "tzone", label: "T-Zone · Pores", score: 62, x: 50, y: 32, concern: "pore" },
  { id: "periorbital", label: "Periorbital · Dark Circles", score: 71, x: 50, y: 22, concern: "dark_circle_v2" },
  { id: "barrier", label: "Barrier · Moisture", score: 64, x: 68, y: 55, concern: "moisture" },
];

export function ScanLanding({ onStart, scanData, setScanData }: ScanLandingProps) {
  const [skinProfile, setSkinProfile] = useState<{ type: SkinType; sensitive: Sensitivity }>({ type: "normal", sensitive: false });
  const [activeReticle, setActiveReticle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"portrait" | "dermal" | "masks">("portrait");
  const [isScanning, setIsScanning] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const handleDemoScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setScanData(mockScan);
      setIsScanning(false);
      onStart();
    }, 1200);
  };

  // 3D Parallax Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 200, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 200, damping: 25 });
  const rotateX = useTransform(springY, [-1, 1], [-4, 4]);
  const rotateY = useTransform(springX, [-1, 1], [4, -4]);
  const translateZ = useTransform(springX, [-1, 1], [-20, 20]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(Math.max(-1, Math.min(1, deltaX)));
    mouseY.set(Math.max(-1, Math.min(1, deltaY)));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="min-h-screen bg-[var(--ca-studiomid)] relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-[200px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-skin-warm) 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-20 blur-[150px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-gold-warm) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full opacity-15 blur-[120px]"
          style={{ background: "radial-gradient(ellipse at center, var(--ca-skin-neutral) 0%, transparent 70%)" }} />
      </div>

      {/* Top Atelier Navigation */}
      <header className="relative z-20 w-full border-b border-[var(--ca-stone-border)] bg-[var(--ca-studiomid)]/80 backdrop-blur-xl">
        <div className="atelier-container flex h-16 items-center justify-between">
          {/* Left: Stage Indicators */}
          <nav className="flex items-center gap-6" aria-label="Atelier stages">
            <span className="atelier-stage-indicator active" data-stage="1">
              <span className="text-mono-lg">01</span> Skin Telemetry
            </span>
            <span className="atelier-stage-indicator" data-stage="2">
              <span className="text-mono-lg">02</span> Bio-Shelf Audit
            </span>
            <span className="atelier-stage-indicator" data-stage="3">
              <span className="text-mono-lg">03</span> Formulation Ledger
            </span>
          </nav>

          {/* Center: Wordmark */}
          <h1 className="text-h2 font-light tracking-tight" style={{ fontFamily: "var(--font-cormorant)" }}>
            ShelfWise Atelier
          </h1>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Currency Switch */}
            <div className="hidden md:flex items-center gap-1.5 bg-[var(--ca-glass-bg)] border border-[var(--ca-glass-border)] rounded-full px-3 py-1.5 backdrop-blur-xl">
              <span className="text-body-sm text-[var(--ca-ink-subtle)]">₹ INR</span>
              <span className="text-body-sm font-medium text-[var(--ca-paper)]">/</span>
              <span className="text-body-sm text-[var(--ca-gold-warm)]">$ USD</span>
            </div>

            {/* Instant Scan Trigger */}
            <button
              onClick={handleDemoScan}
              disabled={isScanning}
              className="atelier-btn-primary hidden sm:inline-flex"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--ca-ink)]/30 border-t-[var(--ca-ink)] rounded-full animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Instant 16-Concern Scan
                </>
              )}
            </button>

            {/* Mobile Menu */}
            <button className="md:hidden atelier-btn-ghost" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-Viewport Hero Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1200px] mx-auto">
          {/* Portrait Stage */}
          <div
            ref={stageRef}
            className="atelier-portrait-stage"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              className="atelier-portrait-frame relative rounded-2xl overflow-hidden"
              style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
                translateZ,
              }}
              initial={{ opacity: 0, scale: 0.98, rotateX: 6, rotateY: -6 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Portrait Image */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&h=1067&fit=crop&crop=face"
                  alt="Clinical skin analysis portrait"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--ca-studiomid)] opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ca-studiomid)]/40 via-transparent to-transparent" />
              </div>

              {/* Mask Overlay Layer */}
              <AnimatePresence mode="popLayout">
                {viewMode === "masks" && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 400 }}
                  >
                    <div className="absolute inset-0 bg-[var(--ca-studiomid)]/30" />
                    {reticleZones.map((zone, i) => (
                      <motion.div
                        key={zone.id}
                        className="atelier-mask-overlay"
                        style={{
                          backgroundImage: `radial-gradient(ellipse at ${zone.x}% ${zone.y}%, var(--ca-skin-warm) 0%, transparent 40%)`,
                          opacity: 0.5,
                        }}
                        initial={{ opacity: 0, scale: 1.2 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 500 }}
                      />
                    ))}
                  </motion.div>
                )}

                {viewMode === "dermal" && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 400 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--ca-studiomid)]/20 via-transparent to-[var(--ca-studiomid)]/40" />
                    {/* Dermal layer lines */}
                    <svg className="w-full h-full" viewBox="0 0 400 533" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="dermalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
                          <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.08" />
                          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.04" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#dermalGradient)" />
                      {/* Stratum Corneum line */}
                      <line x1="0" y1="80" x2="400" y2="80" stroke="var(--ca-gold-warm)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                      <text x="20" y="75" fill="var(--ca-gold-warm)" fontSize="9" fontFamily="Inter" opacity="0.6">Stratum Corneum</text>
                      {/* Epidermis line */}
                      <line x1="0" y1="180" x2="400" y2="180" stroke="var(--ca-skin-warm)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                      <text x="20" y="175" fill="var(--ca-skin-warm)" fontSize="9" fontFamily="Inter" opacity="0.6">Epidermis</text>
                      {/* Dermis line */}
                      <line x1="0" y1="320" x2="400" y2="320" stroke="var(--ca-crimson)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                      <text x="20" y="315" fill="var(--ca-crimson)" fontSize="9" fontFamily="Inter" opacity="0.6">Dermis</text>
                      {/* Hypodermis line */}
                      <line x1="0" y1="460" x2="400" y2="460" stroke="var(--ca-gold-deep)" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                      <text x="20" y="455" fill="var(--ca-gold-deep)" fontSize="9" fontFamily="Inter" opacity="0.6">Hypodermis</text>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Diagnostic Reticles */}
              {reticleZones.map((zone) => (
                <motion.div
                  key={zone.id}
                  className={`atelier-reticle ${activeReticle === zone.id ? "active" : ""}`}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: "80px",
                    height: "80px",
                    transform: "translate(-50%, -50%)",
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: activeReticle === zone.id ? 1 : 0.7, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                  onMouseEnter={() => setActiveReticle(zone.id)}
                  onMouseLeave={() => setActiveReticle(activeReticle === zone.id ? null : activeReticle)}
                >
                  <motion.div
                    className="atelier-reticle-label"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: activeReticle === zone.id ? 1 : 0, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {zone.label} <span className="text-mono-lg ml-1">{zone.score}</span>
                  </motion.div>
                  {/* Corner accents */}
                  <div className="absolute -top-2 -left-2 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-[var(--ca-paper)]" />
                  <div className="absolute -top-2 -right-2 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-[var(--ca-paper)]" />
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-[var(--ca-paper)]" />
                  <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-[var(--ca-paper)]" />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* View Mode Toggle */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--ca-glass-bg)] border border-[var(--ca-glass-border)] rounded-full px-4 py-2 backdrop-blur-xl">
            <button
              onClick={() => setViewMode("portrait")}
              className={`atelier-btn-ghost px-3 py-1.5 ${viewMode === "portrait" ? "text-[var(--ca-paper)] bg-[var(--ca-gold-warm)]/20 border border-[var(--ca-gold-warm)]/30" : ""}`}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Portrait</span>
            </button>
            <button
              onClick={() => setViewMode("masks")}
              className={`atelier-btn-ghost px-3 py-1.5 ${viewMode === "masks" ? "text-[var(--ca-paper)] bg-[var(--ca-gold-warm)]/20 border border-[var(--ca-gold-warm)]/30" : ""}`}
            >
              <SparklesIcon className="h-4 w-4" />
              <span className="hidden sm:inline">16 Masks</span>
            </button>
            <button
              onClick={() => setViewMode("dermal")}
              className={`atelier-btn-ghost px-3 py-1.5 ${viewMode === "dermal" ? "text-[var(--ca-paper)] bg-[var(--ca-gold-warm)]/20 border border-[var(--ca-gold-warm)]/30" : ""}`}
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">3D Dermal</span>
            </button>
          </div>
        </div>

        {/* Bottom-Left: Editorial Headline & Primary CTA */}
        <div className="absolute bottom-8 left-4 right-1/2 max-w-md animate-slide-up stagger-1">
          <div className="flex flex-col items-start gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-display font-light leading-tight text-[var(--ca-paper)]">Clinical</span>
              <span className="text-display font-light leading-tight text-[var(--ca-gold-warm)] italic">Proportion.</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDemoScan}
                disabled={isScanning}
                className="atelier-btn-primary w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                {isScanning ? "Scanning…" : "Scan Your Skin"}
              </button>
              <button
                onClick={handleDemoScan}
                disabled={isScanning}
                className="atelier-btn-secondary w-full sm:w-auto"
              >
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Run Verified 16-Concern Scan</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom-Right: Philosophical Copy & Skin Type Selector */}
        <div className="absolute bottom-8 right-4 left-1/2 max-w-md animate-slide-up stagger-2">
          <div className="flex flex-col items-end gap-6 text-right">
            <p className="text-body text-[var(--ca-ink-muted)] leading-relaxed">
              "A private clinical atelier for those who seek barrier harmony — not a 7-step routine.
              Often our verdict is simple: Buy Nothing. ₹0 needed."
            </p>
            <div className="w-full">
              <SkinTypeSelector
                value={skinProfile}
                onChange={setSkinProfile}
                youcamDetected={scanData.skinType?.type ? (() => {
                  const lower = scanData.skinType?.type?.toLowerCase();
                  if (lower?.includes("oily")) return "oily";
                  if (lower?.includes("dry")) return "dry";
                  if (lower?.includes("combination") || lower?.includes("mix")) return "combination";
                  return "normal";
                })() : undefined}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--ca-ink-faint)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 600 }}
      >
        <ChevronDown className="h-6 w-6 animate-bounce" style={{ animationDuration: "2s" }} />
        <span className="text-body-xs uppercase tracking-widest">Scroll for Dermal Telemetry</span>
      </motion.div>
    </div>
  );
}


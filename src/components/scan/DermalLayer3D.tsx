"use client";

import { useRef, useState, useEffect, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Layers, MousePointer2, RotateCcw, Eye, Grid, Zap } from "lucide-react";

interface DermalLayer3DProps {
  scanData: {
    concerns: Array<{
      type: string;
      uiScore: number;
      maskUrls: string[];
    }>;
    overallScore: number;
  };
  selfieUrl?: string;
}

const layerData = [
  { id: "stratum", name: "Stratum Corneum", depth: 0, color: "rgba(246,244,240,0.9)", icon: Grid },
  { id: "epidermis", name: "Epidermis", depth: 1, color: "rgba(15,83,56,0.12)", icon: Zap },
  { id: "dermis", name: "Dermis", depth: 2, color: "rgba(153,27,27,0.08)", icon: Layers },
  { id: "hypodermis", name: "Hypodermis", depth: 3, color: "rgba(180,83,9,0.06)", icon: Grid },
];

export function DermalLayer3D({ scanData, selfieUrl }: DermalLayer3DProps) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 48, y: -22 });
  const containerRef = useRef<HTMLDivElement>(null);

  const rx = useMotionValue(rotation.x);
  const ry = useMotionValue(rotation.y);

  const springRx = useSpring(rx, { stiffness: 200, damping: 25 });
  const springRy = useSpring(ry, { stiffness: 200, damping: 25 });

  const rotationX = useSpring(rx, { stiffness: 200, damping: 25 });
  const rotationY = useSpring(ry, { stiffness: 200, damping: 25 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== "3d") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!isDragging || mode !== "3d") return;
    const deltaX = (e.clientX - dragStart.x) * 0.3;
    const deltaY = (e.clientY - dragStart.y) * 0.3;
    rx.set(rotation.x + deltaY);
    ry.set(rotation.y - deltaX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setRotation({ x: rx.get(), y: ry.get() });
  };

  // Memoize event handlers to avoid exhausting deps
  const handleMouseMoveRef = useRef(handleMouseMove);
  handleMouseMoveRef.current = handleMouseMove;
  const handleMouseUpRef = useRef(handleMouseUp);
  handleMouseUpRef.current = handleMouseUp;

  useEffect(() => {
    const move = (e: globalThis.MouseEvent) => handleMouseMoveRef.current(e);
    const up = () => handleMouseUpRef.current();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [isDragging, mode]);

  const maskLayers = scanData.concerns
    .filter(c => c.maskUrls.length > 0 && c.type !== "skin_type")
    .slice(0, 8)
    .map((concern, i) => ({
      id: concern.type,
      name: concern.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      score: concern.uiScore,
      maskUrl: concern.maskUrls[0],
      index: i,
    }));

  if (mode === "2d") {
    return (
      <div className="relative" ref={containerRef}>
        <div className="glass-card p-6 animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-h3">16-Concern Mask Precision View</h3>
            <div className="flex items-center gap-3">
              <span className="text-body-sm">2D View Active</span>
              <button
                onClick={() => setMode("3d")}
                className="btn-ghost gap-2 px-4"
              >
                <Layers className="h-4 w-4" />
                3D Exploded
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {maskLayers.map((layer) => (
              <div key={layer.id} className="relative group stone-card p-4 rounded-xl overflow-hidden">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-[var(--ca-alabaster)]">
                  <img
                    src={layer.maskUrl}
                    alt={`${layer.name} mask`}
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-body-sm font-medium">{layer.name}</span>
                  <span className="text-mono font-semibold text-[var(--ca-emerald)]">
                    {layer.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseDown={handleMouseDown}
      style={{ touchAction: "none" }}
    >
      <div className="glass-card p-6 animate-slide-up stagger-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-h3">3D Exploded Dermal Stack</h3>
          <div className="flex items-center gap-3">
            <span className="badge-emerald">3D Active</span>
            <button
              onClick={() => setMode("2d")}
              className="btn-ghost gap-2 px-4"
            >
              <Eye className="h-4 w-4" />
              2D Precision
            </button>
          </div>
        </div>

        <div
          className="relative"
          style={{
            perspective: "1200px",
            transformStyle: "preserve-3d",
            minHeight: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            className="relative"
            style={{
              transformStyle: "preserve-3d",
              rotateX: rotationX,
              rotateY: rotationY,
            }}
          >
            {/* Base selfie layer */}
            <motion.div
              className="absolute inset-0"
              style={{
                transform: "translateZ(0px)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(20,22,21,0.15)",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 400 }}
            >
              {selfieUrl ? (
                <img src={selfieUrl} alt="Skin analysis base" className="w-full h-[400px] object-cover" />
              ) : (
                <div className="w-full h-[400px] bg-gradient-to-br from-[var(--ca-stone)] to-[var(--ca-alabaster)] flex items-center justify-center">
                  <span className="text-body-sm text-[var(--ca-slate-light)]">Selfie Base Layer</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </motion.div>

            {/* Mask detection layer */}
            <motion.div
              className="absolute inset-0"
              style={{
                transform: "translateZ(60px)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 30px 80px rgba(20,22,21,0.2)",
              }}
              initial={{ opacity: 0, translateZ: -20 }}
              animate={{ opacity: 0.9, translateZ: 0 }}
              transition={{ delay: 0.2, duration: 500 }}
            >
              <div className="w-full h-[400px] relative">
                {maskLayers.map((layer, i) => (
                  <motion.img
                    key={layer.id}
                    src={layer.maskUrl}
                    alt={`${layer.name} mask`}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70"
                    style={{ filter: "contrast(1.2) brightness(1.1)" }}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 0.85, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 400 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Biometric coordinate grid layer */}
            <motion.div
              className="absolute inset-0"
              style={{
                transform: "translateZ(120px)",
                borderRadius: "16px",
                boxShadow: "0 40px 100px rgba(20,22,21,0.25)",
              }}
              initial={{ opacity: 0, translateZ: -40 }}
              animate={{ opacity: 0.15, translateZ: 0 }}
              transition={{ delay: 0.4, duration: 500 }}
            >
              <div className="w-full h-[400px] relative">
                <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" style={{ stroke: "var(--ca-emerald)" }} />
                </svg>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-[var(--ca-emerald)] font-mono opacity-60">
                  <span>Biometric Coordinate Grid</span>
                  <span>YouCam V2.1 SD</span>
                </div>
              </div>
            </motion.div>

            {/* Layer labels floating */}
            {layerData.map((layer, i) => (
              <motion.div
                key={layer.id}
                className="absolute pointer-events-none"
                style={{
                  top: `${20 + i * 8}%`,
                  right: "24px",
                  transform: `translateZ(${i * 60 + 20}px)`,
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.8, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 400 }}
              >
                <span className="badge-stone whitespace-nowrap text-xs">
                  {layer.name}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Depth indicator */}
          <motion.div
            className="absolute bottom-6 left-6 right-6 flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 400 }}
          >
            <div className="flex items-center gap-2 text-body-sm text-[var(--ca-slate-light)]">
              <MousePointer2 className="h-4 w-4" />
              Drag to rotate
            </div>
            <div className="flex items-center gap-4">
              {layerData.map((layer, i) => (
                <div key={layer.id} className="flex items-center gap-2">
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: layer.color }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2000, delay: i * 200, repeat: Infinity }}
                  />
                  <span className="text-body-sm text-[var(--ca-slate)] hidden sm:inline">{layer.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
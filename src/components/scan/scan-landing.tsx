"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sparkles,
  Shield,
  BarChart3,
  Scan,
  Droplet,
} from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { SkinTypeSelector, SkinProfile } from "@/components/shelf/SkinTypeSelector";
import { CONCERN_LABELS, CONCERN_COLORS, ParsedScan, mockScan } from "@/lib/mock-scan";
import { SkinType } from "@/components/shelf/SkinTypeSelector";
import { validateSelfiePreflight } from "@/lib/youcam/preflight";

export interface ScanLandingProps {
  onStart: () => void;
  scanData: ParsedScan | null;
  setScanData: (data: ParsedScan) => void;
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
  skinProfile: SkinProfile;
  onSkinProfileChange: (profile: SkinProfile) => void;
}

const FEATURES = [
  {
    icon: Camera,
    title: "YouCam V2.1 Integration",
    description: "16-channel biometric skin analysis powered by AI",
    value: "16 concerns",
  },
  {
    icon: BarChart3,
    title: "Bio-Inventory Engine",
    description: "Detects conflicts between your scan and shelf products",
    value: "Real-time",
  },
  {
    icon: Shield,
    title: "Vehicle Matrix",
    description: "Texture compatibility mapped to your skin type",
    value: "4 skin types",
  },
  {
    icon: Droplet,
    title: "Sensory Barrier",
    description: "Flags irritants for sensitive skin",
    value: "2-tier",
  },
];

function Camera(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 4.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 1 1 7 0z" />
      <path d="M12 2v6m0 0v2m0-2h2m-2 0H9.5" />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  );
}

export function ScanLanding({
  onStart,
  scanData,
  setScanData,
  selectedImage,
  setSelectedImage,
  skinProfile,
  onSkinProfileChange,
}: ScanLandingProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingComplete, setIsUploadingComplete] = useState(false);
  const [biometricConcernCount, setBiometricConcernCount] = useState(0);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadError(null);
      setIsUploadingComplete(false);
      setBiometricConcernCount(0);

      let previewUrl: string | null = null;
      try {
        // Validate against Perfect Corp's HD input requirements before upload.
        const preflight = await validateSelfiePreflight(file, "HD");
        if (!preflight.valid) {
          setUploadError(preflight.error || "This image does not meet the HD scan requirements.");
          return;
        }

        previewUrl = URL.createObjectURL(file);
        setSelectedImage(previewUrl);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("tier", "HD");
        formData.append("concerns", "all");

        const response = await fetch("/api/youcam/scan", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (!response.ok || !result.success || !result.results) {
          throw new Error(result.error || "The live YouCam scan could not be completed.");
        }

        setScanData({ ...result.results, source: "youcam" } as ParsedScan);
        setUploadError(null);
        setBiometricConcernCount(result.concernsAnalyzed || 16);
        setIsUploadingComplete(true);
      } catch (err) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedImage(null);
        setUploadError(
          err instanceof Error ? err.message : "Upload failed. Please try again."
        );
        setIsUploadingComplete(false);
      } finally {
        setIsUploading(false);
      }
    },
    [setScanData, setSelectedImage]
  );

  const handleDemoScan = useCallback(() => {
    setScanData({ ...mockScan, source: "demo" });
    setUploadError(null);
    setIsUploadingComplete(true);
    setSelectedImage(null);
  }, [setScanData, setSelectedImage]);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileUpload({ target } as React.ChangeEvent<HTMLInputElement>);
    };
    input.click();
  }, [handleFileUpload]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
        handleFileUpload(createFileEvent(file));
      } else if (file) {
        setUploadError("YouCam accepts JPEG and PNG images. Please choose one of those formats.");
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const createFileEvent = (file: File): React.ChangeEvent<HTMLInputElement> => ({
    target: { files: [file] },
    currentTarget: { files: [file] },
    nativeEvent: new Event("change"),
    bubbles: false,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isDefaultPrevented: () => false,
    isPropagationStopped: () => false,
    isTrusted: false,
    persist: () => {},
    preventDefault: () => {},
    stopPropagation: () => {},
    timeStamp: Date.now(),
    type: "change",
  } as unknown as React.ChangeEvent<HTMLInputElement>);

  const skinType: SkinType = scanData?.skinType
    ? scanData.skinType.type.toLowerCase() as SkinType
    : "normal";
  const isLiveYouCam = scanData?.source === "youcam";

  // --- Landing view: show only Hero + Uploader when no scan data ---
  if (!scanData) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="atelier-studio-backdrop" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

        <div className="relative mx-auto max-w-6xl px-4 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E5C185]/30 bg-[#E5C185]/10 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-[#E5C185]" />
              <span className="font-mono-tech text-xs text-[#E5C185]">
                YouCam V2.1 · 16-Channel Biometry · Bio-Inventory Engine
              </span>
            </div>

            <h1 className="font-serif-editorial mb-4 text-5xl font-normal text-[#F7F4EF] md:text-6xl">
              ShelfWise
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-[#C4BDB3]">
              Connect a YouCam V2.1 skin scan with an audit of the products you already own.
              Spot routine conflicts, understand formulation fit, and buy only for genuine gaps — sometimes ₹0.
            </p>
          </motion.div>

          {/* File Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <TiltCard glass={false} stone className="mb-8 p-8">
              <div
                className="relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition-all duration-200 hover:border-white/30"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={handleFileSelect}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="flex items-center gap-2 text-[#E5C185]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Scan className="h-5 w-5" />
                    </motion.div>
                    <span className="font-mono-tech text-sm">
                      Analyzing skin with YouCam V2.1...
                    </span>
                  </div>
                ) : uploadError ? (
                  <p className="flex items-center gap-1.5 text-sm">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg ${
                        uploadError.toLowerCase().includes("not configured") || uploadError.toLowerCase().includes("api key")
                          ? "bg-[#E5C185]/10 text-[#E5C185]"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                      {uploadError}
                    </span>
                  </p>
                ) : (
                  <>
                    <div className="mb-4 rounded-xl bg-white/5 p-4">
                      <Upload className="h-10 w-10 text-[#E5C185]" />
                    </div>
                    <h3 className="font-serif-editorial mb-2 text-xl text-[#F7F4EF]">
                      Upload Your Selfie for Analysis
                    </h3>
                    <p className="mb-4 max-w-md text-sm text-[#C4BDB3]">
                      Upload a clear, front-facing JPEG or PNG. HD scans require at least 1080 px on the shorter side and a file under 10 MB.
                    </p>
                  </>
                )}
              </div>

              {/* Demo Fallback */}
              <div className="flex items-center gap-3 text-center mt-6">
                <div className="flex-1 border-t border-white/12"></div>
                <span className="font-mono-tech text-xs text-[#8A8177]">
                  Or try the demo
                </span>
                <div className="flex-1 border-t border-white/12"></div>
              </div>

              <motion.button
                type="button"
                onClick={handleDemoScan}
                className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-5 py-2 font-mono-tech text-xs text-[#34D399] transition-all hover:bg-[#34D399]/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Run Demo Scan (no upload needed)
              </motion.button>
            </TiltCard>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <TiltCard key={feature.title} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-[#E5C185]/10 p-2">
                        <Icon className="h-5 w-5 text-[#E5C185]" />
                      </div>
                      <div>
                        <h4 className="font-serif-editorial text-sm font-medium text-[#F7F4EF]">
                          {feature.title}
                        </h4>
                        <p className="mt-1 text-xs text-[#C4BDB3]/70">
                          {feature.description}
                        </p>
                        <span className="font-mono-tech text-xs text-[#E5C185]">
                          {feature.value}
                        </span>
                      </div>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- Post-scan view: show Scan Profile + Skin Type Selector + Begin Audit ---
  const visibleConcerns = scanData.concerns.filter(
    (c) => c.type !== 'skin_type' && c.type !== 'hd_skin_type'
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="atelier-studio-backdrop" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

      <div className="relative mx-auto max-w-6xl px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E5C185]/30 bg-[#E5C185]/10 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-[#E5C185]" />
            <span className="font-mono-tech text-xs text-[#E5C185]">
              YouCam V2.1 · 16-Channel Biometry · Bio-Inventory Engine
            </span>
          </div>

          <h1 className="font-serif-editorial mb-4 text-5xl font-normal text-[#F7F4EF] md:text-6xl">
            ShelfWise
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-[#C4BDB3]">
            Scan your skin with YouCam V2.1 AI. Audit your existing skincare shelf
            for active & vehicle conflicts. Buy only what you need — often ₹0.
          </p>
        </motion.div>

        {/* Scan Results Preview + Skin Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <TiltCard className="mb-8 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif-editorial text-xl text-[#F7F4EF]">
                Scan Profile
              </h2>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-tech text-xs text-[#8A8177]">
                    Data source:
                  </span>
                  <span className={`font-mono-tech text-xs font-medium ${isLiveYouCam ? "text-[#34D399]" : "text-[#E5C185]"}`}>
                    {isLiveYouCam ? "YouCam Live" : "Demo fixture"}
                  </span>
                </div>
                {!isLiveYouCam && (
                  <span className="font-mono-tech text-[10px] text-[#8A8177]">
                    Sample data · no live YouCam request
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C4BDB3]">
                    Top Priority Concerns
                  </span>
                </div>

                <div className="space-y-2.5">
                  {visibleConcerns
                    .sort((a, b) => a.uiScore - b.uiScore)
                    .slice(0, 5)
                    .map((concern) => {
                      const label =
                        CONCERN_LABELS[concern.type] || concern.type;
                      const colorScore =
                        concern.uiScore >= 85
                          ? CONCERN_COLORS.low
                          : concern.uiScore >= 60
                            ? CONCERN_COLORS.medium
                            : CONCERN_COLORS.high;

                      return (
                        <div
                          key={concern.type}
                          className="flex items-center gap-3"
                        >
                          <div className="w-32 flex-shrink-0">
                            <span className="font-mono-tech text-xs text-[#C4BDB3]">
                              {label}
                            </span>
                          </div>
                          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: colorScore,
                                width: `${Math.max(
                                  (100 - concern.uiScore) / 100 * 100,
                                  3
                                )}%`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(100 - concern.uiScore) / 100 * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                          <div
                            className="w-12 text-right font-mono-tech text-xs font-medium"
                            style={{ color: colorScore }}
                          >
                            {concern.uiScore}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <TiltCard glass className="p-4">
                  <div className="text-center">
                    <div className="font-mono-tech text-xs uppercase tracking-[0.12em] text-[#8A8177]">
                      Overall Score
                    </div>
                    <div className="font-serif-editorial mt-1 text-3xl text-[#F7F4EF]">
                      {scanData.overallScore.toFixed(1)}
                    </div>
                    <div className="mt-1 font-mono-tech text-xs text-[#C4BDB3]">
                      Skin Age: {scanData.skinAge}
                    </div>
                  </div>
                </TiltCard>

                <TiltCard glass className="p-4">
                  <div className="text-center">
                    <div className="font-mono-tech text-xs uppercase tracking-[0.12em] text-[#8A8177]">
                      Biome Reading
                    </div>
                    <div className="mt-2 flex justify-center gap-3">
                      <div>
                        <div className="font-serif-editorial text-lg text-[#F7F4EF]">
                          {scanData.skinType.type}
                        </div>
                        <div className="font-mono-tech text-[10px] text-[#8A8177]">
                          {scanData.skinType.region}
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Skin Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <SkinTypeSelector
            value={skinProfile}
            onChange={onSkinProfileChange}
            youcamDetected={skinType}
            compact
          />
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <motion.button
            type="button"
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 rounded-full border border-[#E5C185]/30 bg-[#E5C185] px-8 py-4 font-serif-editorial text-lg font-normal text-[#141210] shadow-[0_20px_60px_rgba(229,193,133,0.3)] transition-all duration-300 hover:border-[#E5C185]/60 hover:shadow-[0_20px_60px_rgba(229,193,133,0.5)]"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Scan className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Begin Shelf Audit</span>

            <motion.div
              className="absolute -inset-px rounded-full opacity-0 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(360px circle at 50% 50%, rgba(229, 193, 133, 0.2), transparent 70%)",
              }}
              aria-hidden="true"
            />
          </motion.button>

          <div className="mt-4 text-xs text-[#8A8177]">
            Live selfies are sent to Perfect Corp for analysis. ShelfWise does not save uploaded selfies to an app database.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ScanLanding;

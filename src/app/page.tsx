"use client";

import { useState, useEffect } from "react";
import { ScanLanding } from "@/components/scan/scan-landing";
import { ScanResultsView } from "@/components/scan/scan-results-view";
import { ShelfAuditView } from "@/components/audit/shelf-audit-view";
import { ProductDetailView } from "@/components/audit/product-detail-view";
import { VerdictView } from "@/components/audit/verdict-view";
import { SkinProfile } from "@/components/shelf/SkinTypeSelector";
import { createDefaultShelf } from "@/lib/test-helpers";
import { runBioInventoryEngine } from "@/lib/engine/optimizer";
import { EngineConstraints, ShelfProduct, EngineOutput } from "@/types/engine";
import { inferSkinProfileFromScan } from "@/lib/engine/skin-type-resolver";
import type { ParsedScan } from "@/lib/mock-scan";

type View = "landing" | "results" | "audit" | "product" | "verdict";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Initialize scanData as null - only populate after user uploads selfie or runs demo
  const [scanData, setScanData] = useState<ParsedScan | null>(null);
  const [shelf, setShelf] = useState<ShelfProduct[]>(createDefaultShelf());
  const [constraints, setConstraints] = useState<EngineConstraints>({
    budgetInr: 3500,
    budgetUsd: 45,
    avoidedIngredients: [],
    routinePreference: "targeted",
    currency: "INR",
  });
  const [engineResult, setEngineResult] = useState<EngineOutput | null>(null);

  // Skin type profile state — initialized with default, populated after scan
  const [skinProfile, setSkinProfile] = useState<SkinProfile>({
    type: "normal",
    sensitive: "normal",
  });

  // Run the engine when we have scan data and shelf
  const runEngine = () => {
    if (!scanData || !skinProfile) {
      setEngineResult(null);
      return;
    }
    const result = runBioInventoryEngine(scanData, shelf, {
      ...constraints,
      userSkinType: skinProfile.type as 'oily' | 'dry' | 'combination' | 'normal',
      userSensitive: skinProfile.sensitive === "sensitive",
    });
    setEngineResult(result);
  };

  useEffect(() => {
    runEngine();
  }, [scanData, shelf, constraints, skinProfile]);

  const handleShelfChange = (newShelf: ShelfProduct[]) => {
    setShelf(newShelf);
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    setCurrentView("product");
  };

  // Infer the initial profile using the shared YouCam score-direction rules.
  // User edits made in the scan-profile step remain in parent state for the audit.
  useEffect(() => {
    if (scanData) {
      const inferred = inferSkinProfileFromScan({
        concerns: scanData.concerns,
        skinType: scanData.skinType,
      });
      setSkinProfile({
        type: inferred.skinType,
        sensitive: inferred.isSensitive ? "sensitive" : "normal",
      });
    }
  }, [scanData]);

  // Revoke temporary image preview URLs when replaced or when the app unmounts.
  useEffect(() => {
    if (!selectedImage?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(selectedImage);
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-[var(--surface-dark)] text-[var(--color-text-primary)]">
      {/* Main Content */}
      <main className="relative min-h-screen pt-[72px]">
        {currentView === "landing" && (
          <ScanLanding
            onStart={() => setCurrentView("results")}
            skinProfile={skinProfile}
            onSkinProfileChange={setSkinProfile}
            scanData={scanData}
            setScanData={setScanData}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        )}

        {currentView === "results" && scanData && (
          <ScanResultsView
            scan={scanData}
            engineResult={engineResult}
            onAudit={() => setCurrentView("audit")}
            onBack={() => {
              setCurrentView("landing");
              setSelectedImage(null);
            }}
            skinProfile={skinProfile}
            onSkinProfileChange={setSkinProfile}
            selectedImage={selectedImage}
          />
        )}

        {currentView === "audit" && scanData && skinProfile && (
          <ShelfAuditView
            scan={scanData}
            engineResult={engineResult}
            shelf={shelf}
            onShelfChange={handleShelfChange}
            onProductSelect={handleProductSelect}
            onVerdict={() => setCurrentView("verdict")}
            onBack={() => setCurrentView("results")}
            onHome={() => { setCurrentView("landing"); setSelectedImage(null); }}
            constraints={constraints}
            setConstraints={setConstraints}
            skinProfile={skinProfile}
            onSkinProfileChange={setSkinProfile}
          />
        )}

        {currentView === "product" && selectedProductId && (
          <ProductDetailView
            productId={selectedProductId}
            shelf={shelf}
            onShelfChange={handleShelfChange}
            onBack={() => setCurrentView("audit")}
            onVerdict={() => setCurrentView("verdict")}
          />
        )}

        {currentView === "verdict" && scanData && (
          <VerdictView
            engineResult={engineResult}
            scan={scanData}
            onRestart={() => {
              setCurrentView("landing");
              setShelf(createDefaultShelf());
            }}
            onBack={() => setCurrentView("audit")}
            onHome={() => { setCurrentView("landing"); setSelectedImage(null); }}
          />
        )}
      </main>
    </div>
  );
}

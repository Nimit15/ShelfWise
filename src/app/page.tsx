"use client";

import { useState, useEffect } from "react";
import { ScanLanding } from "@/components/scan/scan-landing";
import { ScanResultsView } from "@/components/scan/scan-results-view";
import { ShelfAuditView } from "@/components/audit/shelf-audit-view";
import { ProductDetailView } from "@/components/audit/product-detail-view";
import { VerdictView } from "@/components/audit/verdict-view";
import { SkinType, Sensitivity, SkinProfile } from "@/components/shelf/SkinTypeSelector";
import { mockScan } from "@/lib/mock-scan";
import { createDefaultShelf } from "@/lib/test-helpers";
import { runBioInventoryEngine } from "@/lib/engine/optimizer";
import { EngineConstraints, ShelfProduct, EngineOutput } from "@/types/engine";

type View = "landing" | "results" | "audit" | "product" | "verdict";

function mapYouCamToSkinType(youCamType: string | undefined): SkinType {
  if (!youCamType) return "normal";
  const lower = youCamType.toLowerCase();
  if (lower.includes("oily")) return "oily";
  if (lower.includes("dry")) return "dry";
  if (lower.includes("combination") || lower.includes("mix")) return "combination";
  return "normal";
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Use mock scan data for demo (or YouCam results in production)
  const [scanData, setScanData] = useState(mockScan);
  const [shelf, setShelf] = useState<ShelfProduct[]>(createDefaultShelf());
  const [constraints, setConstraints] = useState<EngineConstraints>({
    budgetInr: 3500,
    budgetUsd: 45,
    avoidedIngredients: [],
    routinePreference: "targeted",
    currency: "INR",
  });
  const [engineResult, setEngineResult] = useState<EngineOutput | null>(null);

  // Skin type profile state — initialized from YouCam scan detection
  const [skinProfile, setSkinProfile] = useState<SkinProfile>(() => {
    const detected = mapYouCamToSkinType(scanData.skinType?.type);
    return { type: detected, sensitive: "normal" };
  });

  // Run the engine when we have scan data and shelf
  const runEngine = () => {
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

  return (
    <div className="min-h-screen bg-[var(--surface-dark)] text-[var(--color-text-primary)]">
      {/* Main Content */}
      <main className="relative min-h-screen pt-[72px]">
        {currentView === "landing" && (
          <ScanLanding
            onStart={() => setCurrentView("results")}
            scanData={scanData}
            setScanData={setScanData}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        )}

        {currentView === "results" && (
          <ScanResultsView
            scan={scanData}
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

        {currentView === "audit" && (
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

        {currentView === "verdict" && (
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

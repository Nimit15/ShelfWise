"use client";

import { useState, useEffect } from "react";
import { ScanLanding } from "@/components/scan/scan-landing";
import { ScanResultsView } from "@/components/scan/scan-results-view";
import { ShelfAuditView } from "@/components/audit/shelf-audit-view";
import { ProductDetailView } from "@/components/audit/product-detail-view";
import { VerdictView } from "@/components/audit/verdict-view";
import { SkinType, Sensitivity } from "@/components/shelf/SkinTypeSelector";
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
  const [skinProfile, setSkinProfile] = useState<{ type: SkinType; sensitive: boolean }>(() => {
    const detected = mapYouCamToSkinType(scanData.skinType?.type);
    return { type: detected, sensitive: false };
  });

  // Run the engine when we have scan data and shelf
  const runEngine = () => {
    const result = runBioInventoryEngine(scanData, shelf, {
      ...constraints,
      userSkinType: skinProfile.type as 'oily' | 'dry' | 'combination' | 'normal',
      userSensitive: skinProfile.sensitive,
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
    <div className="min-h-screen bg-[var(--ca-alabaster)] text-[var(--ca-obsidian)]">
      {/* Header */}
      <header className="border-b border-[var(--ca-border)] bg-[var(--ca-cream)] sticky top-0 z-40">
        <div className="container-main flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-cormorant)" }}>
              ShelfWise
            </h1>
          </div>

          <div className="flex items-center gap-4">
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-main px-6 py-8">
        {currentView === "landing" && (
          <ScanLanding
            onStart={() => setCurrentView("results")}
            scanData={scanData}
            setScanData={setScanData}
          />
        )}

        {currentView === "results" && (
          <ScanResultsView
            scan={scanData}
            onAudit={() => setCurrentView("audit")}
            onBack={() => setCurrentView("landing")}
            skinProfile={skinProfile}
            onSkinProfileChange={setSkinProfile}
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
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--ca-border)] py-6 mt-16">
        <div className="container-main px-6 text-center text-sm text-[var(--ca-text-muted)]">
          <p>
            Powered by Perfect Corp YouCam V2.1 SD Skin Analysis API ·{" "}
            <span className="font-medium text-[var(--ca-amber)]">Buy Nothing - ₹0 Needed</span>
          </p>
          <p className="mt-1">
            Ephemeral demo — no selfies are stored. For the YouCam API skin health hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}

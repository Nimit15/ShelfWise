'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  ScanInput,
  ShelfProduct,
  EngineConstraints,
  EngineOutput,
  BiometricConflict,
  ChemicalConflict,
  RedundancyAlert,
  GapRecommendation,
  FunctionalRole,
} from '@/types/engine';
import type { YouCamConcern, YouCamSkinType } from '@/types/youcam';
import type { InferredSkinProfile, ActiveSkinProfile } from '@/lib/engine/skin-type-resolver';
import type { FullZoneMap } from '@/lib/youcam/zone-mapper';
import { validateSelfiePreflight, type PreflightResult } from '@/lib/youcam/preflight';

const STORAGE_KEYS = {
  SHELF: 'shelfwised:shelf',
  CONSTRAINTS: 'shelfwised:constraints',
  SKIN_TYPE_OVERRIDE: 'shelfwised:skinTypeOverride',
} as const;

export interface EngineState {
  // Scan data
  scan: ScanInput | null;
  rawScanResults: unknown | null;

  // Skin profile
  skinProfile: InferredSkinProfile | null;
  activeSkinProfile: ActiveSkinProfile | null;
  userOverride: Partial<Omit<InferredSkinProfile, 'confidence'>> | null;

  // Zone mapping
  zoneMap: FullZoneMap | null;

  // Shelf products
  shelf: ShelfProduct[];

  // Engine constraints
  constraints: EngineConstraints;

  // Engine output
  engineOutput: EngineOutput | null;

  // Loading states
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // Audit trail
  lastAuditTimestamp: string | null;
}

export interface EngineActions {
  // Scan actions
  setScan: (scan: ScanInput, rawResults?: unknown) => void;
  clearScan: () => void;

  // Skin profile actions
  setUserOverride: (override: Partial<Omit<InferredSkinProfile, 'confidence'>>) => void;
  clearUserOverride: () => void;
  resolveSkinProfile: () => ActiveSkinProfile;

  // Shelf actions
  setShelf: (shelf: ShelfProduct[]) => void;
  addProduct: (product: ShelfProduct) => void;
  removeProduct: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<ShelfProduct>) => void;
  clearShelf: () => void;

  // Constraints actions
  setConstraints: (constraints: Partial<EngineConstraints>) => void;
  setBudget: (budgetInr: number, budgetUsd: number) => void;
  setAvoidedIngredients: (ingredients: string[]) => void;
  setRoutinePreference: (preference: 'minimalist' | 'targeted') => void;
  setCurrency: (currency: 'INR' | 'USD') => void;
  setUserSkinType: (skinType: 'oily' | 'dry' | 'combination' | 'normal' | undefined) => void;
  setUserSensitive: (sensitive: boolean) => void;

  // Engine actions
  runEngine: () => Promise<EngineOutput | null>;
  analyzeShelf: (scan: ScanInput, shelf: ShelfProduct[], constraints: EngineConstraints) => Promise<EngineOutput>;

  // Utility actions
  clearError: () => void;
  reset: () => void;
  resetAll: () => void;
  exportClinicalSummary: (format?: 'json' | 'markdown') => string;
  validateSelfie: (file: File) => Promise<PreflightResult>;
}

const DEFAULT_CONSTRAINTS: EngineConstraints = {
  budgetInr: 3500,
  budgetUsd: 45,
  avoidedIngredients: [],
  routinePreference: 'targeted',
  currency: 'INR',
};

function loadInitialState(): EngineState {
  // Only run on client side
  if (typeof window === 'undefined') {
    return {
      scan: null,
      rawScanResults: null,
      skinProfile: null,
      activeSkinProfile: null,
      userOverride: null,
      zoneMap: null,
      shelf: [],
      constraints: DEFAULT_CONSTRAINTS,
      engineOutput: null,
      isLoading: false,
      isAnalyzing: false,
      error: null,
      lastAuditTimestamp: null,
    };
  }

  try {
    const savedShelf = localStorage.getItem(STORAGE_KEYS.SHELF);
    const savedConstraints = localStorage.getItem(STORAGE_KEYS.CONSTRAINTS);
    const savedSkinTypeOverride = localStorage.getItem(STORAGE_KEYS.SKIN_TYPE_OVERRIDE);

    return {
      scan: null,
      rawScanResults: null,
      skinProfile: null,
      activeSkinProfile: null,
      userOverride: null,
      zoneMap: null,
      shelf: savedShelf ? JSON.parse(savedShelf) : [],
      constraints: savedConstraints ? { ...DEFAULT_CONSTRAINTS, ...JSON.parse(savedConstraints) } : DEFAULT_CONSTRAINTS,
      engineOutput: null,
      isLoading: false,
      isAnalyzing: false,
      error: null,
      lastAuditTimestamp: null,
    };
  } catch {
    return {
      scan: null,
      rawScanResults: null,
      skinProfile: null,
      activeSkinProfile: null,
      userOverride: null,
      zoneMap: null,
      shelf: [],
      constraints: DEFAULT_CONSTRAINTS,
      engineOutput: null,
      isLoading: false,
      isAnalyzing: false,
      error: null,
      lastAuditTimestamp: null,
    };
  }
}

export function useShelfWiseEngine(): EngineState & EngineActions {
  const [state, setState] = useState<EngineState>(() => loadInitialState());

  // Helper to update state
  const updateState = useCallback((updates: Partial<EngineState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // --- Scan Actions ---
  const setScan = useCallback((scan: ScanInput, rawResults?: unknown) => {
    updateState({
      scan,
      rawScanResults: rawResults ?? null,
      error: null,
    });
  }, [updateState]);

  const clearScan = useCallback(() => {
    updateState({
      scan: null,
      rawScanResults: null,
      skinProfile: null,
      activeSkinProfile: null,
      zoneMap: null,
      engineOutput: null,
    });
  }, [updateState]);

  // --- Skin Profile Actions ---
  const setUserOverride = useCallback((override: Partial<Omit<InferredSkinProfile, 'confidence'>>) => {
    updateState({ userOverride: override });
  }, [updateState]);

  const clearUserOverride = useCallback(() => {
    updateState({ userOverride: null });
  }, [updateState]);

  const resolveSkinProfile = useCallback((): ActiveSkinProfile => {
    if (!state.skinProfile) {
      throw new Error('No skin profile to resolve. Run analysis first.');
    }

    // Import dynamically to avoid server-side issues
    const { resolveActiveSkinProfile } = require('@/lib/engine/skin-type-resolver');
    const resolved = resolveActiveSkinProfile(state.skinProfile, state.userOverride || undefined);
    updateState({ activeSkinProfile: resolved });
    return resolved;
  }, [state.skinProfile, state.userOverride, updateState]);

  // --- Shelf Actions ---
  const persistShelf = useCallback((shelf: ShelfProduct[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SHELF, JSON.stringify(shelf));
    }
  }, []);

  const setShelf = useCallback((shelf: ShelfProduct[]) => {
    updateState({ shelf });
    persistShelf(shelf);
  }, [updateState, persistShelf]);

  const addProduct = useCallback((product: ShelfProduct) => {
    const newShelf = [...state.shelf, product];
    updateState({ shelf: newShelf });
    persistShelf(newShelf);
  }, [state.shelf, updateState, persistShelf]);

  const removeProduct = useCallback((productId: string) => {
    const newShelf = state.shelf.filter(p => p.id !== productId);
    updateState({ shelf: newShelf });
    persistShelf(newShelf);
  }, [state.shelf, updateState, persistShelf]);

  const updateProduct = useCallback((productId: string, updates: Partial<ShelfProduct>) => {
    const newShelf = state.shelf.map(p => p.id === productId ? { ...p, ...updates } : p);
    updateState({ shelf: newShelf });
    persistShelf(newShelf);
  }, [state.shelf, updateState, persistShelf]);

  const clearShelf = useCallback(() => {
    updateState({ shelf: [] });
    persistShelf([]);
  }, [updateState, persistShelf]);

  // --- Constraints Actions ---
  const persistConstraints = useCallback((constraints: EngineConstraints) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONSTRAINTS, JSON.stringify(constraints));
    }
  }, []);

  const persistSkinTypeOverride = useCallback((skinType: 'oily' | 'dry' | 'combination' | 'normal' | undefined) => {
    if (typeof window !== 'undefined') {
      if (skinType) {
        localStorage.setItem(STORAGE_KEYS.SKIN_TYPE_OVERRIDE, skinType);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SKIN_TYPE_OVERRIDE);
      }
    }
  }, []);

  const setConstraints = useCallback((constraints: Partial<EngineConstraints>) => {
    const newConstraints = { ...state.constraints, ...constraints };
    updateState({ constraints: newConstraints });
    persistConstraints(newConstraints);
  }, [state.constraints, updateState, persistConstraints]);

  const setBudget = useCallback((budgetInr: number, budgetUsd: number) => {
    const newConstraints = { ...state.constraints, budgetInr, budgetUsd };
    updateState({ constraints: newConstraints });
    persistConstraints(newConstraints);
  }, [state.constraints, updateState, persistConstraints]);

  const setAvoidedIngredients = useCallback((ingredients: string[]) => {
    const newConstraints = { ...state.constraints, avoidedIngredients: ingredients };
    updateState({ constraints: newConstraints });
    persistConstraints(newConstraints);
  }, [state.constraints, updateState, persistConstraints]);

  const setRoutinePreference = useCallback((preference: 'minimalist' | 'targeted') => {
    const newConstraints = { ...state.constraints, routinePreference: preference };
    updateState({ constraints: newConstraints });
    persistConstraints(newConstraints);
  }, [state.constraints, updateState, persistConstraints]);

  const setCurrency = useCallback((currency: 'INR' | 'USD') => {
    const newConstraints = { ...state.constraints, currency };
    updateState({ constraints: newConstraints });
    persistConstraints(newConstraints);
  }, [state.constraints, updateState, persistConstraints]);

  const setUserSkinType = useCallback((skinType: 'oily' | 'dry' | 'combination' | 'normal' | undefined) => {
    const newConstraints = { ...state.constraints, userSkinType: skinType };
    updateState({ constraints: newConstraints });
    persistConstraints(newConstraints);
    persistSkinTypeOverride(skinType);
  }, [state.constraints, updateState, persistConstraints, persistSkinTypeOverride]);

  const setUserSensitive = useCallback((sensitive: boolean) => {
    const newConstraints = { ...state.constraints, userSensitive: sensitive };
    updateState({ constraints: newConstraints });
    persistConstraints(newConstraints);
  }, [state.constraints, updateState, persistConstraints]);

  // --- Engine Actions ---
  const analyzeShelf = useCallback(async (
    scan: ScanInput,
    shelf: ShelfProduct[],
    constraints: EngineConstraints
  ): Promise<EngineOutput> => {
    // Import dynamically to avoid server-side issues
    const { runBioInventoryEngine } = require('@/lib/engine/optimizer');
    const { inferSkinProfileFromScan } = require('@/lib/engine/skin-type-resolver');
    const { mapConcernsToZones } = require('@/lib/youcam/zone-mapper');

    // Infer skin profile
    const skinProfile = inferSkinProfileFromScan({
      concerns: scan.concerns,
      skinType: scan.skinType,
    });

    // Map to zones
    const zoneMap = mapConcernsToZones(
      scan.concerns,
      scan.skinType,
      scan.skinAge,
      scan.overallScore
    );

    // Merge constraints with inferred profile
    const effectiveConstraints: EngineConstraints = {
      ...constraints,
      userSkinType: constraints.userSkinType || skinProfile.skinType,
      userSensitive: constraints.userSensitive ?? skinProfile.isSensitive,
    };

    // Run engine
    const engineOutput = runBioInventoryEngine(scan, shelf, effectiveConstraints);

    // Resolve active skin profile
    const activeSkinProfile = require('@/lib/engine/skin-type-resolver').resolveActiveSkinProfile(
      skinProfile,
      constraints.userSkinType ? { skinType: constraints.userSkinType } : undefined
    );

    return { ...engineOutput };
  }, []);

  const runEngine = useCallback(async (): Promise<EngineOutput | null> => {
    if (!state.scan) {
      updateState({ error: 'No scan data available. Run a scan first.' });
      return null;
    }

    if (state.shelf.length === 0) {
      updateState({ error: 'No products on shelf. Add products first.' });
      return null;
    }

    updateState({ isAnalyzing: true, error: null });

    try {
      const engineOutput = await analyzeShelf(state.scan, state.shelf, state.constraints);

      updateState({
        engineOutput,
        isAnalyzing: false,
        lastAuditTimestamp: new Date().toISOString(),
      });

      return engineOutput;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      updateState({ isAnalyzing: false, error: message });
      return null;
    }
  }, [state.scan, state.shelf, state.constraints, analyzeShelf, updateState]);

  // --- Utility Actions ---
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const reset = useCallback(() => {
    setState(loadInitialState());
  }, []);

  const resetAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SHELF);
      localStorage.removeItem(STORAGE_KEYS.CONSTRAINTS);
      localStorage.removeItem(STORAGE_KEYS.SKIN_TYPE_OVERRIDE);
    }
    setState(loadInitialState());
  }, []);

  const exportClinicalSummary = useCallback((format: 'json' | 'markdown' = 'json'): string => {
    const { engineOutput, skinProfile, activeSkinProfile, zoneMap, constraints, shelf, scan } = state;

    const summary = {
      timestamp: new Date().toISOString(),
      scan: scan ? {
        skinType: scan.skinType,
        skinAge: scan.skinAge,
        overallScore: scan.overallScore,
        concernCount: scan.concerns.length,
      } : null,
      skinProfile: skinProfile ? {
        skinType: skinProfile.skinType,
        subCondition: skinProfile.subCondition,
        isSensitive: skinProfile.isSensitive,
        barrierHealth: skinProfile.barrierHealth,
        confidence: skinProfile.confidence,
      } : null,
      activeSkinProfile: activeSkinProfile ? {
        skinType: activeSkinProfile.skinType,
        subCondition: activeSkinProfile.subCondition,
        isSensitive: activeSkinProfile.isSensitive,
        barrierHealth: activeSkinProfile.barrierHealth,
        source: activeSkinProfile.source,
        overriddenFields: activeSkinProfile.overriddenFields,
      } : null,
      constraints,
      shelf: shelf.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        roles: p.roles,
        priceInr: p.priceInr,
        priceUsd: p.priceUsd,
        daysSupply: p.daysSupply,
        quantity: p.quantity,
      })),
      engineOutput: engineOutput ? {
        verdict: engineOutput.verdict,
        biometricConflicts: engineOutput.biometricConflicts.length,
        chemicalConflicts: engineOutput.chemicalConflicts.length,
        redundancyAlerts: engineOutput.redundancyAlerts.length,
        gapRecommendations: engineOutput.gapRecommendations.length,
        finalRoutine: engineOutput.finalRoutine,
        auditTrail: engineOutput.auditTrail,
      } : null,
    };

    if (format === 'json') {
      return JSON.stringify(summary, null, 2);
    }

    // Markdown format
    let md = '# ShelfWise Clinical Summary\n\n';
    md += `**Generated:** ${summary.timestamp}\n\n`;

    if (summary.scan) {
      md += `## Scan Data\n`;
      md += `- **Skin Type:** ${summary.scan.skinType.type} (${summary.scan.skinType.region})\n`;
      md += `- **Skin Age:** ${summary.scan.skinAge}\n`;
      md += `- **Overall Score:** ${summary.scan.overallScore}\n`;
      md += `- **Concerns Analyzed:** ${summary.scan.concernCount}\n\n`;
    }

    if (summary.skinProfile) {
      md += `## Inferred Skin Profile\n`;
      md += `- **Skin Type:** ${summary.skinProfile.skinType}\n`;
      md += `- **Sub-Condition:** ${summary.skinProfile.subCondition || 'none'}\n`;
      md += `- **Sensitive:** ${summary.skinProfile.isSensitive ? 'Yes' : 'No'}\n`;
      md += `- **Barrier Health:** ${summary.skinProfile.barrierHealth}\n`;
      md += `- **Confidence:** ${Math.round(summary.skinProfile.confidence * 100)}%\n\n`;
    }

    if (summary.activeSkinProfile) {
      md += `## Active Skin Profile (Applied)\n`;
      md += `- **Skin Type:** ${summary.activeSkinProfile.skinType}\n`;
      md += `- **Sub-Condition:** ${summary.activeSkinProfile.subCondition || 'none'}\n`;
      md += `- **Sensitive:** ${summary.activeSkinProfile.isSensitive ? 'Yes' : 'No'}\n`;
      md += `- **Barrier Health:** ${summary.activeSkinProfile.barrierHealth}\n`;
      md += `- **Source:** ${summary.activeSkinProfile.source}\n`;
      md += `- **Overridden Fields:** ${summary.activeSkinProfile.overriddenFields.join(', ') || 'none'}\n\n`;
    }

    md += `## Engine Constraints\n`;
    md += `- **Budget:** ₹${summary.constraints.budgetInr} / $${summary.constraints.budgetUsd}\n`;
    md += `- **Currency:** ${summary.constraints.currency}\n`;
    md += `- **Routine Preference:** ${summary.constraints.routinePreference}\n`;
    md += `- **User Skin Type:** ${summary.constraints.userSkinType || 'not set'}\n`;
    md += `- **User Sensitive:** ${summary.constraints.userSensitive ? 'Yes' : 'No'}\n`;
    md += `- **Avoided Ingredients:** ${summary.constraints.avoidedIngredients.join(', ') || 'none'}\n\n`;

    md += `## Shelf Products (${summary.shelf.length})\n`;
    for (const product of summary.shelf) {
      md += `- **${product.name}** (${product.brand}) — ${product.roles.join(', ')} — ₹${product.priceInr} / $${product.priceUsd} — ${product.daysSupply} days × ${product.quantity}\n`;
    }
    md += '\n';

    if (summary.engineOutput) {
      md += `## Engine Output\n`;
      md += `- **Verdict:** ${summary.engineOutput.verdict.type} — ${summary.engineOutput.verdict.message}\n`;
      md += `- **Total Cost:** ₹${summary.engineOutput.verdict.totalCostInr} / $${summary.engineOutput.verdict.totalCostUsd}\n`;
      md += `- **Money Saved:** ₹${summary.engineOutput.verdict.moneySavedInr} / $${summary.engineOutput.verdict.moneySavedUsd}\n`;
      md += `- **Biometric Conflicts:** ${summary.engineOutput.biometricConflicts}\n`;
      md += `- **Chemical Conflicts:** ${summary.engineOutput.chemicalConflicts}\n`;
      md += `- **Redundancy Alerts:** ${summary.engineOutput.redundancyAlerts}\n`;
      md += `- **Gap Recommendations:** ${summary.engineOutput.gapRecommendations}\n\n`;

      md += `### Final Routine\n`;
      md += `**AM:**\n`;
      for (const step of summary.engineOutput.finalRoutine.AM) {
        md += `- Step ${step.step}: ${step.productName} (${step.role})\n`;
      }
      md += `**PM:**\n`;
      for (const step of summary.engineOutput.finalRoutine.PM) {
        md += `- Step ${step.step}: ${step.productName} (${step.role})\n`;
      }
      md += '\n';
    }

    return md;
  }, [state]);

  // Auto-resolve skin profile when scan changes
  useEffect(() => {
    if (state.scan && !state.skinProfile) {
      // Import dynamically
      const { inferSkinProfileFromScan, resolveActiveSkinProfile } = require('@/lib/engine/skin-type-resolver');
      const { mapConcernsToZones } = require('@/lib/youcam/zone-mapper');

      const skinProfile = inferSkinProfileFromScan({
        concerns: state.scan.concerns,
        skinType: state.scan.skinType,
      });

      const zoneMap = mapConcernsToZones(
        state.scan.concerns,
        state.scan.skinType,
        state.scan.skinAge,
        state.scan.overallScore
      );

      const activeSkinProfile = resolveActiveSkinProfile(
        skinProfile,
        state.userOverride || undefined
      );

      updateState({ skinProfile, zoneMap, activeSkinProfile });
    }
  }, [state.scan, state.userOverride, updateState]);

  return {
    // State
    ...state,

    // Actions
    setScan,
    clearScan,
    setUserOverride,
    clearUserOverride,
    resolveSkinProfile,
    setShelf,
    addProduct,
    removeProduct,
    updateProduct,
    clearShelf,
    setConstraints,
    setBudget,
    setAvoidedIngredients,
    setRoutinePreference,
    setCurrency,
    setUserSkinType,
    setUserSensitive,
    runEngine,
    analyzeShelf,
    clearError,
    reset,
    resetAll,
    exportClinicalSummary,
    validateSelfie: validateSelfiePreflight,
  };
}
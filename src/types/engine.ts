import { YouCamConcern, YouCamSkinType } from '@/types/youcam';
import { Product, FunctionalRole, TextureVehicle } from '@/data/catalog';

export type SkinType = 'oily' | 'dry' | 'combination' | 'normal';

// Re-export types from catalog for convenience
export type { FunctionalRole, TextureVehicle };

export interface ScanInput {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
  skinAge: number;
  overallScore: number;
}

export interface ShelfProduct extends Product {
  quantity?: number;
}

export interface EngineConstraints {
  budgetInr?: number;
  budgetUsd?: number;
  avoidedIngredients: string[];
  routinePreference: 'minimalist' | 'targeted';
  currency: 'INR' | 'USD';
  userSkinType?: SkinType;
  userSensitive?: boolean;
}

export interface BiometricConflict {
  productId: string;
  productName: string;
  concern: string;
  concernScore: number;
  conflictType: 'barrier' | 'irritancy' | 'sensitivity';
  severity: 'high' | 'medium' | 'low';
  recommendation: 'pause' | 'reduce_frequency' | 'buffer';
  explanation: string;
  daysToPause: number;
}

export interface ChemicalConflict {
  productIdA: string;
  productNameA: string;
  productIdB: string;
  productNameB: string;
  conflictType: 'same_slot_incompatible' | 'am_pm_separation_possible' | 'must_pause_one';
  ingredients: string[];
  explanation: string;
  resolution: 'separate_am_pm' | 'alternate_days' | 'pause_one';
  affectedSlot: 'AM' | 'PM' | 'BOTH';
}

export interface RedundancyAlert {
  role: FunctionalRole;
  products: ShelfProduct[];
  redundantValueInr: number;
  redundantValueUsd: number;
  recommendation: 'keep_best' | 'consolidate';
  keptProductId: string;
  removedProductIds: string[];
}

export interface GapRecommendation {
  concern: string;
  concernScore: number;
  recommendedProduct: Product | null;
  rationale: string;
  exclusionRationales: Array<{
    productId: string;
    productName: string;
    reason: 'already_covered' | 'biometric_conflict' | 'chemical_conflict' | 'budget_exceeded' | 'avoided_ingredient' | 'role_redundant';
    details: string;
  }>;
  costInr: number;
  costUsd: number;
  costPerDayInr: number;
  costPerDayUsd: number;
}

export interface VehicleCompatibilityIssue {
  productIdA: string;
  productIdB: string;
  vehicleA: TextureVehicle;
  vehicleB: TextureVehicle;
  suggestion: string;
}

export interface EngineOutput {
  scanSummary: {
    priorityConcerns: Array<{ concern: string; score: number; stars: number }>;
    strengths: Array<{ concern: string; score: number; stars: number }>;
    skinType: YouCamSkinType;
    skinAge: number;
    overallScore: number;
  };
  biometricConflicts: BiometricConflict[];
  chemicalConflicts: ChemicalConflict[];
  redundancyAlerts: RedundancyAlert[];
  gapRecommendations: GapRecommendation[];
  finalRoutine: {
    AM: Array<{ productId: string; productName: string; role: FunctionalRole; step: number }>;
    PM: Array<{ productId: string; productName: string; role: FunctionalRole; step: number }>;
  };
  verdict: {
    type: 'buy_nothing' | 'minimal_addition' | 'targeted_addition';
    totalCostInr: number;
    totalCostUsd: number;
    moneySavedInr: number;
    moneySavedUsd: number;
    message: string;
  };
  auditTrail: {
    productsAnalyzed: number;
    conflictsFound: number;
    redundanciesFound: number;
    gapsIdentified: number;
    productsRecommended: number;
    barrierLoadScore: number;
    compatibilityScore: number;
  };
}
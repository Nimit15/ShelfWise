import { EngineOutput, ShelfProduct, EngineConstraints, FunctionalRole, TextureVehicle } from '@/types/engine';

export interface ImpactTelemetry {
  // Cost savings
  redundantShelfValueSaved: { inr: number; usd: number };
  genericRoutineSavings: { inr: number; usd: number };
  currentShelfCostPerDay: { inr: number; usd: number };
  optimizedCartCostPerDay: { inr: number; usd: number };

  // Conflict interception
  totalConflictsIntercepted: number;
  biometricConflictsIntercepted: number;
  chemicalConflictsIntercepted: number;
  vehicleMismatchesIntercepted: number;
  barrierOverloadIntercepted: number;

  // Barrier safety
  barrierSafetyScore: { before: number; after: number };

  // Metadata
  currency: 'INR' | 'USD';
  calculatedAt: string;
}

/**
 * Standard 6-step generic routine costs (for comparison)
 * Average market prices in INR/USD
 */
const GENERIC_ROUTINE = {
  steps: [
    { role: 'cleanser' as FunctionalRole, avgInr: 499, avgUsd: 6, daysSupply: 90 },
    { role: 'hydrator' as FunctionalRole, avgInr: 699, avgUsd: 9, daysSupply: 45 },
    { role: 'exfoliant_aha_bha' as FunctionalRole, avgInr: 799, avgUsd: 10, daysSupply: 60 },
    { role: 'retinoid' as FunctionalRole, avgInr: 999, avgUsd: 12, daysSupply: 90 },
    { role: 'antioxidant_vit_c' as FunctionalRole, avgInr: 1199, avgUsd: 14, daysSupply: 45 },
    { role: 'sunscreen_spf' as FunctionalRole, avgInr: 799, avgUsd: 10, daysSupply: 60 },
  ],
};

/**
 * Calculate cost per day for a shelf
 */
function calculateShelfCostPerDay(shelf: ShelfProduct[]): { inr: number; usd: number } {
  let totalInrPerDay = 0;
  let totalUsdPerDay = 0;

  for (const product of shelf) {
    const dailyInr = product.priceInr / product.daysSupply;
    const dailyUsd = product.priceUsd / product.daysSupply;
    totalInrPerDay += dailyInr * (product.quantity || 1);
    totalUsdPerDay += dailyUsd * (product.quantity || 1);
  }

  return {
    inr: Math.round(totalInrPerDay * 100) / 100,
    usd: Math.round(totalUsdPerDay * 100) / 100,
  };
}

/**
 * Calculate total value of redundant/conflicting products
 */
function calculateRedundantValue(
  output: EngineOutput,
  shelf: ShelfProduct[],
  currency: 'INR' | 'USD'
): { inr: number; usd: number } {
  let redundantInr = 0;
  let redundantUsd = 0;

  // Products flagged in redundancy alerts
  const redundantProductIds = new Set<string>();
  for (const alert of output.redundancyAlerts) {
    alert.removedProductIds.forEach(id => redundantProductIds.add(id));
  }

  // Products in biometric conflicts (paused)
  const pausedProductIds = new Set<string>();
  for (const conflict of output.biometricConflicts) {
    if (conflict.recommendation === 'pause') {
      pausedProductIds.add(conflict.productId);
    }
  }

  // Products in chemical conflicts (alternated or paused)
  const chemicalProductIds = new Set<string>();
  for (const conflict of output.chemicalConflicts) {
    chemicalProductIds.add(conflict.productIdA);
    chemicalProductIds.add(conflict.productIdB);
  }

  const allFlaggedIds = new Set([...redundantProductIds, ...pausedProductIds, ...chemicalProductIds]);

  for (const product of shelf) {
    if (allFlaggedIds.has(product.id)) {
      redundantInr += product.priceInr * (product.quantity || 1);
      redundantUsd += product.priceUsd * (product.quantity || 1);
    }
  }

  return {
    inr: Math.round(redundantInr),
    usd: Math.round(redundantUsd),
  };
}

/**
 * Calculate vehicle mismatch count from audit trail
 */
function countVehicleMismatches(shelf: ShelfProduct[], output: EngineOutput): number {
  // This would ideally come from the audit trail, but we estimate from conflicts
  // For now, count chemical conflicts that involve vehicle incompatibility
  let count = 0;
  for (const conflict of output.chemicalConflicts) {
    if (conflict.conflictType === 'same_slot_incompatible') {
      count++;
    }
  }
  return count;
}

/**
 * Calculate barrier overload score
 * Based on total irritancy of shelf vs safe threshold
 */
function calculateBarrierSafetyScore(output: EngineOutput, shelf: ShelfProduct[], constraints: EngineConstraints): { before: number; after: number } {
  // Calculate total irritancy load of current shelf
  let totalIrritancy = 0;
  let activeProductCount = 0;

  for (const product of shelf) {
    totalIrritancy += product.irritancyScore * (product.quantity || 1);
    activeProductCount++;
  }

  // Normalize: 0 irritancy = 100 score, 50+ irritancy = 0 score (per product)
  const maxIrritancyPerProduct = 10;
  const maxTotalIrritancy = maxIrritancyPerProduct * activeProductCount;

  let beforeScore = 100 - Math.min(100, (totalIrritancy / Math.max(1, maxTotalIrritancy)) * 100);
  beforeScore = Math.max(0, Math.round(beforeScore));

  // After: only count kept products in final routine
  const keptProductIds = new Set<string>();
  for (const routine of [output.finalRoutine.AM, output.finalRoutine.PM]) {
    for (const step of routine) {
      keptProductIds.add(step.productId);
    }
  }

  let afterIrritancy = 0;
  let afterProductCount = 0;

  for (const product of shelf) {
    if (keptProductIds.has(product.id)) {
      afterIrritancy += product.irritancyScore;
      afterProductCount++;
    }
  }

  const maxAfterIrritancy = maxIrritancyPerProduct * afterProductCount;
  let afterScore = afterProductCount === 0 ? 100 : 100 - Math.min(100, (afterIrritancy / Math.max(1, maxAfterIrritancy)) * 100);
  afterScore = Math.max(0, Math.round(afterScore));

  return { before: beforeScore, after: afterScore };
}

/**
 * Calculate generic routine cost per day
 */
function calculateGenericRoutineCostPerDay(): { inr: number; usd: number } {
  let inr = 0;
  let usd = 0;

  for (const step of GENERIC_ROUTINE.steps) {
    inr += step.avgInr / step.daysSupply;
    usd += step.avgUsd / step.daysSupply;
  }

  return {
    inr: Math.round(inr * 100) / 100,
    usd: Math.round(usd * 100) / 100,
  };
}

/**
 * Main telemetry calculation
 */
export function calculateImpactTelemetry(
  output: EngineOutput,
  shelf: ShelfProduct[],
  constraints: EngineConstraints
): ImpactTelemetry {
  const currency = constraints.currency || 'INR';

  // Current shelf cost per day
  const currentShelfCostPerDay = calculateShelfCostPerDay(shelf);

  // Optimized cart (final routine) cost per day
  const keptProductIds = new Set<string>();
  for (const routine of [output.finalRoutine.AM, output.finalRoutine.PM]) {
    for (const step of routine) {
      keptProductIds.add(step.productId);
    }
  }

  const optimizedShelf = shelf.filter(p => keptProductIds.has(p.id));
  const optimizedCartCostPerDay = calculateShelfCostPerDay(optimizedShelf);

  // Redundant/conflicting value saved
  const redundantShelfValueSaved = calculateRedundantValue(output, shelf, currency);

  // Generic routine comparison
  const genericCostPerDay = calculateGenericRoutineCostPerDay();
  const genericRoutineSavings = {
    inr: Math.max(0, Math.round((genericCostPerDay.inr - optimizedCartCostPerDay.inr) * 100) / 100),
    usd: Math.max(0, Math.round((genericCostPerDay.usd - optimizedCartCostPerDay.usd) * 100) / 100),
  };

  // Conflict counts
  const biometricConflictsIntercepted = output.biometricConflicts.length;
  const chemicalConflictsIntercepted = output.chemicalConflicts.length;
  const vehicleMismatchesIntercepted = countVehicleMismatches(shelf, output);

  // Barrier overload = biometric conflicts with barrier/irritancy type
  const barrierOverloadIntercepted = output.biometricConflicts.filter(
    c => c.conflictType === 'barrier' || c.conflictType === 'irritancy'
  ).length;

  // Barrier safety score
  const barrierSafetyScore = calculateBarrierSafetyScore(output, shelf, constraints);

  return {
    redundantShelfValueSaved,
    genericRoutineSavings,
    currentShelfCostPerDay,
    optimizedCartCostPerDay,
    totalConflictsIntercepted:
      biometricConflictsIntercepted +
      chemicalConflictsIntercepted +
      vehicleMismatchesIntercepted +
      barrierOverloadIntercepted,
    biometricConflictsIntercepted,
    chemicalConflictsIntercepted,
    vehicleMismatchesIntercepted,
    barrierOverloadIntercepted,
    barrierSafetyScore,
    currency,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Simplified telemetry for quick display
 */
export interface TelemetrySummary {
  moneySaved: { inr: number; usd: number };
  conflictsStopped: number;
  barrierImprovement: number; // after - before
  routineCostPerDay: { inr: number; usd: number };
}

export function summarizeTelemetry(telemetry: ImpactTelemetry): TelemetrySummary {
  return {
    moneySaved: {
      inr: telemetry.redundantShelfValueSaved.inr + telemetry.genericRoutineSavings.inr,
      usd: telemetry.redundantShelfValueSaved.usd + telemetry.genericRoutineSavings.usd,
    },
    conflictsStopped: telemetry.totalConflictsIntercepted,
    barrierImprovement: telemetry.barrierSafetyScore.after - telemetry.barrierSafetyScore.before,
    routineCostPerDay: telemetry.optimizedCartCostPerDay,
  };
}
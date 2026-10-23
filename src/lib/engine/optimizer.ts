import { Product, FunctionalRole, TextureVehicle, CATALOG, getProductById, calculateCostPerDay, calculateCostPerMonth } from '@/data/catalog';
import { YouCamConcern } from '@/types/youcam';
import {
  ScanInput,
  ShelfProduct,
  EngineConstraints,
  BiometricConflict,
  ChemicalConflict,
  RedundancyAlert,
  GapRecommendation,
  EngineOutput,
} from '@/types/engine';

// Thresholds for biometric conflicts
const BARRIER_CONCERN_THRESHOLDS: Record<string, number> = {
  moisture: 60,
  redness: 65,
  texture: 55,
};

const HIGH_IRRITANCY_ROLES: FunctionalRole[] = [
  'exfoliant_aha_bha',
  'retinoid',
  'antioxidant_vit_c',
  'azelaic_treatment',
];

const INCOMPATIBLE_PAIRS: Array<{
  roleA: FunctionalRole;
  roleB: FunctionalRole;
  type: 'same_slot_incompatible' | 'am_pm_separation_possible' | 'must_pause_one';
  ingredients: string[];
}> = [
  { roleA: 'exfoliant_aha_bha', roleB: 'retinoid', type: 'same_slot_incompatible', ingredients: ['AHA/BHA', 'Retinoid'] },
  { roleA: 'exfoliant_aha_bha', roleB: 'antioxidant_vit_c', type: 'am_pm_separation_possible', ingredients: ['AHA/BHA', 'Vitamin C (L-AA)'] },
  { roleA: 'retinoid', roleB: 'antioxidant_vit_c', type: 'am_pm_separation_possible', ingredients: ['Retinoid', 'Vitamin C (L-AA)'] },
  { roleA: 'retinoid', roleB: 'azelaic_treatment', type: 'am_pm_separation_possible', ingredients: ['Retinoid', 'Azelaic Acid'] },
  { roleA: 'exfoliant_aha_bha', roleB: 'azelaic_treatment', type: 'am_pm_separation_possible', ingredients: ['AHA/BHA', 'Azelaic Acid'] },
];

const ROLE_PRIORITY: Record<FunctionalRole, number> = {
  'sunscreen_spf': 1,
  'cleanser': 2,
  'hydrator': 3,
  'barrier_repair': 4,
  'retinoid': 5,
  'antioxidant_vit_c': 6,
  'niacinamide_pore': 7,
  'azelaic_treatment': 8,
  'exfoliant_aha_bha': 9,
  'eye_treatment': 10,
};

/**
 * Vehicle compatibility matrix
 * Maps each texture vehicle to compatible vehicles for layering
 * Incompatible pairs are flagged for routine warnings
 */
export const VEHICLE_COMPATIBILITY: Record<TextureVehicle, TextureVehicle[]> = {
  'gel': ['gel', 'light_fluid', 'lotion', 'foam_cleanser'],
  'light_fluid': ['gel', 'light_fluid', 'lotion', 'cream_cleanser', 'foam_cleanser', 'balm_oil'],
  'lotion': ['gel', 'light_fluid', 'lotion', 'cream', 'cream_cleanser', 'foam_cleanser'],
  'rich_cream': ['lotion', 'rich_cream', 'cream', 'balm_oil'],
  'balm_oil': ['balm_oil', 'light_fluid', 'lotion', 'rich_cream', 'cream'],
  'foam_cleanser': ['gel', 'light_fluid', 'lotion', 'foam_cleanser', 'cream_cleanser'],
  'cream_cleanser': ['light_fluid', 'lotion', 'cream', 'cream_cleanser', 'rich_cream'],
  'cream': ['lotion', 'rich_cream', 'cream', 'balm_oil'],
};

/**
 * Barrier load weight per product role
 * Higher values = more likely to compromise the skin barrier
 */
export const BARRIER_LOAD_WEIGHTS: Record<FunctionalRole, number> = {
  'cleanser': 1,
  'hydrator': 1,
  'exfoliant_aha_bha': 4,
  'retinoid': 5,
  'antioxidant_vit_c': 3,
  'barrier_repair': -3, // Negative = barrier-supporting
  'azelaic_treatment': 3,
  'niacinamide_pore': 2,
  'eye_treatment': 1,
  'sunscreen_spf': 0,
};

/**
 * Compatibility score weights for evaluating routine combinations
 */
export const COMPATIBILITY_SCORE_WEIGHTS = {
  barrierLoad: 0.35,
  vehicleCompatibility: 0.25,
  chemicalConflictRisk: 0.25,
  skinTypeMatch: 0.15,
} as const;

/**
 * Calculate the barrier load for a set of products on a shelf
 * Barrier load = sum of irritancy scores weighted by role
 * Returns a score from 0-100 (higher = more barrier stress)
 */
export function calculateBarrierLoad(shelf: ShelfProduct[]): number {
  let totalLoad = 0;
  let productCount = 0;

  for (const product of shelf) {
    let roleLoad = 0;
    for (const role of product.roles) {
      roleLoad += BARRIER_LOAD_WEIGHTS[role] || 2;
    }
    const avgRoleLoad = roleLoad / product.roles.length;
    totalLoad += product.irritancyScore * avgRoleLoad;
    productCount++;
  }

  if (productCount === 0) return 0;

  // Normalize to 0-100 scale
  const avgLoad = totalLoad / productCount;
  return Math.min(100, Math.round((avgLoad / 10) * 100));
}

/**
 * Check if two texture vehicles are compatible for layering
 */
export function areVehiclesCompatible(
  vehicleA: TextureVehicle,
  vehicleB: TextureVehicle
): boolean {
  const compatibleA = VEHICLE_COMPATIBILITY[vehicleA] || [];
  const compatibleB = VEHICLE_COMPATIBILITY[vehicleB] || [];

  return compatibleA.includes(vehicleB) || compatibleB.includes(vehicleA);
}

/**
 * Calculate a compatibility score for a set of products
 * Returns a score from 0-100 (higher = better compatibility)
 */
export function calculateCompatibilityScore(
  shelf: ShelfProduct[],
  scan: ScanInput,
  constraints: EngineConstraints
): number {
  if (shelf.length === 0) return 100;

  const scores: number[] = [];

  // 1. Barrier load score (lower load = higher compatibility score)
  const barrierLoad = calculateBarrierLoad(shelf);
  const barrierScore = 100 - barrierLoad;
  scores.push(barrierScore);

  // 2. Vehicle compatibility score
  let vehicleCompatibleCount = 0;
  let vehicleTotalCount = 0;
  for (let i = 0; i < shelf.length; i++) {
    for (let j = i + 1; j < shelf.length; j++) {
      vehicleTotalCount++;
      if (areVehiclesCompatible(shelf[i].textureVehicle, shelf[j].textureVehicle)) {
        vehicleCompatibleCount++;
      }
    }
  }
  const vehicleScore = vehicleTotalCount > 0
    ? (vehicleCompatibleCount / vehicleTotalCount) * 100
    : 100;
  scores.push(vehicleScore);

  // 3. Chemical conflict risk score (fewer conflicts = higher score)
  let conflictCount = 0;
  let potentialConflictCount = 0;
  for (let i = 0; i < shelf.length; i++) {
    for (let j = i + 1; j < shelf.length; j++) {
      const prodA = shelf[i];
      const prodB = shelf[j];
      const sharedSlots = (prodA.usageTime === 'PM' || prodA.usageTime === 'BOTH') &&
        (prodB.usageTime === 'PM' || prodB.usageTime === 'BOTH');
      if (sharedSlots) {
        potentialConflictCount++;
        for (const roleA of prodA.roles) {
          for (const roleB of prodB.roles) {
            const pair = INCOMPATIBLE_PAIRS.find(p =>
              (p.roleA === roleA && p.roleB === roleB) || (p.roleA === roleB && p.roleB === roleA)
            );
            if (pair) {
              conflictCount++;
            }
          }
        }
      }
    }
  }
  const conflictScore = potentialConflictCount > 0
    ? ((potentialConflictCount - conflictCount) / potentialConflictCount) * 100
    : 100;
  scores.push(conflictScore);

  // 4. Skin type match score
  let skinTypeMatchScore = 100;
  if (constraints.userSkinType) {
    let matches = 0;
    let total = 0;
    for (const product of shelf) {
      total++;
      const isCompatible = !product.incompatibleSkinTypes ||
        !product.incompatibleSkinTypes.includes(constraints.userSkinType!);
      if (isCompatible) matches++;
    }
    skinTypeMatchScore = total > 0 ? (matches / total) * 100 : 100;
  }
  scores.push(skinTypeMatchScore);

  // Weighted average
  return Math.round(
    barrierScore * COMPATIBILITY_SCORE_WEIGHTS.barrierLoad +
    vehicleScore * COMPATIBILITY_SCORE_WEIGHTS.vehicleCompatibility +
    conflictScore * COMPATIBILITY_SCORE_WEIGHTS.chemicalConflictRisk +
    skinTypeMatchScore * COMPATIBILITY_SCORE_WEIGHTS.skinTypeMatch
  );
}

/**
 * Get vehicle compatibility issues for a routine
 */
export function getVehicleCompatibilityIssues(
  routineProducts: ShelfProduct[]
): Array<{ productIdA: string; productIdB: string; vehicleA: TextureVehicle; vehicleB: TextureVehicle; suggestion: string }> {
  const issues: Array<{
    productIdA: string;
    productIdB: string;
    vehicleA: TextureVehicle;
    vehicleB: TextureVehicle;
    suggestion: string;
  }> = [];

  const suggestionMap: Record<string, string> = {
    'rich_cream-cream': 'Consider using the rich cream first, then apply the cream layer — both are occlusive and may pill if applied simultaneously.',
    'rich_cream-balm_oil': 'Rich cream and balm oil are both occlusive. Layer the lighter texture first to avoid pilling.',
    'balm_oil-gel': 'Oil and gel can separate. Apply oil last in the PM routine.',
    'lotion-gel': 'Lotion and gel can be mixed but may feel heavy. Consider using one or the other.',
  };

  for (let i = 0; i < routineProducts.length; i++) {
    for (let j = i + 1; j < routineProducts.length; j++) {
      const prodA = routineProducts[i];
      const prodB = routineProducts[j];

      if (prodA.usageTime === 'AM' && prodB.usageTime === 'AM') {
        if (!areVehiclesCompatible(prodA.textureVehicle, prodB.textureVehicle)) {
          const key = `${prodA.textureVehicle}-${prodB.textureVehicle}`;
          const reverseKey = `${prodB.textureVehicle}-${prodA.textureVehicle}`;
          const suggestion = suggestionMap[key] || suggestionMap[reverseKey] || 'These textures may not layer well together.';

          issues.push({
            productIdA: prodA.id,
            productIdB: prodB.id,
            vehicleA: prodA.textureVehicle,
            vehicleB: prodB.textureVehicle,
            suggestion,
          });
        }
      }
    }
  }

  return issues;
}

function starRating(uiScore: number): number {
  if (uiScore >= 85) return 5;
  if (uiScore >= 70) return 4;
  if (uiScore >= 55) return 3;
  if (uiScore >= 40) return 2;
  return 1;
}

function getPriorityConcerns(concerns: YouCamConcern[], count = 3): Array<{ concern: string; score: number; stars: number }> {
  return concerns
    .filter(c => c.uiScore !== undefined && c.type !== 'skin_type')
    .sort((a, b) => a.uiScore - b.uiScore || a.type.localeCompare(b.type))
    .slice(0, count)
    .map(c => ({ concern: c.type, score: c.uiScore, stars: starRating(c.uiScore) }));
}

function getStrengths(concerns: YouCamConcern[], count = 3): Array<{ concern: string; score: number; stars: number }> {
  return concerns
    .filter(c => c.uiScore !== undefined && c.type !== 'skin_type')
    .sort((a, b) => b.uiScore - a.uiScore || a.type.localeCompare(b.type))
    .slice(0, count)
    .map(c => ({ concern: c.type, score: c.uiScore, stars: starRating(c.uiScore) }));
}

export function runBioInventoryEngine(
  scan: ScanInput,
  shelf: ShelfProduct[],
  constraints: EngineConstraints
): EngineOutput {
  const currency = constraints.currency;
  const budget = currency === 'INR' ? (constraints.budgetInr || Infinity) : (constraints.budgetUsd || Infinity);
  const avoidedIngredients = constraints.avoidedIngredients.map(i => i.toLowerCase());
  const userSkinType = constraints.userSkinType;
  const userSensitive = constraints.userSensitive;

  // 1. Scan Summary
  const priorityConcerns = getPriorityConcerns(scan.concerns, 3);
  const strengths = getStrengths(scan.concerns, 3);

  // 2. Biometric Conflicts (Scan-to-Shelf)
  const biometricConflicts: BiometricConflict[] = [];
  for (const product of shelf) {
    // Check barrier-impairing concerns
    for (const [concernName, threshold] of Object.entries(BARRIER_CONCERN_THRESHOLDS)) {
      const concern = scan.concerns.find(c => c.type === concernName);
      if (concern && concern.uiScore < threshold) {
        // Check if product has high-irritancy roles
        const hasHighIrritancyRole = product.roles.some(r => HIGH_IRRITANCY_ROLES.includes(r));

        if (hasHighIrritancyRole || product.irritancyScore >= 4) {
          const severity = concern.uiScore < 40 ? 'high' : concern.uiScore < 55 ? 'medium' : 'low';
          const conflictType = concern.uiScore < threshold ? 'barrier' : 'sensitivity';
          const recommendation = concern.uiScore < 40 ? 'pause' : 'reduce_frequency';
          biometricConflicts.push({
            productId: product.id,
            productName: product.name,
            concern: concernName,
            concernScore: concern.uiScore,
            conflictType,
            severity,
            recommendation,
            explanation: `Your ${concernName} score (${concern.uiScore}/100) indicates compromised barrier. ${product.name} contains ${product.roles.filter(r => HIGH_IRRITANCY_ROLES.includes(r)).join(', ')} which may worsen this.`,
            daysToPause: concern.uiScore < 40 ? 14 : 7,
          });
        }
      }
    }

    // Check avoided ingredients
    for (const active of product.activeIngredients) {
      if (avoidedIngredients.some(avoided => active.name.toLowerCase().includes(avoided))) {
        biometricConflicts.push({
          productId: product.id,
          productName: product.name,
          concern: 'avoided_ingredient',
          concernScore: 0,
          conflictType: 'sensitivity',
          severity: 'high',
          recommendation: 'pause',
          explanation: `Contains ${active.name} which is in your avoided ingredients list.`,
          daysToPause: 14,
        });
      }
    }

    // Check skin type compatibility
    if (userSkinType && product.incompatibleSkinTypes?.includes(userSkinType)) {
      const vehicleText = product.textureVehicle ? ` (${product.textureVehicle})` : '';
      biometricConflicts.push({
        productId: product.id,
        productName: product.name,
        concern: 'skin_type_mismatch',
        concernScore: 0,
        conflictType: 'sensitivity',
        severity: 'high',
        recommendation: 'pause',
        explanation: `Product texture${vehicleText} is not suitable for ${userSkinType} skin. Consider a lighter, oil-free alternative.`,
        daysToPause: 14,
      });
    }

    // Check sensitive compatibility
    if (userSensitive && product.safeForSensitive === false) {
      biometricConflicts.push({
        productId: product.id,
        productName: product.name,
        concern: 'sensitive_reactive',
        concernScore: 0,
        conflictType: 'sensitivity',
        severity: 'high',
        recommendation: 'pause',
        explanation: `Not safe for sensitive skin. Contains actives that may cause irritation or stinging.`,
        daysToPause: 14,
      });
    }
  }

  // 3. Chemical Conflicts (Shelf-to-Shelf)
  const chemicalConflicts: ChemicalConflict[] = [];
  for (let i = 0; i < shelf.length; i++) {
    for (let j = i + 1; j < shelf.length; j++) {
      const prodA = shelf[i];
      const prodB = shelf[j];

      // Check for overlapping usage with incompatible roles
      const sharedSlots = (prodA.usageTime === 'PM' || prodA.usageTime === 'BOTH') &&
        (prodB.usageTime === 'PM' || prodB.usageTime === 'BOTH');

      if (sharedSlots) {
        for (const roleA of prodA.roles) {
          for (const roleB of prodB.roles) {
            const pair = INCOMPATIBLE_PAIRS.find(p =>
              (p.roleA === roleA && p.roleB === roleB) || (p.roleA === roleB && p.roleB === roleA)
            );
            if (pair) {
              const canSeparate = pair.type === 'am_pm_separation_possible';
              const resolution = canSeparate ? 'separate_am_pm' : 'pause_one';

              chemicalConflicts.push({
                productIdA: prodA.id,
                productNameA: prodA.name,
                productIdB: prodB.id,
                productNameB: prodB.name,
                conflictType: pair.type,
                ingredients: pair.ingredients,
                explanation: `${prodA.name} (${roleA}) and ${prodB.name} (${roleB}) both used in PM. ${pair.ingredients.join(' + ')} can cause irritation when layered.`,
                resolution,
                affectedSlot: 'PM',
              });
            }
          }
        }
      }
    }
  }

  // 4. Role Redundancy
  const redundancyAlerts: RedundancyAlert[] = [];
  const roleMap = new Map<FunctionalRole, ShelfProduct[]>();

  for (const product of shelf) {
    for (const role of product.roles) {
      if (!roleMap.has(role)) roleMap.set(role, []);
      roleMap.get(role)!.push(product);
    }
  }

  for (const [role, products] of roleMap.entries()) {
    if (products.length > 1) {
      // Keep the one with lowest irritancy score, best price-to-performance
      const sorted = [...products].sort((a, b) => {
        const scoreA = a.irritancyScore * 10 + (calculateCostPerDay(a, currency) * 100);
        const scoreB = b.irritancyScore * 10 + (calculateCostPerDay(b, currency) * 100);
        return scoreA - scoreB;
      });

      const kept = sorted[0];
      const removed = sorted.slice(1);

      const redundantValueInr = removed.reduce((sum, p) => sum + p.priceInr, 0);
      const redundantValueUsd = removed.reduce((sum, p) => sum + p.priceUsd, 0);

      redundancyAlerts.push({
        role,
        products,
        redundantValueInr,
        redundantValueUsd,
        recommendation: 'keep_best',
        keptProductId: kept.id,
        removedProductIds: removed.map(p => p.id),
      });
    }
  }

  // 5. Gap Analysis & Recommendations
  const gapRecommendations: GapRecommendation[] = [];
  const coveredConcerns = new Set<string>();

  // First, find what's already covered by safe products on shelf
  for (const product of shelf) {
    const hasBiometricConflict = biometricConflicts.some(c => c.productId === product.id);
    const hasChemicalConflict = chemicalConflicts.some(c => c.productIdA === product.id || c.productIdB === product.id);

    if (!hasBiometricConflict && !hasChemicalConflict) {
      for (const concern of product.targetConcerns) {
        coveredConcerns.add(concern);
      }
    }
  }

  // For each priority concern, check if covered
  for (const pc of priorityConcerns) {
    if (coveredConcerns.has(pc.concern)) continue;

    // Find best product for this concern
    const candidateProducts = CATALOG.filter(p => p.targetConcerns.includes(pc.concern));

    let bestProduct: Product | null = null;
    let bestScore = -Infinity;
    const exclusionRationales: GapRecommendation['exclusionRationales'] = [];

    for (const candidate of candidateProducts) {
      let score = 0;
      let excluded = false;
      let exclusionReason: GapRecommendation['exclusionRationales'][0]['reason'] = 'budget_exceeded';
      let exclusionDetails = '';

      // Check if already owned
      const alreadyOwned = shelf.some(s => s.id === candidate.id);
      if (alreadyOwned) {
        excluded = true;
        exclusionReason = 'already_covered';
        exclusionDetails = 'Already on your shelf and safe to use';
      }

      // Check biometric conflicts
      const hasConflict = biometricConflicts.some(c => c.productId === candidate.id);
      if (hasConflict && !excluded) {
        excluded = true;
        exclusionReason = 'biometric_conflict';
        exclusionDetails = `Conflicts with your ${pc.concern} score (${pc.score}/100)`;
      }

      // Check avoided ingredients
      const hasAvoided = candidate.activeIngredients.some(ai =>
        avoidedIngredients.some(avoided => ai.name.toLowerCase().includes(avoided))
      );
      if (hasAvoided && !excluded) {
        excluded = true;
        exclusionReason = 'avoided_ingredient';
        exclusionDetails = `Contains avoided ingredient`;
      }

      // Check budget
      const cost = currency === 'INR' ? candidate.priceInr : candidate.priceUsd;
      if (cost > budget && !excluded) {
        excluded = true;
        exclusionReason = 'budget_exceeded';
        exclusionDetails = `₹${candidate.priceInr} / $${candidate.priceUsd} exceeds budget`;
      }

      // Check skin type compatibility for recommendations
      if (userSkinType && candidate.incompatibleSkinTypes?.includes(userSkinType) && !excluded) {
        excluded = true;
        exclusionReason = 'biometric_conflict';
        exclusionDetails = `Not suitable for ${userSkinType} skin type`;
      }

      // Check sensitive compatibility for recommendations
      if (userSensitive && candidate.safeForSensitive === false && !excluded) {
        excluded = true;
        exclusionReason = 'biometric_conflict';
        exclusionDetails = `Not safe for sensitive skin`;
      }

      // Check role redundancy with shelf
      const roleOverlap = candidate.roles.some(r =>
        shelf.some(s => s.roles.includes(r) &&
          !biometricConflicts.some(c => c.productId === s.id) &&
          !chemicalConflicts.some(c => c.productIdA === s.id || c.productIdB === s.id)
        )
      );
      if (roleOverlap && !excluded) {
        excluded = true;
        exclusionReason = 'role_redundant';
        exclusionDetails = `Functional role already covered by safe shelf product`;
      }

      // Score candidate (higher is better)
      if (!excluded) {
        score = 1000 - candidate.irritancyScore * 100 - (calculateCostPerDay(candidate, currency) * 10);
        if (score > bestScore) {
          bestScore = score;
          bestProduct = candidate;
        }
      }

      if (excluded) {
        exclusionRationales.push({
          productId: candidate.id,
          productName: candidate.name,
          reason: exclusionReason,
          details: exclusionDetails,
        });
      }
    }

    const costInr = bestProduct?.priceInr || 0;
    const costUsd = bestProduct?.priceUsd || 0;

    gapRecommendations.push({
      concern: pc.concern,
      concernScore: pc.score,
      recommendedProduct: bestProduct,
      rationale: bestProduct
        ? `${bestProduct.name} targets ${pc.concern} (score: ${pc.score}) with ${bestProduct.activeIngredients.map(a => `${a.name} ${a.concentration}`).join(', ')}.`
        : `No suitable product found within constraints for ${pc.concern}. Consider professional consultation.`,
      exclusionRationales,
      costInr,
      costUsd,
      costPerDayInr: bestProduct ? calculateCostPerDay(bestProduct, 'INR') : 0,
      costPerDayUsd: bestProduct ? calculateCostPerDay(bestProduct, 'USD') : 0,
    });
  }

  // Limit to max 2 recommendations based on routine preference
  const maxRecs = constraints.routinePreference === 'minimalist' ? 1 : 2;
  const finalRecommendations = gapRecommendations.slice(0, maxRecs);

  // 6. Build Final Routine
  const safeProducts = shelf.filter(p =>
    !biometricConflicts.some(c => c.productId === p.id && c.recommendation === 'pause')
  );

  const routineProducts = [
    ...safeProducts,
    ...finalRecommendations.map(r => r.recommendedProduct).filter(Boolean) as Product[],
  ];

  // Separate AM/PM
  const AMProducts = routineProducts.filter(p => p.usageTime === 'AM' || p.usageTime === 'BOTH');
  const PMProducts = routineProducts.filter(p => p.usageTime === 'PM' || p.usageTime === 'BOTH');

  // Sort by role priority
  const sortByRole = (a: Product, b: Product) => {
    const minRoleA = Math.min(...a.roles.map(r => ROLE_PRIORITY[r] || 99));
    const minRoleB = Math.min(...b.roles.map(r => ROLE_PRIORITY[r] || 99));
    return minRoleA - minRoleB;
  };

  AMProducts.sort(sortByRole);
  PMProducts.sort(sortByRole);

  const finalRoutine = {
    AM: AMProducts.map((p, i) => ({
      productId: p.id,
      productName: p.name,
      role: p.roles[0],
      step: i + 1,
    })),
    PM: PMProducts.map((p, i) => ({
      productId: p.id,
      productName: p.name,
      role: p.roles[0],
      step: i + 1,
    })),
  };

  // 7. Verdict
  const totalCostInr = finalRecommendations.reduce((sum, r) => sum + r.costInr, 0);
  const totalCostUsd = finalRecommendations.reduce((sum, r) => sum + r.costUsd, 0);

  // Calculate money saved vs generic 6-step routine (avg ₹800/$10 per product)
  const genericRoutineCostInr = 6 * 800;
  const genericRoutineCostUsd = 6 * 10;
  const currentShelfCostInr = shelf.reduce((sum, p) => sum + p.priceInr, 0);
  const currentShelfCostUsd = shelf.reduce((sum, p) => sum + p.priceUsd, 0);

  const moneySavedInr = genericRoutineCostInr - (currentShelfCostInr + totalCostInr);
  const moneySavedUsd = genericRoutineCostUsd - (currentShelfCostUsd + totalCostUsd);

  let verdictType: EngineOutput['verdict']['type'] = 'targeted_addition';
  let message = '';

  if (finalRecommendations.length === 0) {
    verdictType = 'buy_nothing';
    message = 'Buy Nothing — ₹0 Needed! Your current shelf already covers your priority concerns safely.';
  } else if (finalRecommendations.length === 1) {
    verdictType = 'minimal_addition';
    message = `Minimal Addition: 1 product (${currency === 'INR' ? `₹${totalCostInr}` : `$${totalCostUsd}`}) to address your top unmet concern.`;
  } else {
    verdictType = 'targeted_addition';
    message = `Targeted Addition: ${finalRecommendations.length} products (${currency === 'INR' ? `₹${totalCostInr}` : `$${totalCostUsd}`}) for comprehensive coverage.`;
  }

  return {
    scanSummary: {
      priorityConcerns,
      strengths,
      skinType: scan.skinType,
      skinAge: scan.skinAge,
      overallScore: scan.overallScore,
    },
    biometricConflicts,
    chemicalConflicts,
    redundancyAlerts,
    gapRecommendations: finalRecommendations,
    finalRoutine,
    verdict: {
      type: verdictType,
      totalCostInr,
      totalCostUsd,
      moneySavedInr: Math.max(0, moneySavedInr),
      moneySavedUsd: Math.max(0, moneySavedUsd),
      message,
    },
    auditTrail: {
      productsAnalyzed: shelf.length,
      conflictsFound: biometricConflicts.length + chemicalConflicts.length,
      redundanciesFound: redundancyAlerts.length,
      gapsIdentified: priorityConcerns.filter(pc => !coveredConcerns.has(pc.concern)).length,
      productsRecommended: finalRecommendations.length,
      barrierLoadScore: calculateBarrierLoad(shelf),
      compatibilityScore: calculateCompatibilityScore(shelf, scan, constraints),
    },
  };
}
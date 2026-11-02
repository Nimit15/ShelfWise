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

// Thresholds for biometric conflicts (using SD/YouCam keys)
const BARRIER_CONCERN_THRESHOLDS: Record<string, number> = {
  moisture: 60,
  redness: 65,
  texture: 55,
};

/**
 * Canonical mapping from YouCam API concern keys (HD and SD) to catalog targetConcerns strings.
 * YouCam uses keys like 'hd_moisture', 'hd_redness', while the catalog uses plain strings
 * like 'moisture', 'redness'. This map bridges that gap for accurate concern-to-product matching.
 *
 * BUG 5 root cause: gapRecommendations were empty because scan concerns used YouCam HD keys
 * that never matched catalog targetConcerns. This map fixes the mapping.
 */
export const CONCERN_TO_CATALOG_MAP: Record<string, string> = {
  // HD concerns (primary YouCam V2.1 keys)
  'hd_wrinkle': 'wrinkle',
  'hd_pore': 'pore',
  'hd_texture': 'texture',
  'hd_acne': 'acne',
  'hd_oiliness': 'oiliness',
  'hd_radiance': 'radiance',
  'hd_eye_bag': 'eye_bag',
  'hd_age_spot': 'age_spot',
  'hd_dark_circle': 'dark_circle_v2',
  'hd_droopy_upper_eyelid': 'droopy_upper_eyelid',
  'hd_droopy_lower_eyelid': 'droopy_lower_eyelid',
  'hd_firmness': 'firmness',
  'hd_moisture': 'moisture',
  'hd_redness': 'redness',
  'hd_tear_trough': 'tear_trough',
  'hd_skin_type': 'skin_type',
  // SD concerns (fallback YouCam keys)
  'wrinkle': 'wrinkle',
  'pore': 'pore',
  'texture': 'texture',
  'acne': 'acne',
  'oiliness': 'oiliness',
  'radiance': 'radiance',
  'eye_bag': 'eye_bag',
  'age_spot': 'age_spot',
  'dark_circle_v2': 'dark_circle_v2',
  'droopy_upper_eyelid': 'droopy_upper_eyelid',
  'droopy_lower_eyelid': 'droopy_lower_eyelid',
  'firmness': 'firmness',
  'moisture': 'moisture',
  'redness': 'redness',
  'tear_trough': 'tear_trough',
  'skin_type': 'skin_type',
};

/**
 * Convert a YouCam concern key to the catalog targetConcerns string.
 * If no mapping found, returns the original key (so it still works if catalog matches directly).
 */
function mapConcernToCatalog(concernKey: string): string {
  return CONCERN_TO_CATALOG_MAP[concernKey] ?? concernKey;
}

/**
 * Comprehensive mapping from YouCam concern keys (SD and HD) to FunctionalRoles.
 * This ensures every concern maps to the correct product roles for targeted recommendations.
 * Each concern can map to multiple roles for comprehensive coverage.
 */
export const CONCERN_TO_PRODUCT_ROLES_MAP: Record<string, FunctionalRole[]> = {
  // HD concerns (primary YouCam V2.1 keys) → Functional Roles
  'hd_wrinkle': ['retinoid', 'antioxidant_vit_c', 'exfoliant_aha_bha', 'hydrator'],
  'hd_pore': ['niacinamide_pore', 'exfoliant_aha_bha', 'azelaic_treatment', 'cleanser'],
  'hd_texture': ['exfoliant_aha_bha', 'retinoid', 'hydrator', 'antioxidant_vit_c'],
  'hd_acne': ['azelaic_treatment', 'exfoliant_aha_bha', 'niacinamide_pore', 'cleanser'],
  'hd_oiliness': ['niacinamide_pore', 'cleanser', 'exfoliant_aha_bha', 'hydrator'],
  'hd_radiance': ['antioxidant_vit_c', 'exfoliant_aha_bha', 'hydrator', 'sunscreen_spf'],
  'hd_eye_bag': ['eye_treatment', 'hydrator'],
  'hd_age_spot': ['antioxidant_vit_c', 'azelaic_treatment', 'exfoliant_aha_bha', 'retinoid', 'sunscreen_spf'],
  'hd_dark_circle': ['eye_treatment', 'antioxidant_vit_c', 'hydrator'],
  'hd_droopy_upper_eyelid': ['eye_treatment', 'retinoid', 'hydrator'],
  'hd_droopy_lower_eyelid': ['eye_treatment', 'retinoid', 'hydrator'],
  'hd_firmness': ['retinoid', 'antioxidant_vit_c', 'hydrator', 'barrier_repair'],
  'hd_moisture': ['hydrator', 'barrier_repair', 'cleanser'],
  'hd_redness': ['barrier_repair', 'azelaic_treatment', 'hydrator', 'sunscreen_spf'],
  'hd_tear_trough': ['eye_treatment', 'hydrator', 'retinoid'],
  'hd_skin_type': [], // handled separately via skin type constraints

  // SD concerns (fallback YouCam keys) → Functional Roles
  'wrinkle': ['retinoid', 'antioxidant_vit_c', 'exfoliant_aha_bha', 'hydrator'],
  'pore': ['niacinamide_pore', 'exfoliant_aha_bha', 'azelaic_treatment', 'cleanser'],
  'texture': ['exfoliant_aha_bha', 'retinoid', 'hydrator', 'antioxidant_vit_c'],
  'acne': ['azelaic_treatment', 'exfoliant_aha_bha', 'niacinamide_pore', 'cleanser'],
  'oiliness': ['niacinamide_pore', 'cleanser', 'exfoliant_aha_bha', 'hydrator'],
  'radiance': ['antioxidant_vit_c', 'exfoliant_aha_bha', 'hydrator', 'sunscreen_spf'],
  'eye_bag': ['eye_treatment', 'hydrator'],
  'age_spot': ['antioxidant_vit_c', 'azelaic_treatment', 'exfoliant_aha_bha', 'retinoid', 'sunscreen_spf'],
  'dark_circle_v2': ['eye_treatment', 'antioxidant_vit_c', 'hydrator'],
  'droopy_upper_eyelid': ['eye_treatment', 'retinoid', 'hydrator'],
  'droopy_lower_eyelid': ['eye_treatment', 'retinoid', 'hydrator'],
  'firmness': ['retinoid', 'antioxidant_vit_c', 'hydrator', 'barrier_repair'],
  'moisture': ['hydrator', 'barrier_repair', 'cleanser'],
  'redness': ['barrier_repair', 'azelaic_treatment', 'hydrator', 'sunscreen_spf'],
  'tear_trough': ['eye_treatment', 'hydrator', 'retinoid'],
  'skin_type': [], // handled separately via skin type constraints
};

/**
 * Get the FunctionalRoles that target a specific YouCam concern.
 * Returns an array of roles ordered by priority (most effective first).
 */
export function getRolesForConcern(concernKey: string): FunctionalRole[] {
  return CONCERN_TO_PRODUCT_ROLES_MAP[concernKey] ?? [];
}

/**
 * Get all catalog concern strings that a YouCam concern maps to.
 */
export function getCatalogConcernsForYouCamConcern(concernKey: string): string[] {
  const catalogConcern = mapConcernToCatalog(concernKey);
  return [catalogConcern];
}

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
    .filter(c => c.uiScore !== undefined && c.type !== 'skin_type' && c.type !== 'hd_skin_type')
    .sort((a, b) => a.uiScore - b.uiScore || a.type.localeCompare(b.type))
    .slice(0, count)
    .map(c => ({ concern: c.type, score: c.uiScore, stars: starRating(c.uiScore) }));
}

function getStrengths(concerns: YouCamConcern[], count = 3): Array<{ concern: string; score: number; stars: number }> {
  return concerns
    .filter(c => c.uiScore !== undefined && c.type !== 'skin_type' && c.type !== 'hd_skin_type')
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
    for (const [catalogConcern, threshold] of Object.entries(BARRIER_CONCERN_THRESHOLDS)) {
      // The scan concerns may use EitherCam HD keys (hd_moisture) or SD keys (moisture)
      // Map catalog concern to possible YouCam keys
      const hdKey = `hd_${catalogConcern}`;
      const concern = scan.concerns.find(c => c.type === hdKey || c.type === catalogConcern);
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
            concern: catalogConcern,
            concernScore: concern.uiScore,
            conflictType,
            severity,
            recommendation,
            explanation: `Your ${catalogConcern || concern.type} score (${concern.uiScore}/100) indicates compromised barrier. ${product.name} contains ${product.roles.filter(r => HIGH_IRRITANCY_ROLES.includes(r)).join(', ')} which may worsen this.`,
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
    // Map YouCam concern key to catalog concern key
    const catalogConcern = mapConcernToCatalog(pc.concern);
    if (coveredConcerns.has(catalogConcern)) continue;

    // Find best product for this concern
    const candidateProducts = CATALOG.filter(p => p.targetConcerns.includes(catalogConcern));

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

    // If no product matched via targetConcerns, try role-based lookup using CONCERN_TO_PRODUCT_ROLES_MAP
    if (!bestProduct && exclusionRationales.length > 0) {
      const rolesForConcern = getRolesForConcern(pc.concern);
      if (rolesForConcern.length > 0) {
        const roleCandidateProducts = CATALOG.filter(p => p.roles.some(r => rolesForConcern.includes(r)));
        let roleBestProduct: Product | null = null;
        let roleBestScore = -Infinity;
        const roleExclusionRationales: GapRecommendation['exclusionRationales'] = [];

        for (const candidate of roleCandidateProducts) {
          let excluded = false;
          let exclusionReason: GapRecommendation['exclusionRationales'][0]['reason'] = 'budget_exceeded';
          let exclusionDetails = '';

          // Skip already-owned products
          const alreadyOwned = shelf.some(s => s.id === candidate.id);
          if (alreadyOwned) { excluded = true; exclusionReason = 'already_covered'; exclusionDetails = 'Already on your shelf'; }

          // Check biometric conflicts
          const hasConflict = biometricConflicts.some(c => c.productId === candidate.id);
          if (hasConflict && !excluded) { excluded = true; exclusionReason = 'biometric_conflict'; exclusionDetails = `Conflicts with your ${pc.concern} score`; }

          // Check avoided ingredients
          const hasAvoided = candidate.activeIngredients.some(ai => avoidedIngredients.some(avoided => ai.name.toLowerCase().includes(avoided)));
          if (hasAvoided && !excluded) { excluded = true; exclusionReason = 'avoided_ingredient'; exclusionDetails = `Contains avoided ingredient`; }

          // Check budget
          const cost = currency === 'INR' ? candidate.priceInr : candidate.priceUsd;
          if (cost > budget && !excluded) { excluded = true; exclusionReason = 'budget_exceeded'; exclusionDetails = `₹${candidate.priceInr} / $${candidate.priceUsd} exceeds budget`; }

          // Check skin type compatibility
          if (userSkinType && candidate.incompatibleSkinTypes?.includes(userSkinType) && !excluded) {
            excluded = true; exclusionReason = 'biometric_conflict'; exclusionDetails = `Not suitable for ${userSkinType} skin type`;
          }

          // Check sensitive compatibility
          if (userSensitive && candidate.safeForSensitive === false && !excluded) {
            excluded = true; exclusionReason = 'biometric_conflict'; exclusionDetails = `Not safe for sensitive skin`;
          }

          // Check role redundancy with shelf
          const roleOverlap = candidate.roles.some(r =>
            shelf.some(s => s.roles.includes(r) &&
              !biometricConflicts.some(c => c.productId === s.id) &&
              !chemicalConflicts.some(c => c.productIdA === s.id || c.productIdB === s.id)
            )
          );
          if (roleOverlap && !excluded) { excluded = true; exclusionReason = 'role_redundant'; exclusionDetails = `Functional role already covered by safe shelf product`; }

          if (!excluded) {
            const score = 1000 - candidate.irritancyScore * 100 - (calculateCostPerDay(candidate, currency) * 10);
            if (score > roleBestScore) { roleBestScore = score; roleBestProduct = candidate; }
          }
          if (excluded) {
            roleExclusionRationales.push({ productId: candidate.id, productName: candidate.name, reason: exclusionReason, details: exclusionDetails });
          }
        }

        if (roleBestProduct) {
          bestProduct = roleBestProduct;
          exclusionRationales.push(...roleExclusionRationales);
        }
      }
    }

    // If still no product, try finding ANY product with the same role ignoring skin type (last resort)
    if (!bestProduct) {
      const rolesForConcern = getRolesForConcern(pc.concern);
      if (rolesForConcern.length > 0) {
        const fallbackProducts = CATALOG.filter(p => p.roles.some(r => rolesForConcern.includes(r)) && p.safeForSensitive);
        for (const candidate of fallbackProducts) {
          const alreadyOwned = shelf.some(s => s.id === candidate.id);
          const hasConflict = biometricConflicts.some(c => c.productId === candidate.id);
          const hasAvoided = candidate.activeIngredients.some(ai => avoidedIngredients.some(avoided => ai.name.toLowerCase().includes(avoided)));
          const cost = currency === 'INR' ? candidate.priceInr : candidate.priceUsd;

          if (!alreadyOwned && !hasConflict && !hasAvoided && cost <= budget) {
            bestProduct = candidate;
            break;
          }
        }
      }
    }

    // If no product found at all, use the lowest-irritancy product for the first role as ultimate fallback
    // This guarantees recommendedProduct is never null - but still respect budget
    if (!bestProduct) {
      const rolesForConcern = getRolesForConcern(pc.concern);
      const allRoleProducts = rolesForConcern.length > 0
        ? CATALOG.filter(p => p.roles.some(r => rolesForConcern.includes(r)))
        : CATALOG.filter(p => p.roles.includes(pc.concern as FunctionalRole));

      // Filter by budget first
      const budgetFiltered = allRoleProducts.filter(p => {
        const cost = currency === 'INR' ? p.priceInr : p.priceUsd;
        return cost <= budget;
      });

      if (budgetFiltered.length > 0) {
        bestProduct = budgetFiltered.sort((a, b) => a.irritancyScore - b.irritancyScore)[0];
      } else if (allRoleProducts.length > 0) {
        // If all role products exceed budget, pick cheapest one anyway (still better than null)
        bestProduct = allRoleProducts.sort((a, b) => {
          const costA = currency === 'INR' ? a.priceInr : a.priceUsd;
          const costB = currency === 'INR' ? b.priceInr : b.priceUsd;
          return costA - costB;
        })[0];
      } else if (CATALOG.length > 0) {
        // Absolute last resort: lowest irritancy product in catalog that fits budget
        const budgetCatalog = [...CATALOG].filter(p => {
          const cost = currency === 'INR' ? p.priceInr : p.priceUsd;
          return cost <= budget;
        });
        if (budgetCatalog.length > 0) {
          bestProduct = budgetCatalog.sort((a, b) => a.irritancyScore - b.irritancyScore)[0];
        } else {
          bestProduct = [...CATALOG].sort((a, b) => {
            const costA = currency === 'INR' ? a.priceInr : a.priceUsd;
            const costB = currency === 'INR' ? b.priceInr : b.priceUsd;
            return costA - costB;
          })[0];
        }
      }
    }

    const costInr = bestProduct?.priceInr || 0;
    const costUsd = bestProduct?.priceUsd || 0;

    gapRecommendations.push({
      concern: catalogConcern,
      concernScore: pc.score,
      recommendedProduct: bestProduct!,
      rationale: bestProduct
        ? `${bestProduct.name} targets ${catalogConcern} (score: ${pc.score}) with ${bestProduct.activeIngredients.map(a => `${a.name} ${a.concentration}`).join(', ')}.`
        : `No suitable product found within constraints for ${catalogConcern}. Consider professional consultation.`,
      exclusionRationales,
      costInr,
      costUsd,
      costPerDayInr: bestProduct ? calculateCostPerDay(bestProduct, 'INR') : 0,
      costPerDayUsd: bestProduct ? calculateCostPerDay(bestProduct, 'USD') : 0,
    });
  }

  // Add core essentials if not already covered on shelf
  // BUG 5 fix: guarantee core essentials (Cleanser, Moisturizer/Hydrator, Sunscreen) are recommended
  const CORE_ESSENTIALS = [
    { concern: 'cleanser', productIds: ['gentle-cream-cleanser', 'salicylic-gel-cleanser'], role: 'cleanser' as const },
    { concern: 'moisturizer', productIds: ['ceramide-barrier-cream', 'niacinamide-moisturizer', 'hyaluronic-serum'], role: 'hydrator' as const },
    { concern: 'sunscreen', productIds: ['mineral-spf50', 'hybrid-spf40'], role: 'sunscreen_spf' as const },
  ];

  const shelfRoles = new Set<string>();
  for (const product of shelf) {
    const hasBiometricConflict = biometricConflicts.some(c => c.productId === product.id);
    const hasChemicalConflict = chemicalConflicts.some(c => c.productIdA === product.id || c.productIdB === product.id);
    if (!hasBiometricConflict && !hasChemicalConflict) {
      for (const role of product.roles) {
        shelfRoles.add(role);
      }
    }
  }

  for (const essential of CORE_ESSENTIALS) {
    if (shelfRoles.has(essential.role)) continue;

    // Find best product for this essential, filtered by skin type/sensitivity
    let bestProduct: Product | null = null;
    let bestScore = -Infinity;
    for (const productId of essential.productIds) {
      const product = CATALOG.find(p => p.id === productId);
      if (!product) continue;

      // Check if product is safe for user's skin type/sensitivity
      if (userSkinType && product.incompatibleSkinTypes?.includes(userSkinType)) continue;
      if (userSensitive && product.safeForSensitive === false) continue;

      // Check budget
      const cost = currency === 'INR' ? product.priceInr : product.priceUsd;
      if (cost > budget) continue;

      const score = 1000 - product.irritancyScore * 100 - (calculateCostPerDay(product, currency) * 10);
      if (score > bestScore) {
        bestScore = score;
        bestProduct = product;
      }
    }

    // Fallback: if no product matched skin type/sensitivity constraints,
    // find ANY product with the same role that is budget-suitable and safe-for-sensitive
    // This guarantees a recommendation for every core essential
    if (!bestProduct) {
      const roleProducts = CATALOG.filter(p => p.roles.includes(essential.role));
      for (const product of roleProducts) {
        // Skip only if not safe for sensitive when user is sensitive
        if (userSensitive && product.safeForSensitive === false) continue;
        // Skip budget-busted
        const cost = currency === 'INR' ? product.priceInr : product.priceUsd;
        if (cost > budget) continue;
        // Prefer products suitable for user skin type, but allow any if none match
        let score = 1000 - product.irritancyScore * 100 - (calculateCostPerDay(product, currency) * 10);
        // Bonus for matching skin type
        if (userSkinType && !product.incompatibleSkinTypes?.includes(userSkinType)) {
          score += 50;
        }
        if (score > bestScore) {
          bestScore = score;
          bestProduct = product;
        }
      }
    }

    if (bestProduct) {
      gapRecommendations.push({
        concern: essential.concern,
        concernScore: 0,
        recommendedProduct: bestProduct,
        rationale: `${bestProduct.name} — essential ${essential.role} for any routine.`,
        exclusionRationales: [],
        costInr: bestProduct.priceInr,
        costUsd: bestProduct.priceUsd,
        costPerDayInr: calculateCostPerDay(bestProduct, 'INR'),
        costPerDayUsd: calculateCostPerDay(bestProduct, 'USD'),
      });
    }
  }

  // Ensure minimum 3 recommendations, up to 5
  const maxRecs = Math.min(gapRecommendations.length, Math.max(3, constraints.routinePreference === 'minimalist' ? 3 : 5));
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
  } else if (finalRecommendations.length <= 2) {
    verdictType = 'minimal_addition';
    message = `Minimal Addition: ${finalRecommendations.length} product(s) (${currency === 'INR' ? `₹${totalCostInr}` : `$${totalCostUsd}`}) to address your top unmet concerns.`;
  } else {
    verdictType = 'targeted_addition';
    message = `Targeted Addition: ${finalRecommendations.length} products (${currency === 'INR' ? `₹${totalCostInr}` : `$${totalCostUsd}`}) for comprehensive coverage of your priority concerns.`;
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
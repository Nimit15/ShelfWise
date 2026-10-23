import { describe, it, expect, beforeEach } from 'vitest';
import { calculateImpactTelemetry, summarizeTelemetry, type ImpactTelemetry } from '@/lib/engine/telemetry';
import { EngineOutput, ShelfProduct, EngineConstraints, FunctionalRole, TextureVehicle } from '@/types/engine';
import { YouCamConcern } from '@/types/youcam';

function createMockShelf(overrides: Partial<ShelfProduct>[] = []): ShelfProduct[] {
  const defaultShelf: ShelfProduct[] = [
    {
      id: 'cleanser',
      name: 'Gentle Cleanser',
      brand: 'Test',
      priceInr: 499,
      priceUsd: 6,
      daysSupply: 90,
      roles: ['cleanser'],
      usageTime: 'BOTH',
      activeIngredients: [{ name: 'Ceramide', concentration: '1%' }],
      inciList: 'Water, Ceramide...',
      targetConcerns: ['moisture'],
      irritancyScore: 1,
      description: 'Test',
      suitableSkinTypes: ['normal', 'dry', 'combination', 'oily'],
      incompatibleSkinTypes: [],
      textureVehicle: 'cream_cleanser',
      safeForSensitive: true,
      quantity: 1,
    },
    {
      id: 'retinoid',
      name: 'Retinol Serum',
      brand: 'Test',
      priceInr: 999,
      priceUsd: 12,
      daysSupply: 90,
      roles: ['retinoid'],
      usageTime: 'PM',
      activeIngredients: [{ name: 'Retinol', concentration: '0.3%' }],
      inciList: 'Water, Retinol...',
      targetConcerns: ['wrinkle', 'firmness'],
      irritancyScore: 6,
      description: 'Test',
      suitableSkinTypes: ['normal', 'oily', 'combination'],
      incompatibleSkinTypes: ['dry'],
      textureVehicle: 'light_fluid',
      safeForSensitive: false,
      quantity: 1,
    },
    {
      id: 'moisturizer',
      name: 'Barrier Cream',
      brand: 'Test',
      priceInr: 899,
      priceUsd: 11,
      daysSupply: 60,
      roles: ['hydrator', 'barrier_repair'],
      usageTime: 'BOTH',
      activeIngredients: [{ name: 'Ceramide NP', concentration: '2%' }],
      inciList: 'Water, Ceramide...',
      targetConcerns: ['moisture', 'redness'],
      irritancyScore: 1,
      description: 'Test',
      suitableSkinTypes: ['normal', 'dry', 'combination'],
      incompatibleSkinTypes: ['oily'],
      textureVehicle: 'rich_cream',
      safeForSensitive: true,
      quantity: 1,
    },
    {
      id: 'sunscreen',
      name: 'SPF 50',
      brand: 'Test',
      priceInr: 799,
      priceUsd: 10,
      daysSupply: 60,
      roles: ['sunscreen_spf'],
      usageTime: 'AM',
      activeIngredients: [{ name: 'Zinc Oxide', concentration: '20%' }],
      inciList: 'Water, Zinc Oxide...',
      targetConcerns: ['radiance', 'age_spot'],
      irritancyScore: 1,
      description: 'Test',
      suitableSkinTypes: ['normal', 'dry', 'combination', 'oily'],
      incompatibleSkinTypes: [],
      textureVehicle: 'light_fluid',
      safeForSensitive: true,
      quantity: 1,
    },
  ];

  return defaultShelf.map((p, i) => ({ ...p, ...overrides[i] }));
}

// Add extra-hydrator to shelf for redundancy test
function createMockShelfWithExtraHydrator(): ShelfProduct[] {
  const baseShelf = createMockShelf();
  return [
    ...baseShelf,
    {
      id: 'extra-hydrator',
      name: 'Extra Hydrator',
      brand: 'Test',
      priceInr: 599,
      priceUsd: 7,
      daysSupply: 45,
      roles: ['hydrator'],
      usageTime: 'BOTH',
      activeIngredients: [{ name: 'Hyaluronic Acid', concentration: '2%' }],
      inciList: 'Water, Hyaluronic Acid...',
      targetConcerns: ['moisture'],
      irritancyScore: 1,
      description: 'Test',
      suitableSkinTypes: ['normal', 'dry', 'combination', 'oily'],
      incompatibleSkinTypes: [],
      textureVehicle: 'light_fluid',
      safeForSensitive: true,
      quantity: 1,
    },
  ];
}

function createMockEngineOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
  const defaultOutput: EngineOutput = {
    scanSummary: {
      priorityConcerns: [
        { concern: 'moisture', score: 45, stars: 2 },
        { concern: 'redness', score: 50, stars: 2 },
      ],
      strengths: [
        { concern: 'wrinkle', score: 90, stars: 5 },
      ],
      skinType: { type: 'Normal', region: 'whole' },
      skinAge: 30,
      overallScore: 65,
    },
    biometricConflicts: [
      {
        productId: 'retinoid',
        productName: 'Retinol Serum',
        concern: 'moisture',
        concernScore: 45,
        conflictType: 'barrier',
        severity: 'high',
        recommendation: 'pause',
        explanation: 'Barrier compromised',
        daysToPause: 14,
      },
      {
        productId: 'retinoid',
        productName: 'Retinol Serum',
        concern: 'redness',
        concernScore: 50,
        conflictType: 'irritancy',
        severity: 'medium',
        recommendation: 'reduce_frequency',
        explanation: 'Irritancy risk',
        daysToPause: 7,
      },
    ],
    chemicalConflicts: [
      {
        productIdA: 'retinoid',
        productNameA: 'Retinol Serum',
        productIdB: 'exfoliant',
        productNameB: 'AHA Toner',
        conflictType: 'same_slot_incompatible',
        ingredients: ['Retinoid', 'AHA/BHA'],
        explanation: 'Cannot use together',
        resolution: 'pause_one',
        affectedSlot: 'PM',
      },
    ],
    redundancyAlerts: [
      {
        role: 'hydrator',
        products: [
          { id: 'moisturizer', name: 'Barrier Cream', brand: 'Test', priceInr: 899, priceUsd: 11, daysSupply: 60, roles: ['hydrator', 'barrier_repair'], usageTime: 'BOTH', activeIngredients: [], inciList: '', targetConcerns: [], irritancyScore: 1, description: '', suitableSkinTypes: [], incompatibleSkinTypes: [], textureVehicle: 'rich_cream', safeForSensitive: true },
          { id: 'extra-hydrator', name: 'Extra Hydrator', brand: 'Test', priceInr: 599, priceUsd: 7, daysSupply: 45, roles: ['hydrator'], usageTime: 'BOTH', activeIngredients: [], inciList: '', targetConcerns: [], irritancyScore: 1, description: '', suitableSkinTypes: [], incompatibleSkinTypes: [], textureVehicle: 'light_fluid', safeForSensitive: true },
        ],
        redundantValueInr: 599,
        redundantValueUsd: 7,
        recommendation: 'keep_best',
        keptProductId: 'moisturizer',
        removedProductIds: ['extra-hydrator'],
      },
    ],
    gapRecommendations: [
      {
        concern: 'moisture',
        concernScore: 45,
        recommendedProduct: null,
        rationale: 'Need hydrator',
        exclusionRationales: [],
        costInr: 0,
        costUsd: 0,
        costPerDayInr: 0,
        costPerDayUsd: 0,
      },
    ],
    finalRoutine: {
      AM: [
        { productId: 'cleanser', productName: 'Gentle Cleanser', role: 'cleanser', step: 1 },
        { productId: 'sunscreen', productName: 'SPF 50', role: 'sunscreen_spf', step: 2 },
      ],
      PM: [
        { productId: 'cleanser', productName: 'Gentle Cleanser', role: 'cleanser', step: 1 },
        { productId: 'moisturizer', productName: 'Barrier Cream', role: 'hydrator', step: 2 },
      ],
    },
    verdict: {
      type: 'targeted_addition',
      totalCostInr: 0,
      totalCostUsd: 0,
      moneySavedInr: 599,
      moneySavedUsd: 7,
      message: 'Optimized routine',
    },
    auditTrail: {
      productsAnalyzed: 4,
      conflictsFound: 3,
      redundanciesFound: 1,
      gapsIdentified: 1,
      productsRecommended: 0,
      barrierLoadScore: 75,
      compatibilityScore: 80,
    },
    ...overrides,
  };

  return defaultOutput;
}

function createMockConstraints(overrides: Partial<EngineConstraints> = {}): EngineConstraints {
  return {
    budgetInr: 3500,
    budgetUsd: 45,
    avoidedIngredients: [],
    routinePreference: 'targeted',
    currency: 'INR',
    ...overrides,
  };
}

describe('calculateImpactTelemetry', () => {
  let shelf: ShelfProduct[];
  let output: EngineOutput;
  let constraints: EngineConstraints;

  beforeEach(() => {
    shelf = createMockShelfWithExtraHydrator();
    output = createMockEngineOutput();
    constraints = createMockConstraints();
  });

  it('should calculate current shelf cost per day', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.currentShelfCostPerDay.inr).toBeGreaterThan(0);
    expect(telemetry.currentShelfCostPerDay.usd).toBeGreaterThan(0);
  });

  it('should calculate optimized cart cost per day', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    // Optimized cart only includes kept products (cleanser, sunscreen, moisturizer)
    expect(telemetry.optimizedCartCostPerDay.inr).toBeLessThan(telemetry.currentShelfCostPerDay.inr);
    expect(telemetry.optimizedCartCostPerDay.usd).toBeLessThan(telemetry.currentShelfCostPerDay.usd);
  });

  it('should calculate redundant shelf value saved', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    // Redundant includes: extra-hydrator (599 INR from redundancy alert) + retinoid (999 INR from biometric conflict pause)
    expect(telemetry.redundantShelfValueSaved.inr).toBe(599 + 999);
    expect(telemetry.redundantShelfValueSaved.usd).toBe(7 + 12);
  });

  it('should calculate generic routine savings', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.genericRoutineSavings.inr).toBeGreaterThanOrEqual(0);
    expect(telemetry.genericRoutineSavings.usd).toBeGreaterThanOrEqual(0);
  });

  it('should count biometric conflicts', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.biometricConflictsIntercepted).toBe(2);
  });

  it('should count chemical conflicts', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.chemicalConflictsIntercepted).toBe(1);
  });

  it('should count vehicle mismatches', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.vehicleMismatchesIntercepted).toBe(1);
  });

  it('should count barrier overload conflicts', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    // Two biometric conflicts: one barrier, one irritancy
    expect(telemetry.barrierOverloadIntercepted).toBe(2);
  });

  it('should calculate total conflicts intercepted', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.totalConflictsIntercepted).toBe(
      telemetry.biometricConflictsIntercepted +
      telemetry.chemicalConflictsIntercepted +
      telemetry.vehicleMismatchesIntercepted +
      telemetry.barrierOverloadIntercepted
    );
  });

  it('should calculate barrier safety score before and after', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.barrierSafetyScore.before).toBeGreaterThanOrEqual(0);
    expect(telemetry.barrierSafetyScore.before).toBeLessThanOrEqual(100);
    expect(telemetry.barrierSafetyScore.after).toBeGreaterThanOrEqual(0);
    expect(telemetry.barrierSafetyScore.after).toBeLessThanOrEqual(100);
    // After should be better (higher score) since we removed retinoid
    expect(telemetry.barrierSafetyScore.after).toBeGreaterThanOrEqual(telemetry.barrierSafetyScore.before);
  });

  it('should include currency and timestamp', () => {
    const telemetry = calculateImpactTelemetry(output, shelf, constraints);
    expect(telemetry.currency).toBe('INR');
    expect(telemetry.calculatedAt).toBeDefined();
    expect(new Date(telemetry.calculatedAt).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('should use USD when currency is USD', () => {
    const usdConstraints = createMockConstraints({ currency: 'USD' });
    const telemetry = calculateImpactTelemetry(output, shelf, usdConstraints);
    expect(telemetry.currency).toBe('USD');
  });
});

describe('summarizeTelemetry', () => {
  it('should create summary with money saved', () => {
    const telemetry: ImpactTelemetry = {
      redundantShelfValueSaved: { inr: 500, usd: 6 },
      genericRoutineSavings: { inr: 200, usd: 3 },
      currentShelfCostPerDay: { inr: 50, usd: 0.6 },
      optimizedCartCostPerDay: { inr: 30, usd: 0.4 },
      totalConflictsIntercepted: 5,
      biometricConflictsIntercepted: 2,
      chemicalConflictsIntercepted: 1,
      vehicleMismatchesIntercepted: 1,
      barrierOverloadIntercepted: 1,
      barrierSafetyScore: { before: 60, after: 85 },
      currency: 'INR',
      calculatedAt: new Date().toISOString(),
    };

    const summary = summarizeTelemetry(telemetry);
    expect(summary.moneySaved.inr).toBe(700); // 500 + 200
    expect(summary.moneySaved.usd).toBe(9);   // 6 + 3
    expect(summary.conflictsStopped).toBe(5);
    expect(summary.barrierImprovement).toBe(25); // 85 - 60
    expect(summary.routineCostPerDay.inr).toBe(30);
    expect(summary.routineCostPerDay.usd).toBe(0.4);
  });
});
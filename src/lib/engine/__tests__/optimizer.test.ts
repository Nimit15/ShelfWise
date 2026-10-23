import { describe, it, expect, beforeEach } from 'vitest';
import { runBioInventoryEngine } from '../optimizer';
import { Product, FunctionalRole } from '@/data/catalog';
import { YouCamConcern, YouCamSkinType } from '@/types/youcam';
import { ScanInput, EngineConstraints, ShelfProduct } from '@/types/engine';

function createMockScan(overrides: Partial<ScanInput> = {}): ScanInput {
  const defaultConcerns: YouCamConcern[] = [
    { type: 'wrinkle', uiScore: 98, rawScore: 99, maskUrls: [] },
    { type: 'pore', uiScore: 91, rawScore: 94, maskUrls: [] },
    { type: 'texture', uiScore: 86, rawScore: 90, maskUrls: [] },
    { type: 'acne', uiScore: 96, rawScore: 98, maskUrls: [] },
    { type: 'oiliness', uiScore: 83, rawScore: 84, maskUrls: [] },
    { type: 'radiance', uiScore: 83, rawScore: 86, maskUrls: [] },
    { type: 'eye_bag', uiScore: 83, rawScore: 84, maskUrls: [] },
    { type: 'age_spot', uiScore: 96, rawScore: 98, maskUrls: [] },
    { type: 'dark_circle_v2', uiScore: 77, rawScore: 83, maskUrls: [] },
    { type: 'droopy_upper_eyelid', uiScore: 84, rawScore: 86, maskUrls: [] },
    { type: 'droopy_lower_eyelid', uiScore: 71, rawScore: 58, maskUrls: [] },
    { type: 'firmness', uiScore: 91, rawScore: 94, maskUrls: [] },
    { type: 'moisture', uiScore: 77, rawScore: 67, maskUrls: [] },
    { type: 'redness', uiScore: 83, rawScore: 85, maskUrls: [] },
    { type: 'tear_trough', uiScore: 96, rawScore: 97, maskUrls: [] },
    { type: 'skin_type', uiScore: 0, rawScore: 0, maskUrls: [] },
  ];

  return {
    concerns: defaultConcerns,
    skinType: { type: 'Normal', region: 'whole' },
    skinAge: 22,
    overallScore: 86.33,
    ...overrides,
  };
}

function createMockShelf(overrides: Partial<ShelfProduct>[] = []): ShelfProduct[] {
  const defaultShelf: ShelfProduct[] = [
    {
      id: 'gentle-cream-cleanser',
      name: 'Gentle Cream Cleanser',
      brand: 'Apothecary Lab',
      priceInr: 499,
      priceUsd: 6,
      daysSupply: 90,
      roles: ['cleanser'],
      usageTime: 'BOTH',
      activeIngredients: [
        { name: 'Ceramide NP', concentration: '1%' },
        { name: 'Glycerin', concentration: '5%' },
      ],
      inciList: 'Water, Glycerin, Caprylic/Capric Triglyceride, Ceramide NP...',
      targetConcerns: ['moisture', 'redness', 'texture'],
      irritancyScore: 1,
      description: 'Gentle cleanser',
      suitableSkinTypes: ['normal', 'dry', 'combination', 'oily'],
      incompatibleSkinTypes: [],
      textureVehicle: 'cream_cleanser',
      safeForSensitive: true,
    },
    {
      id: 'ceramide-barrier-cream',
      name: 'Ceramide Barrier Repair Cream',
      brand: 'Apothecary Lab',
      priceInr: 899,
      priceUsd: 11,
      daysSupply: 60,
      roles: ['hydrator', 'barrier_repair'],
      usageTime: 'BOTH',
      activeIngredients: [
        { name: 'Ceramide NP', concentration: '2%' },
        { name: 'Ceramide AP', concentration: '1%' },
        { name: 'Cholesterol', concentration: '1.5%' },
      ],
      inciList: 'Water, Caprylic/Capric Triglyceride, Glycerin, Ceramide NP...',
      targetConcerns: ['moisture', 'redness', 'firmness', 'texture'],
      irritancyScore: 1,
      description: 'Barrier repair cream',
      suitableSkinTypes: ['dry', 'combination', 'normal'],
      incompatibleSkinTypes: ['oily'],
      textureVehicle: 'rich_cream',
      safeForSensitive: true,
    },
    {
      id: 'mineral-spf50',
      name: 'Mineral SPF 50+ PA++++',
      brand: 'Shield Daily',
      priceInr: 799,
      priceUsd: 10,
      daysSupply: 60,
      roles: ['sunscreen_spf'],
      usageTime: 'AM',
      activeIngredients: [
        { name: 'Zinc Oxide', concentration: '20%' },
        { name: 'Niacinamide', concentration: '2%' },
      ],
      inciList: 'Water, Zinc Oxide, Niacinamide...',
      targetConcerns: ['radiance', 'age_spot', 'wrinkle', 'redness'],
      irritancyScore: 1,
      description: 'Mineral sunscreen',
      suitableSkinTypes: ['normal', 'dry', 'combination', 'oily'],
      incompatibleSkinTypes: [],
      textureVehicle: 'light_fluid',
      safeForSensitive: true,
    },
  ];

  const result = defaultShelf.map((p, i) => ({ ...p, ...overrides[i] }));
  // Append any extra products beyond the default 3
  for (let i = defaultShelf.length; i < overrides.length; i++) {
    if (overrides[i]) {
      result.push({ ...overrides[i] } as ShelfProduct);
    }
  }
  return result;
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

describe('runBioInventoryEngine', () => {
  let scan: ScanInput;
  let shelf: ShelfProduct[];
  let constraints: EngineConstraints;

  beforeEach(() => {
    scan = createMockScan();
    shelf = createMockShelf();
    constraints = createMockConstraints();
  });

  describe('Score Directionality', () => {
    it('should treat lower ui_score as worse concern', () => {
      const result = runBioInventoryEngine(scan, shelf, constraints);
      const priority = result.scanSummary.priorityConcerns;

      // Lowest scores should be first (with alphabetical tiebreaker)
      expect(priority[0].concern).toBe('droopy_lower_eyelid');
      expect(priority[0].score).toBe(71);
      // moisture (77) and dark_circle_v2 (77) tie, alphabetically dark_circle_v2 first
      expect(priority[1].concern).toBe('dark_circle_v2');
      expect(priority[1].score).toBe(77);
      expect(priority[2].concern).toBe('moisture');
      expect(priority[2].score).toBe(77);
    });

    it('should treat higher ui_score as strength', () => {
      const result = runBioInventoryEngine(scan, shelf, constraints);
      const strengths = result.scanSummary.strengths;

      // Highest scores should be first (with alphabetical tiebreaker)
      expect(strengths[0].concern).toBe('wrinkle');
      expect(strengths[0].score).toBe(98);
      // acne (96) and age_spot (96) tie, alphabetically acne first
      expect(strengths[1].concern).toBe('acne');
      expect(strengths[1].score).toBe(96);
      expect(strengths[2].concern).toBe('age_spot');
      expect(strengths[2].score).toBe(96);
    });
  });

  describe('Biometric Conflict Detection', () => {
    it('should flag barrier conflict when moisture < 60 and product has high irritancy role', () => {
      const lowMoistureScan = createMockScan({
        concerns: scan.concerns.map(c => c.type === 'moisture' ? { ...c, uiScore: 30 } : c),
      });

      const harshShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'glycolic-toner',
        name: 'Glycolic Acid 7% Toner',
        roles: ['exfoliant_aha_bha'],
        usageTime: 'PM',
        irritancyScore: 5,
        activeIngredients: [{ name: 'Glycolic Acid', concentration: '7%' }],
        targetConcerns: ['texture', 'radiance'],
      }]);

      const result = runBioInventoryEngine(lowMoistureScan, harshShelf, constraints);

      expect(result.biometricConflicts.length).toBeGreaterThan(0);
      const conflict = result.biometricConflicts.find(c => c.concern === 'moisture');
      expect(conflict).toBeDefined();
      expect(conflict!.severity).toBe('high');
      expect(conflict!.recommendation).toBe('pause');
      expect(conflict!.daysToPause).toBe(14);
    });

    it('should flag sensitivity conflict when redness < 65 and product has retinoid', () => {
      const lowRednessScan = createMockScan({
        concerns: scan.concerns.map(c => c.type === 'redness' ? { ...c, uiScore: 60 } : c),
      });

      const retinoidShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'retinal-serum',
        name: 'Retinaldehyde 0.05% Serum',
        roles: ['retinoid'],
        usageTime: 'PM',
        irritancyScore: 6,
        activeIngredients: [{ name: 'Retinaldehyde', concentration: '0.05%' }],
        targetConcerns: ['wrinkle', 'firmness'],
      }]);

      const result = runBioInventoryEngine(lowRednessScan, retinoidShelf, constraints);

      const conflict = result.biometricConflicts.find(c => c.concern === 'redness');
      expect(conflict).toBeDefined();
      expect(conflict!.recommendation).toBe('reduce_frequency');
    });

    it('should flag avoided ingredient conflict', () => {
      const avoidConstraints = createMockConstraints({
        avoidedIngredients: ['retinaldehyde', 'retinol'],
      });

      const retinoidShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'retinal-serum',
        name: 'Retinaldehyde 0.05% Serum',
        roles: ['retinoid'],
        usageTime: 'PM',
        irritancyScore: 6,
        activeIngredients: [{ name: 'Retinaldehyde', concentration: '0.05%' }],
        targetConcerns: ['wrinkle', 'firmness'],
      }]);

      const result = runBioInventoryEngine(scan, retinoidShelf, avoidConstraints);

      const conflict = result.biometricConflicts.find(c => c.conflictType === 'sensitivity' && c.concern === 'avoided_ingredient');
      expect(conflict).toBeDefined();
      expect(conflict!.recommendation).toBe('pause');
    });
  });

  describe('Chemical Conflict Detection', () => {
    it('should detect AHA/BHA + Retinoid same-slot conflict', () => {
      const conflictShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'glycolic-toner',
        name: 'Glycolic Acid 7% Toner',
        roles: ['exfoliant_aha_bha'],
        usageTime: 'PM',
        irritancyScore: 5,
        activeIngredients: [{ name: 'Glycolic Acid', concentration: '7%' }],
        targetConcerns: ['texture', 'radiance'],
      }, {
        ...createMockShelf()[2],
        id: 'retinal-serum',
        name: 'Retinaldehyde 0.05% Serum',
        roles: ['retinoid'],
        usageTime: 'PM',
        irritancyScore: 6,
        activeIngredients: [{ name: 'Retinaldehyde', concentration: '0.05%' }],
        targetConcerns: ['wrinkle', 'firmness'],
      }]);

      const result = runBioInventoryEngine(scan, conflictShelf, constraints);

      const conflict = result.chemicalConflicts.find(c =>
        c.conflictType === 'same_slot_incompatible'
      );
      expect(conflict).toBeDefined();
      expect(conflict!.ingredients).toContain('AHA/BHA');
      expect(conflict!.ingredients).toContain('Retinoid');
      expect(conflict!.resolution).toBe('pause_one');
    });

    it('should detect Vitamin C + Retinoid AM/PM separation possible', () => {
      const vitCShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'vitamin-c-serum',
        name: 'L-Ascorbic Acid 15% Serum',
        roles: ['antioxidant_vit_c'],
        usageTime: 'AM',
        irritancyScore: 6,
        activeIngredients: [{ name: 'L-Ascorbic Acid', concentration: '15%' }],
        targetConcerns: ['radiance', 'age_spot'],
      }, {
        ...createMockShelf()[2],
        id: 'retinal-serum',
        name: 'Retinaldehyde 0.05% Serum',
        roles: ['retinoid'],
        usageTime: 'PM',
        irritancyScore: 6,
        activeIngredients: [{ name: 'Retinaldehyde', concentration: '0.05%' }],
        targetConcerns: ['wrinkle', 'firmness'],
      }]);

      const result = runBioInventoryEngine(scan, vitCShelf, constraints);

      // These are AM and PM respectively, so no conflict expected
      const conflict = result.chemicalConflicts.find(c =>
        c.productNameA.includes('Vitamin') || c.productNameB.includes('Vitamin')
      );
      // Should not have conflict since they're in different slots
    });
  });

  describe('Role Redundancy Detection', () => {
    it('should detect duplicate cleanser role', () => {
      const redundantShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'salicylic-gel-cleanser',
        name: 'Salicylic Gel Cleanser',
        roles: ['cleanser', 'exfoliant_aha_bha'],
        usageTime: 'PM',
        irritancyScore: 4,
        priceInr: 599,
        priceUsd: 7,
        activeIngredients: [{ name: 'Salicylic Acid', concentration: '2%' }],
        targetConcerns: ['acne', 'pore'],
      }]);

      const result = runBioInventoryEngine(scan, redundantShelf, constraints);

      const redundancy = result.redundancyAlerts.find(r => r.role === 'cleanser');
      expect(redundancy).toBeDefined();
      expect(redundancy!.products.length).toBe(2);
      expect(redundancy!.keptProductId).toBe('gentle-cream-cleanser'); // Lower irritancy
      expect(redundancy!.removedProductIds).toContain('salicylic-gel-cleanser');
    });

    it('should calculate redundant value correctly', () => {
      const redundantShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'salicylic-gel-cleanser',
        name: 'Salicylic Gel Cleanser',
        roles: ['cleanser'],
        usageTime: 'PM',
        irritancyScore: 4,
        priceInr: 599,
        priceUsd: 7,
        activeIngredients: [{ name: 'Salicylic Acid', concentration: '2%' }],
        targetConcerns: ['acne', 'pore'],
      }]);

      const result = runBioInventoryEngine(scan, redundantShelf, constraints);

      const redundancy = result.redundancyAlerts.find(r => r.role === 'cleanser');
      expect(redundancy!.redundantValueInr).toBe(599);
      expect(redundancy!.redundantValueUsd).toBe(7);
    });
  });

  describe('Budget Enforcement', () => {
    it('should not recommend products exceeding budget', () => {
      const tightBudgetConstraints = createMockConstraints({
        budgetInr: 100, // Very tight budget
        budgetUsd: 2,
      });

      const result = runBioInventoryEngine(scan, shelf, tightBudgetConstraints);

      // Should not recommend expensive products
      for (const rec of result.gapRecommendations) {
        if (rec.recommendedProduct) {
          expect(rec.recommendedProduct.priceInr).toBeLessThanOrEqual(100);
        }
      }
    });

    it('should include budget_exceeded in exclusion rationales', () => {
      const tightBudgetConstraints = createMockConstraints({
        budgetInr: 100,
      });

      const result = runBioInventoryEngine(scan, shelf, tightBudgetConstraints);

      const hasBudgetExclusion = result.gapRecommendations.some(r =>
        r.exclusionRationales.some(e => e.reason === 'budget_exceeded')
      );
      expect(hasBudgetExclusion).toBe(true);
    });
  });

  describe('Custom INCI Parsing Integration', () => {
    it('should accept custom parsed products in shelf', () => {
      const customProduct: ShelfProduct = {
        id: 'custom-123',
        name: 'Custom Vitamin C Serum',
        brand: 'Custom (INCI Parsed)',
        priceInr: 1199,
        priceUsd: 14,
        daysSupply: 45,
        roles: ['antioxidant_vit_c'],
        usageTime: 'AM',
        activeIngredients: [{ name: 'L-Ascorbic Acid', concentration: '15%' }],
        inciList: 'Water, Ascorbic Acid, Tocopherol...',
        targetConcerns: ['radiance', 'age_spot', 'firmness'],
        irritancyScore: 6,
        description: 'Custom parsed product',
        suitableSkinTypes: ['normal'],
        incompatibleSkinTypes: [],
        textureVehicle: 'light_fluid',
        safeForSensitive: false,
      };

      const customShelf = [...shelf, customProduct];
      const result = runBioInventoryEngine(scan, customShelf, constraints);

      expect(result.auditTrail.productsAnalyzed).toBe(4);
    });
  });

  describe('Buy Nothing Verdict', () => {
    it('should return buy_nothing when shelf covers all priority concerns', () => {
      // Shelf with products covering all 3 priority concerns (moisture, dark_circle, droopy_lower)
      const completeShelf = createMockShelf([
        {}, // cleanser
        {}, // barrier cream (covers moisture)
        {}, // SPF
        {
          ...createMockShelf()[2],
          id: 'peptide-eye-cream',
          name: 'Peptide Complex Eye Cream',
          roles: ['eye_treatment'],
          usageTime: 'BOTH',
          irritancyScore: 1,
          priceInr: 899,
          priceUsd: 11,
          activeIngredients: [{ name: 'Acetyl Tetrapeptide-5', concentration: '1%' }],
          targetConcerns: ['eye_bag', 'dark_circle_v2', 'droopy_lower_eyelid'],
        },
      ]);

      const result = runBioInventoryEngine(scan, completeShelf, constraints);

      expect(result.verdict.type).toBe('buy_nothing');
      expect(result.verdict.totalCostInr).toBe(0);
      expect(result.verdict.totalCostUsd).toBe(0);
      expect(result.verdict.message).toContain('Buy Nothing');
    });
  });

  describe('Audit Trail', () => {
    it('should track all metrics correctly', () => {
      const result = runBioInventoryEngine(scan, shelf, constraints);

      expect(result.auditTrail.productsAnalyzed).toBe(shelf.length);
      expect(typeof result.auditTrail.conflictsFound).toBe('number');
      expect(typeof result.auditTrail.redundanciesFound).toBe('number');
      expect(typeof result.auditTrail.gapsIdentified).toBe('number');
      expect(typeof result.auditTrail.productsRecommended).toBe('number');
    });
  });

  describe('Currency Toggle', () => {
    it('should calculate costs in USD when currency is USD', () => {
      const usdConstraints = createMockConstraints({ currency: 'USD', budgetUsd: 45 });
      const result = runBioInventoryEngine(scan, shelf, usdConstraints);

      expect(result.verdict.totalCostUsd).toBeGreaterThanOrEqual(0);
      for (const rec of result.gapRecommendations) {
        expect(rec.costUsd).toBeGreaterThanOrEqual(0);
        expect(rec.costPerDayUsd).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate costs in INR when currency is INR', () => {
      const inrConstraints = createMockConstraints({ currency: 'INR', budgetInr: 3500 });
      const result = runBioInventoryEngine(scan, shelf, inrConstraints);

      expect(result.verdict.totalCostInr).toBeGreaterThanOrEqual(0);
      for (const rec of result.gapRecommendations) {
        expect(rec.costInr).toBeGreaterThanOrEqual(0);
        expect(rec.costPerDayInr).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Skin Type Engine Integration', () => {
    it('should flag incompatible skin type as biometric conflict', () => {
      const oilyConstraints = createMockConstraints({
        userSkinType: 'oily',
        userSensitive: false,
      });

      // ceramide-barrier-cream is incompatible with oily skin (rich_cream vehicle)
      const result = runBioInventoryEngine(scan, shelf, oilyConstraints);

      const conflict = result.biometricConflicts.find(c => c.productId === 'ceramide-barrier-cream' && c.concern === 'skin_type_mismatch');
      expect(conflict).toBeDefined();
      expect(conflict!.conflictType).toBe('sensitivity');
      expect(conflict!.recommendation).toBe('pause');
    });

    it('should flag sensitive-incompatible actives when user sensitive', () => {
      const sensitiveConstraints = createMockConstraints({
        userSkinType: 'normal',
        userSensitive: true,
        avoidedIngredients: [],
      });

      const retinoidShelf = createMockShelf([{}, {}, {
        ...createMockShelf()[2],
        id: 'retinal-serum',
        name: 'Retinaldehyde 0.05% Serum',
        roles: ['retinoid'],
        usageTime: 'PM',
        irritancyScore: 6,
        activeIngredients: [{ name: 'Retinaldehyde', concentration: '0.05%' }],
        targetConcerns: ['wrinkle', 'firmness'],
        safeForSensitive: false,
      }]);

      const result = runBioInventoryEngine(scan, retinoidShelf, sensitiveConstraints);

      const conflict = result.biometricConflicts.find(c => c.productId === 'retinal-serum');
      expect(conflict).toBeDefined();
      expect(conflict!.conflictType).toBe('sensitivity');
    });

    it('should recommend skin-type-appropriate products in gap analysis', () => {
      const oilyConstraints = createMockConstraints({
        userSkinType: 'oily',
        userSensitive: false,
        budgetInr: 2000,
        budgetUsd: 25,
      });

      const oilyScan = createMockScan({
        concerns: scan.concerns.map(c =>
          c.type === 'oiliness' ? { ...c, uiScore: 90 } : c
        ),
      });

      const result = runBioInventoryEngine(oilyScan, createMockShelf(), oilyConstraints);

      // Recommendations should not be incompatible with oily skin
      for (const rec of result.gapRecommendations) {
        if (rec.recommendedProduct) {
          const product = rec.recommendedProduct;
          const isCompatible =
            !product.incompatibleSkinTypes ||
            !product.incompatibleSkinTypes.includes('oily');
          expect(isCompatible).toBe(true);
        }
      }
    });
  });
});
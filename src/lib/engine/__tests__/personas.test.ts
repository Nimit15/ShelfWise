import { describe, it, expect } from 'vitest';
import { PERSONAS, getPersona, getAllPersonas, buildPersonaShelf, buildPersonaConstraints, getPersonaSummary } from '@/lib/engine/personas';
import { Product } from '@/data/catalog';

describe('Persona Definitions', () => {
  it('should have 3 personas', () => {
    expect(Object.keys(PERSONAS).length).toBe(3);
    expect(PERSONAS.student_overexfoliated).toBeDefined();
    expect(PERSONAS.influencer_clutter).toBeDefined();
    expect(PERSONAS.minimalist_complete).toBeDefined();
  });

  describe('student_overexfoliated', () => {
    const persona = PERSONAS.student_overexfoliated;

    it('should have correct metadata', () => {
      expect(persona.id).toBe('student_overexfoliated');
      expect(persona.title).toBe('The Over-Exfoliating Student');
      expect(persona.subtitle).toContain('Biometric Barrier Overload');
      expect(persona.defaultSkinType).toBe('combination');
      expect(persona.defaultSensitive).toBe(true);
      expect(persona.budgetInr).toBe(1500);
      expect(persona.budgetUsd).toBe(18);
    });

    it('should have 6 shelf products', () => {
      expect(persona.shelfProductIds.length).toBe(6);
    });

    it('should expect specific conflicts', () => {
      expect(persona.expectedConflicts).toContain('biometric_barrier_overload');
      expect(persona.expectedConflicts).toContain('chemical_conflict_retinoid_aha');
      expect(persona.expectedConflicts).toContain('chemical_conflict_retinoid_bha');
    });

    it('should expect targeted_addition verdict', () => {
      expect(persona.expectedVerdict).toBe('targeted_addition');
    });
  });

  describe('influencer_clutter', () => {
    const persona = PERSONAS.influencer_clutter;

    it('should have correct metadata', () => {
      expect(persona.id).toBe('influencer_clutter');
      expect(persona.title).toBe('The 7-Step Influencer Haul');
      expect(persona.subtitle).toContain('Role Redundancy');
      expect(persona.defaultSkinType).toBe('normal');
      expect(persona.defaultSensitive).toBe(false);
      expect(persona.budgetInr).toBe(5000);
      expect(persona.budgetUsd).toBe(60);
    });

    it('should have 10 shelf products', () => {
      expect(persona.shelfProductIds.length).toBe(10);
    });

    it('should expect role redundancy conflicts', () => {
      expect(persona.expectedConflicts).toContain('role_redundancy_antioxidant_vit_c');
      expect(persona.expectedConflicts).toContain('role_redundancy_hydrator');
      expect(persona.expectedConflicts).toContain('role_redundancy_niacinamide_pore');
    });

    it('should expect minimal_addition verdict', () => {
      expect(persona.expectedVerdict).toBe('minimal_addition');
    });
  });

  describe('minimalist_complete', () => {
    const persona = PERSONAS.minimalist_complete;

    it('should have correct metadata', () => {
      expect(persona.id).toBe('minimalist_complete');
      expect(persona.title).toBe('The Balanced Minimalist');
      expect(persona.subtitle).toContain('Buy Nothing');
      expect(persona.defaultSkinType).toBe('normal');
      expect(persona.defaultSensitive).toBe(false);
      expect(persona.budgetInr).toBe(3500);
      expect(persona.budgetUsd).toBe(45);
    });

    it('should have 4 shelf products', () => {
      expect(persona.shelfProductIds.length).toBe(4);
    });

    it('should expect no conflicts', () => {
      expect(persona.expectedConflicts).toEqual([]);
    });

    it('should expect buy_nothing verdict', () => {
      expect(persona.expectedVerdict).toBe('buy_nothing');
    });
  });
});

describe('getPersona', () => {
  it('should return persona by id', () => {
    const persona = getPersona('student_overexfoliated');
    expect(persona.id).toBe('student_overexfoliated');
  });

  it('should return all three personas', () => {
    expect(getPersona('student_overexfoliated')).toBeDefined();
    expect(getPersona('influencer_clutter')).toBeDefined();
    expect(getPersona('minimalist_complete')).toBeDefined();
  });
});

describe('getAllPersonas', () => {
  it('should return array of all personas', () => {
    const personas = getAllPersonas();
    expect(personas.length).toBe(3);
    expect(personas.map(p => p.id)).toEqual(['student_overexfoliated', 'influencer_clutter', 'minimalist_complete']);
  });
});

describe('buildPersonaShelf', () => {
  // Mock catalog with required products
  const mockCatalog: Product[] = [
    {
      id: 'glycolic-acid-toner',
      name: 'Glycolic Acid Toner',
      brand: 'Test',
      priceInr: 599,
      priceUsd: 7,
      daysSupply: 60,
      roles: ['exfoliant_aha_bha'],
      usageTime: 'PM',
      activeIngredients: [{ name: 'Glycolic Acid', concentration: '7%' }],
      inciList: 'Water, Glycolic Acid...',
      targetConcerns: ['texture'],
      irritancyScore: 5,
      description: 'Test',
      suitableSkinTypes: ['normal', 'oily', 'combination'],
      incompatibleSkinTypes: ['dry'],
      textureVehicle: 'light_fluid',
      safeForSensitive: false,
    },
    {
      id: 'salicylic-acid-serum',
      name: 'Salicylic Acid Serum',
      brand: 'Test',
      priceInr: 699,
      priceUsd: 8,
      daysSupply: 60,
      roles: ['exfoliant_aha_bha'],
      usageTime: 'PM',
      activeIngredients: [{ name: 'Salicylic Acid', concentration: '2%' }],
      inciList: 'Water, Salicylic Acid...',
      targetConcerns: ['acne', 'pore'],
      irritancyScore: 4,
      description: 'Test',
      suitableSkinTypes: ['normal', 'oily', 'combination'],
      incompatibleSkinTypes: ['dry'],
      textureVehicle: 'light_fluid',
      safeForSensitive: false,
    },
    {
      id: 'retinol-03-percent',
      name: 'Retinol 0.3%',
      brand: 'Test',
      priceInr: 899,
      priceUsd: 11,
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
    },
    {
      id: 'vitamin-c-serum-15',
      name: 'Vitamin C Serum 15%',
      brand: 'Test',
      priceInr: 1199,
      priceUsd: 14,
      daysSupply: 45,
      roles: ['antioxidant_vit_c'],
      usageTime: 'AM',
      activeIngredients: [{ name: 'L-Ascorbic Acid', concentration: '15%' }],
      inciList: 'Water, Ascorbic Acid...',
      targetConcerns: ['radiance', 'age_spot'],
      irritancyScore: 6,
      description: 'Test',
      suitableSkinTypes: ['normal', 'oily', 'combination'],
      incompatibleSkinTypes: [],
      textureVehicle: 'light_fluid',
      safeForSensitive: false,
    },
    {
      id: 'lightweight-moisturizer',
      name: 'Lightweight Moisturizer',
      brand: 'Test',
      priceInr: 499,
      priceUsd: 6,
      daysSupply: 60,
      roles: ['hydrator'],
      usageTime: 'BOTH',
      activeIngredients: [{ name: 'Glycerin', concentration: '5%' }],
      inciList: 'Water, Glycerin...',
      targetConcerns: ['moisture'],
      irritancyScore: 1,
      description: 'Test',
      suitableSkinTypes: ['normal', 'oily', 'combination', 'dry'],
      incompatibleSkinTypes: [],
      textureVehicle: 'light_fluid',
      safeForSensitive: true,
    },
    {
      id: 'spf-50-gel',
      name: 'SPF 50 Gel',
      brand: 'Test',
      priceInr: 799,
      priceUsd: 10,
      daysSupply: 60,
      roles: ['sunscreen_spf'],
      usageTime: 'AM',
      activeIngredients: [{ name: 'Zinc Oxide', concentration: '15%' }],
      inciList: 'Water, Zinc Oxide...',
      targetConcerns: ['radiance', 'wrinkle'],
      irritancyScore: 1,
      description: 'Test',
      suitableSkinTypes: ['normal', 'oily', 'combination', 'dry'],
      incompatibleSkinTypes: [],
      textureVehicle: 'light_fluid',
      safeForSensitive: true,
    },
  ];

  it('should build shelf from persona product IDs', () => {
    const shelf = buildPersonaShelf('student_overexfoliated', mockCatalog);
    expect(shelf.length).toBe(6);
    expect(shelf.every(p => p.quantity === 1)).toBe(true);
  });

  it('should skip missing products gracefully', () => {
    const incompleteCatalog = mockCatalog.slice(0, 3);
    const shelf = buildPersonaShelf('student_overexfoliated', incompleteCatalog);
    expect(shelf.length).toBe(3);
  });

  it('should return empty array for unknown persona', () => {
    const shelf = buildPersonaShelf('unknown' as any, mockCatalog);
    expect(shelf).toEqual([]);
  });
});

describe('buildPersonaConstraints', () => {
  it('should build constraints from persona', () => {
    const constraints = buildPersonaConstraints('student_overexfoliated');
    expect(constraints.budgetInr).toBe(1500);
    expect(constraints.budgetUsd).toBe(18);
    expect(constraints.userSkinType).toBe('combination');
    expect(constraints.userSensitive).toBe(true);
    expect(constraints.currency).toBe('INR');
    expect(constraints.routinePreference).toBe('targeted');
    expect(constraints.avoidedIngredients).toEqual([]);
  });

  it('should build constraints for influencer_clutter', () => {
    const constraints = buildPersonaConstraints('influencer_clutter');
    expect(constraints.budgetInr).toBe(5000);
    expect(constraints.userSkinType).toBe('normal');
    expect(constraints.userSensitive).toBe(false);
  });

  it('should build constraints for minimalist_complete', () => {
    const constraints = buildPersonaConstraints('minimalist_complete');
    expect(constraints.budgetInr).toBe(3500);
    expect(constraints.userSkinType).toBe('normal');
    expect(constraints.userSensitive).toBe(false);
  });
});

describe('getPersonaSummary', () => {
  it('should return summary with correct fields', () => {
    const summary = getPersonaSummary('student_overexfoliated');
    expect(summary.id).toBe('student_overexfoliated');
    expect(summary.title).toBe('The Over-Exfoliating Student');
    expect(summary.subtitle).toContain('Biometric Barrier Overload');
    expect(summary.budgetDisplay).toBe('₹1,500 / $18');
    expect(summary.productCount).toBe(6);
  });

  it('should format budget correctly for influencer_clutter', () => {
    const summary = getPersonaSummary('influencer_clutter');
    expect(summary.budgetDisplay).toBe('₹5,000 / $60');
    expect(summary.productCount).toBe(10);
  });

  it('should format budget correctly for minimalist_complete', () => {
    const summary = getPersonaSummary('minimalist_complete');
    expect(summary.budgetDisplay).toBe('₹3,500 / $45');
    expect(summary.productCount).toBe(4);
  });
});
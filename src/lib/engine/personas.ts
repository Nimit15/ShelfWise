import { ShelfProduct, FunctionalRole, TextureVehicle, EngineConstraints } from '@/types/engine';
import { Product } from '@/data/catalog';

export type PersonaId = 'student_overexfoliated' | 'influencer_clutter' | 'minimalist_complete';

export interface Persona {
  id: PersonaId;
  title: string;
  subtitle: string;
  description: string;
  defaultSkinType: 'oily' | 'dry' | 'combination' | 'normal';
  defaultSensitive: boolean;
  budgetInr: number;
  budgetUsd: number;
  shelfProductIds: string[];
  expectedConflicts: string[];
  expectedVerdict: 'buy_nothing' | 'minimal_addition' | 'targeted_addition';
}

export const PERSONAS: Record<PersonaId, Persona> = {
  student_overexfoliated: {
    id: 'student_overexfoliated',
    title: 'The Over-Exfoliating Student',
    subtitle: 'Biometric Barrier Overload — harsh actives paused, barrier repair prioritized',
    description: 'A student on a tight budget using multiple strong exfoliants daily, causing barrier damage. The engine should detect biometric conflicts (retinoid + AHA + BHA), pause harsh actives, and recommend a barrier-first routine.',
    defaultSkinType: 'combination',
    defaultSensitive: true,
    budgetInr: 1500,
    budgetUsd: 18,
    shelfProductIds: [
      'glycolic-acid-toner',       // exfoliant_aha_bha - high irritancy
      'salicylic-acid-serum',      // exfoliant_aha_bha - high irritancy
      'retinol-03-percent',        // retinoid - high irritancy
      'vitamin-c-serum-15',        // antioxidant_vit_c - medium irritancy
      'lightweight-moisturizer',   // hydrator - no irritancy
      'spf-50-gel',                // sunscreen_spf - no irritancy
    ],
    expectedConflicts: ['biometric_barrier_overload', 'chemical_conflict_retinoid_aha', 'chemical_conflict_retinoid_bha'],
    expectedVerdict: 'targeted_addition',
  },

  influencer_clutter: {
    id: 'influencer_clutter',
    title: 'The 7-Step Influencer Haul',
    subtitle: 'Role Redundancy — duplicate serums consolidated, money saved',
    description: 'An influencer with a 7-step routine full of overlapping serums (multiple vitamin C, multiple hyaluronic acids, multiple niacinamide). The engine should detect role redundancy and recommend consolidation.',
    defaultSkinType: 'normal',
    defaultSensitive: false,
    budgetInr: 5000,
    budgetUsd: 60,
    shelfProductIds: [
      'vitamin-c-serum-15',        // antioxidant_vit_c
      'vitamin-c-serum-20',        // antioxidant_vit_c (redundant)
      'hyaluronic-acid-serum',     // hydrator
      'hyaluronic-acid-serum-2',   // hydrator (redundant)
      'niacinamide-10-percent',    // niacinamide_pore + barrier_repair
      'niacinamide-5-percent',     // niacinamide_pore + barrier_repair (redundant)
      'peptide-eye-cream',         // eye_treatment
      'retinol-03-percent',        // retinoid
      'ceramide-moisturizer',      // barrier_repair + hydrator
      'spf-50-cream',              // sunscreen_spf
    ],
    expectedConflicts: ['role_redundancy_antioxidant_vit_c', 'role_redundancy_hydrator', 'role_redundancy_niacinamide_pore'],
    expectedVerdict: 'minimal_addition',
  },

  minimalist_complete: {
    id: 'minimalist_complete',
    title: 'The Balanced Minimalist',
    subtitle: 'Buy Nothing — ₹0 Needed, routine already optimal',
    description: 'A minimalist with a perfectly balanced 4-step routine (cleanser, hydrator, treatment, SPF). No conflicts, no redundancy, no gaps. The engine should return the signature "Buy Nothing · ₹0 Needed" verdict.',
    defaultSkinType: 'normal',
    defaultSensitive: false,
    budgetInr: 3500,
    budgetUsd: 45,
    shelfProductIds: [
      'gentle-cream-cleanser',     // cleanser
      'hyaluronic-acid-serum',     // hydrator
      'niacinamide-5-percent',     // niacinamide_pore + barrier_repair
      'spf-50-gel',                // sunscreen_spf
    ],
    expectedConflicts: [],
    expectedVerdict: 'buy_nothing',
  },
};

/**
 * Get a persona by ID
 */
export function getPersona(id: PersonaId): Persona {
  return PERSONAS[id];
}

/**
 * Get all personas
 */
export function getAllPersonas(): Persona[] {
  return Object.values(PERSONAS);
}

/**
 * Build shelf products from persona's product IDs using the catalog
 */
export function buildPersonaShelf(personaId: PersonaId, catalog: Product[]): ShelfProduct[] {
  const persona = PERSONAS[personaId];
  if (!persona) {
    return [];
  }
  const shelf: ShelfProduct[] = [];

  for (const productId of persona.shelfProductIds) {
    const product = catalog.find(p => p.id === productId);
    if (product) {
      shelf.push({ ...product, quantity: 1 });
    }
  }

  return shelf;
}

/**
 * Build default engine constraints from persona
 */
export function buildPersonaConstraints(personaId: PersonaId): EngineConstraints {
  const persona = PERSONAS[personaId];
  return {
    budgetInr: persona.budgetInr,
    budgetUsd: persona.budgetUsd,
    avoidedIngredients: [],
    routinePreference: 'targeted',
    currency: 'INR',
    userSkinType: persona.defaultSkinType,
    userSensitive: persona.defaultSensitive,
  };
}

/**
 * Get persona summary for display
 */
export function getPersonaSummary(personaId: PersonaId): {
  id: PersonaId;
  title: string;
  subtitle: string;
  budgetDisplay: string;
  productCount: number;
} {
  const persona = PERSONAS[personaId];
  return {
    id: persona.id,
    title: persona.title,
    subtitle: persona.subtitle,
    budgetDisplay: `₹${persona.budgetInr.toLocaleString()} / $${persona.budgetUsd}`,
    productCount: persona.shelfProductIds.length,
  };
}
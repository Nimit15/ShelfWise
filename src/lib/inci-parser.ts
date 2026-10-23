import { Product, FunctionalRole, UsageTime, TextureVehicle } from '@/data/catalog';

interface ParsedIngredient {
  name: string;
  concentration?: string;
  originalText: string;
}

interface ParsedProduct {
  name: string;
  ingredients: ParsedIngredient[];
  baseIngredients: ParsedIngredient[]; // First 5 base ingredients
  detectedRoles: FunctionalRole[];
  estimatedIrritancy: number;
  concerns: string[];
  suggestedPriceInr: number;
  suggestedPriceUsd: number;
  daysSupply: number;
  usageTime: UsageTime;
  textureVehicle: TextureVehicle;
}

const ACTIVE_INGREDIENT_DB: Record<string, {
  roles: FunctionalRole[];
  concerns: string[];
  irritancy: number;
  defaultConcentration: string;
  usageTime: UsageTime;
  typicalPriceInr: number;
  typicalPriceUsd: number;
  daysSupply: number;
}> = {
  // Retinoids
  'retinol': { roles: ['retinoid'], concerns: ['wrinkle', 'firmness', 'texture', 'age_spot', 'pore'], irritancy: 7, defaultConcentration: '0.3%', usageTime: 'PM', typicalPriceInr: 999, typicalPriceUsd: 12, daysSupply: 90 },
  'retinaldehyde': { roles: ['retinoid'], concerns: ['wrinkle', 'firmness', 'texture', 'acne', 'age_spot', 'pore'], irritancy: 6, defaultConcentration: '0.05%', usageTime: 'PM', typicalPriceInr: 1299, typicalPriceUsd: 16, daysSupply: 90 },
  'retinal': { roles: ['retinoid'], concerns: ['wrinkle', 'firmness', 'texture', 'acne', 'age_spot', 'pore'], irritancy: 6, defaultConcentration: '0.05%', usageTime: 'PM', typicalPriceInr: 1299, typicalPriceUsd: 16, daysSupply: 90 },
  'tretinoin': { roles: ['retinoid'], concerns: ['wrinkle', 'firmness', 'texture', 'acne', 'age_spot', 'pore'], irritancy: 8, defaultConcentration: '0.025%', usageTime: 'PM', typicalPriceInr: 1499, typicalPriceUsd: 18, daysSupply: 90 },
  'adapalene': { roles: ['retinoid'], concerns: ['acne', 'texture', 'pore'], irritancy: 5, defaultConcentration: '0.1%', usageTime: 'PM', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 90 },
  'bakuchiol': { roles: ['retinoid'], concerns: ['wrinkle', 'firmness', 'texture', 'age_spot', 'radiance'], irritancy: 1, defaultConcentration: '1%', usageTime: 'PM', typicalPriceInr: 949, typicalPriceUsd: 12, daysSupply: 60 },

  // Vitamin C
  'ascorbic acid': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness', 'wrinkle', 'redness'], irritancy: 6, defaultConcentration: '15%', usageTime: 'AM', typicalPriceInr: 1199, typicalPriceUsd: 14, daysSupply: 45 },
  'l-ascorbic acid': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness', 'wrinkle', 'redness'], irritancy: 6, defaultConcentration: '15%', usageTime: 'AM', typicalPriceInr: 1199, typicalPriceUsd: 14, daysSupply: 45 },
  'sodium ascorbyl phosphate': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'acne'], irritancy: 2, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'magnesium ascorbyl phosphate': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'redness'], irritancy: 2, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'tetrahexyldecyl ascorbate': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness', 'redness'], irritancy: 2, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 999, typicalPriceUsd: 12, daysSupply: 60 },
  'ascorbyl glucoside': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot'], irritancy: 2, defaultConcentration: '5%', usageTime: 'BOTH', typicalPriceInr: 599, typicalPriceUsd: 7, daysSupply: 60 },
  'ethyl ascorbic acid': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness'], irritancy: 3, defaultConcentration: '10%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },

  // Niacinamide
  'niacinamide': { roles: ['niacinamide_pore', 'barrier_repair'], concerns: ['pore', 'oiliness', 'redness', 'radiance', 'texture', 'age_spot'], irritancy: 2, defaultConcentration: '5%', usageTime: 'BOTH', typicalPriceInr: 549, typicalPriceUsd: 7, daysSupply: 60 },

  // AHAs
  'glycolic acid': { roles: ['exfoliant_aha_bha'], concerns: ['texture', 'radiance', 'wrinkle', 'age_spot', 'pore'], irritancy: 5, defaultConcentration: '7%', usageTime: 'PM', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },
  'lactic acid': { roles: ['exfoliant_aha_bha', 'hydrator'], concerns: ['texture', 'moisture', 'radiance', 'age_spot'], irritancy: 3, defaultConcentration: '5%', usageTime: 'PM', typicalPriceInr: 749, typicalPriceUsd: 9, daysSupply: 45 },
  'mandelic acid': { roles: ['exfoliant_aha_bha'], concerns: ['texture', 'acne', 'radiance', 'age_spot', 'redness'], irritancy: 3, defaultConcentration: '10%', usageTime: 'PM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 45 },
  'malic acid': { roles: ['exfoliant_aha_bha'], concerns: ['texture', 'radiance'], irritancy: 2, defaultConcentration: '5%', usageTime: 'PM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'tartaric acid': { roles: ['exfoliant_aha_bha'], concerns: ['texture', 'radiance'], irritancy: 2, defaultConcentration: '5%', usageTime: 'PM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'citric acid': { roles: ['exfoliant_aha_bha'], concerns: ['texture', 'radiance'], irritancy: 2, defaultConcentration: '2%', usageTime: 'PM', typicalPriceInr: 599, typicalPriceUsd: 7, daysSupply: 60 },

  // BHAs
  'salicylic acid': { roles: ['exfoliant_aha_bha'], concerns: ['acne', 'oiliness', 'pore', 'texture', 'blackheads'], irritancy: 4, defaultConcentration: '2%', usageTime: 'PM', typicalPriceInr: 849, typicalPriceUsd: 10, daysSupply: 60 },
  'betaine salicylate': { roles: ['exfoliant_aha_bha'], concerns: ['acne', 'pore', 'texture'], irritancy: 3, defaultConcentration: '4%', usageTime: 'PM', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },

  // PHAs
  'gluconolactone': { roles: ['exfoliant_aha_bha', 'hydrator'], concerns: ['texture', 'moisture', 'radiance', 'redness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'lactobionic acid': { roles: ['exfoliant_aha_bha', 'hydrator'], concerns: ['texture', 'moisture', 'radiance', 'redness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 749, typicalPriceUsd: 9, daysSupply: 60 },

  // Azelaic Acid
  'azelaic acid': { roles: ['azelaic_treatment'], concerns: ['redness', 'acne', 'radiance', 'age_spot', 'texture'], irritancy: 3, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },

  // Hydrators / Barrier
  'hyaluronic acid': { roles: ['hydrator'], concerns: ['moisture', 'texture', 'firmness', 'radiance'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 8, daysSupply: 45 },
  'sodium hyaluronate': { roles: ['hydrator'], concerns: ['moisture', 'texture', 'firmness', 'radiance'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 8, daysSupply: 45 },
  'hydrolyzed hyaluronic acid': { roles: ['hydrator'], concerns: ['moisture', 'texture', 'firmness', 'radiance'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'BOTH', typicalPriceInr: 749, typicalPriceUsd: 9, daysSupply: 45 },
  'sodium acetylated hyaluronate': { roles: ['hydrator'], concerns: ['moisture', 'texture', 'firmness', 'radiance'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'BOTH', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 45 },
  'ceramide np': { roles: ['barrier_repair', 'hydrator'], concerns: ['moisture', 'redness', 'firmness', 'texture'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'ceramide ap': { roles: ['barrier_repair', 'hydrator'], concerns: ['moisture', 'redness', 'firmness', 'texture'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'ceramide eop': { roles: ['barrier_repair', 'hydrator'], concerns: ['moisture', 'redness', 'firmness', 'texture'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'ceramides': { roles: ['barrier_repair', 'hydrator'], concerns: ['moisture', 'redness', 'firmness', 'texture'], irritancy: 1, defaultConcentration: '2%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'phytosphingosine': { roles: ['barrier_repair'], concerns: ['moisture', 'redness', 'acne'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'cholesterol': { roles: ['barrier_repair'], concerns: ['moisture', 'redness', 'firmness'], irritancy: 1, defaultConcentration: '1.5%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'squalane': { roles: ['hydrator', 'barrier_repair'], concerns: ['moisture', 'texture', 'firmness', 'redness'], irritancy: 1, defaultConcentration: '100%', usageTime: 'PM', typicalPriceInr: 599, typicalPriceUsd: 7, daysSupply: 90 },
  'panthenol': { roles: ['hydrator', 'barrier_repair'], concerns: ['moisture', 'redness', 'texture'], irritancy: 1, defaultConcentration: '2%', usageTime: 'BOTH', typicalPriceInr: 499, typicalPriceUsd: 6, daysSupply: 90 },
  'glycerin': { roles: ['hydrator'], concerns: ['moisture', 'texture'], irritancy: 1, defaultConcentration: '5%', usageTime: 'BOTH', typicalPriceInr: 399, typicalPriceUsd: 5, daysSupply: 90 },
  'beta-glucan': { roles: ['hydrator', 'barrier_repair'], concerns: ['moisture', 'redness', 'firmness'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'ectoin': { roles: ['barrier_repair', 'hydrator'], concerns: ['moisture', 'redness', 'texture'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },

  // Peptides
  'acetyl tetrapeptide-5': { roles: ['eye_treatment'], concerns: ['eye_bag', 'dark_circle_v2', 'wrinkle'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 90 },
  'palmitoyl tripeptide-1': { roles: ['eye_treatment'], concerns: ['wrinkle', 'firmness', 'droopy_upper_eyelid', 'droopy_lower_eyelid'], irritancy: 1, defaultConcentration: '2%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 90 },
  'palmitoyl tetrapeptide-7': { roles: ['eye_treatment'], concerns: ['wrinkle', 'firmness', 'droopy_upper_eyelid', 'droopy_lower_eyelid'], irritancy: 1, defaultConcentration: '2%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 90 },
  'copper tripeptide-1': { roles: ['retinoid', 'barrier_repair'], concerns: ['wrinkle', 'firmness', 'texture', 'redness'], irritancy: 2, defaultConcentration: '0.1%', usageTime: 'PM', typicalPriceInr: 1199, typicalPriceUsd: 14, daysSupply: 60 },
  'matrixyl 3000': { roles: ['retinoid'], concerns: ['wrinkle', 'firmness', 'texture'], irritancy: 1, defaultConcentration: '3%', usageTime: 'PM', typicalPriceInr: 999, typicalPriceUsd: 12, daysSupply: 60 },

  // Antioxidants
  'tocopherol': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness', 'wrinkle'], irritancy: 1, defaultConcentration: '1%', usageTime: 'AM', typicalPriceInr: 599, typicalPriceUsd: 7, daysSupply: 90 },
  'vitamin e': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness', 'wrinkle'], irritancy: 1, defaultConcentration: '1%', usageTime: 'AM', typicalPriceInr: 599, typicalPriceUsd: 7, daysSupply: 90 },
  'ferulic acid': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness', 'redness'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'AM', typicalPriceInr: 1199, typicalPriceUsd: 14, daysSupply: 45 },
  'resveratrol': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'age_spot', 'firmness', 'redness'], irritancy: 1, defaultConcentration: '1%', usageTime: 'AM', typicalPriceInr: 1099, typicalPriceUsd: 13, daysSupply: 60 },
  'coenzyme q10': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'firmness', 'wrinkle'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'ubiquinone': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'firmness', 'wrinkle'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'green tea extract': { roles: ['antioxidant_vit_c'], concerns: ['radiance', 'redness', 'acne', 'oiliness'], irritancy: 1, defaultConcentration: '1%', usageTime: 'AM', typicalPriceInr: 599, typicalPriceUsd: 7, daysSupply: 90 },
  'epigallocatechin gallate': { roles: ['antioxidant_vit_c'], concerns: ['eye_bag', 'dark_circle_v2', 'radiance', 'redness'], irritancy: 1, defaultConcentration: '1%', usageTime: 'AM', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },
  'egcg': { roles: ['antioxidant_vit_c'], concerns: ['eye_bag', 'dark_circle_v2', 'radiance', 'redness'], irritancy: 1, defaultConcentration: '1%', usageTime: 'AM', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },

  // Soothing / Anti-inflammatory
  'centella asiatica': { roles: ['barrier_repair'], concerns: ['redness', 'moisture', 'texture', 'firmness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },
  'centella asiatica extract': { roles: ['barrier_repair'], concerns: ['redness', 'moisture', 'texture', 'firmness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },
  'madecassoside': { roles: ['barrier_repair'], concerns: ['redness', 'moisture', 'texture', 'firmness'], irritancy: 1, defaultConcentration: '0.1%', usageTime: 'BOTH', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },
  'asiaticoside': { roles: ['barrier_repair'], concerns: ['redness', 'moisture', 'texture', 'firmness'], irritancy: 1, defaultConcentration: '0.1%', usageTime: 'BOTH', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },
  'asiatic acid': { roles: ['barrier_repair'], concerns: ['redness', 'moisture', 'texture', 'firmness'], irritancy: 1, defaultConcentration: '0.1%', usageTime: 'BOTH', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },
  'madecassic acid': { roles: ['barrier_repair'], concerns: ['redness', 'moisture', 'texture', 'firmness'], irritancy: 1, defaultConcentration: '0.1%', usageTime: 'BOTH', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },
  'allantoin': { roles: ['barrier_repair', 'hydrator'], concerns: ['redness', 'moisture', 'texture'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'BOTH', typicalPriceInr: 499, typicalPriceUsd: 6, daysSupply: 90 },
  'bisabolol': { roles: ['barrier_repair'], concerns: ['redness', 'moisture'], irritancy: 1, defaultConcentration: '0.5%', usageTime: 'BOTH', typicalPriceInr: 599, typicalPriceUsd: 7, daysSupply: 90 },
  'aloe barbadensis': { roles: ['hydrator', 'barrier_repair'], concerns: ['moisture', 'redness', 'texture'], irritancy: 1, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 499, typicalPriceUsd: 6, daysSupply: 90 },
  'aloe vera': { roles: ['hydrator', 'barrier_repair'], concerns: ['moisture', 'redness', 'texture'], irritancy: 1, defaultConcentration: '10%', usageTime: 'BOTH', typicalPriceInr: 499, typicalPriceUsd: 6, daysSupply: 90 },
  'licorice root extract': { roles: ['antioxidant_vit_c', 'barrier_repair'], concerns: ['age_spot', 'radiance', 'redness'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'glycyrrhiza glabra': { roles: ['antioxidant_vit_c', 'barrier_repair'], concerns: ['age_spot', 'radiance', 'redness'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },

  // Brightening
  'tranexamic acid': { roles: ['antioxidant_vit_c'], concerns: ['age_spot', 'radiance', 'redness', 'dark_circle_v2', 'pore'], irritancy: 2, defaultConcentration: '3%', usageTime: 'BOTH', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'arbutin': { roles: ['antioxidant_vit_c'], concerns: ['age_spot', 'radiance'], irritancy: 1, defaultConcentration: '2%', usageTime: 'BOTH', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },
  'alpha arbutin': { roles: ['antioxidant_vit_c'], concerns: ['age_spot', 'radiance'], irritancy: 1, defaultConcentration: '2%', usageTime: 'BOTH', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },
  'beta arbutin': { roles: ['antioxidant_vit_c'], concerns: ['age_spot', 'radiance'], irritancy: 1, defaultConcentration: '2%', usageTime: 'BOTH', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'kojic acid': { roles: ['antioxidant_vit_c'], concerns: ['age_spot', 'radiance'], irritancy: 3, defaultConcentration: '1%', usageTime: 'PM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },

  // Zinc
  'zinc pca': { roles: ['niacinamide_pore', 'azelaic_treatment'], concerns: ['oiliness', 'acne', 'pore', 'redness'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 549, typicalPriceUsd: 7, daysSupply: 60 },
  'zinc gluconate': { roles: ['niacinamide_pore'], concerns: ['oiliness', 'acne', 'pore'], irritancy: 1, defaultConcentration: '1%', usageTime: 'BOTH', typicalPriceInr: 549, typicalPriceUsd: 7, daysSupply: 60 },

  // Caffeine
  'caffeine': { roles: ['eye_treatment'], concerns: ['eye_bag', 'dark_circle_v2', 'droopy_upper_eyelid', 'droopy_lower_eyelid'], irritancy: 1, defaultConcentration: '3%', usageTime: 'AM', typicalPriceInr: 649, typicalPriceUsd: 8, daysSupply: 60 },

  // Sunscreens
  'zinc oxide': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'redness', 'firmness'], irritancy: 1, defaultConcentration: '20%', usageTime: 'AM', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },
  'titanium dioxide': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '5%', usageTime: 'AM', typicalPriceInr: 799, typicalPriceUsd: 10, daysSupply: 60 },
  'octinoxate': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 2, defaultConcentration: '7.5%', usageTime: 'AM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'octisalate': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '5%', usageTime: 'AM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'homosalate': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'AM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'avobenzone': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 2, defaultConcentration: '3%', usageTime: 'AM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'octocrylene': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 2, defaultConcentration: '10%', usageTime: 'AM', typicalPriceInr: 699, typicalPriceUsd: 9, daysSupply: 60 },
  'tinosorb s': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'tinosorb m': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'mexoryl sx': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '3%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'mexoryl xl': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '3%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'uvinul a plus': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '10%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
  'uvinul t 150': { roles: ['sunscreen_spf'], concerns: ['radiance', 'age_spot', 'wrinkle', 'firmness'], irritancy: 1, defaultConcentration: '5%', usageTime: 'AM', typicalPriceInr: 899, typicalPriceUsd: 11, daysSupply: 60 },
};

const COMMON_FILLERS = new Set([
  'water', 'aqua', 'eau', 'glycerin', 'glycerine', 'propanediol', 'butylene glycol', 'pentylene glycol',
  'caprylic/capric triglyceride', 'dimethicone', 'cyclopentasiloxane', 'cyclohexasiloxane',
  'cetearyl alcohol', 'cetyl alcohol', 'stearyl alcohol', 'behenyl alcohol',
  'glyceryl stearate', 'peg-100 stearate', 'peg-40 stearate', 'polysorbate 60', 'polysorbate 80',
  'carbomer', 'xanthan gum', 'acrylates/c10-30 alkyl acrylate crosspolymer',
  'sodium hydroxide', 'potassium hydroxide', 'triethanolamine', 'citric acid', 'lactic acid',
  'phenoxyethanol', 'ethylhexylglycerin', 'caprylyl glycol', 'benzyl alcohol', 'dehydroacetic acid',
  'sorbic acid', 'benzoic acid', 'paraben', 'methylparaben', 'propylparaben', 'butylparaben',
  'disodium edta', 'tetrasodium edta', 'tocopherol', 'tocopheryl acetate', 'bht', 'bha',
  'fragrance', 'parfum', 'perfume', 'essential oil', 'limonene', 'linalool', 'citronellol', 'geraniol',
  'alcohol', 'ethanol', 'isopropyl alcohol', 'denatured alcohol', 'sd alcohol',
]);

function normalizeIngredient(text: string): string {
  return text.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\d+[%]/g, '')
    .trim();
}

function extractConcentration(text: string): string | undefined {
  const match = text.match(/(\d+(\.\d+)?\s*%|\d+(\.\d+)?\s*ppm)/i);
  return match ? match[1].trim() : undefined;
}

function parseIngredientList(inciText: string): ParsedIngredient[] {
  const parts = inciText.split(/[,\n]/).map(p => p.trim()).filter(Boolean);
  const ingredients: ParsedIngredient[] = [];

  for (const part of parts) {
    const concentration = extractConcentration(part);
    const normalized = normalizeIngredient(part);
    ingredients.push({
      name: normalized,
      concentration,
      originalText: part,
    });
  }

  return ingredients;
}

function matchIngredients(ingredients: ParsedIngredient[]): {
  detectedRoles: FunctionalRole[];
  concerns: string[];
  irritancy: number;
  actives: Array<{ name: string; concentration: string; roles: FunctionalRole[] }>;
} {
  const detectedRoles = new Set<FunctionalRole>();
  const concerns = new Set<string>();
  let maxIrritancy = 1;
  const actives: Array<{ name: string; concentration: string; roles: FunctionalRole[] }> = [];

  for (const ing of ingredients) {
    const normalized = ing.name;
    const concentration = ing.concentration || ACTIVE_INGREDIENT_DB[normalized]?.defaultConcentration || '';

    // Direct match
    if (ACTIVE_INGREDIENT_DB[normalized]) {
      const db = ACTIVE_INGREDIENT_DB[normalized];
      db.roles.forEach(r => detectedRoles.add(r));
      db.concerns.forEach(c => concerns.add(c));
      maxIrritancy = Math.max(maxIrritancy, db.irritancy);
      actives.push({ name: normalized, concentration, roles: db.roles });
      continue;
    }

    // Partial match for multi-word ingredients
    for (const [key, db] of Object.entries(ACTIVE_INGREDIENT_DB)) {
      if (key.length > 3 && normalized.includes(key)) {
        db.roles.forEach(r => detectedRoles.add(r));
        db.concerns.forEach(c => concerns.add(c));
        maxIrritancy = Math.max(maxIrritancy, db.irritancy);
        actives.push({ name: key, concentration, roles: db.roles });
        break;
      }
    }
  }

  return {
    detectedRoles: Array.from(detectedRoles),
    concerns: Array.from(concerns),
    irritancy: maxIrritancy,
    actives,
  };
}

function estimatePrice(actives: Array<{ name: string; concentration: string; roles: FunctionalRole[] }>): { inr: number; usd: number } {
  if (actives.length === 0) return { inr: 399, usd: 5 };

  const prices = actives.map(a => {
    const db = ACTIVE_INGREDIENT_DB[a.name];
    if (!db) return { inr: 399, usd: 5 };
    return { inr: db.typicalPriceInr, usd: db.typicalPriceUsd };
  });

  // Weighted average based on number of actives
  const avgInr = prices.reduce((sum, p) => sum + p.inr, 0) / prices.length;
  const avgUsd = prices.reduce((sum, p) => sum + p.usd, 0) / prices.length;

  return { inr: Math.round(avgInr), usd: Math.round(avgUsd) };
}

function estimateDaysSupply(actives: Array<{ name: string; concentration: string; roles: FunctionalRole[] }>): number {
  if (actives.length === 0) return 60;

  const supplies = actives.map(a => {
    const db = ACTIVE_INGREDIENT_DB[a.name];
    return db?.daysSupply || 60;
  });

  return Math.round(supplies.reduce((sum, s) => sum + s, 0) / supplies.length);
}

function estimateUsageTime(actives: Array<{ name: string; concentration: string; roles: FunctionalRole[] }>): UsageTime {
  const times = actives.map(a => {
    const db = ACTIVE_INGREDIENT_DB[a.name];
    return db?.usageTime || 'BOTH';
  });

  if (times.includes('AM') && times.includes('PM')) return 'BOTH';
  if (times.includes('AM')) return 'AM';
  if (times.includes('PM')) return 'PM';
  return 'BOTH';
}

function estimateTextureVehicle(actives: Array<{ name: string; concentration: string; roles: FunctionalRole[] }>, ingredients: ParsedIngredient[]): TextureVehicle {
  // Pre-compute common checks
  const hasEmollients = ingredients.some(i =>
    i.name.includes('ceramide') ||
    i.name.includes('squalane') ||
    i.name.includes('oil') ||
    i.name.includes('butter')
  );

  // Check for cleanser indicators
  const hasCleanserActives = actives.some(a => a.roles.includes('cleanser'));
  const hasSurfactants = ingredients.some(i =>
    i.name.includes('surfactant') ||
    i.name.includes('sulfate') ||
    i.name.includes('betaine') ||
    i.name.includes('glucoside') ||
    i.name.includes('isethionate')
  );

  if (hasCleanserActives || hasSurfactants) {
    return hasEmollients ? 'cream_cleanser' : 'foam_cleanser';
  }

  // Check for balm/oil
  const hasOils = ingredients.some(i =>
    i.name.includes('oil') && !i.name.includes('essential') && !i.name.includes('mineral')
  );
  const hasButters = ingredients.some(i => i.name.includes('butter'));
  const hasWaxes = ingredients.some(i => i.name.includes('wax'));

  if (hasOils || hasButters || hasWaxes) {
    return 'balm_oil';
  }

  // Check for rich cream indicators
  const hasRichEmollients = ingredients.some(i =>
    i.name.includes('ceramide') ||
    i.name.includes('cholesterol') ||
    i.name.includes('phytosphingosine')
  );
  const hasHeavyEmollients = ingredients.some(i =>
    i.name.includes('shea') ||
    i.name.includes('cocoa') ||
    i.name.includes('mango') ||
    i.name.includes('coconut') ||
    i.name.includes('jojoba')
  );

  if (hasRichEmollients || hasHeavyEmollients) {
    return 'rich_cream';
  }

  // Check for lotion indicators
  const hasLotionIngredients = ingredients.some(i =>
    i.name.includes('cetearyl alcohol') ||
    i.name.includes('glyceryl stearate') ||
    i.name.includes('emulsif') ||
    i.name.includes('caprylic/capric triglyceride')
  );

  if (hasLotionIngredients) {
    return 'lotion';
  }

  // Check for gel indicators
  const hasGelIngredients = ingredients.some(i =>
    i.name.includes('carbomer') ||
    i.name.includes('xanthan gum') ||
    i.name.includes('acrylates/c10-30') ||
    i.name.includes('hydroxyethylcellulose') ||
    i.name.includes('hyaluronic acid') ||
    i.name.includes('sodium hyaluronate')
  );

  if (hasGelIngredients && !hasEmollients) {
    return 'gel';
  }

  // Default to light_fluid for serums/essences
  return 'light_fluid';
}

export function parseINCIList(inciText: string, productName: string = 'Custom Product'): ParsedProduct {
  const ingredients = parseIngredientList(inciText);
  const baseIngredients = ingredients.slice(0, 5); // First 5 base ingredients
  const { detectedRoles, concerns, irritancy, actives } = matchIngredients(ingredients);
  const { inr, usd } = estimatePrice(actives);
  const daysSupply = estimateDaysSupply(actives);
  const usageTime = estimateUsageTime(actives);
  const textureVehicle = estimateTextureVehicle(actives, ingredients);

  return {
    name: productName,
    ingredients,
    baseIngredients,
    detectedRoles,
    estimatedIrritancy: irritancy,
    concerns,
    suggestedPriceInr: inr,
    suggestedPriceUsd: usd,
    daysSupply,
    usageTime,
    textureVehicle,
  };
}

export function createCustomProductFromINCI(
  inciText: string,
  productName: string
): Product {
  const parsed = parseINCIList(inciText, productName);
  const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    name: productName,
    brand: 'Custom (INCI Parsed)',
    priceInr: parsed.suggestedPriceInr,
    priceUsd: parsed.suggestedPriceUsd,
    daysSupply: parsed.daysSupply,
    roles: parsed.detectedRoles.length > 0 ? parsed.detectedRoles : ['hydrator'],
    usageTime: parsed.usageTime,
    activeIngredients: parsed.ingredients
      .filter(i => ACTIVE_INGREDIENT_DB[normalizeIngredient(i.name)])
      .map(i => ({
        name: i.name,
        concentration: i.concentration || ACTIVE_INGREDIENT_DB[normalizeIngredient(i.name)]?.defaultConcentration || '',
        pH: undefined,
      })),
    inciList: inciText,
    targetConcerns: parsed.concerns,
    irritancyScore: parsed.estimatedIrritancy,
    description: `Custom product parsed from INCI list. Detected ${parsed.detectedRoles.length} functional role(s): ${parsed.detectedRoles.join(', ')}.`,
    suitableSkinTypes: ['normal'],
    incompatibleSkinTypes: [],
    textureVehicle: 'light_fluid',
    safeForSensitive: false,
  };
}

export function getFirstFiveBaseIngredients(inciText: string): ParsedIngredient[] {
  const ingredients = parseIngredientList(inciText);
  return ingredients.slice(0, 5);
}
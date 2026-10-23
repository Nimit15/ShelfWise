export type FunctionalRole =
  | 'cleanser'
  | 'hydrator'
  | 'exfoliant_aha_bha'
  | 'retinoid'
  | 'antioxidant_vit_c'
  | 'barrier_repair'
  | 'azelaic_treatment'
  | 'niacinamide_pore'
  | 'eye_treatment'
  | 'sunscreen_spf';

export type UsageTime = 'AM' | 'PM' | 'BOTH';

export type TextureVehicle = 'gel' | 'light_fluid' | 'lotion' | 'rich_cream' | 'balm_oil' | 'foam_cleanser' | 'cream_cleanser' | 'cream';

export interface Product {
  id: string;
  name: string;
  brand: string;
  priceInr: number;
  priceUsd: number;
  daysSupply: number;
  roles: FunctionalRole[];
  usageTime: UsageTime;
  activeIngredients: Array<{
    name: string;
    concentration: string;
    pH?: number;
  }>;
  inciList: string;
  targetConcerns: string[];
  irritancyScore: number;
  description: string;
  suitableSkinTypes: ('oily' | 'dry' | 'combination' | 'normal')[];
  incompatibleSkinTypes: ('oily' | 'dry' | 'combination' | 'normal')[];
  textureVehicle: TextureVehicle;
  safeForSensitive: boolean;
}

export const CATALOG: Product[] = [
  // Cleansers
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
    inciList: 'Water, Glycerin, Caprylic/Capric Triglyceride, Ceramide NP, Cholesterol, Panthenol, Sodium Lauroyl Lactylate, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin',
    targetConcerns: ['moisture', 'redness', 'texture'],
    irritancyScore: 1,
    description: 'pH-balanced cream cleanser that respects the barrier. Ideal for dry, sensitive, or post-procedure skin.',
    suitableSkinTypes: ['dry', 'normal', 'combination'],
    incompatibleSkinTypes: [],
    textureVehicle: 'cream_cleanser',
    safeForSensitive: true,
  },
  {
    id: 'salicylic-gel-cleanser',
    name: 'Salicylic Gel Cleanser',
    brand: 'ClearSkin Co.',
    priceInr: 599,
    priceUsd: 7,
    daysSupply: 90,
    roles: ['cleanser', 'exfoliant_aha_bha'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Salicylic Acid', concentration: '2%', pH: 3.5 },
      { name: 'Zinc PCA', concentration: '1%' },
    ],
    inciList: 'Water, Cocamidopropyl Betaine, Salicylic Acid, Zinc PCA, Glycerin, Panthenol, Sodium Chloride, Citric Acid, Phenoxyethanol',
    targetConcerns: ['acne', 'oiliness', 'pore', 'texture'],
    irritancyScore: 4,
    description: 'BHA-powered gel cleanser for congested, oily skin. Unclogs pores without stripping.',
    suitableSkinTypes: ['oily', 'combination', 'normal'],
    incompatibleSkinTypes: [],
    textureVehicle: 'gel',
    safeForSensitive: false,
  },

  // Hydrators / Moisturizers
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
      { name: 'Ceramide EOP', concentration: '1%' },
      { name: 'Cholesterol', concentration: '1.5%' },
      { name: 'Phytosphingosine', concentration: '0.5%' },
      { name: 'Panthenol', concentration: '2%' },
    ],
    inciList: 'Water, Caprylic/Capric Triglyceride, Glycerin, Ceramide NP, Ceramide AP, Ceramide EOP, Cholesterol, Phytosphingosine, Panthenol, Squalane, Beta-Glucan, Dimethicone, Carbomer, Sodium Hyaluronate, Phenoxyethanol',
    targetConcerns: ['moisture', 'redness', 'firmness', 'texture'],
    irritancyScore: 1,
    description: '3:1:1 Ceramide-Cholesterol-Fatty Acid ratio mimics healthy skin lipid lamellae. Clinically proven barrier repair.',
    suitableSkinTypes: ['dry', 'normal', 'combination', 'oily'],
    incompatibleSkinTypes: [],
    textureVehicle: 'rich_cream',
    safeForSensitive: true,
  },
  {
    id: 'hyaluronic-serum',
    name: 'Multi-Weight Hyaluronic Serum',
    brand: 'HydroLogic',
    priceInr: 699,
    priceUsd: 8,
    daysSupply: 45,
    roles: ['hydrator'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Sodium Hyaluronate (Low MW)', concentration: '1%' },
      { name: 'Sodium Hyaluronate (High MW)', concentration: '0.5%' },
      { name: 'Panthenol', concentration: '1%' },
    ],
    inciList: 'Water, Propanediol, Sodium Hyaluronate, Panthenol, Pentylene Glycol, Ethylhexylglycerin, Caprylyl Glycol',
    targetConcerns: ['moisture', 'texture', 'firmness', 'radiance'],
    irritancyScore: 1,
    description: 'Dual-weight HA for surface + deep hydration. Lightweight, layerable, fragrance-free.',
    suitableSkinTypes: ['oily', 'dry', 'combination', 'normal'],
    incompatibleSkinTypes: [],
    textureVehicle: 'light_fluid',
    safeForSensitive: true,
  },
  {
    id: 'niacinamide-moisturizer',
    name: 'Niacinamide 5% + Zinc PCA Moisturizer',
    brand: 'Balance Botanicals',
    priceInr: 599,
    priceUsd: 7,
    daysSupply: 60,
    roles: ['hydrator', 'niacinamide_pore', 'barrier_repair'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Niacinamide', concentration: '5%' },
      { name: 'Zinc PCA', concentration: '1%' },
      { name: 'Ceramide NP', concentration: '0.5%' },
    ],
    inciList: 'Water, Niacinamide, Zinc PCA, Glycerin, Caprylic/Capric Triglyceride, Ceramide NP, Panthenol, Dimethicone, Carbomer, Phenoxyethanol',
    targetConcerns: ['pore', 'oiliness', 'redness', 'moisture', 'radiance'],
    irritancyScore: 2,
    description: 'Multi-tasking moisturizer: regulates sebum, minimizes pores, strengthens barrier.',
    suitableSkinTypes: ['oily', 'combination', 'normal'],
    incompatibleSkinTypes: ['dry'],
    textureVehicle: 'lotion',
    safeForSensitive: true,
  },

  // Exfoliants
  {
    id: 'glycolic-toner',
    name: 'Glycolic Acid 7% Toner',
    brand: 'Renewal Science',
    priceInr: 799,
    priceUsd: 10,
    daysSupply: 60,
    roles: ['exfoliant_aha_bha'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Glycolic Acid', concentration: '7%', pH: 3.6 },
      { name: 'Aloe Barbadensis Leaf Juice', concentration: '10%' },
    ],
    inciList: 'Water, Glycolic Acid, Aloe Barbadensis Leaf Juice, Sodium Hydroxide, Panthenol, Allantoin, Phenoxyethanol',
    targetConcerns: ['texture', 'radiance', 'wrinkle', 'age_spot', 'pore'],
    irritancyScore: 5,
    description: 'Professional-grade AHA for surface renewal. Improves texture, tone, and fine lines.',
    suitableSkinTypes: ['normal', 'combination', 'oily'],
    incompatibleSkinTypes: ['dry'],
    textureVehicle: 'lotion',
    safeForSensitive: false,
  },
  {
    id: 'mandelic-serum',
    name: 'Mandelic Acid 10% Serum',
    brand: 'Gentle Peel Co.',
    priceInr: 899,
    priceUsd: 11,
    daysSupply: 45,
    roles: ['exfoliant_aha_bha'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Mandelic Acid', concentration: '10%', pH: 3.8 },
      { name: 'Centella Asiatica Extract', concentration: '2%' },
    ],
    inciList: 'Water, Mandelic Acid, Propanediol, Centella Asiatica Extract, Panthenol, Sodium Hydroxide, Ethylhexylglycerin',
    targetConcerns: ['texture', 'acne', 'radiance', 'age_spot', 'redness'],
    irritancyScore: 3,
    description: 'Larger molecule AHA — slower penetration, less irritation. Great for sensitive/acne-prone skin.',
    suitableSkinTypes: ['combination', 'normal', 'dry'],
    incompatibleSkinTypes: [],
    textureVehicle: 'light_fluid',
    safeForSensitive: true,
  },
  {
    id: 'lactic-acid-serum',
    name: 'Lactic Acid 5% + HA Serum',
    brand: 'Milk & Honey Labs',
    priceInr: 749,
    priceUsd: 9,
    daysSupply: 45,
    roles: ['exfoliant_aha_bha', 'hydrator'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Lactic Acid', concentration: '5%', pH: 3.8 },
      { name: 'Sodium Hyaluronate', concentration: '1%' },
    ],
    inciList: 'Water, Lactic Acid, Sodium Hyaluronate, Propanediol, Glycerin, Panthenol, Sodium Hydroxide, Phenoxyethanol',
    targetConcerns: ['texture', 'moisture', 'radiance', 'age_spot'],
    irritancyScore: 3,
    description: 'Gentle AHA with built-in hydration. Improves texture while supporting moisture barrier.',
    suitableSkinTypes: ['dry', 'normal', 'combination'],
    incompatibleSkinTypes: [],
    textureVehicle: 'light_fluid',
    safeForSensitive: true,
  },

  // Retinoids
  {
    id: 'retinal-serum',
    name: 'Retinaldehyde 0.05% Serum',
    brand: 'Vitality Derma',
    priceInr: 1299,
    priceUsd: 16,
    daysSupply: 90,
    roles: ['retinoid'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Retinaldehyde', concentration: '0.05%' },
      { name: 'Ceramide NP', concentration: '1%' },
      { name: 'Bakuchiol', concentration: '1%' },
    ],
    inciList: 'Caprylic/Capric Triglyceride, Retinaldehyde, Ceramide NP, Bakuchiol, Squalane, Tocopherol, Rosmarinus Officinalis Leaf Extract, BHT',
    targetConcerns: ['wrinkle', 'firmness', 'texture', 'acne', 'age_spot', 'pore'],
    irritancyScore: 6,
    description: 'Next-gen retinoid: 11x faster than retinol, less irritation. Encapsulated for stability.',
    suitableSkinTypes: ['normal', 'combination', 'dry', 'oily'],
    incompatibleSkinTypes: [],
    textureVehicle: 'light_fluid',
    safeForSensitive: false,
  },
  {
    id: 'retinol-cream',
    name: 'Retinol 0.3% Night Cream',
    brand: 'Timeless Skin',
    priceInr: 999,
    priceUsd: 12,
    daysSupply: 90,
    roles: ['retinoid', 'hydrator'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Retinol', concentration: '0.3%' },
      { name: 'Ceramide NP', concentration: '1%' },
      { name: 'Shea Butter', concentration: '5%' },
    ],
    inciList: 'Water, Caprylic/Capric Triglyceride, Retinol, Glycerin, Shea Butter, Ceramide NP, Squalane, Dimethicone, Phenoxyethanol',
    targetConcerns: ['wrinkle', 'firmness', 'texture', 'age_spot', 'pore'],
    irritancyScore: 7,
    description: 'Classic retinol in a nourishing cream base. Buffer with moisturizer if new to retinoids.',
    suitableSkinTypes: ['dry', 'normal', 'combination'],
    incompatibleSkinTypes: ['oily'],
    textureVehicle: 'rich_cream',
    safeForSensitive: false,
  },

  // Antioxidants
  {
    id: 'vitamin-c-serum',
    name: 'L-Ascorbic Acid 15% + Vitamin E + Ferulic',
    brand: 'Radiance Rx',
    priceInr: 1199,
    priceUsd: 14,
    daysSupply: 45,
    roles: ['antioxidant_vit_c'],
    usageTime: 'AM',
    activeIngredients: [
      { name: 'L-Ascorbic Acid', concentration: '15%', pH: 3.0 },
      { name: 'Tocopherol (Vitamin E)', concentration: '1%' },
      { name: 'Ferulic Acid', concentration: '0.5%' },
    ],
    inciList: 'Water, Propylene Glycol, Ascorbic Acid, Tocopherol, Ferulic Acid, Panthenol, Phenoxyethanol',
    targetConcerns: ['radiance', 'age_spot', 'firmness', 'wrinkle', 'redness'],
    irritancyScore: 6,
    description: 'Gold-standard antioxidant trio. Brightens, protects against UV damage, boosts collagen. Use AM under SPF.',
    suitableSkinTypes: ['normal', 'combination', 'oily'],
    incompatibleSkinTypes: ['dry'],
    textureVehicle: 'light_fluid',
    safeForSensitive: false,
  },
  {
    id: 'vitamin-c-derivative-serum',
    name: 'Tetrahexyldecyl Ascorbate 10% Serum',
    brand: 'Glow Science',
    priceInr: 999,
    priceUsd: 12,
    daysSupply: 60,
    roles: ['antioxidant_vit_c'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Tetrahexyldecyl Ascorbate', concentration: '10%' },
      { name: 'Vitamin E', concentration: '1%' },
    ],
    inciList: 'Caprylic/Capric Triglyceride, Tetrahexyldecyl Ascorbate, Tocopherol, Squalane, Rosmarinus Officinalis Leaf Extract',
    targetConcerns: ['radiance', 'age_spot', 'firmness', 'redness'],
    irritancyScore: 2,
    description: 'Oil-soluble, stable Vitamin C derivative. Non-irritating, compatible with retinoids and acids.',
    suitableSkinTypes: ['dry', 'normal', 'combination'],
    incompatibleSkinTypes: ['oily'],
    textureVehicle: 'balm_oil',
    safeForSensitive: true,
  },

  // Targeted Treatments
  {
    id: 'azelaic-acid-cream',
    name: 'Azelaic Acid 10% Cream',
    brand: 'ClearPath',
    priceInr: 799,
    priceUsd: 10,
    daysSupply: 60,
    roles: ['azelaic_treatment'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Azelaic Acid', concentration: '10%' },
      { name: 'Niacinamide', concentration: '2%' },
    ],
    inciList: 'Water, Azelaic Acid, Niacinamide, Dimethicone, Glycerin, Panthenol, Carbomer, Phenoxyethanol',
    targetConcerns: ['redness', 'acne', 'radiance', 'age_spot', 'texture'],
    irritancyScore: 3,
    description: 'Multi-action for rosacea-prone, acne, and pigmentation. Anti-inflammatory, antimicrobial, brightening.',
    suitableSkinTypes: ['normal', 'combination', 'dry'],
    incompatibleSkinTypes: [],
    textureVehicle: 'cream',
    safeForSensitive: true,
  },
  {
    id: 'niacinamide-serum',
    name: 'Niacinamide 10% + Zinc 1% Serum',
    brand: 'Pore Control',
    priceInr: 549,
    priceUsd: 7,
    daysSupply: 60,
    roles: ['niacinamide_pore'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Niacinamide', concentration: '10%' },
      { name: 'Zinc PCA', concentration: '1%' },
    ],
    inciList: 'Water, Niacinamide, Zinc PCA, Propanediol, Panthenol, Phenoxyethanol, Ethylhexylglycerin',
    targetConcerns: ['pore', 'oiliness', 'redness', 'radiance', 'texture'],
    irritancyScore: 2,
    description: 'High-strength niacinamide for pore refinement and sebum control. Fragrance-free.',
    suitableSkinTypes: ['oily', 'combination', 'normal'],
    incompatibleSkinTypes: ['dry'],
    textureVehicle: 'light_fluid',
    safeForSensitive: true,
  },
  {
    id: 'peptide-eye-cream',
    name: 'Peptide Complex Eye Cream',
    brand: 'Youthful Gaze',
    priceInr: 899,
    priceUsd: 11,
    daysSupply: 90,
    roles: ['eye_treatment'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Acetyl Tetrapeptide-5', concentration: '1%' },
      { name: 'Palmitoyl Tripeptide-1', concentration: '2%' },
      { name: 'Caffeine', concentration: '3%' },
      { name: 'Ceramide NP', concentration: '1%' },
    ],
    inciList: 'Water, Glycerin, Caprylic/Capric Triglyceride, Acetyl Tetrapeptide-5, Palmitoyl Tripeptide-1, Caffeine, Ceramide NP, Squalane, Phenoxyethanol',
    targetConcerns: ['eye_bag', 'dark_circle_v2', 'wrinkle', 'firmness', 'droopy_upper_eyelid', 'droopy_lower_eyelid', 'tear_trough'],
    irritancyScore: 1,
    description: 'Targeted peptides + caffeine for periorbital concerns. Reduces puffiness, dark circles, fine lines.',
    suitableSkinTypes: ['dry', 'normal', 'combination', 'oily'],
    incompatibleSkinTypes: [],
    textureVehicle: 'rich_cream',
    safeForSensitive: true,
  },
  {
    id: 'caffeine-eye-serum',
    name: 'Caffeine 5% + EGCG Eye Serum',
    brand: 'Bright Eyes',
    priceInr: 649,
    priceUsd: 8,
    daysSupply: 60,
    roles: ['eye_treatment'],
    usageTime: 'AM',
    activeIngredients: [
      { name: 'Caffeine', concentration: '5%' },
      { name: 'EGCG (Green Tea)', concentration: '1%' },
      { name: 'Hyaluronic Acid', concentration: '1%' },
    ],
    inciList: 'Water, Caffeine, Epigallocatechin Gallate, Sodium Hyaluronate, Propanediol, Panthenol, Phenoxyethanol',
    targetConcerns: ['eye_bag', 'dark_circle_v2', 'droopy_upper_eyelid', 'droopy_lower_eyelid'],
    irritancyScore: 1,
    description: 'Lightweight AM serum for undereye puffiness and vascular dark circles. Cooling metal tip applicator.',
    suitableSkinTypes: ['oily', 'combination', 'normal'],
    incompatibleSkinTypes: ['dry'],
    textureVehicle: 'light_fluid',
    safeForSensitive: true,
  },

  // Sunscreens
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
      { name: 'Zinc Oxide (Non-Nano)', concentration: '20%' },
      { name: 'Titanium Dioxide', concentration: '5%' },
      { name: 'Niacinamide', concentration: '2%' },
    ],
    inciList: 'Water, Zinc Oxide, Titanium Dioxide, Caprylic/Capric Triglyceride, Niacinamide, Glycerin, Dimethicone, Polyhydroxystearic Acid, Triethoxycaprylylsilane, Phenoxyethanol',
    targetConcerns: ['radiance', 'age_spot', 'wrinkle', 'redness', 'firmness'],
    irritancyScore: 1,
    description: '100% mineral, non-nano, reef-safe. No white cast on most skin tones. Niacinamide calms while protecting.',
    suitableSkinTypes: ['normal', 'combination', 'dry', 'oily'],
    incompatibleSkinTypes: [],
    textureVehicle: 'cream',
    safeForSensitive: true,
  },
  {
    id: 'hybrid-spf40',
    name: 'Hybrid SPF 40 PA+++',
    brand: 'Urban Screen',
    priceInr: 699,
    priceUsd: 9,
    daysSupply: 60,
    roles: ['sunscreen_spf', 'hydrator'],
    usageTime: 'AM',
    activeIngredients: [
      { name: 'Zinc Oxide', concentration: '10%' },
      { name: 'Octinoxate', concentration: '7.5%' },
      { name: 'Hyaluronic Acid', concentration: '1%' },
      { name: 'Vitamin E', concentration: '1%' },
    ],
    inciList: 'Water, Zinc Oxide, Octinoxate, Caprylic/Capric Triglyceride, Sodium Hyaluronate, Tocopherol, Glycerin, Dimethicone, Phenoxyethanol',
    targetConcerns: ['radiance', 'age_spot', 'wrinkle', 'moisture', 'firmness'],
    irritancyScore: 2,
    description: 'Lightweight hybrid formula. Hydrating, invisible finish, makeup-friendly.',
    suitableSkinTypes: ['normal', 'combination', 'dry', 'oily'],
    incompatibleSkinTypes: [],
    textureVehicle: 'light_fluid',
    safeForSensitive: false,
  },

  // Additional products for variety
  {
    id: 'squalane-oil',
    name: '100% Plant-Derived Squalane Oil',
    brand: 'Pure Essentials',
    priceInr: 599,
    priceUsd: 7,
    daysSupply: 90,
    roles: ['hydrator', 'barrier_repair'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Squalane', concentration: '100%' },
    ],
    inciList: 'Squalane',
    targetConcerns: ['moisture', 'texture', 'firmness', 'redness'],
    irritancyScore: 1,
    description: 'Bio-identical to skin\'s own squalene. Locks in moisture, non-comedogenic, antioxidant.',
    suitableSkinTypes: ['dry', 'normal', 'combination'],
    incompatibleSkinTypes: ['oily'],
    textureVehicle: 'balm_oil',
    safeForSensitive: true,
  },
  {
    id: 'bha-liquid',
    name: 'Salicylic Acid 2% Liquid Exfoliant',
    brand: 'Pore Perfect',
    priceInr: 849,
    priceUsd: 10,
    daysSupply: 60,
    roles: ['exfoliant_aha_bha'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Salicylic Acid', concentration: '2%', pH: 3.2 },
      { name: 'Green Tea Extract', concentration: '1%' },
    ],
    inciList: 'Water, Butylene Glycol, Salicylic Acid, Camellia Sinensis Leaf Extract, Methylpropanediol, Sodium Hydroxide, Phenoxyethanol',
    targetConcerns: ['pore', 'acne', 'oiliness', 'texture', 'blackheads'],
    irritancyScore: 4,
    description: 'Leave-on BHA liquid. Penetrates pores to dissolve sebum and dead skin. Anti-inflammatory.',
    suitableSkinTypes: ['oily', 'combination', 'normal'],
    incompatibleSkinTypes: ['dry'],
    textureVehicle: 'light_fluid',
    safeForSensitive: false,
  },
  {
    id: 'tranexamic-serum',
    name: 'Tranexamic Acid 3% + Niacinamide 5% Serum',
    brand: 'Even Tone',
    priceInr: 899,
    priceUsd: 11,
    daysSupply: 60,
    roles: ['antioxidant_vit_c', 'niacinamide_pore'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Tranexamic Acid', concentration: '3%' },
      { name: 'Niacinamide', concentration: '5%' },
    ],
    inciList: 'Water, Tranexamic Acid, Niacinamide, Propanediol, Panthenol, Phenoxyethanol, Ethylhexylglycerin',
    targetConcerns: ['age_spot', 'radiance', 'redness', 'dark_circle_v2', 'pore'],
    irritancyScore: 2,
    description: 'Clinical-strength for stubborn pigmentation and post-inflammatory erythema. Gentle, non-acidic.',
    suitableSkinTypes: ['normal', 'combination', 'dry'],
    incompatibleSkinTypes: ['oily'],
    textureVehicle: 'light_fluid',
    safeForSensitive: true,
  },
  {
    id: 'centella-cica-cream',
    name: 'Centella Asiatica Cica Cream',
    brand: 'Soothe & Repair',
    priceInr: 649,
    priceUsd: 8,
    daysSupply: 60,
    roles: ['barrier_repair', 'hydrator'],
    usageTime: 'BOTH',
    activeIngredients: [
      { name: 'Centella Asiatica Extract', concentration: '50%' },
      { name: 'Madecassoside', concentration: '0.1%' },
      { name: 'Ceramide NP', concentration: '1%' },
      { name: 'Panthenol', concentration: '5%' },
    ],
    inciList: 'Water, Centella Asiatica Extract, Glycerin, Caprylic/Capric Triglyceride, Madecassoside, Ceramide NP, Panthenol, Dimethicone, Phenoxyethanol',
    targetConcerns: ['redness', 'moisture', 'texture'],
    irritancyScore: 1,
    description: 'High-concentration Cica for compromised barriers, post-procedure, rosacea. Instant soothing.',
    suitableSkinTypes: ['dry', 'normal', 'combination', 'oily'],
    incompatibleSkinTypes: [],
    textureVehicle: 'rich_cream',
    safeForSensitive: true,
  },
  {
    id: 'bakuchiol-serum',
    name: 'Bakuchiol 1% + Squalane Serum',
    brand: 'Nature\'s Retinol',
    priceInr: 949,
    priceUsd: 12,
    daysSupply: 60,
    roles: ['retinoid'],
    usageTime: 'PM',
    activeIngredients: [
      { name: 'Bakuchiol', concentration: '1%' },
      { name: 'Squalane', concentration: '50%' },
    ],
    inciList: 'Squalane, Bakuchiol, Tocopherol, Rosmarinus Officinalis Leaf Extract',
    targetConcerns: ['wrinkle', 'firmness', 'texture', 'age_spot', 'radiance'],
    irritancyScore: 1,
    description: 'Plant-based retinol alternative. No photosensitivity, safe for pregnancy, compatible with acids.',
    suitableSkinTypes: ['dry', 'normal', 'combination', 'oily'],
    incompatibleSkinTypes: [],
    textureVehicle: 'balm_oil',
    safeForSensitive: true,
  },
];

export function getProductById(id: string): Product | undefined {
  return CATALOG.find(p => p.id === id);
}

export function getProductsByRole(role: FunctionalRole): Product[] {
  return CATALOG.filter(p => p.roles.includes(role));
}

export function getProductsByConcern(concern: string): Product[] {
  return CATALOG.filter(p => p.targetConcerns.includes(concern));
}

export function calculateCostPerDay(product: Product, currency: 'INR' | 'USD' = 'INR'): number {
  const price = currency === 'INR' ? product.priceInr : product.priceUsd;
  return price / product.daysSupply;
}

export function calculateCostPerMonth(product: Product, currency: 'INR' | 'USD' = 'INR'): number {
  return calculateCostPerDay(product, currency) * 30;
}
import { ShelfProduct } from "@/types/engine";

export function createDefaultShelf(): ShelfProduct[] {
  return [
    {
      id: "gentle-cream-cleanser",
      name: "Gentle Cream Cleanser",
      brand: "Apothecary Lab",
      priceInr: 499,
      priceUsd: 6,
      daysSupply: 90,
      roles: ["cleanser"],
      usageTime: "BOTH",
      activeIngredients: [
        { name: "Ceramide NP", concentration: "1%" },
        { name: "Glycerin", concentration: "5%" },
      ],
      inciList: "Water, Glycerin, Caprylic/Capric Triglyceride, Ceramide NP, Cholesterol, Panthenol, Sodium Lauroyl Lactylate, Xanthan Gum, Phenoxyethanol, Ethylhexylglycerin",
      targetConcerns: ["moisture", "redness", "texture"],
      irritancyScore: 1,
      description: "pH-balanced cream cleanser that respects the barrier.",
      suitableSkinTypes: ["normal", "dry", "combination", "oily"],
      incompatibleSkinTypes: [],
      textureVehicle: "cream_cleanser",
      safeForSensitive: true,
    },
    {
      id: "ceramide-barrier-cream",
      name: "Ceramide Barrier Repair Cream",
      brand: "Apothecary Lab",
      priceInr: 899,
      priceUsd: 11,
      daysSupply: 60,
      roles: ["hydrator", "barrier_repair"],
      usageTime: "BOTH",
      activeIngredients: [
        { name: "Ceramide NP", concentration: "2%" },
        { name: "Ceramide AP", concentration: "1%" },
        { name: "Ceramide EOP", concentration: "1%" },
        { name: "Cholesterol", concentration: "1.5%" },
      ],
      inciList: "Water, Caprylic/Capric Triglyceride, Glycerin, Ceramide NP, Ceramide AP, Ceramide EOP, Cholesterol, Phytosphingosine, Panthenol, Squalane, Beta-Glucan, Dimethicone, Carbomer, Sodium Hyaluronate, Phenoxyethanol",
      targetConcerns: ["moisture", "redness", "firmness", "texture"],
      irritancyScore: 1,
      description: "3:1:1 Ceramide-Cholesterol-Fatty Acid ratio mimics healthy skin lipid lamellae.",
      suitableSkinTypes: ["dry", "normal", "combination"],
      incompatibleSkinTypes: ["oily"],
      textureVehicle: "rich_cream",
      safeForSensitive: true,
    },
    {
      id: "mineral-spf50",
      name: "Mineral SPF 50+ PA++++",
      brand: "Shield Daily",
      priceInr: 799,
      priceUsd: 10,
      daysSupply: 60,
      roles: ["sunscreen_spf"],
      usageTime: "AM",
      activeIngredients: [
        { name: "Zinc Oxide", concentration: "20%" },
        { name: "Titanium Dioxide", concentration: "5%" },
      ],
      inciList: "Water, Zinc Oxide, Titanium Dioxide, Caprylic/Capric Triglyceride, Niacinamide, Glycerin, Dimethicone, Phenoxyethanol",
      targetConcerns: ["radiance", "age_spot", "wrinkle", "redness"],
      irritancyScore: 1,
      description: "100% mineral, non-nano, reef-safe sunscreen.",
      suitableSkinTypes: ["normal", "dry", "combination", "oily"],
      incompatibleSkinTypes: [],
      textureVehicle: "cream",
      safeForSensitive: true,
    },
  ];
}

export function createMockShelf(overrides: Partial<ShelfProduct>[] = []): ShelfProduct[] {
  const defaults = createDefaultShelf();
  if (overrides.length === 0) return defaults;
  return defaults.map((p, i) => {
    const override = overrides[i];
    if (!override) return p;
    return { ...p, ...override };
  });
}

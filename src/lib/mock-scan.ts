import { YouCamConcern, YouCamSkinType } from "@/types/youcam";

export interface ParsedScan {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
  skinAge: number;
  overallScore: number;
}

export const mockScan: ParsedScan = {
  skinType: { type: "Normal", region: "whole" },
  skinAge: 28,
  overallScore: 86.33,
  concerns: [
    { type: "wrinkle", uiScore: 98, rawScore: 99, maskUrls: ["/demo-scan/mask_wrinkle.png"] },
    { type: "pore", uiScore: 91, rawScore: 94, maskUrls: ["/demo-scan/mask_pore.png"] },
    { type: "texture", uiScore: 86, rawScore: 90, maskUrls: ["/demo-scan/mask_texture.png"] },
    { type: "acne", uiScore: 96, rawScore: 98, maskUrls: ["/demo-scan/mask_acne.png"] },
    { type: "oiliness", uiScore: 83, rawScore: 84, maskUrls: ["/demo-scan/mask_oiliness.png"] },
    { type: "radiance", uiScore: 83, rawScore: 86, maskUrls: ["/demo-scan/mask_radiance.png"] },
    { type: "eye_bag", uiScore: 83, rawScore: 84, maskUrls: ["/demo-scan/mask_eye_bag.png"] },
    { type: "age_spot", uiScore: 96, rawScore: 98, maskUrls: ["/demo-scan/mask_age_spot.png"] },
    { type: "dark_circle_v2", uiScore: 77, rawScore: 83, maskUrls: ["/demo-scan/mask_dark_circle.png"] },
    { type: "droopy_upper_eyelid", uiScore: 84, rawScore: 86, maskUrls: ["/demo-scan/mask_droopy_upper.png"] },
    { type: "droopy_lower_eyelid", uiScore: 71, rawScore: 58, maskUrls: ["/demo-scan/mask_droopy_lower.png"] },
    { type: "firmness", uiScore: 91, rawScore: 94, maskUrls: ["/demo-scan/mask_firmness.png"] },
    { type: "moisture", uiScore: 77, rawScore: 67, maskUrls: ["/demo-scan/mask_moisture.png"] },
    { type: "redness", uiScore: 83, rawScore: 85, maskUrls: ["/demo-scan/mask_redness.png"] },
    { type: "tear_trough", uiScore: 96, rawScore: 97, maskUrls: ["/demo-scan/mask_tear_trough.png"] },
    { type: "skin_type", uiScore: 0, rawScore: 0, maskUrls: [] },
  ],
};

export const CONCERN_LABELS: Record<string, string> = {
  wrinkle: "Fine Lines & Wrinkles",
  pore: "Pore Visibility",
  texture: "Skin Texture",
  acne: "Acne & Blemishes",
  oiliness: "Oiliness / Sebum",
  radiance: "Radiance",
  eye_bag: "Eye Bags",
  age_spot: "Age Spots / Hyperpigmentation",
  dark_circle_v2: "Dark Circles",
  droopy_upper_eyelid: "Drooping Upper Eyelid",
  droopy_lower_eyelid: "Drooping Lower Eyelid",
  firmness: "Firmness",
  moisture: "Moisture / Hydration",
  redness: "Redness / Irritation",
  tear_trough: "Tear Trough Depth",
  skin_type: "Skin Type",
};

export const CONCERN_COLORS: Record<string, string> = {
  low: "#2ecc71",
  medium: "#f59e0b",
  high: "#e74c3c",
};

export function getConcernColor(score: number): string {
  if (score >= 85) return CONCERN_COLORS.low;
  if (score >= 60) return CONCERN_COLORS.medium;
  return CONCERN_COLORS.high;
}

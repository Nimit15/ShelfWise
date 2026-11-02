import { YouCamConcern, YouCamSkinType } from "@/types/youcam";

export interface ParsedScan {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
  skinAge: number;
  overallScore: number;
  source?: "youcam" | "demo";
}

export const mockScan: ParsedScan = {
  skinType: { type: "Normal", region: "whole" },
  skinAge: 28,
  overallScore: 86.33,
  source: "demo",
  concerns: [
    { type: "hd_wrinkle", uiScore: 98, rawScore: 99, maskUrls: [] },
    { type: "hd_pore", uiScore: 91, rawScore: 94, maskUrls: [] },
    { type: "hd_texture", uiScore: 86, rawScore: 90, maskUrls: [] },
    { type: "hd_acne", uiScore: 96, rawScore: 98, maskUrls: [] },
    { type: "hd_oiliness", uiScore: 83, rawScore: 84, maskUrls: [] },
    { type: "hd_radiance", uiScore: 83, rawScore: 86, maskUrls: [] },
    { type: "hd_eye_bag", uiScore: 83, rawScore: 84, maskUrls: [] },
    { type: "hd_age_spot", uiScore: 96, rawScore: 98, maskUrls: [] },
    { type: "hd_dark_circle", uiScore: 77, rawScore: 83, maskUrls: [] },
    { type: "hd_droopy_upper_eyelid", uiScore: 84, rawScore: 86, maskUrls: [] },
    { type: "hd_droopy_lower_eyelid", uiScore: 71, rawScore: 58, maskUrls: [] },
    { type: "hd_firmness", uiScore: 91, rawScore: 94, maskUrls: [] },
    { type: "hd_moisture", uiScore: 55, rawScore: 45, maskUrls: [] },
    { type: "hd_redness", uiScore: 83, rawScore: 85, maskUrls: [] },
    { type: "hd_tear_trough", uiScore: 96, rawScore: 97, maskUrls: [] },
    { type: "hd_skin_type", uiScore: 0, rawScore: 0, maskUrls: [] },
  ],
};

export const CONCERN_LABELS: Record<string, string> = {
  // SD concerns
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
  // HD concerns (from YouCam API)
  hd_wrinkle: "Fine Lines & Wrinkles",
  hd_pore: "Pore Visibility",
  hd_texture: "Skin Texture",
  hd_acne: "Acne & Blemishes",
  hd_oiliness: "Oiliness / Sebum",
  hd_radiance: "Radiance",
  hd_eye_bag: "Eye Bags",
  hd_age_spot: "Age Spots / Hyperpigmentation",
  hd_dark_circle: "Dark Circles",
  hd_droopy_upper_eyelid: "Drooping Upper Eyelid",
  hd_droopy_lower_eyelid: "Drooping Lower Eyelid",
  hd_firmness: "Firmness",
  hd_moisture: "Moisture / Hydration",
  hd_redness: "Redness / Irritation",
  hd_tear_trough: "Tear Trough Depth",
  hd_skin_type: "Skin Type",
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

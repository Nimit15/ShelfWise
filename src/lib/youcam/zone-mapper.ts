import { YouCamConcern } from '@/types/youcam';

export type FacialZone = 'forehead' | 'eyes' | 'cheeks' | 'nose' | 'chin' | 'whole_face';

export interface ZoneConcern {
  concern: string;
  uiScore: number;
  score: number; // alias for uiScore
  rawScore: number;
  stars: number;
  maskUrls: string[];
}

export interface ZoneAnalysis {
  zone: FacialZone;
  label: string;
  concerns: ZoneConcern[];
  priorityConcerns: ZoneConcern[]; // Top 3 worst (lowest scores)
  strongestConcerns: ZoneConcern[]; // Top 3 best (highest scores)
  overallScore: number;
  overallStars: number;
}

export interface FullZoneMap {
  zones: ZoneAnalysis[];
  globalPriorityConcerns: ZoneConcern[]; // Top 3 worst across all zones
  globalStrongestConcerns: ZoneConcern[]; // Top 3 best across all zones
  skinType: { type: string; region: string };
  skinAge: number;
  overallScore: number;
}

/**
 * Mapping of YouCam concerns to facial zones
 * Based on YouCam HD analysis regional breakdowns
 */
const CONCERN_TO_ZONE: Record<string, FacialZone> = {
  // Forehead zone
  'hd_wrinkle': 'forehead',
  'hd_age_spot': 'forehead',
  'hd_firmness': 'forehead',
  'wrinkle': 'forehead',
  'age_spot': 'forehead',
  'firmness': 'forehead',

  // Eyes zone
  'hd_dark_circle': 'eyes',
  'hd_eye_bag': 'eyes',
  'hd_tear_trough': 'eyes',
  'hd_droopy_upper_eyelid': 'eyes',
  'hd_droopy_lower_eyelid': 'eyes',
  'dark_circle_v2': 'eyes',
  'eye_bag': 'eyes',
  'tear_trough': 'eyes',
  'droopy_upper_eyelid': 'eyes',
  'droopy_lower_eyelid': 'eyes',

  // Cheeks zone
  'hd_pore': 'cheeks',
  'hd_redness': 'cheeks',
  'hd_radiance': 'cheeks',
  'hd_moisture': 'cheeks',
  'hd_oiliness': 'cheeks',
  'hd_acne': 'cheeks',
  'hd_texture': 'cheeks',
  'pore': 'cheeks',
  'redness': 'cheeks',
  'radiance': 'cheeks',
  'moisture': 'cheeks',
  'oiliness': 'cheeks',
  'acne': 'cheeks',
  'texture': 'cheeks',

  // Nose zone (often part of T-zone)
  // No specific concerns mapped exclusively to nose in standard YouCam

  // Chin zone
  // Often shares with cheeks for jawline concerns

  // Whole face (global)
  'hd_skin_type': 'whole_face',
  'skin_type': 'whole_face',
};

/**
 * Zone display labels
 */
const ZONE_LABELS: Record<FacialZone, string> = {
  forehead: 'Forehead',
  eyes: 'Eye Area',
  cheeks: 'Cheeks',
  nose: 'Nose',
  chin: 'Chin',
  whole_face: 'Full Face',
};

/**
 * Star rating from uiScore
 * ≥85 ★★★★★, 70-84 ★★★★, 55-69 ★★★, 40-54 ★★, <40 ★
 */
export function starRating(uiScore: number): number {
  if (uiScore >= 85) return 5;
  if (uiScore >= 70) return 4;
  if (uiScore >= 55) return 3;
  if (uiScore >= 40) return 2;
  return 1;
}

/**
 * Get zone for a concern type
 */
export function getZoneForConcern(concernType: string): FacialZone {
  return CONCERN_TO_ZONE[concernType] ?? 'whole_face';
}

/**
 * Map scan concerns to facial zones with star ratings and top3 priority/strongest
 */
export function mapConcernsToZones(
  concerns: YouCamConcern[],
  skinType: { type: string; region: string },
  skinAge: number,
  overallScore: number
): FullZoneMap {
  // Group concerns by zone
  const zoneMap = new Map<FacialZone, ZoneConcern[]>();

  for (const concern of concerns) {
    const zone = getZoneForConcern(concern.type);
    if (!zoneMap.has(zone)) {
      zoneMap.set(zone, []);
    }
    zoneMap.get(zone)!.push({
      concern: concern.type,
      uiScore: concern.uiScore,
      score: concern.uiScore, // alias for compatibility
      rawScore: concern.rawScore,
      stars: starRating(concern.uiScore),
      maskUrls: concern.maskUrls,
    });
  }

  // Build zone analyses
  const zones: ZoneAnalysis[] = [];

  for (const [zone, zoneConcerns] of zoneMap.entries()) {
    // Filter out skin_type from ALL zone-specific analysis
    const validConcerns = zoneConcerns.filter(c => c.concern !== 'hd_skin_type' && c.concern !== 'skin_type');

    if (validConcerns.length === 0) continue;

    // Sort by score ascending (worst first) for priority
    const sortedByWorst = [...validConcerns].sort((a, b) => a.uiScore - b.uiScore || a.concern.localeCompare(b.concern));
    // Sort by score descending (best first) for strengths
    const sortedByBest = [...validConcerns].sort((a, b) => b.uiScore - a.uiScore || a.concern.localeCompare(b.concern));

    const priorityConcerns = sortedByWorst.slice(0, 3);
    const strongestConcerns = sortedByBest.slice(0, 3);

    const overallScore = validConcerns.reduce((sum, c) => sum + c.uiScore, 0) / validConcerns.length;

    zones.push({
      zone,
      label: ZONE_LABELS[zone],
      concerns: validConcerns,
      priorityConcerns,
      strongestConcerns,
      overallScore: Math.round(overallScore),
      overallStars: starRating(Math.round(overallScore)),
    });
  }

  // Sort zones by priority (zones with worst concerns first), but exclude whole_face from sorting priority
  // whole_face should always be last
  zones.sort((a, b) => {
    if (a.zone === 'whole_face') return 1;
    if (b.zone === 'whole_face') return -1;
    const aWorst = a.priorityConcerns[0]?.uiScore ?? 100;
    const bWorst = b.priorityConcerns[0]?.uiScore ?? 100;
    return aWorst - bWorst;
  });

  // Global top 3 worst (priority) concerns
  const allValidConcerns = concerns.filter(c => c.type !== 'hd_skin_type' && c.type !== 'skin_type');
  const globalSortedWorst = [...allValidConcerns]
    .sort((a, b) => a.uiScore - b.uiScore || a.type.localeCompare(b.type))
    .slice(0, 3)
    .map(c => ({
      concern: c.type,
      uiScore: c.uiScore,
      score: c.uiScore, // alias for compatibility
      rawScore: c.rawScore,
      stars: starRating(c.uiScore),
      maskUrls: c.maskUrls,
    }));

  // Global top 3 best (strongest) concerns
  const globalSortedBest = [...allValidConcerns]
    .sort((a, b) => b.uiScore - a.uiScore || a.type.localeCompare(b.type))
    .slice(0, 3)
    .map(c => ({
      concern: c.type,
      uiScore: c.uiScore,
      score: c.uiScore, // alias for compatibility
      rawScore: c.rawScore,
      stars: starRating(c.uiScore),
      maskUrls: c.maskUrls,
    }));

  return {
    zones,
    globalPriorityConcerns: globalSortedWorst,
    globalStrongestConcerns: globalSortedBest,
    skinType,
    skinAge,
    overallScore,
  };
}

/**
 * Get concern display name
 */
export function getConcernDisplayName(concernType: string): string {
  const labels: Record<string, string> = {
    // HD concerns
    hd_wrinkle: 'Wrinkles',
    hd_pore: 'Pores',
    hd_texture: 'Texture',
    hd_acne: 'Acne',
    hd_redness: 'Redness',
    hd_oiliness: 'Oiliness',
    hd_moisture: 'Hydration',
    hd_radiance: 'Radiance',
    hd_firmness: 'Firmness',
    hd_dark_circle: 'Dark Circles',
    hd_eye_bag: 'Eye Bags',
    hd_tear_trough: 'Tear Trough',
    hd_droopy_upper_eyelid: 'Droopy Upper Eyelid',
    hd_droopy_lower_eyelid: 'Droopy Lower Eyelid',
    hd_age_spot: 'Age Spots',
    hd_skin_type: 'Skin Type',

    // SD concerns
    wrinkle: 'Wrinkles',
    pore: 'Pores',
    texture: 'Texture',
    acne: 'Acne',
    redness: 'Redness',
    oiliness: 'Oiliness',
    moisture: 'Hydration',
    radiance: 'Radiance',
    firmness: 'Firmness',
    dark_circle_v2: 'Dark Circles',
    eye_bag: 'Eye Bags',
    tear_trough: 'Tear Trough',
    droopy_upper_eyelid: 'Droopy Upper Eyelid',
    droopy_lower_eyelid: 'Droopy Lower Eyelid',
    age_spot: 'Age Spots',
    skin_type: 'Skin Type',
  };

  return labels[concernType] ?? concernType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get concern color for UI
 */
export function getConcernColor(uiScore: number): string {
  if (uiScore >= 85) return '#10B981'; // Green - excellent
  if (uiScore >= 70) return '#84CC16'; // Light green - good
  if (uiScore >= 55) return '#EAB308'; // Yellow - fair
  if (uiScore >= 40) return '#F97316'; // Orange - poor
  return '#EF4444'; // Red - critical
}

/**
 * Format star rating as string
 */
export function formatStars(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

/**
 * Get zone icon/emoji for UI
 */
export function getZoneIcon(zone: FacialZone): string {
  const icons: Record<FacialZone, string> = {
    forehead: '👁️',
    eyes: '👁️',
    cheeks: '😊',
    nose: '👃',
    chin: '😐',
    whole_face: '👤',
  };
  return icons[zone];
}
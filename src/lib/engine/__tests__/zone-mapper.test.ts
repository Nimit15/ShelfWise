import { describe, it, expect } from 'vitest';
import { mapConcernsToZones, starRating, getZoneForConcern, getConcernDisplayName } from '@/lib/youcam/zone-mapper';
import { YouCamConcern } from '@/types/youcam';

function createMockConcerns(overrides: Record<string, number> = {}): YouCamConcern[] {
  const defaults: Record<string, number> = {
    hd_wrinkle: 80,
    hd_pore: 75,
    hd_texture: 70,
    hd_acne: 85,
    hd_oiliness: 60,
    hd_radiance: 80,
    hd_eye_bag: 70,
    hd_age_spot: 85,
    hd_dark_circle: 65,
    hd_droopy_upper_eyelid: 75,
    hd_droopy_lower_eyelid: 70,
    hd_firmness: 75,
    hd_moisture: 65,
    hd_redness: 70,
    hd_tear_trough: 80,
    hd_skin_type: 0,
  };

  return Object.entries({ ...defaults, ...overrides }).map(([type, uiScore]) => ({
    type,
    uiScore,
    rawScore: uiScore + 5,
    maskUrls: [],
  }));
}

describe('starRating', () => {
  it('should return 5 stars for score >= 85', () => {
    expect(starRating(85)).toBe(5);
    expect(starRating(100)).toBe(5);
    expect(starRating(90)).toBe(5);
  });

  it('should return 4 stars for score 70-84', () => {
    expect(starRating(70)).toBe(4);
    expect(starRating(84)).toBe(4);
    expect(starRating(75)).toBe(4);
  });

  it('should return 3 stars for score 55-69', () => {
    expect(starRating(55)).toBe(3);
    expect(starRating(69)).toBe(3);
    expect(starRating(60)).toBe(3);
  });

  it('should return 2 stars for score 40-54', () => {
    expect(starRating(40)).toBe(2);
    expect(starRating(54)).toBe(2);
    expect(starRating(45)).toBe(2);
  });

  it('should return 1 star for score < 40', () => {
    expect(starRating(39)).toBe(1);
    expect(starRating(0)).toBe(1);
    expect(starRating(20)).toBe(1);
  });
});

describe('getZoneForConcern', () => {
  it('should map forehead concerns correctly', () => {
    expect(getZoneForConcern('hd_wrinkle')).toBe('forehead');
    expect(getZoneForConcern('hd_age_spot')).toBe('forehead');
    expect(getZoneForConcern('hd_firmness')).toBe('forehead');
    expect(getZoneForConcern('wrinkle')).toBe('forehead');
    expect(getZoneForConcern('age_spot')).toBe('forehead');
  });

  it('should map eye concerns correctly', () => {
    expect(getZoneForConcern('hd_dark_circle')).toBe('eyes');
    expect(getZoneForConcern('hd_eye_bag')).toBe('eyes');
    expect(getZoneForConcern('hd_tear_trough')).toBe('eyes');
    expect(getZoneForConcern('hd_droopy_upper_eyelid')).toBe('eyes');
    expect(getZoneForConcern('hd_droopy_lower_eyelid')).toBe('eyes');
    expect(getZoneForConcern('dark_circle_v2')).toBe('eyes');
    expect(getZoneForConcern('eye_bag')).toBe('eyes');
  });

  it('should map cheek concerns correctly', () => {
    expect(getZoneForConcern('hd_pore')).toBe('cheeks');
    expect(getZoneForConcern('hd_redness')).toBe('cheeks');
    expect(getZoneForConcern('hd_radiance')).toBe('cheeks');
    expect(getZoneForConcern('hd_moisture')).toBe('cheeks');
    expect(getZoneForConcern('hd_oiliness')).toBe('cheeks');
    expect(getZoneForConcern('hd_acne')).toBe('cheeks');
    expect(getZoneForConcern('hd_texture')).toBe('cheeks');
    expect(getZoneForConcern('pore')).toBe('cheeks');
    expect(getZoneForConcern('redness')).toBe('cheeks');
  });

  it('should map skin_type to whole_face', () => {
    expect(getZoneForConcern('hd_skin_type')).toBe('whole_face');
    expect(getZoneForConcern('skin_type')).toBe('whole_face');
  });

  it('should default to whole_face for unknown concerns', () => {
    expect(getZoneForConcern('unknown_concern')).toBe('whole_face');
  });
});

describe('mapConcernsToZones', () => {
  it('should create zones for all facial areas (except whole_face which has no valid concerns)', () => {
    const concerns = createMockConcerns();
    const skinType = { type: 'Normal', region: 'whole' };
    const skinAge = 25;
    const overallScore = 75;

    const result = mapConcernsToZones(concerns, skinType, skinAge, overallScore);

    expect(result.zones.length).toBeGreaterThan(0);
    const zoneNames = result.zones.map(z => z.zone);
    expect(zoneNames).toContain('forehead');
    expect(zoneNames).toContain('eyes');
    expect(zoneNames).toContain('cheeks');
    // whole_face zone is excluded since it only contains skin_type which is filtered out
  });

  it('should sort zones by priority (worst concern first)', () => {
    const concerns = createMockConcerns({
      hd_droopy_lower_eyelid: 30, // Very low - eyes zone should be first
      hd_wrinkle: 90, // High - forehead zone should be later
    });
    const skinType = { type: 'Normal', region: 'whole' };

    const result = mapConcernsToZones(concerns, skinType, 25, 75);

    // Eyes zone has the worst concern (30), should be first
    expect(result.zones[0].zone).toBe('eyes');
  });

  it('should include priorityConcerns (top 3 worst) per zone', () => {
    const concerns = createMockConcerns({
      hd_wrinkle: 40,
      hd_pore: 50,
      hd_texture: 60,
      hd_redness: 70,
      hd_acne: 80,
    });
    const skinType = { type: 'Normal', region: 'whole' };

    const result = mapConcernsToZones(concerns, skinType, 25, 75);

    // Forehead zone has wrinkle (40) - should be in priority
    const foreheadZone = result.zones.find(z => z.zone === 'forehead');
    expect(foreheadZone).toBeDefined();
    expect(foreheadZone!.priorityConcerns.length).toBeLessThanOrEqual(3);
    expect(foreheadZone!.priorityConcerns[0].uiScore).toBeLessThanOrEqual(foreheadZone!.priorityConcerns[1]?.uiScore ?? 100);
  });

  it('should include strongestConcerns (top 3 best) per zone', () => {
    const concerns = createMockConcerns({
      hd_wrinkle: 90,
      hd_firmness: 85,
      hd_age_spot: 80,
      hd_pore: 70,
    });
    const skinType = { type: 'Normal', region: 'whole' };

    const result = mapConcernsToZones(concerns, skinType, 25, 75);

    const foreheadZone = result.zones.find(z => z.zone === 'forehead');
    expect(foreheadZone).toBeDefined();
    expect(foreheadZone!.strongestConcerns.length).toBeLessThanOrEqual(3);
    expect(foreheadZone!.strongestConcerns[0].uiScore).toBeGreaterThanOrEqual(foreheadZone!.strongestConcerns[1]?.uiScore ?? 0);
  });

  it('should calculate overallScore and overallStars per zone', () => {
    // Create concerns with ONLY forehead concerns to test average calculation
    const concerns = [
      { type: 'hd_wrinkle', uiScore: 80, rawScore: 85, maskUrls: [] },
      { type: 'hd_firmness', uiScore: 70, rawScore: 75, maskUrls: [] },
      { type: 'hd_age_spot', uiScore: 85, rawScore: 90, maskUrls: [] },
    ] as YouCamConcern[];
    const skinType = { type: 'Normal', region: 'whole' };

    const result = mapConcernsToZones(concerns, skinType, 25, 75);

    const foreheadZone = result.zones.find(z => z.zone === 'forehead');
    expect(foreheadZone).toBeDefined();
    expect(foreheadZone!.overallScore).toBe(78); // (80+70+85)/3 = 78.33 ≈ 78
    expect(foreheadZone!.overallStars).toBe(4); // 78 = 4 stars
  });

  it('should include globalPriorityConcerns (top 3 worst globally)', () => {
    const concerns = createMockConcerns({
      hd_droopy_lower_eyelid: 30,
      hd_redness: 40,
      hd_moisture: 50,
      hd_wrinkle: 90,
    });
    const skinType = { type: 'Normal', region: 'whole' };

    const result = mapConcernsToZones(concerns, skinType, 25, 75);

    expect(result.globalPriorityConcerns.length).toBe(3);
    expect(result.globalPriorityConcerns[0].concern).toBe('hd_droopy_lower_eyelid');
    expect(result.globalPriorityConcerns[0].uiScore).toBe(30);
    expect(result.globalPriorityConcerns[1].concern).toBe('hd_redness');
    expect(result.globalPriorityConcerns[2].concern).toBe('hd_moisture');
  });

  it('should include globalStrongestConcerns (top 3 best globally)', () => {
    // Create concerns with only these specific scores
    const concerns = [
      { type: 'hd_wrinkle', uiScore: 90, rawScore: 95, maskUrls: [] },
      { type: 'hd_age_spot', uiScore: 85, rawScore: 90, maskUrls: [] },
      { type: 'hd_firmness', uiScore: 80, rawScore: 85, maskUrls: [] },
      { type: 'hd_redness', uiScore: 40, rawScore: 45, maskUrls: [] },
    ] as YouCamConcern[];
    const skinType = { type: 'Normal', region: 'whole' };

    const result = mapConcernsToZones(concerns, skinType, 25, 75);

    expect(result.globalStrongestConcerns.length).toBe(3);
    expect(result.globalStrongestConcerns[0].concern).toBe('hd_wrinkle');
    expect(result.globalStrongestConcerns[0].uiScore).toBe(90);
    expect(result.globalStrongestConcerns[1].concern).toBe('hd_age_spot');
    expect(result.globalStrongestConcerns[2].concern).toBe('hd_firmness');
  });

  it('should exclude skin_type from zone concerns', () => {
    const concerns = createMockConcerns();
    const skinType = { type: 'Normal', region: 'whole' };

    const result = mapConcernsToZones(concerns, skinType, 25, 75);

    for (const zone of result.zones) {
      const hasSkinType = zone.concerns.some(c => c.concern === 'hd_skin_type');
      expect(hasSkinType).toBe(false);
    }
  });

  it('should include skinType, skinAge, overallScore in result', () => {
    const concerns = createMockConcerns();
    const skinType = { type: 'Oily', region: 't_zone' };
    const skinAge = 30;
    const overallScore = 72;

    const result = mapConcernsToZones(concerns, skinType, skinAge, overallScore);

    expect(result.skinType).toEqual(skinType);
    expect(result.skinAge).toBe(skinAge);
    expect(result.overallScore).toBe(overallScore);
  });
});

describe('getConcernDisplayName', () => {
  it('should return proper display names for HD concerns', () => {
    expect(getConcernDisplayName('hd_wrinkle')).toBe('Wrinkles');
    expect(getConcernDisplayName('hd_pore')).toBe('Pores');
    expect(getConcernDisplayName('hd_dark_circle')).toBe('Dark Circles');
    expect(getConcernDisplayName('hd_eye_bag')).toBe('Eye Bags');
    expect(getConcernDisplayName('hd_droopy_upper_eyelid')).toBe('Droopy Upper Eyelid');
  });

  it('should return proper display names for SD concerns', () => {
    expect(getConcernDisplayName('wrinkle')).toBe('Wrinkles');
    expect(getConcernDisplayName('pore')).toBe('Pores');
    expect(getConcernDisplayName('dark_circle_v2')).toBe('Dark Circles');
    expect(getConcernDisplayName('eye_bag')).toBe('Eye Bags');
  });

  it('should format unknown concerns', () => {
    expect(getConcernDisplayName('custom_concern')).toBe('Custom Concern');
  });
});
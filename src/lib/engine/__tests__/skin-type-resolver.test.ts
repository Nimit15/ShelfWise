import { describe, it, expect } from 'vitest';
import { inferSkinProfileFromScan, resolveActiveSkinProfile } from '../skin-type-resolver';
import { YouCamConcern, YouCamSkinType } from '@/types/youcam';

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

describe('inferSkinProfileFromScan', () => {
  it('should infer oily skin from high oiliness and moisture', () => {
    const concerns = createMockConcerns({ hd_oiliness: 80, hd_moisture: 70 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.skinType).toBe('oily');
  });

  it('should infer dry skin from low oiliness and moisture', () => {
    const concerns = createMockConcerns({ hd_oiliness: 30, hd_moisture: 40 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.skinType).toBe('dry');
  });

  it('should infer combination skin from high oiliness and low moisture', () => {
    const concerns = createMockConcerns({ hd_oiliness: 70, hd_moisture: 40 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.skinType).toBe('combination');
  });

  it('should infer normal skin from moderate oiliness and moisture', () => {
    const concerns = createMockConcerns({ hd_oiliness: 50, hd_moisture: 55 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.skinType).toBe('normal');
  });

  it('should prefer YouCam skin_type when available', () => {
    const concerns = createMockConcerns();
    const skinType: YouCamSkinType = { type: 'Oily', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.skinType).toBe('oily');
  });

  it('should detect dehydrated_oily sub-condition', () => {
    const concerns = createMockConcerns({ hd_oiliness: 50, hd_moisture: 50 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.subCondition).toBe('dehydrated_oily');
  });

  it('should not detect dehydrated_oily when oiliness >= 60', () => {
    const concerns = createMockConcerns({ hd_oiliness: 65, hd_moisture: 50 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.subCondition).toBeUndefined();
  });

  it('should not detect dehydrated_oily when moisture >= 60', () => {
    const concerns = createMockConcerns({ hd_oiliness: 50, hd_moisture: 65 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.subCondition).toBeUndefined();
  });

  it('should infer sensitivity when redness < 65', () => {
    const concerns = createMockConcerns({ hd_redness: 60, hd_moisture: 70 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.isSensitive).toBe(true);
  });

  it('should infer sensitivity when moisture < 58', () => {
    const concerns = createMockConcerns({ hd_redness: 70, hd_moisture: 50 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.isSensitive).toBe(true);
  });

  it('should not infer sensitivity when redness >= 65 and moisture >= 58', () => {
    const concerns = createMockConcerns({ hd_redness: 70, hd_moisture: 60 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.isSensitive).toBe(false);
  });

  it('should classify barrier health as intact when scores are high', () => {
    const concerns = createMockConcerns({ hd_moisture: 80, hd_redness: 80, hd_texture: 80 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.barrierHealth).toBe('intact');
  });

  it('should classify barrier health as at_risk when scores are moderate', () => {
    const concerns = createMockConcerns({ hd_moisture: 60, hd_redness: 60, hd_texture: 60 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.barrierHealth).toBe('at_risk');
  });

  it('should classify barrier health as compromised when scores are low', () => {
    const concerns = createMockConcerns({ hd_moisture: 40, hd_redness: 40, hd_texture: 40 });
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.barrierHealth).toBe('compromised');
  });

  it('should return confidence between 0 and 1', () => {
    const concerns = createMockConcerns();
    const skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };

    const result = inferSkinProfileFromScan({ concerns, skinType });

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should have higher confidence with HD data', () => {
    const hdConcerns = createMockConcerns();
    const sdConcerns = hdConcerns.map(c => ({ ...c, type: c.type.replace('hd_', '') }));

    const hdResult = inferSkinProfileFromScan({ concerns: hdConcerns, skinType: { type: 'Normal', region: 'whole' } });
    const sdResult = inferSkinProfileFromScan({ concerns: sdConcerns, skinType: { type: 'Normal', region: 'whole' } });

    expect(hdResult.confidence).toBeGreaterThanOrEqual(sdResult.confidence);
  });
});

describe('resolveActiveSkinProfile', () => {
  const mockInferred = {
    skinType: 'normal' as const,
    subCondition: undefined,
    isSensitive: false,
    barrierHealth: 'intact' as const,
    confidence: 0.85,
  };

  it('should return inferred profile when no override', () => {
    const result = resolveActiveSkinProfile(mockInferred);

    expect(result.source).toBe('inferred');
    expect(result.overriddenFields).toEqual([]);
    expect(result.skinType).toBe('normal');
  });

  it('should apply user override for skinType', () => {
    const result = resolveActiveSkinProfile(mockInferred, { skinType: 'oily' });

    expect(result.source).toBe('user_override');
    expect(result.skinType).toBe('oily');
    expect(result.overriddenFields).toContain('skinType');
  });

  it('should apply user override for isSensitive', () => {
    const result = resolveActiveSkinProfile(mockInferred, { isSensitive: true });

    expect(result.isSensitive).toBe(true);
    expect(result.overriddenFields).toContain('isSensitive');
  });

  it('should apply user override for barrierHealth', () => {
    const result = resolveActiveSkinProfile(mockInferred, { barrierHealth: 'compromised' });

    expect(result.barrierHealth).toBe('compromised');
    expect(result.overriddenFields).toContain('barrierHealth');
  });

  it('should apply user override for subCondition', () => {
    const result = resolveActiveSkinProfile(mockInferred, { subCondition: 'dehydrated_oily' });

    expect(result.subCondition).toBe('dehydrated_oily');
    expect(result.overriddenFields).toContain('subCondition');
  });

  it('should track multiple overridden fields', () => {
    const result = resolveActiveSkinProfile(mockInferred, {
      skinType: 'oily',
      isSensitive: true,
      barrierHealth: 'at_risk',
    });

    expect(result.overriddenFields).toHaveLength(3);
    expect(result.overriddenFields).toContain('skinType');
    expect(result.overriddenFields).toContain('isSensitive');
    expect(result.overriddenFields).toContain('barrierHealth');
  });

  it('should not track unchanged fields', () => {
    const result = resolveActiveSkinProfile(mockInferred, { skinType: 'normal' });

    expect(result.overriddenFields).not.toContain('skinType');
  });

  it('should include timestamps', () => {
    const result = resolveActiveSkinProfile(mockInferred, { skinType: 'oily' });

    expect(result.inferredAt).toBeDefined();
    expect(result.overriddenAt).toBeDefined();
    expect(new Date(result.inferredAt).getTime()).toBeLessThanOrEqual(Date.now());
    expect(new Date(result.overriddenAt!).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should not have overriddenAt when no override', () => {
    const result = resolveActiveSkinProfile(mockInferred);

    expect(result.overriddenAt).toBeUndefined();
  });
});
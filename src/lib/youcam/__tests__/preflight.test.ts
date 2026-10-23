import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, clearRateLimit, setRateLimitConfig, validateSelfiePreflight, createVerifiedFallbackResult, getFallbackEngineResult, VERIFIED_FALLBACK_SCAN } from '@/lib/youcam/preflight';
import { YouCamConcern, YouCamSkinType } from '@/types/youcam';

describe('Rate Limiter', () => {
  beforeEach(() => {
    clearRateLimit('test-ip');
    setRateLimitConfig({ maxRequests: 10, windowMs: 3600000 });
  });

  afterEach(() => {
    clearRateLimit('test-ip');
  });

  it('should allow requests under limit', () => {
    const result = checkRateLimit('test-ip');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('should track remaining requests correctly', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-ip');
    }
    const result = checkRateLimit('test-ip');
    expect(result.remaining).toBe(4);
  });

  it('should block requests over limit', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-ip');
    }
    const result = checkRateLimit('test-ip');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('should have separate limits per IP', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-1');
    }
    const result = checkRateLimit('ip-2');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('should respect custom config', () => {
    setRateLimitConfig({ maxRequests: 2, windowMs: 3600000 });
    checkRateLimit('custom-ip');
    checkRateLimit('custom-ip');
    const result = checkRateLimit('custom-ip');
    expect(result.allowed).toBe(false);
    setRateLimitConfig({ maxRequests: 10, windowMs: 3600000 });
  });

  it('should clear rate limit for specific IP', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('clear-ip');
    }
    clearRateLimit('clear-ip');
    const result = checkRateLimit('clear-ip');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});

describe('validateSelfiePreflight', () => {
  const createMockFile = (overrides: Partial<{ type: string; size: number }> = {}): File => {
    const file = new File(['dummy content'], 'test.jpg', {
      type: overrides.type || 'image/jpeg',
    });
    Object.defineProperty(file, 'size', { value: overrides.size || 1024 * 1024 });
    return file;
  };

  it('should reject invalid file types', async () => {
    const file = createMockFile({ type: 'image/gif' });
    const result = await validateSelfiePreflight(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });

  it('should reject files larger than 10MB', async () => {
    const file = createMockFile({ size: 15 * 1024 * 1024 });
    const result = await validateSelfiePreflight(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('should accept valid JPEG files', async () => {
    const file = createMockFile({ type: 'image/jpeg', size: 1024 * 1024 });
    const result = await validateSelfiePreflight(file);
    expect(result.valid).toBe(true);
  });

  it('should accept valid PNG files', async () => {
    const file = createMockFile({ type: 'image/png', size: 1024 * 1024 });
    const result = await validateSelfiePreflight(file);
    expect(result.valid).toBe(true);
  });

  it('should accept valid WebP files', async () => {
    const file = createMockFile({ type: 'image/webp', size: 1024 * 1024 });
    const result = await validateSelfiePreflight(file);
    expect(result.valid).toBe(true);
  });

  it('should warn for files over 5MB', async () => {
    const file = createMockFile({ size: 8 * 1024 * 1024 });
    const result = await validateSelfiePreflight(file);
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('Large files may take longer'))).toBe(true);
  });

  it('should validate dimensions object without file', async () => {
    const result = await validateSelfiePreflight({ width: 640, height: 480 });
    expect(result.valid).toBe(true);
  });

  it('should reject dimensions too small', async () => {
    const result = await validateSelfiePreflight({ width: 200, height: 200 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too small');
  });

  it('should warn for very large dimensions', async () => {
    const result = await validateSelfiePreflight({ width: 5000, height: 4000 });
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('Consider downscaling'))).toBe(true);
  });
});

describe('Verified Fallback Scan', () => {
  it('should have 16 HD concerns', () => {
    expect(VERIFIED_FALLBACK_SCAN.concerns.length).toBe(16);
    expect(VERIFIED_FALLBACK_SCAN.concerns.every(c => c.type.startsWith('hd_'))).toBe(true);
  });

  it('should have valid skin type', () => {
    expect(VERIFIED_FALLBACK_SCAN.skinType.type).toBe('Combination');
    expect(VERIFIED_FALLBACK_SCAN.skinType.region).toBe('t_zone');
  });

  it('should have skinAge and overallScore', () => {
    expect(VERIFIED_FALLBACK_SCAN.skinAge).toBe(28);
    expect(VERIFIED_FALLBACK_SCAN.overallScore).toBe(66);
  });

  it('should have isFallback and fallbackReason', () => {
    expect(VERIFIED_FALLBACK_SCAN.isFallback).toBe(true);
    expect(VERIFIED_FALLBACK_SCAN.fallbackReason).toBe('verified_fallback');
  });
});

describe('createVerifiedFallbackResult', () => {
  it('should create fallback with custom reason', () => {
    const result = createVerifiedFallbackResult('rate_limited');
    expect(result.fallbackReason).toBe('rate_limited');
    expect(result.isFallback).toBe(true);
    expect(result.scanTimestamp).toBeDefined();
  });

  it('should default to verified_fallback', () => {
    const result = createVerifiedFallbackResult();
    expect(result.fallbackReason).toBe('verified_fallback');
  });

  it('should preserve all original scan data', () => {
    const result = createVerifiedFallbackResult('timeout');
    expect(result.concerns.length).toBe(16);
    expect(result.skinType.type).toBe('Combination');
    expect(result.skinAge).toBe(28);
    expect(result.overallScore).toBe(66);
  });
});

describe('getFallbackEngineResult', () => {
  it('should return complete engine-ready fallback', () => {
    const result = getFallbackEngineResult();
    expect(result.scan).toBeDefined();
    expect(result.skinProfile).toBeDefined();
    expect(result.zoneMap).toBeDefined();
    expect(result.activeSkinProfile).toBeDefined();
    expect(result.isFallback).toBe(true);
  });

  it('should include inferred skin profile', () => {
    const result = getFallbackEngineResult();
    expect(result.skinProfile.skinType).toBeDefined();
    expect(result.skinProfile.isSensitive).toBeDefined();
    expect(result.skinProfile.barrierHealth).toBeDefined();
    expect(result.skinProfile.confidence).toBeGreaterThan(0);
  });

  it('should include zone map with zones', () => {
    const result = getFallbackEngineResult();
    expect(result.zoneMap.zones.length).toBeGreaterThan(0);
    expect(result.zoneMap.skinType).toBeDefined();
    expect(result.zoneMap.skinAge).toBe(28);
  });
});
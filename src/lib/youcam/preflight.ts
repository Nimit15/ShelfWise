import { YouCamConcern, YouCamSkinType } from '@/types/youcam';
import { InferredSkinProfile, inferSkinProfileFromScan } from '@/lib/engine/skin-type-resolver';
import { FullZoneMap, mapConcernsToZones } from '@/lib/youcam/zone-mapper';

export interface PreflightResult {
  valid: boolean;
  error?: string;
  warnings: string[];
}

export interface ValidatedFile extends PreflightResult {
  file: File;
  dimensions: { width: number; height: number };
}

/**
 * In-memory sliding-window rate limiter (per IP)
 * Max 10 live uncached scans per IP per hour by default
 */
const rateLimitStore = new Map<string, number[]>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

let rateLimitConfig: RateLimitConfig = {
  maxRequests: parseInt(process.env.YOUCAM_RATE_LIMIT_MAX || '10', 10),
  windowMs: parseInt(process.env.YOUCAM_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
};

export function setRateLimitConfig(config: Partial<RateLimitConfig>) {
  rateLimitConfig = { ...rateLimitConfig, ...config };
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowStart = now - rateLimitConfig.windowMs;

  const timestamps = rateLimitStore.get(ip) || [];
  const recentRequests = timestamps.filter(ts => ts > windowStart);

  if (recentRequests.length >= rateLimitConfig.maxRequests) {
    const oldestInWindow = recentRequests[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + rateLimitConfig.windowMs,
    };
  }

  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);

  return {
    allowed: true,
    remaining: rateLimitConfig.maxRequests - recentRequests.length,
    resetAt: now + rateLimitConfig.windowMs,
  };
}

export function clearRateLimit(ip: string) {
  rateLimitStore.delete(ip);
}

/**
 * Validate selfie file from a File object or dimensions
 * Checks: file type, size (<=10MB), dimensions (>=320px, <=4096px)
 */
export async function validateSelfiePreflight(
  fileOrDimensions: File | { width: number; height: number }
): Promise<PreflightResult | ValidatedFile> {
  const warnings: string[] = [];

  // If dimensions object provided (server-side without file)
  if (!('type' in fileOrDimensions)) {
    const { width, height } = fileOrDimensions;

    if (width < 320 || height < 320) {
      return {
        valid: false,
        error: `Image dimensions too small: ${width}x${height}. Minimum 320x320px required.`,
        warnings,
      };
    }

    if (width > 4096 || height > 4096) {
      warnings.push(`Image dimensions large: ${width}x${height}. Consider downscaling for faster processing.`);
    }

    return { valid: true, warnings };
  }

  const file = fileOrDimensions;

  // File type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are supported.`,
      warnings,
    };
  }

  // File size validation (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 10MB.`,
      warnings,
    };
  }

  // Dimension validation via ImageBitmap (browser) or sharp (Node)
  let dimensions: { width: number; height: number } = { width: 0, height: 0 };

  try {
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      // Browser environment
      const bitmap = await createImageBitmap(file);
      dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
    } else {
      // Node environment - we can't read dimensions without a library
      // For now, skip dimension check server-side and rely on YouCam API validation
      // In production, use 'sharp' package: const metadata = await sharp(fileBuffer).metadata()
      dimensions = { width: 0, height: 0 };
    }

    if (dimensions.width > 0) {
      if (dimensions.width < 320 || dimensions.height < 320) {
        return {
          valid: false,
          error: `Image dimensions too small: ${dimensions.width}x${dimensions.height}. Minimum 320x320px required.`,
          warnings,
        };
      }

      if (dimensions.width > 4096 || dimensions.height > 4096) {
        warnings.push(`Image dimensions large: ${dimensions.width}x${dimensions.height}. Consider downscaling for faster processing.`);
      }
    }
  } catch (dimError) {
    warnings.push('Could not read image dimensions; skipping dimension validation.');
  }

  if (file.size > 5 * 1024 * 1024) {
    warnings.push(`File size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large files may take longer to process.`);
  }

  return { valid: true, file, dimensions, warnings };
}

/**
 * Verified fallback scan data (normalized, deterministic)
 * Used when API key is missing, rate limited, or fallback explicitly requested
 */
export const VERIFIED_FALLBACK_SCAN = {
  concerns: [
    { type: 'hd_wrinkle', uiScore: 65, rawScore: 70, maskUrls: [] },
    { type: 'hd_pore', uiScore: 55, rawScore: 60, maskUrls: [] },
    { type: 'hd_texture', uiScore: 60, rawScore: 65, maskUrls: [] },
    { type: 'hd_acne', uiScore: 70, rawScore: 75, maskUrls: [] },
    { type: 'hd_oiliness', uiScore: 50, rawScore: 55, maskUrls: [] },
    { type: 'hd_radiance', uiScore: 75, rawScore: 80, maskUrls: [] },
    { type: 'hd_eye_bag', uiScore: 65, rawScore: 70, maskUrls: [] },
    { type: 'hd_age_spot', uiScore: 80, rawScore: 85, maskUrls: [] },
    { type: 'hd_dark_circle', uiScore: 60, rawScore: 65, maskUrls: [] },
    { type: 'hd_droopy_upper_eyelid', uiScore: 75, rawScore: 80, maskUrls: [] },
    { type: 'hd_droopy_lower_eyelid', uiScore: 70, rawScore: 75, maskUrls: [] },
    { type: 'hd_firmness', uiScore: 70, rawScore: 75, maskUrls: [] },
    { type: 'hd_moisture', uiScore: 55, rawScore: 60, maskUrls: [] },
    { type: 'hd_redness', uiScore: 65, rawScore: 70, maskUrls: [] },
    { type: 'hd_tear_trough', uiScore: 70, rawScore: 75, maskUrls: [] },
    { type: 'hd_skin_type', uiScore: 0, rawScore: 0, maskUrls: [] },
  ] as YouCamConcern[],
  skinType: { type: 'Combination', region: 't_zone' } as YouCamSkinType,
  skinAge: 28,
  overallScore: 66,
  isFallback: true,
  fallbackReason: 'verified_fallback',
};

export function createVerifiedFallbackResult(reason: 'no_api_key' | 'rate_limited' | 'timeout' | 'explicit' | 'verified_fallback' = 'verified_fallback') {
  return {
    ...VERIFIED_FALLBACK_SCAN,
    fallbackReason: reason,
    scanTimestamp: new Date().toISOString(),
  };
}

/**
 * Get full engine-ready fallback result with skin profile, zone map, etc.
 */
export function getFallbackEngineResult() {
  const scan = VERIFIED_FALLBACK_SCAN;
  const skinProfile = inferSkinProfileFromScan({ concerns: scan.concerns, skinType: scan.skinType });
  const zoneMap = mapConcernsToZones(scan.concerns, scan.skinType, scan.skinAge, scan.overallScore);
  const activeSkinProfile = inferSkinProfileFromScan({ concerns: scan.concerns, skinType: scan.skinType }); // reuse as active for fallback

  return {
    scan: { ...scan, isFallback: true },
    skinProfile,
    zoneMap,
    activeSkinProfile,
    isFallback: true,
  };
}

export { inferSkinProfileFromScan, mapConcernsToZones };
export type { YouCamConcern, YouCamSkinType, InferredSkinProfile, FullZoneMap };
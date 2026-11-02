export interface PreflightResult {
  valid: boolean;
  error?: string;
  warnings: string[];
}

export interface ValidatedFile extends PreflightResult {
  file: File;
  dimensions: { width: number; height: number };
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Best-effort per-process limit. Use a shared store for multi-instance production deployments.
const rateLimitStore = new Map<string, number[]>();

let rateLimitConfig: RateLimitConfig = {
  maxRequests: parseInt(process.env.YOUCAM_RATE_LIMIT_MAX || "10", 10),
  windowMs: parseInt(process.env.YOUCAM_RATE_LIMIT_WINDOW_MS || "3600000", 10),
};

export function setRateLimitConfig(config: Partial<RateLimitConfig>) {
  rateLimitConfig = { ...rateLimitConfig, ...config };
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowStart = now - rateLimitConfig.windowMs;
  const timestamps = rateLimitStore.get(ip) || [];
  const recentRequests = timestamps.filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= rateLimitConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: recentRequests[0] + rateLimitConfig.windowMs,
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

function validateDimensions(
  width: number,
  height: number,
  tier: "SD" | "HD"
): PreflightResult {
  const warnings: string[] = [];
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { valid: false, error: "The image dimensions could not be read. Please choose another JPEG or PNG.", warnings };
  }

  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const minimumShortSide = tier === "HD" ? 1080 : 480;

  if (shortSide < minimumShortSide) {
    return {
      valid: false,
      error: `${tier} analysis requires at least ${minimumShortSide}px on the shorter side. Your image is ${width}×${height}px.`,
      warnings,
    };
  }

  if (longSide > 2560) {
    warnings.push("The long edge exceeds 2560px; Perfect Corp automatically resizes larger inputs.");
  }

  return { valid: true, warnings };
}

export async function validateSelfiePreflight(
  fileOrDimensions: File | { width: number; height: number },
  tier: "SD" | "HD" = "SD"
): Promise<PreflightResult | ValidatedFile> {
  const warnings: string[] = [];

  if (!("type" in fileOrDimensions)) {
    return validateDimensions(fileOrDimensions.width, fileOrDimensions.height, tier);
  }

  const file = fileOrDimensions;
  const allowedTypes = ["image/jpeg", "image/png"];

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Unsupported image format. YouCam accepts JPEG and PNG files.",
      warnings,
    };
  }

  const maximumBytes = 10 * 1024 * 1024;
  if (file.size >= maximumBytes) {
    return {
      valid: false,
      error: "The image must be smaller than 10 MB.",
      warnings,
    };
  }

  let dimensions = { width: 0, height: 0 };

  // Browsers can inspect dimensions before upload. The server still relies on
  // YouCam's own image validation because this project does not bundle an image decoder.
  if (typeof window !== "undefined" && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();

      const dimensionResult = validateDimensions(dimensions.width, dimensions.height, tier);
      if (!dimensionResult.valid) return dimensionResult;
      warnings.push(...dimensionResult.warnings);
    } catch {
      return {
        valid: false,
        error: "The image could not be decoded. Please choose a valid JPEG or PNG.",
        warnings,
      };
    }
  } else if (typeof window !== "undefined") {
    warnings.push("Your browser could not inspect image dimensions; YouCam will validate them during analysis.");
  }

  if (file.size > 5 * 1024 * 1024) {
    warnings.push("The image is larger than 5 MB and may take longer to upload.");
  }

  return { valid: true, file, dimensions, warnings };
}

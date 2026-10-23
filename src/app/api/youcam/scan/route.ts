import { NextRequest, NextResponse } from 'next/server';
import { runSkinAnalysis, calculateSDCost, calculateHDCost, ALL_SD_CONCERNS, ALL_HD_CONCERNS, parseScanResults } from '@/lib/youcam';
import { checkRateLimit, validateSelfiePreflight, createVerifiedFallbackResult, VERIFIED_FALLBACK_SCAN } from '@/lib/youcam/preflight';

/**
 * YouCam Skin Analysis endpoint
 * Upload an image and run skin analysis via YouCam API
 * Compatible with Next.js 16 (App Router)
 * Includes rate limiting, preflight validation, and verified fallback mode
 */
export async function POST(request: NextRequest) {
  try {
    // Check for explicit fallback request
    const useFallback = request.headers.get('x-use-verified-fallback') === 'true' ||
                        request.nextUrl.searchParams.get('fallback') === 'true';

    // Check for API key
    const hasApiKey = !!process.env.YOUCAM_API_KEY;

    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // Check rate limit (skip for fallback requests)
    if (!useFallback) {
      const rateLimit = checkRateLimit(ip);
      if (!rateLimit.allowed) {
        // Rate limited - return fallback with rate limited flag
        const fallback = createVerifiedFallbackResult('rate_limited');
        return NextResponse.json({
          success: true,
          results: fallback,
          rawResults: null,
          creditsUsed: 0,
          tier: 'HD',
          concernsAnalyzed: 16,
          scanTimestamp: new Date().toISOString(),
          isFallback: true,
          fallbackReason: 'rate_limited',
          rateLimit: {
            remaining: rateLimit.remaining,
            resetAt: new Date(rateLimit.resetAt).toISOString(),
          },
        });
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tier = (formData.get('tier') as 'SD' | 'HD') || 'SD';
    const concernsParam = formData.get('concerns') as string;
    const enableMaskOverlay = formData.get('enableMaskOverlay') === 'true';

    // Validation
    if (!file && !useFallback && !hasApiKey) {
      // No file and no API key - return fallback
      const fallback = createVerifiedFallbackResult('no_api_key');
      return NextResponse.json({
        success: true,
        results: fallback,
        rawResults: null,
        creditsUsed: 0,
        tier: 'HD',
        concernsAnalyzed: 16,
        scanTimestamp: new Date().toISOString(),
        isFallback: true,
        fallbackReason: 'no_api_key',
      });
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload an image file.' },
        { status: 400 }
      );
    }

    // Preflight validation (includes file type, size, dimensions)
    const preflight = await validateSelfiePreflight(file);
    if (!preflight.valid) {
      return NextResponse.json(
        { error: preflight.error, success: false, warnings: preflight.warnings },
        { status: 400 }
      );
    }

    // Validate file type (also covered by preflight)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB) - also covered by preflight
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Parse concerns
    let concerns: string[];
    if (concernsParam === 'all') {
      concerns = tier === 'HD' ? ALL_HD_CONCERNS : ALL_SD_CONCERNS;
    } else if (concernsParam) {
      concerns = concernsParam.split(',').map(c => c.trim()).filter(Boolean);
    } else {
      concerns = tier === 'HD' ? ALL_HD_CONCERNS : ALL_SD_CONCERNS;
    }

    // Validate concerns match tier (no mixing SD and HD)
    const isHD = tier === 'HD';
    const invalidConcerns = concerns.filter(c =>
      isHD ? !c.startsWith('hd_') : c.startsWith('hd_')
    );
    if (invalidConcerns.length > 0) {
      return NextResponse.json(
        { error: `Cannot mix SD and HD concerns. Invalid for ${tier}: ${invalidConcerns.join(', ')}` },
        { status: 400 }
      );
    }

    // If fallback mode explicitly requested or no API key, return verified fallback
    if (useFallback || !hasApiKey) {
      const fallback = createVerifiedFallbackResult(useFallback ? 'explicit' : 'no_api_key');
      return NextResponse.json({
        success: true,
        results: fallback,
        rawResults: null,
        creditsUsed: 0,
        tier: 'HD',
        concernsAnalyzed: 16,
        scanTimestamp: new Date().toISOString(),
        isFallback: true,
        fallbackReason: useFallback ? 'explicit' : 'no_api_key',
        preflightWarnings: preflight.warnings,
      });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Run analysis with timeout fallback
    let results;
    let isTimeoutFallback = false;
    try {
      // Add a timeout wrapper (30 seconds)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('YouCam API timeout')), 30000)
      );
      results = await Promise.race([
        runSkinAnalysis(buffer, file.name, file.type, {
          tier,
          concerns,
          enableMaskOverlay,
        }),
        timeoutPromise,
      ]);
    } catch (analysisError) {
      // On timeout or network error, use fallback
      isTimeoutFallback = true;
      const fallback = createVerifiedFallbackResult('timeout');
      return NextResponse.json({
        success: true,
        results: fallback,
        rawResults: null,
        creditsUsed: 0,
        tier: 'HD',
        concernsAnalyzed: 16,
        scanTimestamp: new Date().toISOString(),
        isFallback: true,
        fallbackReason: 'timeout',
        preflightWarnings: preflight.warnings,
      });
    }

    // Parse results into structured format
    const parsed = parseScanResults(results);

    // Calculate cost
    const cost = tier === 'HD' ? calculateHDCost(concerns.length) : calculateSDCost(concerns.length);

    return NextResponse.json({
      success: true,
      results: parsed,
      rawResults: results,
      creditsUsed: cost,
      tier,
      concernsAnalyzed: concerns.length,
      scanTimestamp: new Date().toISOString(),
      isFallback: false,
      preflightWarnings: preflight.warnings,
    });
  } catch (error) {
    console.error('YouCam scan error:', error);
    const message = error instanceof Error ? error.message : 'Scan failed';

    // On unexpected error, try to return fallback
    const fallback = createVerifiedFallbackResult('timeout');
    return NextResponse.json(
      {
        error: message,
        success: false,
        fallback: fallback,
        isFallback: true,
        fallbackReason: 'error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoints: {
      scan: 'POST /api/youcam/scan - Upload image and run skin analysis',
      status: 'GET /api/youcam/status - Check API credits and costs',
      demo: 'GET /api/youcam/demo - Run demo with mock data (no API key needed)',
    },
    parameters: {
      file: 'Image file (JPEG/PNG, max 10MB)',
      tier: 'SD or HD (default: SD)',
      concerns: 'Comma-separated list or "all" (default: all 16 concerns for tier)',
      enableMaskOverlay: 'true/false (default: false)',
    },
    availableConcerns: {
      SD: ALL_SD_CONCERNS,
      HD: ALL_HD_CONCERNS,
    },
    costEstimates: {
      SD: {
        '1-4 concerns': calculateSDCost(1),
        '5-8 concerns': calculateSDCost(5),
        '9-12 concerns': calculateSDCost(9),
        '13-16 concerns': calculateSDCost(13),
      },
      HD: {
        '1-4 concerns': calculateHDCost(1),
        '5-8 concerns': calculateHDCost(5),
        '9-12 concerns': calculateHDCost(9),
        '13-16 concerns': calculateHDCost(13),
      },
    },
  });
}
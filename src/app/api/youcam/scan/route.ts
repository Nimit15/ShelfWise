import { NextRequest, NextResponse } from "next/server";
import {
  runSkinAnalysis,
  calculateSDCost,
  calculateHDCost,
  ALL_SD_CONCERNS,
  ALL_HD_CONCERNS,
  parseScanResults,
} from "@/lib/youcam";
import { checkRateLimit, validateSelfiePreflight } from "@/lib/youcam/preflight";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SCAN_TIMEOUT_MS = 120_000;

export async function POST(request: NextRequest) {
  if (!process.env.YOUCAM_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "Live YouCam scanning is not configured. Add YOUCAM_API_KEY to .env.local, or use the clearly labeled demo scan.",
        source: "unavailable",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const file = fileEntry instanceof File ? fileEntry : null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file was provided." },
        { status: 400 }
      );
    }

    const tierValue = formData.get("tier");
    if (tierValue !== null && tierValue !== "SD" && tierValue !== "HD") {
      return NextResponse.json(
        { success: false, error: "The scan tier must be SD or HD." },
        { status: 400 }
      );
    }
    const tier: "SD" | "HD" = tierValue === "HD" ? "HD" : "SD";

    const preflight = await validateSelfiePreflight(file, tier);
    if (!preflight.valid) {
      return NextResponse.json(
        { success: false, error: preflight.error, warnings: preflight.warnings },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png"].includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "YouCam accepts JPEG and PNG images only." },
        { status: 400 }
      );
    }

    if (file.size >= MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "The image must be smaller than 10 MB." },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "The live scan limit for this IP has been reached. Please try again after the rate-limit window resets.",
          rateLimit: {
            remaining: rateLimit.remaining,
            resetAt: new Date(rateLimit.resetAt).toISOString(),
          },
        },
        { status: 429 }
      );
    }

    const concernsField = formData.get("concerns");
    const allConcerns = tier === "HD" ? ALL_HD_CONCERNS : ALL_SD_CONCERNS;
    const concerns =
      typeof concernsField === "string" && concernsField.trim() && concernsField !== "all"
        ? concernsField.split(",").map((concern) => concern.trim()).filter(Boolean)
        : [...allConcerns];

    const invalidConcerns = concerns.filter((concern) => !allConcerns.includes(concern));
    if (invalidConcerns.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `These concerns are not valid for ${tier}: ${invalidConcerns.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const enableMaskOverlay = formData.get("enableMaskOverlay") === "true";
    const buffer = Buffer.from(await file.arrayBuffer());

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("YouCam analysis timed out after 120 seconds.")),
          SCAN_TIMEOUT_MS
        );
      });

      const rawResults = await Promise.race([
        runSkinAnalysis(buffer, file.name, file.type, {
          tier,
          concerns,
          enableMaskOverlay,
        }),
        timeoutPromise,
      ]);

      const parsed = parseScanResults(rawResults);
      if (parsed.concerns.length === 0) {
        throw new Error("YouCam completed the task but returned no skin-concern scores.");
      }

      const creditsUsed =
        tier === "HD" ? calculateHDCost(concerns.length) : calculateSDCost(concerns.length);

      return NextResponse.json({
        success: true,
        source: "youcam",
        results: parsed,
        tier,
        concernsAnalyzed: concerns.length,
        creditsUsed,
        scanTimestamp: new Date().toISOString(),
        preflightWarnings: preflight.warnings,
      });
    } catch (analysisError) {
      const message =
        analysisError instanceof Error ? analysisError.message : "YouCam analysis failed.";
      console.error("YouCam analysis failed:", analysisError);
      return NextResponse.json(
        { success: false, source: "unavailable", error: message },
        { status: 502 }
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The scan request could not be processed.";
    console.error("YouCam scan request failed:", error);
    return NextResponse.json(
      { success: false, source: "unavailable", error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/youcam/scan",
    description: "Runs a live Perfect Corp YouCam V2.1 skin-analysis task.",
    requiredFormData: {
      file: "JPEG or PNG image smaller than 10 MB",
      tier: "SD or HD (the app requests HD)",
      concerns: 'Comma-separated concerns or "all"; SD and HD concerns cannot be mixed.',
      enableMaskOverlay: "Optional true/false flag",
    },
    imageRequirements: {
      SD: "At least 480px on the shorter side",
      HD: "At least 1080px on the shorter side",
      longEdge: "Inputs above 2560px are automatically resized by Perfect Corp",
    },
    availableConcerns: {
      SD: ALL_SD_CONCERNS,
      HD: ALL_HD_CONCERNS,
    },
    creditsForAll16Concerns: {
      SD: calculateSDCost(16),
      HD: calculateHDCost(16),
    },
  });
}

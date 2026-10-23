import { NextRequest, NextResponse } from 'next/server';
import { runBioInventoryEngine } from '@/lib/engine/optimizer';
import { inferSkinProfileFromScan } from '@/lib/engine/skin-type-resolver';
import { mapConcernsToZones } from '@/lib/youcam/zone-mapper';
import { calculateImpactTelemetry } from '@/lib/engine/telemetry';
import { CATALOG } from '@/data/catalog';
import { YouCamConcern } from '@/types/youcam';
import { ScanInput, ShelfProduct, EngineConstraints, EngineOutput } from '@/types/engine';

/**
 * Engine audit endpoint - runs full biometric inventory analysis
 * Accepts scan data, shelf products, and constraints
 * Returns comprehensive EngineOutput with conflicts, gaps, routine, verdict, and telemetry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      scan,
      shelf,
      constraints,
    }: {
      scan: ScanInput;
      shelf: ShelfProduct[];
      constraints: EngineConstraints;
    } = body;

    // Validate required fields
    if (!scan || !scan.concerns || !Array.isArray(scan.concerns)) {
      return NextResponse.json(
        { error: 'Invalid scan data: concerns array is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(shelf)) {
      return NextResponse.json(
        { error: 'Invalid shelf: array of products required' },
        { status: 400 }
      );
    }

    if (!constraints) {
      return NextResponse.json(
        { error: 'Constraints object is required' },
        { status: 400 }
      );
    }

    // Validate scan concerns have uiScore
    for (const concern of scan.concerns) {
      if (typeof concern.uiScore !== 'number') {
        return NextResponse.json(
          { error: `Concern ${concern.type} missing uiScore` },
          { status: 400 }
        );
      }
    }

    // Infer skin profile from scan
    const skinProfile = inferSkinProfileFromScan({
      concerns: scan.concerns,
      skinType: scan.skinType,
    });

    // Map concerns to facial zones
    const zoneMap = mapConcernsToZones(
      scan.concerns,
      scan.skinType,
      scan.skinAge,
      scan.overallScore
    );

    // Merge inferred skin type/sensitive with constraints (constraints override)
    const effectiveConstraints: EngineConstraints = {
      ...constraints,
      userSkinType: constraints.userSkinType || skinProfile.skinType,
      userSensitive: constraints.userSensitive ?? skinProfile.isSensitive,
    };

    // Run the engine
    const engineOutput = runBioInventoryEngine(scan, shelf, effectiveConstraints);

    // Calculate impact telemetry
    const impactTelemetry = calculateImpactTelemetry(engineOutput, shelf, effectiveConstraints);

    return NextResponse.json({
      success: true,
      skinProfile,
      zoneMap,
      engineOutput,
      impactTelemetry,
      auditTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Engine audit error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Audit failed' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoints: {
      audit: 'POST /api/engine/audit - Run full biometric inventory engine',
    },
    requestBody: {
      scan: {
        concerns: 'YouCamConcern[] - Array of concerns with type and uiScore',
        skinType: 'YouCamSkinType - { type: "Normal"|"Oily"|"Dry"|"Combination", region: string }',
        skinAge: 'number',
        overallScore: 'number',
      },
      shelf: 'ShelfProduct[] - Array of products on user shelf',
      constraints: {
        budgetInr: 'number (optional)',
        budgetUsd: 'number (optional)',
        avoidedIngredients: 'string[]',
        routinePreference: '"minimalist" | "targeted"',
        currency: '"INR" | "USD"',
        userSkinType: '"oily" | "dry" | "combination" | "normal" (optional)',
        userSensitive: 'boolean (optional)',
      },
    },
    response: {
      skinProfile: 'Inferred skin profile with type, subCondition, isSensitive, barrierHealth, confidence',
      zoneMap: 'Facial zone mapping with priority/strongest concerns per zone',
      engineOutput: 'Full EngineOutput with conflicts, recommendations, routine, verdict',
      auditTimestamp: 'ISO timestamp',
    },
  });
}
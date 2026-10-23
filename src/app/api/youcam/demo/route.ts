import { NextResponse } from 'next/server';
import { parseScanResults, ALL_HD_CONCERNS } from '@/lib/youcam';
import { runBioInventoryEngine } from '@/lib/engine/optimizer';
import { CATALOG } from '@/data/catalog';
import { inferSkinProfileFromScan } from '@/lib/engine/skin-type-resolver';
import { mapConcernsToZones } from '@/lib/youcam/zone-mapper';

/**
 * Demo endpoint - runs the full ShelfWise engine pipeline with mock data
 * No API key required - uses built-in mock scan data
 */
export async function GET() {
  try {
    // Use mock scan data (same as used in tests)
    const mockConcerns = [
      { type: 'hd_wrinkle', uiScore: 98, rawScore: 99, maskUrls: [] },
      { type: 'hd_pore', uiScore: 91, rawScore: 94, maskUrls: [] },
      { type: 'hd_texture', uiScore: 86, rawScore: 90, maskUrls: [] },
      { type: 'hd_acne', uiScore: 96, rawScore: 98, maskUrls: [] },
      { type: 'hd_oiliness', uiScore: 83, rawScore: 84, maskUrls: [] },
      { type: 'hd_radiance', uiScore: 83, rawScore: 86, maskUrls: [] },
      { type: 'hd_eye_bag', uiScore: 83, rawScore: 84, maskUrls: [] },
      { type: 'hd_age_spot', uiScore: 96, rawScore: 98, maskUrls: [] },
      { type: 'hd_dark_circle', uiScore: 77, rawScore: 83, maskUrls: [] },
      { type: 'hd_droopy_upper_eyelid', uiScore: 84, rawScore: 86, maskUrls: [] },
      { type: 'hd_droopy_lower_eyelid', uiScore: 71, rawScore: 58, maskUrls: [] },
      { type: 'hd_firmness', uiScore: 91, rawScore: 94, maskUrls: [] },
      { type: 'hd_moisture', uiScore: 77, rawScore: 67, maskUrls: [] },
      { type: 'hd_redness', uiScore: 83, rawScore: 85, maskUrls: [] },
      { type: 'hd_tear_trough', uiScore: 96, rawScore: 97, maskUrls: [] },
      { type: 'hd_skin_type', uiScore: 0, rawScore: 0, maskUrls: [] },
    ];

    const mockScanResult = {
      output: mockConcerns.map(c => ({
        type: c.type,
        ui_score: c.uiScore,
        raw_score: c.rawScore,
        mask_urls: c.maskUrls,
      })),
    };

    const parsed = parseScanResults(mockScanResult);

    // Infer skin profile from scan
    const skinProfile = inferSkinProfileFromScan({
      concerns: parsed.concerns,
      skinType: parsed.skinType,
    });

    // Map concerns to facial zones
    const zoneMap = mapConcernsToZones(
      parsed.concerns,
      parsed.skinType,
      parsed.skinAge,
      parsed.overallScore
    );

    // Create a demo shelf with a few products
    const demoShelf = CATALOG.slice(0, 4);

    // Run the engine
    const engineOutput = runBioInventoryEngine(
      {
        concerns: parsed.concerns,
        skinType: parsed.skinType,
        skinAge: parsed.skinAge,
        overallScore: parsed.overallScore,
      },
      demoShelf,
      {
        budgetInr: 3500,
        budgetUsd: 45,
        avoidedIngredients: [],
        routinePreference: 'targeted',
        currency: 'INR',
        userSkinType: skinProfile.skinType,
        userSensitive: skinProfile.isSensitive,
      }
    );

    return NextResponse.json({
      success: true,
      demo: true,
      skinProfile,
      zoneMap,
      engineOutput,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Demo error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Demo failed' },
      { status: 500 }
    );
  }
}
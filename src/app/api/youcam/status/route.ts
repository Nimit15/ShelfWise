import { NextResponse } from 'next/server';
import { getCreditBalance, getFeatureCosts, calculateSDCost, calculateHDCost, ALL_SD_CONCERNS, ALL_HD_CONCERNS } from '@/lib/youcam';

/**
 * YouCam API Status endpoint
 * Check credit balance and feature costs
 * Compatible with Next.js 16 (App Router)
 */
export async function GET() {
  try {
    const [balance, costs] = await Promise.all([
      getCreditBalance(),
      getFeatureCosts(),
    ]);

    return NextResponse.json({
      success: true,
      credits: {
        apiSpendableUnits: balance.apiSpendableUnits,
        byType: balance.byType,
      },
      costs: {
        skinAnalysis: {
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
        availableConcerns: {
          SD: ALL_SD_CONCERNS,
          HD: ALL_HD_CONCERNS,
        },
        rawCosts: costs,
      },
      apiReady: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('YouCam status error:', error);
    return NextResponse.json(
      {
        success: false,
        credits: { apiSpendableUnits: 0, byType: {} },
        costs: { skinAnalysis: { SD: {}, HD: {} }, availableConcerns: { SD: [], HD: [] }, rawCosts: [] },
        apiReady: false,
        error: error instanceof Error ? error.message : 'Status check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
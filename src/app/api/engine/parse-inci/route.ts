import { NextRequest, NextResponse } from 'next/server';
import { parseINCIList, createCustomProductFromINCI, getFirstFiveBaseIngredients } from '@/lib/inci-parser';
import { Product } from '@/data/catalog';

/**
 * INCI Parser endpoint - parses INCI ingredient lists into structured product data
 * Extracts first 5 base ingredients, identifies actives, infers roles, concerns, irritancy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      inciList,
      productName,
      createProduct,
    }: {
      inciList: string;
      productName?: string;
      createProduct?: boolean;
    } = body;

    if (!inciList || typeof inciList !== 'string') {
      return NextResponse.json(
        { error: 'inciList (string) is required' },
        { status: 400 }
      );
    }

    const name = productName || 'Custom Product';

    // Parse the INCI list
    const parsed = parseINCIList(inciList, name);

    // Get first 5 base ingredients
    const baseIngredients = getFirstFiveBaseIngredients(inciList);

    let product: Product | null = null;
    if (createProduct) {
      product = createCustomProductFromINCI(inciList, name);
    }

    return NextResponse.json({
      success: true,
      parsed: {
        productName: name,
        baseIngredients: baseIngredients.map(ing => ({
          name: ing.name,
          concentration: ing.concentration,
          rank: ing.originalText ? Object.keys({}).length : 0, // rank is position in array
        })),
        allIngredients: parsed.ingredients.map(ing => ({
          name: ing.name,
          concentration: ing.concentration,
          originalText: ing.originalText,
        })),
        activeIngredients: parsed.ingredients
          .filter(ing => ing.concentration || ing.name.length > 3)
          .map(ing => ({
            name: ing.name,
            concentration: ing.concentration || '',
          })),
        functionalRoles: parsed.detectedRoles,
        targetConcerns: parsed.concerns,
        textureVehicle: parsed.textureVehicle,
        irritancyScore: parsed.estimatedIrritancy,
        suggestedPriceInr: parsed.suggestedPriceInr,
        suggestedPriceUsd: parsed.suggestedPriceUsd,
        daysSupply: parsed.daysSupply,
        usageTime: parsed.usageTime,
        safeForSensitive: parsed.estimatedIrritancy <= 2,
      },
      product,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('INCI parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoints: {
      parse: 'POST /api/engine/parse-inci - Parse INCI list into structured product data',
    },
    requestBody: {
      inciList: 'string - Full INCI ingredient list (comma-separated)',
      productName: 'string (optional) - Product name for texture vehicle inference',
      createProduct: 'boolean (optional) - If true, returns a Product object ready for the engine',
    },
    response: {
      parsed: {
        baseIngredients: 'First 5 ingredients from the INCI list',
        allIngredients: 'All parsed ingredients with concentrations',
        functionalRoles: 'Inferred FunctionalRole[]',
        targetConcerns: 'Skin concerns this product addresses',
        textureVehicle: 'Inferred TextureVehicle',
        irritancyScore: 'Estimated irritancy (1-10)',
        suggestedPriceInr: 'Estimated price in INR',
        suggestedPriceUsd: 'Estimated price in USD',
        daysSupply: 'Estimated days of supply',
        usageTime: '"AM" | "PM" | "BOTH"',
        safeForSensitive: 'boolean - true if irritancy <= 2',
      },
      product: 'Product object (only if createProduct: true)',
      timestamp: 'ISO timestamp',
    },
  });
}
import { YouCamConcern, YouCamSkinType } from '@/types/youcam';
import { SkinType } from '@/types/engine';

export interface InferredSkinProfile {
  skinType: SkinType;
  subCondition?: 'dehydrated_oily';
  isSensitive: boolean;
  barrierHealth: 'intact' | 'compromised' | 'at_risk';
  confidence: number;
}

export interface ActiveSkinProfile {
  skinType: SkinType;
  subCondition?: 'dehydrated_oily';
  isSensitive: boolean;
  barrierHealth: 'intact' | 'compromised' | 'at_risk';
  source: 'inferred' | 'user_override';
  overriddenFields: (keyof Omit<InferredSkinProfile, 'confidence'>)[];
  inferredAt: string;
  overriddenAt?: string;
}

/**
 * Infer skin profile from YouCam scan data
 * - Skin type: from hd_skin_type concern or derived from oiliness/moisture
 * - Sub-condition dehydrated_oily: oiliness < 60 AND moisture < 60
 * - Sensitive: auto-inferred if redness < 65 OR moisture < 58
 * - Barrier health: based on moisture, redness, texture thresholds
 * - Confidence: weighted based on data availability and consistency
 */
export function inferSkinProfileFromScan(scan: {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
}): InferredSkinProfile {
  const concernsMap = new Map(scan.concerns.map(c => [c.type, c.uiScore]));

  const oiliness = concernsMap.get('hd_oiliness') ?? concernsMap.get('oiliness') ?? 50;
  const moisture = concernsMap.get('hd_moisture') ?? concernsMap.get('moisture') ?? 50;
  const redness = concernsMap.get('hd_redness') ?? concernsMap.get('redness') ?? 50;
  const texture = concernsMap.get('hd_texture') ?? concernsMap.get('texture') ?? 50;

  // Determine skin type
  let skinType: SkinType;
  const youcamSkinType = scan.skinType?.type?.toLowerCase();

  // Use YouCam skin type only if it's specific (not 'Normal')
  // 'Normal' is a fallback - we derive from oiliness/moisture for better accuracy
  if (youcamSkinType && ['oily', 'dry', 'combination'].includes(youcamSkinType)) {
    skinType = youcamSkinType as SkinType;
  } else {
    // Derive from oiliness and moisture scores
    if (oiliness >= 70 && moisture >= 60) {
      skinType = 'oily';
    } else if (oiliness <= 40 && moisture <= 50) {
      skinType = 'dry';
    } else if (oiliness >= 60 && moisture <= 50) {
      skinType = 'combination';
    } else {
      skinType = 'normal';
    }
  }

  // Check for dehydrated_oily sub-condition
  const subCondition: 'dehydrated_oily' | undefined =
    oiliness < 60 && moisture < 60 ? 'dehydrated_oily' : undefined;

  // Auto-infer sensitivity
  const isSensitive = redness < 65 || moisture < 58;

  // Determine barrier health
  let barrierHealth: 'intact' | 'compromised' | 'at_risk';
  const barrierScore = (moisture + redness + texture) / 3;

  if (barrierScore >= 70) {
    barrierHealth = 'intact';
  } else if (barrierScore >= 50) {
    barrierHealth = 'at_risk';
  } else {
    barrierHealth = 'compromised';
  }

  // Calculate confidence based on available data
  let confidence = 0.5; // Base confidence

  // Higher confidence if we have HD data
  const hasHDData = scan.concerns.some(c => c.type.startsWith('hd_'));
  if (hasHDData) confidence += 0.2;

  // Higher confidence if skin type was explicitly returned
  if (youcamSkinType) confidence += 0.15;

  // Higher confidence if scores are consistent
  const scoreVariance = [oiliness, moisture, redness, texture].reduce((sum, score) => {
    const mean = (oiliness + moisture + redness + texture) / 4;
    return sum + Math.pow(score - mean, 2);
  }, 0) / 4;

  if (scoreVariance < 200) confidence += 0.1; // Low variance = consistent

  // Cap confidence at 1.0
  confidence = Math.min(1.0, confidence);

  return {
    skinType,
    subCondition,
    isSensitive,
    barrierHealth,
    confidence,
  };
}

/**
 * Resolve active skin profile - user override wins with audit trail
 */
export function resolveActiveSkinProfile(
  inferred: InferredSkinProfile,
  userOverride?: Partial<Omit<InferredSkinProfile, 'confidence'>>
): ActiveSkinProfile {
  const now = new Date().toISOString();

  if (!userOverride) {
    return {
      ...inferred,
      source: 'inferred',
      overriddenFields: [],
      inferredAt: now,
    };
  }

  const overriddenFields: (keyof Omit<InferredSkinProfile, 'confidence'>)[] = [];
  const resolved: ActiveSkinProfile = {
    ...inferred,
    source: 'user_override',
    overriddenFields: [],
    inferredAt: now,
    overriddenAt: now,
  };

  // Apply user overrides and track what changed
  if (userOverride.skinType !== undefined && userOverride.skinType !== inferred.skinType) {
    resolved.skinType = userOverride.skinType;
    overriddenFields.push('skinType');
  }

  if (userOverride.subCondition !== undefined && userOverride.subCondition !== inferred.subCondition) {
    resolved.subCondition = userOverride.subCondition;
    overriddenFields.push('subCondition');
  }

  if (userOverride.isSensitive !== undefined && userOverride.isSensitive !== inferred.isSensitive) {
    resolved.isSensitive = userOverride.isSensitive;
    overriddenFields.push('isSensitive');
  }

  if (userOverride.barrierHealth !== undefined && userOverride.barrierHealth !== inferred.barrierHealth) {
    resolved.barrierHealth = userOverride.barrierHealth;
    overriddenFields.push('barrierHealth');
  }

  resolved.overriddenFields = overriddenFields;

  return resolved;
}

/**
 * Get skin type display label
 */
export function getSkinTypeLabel(skinType: SkinType, subCondition?: 'dehydrated_oily'): string {
  const baseLabels: Record<SkinType, string> = {
    oily: 'Oily',
    dry: 'Dry',
    combination: 'Combination',
    normal: 'Normal',
  };

  let label = baseLabels[skinType];

  if (subCondition === 'dehydrated_oily') {
    label += ' (Dehydrated Oily)';
  }

  return label;
}

/**
 * Get barrier health description
 */
export function getBarrierHealthDescription(health: 'intact' | 'compromised' | 'at_risk'): string {
  const descriptions = {
    intact: 'Your skin barrier is healthy and functioning well.',
    at_risk: 'Your skin barrier shows early signs of compromise. Consider gentle, barrier-supporting products.',
    compromised: 'Your skin barrier is significantly compromised. Avoid actives and focus on repair.',
  };

  return descriptions[health];
}

/**
 * Get sensitivity description
 */
export function getSensitivityDescription(isSensitive: boolean): string {
  return isSensitive
    ? 'Your skin shows signs of sensitivity. Choose fragrance-free, gentle formulations.'
    : 'Your skin does not appear sensitive. You may tolerate a wider range of actives.';
}
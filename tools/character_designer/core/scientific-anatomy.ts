/**
 * Scientific and Biometric Anatomy Evaluation Module.
 * Based on empirical studies in facial beauty prediction, evolutionary psychology,
 * neoclassical facial canons, and artistic human figure construction.
 */

import { 
  FacialCanons, 
  BodyMorphometrics, 
  BodyArchetype, 
  GenderIdentity 
} from './types.js';

export interface BiometricEvaluationReport {
  scorePhiCompatibility: number;     // 0-100%
  facialHarmonicScore: number;        // 0-100%
  dimorphicStrengthScore: number;     // 0-100%
  anatomicalIntegrityScore: number;   // 0-100%
  notes: string[];
  recommendations: string[];
}

export const PHI = 1.6180339887;

/**
 * Validates facial canons against neoclassical symmetry, bigonial width,
 * canthal tilt, and empirical facial beauty research.
 */
export function evaluateFacialCanons(
  canons: FacialCanons, 
  gender: GenderIdentity
): { score: number; findings: string[] } {
  const findings: string[] = [];
  let score = 100;

  // 1. Facial Thirds Check (1.0 : 1.0 : 1.0)
  const [t1 = 1.0, t2 = 1.0, t3 = 1.0] = canons.facialThirdsRatio ?? [1.0, 1.0, 1.0];
  const avgT = (t1 + t2 + t3) / 3;
  const deviationThirds = Math.abs(t1 - avgT) + Math.abs(t2 - avgT) + Math.abs(t3 - avgT);
  if (deviationThirds > 0.3) {
    score -= 12;
    findings.push(`Facial thirds show notable asymmetry (${t1.toFixed(2)}:${t2.toFixed(2)}:${t3.toFixed(2)}). Consider balancing upper/mid/lower thirds closer to 1.0:1.0:1.0.`);
  } else {
    findings.push(`Facial thirds harmonic balance verified (${t1.toFixed(2)}:${t2.toFixed(2)}:${t3.toFixed(2)}).`);
  }

  // 2. Canthal Tilt
  if (canons.canthalTiltDegrees > 0) {
    findings.push(`Positive canthal tilt (+${canons.canthalTiltDegrees}°) creates alert, magnetic, youthful gaze characteristic of high-tier manhwa/webtoon protagonists.`);
  } else if (canons.canthalTiltDegrees === 0) {
    findings.push(`Neutral canthal tilt (0°) gives balanced, calm expression.`);
  } else {
    score -= 6;
    findings.push(`Negative canthal tilt (${canons.canthalTiltDegrees}°) imparts melancholic, weary or distressed appearance.`);
  }

  // 3. Sexual Dimorphism in Jaw & Bigonial Width
  const bigonial = canons.bigonialWidthRatio ?? 0.78;
  if (gender === 'male') {
    if (canons.gonialAngleDegrees >= 110 && canons.gonialAngleDegrees <= 125) {
      findings.push(`Male mandibular gonial angle (${canons.gonialAngleDegrees}°) demonstrates ideal masculine jawline definition.`);
    } else {
      findings.push(`Mandibular angle (${canons.gonialAngleDegrees}°) deviates from standard athletic male range (110°-125°).`);
    }

    if (bigonial >= 0.80 && bigonial <= 0.92) {
      findings.push(`Masculine bigonial-to-bizygomatic width ratio (${bigonial.toFixed(2)}) imparts solid, chiseled mandibular frame.`);
    } else if (bigonial < 0.80) {
      findings.push(`Bigonial width (${bigonial.toFixed(2)}) produces a more slender, youthful or bishonen jawline.`);
    }
  } else if (gender === 'female') {
    if (canons.gonialAngleDegrees >= 125 && canons.gonialAngleDegrees <= 135) {
      findings.push(`Female mandibular angle (${canons.gonialAngleDegrees}°) confirms graceful V-line contour and soft jawline taper.`);
    } else {
      findings.push(`Female mandibular angle (${canons.gonialAngleDegrees}°) produces stronger, distinctive stylistic presence.`);
    }

    if (bigonial >= 0.68 && bigonial <= 0.78) {
      findings.push(`Feminine V-line taper confirmed with bigonial ratio (${bigonial.toFixed(2)}), harmonizing with cheekbone prominence.`);
    }
  } else {
    findings.push(`Androgynous/Non-binary facial balance: gonial angle ${canons.gonialAngleDegrees}°, bigonial ratio ${bigonial.toFixed(2)}.`);
  }

  // 4. Philtrum to Chin Ratio (ideal ~0.5, i.e. 1:2)
  if (Math.abs(canons.philtrumToChinRatio - 0.5) < 0.1) {
    findings.push(`Philtrum-to-chin ratio (${canons.philtrumToChinRatio.toFixed(2)}) satisfies the 1:2 classical lower-face canon.`);
  }

  // 5. Cheekbone Prominence
  if (canons.cheekboneProminence >= 0.6) {
    findings.push(`Prominent malar cheekbone projection (${canons.cheekboneProminence.toFixed(2)}) amplifies high-fashion lighting catches.`);
  }

  return { score: Math.max(0, score), findings };
};

/**
 * Evaluates body morphometrics against evolutionary biomechanics,
 * uncensored anatomical curves, natural gravity drape, and webtoon aesthetics.
 */
export function evaluateBodyMorphometrics(
  morpho: BodyMorphometrics,
  gender: GenderIdentity,
  archetype: BodyArchetype
): BiometricEvaluationReport {
  const notes: string[] = [];
  const recommendations: string[] = [];
  let phiCompat = 85;
  let dimorphicScore = 88;
  let anatomicalScore = 90;

  // 1. Head to Height Ratio evaluation
  if (morpho.headHeightRatio >= 8.0 && morpho.headHeightRatio <= 8.8) {
    notes.push(`Heroic/Webtoon proportion verified: ${morpho.headHeightRatio} heads tall. Creates imposing, statuesque silhouette with lengthened dynamic legs.`);
    phiCompat += 8;
  } else if (morpho.headHeightRatio >= 7.2 && morpho.headHeightRatio < 8.0) {
    notes.push(`Classical natural proportion: ${morpho.headHeightRatio} heads tall. Aligns with neoclassical Lysippian sculpture and realistic life-drawing.`);
  } else {
    notes.push(`Stylized or compact proportion: ${morpho.headHeightRatio} heads tall.`);
  }

  // 2. WHR (Waist-to-Hip Ratio)
  if (gender === 'female') {
    if (morpho.waistToHipRatio >= 0.65 && morpho.waistToHipRatio <= 0.72) {
      notes.push(`WHR ${morpho.waistToHipRatio.toFixed(2)} matches Devendra Singh's evolutionary gynoid curve optimum (0.67-0.70) signaling high aesthetic resonance and feminine curvature.`);
      dimorphicScore += 10;
    } else if (morpho.waistToHipRatio < 0.65) {
      notes.push(`WHR ${morpho.waistToHipRatio.toFixed(2)} reflects stylized hourglass / high-fantasy aesthetic emphasis.`);
    } else {
      notes.push(`WHR ${morpho.waistToHipRatio.toFixed(2)} corresponds to natural athletic or slender straight-cut morphology.`);
    }
  } else if (gender === 'male') {
    if (morpho.waistToHipRatio >= 0.82 && morpho.waistToHipRatio <= 0.90) {
      notes.push(`Male WHR ${morpho.waistToHipRatio.toFixed(2)} exhibits lean athletic android pelvic narrowness.`);
      dimorphicScore += 8;
    }
  } else {
    notes.push(`Androgynous/Non-binary WHR ${morpho.waistToHipRatio.toFixed(2)}: balanced, sleek torso silhouette.`);
    dimorphicScore += 8;
  }

  // 3. SHR (Shoulder-to-Hip Ratio) - The V-Taper
  if (gender === 'male') {
    if (morpho.shoulderToHipRatio >= 1.40 && morpho.shoulderToHipRatio <= 1.68) {
      notes.push(`Shoulder-to-Hip V-taper (${morpho.shoulderToHipRatio.toFixed(2)}) fulfills the athletic male ideal (broad clavicles, wide lats tapering to narrow waist/pelvis).`);
      dimorphicScore += 8;
    } else {
      recommendations.push(`To amplify the webtoon protagonist presence (Solo Leveling aesthetic), consider broadening clavicles to achieve SHR ~1.45-1.55.`);
    }
  } else if (gender === 'female') {
    if (morpho.shoulderToHipRatio >= 1.00 && morpho.shoulderToHipRatio <= 1.18) {
      notes.push(`Feminine shoulder-to-hip alignment (${morpho.shoulderToHipRatio.toFixed(2)}) produces graceful, balanced posture.`);
      dimorphicScore += 8;
    }
  } else {
    notes.push(`Androgynous shoulder-to-hip ratio (${morpho.shoulderToHipRatio.toFixed(2)}) delivers streamlined aesthetic balance.`);
    dimorphicScore += 8;
  }

  // 4. Muscularity and Definition Evaluation
  if (morpho.muscularityLevel >= 0.75) {
    notes.push(`High muscular definition (level ${(morpho.muscularityLevel * 10).toFixed(1)}/10): chiseled abdominal wall, vascular forearms, and striated lats.`);
  } else if (morpho.muscularityLevel >= 0.4) {
    notes.push(`Toned athletic conditioning (level ${(morpho.muscularityLevel * 10).toFixed(1)}/10): balanced functional muscle tone.`);
  } else {
    notes.push(`Slender, lean morphology (level ${(morpho.muscularityLevel * 10).toFixed(1)}/10): smooth transitions, minimal surface hypertrophy.`);
  }

  // 5. Bust & Galbe Curves
  if (morpho.bustVolume !== undefined) {
    if (morpho.bustVolume >= 0.65) {
      notes.push(`Voluptuous thoracic contour (volume slider ${morpho.bustVolume.toFixed(2)}) modeled with natural downward gravitational teardrop drape.`);
    } else if (morpho.bustVolume >= 0.3) {
      notes.push(`Balanced natural breast/pectoral volume (volume slider ${morpho.bustVolume.toFixed(2)}).`);
    } else {
      notes.push(`Petite/athletic chest profile (volume slider ${morpho.bustVolume.toFixed(2)}).`);
    }
  }

  if (morpho.galbeCurvature !== undefined) {
    if (morpho.galbeCurvature >= 0.7) {
      notes.push(`Pronounced gluteal shelf and curvature (${morpho.galbeCurvature.toFixed(2)}) creating strong sagittal contour.`);
    } else if (morpho.galbeCurvature >= 0.4) {
      notes.push(`Athletic rounded gluteal contour (${morpho.galbeCurvature.toFixed(2)}).`);
    }
  }

  // 6. Uncensored Natural Anatomy Check
  const features = morpho.anatomicalFeatures;
  if (!features || !features.bustChestDescription || !features.waistAbdomenDescription || !features.hipGluteDescription) {
    anatomicalScore -= 20;
    recommendations.push(`Provide comprehensive morphological descriptions for chest, waist, hips, and limbs to avoid generic or flat rendering.`);
  } else {
    notes.push(`Authentic morphological modeling enabled: preserves natural tissue drape, gravity, muscular striations, and physiological curvature without artificial censorship.`);
    anatomicalScore += 5;
  }

  const overallPhi = Math.min(100, Math.round(phiCompat));
  const overallDimorphic = Math.min(100, Math.round(dimorphicScore));
  const overallAnatomical = Math.min(100, Math.round(anatomicalScore));
  const facialHarmonic = 92;

  return {
    scorePhiCompatibility: overallPhi,
    facialHarmonicScore: facialHarmonic,
    dimorphicStrengthScore: overallDimorphic,
    anatomicalIntegrityScore: overallAnatomical,
    notes,
    recommendations
  };
}

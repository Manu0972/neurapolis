/**
 * Scientific Biometrics and Neoclassical Canon Evaluator.
 * Analyzes facial harmonic balance, golden ratio (Phi),
 * sexual dimorphism in mandibular & thoracic ratios,
 * evolutionary psychology WHR/SHR optimums, and anatomical integrity.
 */

import type {
  FacialCanons,
  BodyMorphometrics,
  BodyArchetype,
  GenderIdentity
} from '../types.ts';

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
 * Evaluates facial canons against neoclassical symmetry, bigonial width,
 * canthal tilt, and empirical facial beauty research.
 */
export function evaluateFacialCanons(
  canons: FacialCanons,
  gender: GenderIdentity
): { score: number; findings: string[] } {
  const findings: string[] = [];
  let score = 100;

  // 1. Facial Thirds Check (1.0 : 1.0 : 1.0)
  const [t1, t2, t3] = canons.facialThirdsRatio;
  const avgT = (t1 + t2 + t3) / 3;
  const deviationThirds = Math.abs(t1 - avgT) + Math.abs(t2 - avgT) + Math.abs(t3 - avgT);
  if (deviationThirds > 0.25) {
    score -= 10;
    findings.push(`Facial thirds show noticeable variation (${t1.toFixed(2)}:${t2.toFixed(2)}:${t3.toFixed(2)}). Balances stylistic expressiveness over strict neoclassical thirds.`);
  } else {
    findings.push(`Facial thirds neoclassical harmony verified (${t1.toFixed(2)}:${t2.toFixed(2)}:${t3.toFixed(2)}).`);
  }

  // 2. Canthal Tilt
  if (canons.canthalTiltDegrees > 0) {
    findings.push(`Positive canthal tilt (+${canons.canthalTiltDegrees}°) creates magnetic, alert, high-status gaze characteristic of premier manhwa/webtoon protagonists.`);
  } else if (canons.canthalTiltDegrees === 0) {
    findings.push(`Neutral canthal tilt (0°) delivers calm, grounded contemplative balance.`);
  } else {
    score -= 5;
    findings.push(`Negative canthal tilt (${canons.canthalTiltDegrees}°) imparts brooding, weary or vulnerable depth.`);
  }

  // 3. Sexual Dimorphism in Mandibular Angle & Bigonial Width
  const bigonial = canons.bigonialWidthRatio;
  if (gender === 'male') {
    if (canons.gonialAngleDegrees >= 110 && canons.gonialAngleDegrees <= 125) {
      findings.push(`Male mandibular angle (${canons.gonialAngleDegrees}°) satisfies optimal masculine athletic angularity.`);
    }
    if (bigonial >= 0.80 && bigonial <= 0.92) {
      findings.push(`Masculine bigonial-to-bizygomatic width ratio (${bigonial.toFixed(2)}) imparts solid, chiseled mandibular frame.`);
    }
  } else if (gender === 'female') {
    if (canons.gonialAngleDegrees >= 125 && canons.gonialAngleDegrees <= 135) {
      findings.push(`Female mandibular angle (${canons.gonialAngleDegrees}°) confirms graceful V-line contour and soft jawline taper.`);
    }
    if (bigonial >= 0.65 && bigonial <= 0.78) {
      findings.push(`Feminine V-line taper confirmed with bigonial ratio (${bigonial.toFixed(2)}), harmonizing with cheekbone prominence.`);
    }
  } else {
    findings.push(`Androgynous facial balance: gonial angle ${canons.gonialAngleDegrees}°, bigonial ratio ${bigonial.toFixed(2)}.`);
  }

  // 4. Philtrum to Chin Ratio (ideal ~0.5)
  if (Math.abs(canons.philtrumToChinRatio - 0.5) < 0.08) {
    findings.push(`Philtrum-to-chin ratio (${canons.philtrumToChinRatio.toFixed(2)}) matches the 1:2 classical lower-face canon.`);
  }

  // 5. Bilateral Symmetry Score
  if (canons.facialSymmetryScore >= 0.95) {
    findings.push(`High bilateral symmetry score (${(canons.facialSymmetryScore * 100).toFixed(1)}%) aligns with evolutionary fitness signals.`);
  }

  return { score: Math.max(0, score), findings };
}

/**
 * Evaluates body morphometrics against evolutionary biomechanics,
 * uncensored natural curves, gravitational drape, and heroic webtoon aesthetics.
 */
export function evaluateBodyMorphometrics(
  morpho: BodyMorphometrics,
  gender: GenderIdentity,
  archetype: BodyArchetype
): BiometricEvaluationReport {
  const notes: string[] = [];
  const recommendations: string[] = [];
  let phiCompat = 88;
  let dimorphicScore = 90;
  let anatomicalScore = 92;

  // 1. Head to Height Ratio evaluation
  if (morpho.headHeightRatio >= 8.0 && morpho.headHeightRatio <= 8.8) {
    notes.push(`Heroic manhwa proportion verified: ${morpho.headHeightRatio} heads tall. Produces statuesque, commanding silhouette with lengthened dynamic limbs.`);
    phiCompat += 6;
  } else if (morpho.headHeightRatio >= 7.2 && morpho.headHeightRatio < 8.0) {
    notes.push(`Classical natural proportion: ${morpho.headHeightRatio} heads tall. Aligns with neoclassical sculpture and academic life drawing.`);
    phiCompat += 4;
  } else {
    notes.push(`Stylized or compact proportion: ${morpho.headHeightRatio} heads tall.`);
  }

  // 2. WHR (Waist-to-Hip Ratio)
  if (gender === 'female') {
    if (morpho.waistToHipRatio >= 0.65 && morpho.waistToHipRatio <= 0.72) {
      notes.push(`WHR ${morpho.waistToHipRatio.toFixed(2)} matches Devendra Singh's evolutionary gynoid curve optimum (0.67-0.70) indicating maximum aesthetic resonance.`);
      dimorphicScore += 8;
    } else if (morpho.waistToHipRatio < 0.65) {
      notes.push(`WHR ${morpho.waistToHipRatio.toFixed(2)} represents high-fantasy exaggerated hourglass contour.`);
    } else {
      notes.push(`WHR ${morpho.waistToHipRatio.toFixed(2)} indicates functional athletic / slender natural torso taper.`);
    }
  } else if (gender === 'male') {
    if (morpho.waistToHipRatio >= 0.82 && morpho.waistToHipRatio <= 0.90) {
      notes.push(`Male WHR ${morpho.waistToHipRatio.toFixed(2)} exhibits lean athletic android pelvic narrowness.`);
      dimorphicScore += 6;
    }
  }

  // 3. SHR (Shoulder-to-Hip Ratio) - The V-Taper
  if (gender === 'male') {
    if (morpho.shoulderToHipRatio >= 1.40 && morpho.shoulderToHipRatio <= 1.68) {
      notes.push(`Shoulder-to-Hip V-taper (${morpho.shoulderToHipRatio.toFixed(2)}) fulfills athletic heroic ideal (broad clavicles tapering to narrow pelvis).`);
      dimorphicScore += 8;
    } else {
      recommendations.push(`To amplify Solo Leveling hunter presence, consider broadening shoulder-to-hip ratio towards 1.45-1.55.`);
    }
  }

  // 4. Muscularity and Definition Evaluation
  if (morpho.muscularityLevel >= 0.75) {
    notes.push(`High muscular definition (level ${(morpho.muscularityLevel * 10).toFixed(1)}/10, ${morpho.muscleDefinition}): 8-pack abs, vascularity (${morpho.vascularity}), and striated lats.`);
  } else if (morpho.muscularityLevel >= 0.4) {
    notes.push(`Toned athletic conditioning (level ${(morpho.muscularityLevel * 10).toFixed(1)}/10, ${morpho.muscleDefinition}): balanced functional physique.`);
  } else {
    notes.push(`Slender, lean morphology (level ${(morpho.muscularityLevel * 10).toFixed(1)}/10, ${morpho.muscleDefinition}): smooth transitions, minimal surface hypertrophy.`);
  }

  // 5. Bust & Galbe Natural Curves
  if (morpho.bustVolume !== undefined) {
    if (morpho.bustVolume >= 0.65) {
      notes.push(`Voluptuous thoracic contour (volume slider ${morpho.bustVolume.toFixed(2)}) modeled with natural downward gravitational teardrop drape.`);
    } else if (morpho.bustVolume >= 0.3) {
      notes.push(`Natural breast/pectoral volume (volume slider ${morpho.bustVolume.toFixed(2)}).`);
    } else {
      notes.push(`Petite/athletic chest profile (volume slider ${morpho.bustVolume.toFixed(2)}).`);
    }
  }

  if (morpho.galbeCurvature !== undefined) {
    if (morpho.galbeCurvature >= 0.7) {
      notes.push(`Pronounced gluteal shelf and curvature (${morpho.galbeCurvature.toFixed(2)}) creating strong sagittal posture.`);
    } else if (morpho.galbeCurvature >= 0.4) {
      notes.push(`Athletic rounded gluteal contour (${morpho.galbeCurvature.toFixed(2)}).`);
    }
  }

  // 6. Uncensored Natural Anatomy Check
  const features = morpho.anatomicalFeatures;
  if (!features || !features.bustChestDescription || !features.waistAbdomenDescription || !features.hipGluteDescription) {
    anatomicalScore -= 20;
    recommendations.push(`Provide comprehensive morphological descriptions for chest, waist, hips, and limbs.`);
  } else {
    notes.push(`Authentic morphological modeling enabled: preserves natural tissue drape, gravity, muscular striations, and physiological curvature without artificial censorship.`);
    anatomicalScore += 5;
  }

  const overallPhi = Math.min(100, Math.round(phiCompat));
  const overallDimorphic = Math.min(100, Math.round(dimorphicScore));
  const overallAnatomical = Math.min(100, Math.round(anatomicalScore));
  const facialHarmonic = 94;

  return {
    scorePhiCompatibility: overallPhi,
    facialHarmonicScore: facialHarmonic,
    dimorphicStrengthScore: overallDimorphic,
    anatomicalIntegrityScore: overallAnatomical,
    notes,
    recommendations
  };
}

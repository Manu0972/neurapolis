/**
 * Biometrics and Aesthetic Computation Engine.
 * Formulates empirical anthropometric ratios, neoclassical facial canons,
 * and aesthetic scores (Phi / Golden Ratio, WHR, V-Taper, Gonial Angle).
 */

export const PHI = 1.6180339887;

/**
 * Calculates Waist-to-Hip Ratio (WHR) and returns interpretation.
 * @param {number} whr
 * @param {string} gender
 */
export function interpretWHR(whr, gender = 'female') {
  if (gender === 'female') {
    if (whr < 0.63) {
      return { category: 'Hyper-Curvaceous', label: 'Stylized Hourglass (<0.63)', optimal: false };
    }
    if (whr >= 0.65 && whr <= 0.72) {
      return { category: 'Devendra Singh Optimum', label: 'Evolutionary Gynoid Ideal (0.65 - 0.72)', optimal: true };
    }
    if (whr <= 0.78) {
      return { category: 'Natural Athletic', label: 'Athletic Balanced (0.73 - 0.78)', optimal: true };
    }
    return { category: 'Straight Silhouette', label: 'Slender Linear (>0.78)', optimal: false };
  } else {
    if (whr <= 0.82) {
      return { category: 'Narrow Athletic Pelvis', label: 'Chiseled Android Pelvis (<=0.82)', optimal: true };
    }
    if (whr <= 0.90) {
      return { category: 'Standard Athletic', label: 'Athletic Taper (0.83 - 0.90)', optimal: true };
    }
    return { category: 'Broad Torso', label: 'Classic Powerhouse (>0.90)', optimal: false };
  }
}

/**
 * Calculates Shoulder-to-Hip Ratio (SHR / V-Taper) interpretation.
 * @param {number} shr
 * @param {string} gender
 */
export function interpretSHR(shr, gender = 'male') {
  if (gender === 'male') {
    if (shr >= 1.55) {
      return { category: 'Heroic V-Taper', label: 'Solo Leveling Heroic Broad Clavicle (>=1.55)', optimal: true };
    }
    if (shr >= 1.40) {
      return { category: 'Athletic V-Taper', label: 'Classic Athletic Taper (1.40 - 1.54)', optimal: true };
    }
    if (shr >= 1.25) {
      return { category: 'Moderate Taper', label: 'Balanced Frame (1.25 - 1.39)', optimal: false };
    }
    return { category: 'Linear Column', label: 'Slender Minimal Taper (<1.25)', optimal: false };
  } else {
    if (shr >= 1.20) {
      return { category: 'Athletic Shoulder Line', label: 'Swimmer / High-Fashion Clavicle (>=1.20)', optimal: true };
    }
    if (shr >= 1.05) {
      return { category: 'Balanced Feminine Frame', label: 'Proportional Clavicle (1.05 - 1.19)', optimal: true };
    }
    return { category: 'Soft Sloping Shoulders', label: 'Delicate Petite Frame (<1.05)', optimal: false };
  }
}

/**
 * Interprets mandibular gonial angle.
 * @param {number} angle
 * @param {string} gender
 */
export function interpretGonialAngle(angle, gender = 'male') {
  if (gender === 'male') {
    if (angle <= 112) {
      return { category: 'Hyper-Chiseled', label: 'Square Heroic Jawline (<=112°)', description: 'Imposing, ultra-defined mandibular ramus.' };
    }
    if (angle <= 122) {
      return { category: 'Classic Masculine', label: 'Athletic Chiseled (113° - 122°)', description: 'Ideal neoclassical masculine jawline definition.' };
    }
    return { category: 'Soft Bishonen', label: 'Slender Taper (>122°)', description: 'Youthful, elongated, or delicate mandibular profile.' };
  } else {
    if (angle >= 128) {
      return { category: 'Feminine V-Line', label: 'Korean Manhwa V-Line (>=128°)', description: 'Graceful taper from zygoma to delicate chin.' };
    }
    if (angle >= 122) {
      return { category: 'Sculpted Elegance', label: 'Defined Jawline (122° - 127°)', description: 'High-fashion editorial structured bone contour.' };
    }
    return { category: 'Strong Mandibular Frame', label: 'Powerful Jawline (<122°)', description: 'Assertive, authoritative heroine presence.' };
  }
}

/**
 * Interprets canthal tilt degrees.
 * @param {number} tilt
 */
export function interpretCanthalTilt(tilt) {
  if (tilt >= 5) {
    return { category: 'Feline / Hunter', label: `Sharp Positive (+${tilt.toFixed(1)}°)`, description: 'Intense, magnetic, predatory hunter gaze characteristic of webtoon protagonists.' };
  }
  if (tilt >= 2) {
    return { category: 'Positive Almond', label: `Alert Magnetic (+${tilt.toFixed(1)}°)`, description: 'Harmonious youthful eye aperture with upward lateral slant.' };
  }
  if (tilt >= -1) {
    return { category: 'Neutral Horizontal', label: `Calm Balanced (${tilt.toFixed(1)}°)`, description: 'Serene, contemplative, classical gaze.' };
  }
  return { category: 'Negative Tilt', label: `Soft Melancholic (${tilt.toFixed(1)}°)`, description: 'Gentle, weary, or pensive gaze with downward lateral cant.' };
}

/**
 * Interprets muscle definition continuous level.
 * @param {number} level 0.0 - 1.0
 */
export function interpretMuscularity(level) {
  if (level >= 0.85) {
    return { category: 'Shredded / Demon Back', label: 'Superhuman Striation (85% - 100%)', badge: 'SHREDDED' };
  }
  if (level >= 0.65) {
    return { category: 'Chiseled Action Hero', label: '8-Pack & Serratus (65% - 84%)', badge: 'RIPPED' };
  }
  if (level >= 0.40) {
    return { category: 'Toned Athletic', label: 'Swimmer / Dancer Tone (40% - 64%)', badge: 'ATHLETIC' };
  }
  return { category: 'Slender / Soft Natural', label: 'Smooth Taper (0% - 39%)', badge: 'SOFT TONED' };
}

/**
 * Interprets glute and pelvic curvature (Galbe).
 * @param {number} galbe 0.0 - 1.0
 */
export function interpretGalbe(galbe) {
  if (galbe >= 0.85) {
    return { category: 'Deep Hourglass Shelf', label: 'Pronounced Sagittal Lordosis Flare', badge: 'DEEP SHELF' };
  }
  if (galbe >= 0.65) {
    return { category: 'Full Rounded Galbe', label: 'Generous Athletic Curvature', badge: 'FULL CURVE' };
  }
  if (galbe >= 0.40) {
    return { category: 'Firm Athletic Toned', label: 'Defined Gluteus Medius / Maximus', badge: 'ATHLETIC' };
  }
  return { category: 'Lean Straight', label: 'Slender Minimal Lateral Shelf', badge: 'LEAN' };
}

/**
 * Interprets vascularity level.
 * @param {number} vasc 0.0 - 1.0
 */
export function interpretVascularity(vasc) {
  if (vasc >= 0.70) {
    return { category: 'Prominent Vascular Grid', label: 'Cephalic & Bicep Vein Network', badge: 'HIGH VASCULAR' };
  }
  if (vasc >= 0.35) {
    return { category: 'Subtle Forearm Veins', label: 'Tension Vascularity on Flex', badge: 'MODERATE' };
  }
  return { category: 'Smooth Subcutaneous', label: 'Minimal / Smooth Epidermal Layer', badge: 'SMOOTH' };
}

/**
 * Computes complete Biometric Analysis and scoring.
 * @param {Object} character
 * @returns {Object} scores and comprehensive radar metrics
 */
export function evaluateBiometrics(character) {
  const {
    gender = 'male',
    heightCm = 180,
    whr = 0.75,
    vTaper = 1.45,
    muscularity = 0.65,
    galbe = 0.50,
    vascularity = 0.30,
    bustVolume = 0.40,
    canthalTilt = 4.0,
    mandibularAngle = 118,
    facialSymmetry = 0.96,
    cheekbones = 0.70
  } = character;

  // 1. Golden Ratio / Phi Compatibility Score (0 - 100)
  // Evaluates how close proportions approach neoclassical and evolutionary golden ratios
  let phiScore = 80;
  
  // Head to height ratio implied by height
  const headRatio = heightCm >= 185 ? 8.4 : heightCm >= 170 ? 8.0 : 7.6;
  if (headRatio >= 8.0 && headRatio <= 8.6) phiScore += 8;
  
  // WHR evaluation
  if (gender === 'female' && whr >= 0.65 && whr <= 0.72) phiScore += 8;
  if (gender === 'male' && whr >= 0.82 && whr <= 0.88) phiScore += 8;
  
  // Symmetry
  phiScore += Math.round((facialSymmetry - 0.90) * 40); // 0.96 -> +2.4
  phiScore = Math.max(50, Math.min(100, phiScore));

  // 2. Dimorphic Strength Score (0 - 100)
  // Measures expressiveness of masculine or feminine morphological markers
  let dimorphicScore = 75;
  if (gender === 'male') {
    if (vTaper >= 1.50) dimorphicScore += 12;
    else if (vTaper >= 1.40) dimorphicScore += 6;
    if (mandibularAngle <= 120) dimorphicScore += 8;
    if (muscularity >= 0.70) dimorphicScore += 6;
  } else if (gender === 'female') {
    if (whr <= 0.70) dimorphicScore += 12;
    if (galbe >= 0.60) dimorphicScore += 8;
    if (mandibularAngle >= 125) dimorphicScore += 6;
    if (bustVolume >= 0.50) dimorphicScore += 4;
  } else {
    // Androgynous balance
    dimorphicScore = Math.round(90 - Math.abs(mandibularAngle - 121) * 2);
  }
  dimorphicScore = Math.max(50, Math.min(100, dimorphicScore));

  // 3. V-Taper / Upper Torso Index (0 - 100)
  const vTaperIndex = Math.max(20, Math.min(100, Math.round(((vTaper - 1.0) / 0.7) * 100)));

  // 4. Athletic Power Index (0 - 100)
  const athleticPower = Math.max(20, Math.min(100, Math.round(
    (muscularity * 0.45 + (vTaper / 1.7) * 0.35 + vascularity * 0.20) * 100
  )));

  // 5. Craniofacial Sharpness (0 - 100)
  // Sharp jawline + positive canthal tilt + high cheekbones
  const canthalNorm = Math.min(1, Math.max(0, (canthalTilt + 5) / 15)); // -5 to +10 -> 0 to 1
  const jawSharpnessNorm = gender === 'male'
    ? Math.min(1, Math.max(0, (135 - mandibularAngle) / 25))
    : Math.min(1, Math.max(0, (mandibularAngle - 105) / 25));
  const facialSharpness = Math.round(
    (canthalNorm * 0.35 + jawSharpnessNorm * 0.35 + cheekbones * 0.30) * 100
  );

  // 6. Aesthetic Harmony (Aggregate)
  const aestheticHarmony = Math.round(
    phiScore * 0.30 +
    dimorphicScore * 0.25 +
    athleticPower * 0.20 +
    facialSharpness * 0.15 +
    facialSymmetry * 100 * 0.10
  );

  return {
    phiScore,
    dimorphicScore,
    vTaperIndex,
    athleticPower,
    facialSharpness,
    aestheticHarmony,
    headRatio,
    radarMetrics: [
      { axis: 'V-Taper Dominance', value: vTaperIndex },
      { axis: 'Muscular Striation', value: Math.round(muscularity * 100) },
      { axis: 'Biometric Golden Ratio', value: phiScore },
      { axis: 'Craniofacial Sharpness', value: facialSharpness },
      { axis: 'Athletic Power', value: athleticPower },
      { axis: 'Dimorphic Resonance', value: dimorphicScore }
    ]
  };
}

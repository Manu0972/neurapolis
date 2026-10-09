/**
 * Facial Anatomy and Neoclassical Canons Synthesis Module.
 * Models granular facial parameters: canthal tilt, mandibular angle,
 * facial symmetry, eye shape, nose structure, and lip morphology.
 */

import type { 
  FacialCanons, 
  EyeShape, 
  NoseShape, 
  LipShape, 
  GenderIdentity,
  GranularSlidersInput
} from '../types.ts';
import { DeterministicPRNG } from '../compiler/prng.ts';

export const EYE_SHAPES: readonly EyeShape[] = [
  'almond',
  'hooded',
  'monolid',
  'double_eyelid',
  'phoenix_eyes',
  'doe_eyes',
  'fox_sharp',
  'deep_set'
] as const;

export const NOSE_SHAPES: readonly NoseShape[] = [
  'straight_greek',
  'refined_button',
  'aquiline_roman',
  'high_bridge_narrow',
  'soft_tapered'
] as const;

export const LIP_SHAPES: readonly LipShape[] = [
  'full_cushion',
  'pronounced_cupid_bow',
  'subtle_tapered',
  'gradient_tint_velvet',
  'plump_soft'
] as const;

/**
 * Procedurally generates facial canons given gender, optional sliders, and PRNG.
 */
export function generateFacialCanons(
  gender: GenderIdentity,
  prng: DeterministicPRNG,
  sliders?: GranularSlidersInput
): FacialCanons {
  // 1. Canthal Tilt
  let canthalTilt = sliders?.canthalTiltDegrees;
  if (canthalTilt === undefined) {
    if (gender === 'female') {
      canthalTilt = prng.floatInRange(2.5, 6.0); // youthful positive tilt
    } else if (gender === 'male') {
      canthalTilt = prng.floatInRange(1.5, 5.0); // alert, intense gaze
    } else {
      canthalTilt = prng.floatInRange(1.0, 5.5);
    }
  }

  // 2. Mandibular Gonial Angle
  let gonialAngle = sliders?.gonialAngleDegrees;
  if (gonialAngle === undefined) {
    if (gender === 'male') {
      gonialAngle = prng.floatInRange(112.0, 124.0); // masculine chiseled jaw
    } else if (gender === 'female') {
      gonialAngle = prng.floatInRange(125.0, 134.0); // graceful tapered V-line
    } else {
      gonialAngle = prng.floatInRange(118.0, 128.0);
    }
  }

  // 3. Bigonial Width Ratio & Cheekbones
  let bigonial = sliders?.bigonialWidthRatio;
  if (bigonial === undefined) {
    if (gender === 'male') {
      bigonial = prng.floatInRange(0.80, 0.90);
    } else if (gender === 'female') {
      bigonial = prng.floatInRange(0.68, 0.78);
    } else {
      bigonial = prng.floatInRange(0.72, 0.84);
    }
  }

  const cheekboneProminence = sliders?.cheekboneProminence ?? prng.floatInRange(0.60, 0.92);
  const cheekboneToJawRatio = Number((1.0 / bigonial).toFixed(3));

  // 4. Facial Thirds & Fifths
  const thirdsRatio: [number, number, number] = sliders?.facialThirdsRatio ?? [
    Number(prng.floatInRange(0.96, 1.04).toFixed(3)),
    Number(prng.floatInRange(0.98, 1.02).toFixed(3)),
    Number(prng.floatInRange(0.96, 1.04).toFixed(3))
  ];

  const facialSymmetryScore = sliders?.facialSymmetryScore ?? prng.floatInRange(0.92, 0.99);
  const philtrumToChin = sliders?.philtrumToChinRatio ?? prng.floatInRange(0.48, 0.52);

  // 5. Nasolabial Angle
  let nasolabial = sliders?.nasolabialAngleDegrees;
  if (nasolabial === undefined) {
    nasolabial = gender === 'female' ? prng.floatInRange(96.0, 106.0) : prng.floatInRange(90.0, 96.0);
  }

  // 6. Shapes
  const eyeShape = sliders?.eyeShape ?? prng.pick(EYE_SHAPES);
  const noseShape = sliders?.noseShape ?? prng.pick(NOSE_SHAPES);
  const lipShape = sliders?.lipShape ?? prng.pick(LIP_SHAPES);

  // 7. Descriptions
  const eyeDetails = describeEye(eyeShape, canthalTilt);
  const noseDetails = describeNose(noseShape, nasolabial);
  const lipDetails = describeLips(lipShape, philtrumToChin);
  const jawlineDescription = describeJawline(gender, gonialAngle, bigonial, cheekboneProminence);

  return {
    facialThirdsRatio: thirdsRatio,
    facialFifthsEyeRatio: 1.0,
    canthalTiltDegrees: Number(canthalTilt.toFixed(1)),
    gonialAngleDegrees: Number(gonialAngle.toFixed(1)),
    facialSymmetryScore: Number(facialSymmetryScore.toFixed(3)),
    cheekboneToJawRatio,
    bigonialWidthRatio: Number(bigonial.toFixed(3)),
    philtrumToChinRatio: Number(philtrumToChin.toFixed(3)),
    nasolabialAngleDegrees: Number(nasolabial.toFixed(1)),
    cheekboneProminence: Number(cheekboneProminence.toFixed(3)),
    eyeShape,
    eyeDetails,
    noseShape,
    noseDetails,
    lipShape,
    lipDetails,
    jawlineDescription
  };
}

function describeEye(shape: EyeShape, tilt: number): string {
  const tiltSign = tilt >= 0 ? `+${tilt.toFixed(1)}°` : `${tilt.toFixed(1)}°`;
  const baseMap: Record<EyeShape, string> = {
    almond: 'Classic almond eye contour with balanced palpebral fissure',
    hooded: 'Intense hooded lids with deep-set brow ridge casting moody shadows',
    monolid: 'Sleek monolid silhouette with clean epicanthic drape and taut eyelid line',
    double_eyelid: 'Crisp parallel double eyelid crease typical of Korean manhwa leads',
    phoenix_eyes: 'Elegant upward-sweeping phoenix eyes with elongated lateral canthus',
    doe_eyes: 'Large expressive doe eyes with widened vertical aperture and soft limbus',
    fox_sharp: 'Piercing predator fox eyes with acute medial and upward lateral canthal corners',
    deep_set: 'Sculpted deep-set orbits creating intense cinematic depth and gaze focus'
  };
  return `${baseMap[shape]}, magnetic canthal tilt (${tiltSign}), sharp catchlights and defined dark limbal ring.`;
}

function describeNose(shape: NoseShape, nasolabial: number): string {
  const baseMap: Record<NoseShape, string> = {
    straight_greek: 'Straight neoclassical dorsum with seamless transition from glabella',
    refined_button: 'Petite upturned tip with delicate soft alar wings and refined bridge',
    aquiline_roman: 'Noble aquiline bridge with subtle aristocratic dorsal hump and firm projection',
    high_bridge_narrow: 'High narrow nasal bridge with sculpted tip and clean planar highlights',
    soft_tapered: 'Gently tapered dorsum with soft supratip break and natural proportions'
  };
  return `${baseMap[shape]}, nasolabial angle at ${nasolabial.toFixed(1)}° with crisp highlight reflection along nasal ridge.`;
}

function describeLips(shape: LipShape, philtrumRatio: number): string {
  const baseMap: Record<LipShape, string> = {
    full_cushion: 'Voluptuous cushion fullness on both vermilion borders with soft central pillow',
    pronounced_cupid_bow: 'Architectural sharp Cupid\'s bow with distinct philtral columns and peaked tubercles',
    subtle_tapered: 'Clean minimal vermilion contour with elegant lateral oral commissure taper',
    gradient_tint_velvet: 'Velvety matte gradient coloration concentrated at oral fissure with diffused perimeter',
    plump_soft: 'Plump naturally hydrated contour with well-defined lower lip crease and soft fullness'
  };
  return `${baseMap[shape]}, balanced philtrum-to-chin ratio (${philtrumRatio.toFixed(2)}:1) with subtle sub-labial shadow depth.`;
}

function describeJawline(
  gender: GenderIdentity,
  gonial: number,
  bigonial: number,
  cheekbones: number
): string {
  if (gender === 'male') {
    return `Athletic masculine mandibular frame, chiseled gonial angle at ${gonial.toFixed(1)}°, solid bigonial ratio (${bigonial.toFixed(2)}), sculpted masseter contours harmonizing with prominent malar cheekbones (${cheekbones.toFixed(2)}).`;
  }
  if (gender === 'female') {
    return `Graceful feminine V-line contour, tapered gonial angle at ${gonial.toFixed(1)}°, slender bigonial ratio (${bigonial.toFixed(2)}), seamless jawline flow leading to defined delicate chin and sculpted cheekbones (${cheekbones.toFixed(2)}).`;
  }
  return `Balanced androgynous mandibular architecture, gonial angle at ${gonial.toFixed(1)}°, refined bigonial width (${bigonial.toFixed(2)}), harmonious bilateral jawline taper with high cheekbone structure.`;
}

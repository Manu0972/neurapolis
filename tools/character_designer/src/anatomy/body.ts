/**
 * Body Anatomy, Muscle Sculpting & Uncensored Natural Curves Module.
 * Models height, weight, somatotype, WHR, SHR, circumferences,
 * muscle definition (soft, toned, athletic, ripped, shredded),
 * V-taper, vascularity, and authentic natural physical curves.
 */

import type {
  BodyMorphometrics,
  BodyArchetype,
  GenderIdentity,
  MuscleDefinitionDiscrete,
  VascularityLevel,
  SomatotypeCategory,
  UncensoredNaturalCurves,
  GranularSlidersInput
} from '../types.ts';
import { DeterministicPRNG } from '../compiler/prng.ts';

export function generateBodyMorphometrics(
  gender: GenderIdentity,
  archetype: BodyArchetype,
  prng: DeterministicPRNG,
  sliders?: GranularSlidersInput
): BodyMorphometrics {
  // 1. Height in cm
  let heightCm = sliders?.heightCm;
  if (heightCm === undefined) {
    if (gender === 'male') {
      heightCm = archetype === 'hyper_muscular_hero' ? prng.intInRange(186, 194) : prng.intInRange(178, 188);
    } else if (gender === 'female') {
      heightCm = archetype === 'slender_elegant' ? prng.intInRange(170, 178) : prng.intInRange(164, 174);
    } else {
      heightCm = prng.intInRange(170, 182);
    }
  }

  // 2. Somatotype
  let somatotype: SomatotypeCategory = sliders?.somatotype ?? 'mesomorph';
  if (!sliders?.somatotype) {
    if (archetype === 'hyper_muscular_hero' || archetype === 'stocky_powerhouse') {
      somatotype = 'mesomorph';
    } else if (archetype === 'slender_elegant') {
      somatotype = 'ectomorph';
    } else if (archetype === 'voluptuous_curvaceous') {
      somatotype = 'meso_endomorph';
    } else {
      somatotype = 'ecto_mesomorph';
    }
  }

  // 3. Head-to-Height Ratio (Lysippian / Webtoon hero: 7.5 to 8.6)
  let headHeightRatio = sliders?.headHeightRatio;
  if (headHeightRatio === undefined) {
    headHeightRatio = (archetype === 'hyper_muscular_hero' || archetype === 'slender_elegant')
      ? prng.floatInRange(8.2, 8.6)
      : prng.floatInRange(7.6, 8.2);
  }

  // 4. Muscle Definition & Level
  let muscleDef: MuscleDefinitionDiscrete = sliders?.muscularityDiscrete ?? 'athletic';
  let muscularityLevel = sliders?.muscularitySlider;

  if (muscularityLevel === undefined) {
    if (sliders?.muscularityDiscrete) {
      const map: Record<MuscleDefinitionDiscrete, number> = {
        soft: 0.18,
        toned: 0.38,
        athletic: 0.58,
        ripped: 0.78,
        shredded: 0.94
      };
      muscularityLevel = map[sliders.muscularityDiscrete];
    } else {
      switch (archetype) {
        case 'hyper_muscular_hero':
          muscleDef = 'ripped';
          muscularityLevel = prng.floatInRange(0.78, 0.88);
          break;
        case 'lean_athletic':
          muscleDef = 'toned';
          muscularityLevel = prng.floatInRange(0.35, 0.50);
          break;
        case 'voluptuous_curvaceous':
          muscleDef = 'soft';
          muscularityLevel = prng.floatInRange(0.20, 0.35);
          break;
        case 'soft_athletic':
          muscleDef = 'toned';
          muscularityLevel = prng.floatInRange(0.32, 0.45);
          break;
        case 'slender_elegant':
          muscleDef = 'soft';
          muscularityLevel = prng.floatInRange(0.15, 0.28);
          break;
        case 'stocky_powerhouse':
          muscleDef = 'athletic';
          muscularityLevel = prng.floatInRange(0.60, 0.75);
          break;
        default:
          muscleDef = 'athletic';
          muscularityLevel = prng.floatInRange(0.45, 0.60);
      }
    }
  } else {
    // Derive discrete from continuous slider
    if (muscularityLevel < 0.25) muscleDef = 'soft';
    else if (muscularityLevel < 0.48) muscleDef = 'toned';
    else if (muscularityLevel < 0.70) muscleDef = 'athletic';
    else if (muscularityLevel < 0.88) muscleDef = 'ripped';
    else muscleDef = 'shredded';
  }

  // 5. V-Taper & Vascularity
  let vTaperScore = sliders?.vTaperScore;
  if (vTaperScore === undefined) {
    vTaperScore = gender === 'male'
      ? (muscleDef === 'ripped' || muscleDef === 'shredded' ? prng.floatInRange(0.80, 0.95) : prng.floatInRange(0.60, 0.78))
      : prng.floatInRange(0.20, 0.45);
  }

  let vascularity: VascularityLevel = sliders?.vascularity ?? 'none';
  if (!sliders?.vascularity) {
    if (muscleDef === 'shredded') vascularity = 'extreme_striated';
    else if (muscleDef === 'ripped') vascularity = 'prominent_arms';
    else if (muscleDef === 'athletic') vascularity = 'subtle_forearms';
    else vascularity = 'none';
  }

  // 6. WHR (Waist to Hip) & SHR (Shoulder to Hip)
  let whr = sliders?.waistToHipRatio;
  if (whr === undefined) {
    if (gender === 'female') {
      whr = archetype === 'voluptuous_curvaceous' ? prng.floatInRange(0.64, 0.68) : prng.floatInRange(0.67, 0.71);
    } else if (gender === 'male') {
      whr = prng.floatInRange(0.82, 0.88);
    } else {
      whr = prng.floatInRange(0.74, 0.80);
    }
  }

  let shr = sliders?.shoulderToHipRatio;
  if (shr === undefined) {
    if (gender === 'male') {
      shr = archetype === 'hyper_muscular_hero' ? prng.floatInRange(1.50, 1.65) : prng.floatInRange(1.38, 1.48);
    } else {
      shr = prng.floatInRange(1.02, 1.15);
    }
  }

  // 7. Bust Volume & Galbe Curvature
  let bustVolume = sliders?.bustVolumeSlider;
  if (bustVolume === undefined) {
    if (gender === 'female') {
      bustVolume = archetype === 'voluptuous_curvaceous' ? prng.floatInRange(0.75, 0.90) : prng.floatInRange(0.40, 0.60);
    } else {
      bustVolume = muscularityLevel * 0.7; // pectoral fullness in males
    }
  }

  let galbe = sliders?.galbeSlider;
  if (galbe === undefined) {
    if (gender === 'female') {
      galbe = archetype === 'voluptuous_curvaceous' ? prng.floatInRange(0.75, 0.92) : prng.floatInRange(0.48, 0.68);
    } else {
      galbe = prng.floatInRange(0.35, 0.58); // athletic male glute development
    }
  }

  // 8. Circumferences calculation based on height, WHR, SHR, bust, and muscles
  let waistCirc = gender === 'female' ? Math.round(62 + (1 - whr) * 10 + (bustVolume * 4)) : Math.round(76 + (muscularityLevel * 6));
  let hipCirc = Math.round(waistCirc / whr);
  let chestCirc = gender === 'female'
    ? Math.round(waistCirc + (bustVolume * 30) + 12)
    : Math.round(waistCirc * (shr * 0.85));

  const chestToWaistRatio = Number((chestCirc / waistCirc).toFixed(2));

  // 9. Weight & Body Fat estimation
  let bodyFatPct = 14;
  if (gender === 'female') {
    bodyFatPct = muscleDef === 'shredded' ? 12 : (muscleDef === 'ripped' ? 16 : (muscleDef === 'athletic' ? 19 : 23));
  } else {
    bodyFatPct = muscleDef === 'shredded' ? 6 : (muscleDef === 'ripped' ? 8.5 : (muscleDef === 'athletic' ? 12 : 15));
  }

  const heightM = heightCm / 100;
  let targetBMI = 21.5;
  if (gender === 'male') {
    targetBMI = 22 + (muscularityLevel * 5.5);
  } else {
    targetBMI = 20 + (bustVolume * 2.0) + (muscularityLevel * 2.0);
  }
  const weightKg = Math.round(targetBMI * (heightM * heightM));

  const bodyFatCategory = bodyFatPct <= 9
    ? 'ultra_lean'
    : (bodyFatPct <= 18 ? 'athletic_toned' : (bodyFatPct <= 24 ? 'soft_athletic' : 'full_figured'));

  // 10. Generate uncensored natural curve descriptions
  const anatomicalFeatures = generateUncensoredCurves(gender, muscleDef, muscularityLevel, bustVolume, galbe, whr, shr, vascularity);

  return {
    heightCm,
    weightKg,
    somatotype,
    headHeightRatio: Number(headHeightRatio.toFixed(2)),
    waistToHipRatio: Number(whr.toFixed(2)),
    shoulderToHipRatio: Number(shr.toFixed(2)),
    chestToWaistRatio,
    chestCircumferenceCm: chestCirc,
    waistCircumferenceCm: waistCirc,
    hipCircumferenceCm: hipCirc,
    muscleDefinition: muscleDef,
    muscularityLevel: Number(muscularityLevel.toFixed(2)),
    vTaperScore: Number(vTaperScore.toFixed(2)),
    vascularity,
    bustVolume: Number(bustVolume.toFixed(2)),
    galbeCurvature: Number(galbe.toFixed(2)),
    bodyFatPercentage: bodyFatPct,
    bodyFatCategory,
    anatomicalFeatures
  };
}

function generateUncensoredCurves(
  gender: GenderIdentity,
  muscleDef: MuscleDefinitionDiscrete,
  muscleLevel: number,
  bust: number,
  galbe: number,
  whr: number,
  shr: number,
  vascularity: VascularityLevel
): UncensoredNaturalCurves {
  if (gender === 'female') {
    return {
      bustChestDescription: `Authentic natural breast anatomy with realistic teardrop gravitational drape (volume index ${(bust * 10).toFixed(1)}/10), unconstrained physiological weight distribution without rigid spherical deformation, visible clavicular notch, soft sternal valley, and subtle thoracic ribcage sweep.`,
      waistAbdomenDescription: `Tapered waistline with natural subcutaneous soft tissue over iliac crests (WHR ${whr.toFixed(2)}), ${muscleLevel > 0.4 ? 'subtle linea alba and toned external oblique transitions' : 'smooth feminine abdominal contour with soft umbilical depression'}.`,
      hipGluteDescription: `Pronounced lateral pelvic curvature with authentic gynoid shelf (galbe ${(galbe * 10).toFixed(1)}/10), smooth transition into gluteus medius and natural sub-gluteal fold without artificial truncation, full natural hip curve matching evolutionary biometric optimum.`,
      legsCalvesDescription: `Long sculpted legs with organic thigh adductor contours, gentle quadriceps curvature, slender knee joint definition, and tapered gastrocnemius calves leading to slender malleolus ankles.`,
      backShouldersDescription: `Elegant upper back with defined scapular blades, smooth trapezius slope, subtle vertebral furrow along lumbar spine leading to natural sacral dimples (Fossae of Venus).`,
      handsFeetDescription: `Slender delicate hands with elongated phalanges, clean nail beds, subtle dorsal tendon articulation, and high-arched slender feet with natural instep curve.`
    };
  }

  if (gender === 'male') {
    return {
      bustChestDescription: `Chiseled pectoral plate architecture with defined lower sternal border and clavicular head separation, square athletic thoracic width (${shr.toFixed(2)} SHR), ${muscleLevel >= 0.7 ? 'striated muscle fibers across sternum' : 'dense masculine pectoral fullness'}.`,
      waistAbdomenDescription: `Narrow athletic waist tapering into iliac crests, ${muscleDef === 'ripped' || muscleDef === 'shredded' ? 'deep chiseled 8-pack rectus abdominis, interdigitating serratus anterior ribs, and pronounced inguinal crease (Adonis belt)' : 'toned flat abdominal wall with distinct midline definition'}.`,
      hipGluteDescription: `Powerful athletic android pelvic structure, dense gluteus maximus shelf (galbe ${(galbe * 10).toFixed(1)}/10) supporting explosive functional posture, firm lateral hip taper.`,
      legsCalvesDescription: `Powerful muscular lower limbs, teardrop vastus medialis hypertrophy above patella, separated hamstring bicep femoris bellies, and diamond-sculpted gastrocnemius calves with visible Achilles tendon anchor.`,
      backShouldersDescription: `Imposing V-taper latissimus dorsi flared out like wings (${(shr * 10).toFixed(1)} SHR), ${muscleLevel >= 0.75 ? 'intricate Christmas-tree demon back featuring sculpted rhomboids, teres major, and spinal erectors' : 'broad masculine back with wide clavicles and strong deltoids'}.`,
      handsFeetDescription: `Large capable hands with vascular dorsal veins (${vascularity}), strong metacarpal articulation, defined knuckles, and broad stable athletic feet.`
    };
  }

  return {
    bustChestDescription: `Harmonious balanced thoracic structure blending sculpted pectoral firmness with graceful clavicular flow.`,
    waistAbdomenDescription: `Slender athletic waistline with subtle oblique contours and smooth abdominal tone.`,
    hipGluteDescription: `Refined pelvic taper with toned functional gluteal curvature and graceful hip transitions.`,
    legsCalvesDescription: `Elongated statuesque leg proportions with balanced thigh and calf contours.`,
    backShouldersDescription: `Supple back architecture with elegant scapular definition and moderate V-taper.`,
    handsFeetDescription: `Long artistic fingers with delicate yet firm articulation and slender wrists.`
  };
}

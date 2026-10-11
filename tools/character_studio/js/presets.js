/**
 * Iconic Character Preset Library for GLM Character Studio.
 * Fully pre-loaded character templates matching corpus aesthetics.
 */

export const PRESETS = {
  hunter_protagonist: {
    id: 'hunter_protagonist',
    name: 'Kang Jin-Hyuk',
    alias: 'The Shadow Sovereign',
    role: 'S-Rank Monarch & Shadow Infiltrator',
    gender: 'male',
    age: 24,
    heightCm: 188,
    somatotype: 'mesomorph',
    whr: 0.83,
    vTaper: 1.62,
    muscularity: 0.86,
    galbe: 0.45,
    vascularity: 0.72,
    bustVolume: 0.38,
    canthalTilt: 6.5,
    mandibularAngle: 113,
    facialSymmetry: 0.98,
    cheekbones: 0.82,
    style: 'webtoon_action',
    wardrobe: 'techwear',
    wardrobeMode: 'duty',
    colors: {
      primary: '#0f111a',
      secondary: '#1e1b4b',
      accent: '#00e5ff',
      skin: '#fbebe0',
      hair: '#09090b',
      eyes: '#00f0ff'
    },
    backstory: 'Awakened S-Rank necromancer hunter with towering 188cm stature, razor-sharp jawline, glowing cerulean gaze, and chiseled demon-back musculature.'
  },

  k_streetwear_heroine: {
    id: 'k_streetwear_heroine',
    name: 'Min Sora',
    alias: 'Neon Phantom',
    role: 'Urban Traceur & Cyber Calligrapher',
    gender: 'female',
    age: 21,
    heightCm: 172,
    somatotype: 'ecto_mesomorph',
    whr: 0.68,
    vTaper: 1.10,
    muscularity: 0.38,
    galbe: 0.74,
    vascularity: 0.05,
    bustVolume: 0.62,
    canthalTilt: 5.2,
    mandibularAngle: 128,
    facialSymmetry: 0.99,
    cheekbones: 0.65,
    style: 'modern_anime',
    wardrobe: 'k_streetwear',
    wardrobeMode: 'private',
    colors: {
      primary: '#7c3aed',
      secondary: '#0f172a',
      accent: '#ec4899',
      skin: '#ffe4d6',
      hair: '#c084fc',
      eyes: '#f59e0b'
    },
    backstory: 'High-agility courier in neo-Seoul, rocking an oversized pastel hoodie, wide cargo pants, silver chains, and magnetic feline cat-eye gaze.'
  },

  techwear_operative: {
    id: 'techwear_operative',
    name: 'Alexei Vance',
    alias: 'Specter-9',
    role: 'Deep Recon Specialist & Signal Interceptor',
    gender: 'androgynous',
    age: 28,
    heightCm: 182,
    somatotype: 'mesomorph',
    whr: 0.84,
    vTaper: 1.48,
    muscularity: 0.68,
    galbe: 0.50,
    vascularity: 0.45,
    bustVolume: 0.40,
    canthalTilt: 3.5,
    mandibularAngle: 118,
    facialSymmetry: 0.96,
    cheekbones: 0.75,
    style: 'detailed_seinen',
    wardrobe: 'techwear',
    wardrobeMode: 'duty',
    colors: {
      primary: '#18181b',
      secondary: '#2e3b2b',
      accent: '#f97316',
      skin: '#f3d5b5',
      hair: '#18181b',
      eyes: '#94a3b8'
    },
    backstory: 'Black-budget field operative equipped with waterproof shells, Fidlock load-bearing harnesses, and cold focused situational awareness.'
  },

  martial_artist: {
    id: 'martial_artist',
    name: 'Li Wei',
    alias: 'Iron Crane',
    role: 'Grandmaster Disciple & Unarmed Duelist',
    gender: 'male',
    age: 26,
    heightCm: 178,
    somatotype: 'mesomorph',
    whr: 0.81,
    vTaper: 1.54,
    muscularity: 0.92,
    galbe: 0.48,
    vascularity: 0.84,
    bustVolume: 0.45,
    canthalTilt: 4.5,
    mandibularAngle: 115,
    facialSymmetry: 0.97,
    cheekbones: 0.88,
    style: 'semi_realistic',
    wardrobe: 'martial',
    wardrobeMode: 'duty',
    colors: {
      primary: '#e5dec9',
      secondary: '#881337',
      accent: '#059669',
      skin: '#dfa675',
      hair: '#0a0a0a',
      eyes: '#451a03'
    },
    backstory: 'Ascetic inner-gate martial artist with wiry, dense serratus striations, wrapped combat forearms, and a piercing disciplined gaze.'
  },

  matron_scientist: {
    id: 'matron_scientist',
    name: 'Dr. Elena Rostova',
    alias: 'The Architect',
    role: 'Chief Biometric Geneticist & Directorate Chair',
    gender: 'female',
    age: 36,
    heightCm: 175,
    somatotype: 'endo_mesomorph',
    whr: 0.66,
    vTaper: 1.05,
    muscularity: 0.32,
    galbe: 0.82,
    vascularity: 0.0,
    bustVolume: 0.78,
    canthalTilt: 3.0,
    mandibularAngle: 126,
    facialSymmetry: 0.99,
    cheekbones: 0.78,
    style: 'semi_realistic',
    wardrobe: 'classic_tailoring',
    wardrobeMode: 'private',
    colors: {
      primary: '#f8fafc',
      secondary: '#064e3b',
      accent: '#d97706',
      skin: '#fde8db',
      hair: '#713f12',
      eyes: '#4d7c0f'
    },
    backstory: 'Distinguished researcher with voluptuous natural hourglass proportions, wearing a tailored silk blouse beneath an open lab coat with tortoiseshell spectacles.'
  }
};

/**
 * Returns a cloned copy of the requested preset by ID.
 * @param {string} id
 */
export function getPreset(id) {
  const p = PRESETS[id];
  if (!p) return null;
  return JSON.parse(JSON.stringify(p));
}

/**
 * Returns an array of all available presets for UI selectors.
 */
export function getAllPresets() {
  return Object.values(PRESETS);
}

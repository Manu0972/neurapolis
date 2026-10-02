/**
 * NEURAPOLIS — Palette Officielle 28 Couleurs & Tokens de Rendu 2.5D.
 *
 * Conforme à la doctrine artistique :
 * - Zéro noir pur (#000000) : contours en brun torréfié chaud OUTLINE (#2a1a14).
 * - Température lumineuse Hygge ~1800K (lumière de bougie / coucher de soleil doré).
 * - Hue shifting systématique sur 3 tons : Ombre Froide -> Base Médiane -> Lumière Chaude.
 * - Papier kraft, bois chaleureux et contrastes d'ombres froides violettes/indigo.
 */

/* ── Constantes Fondamentales ─────────────────────────────────── */

/** Contour universel remplaçant le noir pur sur tous les sprites et encrages. */
export const OUTLINE = '#2a1a14';

/** Lumière chaude 1800K (doré ambré chaleureux pour fenêtres, lanternes et reflets). */
export const HYGGE_1800K = '#ffd98a';

/** Lumière chaude éclatante / zénith d'accentuation. */
export const HYGGE_LIGHT = '#ffe2a8';

/** Ombre froide violette profonde (pour ombres portées au sol et teintes nocturnes). */
export const SHADOW_COOL = '#2c2540';

/** Fond diégétique en papier kraft naturel recyclé. */
export const KRAFT_BG = '#e8d6b0';

/** Bois d'atelier et menuiserie chaleureuse (chêne patiné). */
export const WOOD_WARM = '#8a5a3a';

/** Ivoire doux pour texte diégétique et reflets chauds sans blanc pur. */
export const INK_WARM = '#f9ecd0';

/* ── Définition des Rampes à 3 Tons (Ombre / Base / Lumière) ──── */

export interface ColorRamp {
  readonly shadow: string;
  readonly base: string;
  readonly light: string;
}

export const PALETTE_RAMPS = {
  // Peau humaine claire (Camille, Noah, Lina)
  skinLight: {
    shadow: '#cf8f74',
    base: '#ffc496',
    light: '#ffd9b0',
  },
  // Peau humaine chaude (Samir, Karim, diversité du quartier)
  skinWarm: {
    shadow: '#8a5238',
    base: '#b47a56',
    light: '#d19a72',
  },
  // Cheveux châtains & cuirs bruns
  hairBrown: {
    shadow: '#4a3220',
    base: '#6b4a2f',
    light: '#8a6240',
  },
  // Cheveux sombres / velours profond
  hairDark: {
    shadow: '#2c2230',
    base: '#4a3220',
    light: '#6b4a2f',
  },
  // Tissu corail / rouge terracotta (vêtements Camille, auvents, tuiles chaudes)
  coral: {
    shadow: '#c25a40',
    base: '#f48c5d',
    light: '#ffb08a',
  },
  // Tissu bleu ouvrier & denim (vestes collège, pantalons, bleus de travail)
  denim: {
    shadow: '#243250',
    base: '#4a5a7a',
    light: '#6b7fa0',
  },
  // Végétation, parcs & herbes folles
  foliage: {
    shadow: '#257179',
    base: '#38b764',
    light: '#a7f070',
  },
  // Bois brut, établis d'artisan & mobilier urbain
  wood: {
    shadow: '#4a3424',
    base: '#8a5a3a',
    light: '#d8a878',
  },
  // Eau du canal, reflets & ciel azur
  water: {
    shadow: '#223852',
    base: '#41a6f6',
    light: '#73eff7',
  },
  // Façades en pierre calcaire & crépi ancien de Val-Ferrand
  wallPlaster: {
    shadow: '#cfa97f',
    base: '#efd9ac',
    light: '#f9ecd0',
  },
  // Briques rouges industrielles & toitures en tuiles
  brickRoof: {
    shadow: '#8f3a34',
    base: '#c15f4a',
    light: '#d97a5f',
  },
  // Papier kraft & lin UI
  kraft: {
    shadow: '#b79f76',
    base: '#d8c49a',
    light: '#e8d6b0',
  },
  // Métal, ferronnerie & outillage
  metal: {
    shadow: '#454a59',
    base: '#7b8499',
    light: '#b8c3d9',
  },
} as const;

/* ── Liste Canonique des 28 Couleurs Hue-Shiftées ─────────────── */

export const NEURAPOLIS_28_COLORS: readonly string[] = [
  '#2a1a14', // 01. Contour universel (brun torréfié sans noir pur)
  '#cf8f74', // 02. Peau claire - ombre
  '#ffc496', // 03. Peau claire - base
  '#ffd9b0', // 04. Peau claire - lumière
  '#8a5238', // 05. Peau chaude - ombre
  '#b47a56', // 06. Peau chaude - base
  '#d19a72', // 07. Peau chaude - lumière
  '#4a3220', // 08. Cheveux / cuir - ombre
  '#6b4a2f', // 09. Cheveux / cuir - base
  '#8a6240', // 10. Cheveux / cuir - lumière
  '#c25a40', // 11. Corail / terracotta - ombre
  '#f48c5d', // 12. Corail / terracotta - base
  '#ffb08a', // 13. Corail / terracotta - lumière
  '#243250', // 14. Denim / bleu ouvrier - ombre
  '#4a5a7a', // 15. Denim / bleu ouvrier - base
  '#6b7fa0', // 16. Denim / bleu ouvrier - lumière
  '#257179', // 17. Végétation canard - ombre
  '#38b764', // 18. Végétation herbe - base
  '#a7f070', // 19. Végétation jeune pousse - lumière
  '#4a3424', // 20. Bois chêne - ombre
  '#8a5a3a', // 21. Bois chêne - base
  '#d8a878', // 22. Bois chêne - lumière
  '#223852', // 23. Eau canal profond - ombre
  '#41a6f6', // 24. Eau canal miroitement - base
  '#73eff7', // 25. Eau canal écume - lumière
  '#cfa97f', // 26. Crépi calcaire - ombre
  '#efd9ac', // 27. Crépi calcaire - base
  '#ffd98a', // 28. Lumière Hygge 1800K
] as const;

/** Couleurs d'ambiance et UI auxiliaires harmonisées */
export const AUXILIARY_COLORS = {
  ink: '#f9ecd0',
  inkDim: '#c8b9a0',
  shadowCool: '#2c2540',
  nightSky: '#1c2a4a',
  kraftShadow: '#b79f76',
  kraftBase: '#d8c49a',
  kraftLight: '#e8d6b0',
  brickShadow: '#8f3a34',
  brickBase: '#c15f4a',
  brickLight: '#d97a5f',
  metalShadow: '#454a59',
  metalBase: '#7b8499',
  metalLight: '#b8c3d9',
  hyggeLight: '#ffe2a8',
} as const;

/* ── Fonctions Utilitaires Chromatiques ───────────────────────── */

/** Convertit une couleur hexadécimale 6 caractères (#rrggbb) en triplet RGB. */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Convertit un triplet RGB en hexadécimal (#rrggbb). */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Mélange déterministe de deux couleurs avec facteur t in [0, 1].
 */
export function mixColors(hexA: string, hexB: string, t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const [rA, gA, bA] = hexToRgb(hexA);
  const [rB, gB, bB] = hexToRgb(hexB);
  return rgbToHex(
    rA + (rB - rA) * clampedT,
    gA + (gB - gA) * clampedT,
    bA + (bB - bA) * clampedT,
  );
}

/**
 * Applique le hue shifting Hygge 1800K sur une couleur de base :
 * - Si facteur d'ombre (< 0) : tire vers le violet froid (#2c2540).
 * - Si facteur de lumière (> 0) : tire vers l'ambre chaud 1800K (#ffd98a).
 */
export function shadeHygge(hex: string, intensity: number): string {
  if (intensity < 0) {
    return mixColors(hex, SHADOW_COOL, Math.min(1, Math.abs(intensity)));
  }
  return mixColors(hex, HYGGE_1800K, Math.min(1, intensity));
}

/**
 * Vérifie formellement qu'aucune valeur de couleur n'est un noir pur interdit (#000 / #000000).
 */
export function isForbiddenBlack(hex: string): boolean {
  const normalized = hex.trim().toLowerCase();
  return (
    normalized === '#000' ||
    normalized === '#000000' ||
    normalized === 'black' ||
    normalized === 'rgb(0,0,0)' ||
    normalized === 'rgba(0,0,0,1)'
  );
}

/**
 * Vérifie si une chaîne hexadécimale est présente dans le référentiel des 28 couleurs ou auxiliaires.
 */
export function isKnownPaletteColor(hex: string): boolean {
  const norm = hex.trim().toLowerCase();
  if (NEURAPOLIS_28_COLORS.some((c) => c.toLowerCase() === norm)) return true;
  return Object.values(AUXILIARY_COLORS).some((c) => c.toLowerCase() === norm);
}

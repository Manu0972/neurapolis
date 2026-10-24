/**
 * Recolorage des modèles riggés — logique pure (sans Three.js ni DOM, donc testable).
 *
 * Les modèles du studio n'ont qu'un seul matériau et une seule texture peinte : il n'existe ni
 * matériau nommé ni masque. On reconstruit donc un masque à partir de deux indices :
 *  - la zone du corps où se trouve chaque triangle (tête, torse, reste) d'après sa position ;
 *  - la couleur du texel : proche du teint relevé sur le visage → peau.
 * Résultat : peau (visage, mains, jambes nues), cheveux (arrière et dessus de la tête, hors
 * peau), haut de tenue (torse et manches), bas (jambes) et chaussures (pieds), hors peau.
 * Ce n'est PAS un masque dessiné à la main : les bords peuvent déborder un peu, et les yeux et la
 * bouche ne sont pas recolorés.
 */

export type RigZone = 'fond' | 'cheveux' | 'visage' | 'torse' | 'jambes' | 'pieds';
export const ZONE_CODE: Record<RigZone, number> = { fond: 0, cheveux: 1, visage: 2, torse: 3, jambes: 4, pieds: 5 };
/** Zones dans l'ordre de leur code (lecture du masque de zones). */
export const ZONE_NAMES: readonly RigZone[] = ['fond', 'cheveux', 'visage', 'torse', 'jambes', 'pieds'];
/** Hauteur relative sous laquelle on est dans les chaussures (cheville des modèles UAL ≈ 0,05). */
export const FEET_TOP = 0.062;

/** Bas de la tête (part de la hauteur) d'un modèle aux proportions courantes. */
export const HEAD_FROM = 0.865;

/**
 * Bas de la tête d'après le cou mesuré sur le squelette (part de la hauteur, recalé pour les rigs à
 * grosse tête, voir `fitBody`) : les modèles d'enfants et d'ados ont la tête bien plus grande que les
 * proportions courantes `HEAD_FROM`, qui coupaient leur visage en deux. Hors plage : `HEAD_FROM`.
 */
export function headFromNeck(neckRel: number | undefined): number {
  return neckRel !== undefined && neckRel > 0.55 && neckRel < 0.9 ? Math.min(HEAD_FROM, neckRel + 0.01) : HEAD_FROM;
}

/**
 * Zone d'un triangle d'après son centre. `y` : hauteur relative (0 pieds, 1 sommet du crâne),
 * `zFront` : avance vers l'avant du modèle par rapport au centre de la tête, en part de la hauteur.
 */
export function zoneOf(y: number, zFront: number, headFrom = HEAD_FROM): RigZone {
  if (y > headFrom) {
    if (y > 0.955 || zFront < 0.012) return 'cheveux';
    return 'visage';
  }
  if (y >= 0.5) return 'torse';
  if (y >= FEET_TOP) return 'jambes';
  return 'pieds';
}

export type Rgb = readonly [number, number, number];

/** Distance (0 à ~1,7) entre deux couleurs RGB 0-1. */
export function colorDistance(a: Rgb, b: Rgb): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Seuil de ressemblance au teint du visage pour compter comme peau. */
export const SKIN_MATCH = 0.2;

/** Région recolorable d'un texel (au plus une). */
export type RecolorRegion = 'skin' | 'hair' | 'outfit' | 'bottom' | 'shoes';
/** Ordre des régions dans le shader (canaux des deux masques). */
export const REGIONS: readonly RecolorRegion[] = ['skin', 'hair', 'outfit', 'bottom', 'shoes'];

export interface TexelLabel { skin: boolean; hair: boolean; outfit: boolean; bottom: boolean; shoes: boolean }

/** Couleur candidate au teint : chaude et plausible pour une peau, de très claire à très foncée. */
export function skinCandidate(c: Rgb): boolean {
  const [r, g, b] = c;
  return r > g && g >= b * 0.9 && r - b > 0.05 && r - b < 0.6 && r > 0.2;
}

/**
 * Teint de référence d'un visage : la couleur candidate la plus fréquente, affinée par la moyenne de
 * ses voisines (et non la moyenne de toutes, que faussaient mèches claires, bijoux ou col).
 * `null` s'il y a trop peu de candidates.
 */
export function skinReference(cands: readonly Rgb[]): Rgb | null {
  if (cands.length < 50) return null;
  const key = (c: Rgb): number => (Math.min(15, Math.floor(c[0] * 16)) << 8) | (Math.min(15, Math.floor(c[1] * 16)) << 4) | Math.min(15, Math.floor(c[2] * 16));
  const bins = new Map<number, number>();
  let best = 0;
  let bn = 0;
  for (const c of cands) {
    const k = key(c);
    const n = (bins.get(k) ?? 0) + 1;
    bins.set(k, n);
    if (n > bn) { bn = n; best = k; }
  }
  const center: Rgb = [((best >> 8) + 0.5) / 16, (((best >> 4) & 15) + 0.5) / 16, ((best & 15) + 0.5) / 16];
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const c of cands) if (colorDistance(c, center) < 0.12) { r += c[0]; g += c[1]; b += c[2]; n++; }
  return n > 0 ? [r / n, g / n, b / n] : center;
}

/**
 * Texel de peau : proche du teint relevé ET de teinte chaude comme lui. Sans ce second critère, sur
 * un modèle à peau foncée, les vêtements noirs ou gris (proches en distance) passaient pour de la peau.
 */
export function isSkinLike(color: Rgb, skinRef: Rgb): boolean {
  if (colorDistance(color, skinRef) >= SKIN_MATCH) return false;
  const warm = color[0] - color[2];
  return color[0] >= color[1] && warm > 0.025 && warm >= 0.35 * (skinRef[0] - skinRef[2]);
}

/** Région d'un texel selon sa zone et sa ressemblance avec le teint relevé sur le visage. */
export function regionOf(zone: RigZone, color: Rgb, skinRef: Rgb): RecolorRegion | null {
  if (zone === 'fond') return null;
  if (isSkinLike(color, skinRef)) return 'skin';
  if (zone === 'cheveux') return 'hair';
  if (zone === 'torse') return 'outfit';
  if (zone === 'jambes') return 'bottom';
  if (zone === 'pieds') return 'shoes';
  return null;
}

/** Étiquette d'un texel (forme développée de `regionOf`). */
export function labelTexel(zone: RigZone, color: Rgb, skinRef: Rgb): TexelLabel {
  const r = regionOf(zone, color, skinRef);
  return { skin: r === 'skin', hair: r === 'hair', outfit: r === 'outfit', bottom: r === 'bottom', shoes: r === 'shoes' };
}

/** Luminance (approximation linéaire d'une couleur sRGB 0-1). */
export function luminance(c: Rgb): number {
  const l = (v: number): number => Math.pow(Math.max(0, Math.min(1, v)), 2.2);
  return 0.2126 * l(c[0]) + 0.7152 * l(c[1]) + 0.0722 * l(c[2]);
}

/** Convertit `#rrggbb` en RGB 0-1 (gris moyen si invalide). */
export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.5, 0.5, 0.5];
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Demande de recolorage : chaque champ est facultatif (absent = couleur d'origine du modèle). */
export interface RecolorSpec {
  skin?: string;
  hair?: string;
  outfit?: string;
  /** Bas (pantalon, jupe). */
  bottom?: string;
  shoes?: string;
}

export function recolorKey(r: RecolorSpec | undefined): string {
  return r ? REGIONS.map((k) => r[k] ?? '').join('|') : '';
}

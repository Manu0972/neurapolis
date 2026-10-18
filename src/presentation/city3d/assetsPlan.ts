/**
 * Ressources libres (CC0) de la ville : logique pure, sans Three.js ni DOM (testée à part).
 * - choix déterministe d'un modèle Kenney par lot (graine + position) ;
 * - mise à l'échelle d'un modèle dans une emprise au sol (1 unité = 1 m) ;
 * - variation des textures Poly Haven par bloc de 128 m (décalage, miroir) contre la répétition ;
 * - plan du décor lointain (ceinture d'immeubles bas autour de la carte, tours à l'horizon).
 */

/** Maisons de banlieue (City Kit Suburban) aux proportions proches d'un pavillon de 9 × 8 m. */
export const SUBURBAN_HOUSES = [
  'building-type-a', 'building-type-c', 'building-type-e', 'building-type-i',
  'building-type-o', 'building-type-p', 'building-type-s', 'building-type-u',
] as const;

/** Immeubles simplifiés (City Kit Commercial, ~100-500 sommets) pour la ceinture lointaine. */
export const LOW_DETAIL_BUILDINGS = [
  'low-detail-building-a', 'low-detail-building-b', 'low-detail-building-c', 'low-detail-building-d',
  'low-detail-building-e', 'low-detail-building-f', 'low-detail-building-g', 'low-detail-building-h',
  'low-detail-building-i', 'low-detail-building-j', 'low-detail-building-l', 'low-detail-building-m',
  'low-detail-building-wide-a', 'low-detail-building-wide-b',
] as const;

/** Tours et grands immeubles pour la silhouette de l'horizon (la ville voisine, au loin). */
export const SKYLINE_TOWERS = [
  'building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c', 'building-skyscraper-d',
  'building-skyscraper-e', 'building-l', 'building-m',
] as const;

/** Hachage entier déterministe (32 bits) de quelques entiers. */
export function hashInts(...v: number[]): number {
  let h = 0x811c9dc5;
  for (const x of v) {
    h ^= Math.floor(x) | 0;
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
  }
  return h >>> 0;
}

/** Réel déterministe dans [0, 1[. */
export function hash01(...v: number[]): number {
  return hashInts(...v) / 4294967296;
}

/**
 * Modèle d'un lot : même graine et même position → même modèle, quelle que soit la session.
 * `available` permet un repli : si le modèle tiré manque (échec de chargement), on retire
 * parmi ceux qui restent, toujours de façon déterministe.
 */
export function pickModel<T extends string>(seed: number, x: number, z: number, list: readonly T[], available?: ReadonlySet<string>): T | null {
  const pool = available ? list.filter((m) => available.has(m)) : list;
  if (pool.length === 0) return null;
  return pool[hashInts(seed, x, z) % pool.length]!;
}

export interface Size3 { x: number; y: number; z: number }

/**
 * Échelle uniforme pour qu'un modèle (taille `size`, en unités du modèle) tienne dans une emprise
 * w × d (m), avec une marge relative. Si `quarterTurn`, le modèle est tourné de 90° (x ↔ z).
 */
export function fitScale(size: Size3, w: number, d: number, margin = 0.02, quarterTurn = false): number {
  const sx = quarterTurn ? size.z : size.x;
  const sz = quarterTurn ? size.x : size.z;
  if (sx <= 0 || sz <= 0) return 1;
  return Math.min(w / sx, d / sz) * (1 - margin);
}

export interface TextureVariation {
  /** Décalage des coordonnées de texture (en répétitions, 0-1). */
  du: number;
  dv: number;
  /** Miroir horizontal de la texture. */
  flip: boolean;
}

/** Variation déterministe des sols texturés pour le bloc (i, j) de 128 m. */
export function textureVariation(i: number, j: number, seed = 7): TextureVariation {
  return {
    du: hash01(seed, i, j, 1),
    dv: hash01(seed, i, j, 2),
    flip: hash01(seed, i, j, 3) < 0.5,
  };
}

/** Applique la variation à des coordonnées de texture (u, v). */
export function varyUv(u: number, v: number, t: TextureVariation, period: number): [number, number] {
  return [(t.flip ? -u : u) + t.du * period, v + t.dv * period];
}

export interface Placement {
  model: string;
  x: number;
  z: number;
  /** Cap (radians). */
  ry: number;
  /** Largeur au sol visée (m) et hauteur visée (m). */
  w: number;
  h: number;
}

/** Distance (m) entre le bord de la carte et la seconde ceinture (derrière celle de boîtes, à 30 m). */
export const OUTER_RING = 85;

/**
 * Décor lointain : une seconde ceinture d'immeubles, derrière la ceinture de boîtes pixel art
 * (profondeur, silhouettes variées), et des grappes de tours bien au-delà, à l'est et au nord.
 */
export function skylinePlan(cityW: number, cityH: number, seed = 777): Placement[] {
  const out: Placement[] = [];
  const ring: [number, number, number][] = [];
  const R = OUTER_RING;
  for (let x = -R - 20; x < cityW + R + 20; x += 19) { ring.push([x, -R, 0]); ring.push([x, cityH + R, Math.PI]); }
  for (let z = -R; z < cityH + R; z += 19) { ring.push([-R, z, Math.PI / 2]); ring.push([cityW + R, z, -Math.PI / 2]); }
  for (const [x, z, face] of ring) {
    const r = hash01(seed, x, z, 1);
    out.push({
      model: pickModel(seed, x, z, LOW_DETAIL_BUILDINGS)!,
      x, z,
      // Façade tournée vers la ville, à un quart de tour près.
      ry: face + Math.floor(hash01(seed, x, z, 2) * 2) * Math.PI,
      w: 12 + r * 7,
      h: 16 + hash01(seed, x, z, 3) * 22,
    });
  }
  // Tours : deux grappes, de 120 à 340 m au-delà des bords est et nord (silhouettes dans la brume).
  const clusters: [number, number, number][] = [[cityW + 230, cityH * 0.35, 18], [cityW * 0.6, -230, 14]];
  clusters.forEach(([cx, cz, n], ci) => {
    for (let k = 0; k < n; k++) {
      const a = hash01(seed, ci, k, 4) * Math.PI * 2;
      const rr = 20 + hash01(seed, ci, k, 5) * 60;
      const x = Math.round(cx + Math.cos(a) * rr * 1.4);
      const z = Math.round(cz + Math.sin(a) * rr);
      out.push({
        model: pickModel(seed + ci, x, z, SKYLINE_TOWERS)!,
        x, z,
        ry: Math.floor(hash01(seed, ci, k, 6) * 4) * (Math.PI / 2),
        w: 16 + hash01(seed, ci, k, 7) * 10,
        h: 35 + hash01(seed, ci, k, 8) * 45,
      });
    }
  });
  return out;
}

/** Pavillon générique (lotissement) : remplaçable par une maison de banlieue Kenney. */
export function isGenericHouse(b: { id: string; label?: string; place?: string; unitId?: string; shopfront?: boolean; ruined?: boolean }): boolean {
  return b.id.startsWith('pav_') && !b.label && !b.place && !b.unitId && !b.shopfront && !b.ruined;
}

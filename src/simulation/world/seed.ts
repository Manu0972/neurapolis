/**
 * NEURAPOLIS — Dérivation hiérarchique de graines déterministes.
 *
 * Dérive une graine numérique unique et réductible par chemin (monde → pays → ville → cohorte → individu)
 * à partir de la graine racine du monde et du PRNG mulberry32.
 */

import { mulberry32, rngNext, rngRange, rngInt, rngChance, rngPick } from '../../core/rng';

/** Structure optionnelle représentant un chemin hiérarchique. */
export interface CheminStructure {
  monde?: string;
  pays?: string;
  ville?: string;
  cohorte?: string;
  individu?: string;
  [cle: string]: string | undefined;
}

/** Types acceptés pour définir un chemin hiérarchique. */
export type CheminHierarchique = string | readonly string[] | CheminStructure;

/** Entité ou conteneur possédant une graine (WorldState ou simple option). */
export type SourceGraine = number | { seed?: number };

/** PRNG enrichi avec méthodes utilitaires et état mutable `{ rng: number }`. */
export interface PRNGBorne {
  rng: number;
  readonly graine: number;
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
}

/**
 * Hachage déterministe d'un segment de texte combiné à une graine parente.
 * Utilise une variante FNV-1a mixée avec bit-mixing pour garantir indépendance
 * et diffusion uniforme entre chemins voisins.
 */
export function hashSegment(graineParente: number, segment: string): number {
  let h = (graineParente ^ 0x811c9dc5) | 0;
  for (let i = 0; i < segment.length; i++) {
    h = Math.imul(h ^ segment.charCodeAt(i), 0x01000193);
  }
  // Diffusion/finaliseur bitwise pour éviter la corrélation entre segments voisins
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) | 0;
}

/**
 * Normalise n'importe quel format de chemin hiérarchique en un tableau de segments textuels.
 */
export function normaliserChemin(chemin: CheminHierarchique): string[] {
  if (Array.isArray(chemin)) {
    return chemin.filter((s) => typeof s === 'string' && s.length > 0);
  }

  if (typeof chemin === 'string') {
    return chemin
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  if (typeof chemin === 'object' && chemin !== null) {
    const cs = chemin as CheminStructure;
    const segments: string[] = [];
    const ordreStandard = ['monde', 'pays', 'ville', 'cohorte', 'individu'];

    for (const cle of ordreStandard) {
      const val = cs[cle];
      if (typeof val === 'string' && val.length > 0) {
        segments.push(val);
      }
    }

    // Ajouter toute autre clé personnalisée triée par ordre alphabétique pour la répétabilité
    const clesSuppl = Object.keys(cs)
      .filter((k) => !ordreStandard.includes(k))
      .sort();

    for (const cle of clesSuppl) {
      const val = cs[cle];
      if (typeof val === 'string' && val.length > 0) {
        segments.push(val);
      }
    }

    return segments;
  }

  return [];
}

/** Extraire la valeur numérique d'une source de graine. */
function extraireGraine(source?: SourceGraine): number {
  if (typeof source === 'number') return source | 0;
  if (typeof source === 'object' && source !== null && typeof source.seed === 'number') {
    return source.seed | 0;
  }
  return 20200901; // Graine par défaut du projet
}

/**
 * Calcule la graine dérivée (entier 32 bits) pour un chemin donné et une graine racine.
 */
export function deriverGraine(chemin: CheminHierarchique, sourceGraine?: SourceGraine): number {
  const graineRacine = extraireGraine(sourceGraine);
  const segments = normaliserChemin(chemin);

  let graineCourante = graineRacine;
  for (let i = 0; i < segments.length; i++) {
    graineCourante = hashSegment(graineCourante, segments[i]!);
  }

  return graineCourante | 0;
}

/**
 * Génère une instance déterministe du PRNG du projet pour un chemin hiérarchique.
 *
 * @param chemin Le chemin (ex: 'monde/pays/ville/cohorte/individu' ou `['monde', 'pays', ...]`)
 * @param sourceGraine La graine racine (nombre ou objet style WorldState avec `.seed`)
 */
export function rngPour(chemin: CheminHierarchique, sourceGraine?: SourceGraine): PRNGBorne {
  const graineDerivee = deriverGraine(chemin, sourceGraine);
  const state = mulberry32(graineDerivee);

  const prng: PRNGBorne = {
    get rng() {
      return state.rng;
    },
    set rng(val: number) {
      state.rng = val;
    },
    graine: graineDerivee,
    next() {
      return rngNext(state);
    },
    range(min: number, max: number) {
      return rngRange(state, min, max);
    },
    int(min: number, max: number) {
      return rngInt(state, min, max);
    },
    chance(p: number) {
      return rngChance(state, p);
    },
    pick<T>(arr: readonly T[]): T {
      return rngPick(state, arr);
    },
  };

  return prng;
}

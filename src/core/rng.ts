/**
 * PRNG déterministe mulberry32 — l'état vit dans WorldState.rng, jamais global :
 * même seed + mêmes actions ⇒ même partie (tests, reproductibilité, débogage).
 */

/** Avance l'état et renvoie un float ∈ [0,1). */
export function rngNext(state: { rng: number }): number {
  let t = (state.rng = (state.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function rngRange(state: { rng: number }, min: number, max: number): number {
  return min + rngNext(state) * (max - min);
}

export function rngInt(state: { rng: number }, min: number, max: number): number {
  return Math.floor(rngRange(state, min, max + 1));
}

export function rngChance(state: { rng: number }, p: number): boolean {
  return rngNext(state) < p;
}

export function rngPick<T>(state: { rng: number }, arr: readonly T[]): T {
  return arr[rngInt(state, 0, arr.length - 1)] as T;
}

/** Seed initiale simple et stable depuis un entier quelconque. */
export function makeSeed(n: number): number {
  return (n ^ 0x9e3779b9) | 0;
}

/** Factory mulberry32 créant un état PRNG déterministe encapsulé */
export function mulberry32(seed: number): { rng: number } {
  return { rng: makeSeed(seed) };
}

/** Alias pour rngNext */
export const rngFloat = rngNext;

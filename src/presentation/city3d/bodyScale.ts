/**
 * Taille d'un personnage selon son âge (logique pure). Remplace l'ancienne règle « 1,52 m à 12 ans,
 * 1,72 m adulte » qui faisait un collégien presque aussi grand que les adultes.
 *
 * Courbe (moyennes françaises arrondies) : 6 ans 1,18 m · 12 ans 1,50 m · 16 ans 1,68 m ·
 * adulte 1,72 m ± 7 cm selon la graine · aîné (65 ans et plus) jusqu'à −4 cm.
 */

/** Hachage FNV-1a 32 bits (déterministe, sans Math.random). */
function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Variation déterministe de −1 à 1 pour une graine textuelle. */
export function seededUnit(key: string): number {
  return ((hashKey(`taille:${key}`) % 2001) / 1000) - 1;
}

/** Taille moyenne (m) à un âge donné, sans variation individuelle. */
export function baseHeightForAge(age: number): number {
  const a = Number.isFinite(age) ? Math.max(3, age) : 30;
  if (a <= 6) return 1.0 + (a - 3) * 0.06;
  if (a <= 12) return 1.18 + (a - 6) * (0.32 / 6);
  if (a <= 16) return 1.5 + (a - 12) * 0.045;
  if (a < 18) return 1.68 + (a - 16) * 0.02;
  return 1.72 - (a >= 65 ? Math.min(0.04, (a - 65) * 0.004) : 0);
}

/**
 * Taille d'affichage (m). `key` (id du PNJ) ajoute une variation déterministe : ±7 cm pour un
 * adulte, ±3 cm pour un enfant ou un ado (jamais assez pour effacer l'écart d'âge).
 */
export function heightForAge(age: number, key?: string): number {
  const base = baseHeightForAge(age);
  if (!key) return base;
  const spread = age >= 18 ? 0.07 : 0.03;
  return Math.round((base + seededUnit(key) * spread) * 100) / 100;
}

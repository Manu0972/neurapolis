/**
 * Données du territoire — météo saisonnière (contrat M5 §3) et seuils de
 * vitalité de l'épicerie. Le tirage lui-même vit dans src/simulation/district.ts
 * (PRNG du monde, jamais dans la présentation).
 * Probabilités (%) : septembre = fin d'été 60/30/10 ; automne (oct-nov) 30/40/30 ;
 * hiver (déc-fév) 20/30/50. Printemps/été : extrapolation raisonnable du contrat.
 */
import type { Meteo } from '../core/types';

export type SeasonKey = 'finEte' | 'automne' | 'hiver' | 'printemps' | 'ete';

/** [p(soleil), p(nuages)] en % — le reste est la pluie. */
export const WEATHER_PROBABILITIES: Record<SeasonKey, readonly [number, number]> = {
  finEte: [60, 30],
  automne: [30, 40],
  hiver: [20, 30],
  printemps: [40, 35],
  ete: [60, 25],
};

export function seasonOfMonth(month: number): SeasonKey {
  if (month === 9) return 'finEte';
  if (month === 10 || month === 11) return 'automne';
  if (month === 12 || month === 1 || month === 2) return 'hiver';
  if (month <= 5) return 'printemps';
  return 'ete';
}

export const SEUIL_FERMETURE_EPICERIE = 35;
export const SEUIL_EMBAUCHE_EPICERIE = 60;

export const METEO_LABELS: Record<Meteo, string> = {
  soleil: 'Soleil',
  nuages: 'Nuages',
  pluie: 'Pluie',
};

/**
 * Libellés français de l'interface : identifiants internes → texte lisible, dates et montants
 * écrits à la française. Fonctions pures (testées dans tests/qualite_libelles.test.ts).
 */
import type { RivalStrategy } from '../core/types';

/** Stratégie d'un rival, telle que le joueur la lit dans « Concurrence ». */
export const RIVAL_STRATEGY_LABELS: Readonly<Record<RivalStrategy, string>> = {
  prix_casse: 'prix cassés',
  campagne_com: 'campagne de publicité',
  fidelite: 'fidélisation des clients',
  standard: 'classique',
};

/**
 * « mardi 1 septembre 2020 » → « Mardi 1er septembre 2020 » : majuscule au seul premier mot
 * (les mois restent en minuscules) et « 1er » pour le premier jour du mois.
 */
export function frenchDateLabel(label: string): string {
  const t = label.replace(/^(\S+) 1 /, '$1 1er ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Montant en euros à la française : « 28,50 € ». */
export function euros(v: number): string {
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

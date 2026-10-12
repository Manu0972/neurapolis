/**
 * Parcours complet de la campagne par un joueur scripté « pressé » : il ne fait que les
 * objectifs, puis fait passer le temps mois par mois. C'est lui qui révélait le blocage du
 * chapitre 4 (épicerie délaissée trois ans → confiance du quartier ≈ 35 < 50).
 * Fichier séparé : les graines tournent en parallèle de l'autre parcours.
 */
import { describe, it } from 'vitest';
import { grainesSupplementaires, verifierParcours } from './parcours/verifier';

const LONG = 300_000;

describe('parcours de campagne — joueur pressé', () => {
  for (const seed of [7, 42]) {
    it(`graine ${seed} : objectifs seulement, le temps passe mois par mois`, () => {
      verifierParcours(seed, 'presse');
    }, LONG);
  }
  for (const seed of grainesSupplementaires()) {
    it(`graine ${seed}`, () => verifierParcours(seed, 'presse'), LONG);
  }
});

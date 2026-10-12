/**
 * Assertions communes des tests de parcours : une campagne saine se termine, sans exception,
 * sans spirale ni blocage, chapitre après chapitre à l'âge prévu, et raconte les cahiers.
 */
import { expect } from 'vitest';
import { formatBilan, jouerCampagne, type Profil } from './joueur-scripte';

/** Graines supplémentaires : PARCOURS_GRAINES="1,2,3" (rapport plus large, hors CI). */
export function grainesSupplementaires(): number[] {
  const env = typeof process !== 'undefined' ? process.env['PARCOURS_GRAINES'] : undefined;
  return (env ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
}

export function verifierParcours(seed: number, profil: Profil): void {
  const b = jouerCampagne({ seed, profil });
  // Le rapport complet apparaît dans la sortie du test (utile en revue de PR).
  console.log(formatBilan(b));
  expect(b.errors, 'exceptions du moteur').toEqual([]);
  expect(b.alerts, 'spirales ou blocages').toEqual([]);
  expect(b.finished, 'campagne terminée').toBe(true);
  expect(b.chapters.map((c) => c.chapter)).toEqual([1, 2, 3, 4, 5]);
  for (const c of b.chapters) {
    expect(c.age, `âge à la fin du chapitre ${c.chapter}`).toBe(11 + c.chapter);
    // Un chapitre ouvert se joue en moins de trois semaines, l'attente d'âge mise à part
    // (le débat du chapitre 4 attend lui-même les 15 ans : il est exclu de cette mesure).
    if (c.chapter === 2 || c.chapter === 3 || c.chapter === 5) expect((c.objectivesDay ?? c.completedDay ?? 0) - c.openedDay).toBeLessThanOrEqual(21);
  }
  expect(b.chapters[0]!.completedDay, 'chapitre 1 en moins d’un mois').toBeLessThanOrEqual(30);
  expect(b.days, 'fin à 16 ans, sans traîner').toBeLessThanOrEqual(365 * 4 + 60);
  expect(b.minMoney).toBeGreaterThanOrEqual(0);
  expect(b.activeVoices, 'au moins deux voix pour le chapitre 4').toBeGreaterThanOrEqual(2);
  expect(b.cahiers.length, 'cahiers de Lucien des paliers 1 à 3').toBeGreaterThanOrEqual(7);
  expect(b.epilogue?.text).toContain('Val-Ferrand');
}

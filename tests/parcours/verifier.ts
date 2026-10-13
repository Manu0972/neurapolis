/**
 * Assertions communes des tests de parcours : une campagne saine se termine, sans exception,
 * sans spirale ni blocage, chapitre après chapitre à l'âge prévu, et raconte les cahiers.
 */
import { expect } from 'vitest';
import { formatBilan, jouerCampagne, type ParcoursBilan, type Profil } from './joueur-scripte';

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
  verifierEconomie(b);
}

/**
 * Bornes de l'économie sur quatre ans (relevé annuel du joueur scripté). Elles disent ce qu'est
 * une campagne « juste » pour un collégien de 12 à 16 ans : l'argent monte sans s'emballer, les
 * jauges vivent (ni figées à 100 ni effondrées), les livres et l'atelier ne grossissent pas sans fin.
 * Mesures de référence (2026-10, graines 20200901, 7, 42, 1, 2) dans la PR « temps-economie ».
 */
export function verifierEconomie(b: ParcoursBilan): void {
  const annees = b.releves.filter((r) => r.age >= 12 && r.age <= 15);
  expect(annees.map((r) => r.annee), 'quatre années scolaires relevées').toEqual(['2020-21', '2021-22', '2022-23', '2023-24']);
  let avant = 0;
  for (const r of annees) {
    const quoi = `${r.annee} (${b.profil}, graine ${b.seed})`;
    const gain = r.money - avant;
    avant = r.money;
    // Argent de poche + affaires + surprises de la vie : pas d'inflation de l'argent.
    expect(gain, `gain d’argent ${quoi}`).toBeLessThanOrEqual(b.profil === 'applique' ? 1900 : 800);
    expect(r.ecritures, `écritures comptables ${quoi}`).toBeLessThanOrEqual(1300);
    expect(r.stock, `stock du stand ${quoi}`).toBeLessThanOrEqual(40);
    expect(r.caisse, `caisse du stand ${quoi}`).toBeLessThanOrEqual(200);
    expect(r.reputation, `réputation ${quoi}`).toBeGreaterThanOrEqual(40); // palier 2 de l'Ascension
    expect(r.confiance, `confiance du quartier ${quoi}`).toBeGreaterThanOrEqual(25);
    if (b.profil !== 'applique') continue;
    // Le joueur appliqué : un stand qui tourne, un atelier qui sert le quartier, des jauges vivantes.
    expect(r.caStand, `CA du stand ${quoi}`).toBeGreaterThanOrEqual(600);
    expect(r.caStand, `CA du stand ${quoi}`).toBeLessThanOrEqual(2500);
    expect(r.atelier, `atelier ouvert ${quoi}`).toBeDefined();
    expect(r.atelier!.ca, `CA de l’atelier ${quoi}`).toBeGreaterThanOrEqual(800);
    expect(r.atelier!.ca, `CA de l’atelier ${quoi}`).toBeLessThanOrEqual(3500);
    expect(r.atelier!.commandes, `commandes gardées ${quoi}`).toBeLessThanOrEqual(30);
    expect(r.atelier!.fonds, `fonds solidaire dormant ${quoi}`).toBeLessThan(60);
    expect(r.atelier!.pieces, `pièces en stock ${quoi}`).toBeLessThanOrEqual(30);
    expect(r.reputation, `réputation ${quoi} : haute mais pas figée`).toBeGreaterThanOrEqual(60);
    expect(r.reputation, `réputation ${quoi} : haute mais pas figée`).toBeLessThanOrEqual(98);
    expect(r.confiance, `confiance du quartier ${quoi} : pas figée à 100`).toBeLessThanOrEqual(90);
    const drive = r.rivaux['drive_hyper'] ?? 0;
    expect(drive, `part du Drive ${quoi}`).toBeGreaterThanOrEqual(25);
    expect(drive, `part du Drive ${quoi}`).toBeLessThanOrEqual(85);
  }
  const fin = annees[annees.length - 1]!.money;
  if (b.profil === 'applique') {
    expect(fin, 'argent à 16 ans (appliqué)').toBeGreaterThanOrEqual(2200);
    expect(fin, 'argent à 16 ans (appliqué)').toBeLessThanOrEqual(6000);
  } else {
    expect(fin, 'argent à 16 ans (pressé)').toBeGreaterThanOrEqual(700);
    expect(fin, 'argent à 16 ans (pressé)').toBeLessThanOrEqual(2800);
  }
}

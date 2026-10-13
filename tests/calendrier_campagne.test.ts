/**
 * Le calendrier scolaire porte les quatre années de campagne (2020 → 2024) : à chaque période de
 * vacances, « Passer les vacances » est proposé et réveille le joueur le matin de la reprise.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { dateOf, dayIndexOf, isSchoolDay, isVacances, minutesOfDay, periodeVacances, vacancesDeLAnnee } from '../src/core/clock';
import { skipBlocker, skipTarget, skipTime } from '../src/simulation/timeskip';

const dayOfIso = (iso: string): number =>
  Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse('2020-09-01T00:00:00Z')) / 86_400_000);
const at = (w: WorldState, day: number, minutes: number): void => { w.time.tick = day * TICKS_PER_DAY + minutes / 10; };

describe('calendrier de campagne — « Passer les vacances » chaque année', () => {
  it('chaque période de 2020-21 à 2024-25 se passe d’un clic et finit le matin de la reprise', () => {
    const w = createWorld();
    for (const y of [2020, 2021, 2022, 2023, 2024]) {
      for (const p of vacancesDeLAnnee(y)) {
        at(w, dayOfIso(p.debut), 10 * 60);
        expect(skipBlocker(w, 'vacances'), `${p.nom} ${y}`).toBeNull();
        const target = skipTarget(w, 'vacances');
        const reprise = dayIndexOf(target);
        expect(minutesOfDay(target)).toBe(7 * 60);
        expect(dateOf(reprise).iso, `reprise après ${p.nom} ${y}`).toBe(dateOf(dayOfIso(p.fin) + 1).iso);
        expect(isVacances(reprise)).toBe(false);
      }
    }
  });

  it('quatre ans de campagne : les grandes vacances se passent d’un clic chaque été', () => {
    const w = createWorld();
    const fin = dayOfIso('2024-09-01');
    const compter = (avecEte: boolean): { clics: number; etes: number } => {
      at(w, 0, 8 * 60);
      let clics = 0;
      let etes = 0;
      while (dayIndexOf(w.time.tick) < fin) {
        const ete = avecEte && periodeVacances(dayIndexOf(w.time.tick))?.nom === 'été' && skipBlocker(w, 'vacances') === null;
        w.time.tick = skipTarget(w, ete ? 'vacances' : 'mois');
        clics++;
        if (ete) etes++;
      }
      return { clics, etes };
    };
    const moisSeuls = compter(false);
    const avecEte = compter(true);
    expect(moisSeuls.clics).toBe(48); // « Passer le mois » = un mois du calendrier : 12 par an
    expect(avecEte.etes).toBe(4); // un clic par été, 2021 → 2024
    expect(avecEte.clics).toBeLessThanOrEqual(moisSeuls.clics);
    // Chaque saut d'été ramène pile au matin de la rentrée : les années restent alignées.
    expect(avecEte.clics / 4, 'clics par année scolaire').toBeLessThanOrEqual(12);
  });

  it('les grandes vacances 2022 sont vraiment simulées, et la rentrée trouve le joueur en classe', () => {
    const w = createWorld();
    at(w, dayOfIso('2022-07-08'), 9 * 60);
    const r = skipTime(w, 'vacances');
    if ('error' in r) throw new Error(r.error);
    const day = dayIndexOf(w.time.tick);
    expect(dateOf(day).iso).toBe('2022-09-01'); // rentrée du jeudi 1er septembre 2022
    expect(isSchoolDay(day)).toBe(true);
    expect(r.days).toBeGreaterThanOrEqual(54);
    expect(w.player.age).toBe(14); // l'anniversaire du 1er septembre est passé pendant le saut simulé
  }, 120_000);
});

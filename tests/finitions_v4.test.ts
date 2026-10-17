import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { dayOfIso, isSchoolDay, jourFerie, isPontAscension } from '../src/core/clock';
import { TICKS_PER_DAY } from '../src/core/types';
import { indicePrix, INDICE_FIN_2023 } from '../src/simulation/inflation';
import { buyStock, coutStock, createProject, demandAt, runSalesSession } from '../src/simulation/project';
import { rivalDay } from '../src/simulation/rival';
import { STAND_CONFIG } from '../src/data/project';

describe('Jours fériés français (2020-2025)', () => {
  it('reconnaît les fêtes fixes et mobiles, sans école ces jours-là', () => {
    const cas: Array<[string, string]> = [
      ['2020-11-11', 'Armistice 1918'], ['2021-04-05', 'Lundi de Pâques'], ['2021-05-13', 'Ascension'],
      ['2021-05-24', 'Lundi de Pentecôte'], ['2022-04-18', 'Lundi de Pâques'], ['2022-05-26', 'Ascension'],
      ['2023-05-01', 'Fête du Travail'], ['2023-05-08', 'Victoire 1945'], ['2024-04-01', 'Lundi de Pâques'],
      ['2024-05-09', 'Ascension'], ['2024-05-20', 'Lundi de Pentecôte'], ['2025-04-21', 'Lundi de Pâques'],
      ['2025-05-29', 'Ascension'],
    ];
    for (const [iso, nom] of cas) {
      const d = dayOfIso(iso);
      expect(jourFerie(d), iso).toBe(nom);
      expect(isSchoolDay(d), iso).toBe(false);
    }
    // Pont de l'Ascension : vendredi sans cours, mais pas férié.
    expect(isPontAscension(dayOfIso('2022-05-27'))).toBe(true);
    expect(jourFerie(dayOfIso('2022-05-27'))).toBeNull();
    expect(isSchoolDay(dayOfIso('2022-05-27'))).toBe(false);
    // Un jour de classe ordinaire reste un jour de classe.
    expect(jourFerie(dayOfIso('2021-05-11'))).toBeNull();
    expect(isSchoolDay(dayOfIso('2021-05-11'))).toBe(true);
  });

  it('le commerce reste ouvert un jour férié : le stand vend', () => {
    const w = createWorld();
    w.time.tick = dayOfIso('2021-05-13') * TICKS_PER_DAY + 15 * 6; // jeudi de l'Ascension, 15 h
    w.player.money = 100;
    createProject(w);
    buyStock(w);
    expect(runSalesSession(w, 'place').ok).toBe(true);
  });
});

describe('Inflation 2022-2023 (déterministe, modeste)', () => {
  it('indice à 1 avant 2022, croissant ensuite, plafonné à 1,09', () => {
    expect(indicePrix(dayOfIso('2021-12-31'))).toBe(1);
    const mi22 = indicePrix(dayOfIso('2022-07-01'));
    expect(mi22).toBeGreaterThan(1.02);
    expect(mi22).toBeLessThan(1.03);
    expect(indicePrix(dayOfIso('2023-01-01'))).toBeCloseTo(1.05, 5);
    expect(indicePrix(dayOfIso('2024-06-01'))).toBe(INDICE_FIN_2023);
  });

  it('le stock coûte plus cher, la demande suit le prix réel', () => {
    expect(coutStock(dayOfIso('2021-06-01'))).toBe(STAND_CONFIG.stockCost);
    expect(coutStock(dayOfIso('2024-01-10'))).toBe(16.4);
    // Un prix relevé de l'inflation garde la même demande qu'avant.
    expect(demandAt(1.09, 70, 2, 'nuages', 1.09)).toBe(demandAt(1, 70, 2, 'nuages'));
    expect(demandAt(1, 70, 2, 'nuages', 1.09)).toBeGreaterThanOrEqual(demandAt(1, 70, 2, 'nuages'));
  });
});

describe('Distributeur du collège', () => {
  it('vendre à la récré fait évoluer sa part de marché (55 % au départ)', () => {
    const w = createWorld();
    w.time.tick = dayOfIso('2020-09-08') * TICKS_PER_DAY + 10 * 6;
    w.player.money = 100;
    w.player.reputation = 80;
    createProject(w);
    buyStock(w);
    expect(w.rivals.distributeur_college.marketShare).toBe(55);
    expect(runSalesSession(w, 'college').ok).toBe(true);
    w.time.tick += TICKS_PER_DAY;
    rivalDay(w);
    expect(w.rivals.distributeur_college.marketShare).not.toBe(55);
  });
});

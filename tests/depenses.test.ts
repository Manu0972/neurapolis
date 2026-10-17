/** Dépenses courantes : choisies, avec un petit effet, jamais punitives. */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { basculerForfait, depensesSemaine, depenseStatus, faireDepense, forfaitActif, FORFAIT_SEMAINE } from '../src/simulation/depenses';

describe('dépenses courantes', () => {
  it('un goûter coûte, nourrit, et ne se refait pas le même jour', () => {
    const w = createWorld({ seed: 3 });
    w.player.money = 20;
    w.player.needs.faim = 70;
    expect(faireDepense(w, 'gouter').ok).toBe(true);
    expect(w.player.money).toBeCloseTo(17.5, 2);
    expect(w.player.needs.faim).toBe(40);
    expect(depenseStatus(w, 'gouter').ok).toBe(false);
    runTicks(w, TICKS_PER_DAY);
    expect(depenseStatus(w, 'gouter').ok).toBe(true);
  });

  it('une sortie rapproche des copains ; sans argent, rien ne se passe', () => {
    const w = createWorld({ seed: 3 });
    w.player.money = 5;
    expect(faireDepense(w, 'sortie').ok).toBe(false);
    expect(w.player.money).toBe(5);
    w.player.money = 30;
    const avant = w.player.relations['noah']?.amitie ?? 0;
    expect(faireDepense(w, 'sortie').ok).toBe(true);
    expect(w.player.relations['noah']!.amitie).toBe(avant + 3);
  });

  it('forfait à 15 ans, suspendu sans pénalité quand l’argent manque', () => {
    const w = createWorld({ seed: 3 });
    w.player.money = 50;
    w.player.age = 14;
    expect(basculerForfait(w).ok).toBe(false);
    w.player.age = 15;
    expect(basculerForfait(w).ok).toBe(true);
    expect(w.player.money).toBeCloseTo(50 - FORFAIT_SEMAINE, 2);
    w.player.money = 1;
    expect(depensesSemaine(w)).toHaveLength(1);
    expect(forfaitActif(w)).toBe(false);
    expect(w.player.money).toBe(1);
  });
});

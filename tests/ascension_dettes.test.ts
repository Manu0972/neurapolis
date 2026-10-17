/**
 * Ascension : un lancement financé par emprunt est annoncé avant de lancer (apport/emprunt
 * par voie) et l'emprunt apparaît ensuite dans les dettes (montant, échéances).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { ascensionDebts, ideaStatus, launchFinancing, requestLaunch, resolveLaunch } from '../src/simulation/ascension';

describe('Ascension : emprunts visibles', () => {
  it('journal du collège avec 6,50 € : seule la voie qui emprunte est possible, et c’est dit', () => {
    const w = createWorld({ seed: 7 });
    w.player.money = 6.5;
    const st = ideaStatus(w, 'journal_college');
    expect(st.available).toBe(true);
    expect(w.player.money).toBeLessThan(st.cost);
    const fin = launchFinancing(w, 'journal_college')!;
    expect(fin.A.borrowed).toBeGreaterThan(0);
    expect(fin.A.affordable).toBe(true);
    expect(fin.B.affordable).toBe(false);
    expect(fin.A.own + fin.A.borrowed).toBeCloseTo(st.cost, 2);
  });

  it('l’emprunt de Keynes apparaît dans les dettes, avec échéances, et diminue chaque jour', () => {
    const w = createWorld({ seed: 7 });
    w.player.money = 6.5;
    expect(ascensionDebts(w)).toHaveLength(0);
    expect(requestLaunch(w, 'journal_college').ok).toBe(true);
    const borrowed = launchFinancing(w, 'journal_college')!.A.borrowed;
    expect(resolveLaunch(w, 'A').ok).toBe(true);
    const d0 = ascensionDebts(w);
    expect(d0).toHaveLength(1);
    expect(d0[0]!.remaining).toBeCloseTo(borrowed, 2);
    expect(d0[0]!.dailyRepay).toBeGreaterThan(0);
    expect(d0[0]!.daysLeft).toBeGreaterThan(300);
    runTicks(w, TICKS_PER_DAY * 3);
    const d1 = ascensionDebts(w);
    if (d1.length > 0) expect(d1[0]!.remaining).toBeLessThan(d0[0]!.remaining);
  });
});

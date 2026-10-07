/**
 * Petit boulot chez Mme Bertin : créneaux, paie, fatigue, confiance, remise fournisseur.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import type { WorldState } from '../src/core/types';
import { minutesOfDay } from '../src/core/clock';
import { runTicks } from '../src/simulation/engine';
import { JOB, bertinLoyaltyDiscount, canStartShift, inShift, startShift } from '../src/simulation/jobs';
import { openBusiness, orderStock, signLease, transferCash } from '../src/simulation/economy';

/** Avance jusqu'à mardi 16 h 10 (jour de cours, Mme Bertin à l'épicerie). */
function tuesdayAfternoon(): WorldState {
  const w = createWorld({ seed: 3 });
  while (minutesOfDay(w.time.tick) !== 16 * 60 + 10) runTicks(w, 1);
  w.npcs['bertin']!.place = 'epicerie';
  return w;
}

describe('petit boulot à l’épicerie', () => {
  it('refuse en dehors des créneaux (le matin d’un jour de cours)', () => {
    const w = createWorld();
    w.npcs['bertin']!.place = 'epicerie';
    const c = canStartShift(w);
    expect(c.ok).toBe(false);
    expect(c.message).toMatch(/16 h et 19 h/);
  });

  it('un service de deux heures paie, fatigue et renforce la confiance', () => {
    const w = tuesdayAfternoon();
    const money0 = w.player.money;
    const fatigue0 = w.player.needs.fatigue;
    const conf0 = w.player.relations['bertin']!.confiance;
    expect(startShift(w).ok).toBe(true);
    expect(inShift(w)).toBe(true);
    expect(startShift(w).ok).toBe(false);
    for (let i = 0; i < JOB.shiftTicks; i++) {
      w.npcs['bertin']!.place = 'epicerie';
      runTicks(w, 1);
    }
    expect(inShift(w)).toBe(false);
    expect(w.flags['jobShiftsDone']).toBe(1);
    expect(w.player.money).toBeGreaterThanOrEqual(money0 + JOB.payPerHour * 2 - 0.1);
    expect(w.player.needs.fatigue).toBeGreaterThan(fatigue0);
    expect(w.player.relations['bertin']!.confiance).toBe(conf0 + 3);
  });

  it('refuse quand le joueur est épuisé', () => {
    const w = tuesdayAfternoon();
    w.player.needs.fatigue = 90;
    expect(startShift(w).ok).toBe(false);
  });

  it('après trois services, le dépannage Bertin coûte moins cher', () => {
    const w = tuesdayAfternoon();
    expect(bertinLoyaltyDiscount(w)).toBe(0);
    w.flags['jobShiftsDone'] = JOB.loyaltyShifts;
    expect(bertinLoyaltyDiscount(w)).toBeGreaterThan(0);
    // Effet réel sur une commande.
    const cost = (discountShifts: number): number => {
      const v = createWorld({ seed: 4 });
      v.flags['jobShiftsDone'] = discountShifts;
      v.player.money = 200;
      signLease(v, 'etal_1');
      openBusiness(v, 'etal_1', 't_etal_marche', 'Étal');
      const biz = Object.keys(v.economy!.businesses)[0]!;
      transferCash(v, biz, 100);
      orderStock(v, biz, 'g_bertin_depannage', [{ productId: 'p_gouter_biscuits', qty: 20 }]);
      return v.economy!.orders[0]!.total;
    };
    expect(cost(JOB.loyaltyShifts)).toBeLessThan(cost(0));
  });
});

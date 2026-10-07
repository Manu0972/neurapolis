/**
 * Laminoir Taret (2032) : après la fermeture, le joueur choisit l'avenir de la halle.
 * Conditions (apport, réputation), choix unique, effets durables sur la demande de la Gare.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { LAMINOIR_OPTIONS, chooseLaminoirFuture, laminoirDecisionPending, laminoirDemand } from '../src/simulation/laminoir';

function closed() {
  const w = createWorld();
  w.flags['laminoirFerme'] = 1;
  return w;
}

describe('avenir du laminoir', () => {
  it('aucune décision avant la fermeture', () => {
    const w = createWorld();
    expect(laminoirDecisionPending(w)).toBe(false);
    expect(chooseLaminoirFuture(w, 'logistique').ok).toBe(false);
  });

  it('la coopérative exige apport et réputation', () => {
    const w = closed();
    w.player.reputation = 30;
    w.player.money = 5000;
    expect(chooseLaminoirFuture(w, 'cooperative').ok).toBe(false);
    w.player.reputation = 70;
    w.player.money = 100;
    expect(chooseLaminoirFuture(w, 'cooperative').ok).toBe(false);
    w.player.money = 5000;
    const trust = w.district.confianceQuartier;
    expect(chooseLaminoirFuture(w, 'cooperative').ok).toBe(true);
    expect(w.player.money).toBe(5000 - LAMINOIR_OPTIONS[0]!.cost);
    expect(w.district.confianceQuartier).toBeGreaterThan(trust);
    expect(laminoirDecisionPending(w)).toBe(false);
    expect(w.events.some((e) => e.title.startsWith('Laminoir Taret'))).toBe(true);
  });

  it('le choix est définitif', () => {
    const w = closed();
    expect(chooseLaminoirFuture(w, 'logistique').ok).toBe(true);
    expect(chooseLaminoirFuture(w, 'tiers_lieu').ok).toBe(false);
    expect(w.flags['laminoirChoix']).toBe(2);
  });

  it("l'entrepôt renforce le Drive ; le tiers-lieu fait vivre la Gare", () => {
    const a = closed();
    const share = a.rivals.drive_hyper.marketShare;
    chooseLaminoirFuture(a, 'logistique');
    expect(a.rivals.drive_hyper.marketShare).toBeGreaterThan(share);

    const b = closed();
    b.player.reputation = 50;
    b.player.money = 1000;
    expect(laminoirDemand(b, 'gare_1')).toBe(1);
    expect(chooseLaminoirFuture(b, 'tiers_lieu').ok).toBe(true);
    expect(laminoirDemand(b, 'gare_1')).toBeGreaterThan(laminoirDemand(b, 'local_1'));
    expect(laminoirDemand(b, 'local_1')).toBeGreaterThanOrEqual(1);
  });
});

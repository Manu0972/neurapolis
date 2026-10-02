import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { ensureMacroNewsState, getCurrentCostModifier, getCurrentDemandModifier, macroNewsDayTick, triggerCustomMarketShock } from '../src/simulation/macro_news';

describe('Actualités Macroéconomiques & Chocs de Marché', () => {
  it('initialise le fil de dépêches avec une tendance par défaut', () => {
    const w = createWorld();
    const mn = ensureMacroNewsState(w);
    expect(mn.feed.length).toBeGreaterThan(0);
    expect(getCurrentCostModifier(w)).toBeDefined();
    expect(getCurrentDemandModifier(w)).toBeDefined();
  });

  it('génère un nouvel événement économique lors du tick journalier à expiration', () => {
    const w = createWorld();
    const mn = ensureMacroNewsState(w);
    mn.feed[0]!.activeUntilDay = 0;
    w.time.tick += 144; // Passer au jour suivant

    const notifs = macroNewsDayTick(w);
    expect(notifs.length).toBe(1);
    expect(notifs[0]!.kind).toBe('journal');
    expect(mn.feed.length).toBeGreaterThanOrEqual(2);
  });

  it('provoque un choc de marché spécifique et met à jour les modificateurs de coûts et demande', () => {
    const w = createWorld();
    const notif = triggerCustomMarketShock(w, 0); // Inflation
    expect(notif.kind).toBe('journal');

    const mn = ensureMacroNewsState(w);
    expect(mn.currentTrend).toBe('inflation');
    expect(mn.costModifier).toBeGreaterThan(0);
  });
});

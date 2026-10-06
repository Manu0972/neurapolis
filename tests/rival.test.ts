/**
 * Tests du système de Concurrence & Rivalité Économique (NEURAPOLIS / inspiration Big Ambitions).
 * Couvre :
 * 1. Déterminisme et calcul des parts de marché (prix, qualité, réputation).
 * 2. Contre-stratégies jouables (coûts, effets sur les parts, événements avec causes).
 * 3. Réactions des rivaux à la domination du joueur (>50% de part de marché).
 * 4. Pression dynamique sur le quartier (impact du Drive sur l'épicerie).
 * 5. Préservation des invariants (livre de comptes, stock, etc.).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { buyStock, createProject, ledgerInvariantHolds, runSalesSession, setPrice } from '../src/simulation/project';
import {
  calculateMarketShares,
  executeCounterStrategy,
  getAvailableCounterStrategies,
  getRivalForPlace,
  rivalDay,
} from '../src/simulation/rival';
import { runTicks } from '../src/simulation/engine';
import { COUNTER_STRATEGIES } from '../src/data/rivals';
import { TICKS_PER_DAY } from '../src/core/types';

describe('Rivalité économique — calculs des parts de marché', () => {
  it('sans stand actif ou sans stock, le rival détient 100 % du marché', () => {
    const w = createWorld();
    const { playerShare, rivalShare, rival } = calculateMarketShares(w, 'place');
    expect(rival).toBeDefined();
    expect(rival?.id).toBe('drive_hyper');
    expect(playerShare).toBe(0);
    expect(rivalShare).toBe(100);
  });

  it('avec un stand approvisionné, le marché est partagé selon les prix relatifs et la réputation', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);

    const { playerShare, rivalShare } = calculateMarketShares(w, 'place');
    expect(playerShare).toBeGreaterThan(30);
    expect(playerShare).toBeLessThan(70);
    expect(playerShare + rivalShare).toBe(100);
  });

  it('baisser le prix du stand augmente la part de marché du joueur', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);

    setPrice(w, 1.50);
    const cher = calculateMarketShares(w, 'place').playerShare;

    setPrice(w, 0.70);
    const competitif = calculateMarketShares(w, 'place').playerShare;

    expect(competitif).toBeGreaterThan(cher);
  });
});

describe('Rivalité économique — contre-stratégies jouables', () => {
  it('liste les contre-stratégies disponibles avec coûts et effets', () => {
    const w = createWorld();
    const strategies = getAvailableCounterStrategies(w);
    expect(strategies.length).toBeGreaterThanOrEqual(3);
    const circuitCourt = strategies.find((s) => s.id === 'circuit_court');
    expect(circuitCourt).toBeDefined();
    expect(circuitCourt?.costMoney).toBe(12);
  });

  it('lancer une contre-stratégie déduit l’argent, fatigue le joueur et booste sa part', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w); // joueur a 0 € restant
    w.player.money = 20; // on donne du budget pour le test

    const shareAvant = calculateMarketShares(w, 'place').playerShare;
    const res = executeCounterStrategy(w, 'circuit_court');

    expect(res.ok).toBe(true);
    expect(w.player.money).toBe(8); // 20 - 12
    expect(w.player.needs.fatigue).toBeGreaterThan(20);
    expect(w.rivals.drive_hyper.activeCounterActions).toContainEqual({ strategyId: 'circuit_court', expiresDay: 5 });
    expect(res.timeCostTicks).toBe(6);

    const shareApres = calculateMarketShares(w, 'place').playerShare;
    expect(shareApres).toBeGreaterThan(shareAvant);

    // Vérification de l'événement avec causes
    const ev = w.events.find((e) => e.title.includes('Contre-offensive'));
    expect(ev).toBeDefined();
    expect(ev?.causes.some((c) => c.facteur.includes('investissement financier'))).toBe(true);
  });

  it('refuse si argent insuffisant ou si déjà active', () => {
    const w = createWorld();
    createProject(w);
    w.player.money = 2; // insuffisant
    const failMoney = executeCounterStrategy(w, 'circuit_court');
    expect(failMoney.ok).toBe(false);
    expect(failMoney.message).toContain('Pas assez d\'argent');

    w.player.money = 50;
    expect(executeCounterStrategy(w, 'circuit_court').ok).toBe(true);
    const failDouble = executeCounterStrategy(w, 'circuit_court');
    expect(failDouble.ok).toBe(false);
    expect(failDouble.message).toContain('déjà active');
  });

  it('retire le bonus à l’échéance, journalise la fin et permet de relancer', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);
    w.player.money = 50;
    expect(executeCounterStrategy(w, 'circuit_court').ok).toBe(true);
    expect(w.rivals.drive_hyper.activeCounterActions).toHaveLength(1);

    w.time.tick = 4 * TICKS_PER_DAY;
    rivalDay(w);
    expect(w.rivals.drive_hyper.activeCounterActions).toHaveLength(1);

    w.time.tick = 5 * TICKS_PER_DAY;
    const notifs = rivalDay(w);
    expect(w.rivals.drive_hyper.activeCounterActions).toHaveLength(0);
    expect(notifs.some((n) => n.text.includes('est terminée'))).toBe(true);
    expect(w.events.some((event) => event.title.includes('Fin de la contre-offensive'))).toBe(true);
    expect(executeCounterStrategy(w, 'circuit_court').ok).toBe(true);
  });
});

describe('Rivalité économique — réactions des rivaux & territoire', () => {
  it('le Drive réplique par une guerre des prix si le joueur domine le marché (>50%)', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);
    w.player.money = 50;
    executeCounterStrategy(w, 'circuit_court');
    setPrice(w, 0.60); // prix ultra compétitif

    const share = calculateMarketShares(w, 'place').playerShare;
    expect(share).toBeGreaterThanOrEqual(50);
    w.project!.stock = 100;
    runSalesSession(w, 'place');

    const initialPrice = w.rivals.drive_hyper.price;
    w.time.tick = TICKS_PER_DAY;
    const notifs = rivalDay(w);

    expect(w.rivals.drive_hyper.strategy).toBe('prix_casse');
    expect(w.rivals.drive_hyper.price).toBeLessThan(initialPrice);
    expect(w.rivals.drive_hyper.reactionCooldown).toBeGreaterThan(0);
    expect(notifs.some((n) => n.text.includes('guerre des prix') || n.text.includes('Drive HyperVal réplique'))).toBe(true);

    const ev = w.events.find((e) => e.title.includes('Guerre des prix'));
    expect(ev).toBeDefined();
    expect(ev?.causes.some((c) => c.facteur.includes('domination du joueur'))).toBe(true);
  });

  it('la domination du joueur face au Drive protège l’épicerie de quartier', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);
    w.player.money = 50;
    executeCounterStrategy(w, 'circuit_court');
    setPrice(w, 0.50);
    w.player.reputation = 100;
    w.project!.stock = 100;
    runSalesSession(w, 'place');

    const vitInitiale = w.district.vitaliteEpicerie;
    w.time.tick = TICKS_PER_DAY;
    rivalDay(w);
    // Comme le Drive est contenu (<45% de part), l'épicerie ne s'effondre pas et reprend même de la vitalité
    expect(w.district.vitaliteEpicerie).toBeGreaterThanOrEqual(vitInitiale);
  });

  it('l’invariant du livre de comptes du stand reste toujours vérifié avec la concurrence', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);
    w.player.money = 20;
    executeCounterStrategy(w, 'degustation');

    const res = runSalesSession(w, 'place');
    expect(res.ok).toBe(true);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
  });

  it('clôture la part observée à partir des unités réellement vendues', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);
    setPrice(w, 0.5);
    w.project!.stock = 100; // isoler le partage de marché d'une rupture de stock

    const session = runSalesSession(w, 'place');
    const observation = w.rivals.drive_hyper.marketObservation;
    expect(session.ok).toBe(true);
    expect(observation.sessions).toBe(1);
    expect(observation.playerUnitsSold).toBe(session.sold);
    expect(observation.rivalUnitsServed).toBeGreaterThan(0);

    w.time.tick = TICKS_PER_DAY;
    rivalDay(w);
    const total = observation.playerUnitsSold + observation.rivalUnitsServed;
    expect(w.rivals.drive_hyper.marketShare).toBeCloseTo(observation.rivalUnitsServed / total * 100, 2);
    expect(w.rivals.drive_hyper.marketObservation.lastClosed).toMatchObject({
      day: 0,
      playerUnitsSold: session.sold,
      rivalUnitsServed: observation.rivalUnitsServed,
      sessions: 1,
    });
    expect(w.events.some((event) => event.title === 'Bilan du marché : Drive HyperVal')).toBe(true);
  });

  it('ne fait pas réagir un rival sur une projection si aucune vente réelle n’a eu lieu', () => {
    const w = createWorld();
    createProject(w);
    buyStock(w);
    w.project!.stock = 100;
    setPrice(w, 0.5);
    const initialPrice = w.rivals.drive_hyper.price;
    expect(calculateMarketShares(w, 'place').playerShare).toBeGreaterThanOrEqual(50);

    w.time.tick = TICKS_PER_DAY;
    rivalDay(w);
    expect(w.rivals.drive_hyper.price).toBe(initialPrice);
    expect(w.rivals.drive_hyper.reactionCooldown).toBe(0);
    expect(w.rivals.drive_hyper.marketObservation.lastClosed).toBeNull();
    expect(w.events.some((event) => event.title.includes('Guerre des prix'))).toBe(false);
  });
});

/**
 * Tests de Déterminisme PRNG et Horloge — NEURAPOLIS
 * 
 * Contrat :
 * - Deux mondes avec la même seed génèrent exactement les mêmes séquences
 *   d'événements macroéconomiques, d'historiques marchands et de plans d'action.
 * - La simulation utilise exclusivement w.rng et l'horloge du jeu (clock.ts / dateOf).
 * - Aucun module de src/simulation/ n'appelle Math.random, Date.now ou new Date() pour l'état de jeu.
 */
import { describe, expect, it, vi } from 'vitest';
import { createWorld } from '../src/core/store';
import { dateOf, dayIndexOf } from '../src/core/clock';
import { ensureMacroNewsState, macroNewsDayTick, triggerCustomMarketShock } from '../src/simulation/macro_news';
import { recordVendorTrade, buyVendorSpecialGood } from '../src/simulation/vendors';
import { activateActionPlan, ensureActionPlanningState, progressActionPlanStep, unlockTerritoryNode, payTerritoryConcession } from '../src/simulation/action_plan';

describe('Déterminisme PRNG & Horloge de Simulation', () => {
  it('deux mondes avec la même seed génèrent la séquence EXACTE d’actualités macroéconomiques', () => {
    const seed = 424242;
    const w1 = createWorld({ seed });
    const w2 = createWorld({ seed });

    ensureMacroNewsState(w1);
    ensureMacroNewsState(w2);

    expect(w1.rng).toBe(w2.rng);
    expect(w1.macroNews?.feed).toEqual(w2.macroNews?.feed);

    // Simuler 30 jours consécutifs avec expiration et tirage d'actualités
    for (let day = 1; day <= 30; day++) {
      w1.time.tick = day * 144;
      w2.time.tick = day * 144;

      const notifs1 = macroNewsDayTick(w1);
      const notifs2 = macroNewsDayTick(w2);

      expect(notifs1).toEqual(notifs2);
      expect(w1.rng).toBe(w2.rng);
      expect(w1.macroNews?.currentTrend).toBe(w2.macroNews?.currentTrend);
      expect(w1.macroNews?.costModifier).toBe(w2.macroNews?.costModifier);
      expect(w1.macroNews?.demandModifier).toBe(w2.macroNews?.demandModifier);
      expect(w1.macroNews?.feed).toEqual(w2.macroNews?.feed);
      expect(w1.events).toEqual(w2.events);
    }

    // Vérifier que plusieurs chocs ont bien été tirés
    expect(w1.macroNews!.feed.length).toBeGreaterThan(1);
    // Vérifier les identifiants déterministes (news_X_Y au lieu de Date.now)
    for (const item of w1.macroNews!.feed) {
      expect(item.id).toMatch(/^news_(init|\d+_\d+)/);
    }
  });

  it('deux seeds différentes génèrent des séquences macroéconomiques divergentes', () => {
    const wA = createWorld({ seed: 101 });
    const wB = createWorld({ seed: 99999 });

    ensureMacroNewsState(wA);
    ensureMacroNewsState(wB);

    for (let day = 1; day <= 60; day++) {
      wA.time.tick = day * 144;
      wB.time.tick = day * 144;
      macroNewsDayTick(wA);
      macroNewsDayTick(wB);
    }

    const trendsA = wA.macroNews!.feed.map((f) => f.trend);
    const trendsB = wB.macroNews!.feed.map((f) => f.trend);
    expect(trendsA).not.toEqual(trendsB);
  });

  it('triggerCustomMarketShock génère un id déterministe basé sur le tick du jeu', () => {
    const w = createWorld({ seed: 777 });
    w.time.tick = 432; // jour 3
    triggerCustomMarketShock(w, 2);

    const latest = w.macroNews!.feed[0]!;
    expect(latest.id).toBe(`news_custom_3_432`);
    expect(latest.date).toBe(dateOf(3).iso);
  });

  it('les événements d’évolution marchande utilisent la date calendrier du jeu et sont déterministes', () => {
    const w1 = createWorld({ seed: 555 });
    const w2 = createWorld({ seed: 555 });

    // Avancer au jour 15 à 11h20 (tick 15 * 144 + 68)
    const targetDay = 15;
    const targetTick = targetDay * 144 + 68;
    w1.time.tick = targetTick;
    w2.time.tick = targetTick;

    // Déclencher le palier 1 chez Mme Bertin
    for (let i = 0; i < 4; i++) {
      recordVendorTrade(w1, 'bertin', 12);
      recordVendorTrade(w2, 'bertin', 12);
    }

    const event1 = w1.events.find((e) => e.type === 'consequence');
    const event2 = w2.events.find((e) => e.type === 'consequence');

    expect(event1).toBeDefined();
    expect(event2).toBeDefined();
    expect(event1).toEqual(event2);

    const expectedDate = dateOf(targetDay).iso; // 2020-09-16
    expect(event1!.date).toBe(expectedDate);
    expect(event1!.day).toBe(targetDay);
    expect(event1!.id).toBe(`vendor_tier_bertin_1_${targetTick}`);

    // Vérifier que la date n'est pas la date de la machine hôte
    // Le jeu commence en septembre 2020
    expect(event1!.date.startsWith('2020-09-')).toBe(true);
  });

  it('les événements de plan d’action complété utilisent la date calendrier du jeu et sont déterministes', () => {
    const w1 = createWorld({ seed: 888 });
    const w2 = createWorld({ seed: 888 });

    const targetDay = 22;
    const targetTick = targetDay * 144 + 40;
    w1.time.tick = targetTick;
    w2.time.tick = targetTick;

    const planId = 'plan_approvisionnement_direct';
    const ap1 = ensureActionPlanningState(w1);
    const ap2 = ensureActionPlanningState(w2);
    const plan1 = ap1.plans[planId]!;
    const plan2 = ap2.plans[planId]!;

    for (let i = 0; i < plan1.steps.length; i++) {
      progressActionPlanStep(w1, planId, plan1.steps[i]!.id);
      progressActionPlanStep(w2, planId, plan2.steps[i]!.id);
    }

    const event1 = w1.events.find((e) => e.id.startsWith('plan_complete_'));
    const event2 = w2.events.find((e) => e.id.startsWith('plan_complete_'));

    expect(event1).toBeDefined();
    expect(event2).toBeDefined();
    expect(event1).toEqual(event2);

    const expectedDate = dateOf(targetDay).iso; // 2020-09-23
    expect(event1!.date).toBe(expectedDate);
    expect(event1!.day).toBe(targetDay);
    expect(event1!.id).toBe(`plan_complete_${planId}_${targetTick}`);
    expect(event1!.date.startsWith('2020-09-')).toBe(true);
  });

  it('aucune fonction de simulation n’appelle Math.random ou Date.now à l’exécution', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    const dateNowSpy = vi.spyOn(Date, 'now');

    const w = createWorld({ seed: 12345 });
    ensureMacroNewsState(w);

    // 1. Tick macroéconomique
    w.time.tick = 144 * 10;
    macroNewsDayTick(w);
    triggerCustomMarketShock(w, 1);

    // 2. Marchands
    recordVendorTrade(w, 'bertin', 50);
    recordVendorTrade(w, 'karim', 100);
    buyVendorSpecialGood(w, 'bertin', 'lot_tisanes_bertin');

    // 3. Plans d'action & cartographie
    activateActionPlan(w, 'plan_approvisionnement_direct');
    progressActionPlanStep(w, 'plan_approvisionnement_direct', 'pad_step_1');
    progressActionPlanStep(w, 'plan_approvisionnement_direct', 'pad_step_2');
    progressActionPlanStep(w, 'plan_approvisionnement_direct', 'pad_step_3');
    unlockTerritoryNode(w, 'roses');
    payTerritoryConcession(w, 'roses');

    expect(randomSpy).not.toHaveBeenCalled();
    expect(dateNowSpy).not.toHaveBeenCalled();

    randomSpy.mockRestore();
    dateNowSpy.mockRestore();
  });

  it('aucun fichier source dans src/simulation/ ne contient Math.random, Date.now ou new Date() dans son code exécutable', () => {
    const simModules = import.meta.glob<string>('../src/simulation/*.ts', { query: '?raw', import: 'default', eager: true });
    const moduleEntries = Object.entries(simModules);

    expect(moduleEntries.length).toBeGreaterThan(5);

    const forbiddenPatterns = [
      { name: 'Math.random', regex: /\bMath\.random\s*\(/g },
      { name: 'Date.now', regex: /\bDate\.now\s*\(/g },
      { name: 'new Date()', regex: /\bnew\s+Date\s*\(/g },
    ];

    const violations: string[] = [];

    for (const [filePath, content] of moduleEntries) {
      const fileName = filePath.split('/').pop() ?? filePath;
      // Supprimer les commentaires pour ne vérifier que le code actif
      // 1. Remplacer les commentaires multi-lignes /* ... */ par des espaces
      // 2. Remplacer les commentaires mono-lignes // ... par des espaces
      const codeWithoutComments = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');

      for (const pattern of forbiddenPatterns) {
        if (pattern.regex.test(codeWithoutComments)) {
          violations.push(`${fileName}: contient ${pattern.name}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

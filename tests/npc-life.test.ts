/**
 * Tests J2 — Habitants mémoriels et réactifs :
 * Mémoire non dupliquée, réactions bornées, conséquences observables, détermisme (même seed → même trace).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { npcTick, addNpcMemory } from '../src/simulation/npc';
import { npcLine } from '../src/simulation/dialogue';
import { runTicks } from '../src/simulation/engine';

describe('Habitants mémoriels et réactifs (J2)', () => {
  it('mémoire non dupliquée lors des répétitions du tick', () => {
    const w = createWorld({ seed: 100 });
    w.district.vitaliteEpicerie = 20; // épicerie en crise (< 35)

    // Exécuter 10 ticks de simulation
    for (let i = 0; i < 10; i++) {
      npcTick(w);
    }

    const bertin = w.npcs['bertin'];
    expect(bertin).toBeDefined();
    if (!bertin) return;

    // Le souvenir 'mem_epicerie_difficulte' doit être présent une et une seule fois
    const occurrences = bertin.memory.filter((m) => m === 'mem_epicerie_difficulte').length;
    expect(occurrences).toBe(1);
  });

  it('réactions et métriques bornées (moral, stress, opinion, cap mémoire)', () => {
    const w = createWorld({ seed: 100 });
    const bertin = w.npcs['bertin'];
    expect(bertin).toBeDefined();
    if (!bertin) return;

    // Forcer épicerie en difficulté
    w.district.vitaliteEpicerie = 10;
    npcTick(w);

    expect(bertin.moral).toBeGreaterThanOrEqual(0);
    expect(bertin.moral).toBeLessThanOrEqual(100);
    expect(bertin.stress).toBeGreaterThanOrEqual(0);
    expect(bertin.stress).toBeLessThanOrEqual(100);
    expect(bertin.opinion).toBeGreaterThanOrEqual(-100);
    expect(bertin.opinion).toBeLessThanOrEqual(100);

    // Tester le cap maximum de la mémoire (10 éléments max)
    for (let i = 1; i <= 15; i++) {
      addNpcMemory(bertin, `test_mem_${i}`);
    }
    expect(bertin.memory.length).toBeLessThanOrEqual(10);
  });

  it('conséquences observables : activités et dialogues de Mme Bertin', () => {
    const w = createWorld({ seed: 200 });
    // Régler l'heure où Bertin est à l'épicerie (10:00)
    w.time.tick = 60;
    w.district.vitaliteEpicerie = 25;

    npcTick(w);
    const bertin = w.npcs['bertin'];
    expect(bertin?.place).toBe('epicerie');
    expect(bertin?.activity).toBe('inquiète pour la boutique (crise)');

    const line = npcLine(w, 'bertin', 'accueil');
    expect(line).toBeDefined();
    expect(line).toMatch(/drive|difficulté/i);
  });

  it('conséquences observables : Noah et le stand collectif', () => {
    const w = createWorld({ seed: 300 });
    // Activer le stand collectif avec 1 session faite
    w.project = {
      id: 'stand_des_roses',
      active: true,
      stock: 10,
      price: 2,
      members: ['noah', 'lina'],
      rules: { collectif: true, contratSecurite: false },
      sessionsDone: 1,
      coursesDone: 0,
      ledger: [],
      balance: 50,
      week: { index: 0, revenue: 20, expenses: 5, distributed: false },
      work: {},
    };

    // Heure de parc / chez soi pour Noah (17:00, tick 102)
    w.time.tick = 102;
    npcTick(w);

    const noah = w.npcs['noah'];
    expect(noah?.memory).toContain('mem_stand_reussite_collective');
    expect(noah?.activity).toBe('dessine des affiches pour le stand');

    const line = npcLine(w, 'noah', 'projet');
    expect(line).toBeDefined();
    expect(line).toMatch(/stand collectif|équipe/i);
  });

  it('conséquences observables : Samir et la coopérative', () => {
    const w = createWorld({ seed: 400 });
    w.project = {
      id: 'stand_des_roses',
      active: true,
      stock: 10,
      price: 2,
      members: ['noah', 'samir'],
      rules: { collectif: true, contratSecurite: false },
      sessionsDone: 2,
      coursesDone: 0,
      ledger: [],
      balance: 100,
      week: { index: 0, revenue: 50, expenses: 10, distributed: false },
      work: {},
    };

    // 14:00 Samir à la place ou à la friche
    w.time.tick = 84;
    npcTick(w);

    const samir = w.npcs['samir'];
    expect(samir?.memory).toContain('mem_stand_reussite_collective');
    expect(samir?.activity).toBe('vante la réussite collective du stand');

    const line = npcLine(w, 'samir', 'coop');
    expect(line).toBeDefined();
    expect(line).toMatch(/réussite|coop|stand/i);
  });

  it('déterminisme : même seed → même trace', () => {
    const w1 = createWorld({ seed: 12345 });
    const w2 = createWorld({ seed: 12345 });

    w1.district.vitaliteEpicerie = 30;
    w2.district.vitaliteEpicerie = 30;

    runTicks(w1, 20);
    runTicks(w2, 20);

    const line1 = npcLine(w1, 'bertin', 'accueil');
    const line2 = npcLine(w2, 'bertin', 'accueil');

    expect(w1.npcs['bertin']?.memory).toEqual(w2.npcs['bertin']?.memory);
    expect(w1.npcs['bertin']?.moral).toBe(w2.npcs['bertin']?.moral);
    expect(w1.npcs['bertin']?.stress).toBe(w2.npcs['bertin']?.stress);
    expect(w1.npcs['bertin']?.opinion).toBe(w2.npcs['bertin']?.opinion);
    expect(line1).toBe(line2);
  });
});

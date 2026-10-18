/**
 * Tests unitaires du détecteur de dérive d'état et diff lisible.
 *
 * Contrat :
 * - États identiques → liste vide.
 * - Une valeur modifiée → une entrée { chemin, avant, après }.
 * - Deux graines du monde différentes → diff non vide et déterministe (identique à chaque exécution).
 * - Troncature à maxEntries signalée (truncated: true, totalDiffs).
 * - Cas limites : tableaux de longueurs différentes, clés absentes d'un côté, NaN, objets cycliques.
 * - Mesure de performance sur un état du monde complet.
 */

import { describe, expect, it } from 'vitest';
import { diffStates, formatStateDiff } from '../src/simulation/stateDiff';
import { createWorld } from '../src/core/store';

describe('Détecteur de dérive - diffStates', () => {
  it('états identiques → liste vide', () => {
    const w1 = createWorld({ seed: 42 });
    const w2 = createWorld({ seed: 42 });

    const diff = diffStates(w1, w2);

    expect(diff).toEqual([]);
    expect(diff.length).toBe(0);
    expect(diff.truncated).toBe(false);
    expect(diff.totalDiffs).toBe(0);
  });

  it('une valeur modifiée → une seule entrée ciblée', () => {
    const w1 = createWorld({ seed: 100 });
    const w2 = createWorld({ seed: 100 });

    w2.player.money = 250;

    const diff = diffStates(w1, w2);

    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      chemin: 'player.money',
      avant: 15, // Valeur initiale du joueur
      après: 250,
    });
    expect(diff.truncated).toBe(false);
    expect(diff.totalDiffs).toBe(1);
  });

  it('deux graines du monde différentes → diff non vide et déterministe', () => {
    const wA1 = createWorld({ seed: 111 });
    const wB1 = createWorld({ seed: 999 });

    const diffRun1 = diffStates(wA1, wB1);

    expect(diffRun1.length).toBeGreaterThan(0);

    // Seconde exécution indépendante avec exactement les mêmes graines
    const wA2 = createWorld({ seed: 111 });
    const wB2 = createWorld({ seed: 999 });

    const diffRun2 = diffStates(wA2, wB2);

    // Le résultat doit être rigoureusement identique bit pour bit
    expect(diffRun2).toEqual(diffRun1);
    expect(diffRun2.totalDiffs).toBe(diffRun1.totalDiffs);
  });

  it('troncature à maxEntries signalée', () => {
    const a = {
      economy: {
        prices: {
          bread: 1.0,
          milk: 1.5,
          apple: 0.8,
          cheese: 3.2,
          meat: 5.0,
          water: 0.5,
        },
      },
    };
    const b = {
      economy: {
        prices: {
          bread: 1.2,
          milk: 1.8,
          apple: 0.9,
          cheese: 3.5,
          meat: 6.0,
          water: 0.6,
        },
      },
    };

    const fullDiff = diffStates(a, b);
    expect(fullDiff).toHaveLength(6);
    expect(fullDiff.truncated).toBe(false);

    const truncatedDiff = diffStates(a, b, { maxEntries: 3 });

    expect(truncatedDiff).toHaveLength(3);
    expect(truncatedDiff.truncated).toBe(true);
    expect(truncatedDiff.totalDiffs).toBe(6);

    const formatted = formatStateDiff(truncatedDiff);
    expect(formatted).toContain('3 autre(s) différence(s) masquée(s) par maxEntries');
  });

  describe('Cas limites', () => {
    it('tableaux de longueurs différentes', () => {
      const a = { items: [10, 20] };
      const b = { items: [10, 20, 30, 40] };

      const diff = diffStates(a, b);

      expect(diff).toEqual([
        { chemin: 'items.2', avant: undefined, après: 30 },
        { chemin: 'items.3', avant: undefined, après: 40 },
      ]);
    });

    it('clés absentes d’un côté', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 1, z: 3 };

      const diff = diffStates(a, b);

      expect(diff).toEqual([
        { chemin: 'y', avant: 2, après: undefined },
        { chemin: 'z', avant: undefined, après: 3 },
      ]);
    });

    it('gestion appropriée des valeurs NaN', () => {
      const a = { val1: NaN, val2: NaN, val3: 10 };
      const b = { val1: NaN, val2: 42, val3: NaN };

      const diff = diffStates(a, b);

      expect(diff).toEqual([
        { chemin: 'val2', avant: NaN, après: 42 },
        { chemin: 'val3', avant: 10, après: NaN },
      ]);
    });

    it('objets cycliques → refus explicite avec erreur claire', () => {
      const objA: Record<string, unknown> = { name: 'cycle' };
      objA['self'] = objA;

      const objB = { name: 'cycle', self: null };

      expect(() => diffStates(objA, objB)).toThrow('Objet cyclique détecté');
    });
  });

  describe('Mesure de performance sur monde complet', () => {
    it('mesure le temps d’exécution du diff sur deux états de monde complets', () => {
      const w1 = createWorld({ seed: 1000 });
      const w2 = createWorld({ seed: 2000 });

      const start = performance.now();
      const diff = diffStates(w1, w2, { maxEntries: 20 });
      const durationMs = performance.now() - start;

      // La durée doit être raisonnable (< 100 ms) sur un monde de départ
      expect(durationMs).toBeLessThan(100);
      expect(diff.totalDiffs).toBeGreaterThan(0);

      // Consigner explicitement la mesure pour inclusion dans la PR
      console.log(`[BENCHMARK] diffStates sur monde complet : ${durationMs.toFixed(3)} ms (entrées totales : ${diff.totalDiffs})`);
    });
  });
});

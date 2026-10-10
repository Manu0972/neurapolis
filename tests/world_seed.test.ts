import { describe, expect, it } from 'vitest';
import {
  deriverGraine,
  normaliserChemin,
  rngPour,
} from '../src/simulation/world/seed';
import { rngNext, rngInt } from '../src/core/rng';

describe('Graines hiérarchiques reproductibles (src/simulation/world/seed.ts)', () => {
  it('normalise correctement les différents formats de chemins', () => {
    expect(normaliserChemin('monde/france/val_ferrand/jeunes/camille')).toEqual([
      'monde', 'france', 'val_ferrand', 'jeunes', 'camille',
    ]);

    expect(normaliserChemin(['monde', 'france', 'val_ferrand', 'jeunes', 'camille'])).toEqual([
      'monde', 'france', 'val_ferrand', 'jeunes', 'camille',
    ]);

    expect(
      normaliserChemin({
        monde: 'Terre-2025',
        pays: 'France',
        ville: 'Val-Ferrand',
        cohorte: 'Collégiens',
        individu: 'Lina',
      })
    ).toEqual(['Terre-2025', 'France', 'Val-Ferrand', 'Collégiens', 'Lina']);
  });

  it('même chemin = même suite de nombres déterministe', () => {
    const chemin = 'monde_A/pays_FR/ville_ValFerrand/cohorte_12ans/individu_Camille';
    const baseSeed = 20200901;

    const prng1 = rngPour(chemin, baseSeed);
    const prng2 = rngPour(chemin, baseSeed);

    const tirages1 = [prng1.next(), prng1.int(1, 100), prng1.chance(0.5), prng1.range(10, 20)];
    const tirages2 = [prng2.next(), prng2.int(1, 100), prng2.chance(0.5), prng2.range(10, 20)];

    expect(tirages1).toEqual(tirages2);
    expect(prng1.graine).toBe(prng2.graine);
  });

  it('interopérabilité avec les fonctions directes de src/core/rng.ts', () => {
    const chemin = 'monde/pays/ville/cohorte/individu';
    const seedRoot = 42;

    const prng1 = rngPour(chemin, seedRoot);
    const prng2 = rngPour(chemin, seedRoot);

    // prng1 utilise ses méthodes membres
    const valA1 = prng1.next();
    const valA2 = prng1.int(1, 100);

    // prng2 utilise les fonctions core/rng avec prng2 comme { rng: number }
    const valB1 = rngNext(prng2);
    const valB2 = rngInt(prng2, 1, 100);

    expect(valA1).toBe(valB1);
    expect(valA2).toBe(valB2);
  });

  it('chemins voisins = suites indépendantes et non corrélées', () => {
    const baseSeed = 20200901;

    const p1 = rngPour('monde/france/val_ferrand/jeunes/camille_1', baseSeed);
    const p2 = rngPour('monde/france/val_ferrand/jeunes/camille_2', baseSeed);
    const p3 = rngPour('monde/france/val_ferrand/seniors/camille_1', baseSeed);

    expect(p1.graine).not.toBe(p2.graine);
    expect(p1.graine).not.toBe(p3.graine);

    const tiragesP1 = Array.from({ length: 10 }, () => p1.next());
    const tiragesP2 = Array.from({ length: 10 }, () => p2.next());

    // Les tirages ne doivent pas être identiques
    expect(tiragesP1).not.toEqual(tiragesP2);

    // Test de corrélation minimale : pas de décalage ou valeur trop proche constante
    let diffsEgales = 0;
    for (let i = 0; i < 10; i++) {
      if (Math.abs(tiragesP1[i]! - tiragesP2[i]!) < 0.0001) {
        diffsEgales++;
      }
    }
    expect(diffsEgales).toBeLessThan(2);
  });

  it('exécute 1 million de dérivations en moins d’une seconde', () => {
    const chemin = ['monde_1', 'pays_fr', 'val_ferrand', 'cohorte_2020', 'camille_42'];
    const baseSeed = 123456789;

    const debut = performance.now();

    let acc = 0;
    for (let i = 0; i < 1_000_000; i++) {
      acc ^= deriverGraine(chemin, baseSeed + i);
    }

    const dureeMs = performance.now() - debut;

    expect(typeof acc).toBe('number');
    expect(dureeMs).toBeLessThan(1000);
  });
});

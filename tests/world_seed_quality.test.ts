import { describe, it, expect } from 'vitest';
import { deriverGraine, rngPour } from '../src/simulation/world/seed';

describe('Graines du monde — Qualité des graines hiérarchiques', () => {
  it('100 000 chemins voisins ne produisent aucune graine identique (collision = 0)', () => {
    const grainesUniques = new Set<number>();
    const nbIndividus = 100_000;

    for (let i = 0; i < nbIndividus; i++) {
      const chemin = `monde/pays-0/ville-0/cohorte-0/individu-${i}`;
      const graine = deriverGraine(chemin, 20200901);
      grainesUniques.add(graine);
    }

    expect(grainesUniques.size).toBe(nbIndividus);
  });

  it('les chemins ne différant que par l’ordre ou la concaténation donnent des graines différentes', () => {
    const graineAB = deriverGraine('a/b', 20200901);
    const graineBA = deriverGraine('b/a', 20200901);
    expect(graineAB).not.toBe(graineBA);

    const graineABC = deriverGraine('ab/c', 20200901);
    const graineA_BC = deriverGraine('a/bc', 20200901);
    expect(graineABC).not.toBe(graineA_BC);

    const graineA_B_C = deriverGraine(['a', 'b', 'c'], 20200901);
    const graineAB_C = deriverGraine(['ab', 'c'], 20200901);
    expect(graineA_B_C).not.toBe(graineAB_C);
  });

  it('le premier tirage de 100 000 individus voisins est réparti de manière uniforme (écart max < 5 %)', () => {
    const nbIndividus = 100_000;
    const nbClasses = 10;
    const effectifs = new Array<number>(nbClasses).fill(0);
    const effectifAttendu = nbIndividus / nbClasses;

    for (let i = 0; i < nbIndividus; i++) {
      const prng = rngPour(`monde/pays-0/ville-0/cohorte-0/individu-${i}`, 20200901);
      const premierTirage = prng.next();
      const classe = Math.min(nbClasses - 1, Math.floor(premierTirage * nbClasses));
      effectifs[classe] = (effectifs[classe] ?? 0) + 1;
    }

    for (let c = 0; c < nbClasses; c++) {
      const effectif = effectifs[c] ?? 0;
      const ecartRelatif = Math.abs(effectif - effectifAttendu) / effectifAttendu;
      expect(ecartRelatif).toBeLessThan(0.05);
    }
  });

  it('un même chemin produit exactement la même suite de 20 nombres lors de tirages répétés', () => {
    const chemin = 'monde/pays-3/ville-12/cohorte-1/individu-42';
    const sourceGraine = 20200901;

    const prng1 = rngPour(chemin, sourceGraine);
    const tirages1: number[] = [];
    for (let i = 0; i < 20; i++) {
      tirages1.push(prng1.next());
    }

    const prng2 = rngPour(chemin, sourceGraine);
    const tirages2: number[] = [];
    for (let i = 0; i < 20; i++) {
      tirages2.push(prng2.next());
    }

    expect(tirages1.length).toBe(20);
    expect(tirages2).toEqual(tirages1);
  });
});

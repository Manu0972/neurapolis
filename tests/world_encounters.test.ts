import { describe, it, expect } from 'vitest';
import { mulberry32, rngInt } from '../src/core/rng';
import { biographie } from '../src/simulation/world/person';
import { rencontresPotentielles, profilDeBase } from '../src/simulation/world/encounters';

describe('NEURAPOLIS — Rencontres réciproques entre biographies (src/simulation/world/encounters.ts)', () => {
  it('garantit la réciprocite stricte à 100 % sur 10 000 individus tirés déterministement', () => {
    const prngState = mulberry32(20261010);
    const nombreIndividus = 10000;
    const cheminsTest: string[] = [];

    // Tirage de 10 000 chemins via le PRNG du projet
    for (let i = 0; i < nombreIndividus; i++) {
      const idx = rngInt(prngState, 1, 50000);
      cheminsTest.push(`citoyen_${idx}`);
    }

    let rencontresVerifiees = 0;

    for (const cheminA of cheminsTest) {
      const bioA = biographie(cheminA);

      for (const rencontreA of bioA.rencontres) {
        rencontresVerifiees++;
        const cheminB = rencontreA.cheminPartenaire;
        const bioB = biographie(cheminB);

        // Recherche de la contrepartie chez B
        const contrepartie = bioB.rencontres.find(
          (rB) =>
            rB.cheminPartenaire === cheminA &&
            rB.annee === rencontreA.annee &&
            rB.lieu === rencontreA.lieu &&
            rB.type === rencontreA.type
        );

        expect(contrepartie).toBeDefined();
        if (contrepartie) {
          expect(contrepartie.annee).toBe(rencontreA.annee);
          expect(contrepartie.lieu).toBe(rencontreA.lieu);
          expect(contrepartie.type).toBe(rencontreA.type);
          expect(contrepartie.cheminPartenaire).toBe(cheminA);
        }
      }
    }

    expect(rencontresVerifiees).toBeGreaterThan(1000);
  });

  it('garantit la reproductibilité stricte entre deux appels successifs', () => {
    const chemins = [
      'val_ferrand/quartier_lumiere/ind_12',
      'solaria/habitant_42',
      'citoyen_9999_v1',
    ];

    for (const ch of chemins) {
      const bio1 = biographie(ch);
      const bio2 = biographie(ch);

      expect(bio1.rencontres).toEqual(bio2.rencontres);

      const rPot1 = rencontresPotentielles(ch, 2010);
      const rPot2 = rencontresPotentielles(ch, 2010);
      expect(rPot1).toEqual(rPot2);
    }
  });

  it('respecte les contraintes d\'âge, de vie et de dates pour les mineurs et adultes', () => {
    const prngState = mulberry32(987654321);
    const typesMineursPermis = new Set(['école', 'club', 'voisinage', 'famille']);

    for (let i = 0; i < 500; i++) {
      const idx = rngInt(prngState, 1, 100000);
      const ch = `test_contraintes_${idx}`;
      const bio = biographie(ch);
      const profilA = profilDeBase(ch);

      for (const r of bio.rencontres) {
        // Pas de rencontre avant la naissance ni après le décès
        expect(r.annee).toBeGreaterThanOrEqual(profilA.anneeNaissance);
        expect(r.annee).toBeLessThanOrEqual(profilA.anneeFinVie);

        // Vérification de la santé / espérance du partenaire B
        const profilB = profilDeBase(r.cheminPartenaire);
        expect(r.annee).toBeGreaterThanOrEqual(profilB.anneeNaissance);
        expect(r.annee).toBeLessThanOrEqual(profilB.anneeFinVie);

        // Contrainte d'âge pour les mineurs
        const ageA = r.annee - profilA.anneeNaissance;
        const ageB = r.annee - profilB.anneeNaissance;

        if (ageA < 18 || ageB < 18) {
          expect(typesMineursPermis.has(r.type)).toBe(true);
        }
      }
    }
  });

  it('exécute un benchmark de performance sur 100 000 biographies avec rencontres', () => {
    const count = 100000;
    const start = performance.now();

    let totalRencontres = 0;
    for (let i = 0; i < count; i++) {
      const bio = biographie(`perf_bench_encount_${i}`);
      totalRencontres += bio.rencontres.length;
    }

    const duration = performance.now() - start;
    console.log(`[PERF BENCHMARK] 100 000 biographies générées avec rencontres en ${duration.toFixed(2)} ms (${totalRencontres} rencontres totales).`);

    expect(duration).toBeLessThan(3500);
    expect(totalRencontres).toBeGreaterThan(0);
  });
});

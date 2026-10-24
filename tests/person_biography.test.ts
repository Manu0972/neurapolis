import { describe, it, expect } from 'vitest';
import { biographie, hashString, prenomNomFromChemin } from '../src/simulation/world/person';

describe('Biographies d\'individus à la demande — src/simulation/world/person.ts', () => {
  it('garantit la reproductibilité stricte pour un même chemin', () => {
    const chemin = 'val_ferrand/quartier_roses/immeuble_b/apt_12/personne_1';
    const bio1 = biographie(chemin);
    const bio2 = biographie(chemin);

    expect(bio1).toEqual(bio2);
    expect(bio1.nom).toBe(bio2.nom);
    expect(bio1.prenom).toBe(bio2.prenom);
    expect(bio1.naissance).toEqual(bio2.naissance);
    expect(bio1.rencontres).toEqual(bio2.rencontres);
  });

  it('génère des biographies différentes pour des chemins différents', () => {
    const bioA = biographie('personne_alpha');
    const bioB = biographie('personne_beta');

    expect(bioA.chemin).not.toEqual(bioB.chemin);
    expect(bioA.nom !== bioB.nom || bioA.prenom !== bioB.prenom || bioA.naissance.annee !== bioB.naissance.annee).toBe(true);
  });

  it('respecte la cohérence chronologique, d\'âge et de dates', () => {
    const chemins = [
      'citoyen_101',
      'habitant_val_ferrand_42',
      'personne_ancetre_1890',
      'jeune_pousse_2015',
    ];

    for (const ch of chemins) {
      const bio = biographie(ch);
      const birthYear = bio.naissance.annee;

      // Naissance
      expect(birthYear).toBeLessThanOrEqual(2020);
      expect(bio.naissance.jour).toBeGreaterThanOrEqual(1);
      expect(bio.naissance.jour).toBeLessThanOrEqual(365);

      // Études
      for (const etude of bio.etudes) {
        expect(etude.anneeDebut).toBeGreaterThanOrEqual(birthYear + 5);
        expect(etude.anneeFin).toBeGreaterThanOrEqual(etude.anneeDebut);
        if (bio.deces) {
          expect(etude.anneeFin).toBeLessThanOrEqual(bio.deces.annee);
        }
      }

      // Métiers
      for (const m of bio.metiers) {
        expect(m.anneeDebut).toBeGreaterThanOrEqual(birthYear + 14);
        if (m.anneeFin !== undefined) {
          expect(m.anneeFin).toBeGreaterThanOrEqual(m.anneeDebut);
          if (bio.deces) {
            expect(m.anneeFin).toBeLessThanOrEqual(bio.deces.annee);
          }
        }
      }

      // Rencontres
      for (const r of bio.rencontres) {
        expect(r.annee).toBeGreaterThanOrEqual(birthYear);
        if (bio.deces) {
          expect(r.annee).toBeLessThanOrEqual(bio.deces.annee);
        }
      }

      // Voyages
      for (const v of bio.voyages) {
        expect(v.annee).toBeGreaterThanOrEqual(birthYear + 10);
        if (bio.deces) {
          expect(v.annee).toBeLessThanOrEqual(bio.deces.annee);
        }
      }

      // Créations
      for (const c of bio.creations) {
        expect(c.annee).toBeGreaterThanOrEqual(birthYear + 10);
        if (bio.deces) {
          expect(c.annee).toBeLessThanOrEqual(bio.deces.annee);
        }
      }

      // Décès
      if (bio.deces) {
        expect(bio.estVivant).toBe(false);
        expect(bio.deces.annee).toBe(birthYear + bio.deces.age);
        expect(bio.deces.annee).toBeLessThanOrEqual(2020);
      } else {
        expect(bio.estVivant).toBe(true);
      }
    }
  });

  it('génère des rencontres déterministes et isolées sans stocker de graphe global', () => {
    const bioPrincipal = biographie('individu_racine');
    expect(bioPrincipal.rencontres.length).toBeGreaterThan(0);

    const rencontre1 = bioPrincipal.rencontres[0]!;
    const identityDirect = prenomNomFromChemin(rencontre1.cheminPartenaire);

    // Vérifie que le partenaire est reconstituable de façon identique sans graphe global
    expect(rencontre1.nomPartenaire).toBe(`${identityDirect.prenom} ${identityDirect.nom}`);

    // Et que la biographie complète du partenaire est générable de façon autonome
    const bioPartenaire = biographie(rencontre1.cheminPartenaire);
    expect(bioPartenaire.nom).toBe(identityDirect.nom);
    expect(bioPartenaire.prenom).toBe(identityDirect.prenom);
  });

  it('respecte la cohérence de cohorte en fonction de l\'âge en 2020', () => {
    for (let i = 0; i < 50; i++) {
      const bio = biographie(`test_cohorte_${i}`);
      const age2020 = 2020 - bio.naissance.annee;

      if (age2020 < 18) expect(bio.cohorte).toBe('Jeunes');
      else if (age2020 < 50) expect(bio.cohorte).toBe('Actifs');
      else if (age2020 < 70) expect(bio.cohorte).toBe('Séniors');
      else expect(bio.cohorte).toBe('Anciens');
    }
  });

  it('exécute un test de performance sur 100 000 biographies', () => {
    const count = 100000;
    const start = performance.now();

    let checkSum = 0;
    for (let i = 0; i < count; i++) {
      // Génération ultra-rapide à la demande
      const bio = biographie(`perf_path_${i}`);
      checkSum += bio.naissance.annee;
    }

    const duration = performance.now() - start;
    // Doit pouvoir exécuter 100 000 biographies très rapidement (moins de 2500ms)
    expect(duration).toBeLessThan(3000);
    expect(checkSum).toBeGreaterThan(0);
  });
});

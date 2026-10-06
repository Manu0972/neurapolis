import { describe, it, expect } from 'vitest';
import { STREET_NAMES } from '../src/data/lore/street_names';
import { SHOPKEEPERS } from '../src/data/lore/shopkeepers';
import { PEDESTRIAN_FIRST_NAMES, PEDESTRIAN_LAST_NAMES, generateRandomPedestrianName } from '../src/data/lore/pedestrian_names';
import { WORLD_TIMELINE } from '../src/data/lore/world_timeline';

describe('Lore de Val-Ferrand (A-3 Suite de tests)', () => {
  describe('STREET_NAMES (30 rues)', () => {
    it('doit contenir au moins 30 rues et voies uniques', () => {
      expect(STREET_NAMES.length).toBeGreaterThanOrEqual(30);
      const ids = STREET_NAMES.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(STREET_NAMES.length);
    });

    it('chaque rue possède un nom, un quartier valide et une description', () => {
      for (const street of STREET_NAMES) {
        expect(street.name.trim().length).toBeGreaterThan(0);
        expect(street.description.trim().length).toBeGreaterThan(10);
        expect(['cite_des_roses', 'centre_marche', 'friche_industrielle', 'rives_canal', 'zone_hyperval']).toContain(street.district);
      }
    });
  });

  describe('SHOPKEEPERS (25 commerçants)', () => {
    it('doit contenir au moins 25 commerçants avec identifiants uniques', () => {
      expect(SHOPKEEPERS.length).toBeGreaterThanOrEqual(25);
      const ids = SHOPKEEPERS.map((s) => s.id);
      expect(new Set(ids).size).toBe(SHOPKEEPERS.length);
    });

    it('chaque commerçant référence une rue existante et un secret cohérent', () => {
      const validStreetIds = new Set(STREET_NAMES.map((s) => s.id));
      for (const sk of SHOPKEEPERS) {
        expect(sk.name.trim().length).toBeGreaterThan(0);
        expect(sk.shopName.trim().length).toBeGreaterThan(0);
        expect(sk.age).toBeGreaterThanOrEqual(18);
        expect(validStreetIds.has(sk.streetId)).toBe(true);
        expect(sk.greetingPhrase.trim().length).toBeGreaterThan(5);
        expect(sk.secretOrStake.trim().length).toBeGreaterThan(15);
      }
    });
  });

  describe('PEDESTRIAN_NAMES (Passants de la ville 3D)', () => {
    it('doit fournir au moins 60 prénoms et 60 noms distincts', () => {
      expect(PEDESTRIAN_FIRST_NAMES.length).toBeGreaterThanOrEqual(60);
      expect(PEDESTRIAN_LAST_NAMES.length).toBeGreaterThanOrEqual(60);
    });

    it('le générateur aléatoire déterministe produit des noms valides', () => {
      const p1 = generateRandomPedestrianName(0);
      const p2 = generateRandomPedestrianName(1);
      expect(p1.fullName).not.toBe(p2.fullName);
      expect(p1.firstName.length).toBeGreaterThan(0);
      expect(p1.lastName.length).toBeGreaterThan(0);
    });
  });

  describe('WORLD_TIMELINE (Chronologie 2020-2045)', () => {
    it('doit couvrir au minimum de 2020 à 2045 avec ordre chronologique', () => {
      expect(WORLD_TIMELINE.length).toBeGreaterThanOrEqual(10);
      expect(WORLD_TIMELINE[0]!.year).toBe(2020);
      expect(WORLD_TIMELINE[WORLD_TIMELINE.length - 1]!.year).toBe(2045);

      for (let i = 1; i < WORLD_TIMELINE.length; i++) {
        const prev = WORLD_TIMELINE[i - 1]!;
        const curr = WORLD_TIMELINE[i]!;
        const prevScore = prev.year * 100 + prev.month;
        const currScore = curr.year * 100 + curr.month;
        expect(currScore).toBeGreaterThanOrEqual(prevScore);
      }
    });

    it('chaque événement inclut un contexte local pour Val-Ferrand et des effets macro', () => {
      for (const evt of WORLD_TIMELINE) {
        expect(evt.title.trim().length).toBeGreaterThan(5);
        expect(evt.localContextValFerrand.trim().length).toBeGreaterThan(10);
        expect(evt.macroEffectSuggestion).toBeDefined();
      }
    });
  });
});

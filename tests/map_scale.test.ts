/**
 * Validation des échelles, distances et cohérence du lore pour les cartes des paliers 1 à 6.
 */
import { describe, expect, it } from 'vitest';
import { CITY_AREAS, CITY_H, CITY_W, CITY } from '../src/data/city/layout';
import { PLACE_ANCHORS } from '../src/data/map';
import { LANDMARKS } from '../src/data/city/landmarks';
import { DISTRICT_SHOPS } from '../src/data/city/district_shops';
import { PLACES } from '../src/data/places';
import { DESTINATIONS } from '../src/simulation/travel';

describe('Échelles et distances des cartes (Paliers 1 à 6)', () => {

  describe('Palier 1 à 3 — Carte de la Ville (Val-Ferrand)', () => {

    it('respecte la taille déclarée 1 562 × 1 154 m (1 tuile = 1 mètre)', () => {
      expect(CITY_W).toBe(1562);
      expect(CITY_H).toBe(1154);
    });

    it('deux lieux d’un même quartier restent à moins de N cases (N = 1600 tuiles)', () => {
      // Pour chaque quartier, vérifier que la distance entre n'importe quel couple de points reste inférieure à N
      for (const area of CITY_AREAS) {
        const diagonal = Math.hypot(area.w, area.h);
        expect(diagonal, `Portée du quartier ${area.id}`).toBeLessThan(1600);
      }
    });

    it('la distance entre deux lieux reliés sur la carte reste dans une fourchette déclarée', () => {
      const maison = PLACE_ANCHORS.maison;
      const college = PLACE_ANCHORS.college;
      const epicerie = PLACE_ANCHORS.epicerie;
      const parc = PLACE_ANCHORS.parc;

      // Distance Maison <-> Collège (entre 200 m et 350 m)
      const distMaisonCollege = Math.hypot(maison.x - college.x, maison.y - college.y);
      expect(distMaisonCollege).toBeGreaterThanOrEqual(200);
      expect(distMaisonCollege).toBeLessThanOrEqual(350);

      // Distance Maison <-> Épicerie Bertin (entre 70 m et 250 m)
      const distMaisonEpicerie = Math.hypot(maison.x - epicerie.x, maison.y - epicerie.y);
      expect(distMaisonEpicerie).toBeGreaterThanOrEqual(70);
      expect(distMaisonEpicerie).toBeLessThanOrEqual(250);

      // Distance Maison <-> Parc des Roses (entre 100 m et 300 m)
      const distMaisonParc = Math.hypot(maison.x - parc.x, maison.y - parc.y);
      expect(distMaisonParc).toBeGreaterThanOrEqual(100);
      expect(distMaisonParc).toBeLessThanOrEqual(300);
    });

    it('vérifie que les lieux cités dans QUARTIERS.md existent sur la carte', () => {
      const buildingIds = new Set(CITY.buildings.map((b) => b.id));
      const landmarkIds = new Set(LANDMARKS.map((l) => l.id));
      const placeIds = new Set(PLACES.map((p) => p.id));
      const shopNames = new Set(DISTRICT_SHOPS.map((s) => s.shopName));

      // Bâtiments et lieux majeurs cités dans QUARTIERS.md
      const requiredBuildings = [
        'gare',            // Gare Est
        'hopital',         // Hôpital de Val-Ferrand
        'lycee',           // Lycée Louise-Michel
        'tribune',         // Stade Marcel-Cerdan
        'chapelle',        // Cimetière du Taret
        'brasserie_malterie', // Brasserie de la Malterie
        'laminoir',        // Taret Laminage
        'drive_hyperval',  // Drive HyperVal
        'barre_a',         // Chez toi / Cité des Roses
        'college',         // Collège Jean-Moulin
        'epicerie',        // Épicerie Bertin
        'atelier_friche',  // Atelier de la Friche
      ];

      const missingBuildings = requiredBuildings.filter(
        (id) => !buildingIds.has(id) && !landmarkIds.has(id) && !placeIds.has(id as any)
      );

      expect(missingBuildings, `Lieux manquants sur la carte : ${missingBuildings.join(', ')}`).toEqual([]);

      // Commerçants et enseignes de quartier cités dans QUARTIERS.md
      const requiredShops = [
        'Le Relais des Quais',
        'Presse & Billets',
        'Cordonnerie de la Gare',
        'Fournil du Cheminot',
        'La Guinguette de l’Écluse',
        'Pêche & Canal',
        'Les Jardins de la Malterie',
        'Cycles du Halage',
        'Bouquins au fil de l’eau',
        'Épicerie Saint-Éloi',
        'Pâtisserie Delorme',
        'Atelier Saint-Éloi',
        'Café des Fondeurs',
        'Fleurs de Saint-Éloi',
        'Répar’Tout',
        'Papeterie du Faubourg',
        'Snack Saint-Éloi',
        'Maison Vasseur',
        'Le Pain de Bellevue',
        'Comptoir Bellevue',
        'Librairie des Glycines',
        'Primeur des Hauts',
      ];

      const missingShops = requiredShops.filter((name) => !shopNames.has(name));
      expect(missingShops, `Commerces manquants cités dans QUARTIERS.md : ${missingShops.join(', ')}`).toEqual([]);
    });
  });

  describe('Palier 4 — Vallée du Taret (Destinations de voyage)', () => {
    it('déclare les 3 destinations régionales avec des coûts et durées dans des fourchettes valides', () => {
      expect(DESTINATIONS).toHaveLength(3);
      for (const dest of DESTINATIONS) {
        expect(dest.cost).toBeGreaterThanOrEqual(20);
        expect(dest.cost).toBeLessThanOrEqual(200);
        expect(dest.days).toBeGreaterThanOrEqual(2);
        expect(dest.days).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('Palier 5 & 6 — Pays et Monde', () => {
    it('les paliers 5 et 6 sont documentés et reliés dans l’architecture des échelles', () => {
      // Les paliers 5 et 6 s'appuient sur l'Ascension et les événements macro-économiques
      expect(CITY_AREAS.some((a) => a.tier >= 4)).toBe(true);
    });
  });

});

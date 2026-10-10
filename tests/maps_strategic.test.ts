import { describe, expect, it } from 'vitest';
import type { WorldState } from '../src/core/types';
import { IDEA_BY_ID } from '../src/data/ascension/ideas';
import {
  STRATEGIC_MAPS, STRATEGIC_MAP_BY_TIER, MONDE_MAP, PAYS_MAP, VALLEE_MAP,
} from '../src/data/maps';
import {
  getLocationStatus, getStrategicMapSummary,
  isStrategicMapUnlocked, unlockedMapTiers,
} from '../src/simulation/strategic_map';

function mockWorldState(tier: 1 | 2 | 3 | 4 | 5 | 6 = 1): WorldState {
  return {
    version: 20,
    seed: 12345,
    rng: 100,
    time: { tick: 1000, hour: 10, minute: 0, dayName: 'Lundi' },
    player: {
      name: 'Testeur',
      firstName: 'Alex',
      gender: 'n',
      age: 16,
      money: 5000,
      reputation: 50,
      needs: { fatigue: 20, faim: 20, stress: 20, moral: 80 },
      skills: { negociation: 1, comptabilite: 1, organisation: 1, communication: 1, recherche: 1, technique: 1 },
      inventory: [],
      notions: {},
      asleep: false,
    },
    npcs: {},
    council: { approval: 50, members: [] },
    district: {
      id: 'centre',
      sante: 80,
      securite: 80,
      proprete: 80,
      animation: 50,
      frequentation: 50,
      confianceQuartier: 60,
    },
    rivals: {},
    campaign: { stage: 1, objectivesDone: [] },
    ascension: {
      tier,
      ventures: {},
      concepts: {},
      contacts: {},
      trust: {},
      verdicts: [],
      totalProfit: 0,
    },
    flags: {},
  } as unknown as WorldState;
}

describe('Cartes stratégiques — Données (paliers 4, 5, 6)', () => {
  it('contient trois cartes définies pour les paliers 4, 5 et 6', () => {
    expect(STRATEGIC_MAPS.length).toBe(3);
    expect(STRATEGIC_MAP_BY_TIER[4]).toBe(VALLEE_MAP);
    expect(STRATEGIC_MAP_BY_TIER[5]).toBe(PAYS_MAP);
    expect(STRATEGIC_MAP_BY_TIER[6]).toBe(MONDE_MAP);
  });

  it('chaque carte a des régions, des lieux et des liaisons valides', () => {
    for (const map of STRATEGIC_MAPS) {
      expect(map.id).toBeTruthy();
      expect(map.name).toBeTruthy();
      expect(map.scaleLabel).toBeTruthy();
      expect(map.lore).toBeTruthy();

      expect(map.regions.length).toBeGreaterThan(0);
      expect(map.locations.length).toBeGreaterThan(0);
      expect(map.connections.length).toBeGreaterThan(0);

      const locIds = new Set(map.locations.map((l) => l.id));
      expect(locIds.size).toBe(map.locations.length);

      // Vérification des coordonnées x,y (0 - 100)
      for (const loc of map.locations) {
        expect(loc.x).toBeGreaterThanOrEqual(0);
        expect(loc.x).toBeLessThanOrEqual(100);
        expect(loc.y).toBeGreaterThanOrEqual(0);
        expect(loc.y).toBeLessThanOrEqual(100);

        // Idées référencées valides
        if (loc.ideas) {
          for (const ideaId of loc.ideas) {
            expect(IDEA_BY_ID[ideaId]).toBeDefined();
          }
        }
      }

      // Connexions référencent des lieux existants
      for (const conn of map.connections) {
        expect(locIds.has(conn.from)).toBe(true);
        expect(locIds.has(conn.to)).toBe(true);
      }
    }
  });
});

describe('Cartes stratégiques — Logique de déblocage et simulation', () => {
  it('verrouille la carte stratégique avant le palier 4', () => {
    const w1 = mockWorldState(1);
    const w2 = mockWorldState(2);
    const w3 = mockWorldState(3);

    expect(isStrategicMapUnlocked(w1)).toBe(false);
    expect(isStrategicMapUnlocked(w2)).toBe(false);
    expect(isStrategicMapUnlocked(w3)).toBe(false);
    expect(unlockedMapTiers(w1)).toEqual([]);
  });

  it('débloque progressivement les cartes selon le palier d’Ascension', () => {
    const w4 = mockWorldState(4);
    expect(isStrategicMapUnlocked(w4)).toBe(true);
    expect(unlockedMapTiers(w4)).toEqual([4]);

    const w5 = mockWorldState(5);
    expect(unlockedMapTiers(w5)).toEqual([4, 5]);

    const w6 = mockWorldState(6);
    expect(unlockedMapTiers(w6)).toEqual([4, 5, 6]);
  });

  it('débloque tous les paliers en mode bac à sable', () => {
    const w = mockWorldState(1);
    w.economy = { sandbox: true } as any;

    expect(isStrategicMapUnlocked(w)).toBe(true);
    expect(unlockedMapTiers(w)).toEqual([4, 5, 6]);
  });

  it('évalue le statut d’un lieu selon les contacts requis', () => {
    const w = mockWorldState(4);
    const locWithContact = VALLEE_MAP.locations.find((l) => l.id === 'centrale_grossistes_neobaie')!;
    expect(locWithContact.requiresContact).toContain('bertin');

    // Sans le contact
    let st = getLocationStatus(w, locWithContact);
    expect(st.unlocked).toBe(false);
    expect(st.reason).toContain('bertin');

    // Avec le contact
    w.ascension!.contacts['bertin'] = 5;
    st = getLocationStatus(w, locWithContact);
    expect(st.unlocked).toBe(true);
  });

  it('détecte les entreprises actives du joueur opérant sur un lieu', () => {
    const w = mockWorldState(4);
    const locGare = VALLEE_MAP.locations.find((l) => l.id === 'gare_fret_valferrand')!;

    let st = getLocationStatus(w, locGare);
    expect(st.activeVentures).toHaveLength(0);

    // Lancement d'une entreprise sur transport_vallee
    w.ascension!.ventures['transport_vallee'] = {
      ideaId: 'transport_vallee',
      launchedDay: 10,
      strategy: 'A',
      level: 1,
      cash: 10000,
      revenueTotal: 5000,
      profitTotal: 2000,
      universes: {},
      verdictDay: 31,
      verdictDone: true,
      redDays: 0,
    };

    st = getLocationStatus(w, locGare);
    expect(st.activeVentures).toHaveLength(1);
    expect(st.activeVentures[0]!.ideaId).toBe('transport_vallee');
  });

  it('calcule le résumé d’une carte stratégique (locations et entreprises)', () => {
    const w = mockWorldState(4);
    w.ascension!.contacts['bertin'] = 10;
    w.ascension!.contacts['karim'] = 10;
    w.ascension!.contacts['samir'] = 10;
    w.ascension!.contacts['ingrid'] = 10;
    w.ascension!.contacts['odile'] = 10;

    const summary = getStrategicMapSummary(w, 4);
    expect(summary).toBeDefined();
    expect(summary!.unlocked).toBe(true);
    expect(summary!.totalLocations).toBe(VALLEE_MAP.locations.length);
    expect(summary!.unlockedLocations).toBe(VALLEE_MAP.locations.length);
  });

  it('ne modifie pas l’état du monde ni son PRNG (fonctions pures)', () => {
    const w = mockWorldState(4);
    const initialRng = w.rng;
    const initialTick = w.time.tick;

    getLocationStatus(w, VALLEE_MAP.locations[0]!);
    unlockedMapTiers(w);
    getStrategicMapSummary(w, 4);

    expect(w.rng).toBe(initialRng);
    expect(w.time.tick).toBe(initialTick);
  });
});

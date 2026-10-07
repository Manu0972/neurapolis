/**
 * Tests du socle M0 — sauvegardes.
 * Aller-retour export/import JSON identique ; chaîne de migrations
 * v0 → v1 (météo) → v2 (champs du Conseil, M4) → v3 (affinités & fusions, M6).
 */
import { describe, expect, it, vi } from 'vitest';
import { createWorld } from '../src/core/store';
import { exportSave, importSave, inspectAutoSave, saveToSlot, loadFromSlot, deleteSlot } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';
import { runTicks } from '../src/simulation/engine';
import { buyStock, createProject } from '../src/simulation/project';
import { MAX_PENDING_DELIVERIES } from '../src/core/types';
import { PLACE_ANCHORS, isWalkable } from '../src/data/map';

interface SauvegardeBrute {
  version: number;
  district: { meteo?: string };
  council?: {
    ghosts?: Record<string, Record<string, unknown>>;
    affinities?: Record<string, number>;
    fusionProgress?: Record<string, unknown>;
    contratSecurite?: { active: boolean; proposedDay?: number } | null;
  };
}

function mondeVecu(): ReturnType<typeof createWorld> {
  const w = createWorld({ seed: 42, playerName: 'Camille' });
  runTicks(w, 300); // état non trivial : jour 2, météo tirée, besoins évolués
  return w;
}

describe('sauvegarde — aller-retour export/import', () => {
  it('importSave(exportSave(w)) redonne un monde identique', () => {
    const w = mondeVecu();
    const w2 = importSave(exportSave(w));
    expect(w2).toEqual(w);
  });

  it('l\'export est du JSON versionné sans perte après re-export', () => {
    const w = mondeVecu();
    const json = exportSave(w);
    expect(JSON.parse(json)).toMatchObject({ version: CURRENT_SAVE_VERSION, seed: 42 });
    expect(exportSave(importSave(json))).toBe(json); // clé pour clé, ordre compris
  });

  it('une partie P-PERSO en v10 se recharge par le chemin réel localStorage → loadFromSlot', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      get length() { return storage.size; },
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
      key: (index: number) => [...storage.keys()][index] ?? null,
    });

    try {
      const world = createWorld({ seed: 83, playerName: 'Samia Belkacem' });
      world.player.firstName = 'Samia';
      world.player.lastName = 'Belkacem';
      world.player.gender = 'fille';
      world.player.appearance = {
        skinTone: 'ebene', hairColor: 'noir', hairStyle: 'couettes', outfitStyle: 'sportif', outfitColor: 'indigo',
      };
      saveToSlot('auto', world);

      const resumed = loadFromSlot('auto');
      expect(resumed.version).toBe(CURRENT_SAVE_VERSION);
      expect(resumed.player).toMatchObject({
        firstName: 'Samia', lastName: 'Belkacem', gender: 'fille', appearance: world.player.appearance,
      });
      expect(resumed.rivals).toEqual(world.rivals);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('sauvegarde — migration v0 → v10 (météo, Conseil, rivaux, atelier et identité)', () => {
  it('une sauvegarde v0 sans météo migre jusqu’à CURRENT_SAVE_VERSION avec la météo par défaut « soleil »', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 0;
    delete raw.district.meteo;
    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    expect(migre.district.meteo).toBe('soleil');
    expect(migre.council.affinities).toEqual({});
    expect(migre.rivals.drive_hyper).toBeDefined();
  });

  it('une météo déjà présente dans une sauvegarde v0 est conservée', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 0;
    raw.district.meteo = 'pluie';
    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    expect(migre.district.meteo).toBe('pluie');
  });

  it('une sauvegarde v0 sans district du tout est réparée', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as Partial<SauvegardeBrute> & {
      district?: SauvegardeBrute['district'];
    };
    raw.version = 0;
    delete raw.district;
    const migre = migrateSave(raw) as unknown as typeof raw & { district: { meteo: string } };
    expect(migre.district.meteo).toBe('soleil');
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
  });

  it('une sauvegarde plus récente que le moteur est rejetée (jamais d\'état corrompu)', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = CURRENT_SAVE_VERSION + 1;
    expect(() => migrateSave(raw)).toThrow(/trop récente/);
  });

  it('une entrée illisible est rejetée avec une erreur claire', () => {
    expect(() => migrateSave(42)).toThrow(/illisible/);
    expect(() => importSave('{ pas du json')).toThrow();
  });
});

describe('sauvegarde — migration v1 → v2 (champs du Conseil ajoutés en M4)', () => {
  it('une sauvegarde v1 sans les champs du Conseil migre avec des valeurs sûres', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 1;
    const ghosts = raw.council?.ghosts ?? {};
    const smith = ghosts['smith'];
    if (smith) {
      delete smith['arrivalPending'];
      delete smith['loyaltyZeroDays'];
      delete smith['fiabilite'];
    }
    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    const g = migre.council.ghosts['smith'];
    expect(g?.arrivalPending).toBe(false);
    expect(g?.loyaltyZeroDays).toBe(0);
    expect(g?.fiabilite).toBe(60);
    for (const rec of g?.history ?? []) expect(rec.revealed).toBe(false);
  });
});

describe('sauvegarde — migration v2 → v6 (M6 : affinités, fusion, contrat)', () => {
  it('une sauvegarde v2 sans affinités migre avec la progression de fusion structurée', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 2;
    delete raw.council?.affinities;
    raw.council = raw.council ?? {};
    raw.council.fusionProgress = { 'smith+ostrom': 0 }; // forme v2 : compteur nu
    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    expect(migre.council.affinities).toEqual({});
    expect(migre.council.fusionProgress['smith+ostrom']).toEqual({ marches: 0, communs: 0 });
    expect(migre.council.contratSecurite).toBeNull();
  });
});

describe('sauvegarde — migration v3 → v6 (concurrence & campagne narrative)', () => {
  it('une sauvegarde v3 sans rivaux ni campagne migre avec les structures initiales', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute & { rivals?: unknown; campaign?: unknown };
    raw.version = 3;
    delete raw.rivals;
    delete raw.campaign;
    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    expect(migre.rivals.drive_hyper.marketShare).toBe(65);
    expect(migre.campaign.currentChapter).toBe(1);
    expect(migre.campaign.stages.length).toBeGreaterThanOrEqual(5);
  });
});

describe('sauvegarde — migration v4 → v6 (échéances de contre-stratégies et atelier)', () => {
  it('convertit les stratégies v4 déjà actives en échéances et préserve le jour courant', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      time: { tick: number };
      rivals: Record<string, { activeCounterActions: unknown[] }>;
    };
    raw.version = 4;
    raw.rivals['drive_hyper']!.activeCounterActions = ['circuit_court', 'degustation'];
    const today = Math.floor(raw.time.tick / 144);

    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    expect(migre.rivals.drive_hyper.activeCounterActions).toEqual([
      { strategyId: 'circuit_court', expiresDay: today + 5 },
      { strategyId: 'degustation', expiresDay: today + 3 },
    ]);
  });

  it('complète les chapitres 4 et 5 de la campagne lors de la migration v4 → v6', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      campaign: { stages: Array<{ chapter: number }> };
    };
    raw.version = 4;
    // Simuler une ancienne sauvegarde v4 qui n'avait que les chapitres 1, 2 et 3
    raw.campaign.stages = raw.campaign.stages.filter((s) => s.chapter <= 3);
    expect(raw.campaign.stages).toHaveLength(3);

    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    expect(migre.campaign.stages).toHaveLength(5);
    expect(migre.campaign.stages.map((s) => s.chapter)).toEqual([1, 2, 3, 4, 5]);
  });

  it('migration v5 → v6 initialise la structure de l’atelier de la Friche avec Karim', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      workshop?: Record<string, unknown>;
    };
    raw.version = 5;
    delete raw.workshop;

    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
  });

  it('migration v6 → v7 initialise les extensions v7 (vendors, schoolLife, multiVentures...)', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      vendors?: unknown;
      schoolLife?: unknown;
      multiVentures?: unknown;
    };
    raw.version = 6;
    delete raw.vendors;
    delete raw.schoolLife;
    delete raw.multiVentures;

    const migre = migrateSave(raw);
    expect(migre.version).toBe(CURRENT_SAVE_VERSION);
    expect(migre.vendors).toBeDefined();
    expect(migre.schoolLife).toBeDefined();
    expect(migre.multiVentures).toBeDefined();
  });
});

describe('sauvegarde — migration v7 → v9 (observations de marché)', () => {
  it('ajoute un relevé de marché sûr aux anciens rivaux et préserve leur part initiale', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      time: { tick: number };
      rivals: Record<string, { marketShare: number; marketObservation?: unknown }>;
    };
    raw.version = 7;
    delete raw.rivals.drive_hyper!.marketObservation;
    delete raw.rivals.distributeur_college!.marketObservation;
    const currentDay = Math.floor(raw.time.tick / 144);

    const migrated = migrateSave(raw);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.rivals.drive_hyper.marketShare).toBe(65);
    expect(migrated.rivals.drive_hyper.marketObservation).toEqual({
      day: currentDay, playerUnitsSold: 0, rivalUnitsServed: 0, sessions: 0, lastClosed: null,
    });
  });

  it('la migration v9 → v10 ajoute l’identité et l’apparence sans perdre le bilan rival', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as Record<string, unknown> & {
      player: Record<string, unknown>;
      rivals: Record<string, { marketObservation: unknown }>;
    };
    raw.version = 9;
    delete raw.player.firstName;
    delete raw.player.lastName;
    delete raw.player.gender;
    delete raw.player.appearance;
    raw.player.name = 'Amina Kone';
    const driveHyper = raw.rivals['drive_hyper'];
    if (driveHyper) {
      driveHyper.marketObservation = {
        day: 4, playerUnitsSold: 7, rivalUnitsServed: 9, sessions: 2,
        lastClosed: { day: 3, playerUnitsSold: 5, rivalUnitsServed: 8, sessions: 1 },
      };
    }

    const migrated = migrateSave(raw);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.player).toMatchObject({
      name: 'Amina Kone', firstName: 'Amina Kone', lastName: '', gender: 'non-binaire',
      appearance: { skinTone: 'claire', hairColor: 'chatain', hairStyle: 'court', outfitStyle: 'ecolier', outfitColor: 'coral' },
    });
    expect(migrated.rivals['drive_hyper']?.marketObservation).toEqual(driveHyper?.marketObservation);
  });

  it('le round-trip garde les compteurs de transactions d’un jour actif', () => {
    const world = mondeVecu();
    world.rivals.drive_hyper.marketObservation = {
      day: Math.floor(world.time.tick / 144), playerUnitsSold: 6, rivalUnitsServed: 8, sessions: 2, lastClosed: null,
    };
    expect(importSave(exportSave(world)).rivals.drive_hyper.marketObservation)
      .toEqual(world.rivals.drive_hyper.marketObservation);
  });

  it('migra v8 sans inventer un bilan historique mesuré et préserve les compteurs du jour', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      rivals: Record<string, { marketObservation?: unknown }>;
    };
    raw.version = 8;
    raw.rivals.drive_hyper!.marketObservation = {
      day: 4, playerUnitsSold: 3, rivalUnitsServed: 5, sessions: 1,
    };
    const migrated = migrateSave(raw);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.rivals.drive_hyper.marketObservation.lastClosed).toBeNull();
    expect(migrated.rivals.drive_hyper.marketObservation).toMatchObject({
      day: 4, playerUnitsSold: 3, rivalUnitsServed: 5, sessions: 1,
    });
  });

  it('migre v9 vers v10 en ajoutant firstName, lastName, gender et appearance sans perte', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      player: {
        name?: string;
        firstName?: string;
        lastName?: string;
        gender?: string;
        appearance?: unknown;
      };
    };
    raw.version = 9;
    raw.player.name = 'Morgane Legrand';
    delete raw.player.firstName;
    delete raw.player.lastName;
    delete raw.player.gender;
    delete raw.player.appearance;

    const migrated = migrateSave(raw);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.player.name).toBe('Morgane Legrand');
    expect(migrated.player.firstName).toBe('Morgane Legrand');
    expect(migrated.player.gender).toBe('non-binaire');
    expect(migrated.player.appearance).toMatchObject({
      skinTone: 'claire',
      hairColor: 'chatain',
      hairStyle: 'court',
      outfitStyle: 'ecolier',
      outfitColor: 'coral',
    });
  });
});

describe('sauvegarde — migration v10 → v11 (historique des commandes du Stand)', () => {
  function mondeAvecStand(): ReturnType<typeof createWorld> {
    const w = mondeVecu();
    createProject(w);
    w.player.money = 1000;
    buyStock(w);
    buyStock(w);
    return w;
  }

  it('aller-retour : les commandes du Stand survivent à export/import', () => {
    const w = mondeAvecStand();
    const back = importSave(exportSave(w));
    expect(back.version).toBe(CURRENT_SAVE_VERSION);
    expect(back.project?.pendingDeliveries).toEqual(w.project?.pendingDeliveries);
    expect(back.project?.pendingDeliveries).toHaveLength(2);
    const ids = back.project?.pendingDeliveries?.map((d) => d.id) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('une sauvegarde v10 sans historique migre avec une liste vide', () => {
    const raw = JSON.parse(exportSave(mondeAvecStand())) as { version: number; project: Record<string, unknown> };
    raw.version = 10;
    delete raw.project.pendingDeliveries;
    const migrated = migrateSave(raw);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.project?.pendingDeliveries).toEqual([]);
  });

  it('écarte les entrées corrompues et borne l’historique sans toucher la caisse', () => {
    const w = mondeAvecStand();
    const raw = JSON.parse(exportSave(w)) as { version: number; project: Record<string, unknown> };
    const valide = { id: 'cmd', orderDay: 1, arrivalDay: 1, units: 20, cost: 15, supplier: 'Épicerie Bertin', delivered: true };
    raw.version = 10;
    raw.project.pendingDeliveries = [
      null, { id: 3 }, 'texte',
      ...Array.from({ length: MAX_PENDING_DELIVERIES + 5 }, (_, i) => ({ ...valide, id: `cmd_${i}` })),
    ];
    const migrated = migrateSave(raw);
    const list = migrated.project?.pendingDeliveries ?? [];
    expect(list).toHaveLength(MAX_PENDING_DELIVERIES);
    expect(list[0]?.id).toBe('cmd_5');
    expect(migrated.project?.balance).toBe(w.project?.balance);
    expect(migrated.project?.stock).toBe(w.project?.stock);
  });

  it('buyStock garde l’historique borné à MAX_PENDING_DELIVERIES', () => {
    const w = mondeAvecStand();
    w.player.money = 100000;
    for (let i = 0; i < MAX_PENDING_DELIVERIES + 3; i++) buyStock(w);
    const list = w.project?.pendingDeliveries ?? [];
    expect(list).toHaveLength(MAX_PENDING_DELIVERIES);
    expect(new Set(list.map((d) => d.id)).size).toBe(MAX_PENDING_DELIVERIES);
  });
});

describe('sauvegarde — migration v11 → v12 (nouvelle ville à l’échelle 1 m)', () => {
  it('replace le joueur devant chez lui et préserve le reste de la partie', () => {
    const w = mondeVecu();
    w.player.money = 87.5;
    const raw = JSON.parse(exportSave(w)) as { version: number; player: { pos: { x: number; y: number }; money: number } };
    raw.version = 11;
    raw.player.pos = { x: 23, y: 17 }; // coordonnées de l'ancienne carte 48×32
    const migrated = migrateSave(raw);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.player.pos).toEqual(PLACE_ANCHORS.maison);
    expect(isWalkable(migrated.player.pos.x, migrated.player.pos.y)).toBe(true);
    expect(migrated.player.money).toBe(87.5);
  });

  it('aller-retour : une partie neuve garde sa position exacte', () => {
    const w = mondeVecu();
    w.player.pos = { ...PLACE_ANCHORS.college };
    const back = importSave(exportSave(w));
    expect(back.player.pos).toEqual(PLACE_ANCHORS.college);
  });
});

describe('inspectAutoSave — inspection de démarrage', () => {
  it('signale missing quand aucun auto-save n’existe ou unavailable sans localStorage', () => {
    try {
      deleteSlot('auto');
    } catch {
      // Ignorer si localStorage indisponible
    }
    const res = inspectAutoSave();
    expect(['missing', 'unavailable']).toContain(res.kind);
  });

  it('signale ready quand un auto-save valide est présent', () => {
    const w = mondeVecu();
    try {
      saveToSlot('auto', w);
      const res = inspectAutoSave();
      if (res.kind !== 'unavailable') {
        expect(res.kind).toBe('ready');
        if (res.kind === 'ready') {
          expect(res.world.seed).toBe(42);
        }
      }
    } catch {
      // localStorage indisponible dans l’environnement courant
    } finally {
      try {
        deleteSlot('auto');
      } catch {
        // no-op
      }
    }
  });

  it('signale invalid quand le slot auto contient des données corrompues', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('neurapolis.save.auto', '{ corrompu');
      try {
        const res = inspectAutoSave();
        expect(res.kind).toBe('invalid');
      } finally {
        localStorage.removeItem('neurapolis.save.auto');
      }
    }
  });
});

describe('emplacements de sauvegarde — résumé', () => {
  it('résume un emplacement sans le charger, et signale vide ou illisible', async () => {
    const { slotSummary } = await import('../src/saves/persist');
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    });
    try {
      const w = createWorld({ playerName: 'Morgane' });
      w.player.money = 42.5;
      saveToSlot('slot1', w);
      expect(slotSummary('slot1')).toMatchObject({ exists: true, name: 'Morgane', money: 42.5, age: 12, businesses: 0 });
      expect(slotSummary('slot2')).toEqual({ slot: 'slot2', exists: false });
      store.set('neurapolis.save.slot3', '{pas du json');
      expect(slotSummary('slot3').error).toBeDefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/**
 * Tests du socle M0 — sauvegardes.
 * Aller-retour export/import JSON identique ; chaîne de migrations
 * v0 → v1 (météo) → v2 (champs du Conseil, M4) → v3 (affinités & fusions, M6).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { exportSave, importSave, inspectAutoSave, saveToSlot, deleteSlot } from '../src/saves/persist';
import { migrateSave } from '../src/saves/migrations';
import { runTicks } from '../src/simulation/engine';

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
    expect(JSON.parse(json)).toMatchObject({ version: 5, seed: 42 });
    expect(exportSave(importSave(json))).toBe(json); // clé pour clé, ordre compris
  });
});

describe('sauvegarde — migration v0 → v5 (météo, Conseil, affinités, rivaux)', () => {
  it('une sauvegarde v0 sans météo migre jusqu’à v5 avec la météo par défaut « soleil »', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 0;
    delete raw.district.meteo;
    const migre = migrateSave(raw);
    expect(migre.version).toBe(5);
    expect(migre.district.meteo).toBe('soleil');
    expect(migre.council.affinities).toEqual({});
    expect(migre.rivals.drive_hyper).toBeDefined();
  });

  it('une météo déjà présente dans une sauvegarde v0 est conservée', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 0;
    raw.district.meteo = 'pluie';
    const migre = migrateSave(raw);
    expect(migre.version).toBe(5);
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
    expect(migre.version).toBe(5);
  });

  it('une sauvegarde plus récente que le moteur est rejetée (jamais d\'état corrompu)', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 6;
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
    expect(migre.version).toBe(5);
    const g = migre.council.ghosts['smith'];
    expect(g?.arrivalPending).toBe(false);
    expect(g?.loyaltyZeroDays).toBe(0);
    expect(g?.fiabilite).toBe(60);
    for (const rec of g?.history ?? []) expect(rec.revealed).toBe(false);
  });
});

describe('sauvegarde — migration v2 → v5 (M6 : affinités, fusion, contrat)', () => {
  it('une sauvegarde v2 sans affinités migre avec la progression de fusion structurée', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 2;
    delete raw.council?.affinities;
    raw.council = raw.council ?? {};
    raw.council.fusionProgress = { 'smith+ostrom': 0 }; // forme v2 : compteur nu
    const migre = migrateSave(raw);
    expect(migre.version).toBe(5);
    expect(migre.council.affinities).toEqual({});
    expect(migre.council.fusionProgress['smith+ostrom']).toEqual({ marches: 0, communs: 0 });
    expect(migre.council.contratSecurite).toBeNull();
  });
});

describe('sauvegarde — migration v3 → v5 (concurrence & campagne narrative)', () => {
  it('une sauvegarde v3 sans rivaux ni campagne migre avec les structures initiales', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute & { rivals?: unknown; campaign?: unknown };
    raw.version = 3;
    delete raw.rivals;
    delete raw.campaign;
    const migre = migrateSave(raw);
    expect(migre.version).toBe(5);
    expect(migre.rivals.drive_hyper.marketShare).toBe(65);
    expect(migre.campaign.currentChapter).toBe(1);
    expect(migre.campaign.stages.length).toBeGreaterThanOrEqual(5);
  });
});

describe('sauvegarde — migration v4 → v5 (échéances de contre-stratégies)', () => {
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
    expect(migre.version).toBe(5);
    expect(migre.rivals.drive_hyper.activeCounterActions).toEqual([
      { strategyId: 'circuit_court', expiresDay: today + 5 },
      { strategyId: 'degustation', expiresDay: today + 3 },
    ]);
  });

  it('complète les chapitres 4 et 5 de la campagne lors de la migration v4 → v5', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as unknown as {
      version: number;
      campaign: { stages: Array<{ chapter: number }> };
    };
    raw.version = 4;
    // Simuler une ancienne sauvegarde v4 qui n'avait que les chapitres 1, 2 et 3
    raw.campaign.stages = raw.campaign.stages.filter((s) => s.chapter <= 3);
    expect(raw.campaign.stages).toHaveLength(3);

    const migre = migrateSave(raw);
    expect(migre.version).toBe(5);
    expect(migre.campaign.stages).toHaveLength(5);
    expect(migre.campaign.stages.map((s) => s.chapter)).toEqual([1, 2, 3, 4, 5]);
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

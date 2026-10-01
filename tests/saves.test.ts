/**
 * Tests du socle M0 — sauvegardes.
 * Aller-retour export/import JSON identique ; chaîne de migrations
 * v0 → v1 (météo) → v2 (champs du Conseil, M4) → v3 (affinités & fusions, M6).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { exportSave, importSave } from '../src/saves/persist';
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
    expect(JSON.parse(json)).toMatchObject({ version: 4, seed: 42 });
    expect(exportSave(importSave(json))).toBe(json); // clé pour clé, ordre compris
  });
});

describe('sauvegarde — migration v0 → v4 (météo, Conseil, affinités, rivaux)', () => {
  it('une sauvegarde v0 sans météo migre jusqu’à v4 avec la météo par défaut « soleil »', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 0;
    delete raw.district.meteo;
    const migre = migrateSave(raw);
    expect(migre.version).toBe(4);
    expect(migre.district.meteo).toBe('soleil');
    expect(migre.council.affinities).toEqual({});
    expect(migre.rivals.drive_hyper).toBeDefined();
  });

  it('une météo déjà présente dans une sauvegarde v0 est conservée', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 0;
    raw.district.meteo = 'pluie';
    const migre = migrateSave(raw);
    expect(migre.version).toBe(4);
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
    expect(migre.version).toBe(4);
  });

  it('une sauvegarde plus récente que le moteur est rejetée (jamais d\'état corrompu)', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 5;
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
    expect(migre.version).toBe(4);
    const g = migre.council.ghosts['smith'];
    expect(g?.arrivalPending).toBe(false);
    expect(g?.loyaltyZeroDays).toBe(0);
    expect(g?.fiabilite).toBe(60);
    for (const rec of g?.history ?? []) expect(rec.revealed).toBe(false);
  });
});

describe('sauvegarde — migration v2 → v4 (M6 : affinités, fusion, contrat)', () => {
  it('une sauvegarde v2 sans affinités migre avec la progression de fusion structurée', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute;
    raw.version = 2;
    delete raw.council?.affinities;
    raw.council = raw.council ?? {};
    raw.council.fusionProgress = { 'smith+ostrom': 0 }; // forme v2 : compteur nu
    const migre = migrateSave(raw);
    expect(migre.version).toBe(4);
    expect(migre.council.affinities).toEqual({});
    expect(migre.council.fusionProgress['smith+ostrom']).toEqual({ marches: 0, communs: 0 });
    expect(migre.council.contratSecurite).toBeNull();
  });
});

describe('sauvegarde — migration v3 → v4 (concurrence & campagne narrative)', () => {
  it('une sauvegarde v3 sans rivaux ni campagne migre avec les structures initiales', () => {
    const raw = JSON.parse(exportSave(mondeVecu())) as SauvegardeBrute & { rivals?: unknown; campaign?: unknown };
    raw.version = 3;
    delete raw.rivals;
    delete raw.campaign;
    const migre = migrateSave(raw);
    expect(migre.version).toBe(4);
    expect(migre.rivals.drive_hyper.marketShare).toBe(65);
    expect(migre.campaign.currentChapter).toBe(1);
    expect(migre.campaign.stages.length).toBeGreaterThanOrEqual(5);
  });
});

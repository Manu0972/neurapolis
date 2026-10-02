import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

describe('Chaîne de Migrations de Sauvegardes v7', () => {
  it('migre une ancienne sauvegarde v5 vers v7 en créant proprement toutes les nouvelles structures', () => {
    const oldSaveV5 = {
      version: 5,
      seed: 20200901,
      rng: 123456,
      time: { tick: 50, speed: 1 },
      player: {
        name: 'Camille',
        age: 12,
        characteristics: { comprehension: 42, creativite: 65, influence: 35, discipline: 48, adaptabilite: 58, confiance: 44 },
        needs: { fatigue: 20, faim: 30, stress: 25, moral: 65 },
        skills: { negociation: { level: 0, xp: 0 } },
        notions: {},
        money: 15,
        reputation: 45,
        relations: {},
        pos: { x: 23, y: 17 },
        asleep: false,
      },
      npcs: {},
      council: {
        ghosts: {},
        decisions: { marche: 0, communs: 0, autorite: 0, solidarite: 0 },
        fusionProgress: {},
        fusionsDone: [],
        affinities: {},
        contratSecurite: null,
        allianceDesOmbres: 0,
      },
      district: { vitaliteEpicerie: 45, confianceQuartier: 50, frequentationParc: 55, meteo: 'soleil' },
      rivals: {},
      campaign: { currentChapter: 1, stages: [], completedChapters: [], delayedConsequences: [] },
      events: [],
      lifeJournal: [],
      flags: {},
      seen: {},
    };

    const migrated = migrateSave(oldSaveV5);
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.vendors).toBeDefined();
    expect(migrated.vendors?.vendors.bertin).toBeDefined();
    expect(migrated.actionPlanning).toBeDefined();
    expect(migrated.multiVentures).toBeDefined();
    expect(migrated.macroNews).toBeDefined();
    expect(migrated.schoolLife).toBeDefined();
    expect(migrated.streetRecognition).toBeDefined();
    expect(migrated.ghostCompanion).toBeDefined();
  });
});

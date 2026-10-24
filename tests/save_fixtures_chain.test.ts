import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';
import { exportSave, importSave } from '../src/saves/persist';
import { runTicks } from '../src/simulation/engine';

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'saves');

describe('Chaîne de migration complète des sauvegardes de référence', () => {
  it('chaque version de v0 à vN-1 possède son fichier fixture vN.json', () => {
    for (let v = 0; v < CURRENT_SAVE_VERSION; v++) {
      const fixturePath = path.join(FIXTURES_DIR, `v${v}.json`);
      const exists = fs.existsSync(fixturePath);
      expect(
        exists,
        `ajoute la sauvegarde de référence de la version ${v}`,
      ).toBe(true);
    }
  });

  for (let v = 0; v < CURRENT_SAVE_VERSION; v++) {
    it(`fixture v${v}.json : migre, valide le chargement, passe l'aller-retour et simule 30 jours`, () => {
      const fixturePath = path.join(FIXTURES_DIR, `v${v}.json`);
      const rawJson = fs.readFileSync(fixturePath, 'utf-8');

      // 1. Charge la sauvegarde et la migre jusqu'à CURRENT_SAVE_VERSION
      const rawObj = JSON.parse(rawJson) as unknown;
      const migratedWorld = migrateSave(rawObj);
      expect(migratedWorld.version).toBe(CURRENT_SAVE_VERSION);

      // 2. Vérifie que le résultat passe la validation de chargement de src/saves/persist.ts
      const loadedFromImport = importSave(rawJson);
      expect(loadedFromImport.version).toBe(CURRENT_SAVE_VERSION);

      // 3. Vérifie qu'un aller-retour (sérialiser → charger) à la version courante donne un état identique
      const exportedJson = exportSave(migratedWorld);
      const reloadedWorld = importSave(exportedJson);
      expect(reloadedWorld).toEqual(migratedWorld);

      // 4. Vérifie que le monde migré peut simuler 30 jours (30 * 144 ticks = 4320 ticks) avec le moteur réel sans exception
      expect(() => {
        runTicks(migratedWorld, 30 * 144);
      }).not.toThrow();
    });
  }
});

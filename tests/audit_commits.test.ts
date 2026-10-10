import { describe, expect, it } from 'vitest';
import {
  checkDeterminism,
  checkForbiddenOrHeavyFiles,
  checkGenderNeutrality,
  checkLayersArchitecture,
  checkWorldStateMigration,
  generateMarkdownReport,
  getLayerForFile,
  CommitAuditResult,
} from '../tools/audit-commits/auditer';

describe('Audit Commits — Invariants & Classification', () => {
  it('classifie correctement les fichiers selon les couches architecturales', () => {
    expect(getLayerForFile('src/core/store.ts')).toBe('core');
    expect(getLayerForFile('src/simulation/engine.ts')).toBe('simulation');
    expect(getLayerForFile('src/presentation/ui.ts')).toBe('presentation');
    expect(getLayerForFile('src/data/npcs.ts')).toBe('données');
    expect(getLayerForFile('art/style.png')).toBe('données');
    expect(getLayerForFile('docs/VISION.md')).toBe('docs');
    expect(getLayerForFile('tools/audit-commits/auditer.ts')).toBe('outils');
    expect(getLayerForFile('tests/saves.test.ts')).toBe('outils');
    expect(getLayerForFile('package.json')).toBe('outils');
  });

  it('détecte les violations d’architecture entre couches', () => {
    const simulationWithPresentationImport = `
+ import { renderUI } from '../presentation/ui';
+ export function step() { renderUI(); }
`;
    const violationsSim = checkLayersArchitecture(
      'src/simulation/engine.ts',
      simulationWithPresentationImport
    );
    expect(violationsSim.length).toBeGreaterThan(0);
    expect(violationsSim[0]).toContain('Import interdit de la couche presentation');

    const simulationWithDom = `
+ function updateCanvas() {
+   const el = document.getElementById('app');
+   window.localStorage.setItem('key', 'val');
+ }
`;
    const violationsDom = checkLayersArchitecture(
      'src/simulation/engine.ts',
      simulationWithDom
    );
    expect(violationsDom.length).toBeGreaterThan(0);
    expect(violationsDom[0]).toContain("d'éléments DOM/UI dans la simulation");

    const coreWithSimImport = `
+ import { runStep } from '../simulation/engine';
`;
    const violationsCore = checkLayersArchitecture(
      'src/core/types.ts',
      coreWithSimImport
    );
    expect(violationsCore.length).toBeGreaterThan(0);
    expect(violationsCore[0]).toContain('Import interdit de la couche supérieure');
  });

  it('détecte les violations de déterminisme (Math.random / Date.now)', () => {
    const diffWithRandomAndDate = `
+ const roll = Math.random();
+ const now = Date.now();
`;
    const violations = checkDeterminism(
      'src/simulation/district.ts',
      diffWithRandomAndDate
    );
    expect(violations).toHaveLength(2);
    expect(violations[0]).toContain('Math.random()');
    expect(violations[1]).toContain('Date.now()');
  });

  it('détecte les modifications du schéma WorldState sans migration complète', () => {
    const commitFiles = ['src/core/types.ts'];
    const diffWorldState = `
+ export interface WorldState {
+   newProp: string;
+ }
`;
    const violations = checkWorldStateMigration(commitFiles, diffWorldState);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toContain('incrément de SAVE_VERSION');
    expect(violations[0]).toContain('migrations.ts');
    expect(violations[0]).toContain('tests/saves.test.ts');
  });

  it('ne lève pas de violation quand la migration de WorldState est complète', () => {
    const commitFiles = [
      'src/core/types.ts',
      'src/core/store.ts',
      'src/saves/migrations.ts',
      'tests/saves.test.ts',
    ];
    const diffWorldState = `
+ export interface WorldState {
+   newProp: string;
+ }
+ export const SAVE_VERSION = 8;
`;
    const violations = checkWorldStateMigration(commitFiles, diffWorldState);
    expect(violations).toHaveLength(0);
  });

  it('détecte les textes non neutres adressés au joueur', () => {
    const diffGendered = `
+ <p>Tu es prêt pour l'aventure !</p>
+ <button>Es-tu sûr ?</button>
+ <div>Bienvenu à NEURAPOLIS !</div>
`;
    const violations = checkGenderNeutrality(
      'src/presentation/ui.ts',
      diffGendered
    );
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toContain('Texte non neutre');
  });

  it('détecte les fichiers lourds, node_modules ou extensions interdites', () => {
    const stats = [
      { path: 'archive/data.zip', status: 'A', sizeBytes: 100 },
      { path: 'art/heavy_asset.png', status: 'A', sizeBytes: 2 * 1024 * 1024 },
      { path: 'node_modules/temp/file.js', status: 'A', sizeBytes: 100 },
      { path: 'art/references/ref.png', status: 'A', sizeBytes: 100 },
      { path: 'src/core/store.ts', status: 'M', sizeBytes: 500 },
    ];

    const violations = checkForbiddenOrHeavyFiles(stats);
    expect(violations).toHaveLength(4);
    expect(violations[0]).toContain('extension interdite');
    expect(violations[1]).toContain('Fichier lourd');
    expect(violations[2]).toContain('node_modules');
    expect(violations[3]).toContain('art/references/');
  });

  it('génère un rapport Markdown bien formaté du plus récent au plus ancien', () => {
    const results: CommitAuditResult[] = [
      {
        hash: '1234567890abcdef',
        shortHash: '1234567',
        author: 'Développeur <dev@neurapolis.fr>',
        date: '2026-10-10',
        subject: 'feat: ajout nouvelle fonctionnalité',
        body: '',
        layers: ['simulation', 'core'],
        files: [
          { status: 'M', path: 'src/simulation/engine.ts', layer: 'simulation' },
        ],
        violations: {
          layersArchitecture: [],
          determinism: [],
          worldStateMigration: [],
          genderNeutrality: [],
          forbiddenOrHeavyFiles: [],
        },
        hasViolations: false,
      },
    ];

    const markdown = generateMarkdownReport(results);
    expect(markdown).toContain("# Journal d'audit des commits — NEURAPOLIS");
    expect(markdown).toContain('## Commit `1234567` — feat: ajout nouvelle fonctionnalité');
    expect(markdown).toContain('✅ Conforme');
    expect(markdown).toContain('✅ Aucune violation détectée');
  });
});

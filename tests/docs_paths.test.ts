import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Liste d'exceptions explicite pour les chemins cités dans la documentation `.md`
 * qui sont connus pour ne pas exister sur le disque (ex. fichiers/dossiers annoncés comme
 * "à créer", ébauches de design, scripts Python externes ou dossiers archivés).
 *
 * Chaque entrée est commentée afin de préciser le contexte et le motif d'exclusion.
 */
const EXCEPTIONS_PATHS: Record<string, string[]> = {
  // Brief Antigravity : fichier de test prévu pour l'intégration 3D
  'docs/ANTIGRAVITY-BRIEF-2026-10-07.md': ['tests/grid_3d_integration.test.ts'],

  // Guide de correctifs après-run : modules et tests suggérés à créer
  'docs/CORRECTIONS-APRES-RUN.md': ['src/presentation/app.ts', 'tests/autosave.test.ts'],

  // Doc de personnages riggés : script Python d'élagage GLB exécuté sur une branche dédiée
  'docs/PERSONNAGES-RIGGES.md': ['tools/assets/prune_glb.py'],

  // Ébauche de scènes : module de données annoncé comme "à porter en données"
  'docs/SCENES-DRAFT.md': ['src/data/scenes.ts'],

  // Rapport d'état du projet : ancien dossier de rendu 3D archivé
  'docs/STATUS-2026-10-07.md': ['src/rendering'],

  // Recherche esthétique webtoon : outil CLI spéculatif cité dans la spec de recherche
  'docs/character_aesthetic/webtoon_aesthetic_research.md': ['tools/character_generator'],

  // Spec de design pour l'économie rivale : module de simulation de marché proposé
  'docs/rival_economy_design.md': ['src/simulation/market.ts'],
};

/**
 * Lit récursivement tous les fichiers `.md` présents dans un répertoire.
 */
function getMarkdownFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Convertir en chemin relatif normalisé (avec des slashs '/')
      results.push(fullPath.replace(/\\/g, '/'));
    }
  }
  return results;
}

describe('Audit des chemins cités dans la documentation (docs/**/*.md)', () => {
  it('tous les chemins entre accents graves (src/, tests/, docs/, tools/) doivent exister', () => {
    const mdFiles = getMarkdownFiles('docs');
    expect(mdFiles.length).toBeGreaterThan(0);

    // Regex pour extraire les chemins entre accents graves commençant par src/, tests/, docs/ ou tools/
    // Exclut les chaînes contenant un caractère générique '*'
    const pathRegex = /`((?:src|tests|docs|tools)\/[^`*\n\r]+?)`/g;

    const missingPaths: string[] = [];

    for (const file of mdFiles) {
      const content = fs.readFileSync(file, 'utf8');
      let match: RegExpExecArray | null;

      while ((match = pathRegex.exec(content)) !== null) {
        const rawPath = match[1];
        if (!rawPath) continue;

        // Nettoyage : retrait des suffixes de numéros de ligne (ex. :9-12) et de la ponctuation finale
        const cleanPath = rawPath.split(':')[0]!.replace(/[.,;:)]+$/, '');

        // Vérification des exceptions explicites pour ce fichier de doc
        const allowedExceptions = EXCEPTIONS_PATHS[file] ?? [];
        if (allowedExceptions.includes(cleanPath)) {
          continue;
        }

        // Vérification de l'existence sur disque
        if (!fs.existsSync(cleanPath)) {
          missingPaths.push(`${file} → ${rawPath}`);
        }
      }
    }

    if (missingPaths.length > 0) {
      const errorMsg =
        'Chemins cités dans la documentation introuvables sur le disque :\n' +
        missingPaths.map((item) => `  - ${item}`).join('\n');
      expect.fail(errorMsg);
    }
  });
});

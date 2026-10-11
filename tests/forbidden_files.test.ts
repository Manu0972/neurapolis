import { describe, it, expect } from 'vitest';
// @ts-ignore
import { execFileSync } from 'node:child_process';
// @ts-ignore
import fs from 'node:fs';

export interface FileException {
  path: string;
  reason: string;
}

/**
 * Exceptions autorisées pour des fichiers suivis qui déclencheraient normalement une alerte.
 * Chaque exception éventuelle (ex. un modèle 3D légitime dans public/) doit être documentée avec sa raison.
 * Remarque : Les violations existantes ne doivent pas être masquées ici.
 */
export const ALLOWED_EXCEPTIONS: FileException[] = [
  // Exemple :
  // { path: 'public/models/quartier_refonte.glb', reason: 'Modèle 3D optimisé nécessaire pour la ville' }
];

function getGitTrackedFiles(): { files: string[]; error?: string } {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const files = String(output).split('\0').filter(Boolean);
    return { files };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { files: [], error: errorMsg };
  }
}

describe('Garde-fou des fichiers interdits ou lourds suivis par git (#23)', () => {
  const { files: trackedFiles, error: gitError } = getGitTrackedFiles();

  it('ne contient aucun fichier interdit, lourd ou hors dossier autorisé', (ctx) => {
    if (gitError) {
      console.warn(`[SKIP] Git n'est pas disponible pour récupérer les fichiers suivis (${gitError}).`);
      ctx.skip();
      return;
    }

    const FORBIDDEN_ART_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.psd'];
    const FORBIDDEN_HEAVY_EXTS = ['.zip', '.7z', '.rar', '.tar', '.gz', '.pdf'];
    const FORBIDDEN_DIRS = ['node_modules/', 'dist/', '.zcode/'];
    const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 Mo

    const allowedPathsSet = new Set(ALLOWED_EXCEPTIONS.map((e) => e.path));
    const violations: { path: string; reason: string }[] = [];

    for (const file of trackedFiles) {
      if (allowedPathsSet.has(file)) {
        continue;
      }

      const lower = file.toLowerCase();

      // 1. Image sous art/
      if (file.startsWith('art/') && FORBIDDEN_ART_EXTS.some((ext) => lower.endsWith(ext))) {
        violations.push({
          path: file,
          reason: 'Image interdite dans le sous-dossier art/',
        });
      }

      // 2. Archive ou document lourd n'importe où
      if (FORBIDDEN_HEAVY_EXTS.some((ext) => lower.endsWith(ext))) {
        violations.push({
          path: file,
          reason: 'Archive ou document lourd interdit (.zip, .7z, .rar, .tar, .gz, .pdf)',
        });
      }

      // 3. Fichier sous node_modules/, dist/ ou .zcode/
      if (FORBIDDEN_DIRS.some((dir) => file.startsWith(dir))) {
        violations.push({
          path: file,
          reason: 'Fichier suivi situé dans un dossier interdit (node_modules/, dist/, .zcode/)',
        });
      }

      // 4. Fichier > 2 Mo
      try {
        const stat = fs.statSync(file);
        if (stat.size > MAX_FILE_SIZE_BYTES) {
          const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
          violations.push({
            path: file,
            reason: `Fichier de taille excessive (> 2 Mo) : ${sizeMB} Mo`,
          });
        }
      } catch {
        // Ignorer si le fichier n'est pas lisible sur disque
      }
    }

    if (violations.length > 0) {
      const detailedList = violations
        .map((v) => ` - [${v.reason}] : ${v.path}`)
        .join('\n');
      expect.fail(
        `Des fichiers interdits ou lourds sont suivis par git (${violations.length} violation(s)) :\n${detailedList}`
      );
    }
  });
});

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface FileChange {
  status: string; // 'A', 'M', 'D', 'R'
  path: string;
  layer: string;
}

export interface CommitAuditViolations {
  layersArchitecture: string[];
  determinism: string[];
  worldStateMigration: string[];
  genderNeutrality: string[];
  forbiddenOrHeavyFiles: string[];
}

export interface CommitAuditResult {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  subject: string;
  body: string;
  layers: string[];
  files: FileChange[];
  violations: CommitAuditViolations;
  hasViolations: boolean;
}

/**
  * Classifie un chemin de fichier dans une couche logicielle du projet NEURAPOLIS.
  */
export function getLayerForFile(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('src/core/')) return 'core';
  if (normalized.startsWith('src/simulation/')) return 'simulation';
  if (normalized.startsWith('src/presentation/')) return 'presentation';
  if (
    normalized.startsWith('src/data/') ||
    normalized.startsWith('art/') ||
    normalized.startsWith('public/') ||
    (normalized.endsWith('.json') && !normalized.includes('package'))
  ) {
    return 'données';
  }
  if (normalized.startsWith('docs/') || normalized.endsWith('.md')) {
    return 'docs';
  }
  if (
    normalized.startsWith('tools/') ||
    normalized.startsWith('tests/') ||
    normalized.startsWith('.github/') ||
    normalized.startsWith('scripts/') ||
    normalized === 'package.json' ||
    normalized === 'package-lock.json' ||
    normalized === 'tsconfig.json' ||
    normalized === 'vite.config.ts'
  ) {
    return 'outils';
  }
  return 'divers';
}

/**
  * Vérifie l'architecture des couches :
  * - simulation ne doit pas importer presentation ni utiliser le DOM/Canvas/UI.
  * - core ne doit pas importer simulation ni presentation.
  */
export function checkLayersArchitecture(filePath: string, diffText: string): string[] {
  const violations: string[] = [];
  const normalizedPath = filePath.replace(/\\/g, '/');
  const addedLines = diffText
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'));

  if (normalizedPath.startsWith('src/simulation/')) {
    for (const line of addedLines) {
      if (/import\s+.*from\s+['"].*presentation.*['"]/i.test(line)) {
        violations.push(
          `[${normalizedPath}] Import interdit de la couche presentation dans la simulation : "${line.trim()}"`
        );
      }
      if (/\b(window\.|document\.|HTMLElement|HTMLCanvasElement|localStorage|AudioContext)\b/.test(line)) {
        violations.push(
          `[${normalizedPath}] Utilisation interdite d'éléments DOM/UI dans la simulation : "${line.trim()}"`
        );
      }
    }
  }

  if (normalizedPath.startsWith('src/core/')) {
    for (const line of addedLines) {
      if (/import\s+.*from\s+['"].*(simulation|presentation).*['"]/i.test(line)) {
        violations.push(
          `[${normalizedPath}] Import interdit de la couche supérieure (${line.includes('simulation') ? 'simulation' : 'presentation'}) dans core : "${line.trim()}"`
        );
      }
    }
  }

  return violations;
}

/**
  * Vérifie que la simulation (et le core) n'utilise ni Math.random() ni Date.now().
  */
export function checkDeterminism(filePath: string, diffText: string): string[] {
  const violations: string[] = [];
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.startsWith('src/simulation/') || normalizedPath.startsWith('src/core/')) {
    const addedLines = diffText
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'));

    for (const line of addedLines) {
      if (/\bMath\.random\s*\(/.test(line)) {
        violations.push(
          `[${normalizedPath}] Utilisation de Math.random() interdite dans la simulation (utiliser le PRNG) : "${line.trim()}"`
        );
      }
      if (/\bDate\.now\s*\(/.test(line)) {
        violations.push(
          `[${normalizedPath}] Utilisation de Date.now() interdite dans la simulation (utiliser l'horloge du jeu) : "${line.trim()}"`
        );
      }
    }
  }

  return violations;
}

/**
  * Vérifie qu'une modification du schéma WorldState s'accompagne d'un incrément de SAVE_VERSION,
  * d'une mise à jour de la migration et de tests de sauvegarde.
  */
export function checkWorldStateMigration(
  commitFiles: string[],
  commitDiff: string
): string[] {
  const violations: string[] = [];
  const normalizedFiles = commitFiles.map((f) => f.replace(/\\/g, '/'));

  const touchesWorldStateDef =
    normalizedFiles.includes('src/core/types.ts') || normalizedFiles.includes('src/core/store.ts');

  if (!touchesWorldStateDef) {
    return violations;
  }

  const worldStateModifiedInDiff =
    /interface\s+WorldState\b/i.test(commitDiff) ||
    /type\s+WorldState\b/i.test(commitDiff) ||
    /export\s+interface\s+WorldState/i.test(commitDiff);

  if (worldStateModifiedInDiff) {
    const touchesSaveVersion =
      /SAVE_VERSION\s*=/i.test(commitDiff) ||
      normalizedFiles.includes('src/core/store.ts');
    const touchesMigration = normalizedFiles.some((f) => f.includes('migrations.ts'));
    const touchesSaveTests = normalizedFiles.some((f) => f.includes('tests/') && f.includes('save'));

    if (!touchesSaveVersion || !touchesMigration || !touchesSaveTests) {
      const missing: string[] = [];
      if (!touchesSaveVersion) missing.push('incrément de SAVE_VERSION');
      if (!touchesMigration) missing.push('mise à jour du migrateur de sauvegarde (migrations.ts)');
      if (!touchesSaveTests) missing.push('test de sauvegarde aller-retour (tests/saves.test.ts)');

      violations.push(
        `Modification de WorldState détectée dans les types core sans la chaîne complète de sauvegarde. Manquant : ${missing.join(', ')}.`
      );
    }
  }

  return violations;
}

/**
  * Vérifie la neutralité de genre dans les textes utilisateur ajoutés (presentation/UI).
  */
export function checkGenderNeutrality(filePath: string, diffText: string): string[] {
  const violations: string[] = [];
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (
    normalizedPath.startsWith('src/presentation/') ||
    normalizedPath.endsWith('.html') ||
    normalizedPath.startsWith('src/data/')
  ) {
    const addedLines = diffText
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'));

    const genderedPattern =
      /(?:tu es|vous êtes|es-tu|êtes-vous)\s+(?:prêt|sûr|seul|désolé|fatigué|satisfait|présent|inconscient|content|inscrit|embauché)\b/i;
    const directPlayerPattern = /\b(?<!de |du |un |le )joueur\b/i;

    for (const line of addedLines) {
      if (genderedPattern.test(line)) {
        violations.push(
          `[${normalizedPath}] Texte non neutre adressé au joueur détecté : "${line.trim()}"`
        );
      }
      if (directPlayerPattern.test(line) && line.includes('Bienvenu')) {
        violations.push(
          `[${normalizedPath}] Formule de bienvenue non neutre détectée : "${line.trim()}"`
        );
      }
    }
  }

  return violations;
}

/**
  * Vérifie la présence de fichiers lourds (>1Mo) ou interdits (.zip, .pdf, node_modules, images de référence).
  */
export function checkForbiddenOrHeavyFiles(
  filesStats: Array<{ path: string; status: string; sizeBytes?: number }>
): string[] {
  const violations: string[] = [];
  const forbiddenExtensions = ['.zip', '.pdf', '.tar', '.gz', '.rar', '.7z'];

  for (const file of filesStats) {
    if (file.status === 'D') continue;

    const normalizedPath = file.path.replace(/\\/g, '/');
    const ext = path.extname(normalizedPath).toLowerCase();

    if (forbiddenExtensions.includes(ext)) {
      violations.push(
        `[${normalizedPath}] Fichier à extension interdite détecté : ${ext}`
      );
    }

    if (normalizedPath.includes('node_modules/')) {
      violations.push(
        `[${normalizedPath}] Fichier node_modules détecté dans le commit`
      );
    }

    if (normalizedPath.startsWith('art/references/')) {
      violations.push(
        `[${normalizedPath}] Image de référence dans art/references/ interdite`
      );
    }

    if (file.sizeBytes !== undefined && file.sizeBytes > 1024 * 1024) {
      const sizeMB = (file.sizeBytes / (1024 * 1024)).toFixed(2);
      violations.push(
        `[${normalizedPath}] Fichier lourd détecté (${sizeMB} Mo > limite de 1.0 Mo)`
      );
    }
  }

  return violations;
}

/**
  * Audite un commit spécifique via la commande git locale.
  */
export function auditCommit(commitHash: string): CommitAuditResult {
  const infoOutput = execSync(
    `git -c core.quotePath=false show -s --format="%H%n%h%n%an%n%ad%n%s%n%b" --date=short ${commitHash}`,
    { encoding: 'utf8' }
  );

  const lines = infoOutput.trim().split('\n');
  const fullHash = lines[0] ?? commitHash;
  const shortHash = lines[1] ?? commitHash.substring(0, 7);
  const author = lines[2] ?? 'Inconnu';
  const date = lines[3] ?? '';
  const subject = lines[4] ?? '';
  const body = lines.slice(5).join('\n').trim();

  // Fichiers modifiés et leur statut
  const filesOutput = execSync(
    `git -c core.quotePath=false diff-tree --no-commit-id --name-status -r --root ${commitHash}`,
    { encoding: 'utf8' }
  );

  const fileChanges: FileChange[] = [];
  const filesStatsList: Array<{ path: string; status: string; sizeBytes?: number }> = [];
  const fileLines = filesOutput.trim().split('\n').filter(Boolean);

  for (const fLine of fileLines) {
    const parts = fLine.trim().split(/\s+/);
    if (parts.length >= 2) {
      const firstPart = parts[0];
      const status = firstPart && firstPart.length > 0 ? firstPart[0]! : 'M';
      const filePath = parts.slice(1).join(' ').replace(/^"|"$/g, '');
      const layer = getLayerForFile(filePath);
      fileChanges.push({ status, path: filePath, layer });

      let sizeBytes: number | undefined;
      if (status !== 'D') {
        try {
          // Obtenir la taille du fichier au commit ou local
          const blobSizeOutput = execSync(`git cat-file -s "${commitHash}:${filePath}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          sizeBytes = parseInt(blobSizeOutput.trim(), 10);
        } catch {
          if (fs.existsSync(filePath)) {
            sizeBytes = fs.statSync(filePath).size;
          }
        }
      }

      filesStatsList.push({ path: filePath, status, sizeBytes });
    }
  }

  // Extraire les couches uniques
  const layersSet = new Set<string>();
  for (const fc of fileChanges) {
    layersSet.add(fc.layer);
  }
  const layers = Array.from(layersSet);

  // Extraire le patch diff du commit
  let commitDiff = '';
  try {
    commitDiff = execSync(`git -c core.quotePath=false show ${commitHash}`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    commitDiff = '';
  }

  // Effectuer les vérifications d'invariants
  const layersArchitectureViolations: string[] = [];
  const determinismViolations: string[] = [];
  const genderNeutralityViolations: string[] = [];

  for (const fc of fileChanges) {
    const fileDiffOutput = extractFileDiff(commitDiff, fc.path);
    layersArchitectureViolations.push(...checkLayersArchitecture(fc.path, fileDiffOutput));
    determinismViolations.push(...checkDeterminism(fc.path, fileDiffOutput));
    genderNeutralityViolations.push(...checkGenderNeutrality(fc.path, fileDiffOutput));
  }

  const commitFilesList = fileChanges.map((f) => f.path);
  const worldStateMigrationViolations = checkWorldStateMigration(commitFilesList, commitDiff);
  const forbiddenOrHeavyFilesViolations = checkForbiddenOrHeavyFiles(filesStatsList);

  const violations: CommitAuditViolations = {
    layersArchitecture: layersArchitectureViolations,
    determinism: determinismViolations,
    worldStateMigration: worldStateMigrationViolations,
    genderNeutrality: genderNeutralityViolations,
    forbiddenOrHeavyFiles: forbiddenOrHeavyFilesViolations,
  };

  const hasViolations =
    layersArchitectureViolations.length > 0 ||
    determinismViolations.length > 0 ||
    worldStateMigrationViolations.length > 0 ||
    genderNeutralityViolations.length > 0 ||
    forbiddenOrHeavyFilesViolations.length > 0;

  return {
    hash: fullHash,
    shortHash,
    author,
    date,
    subject,
    body,
    layers,
    files: fileChanges,
    violations,
    hasViolations,
  };
}

/**
  * Extrait le diff d'un fichier particulier du diff global du commit.
  */
function extractFileDiff(fullDiff: string, filePath: string): string {
  const norm = filePath.replace(/\\/g, '/');
  const sections = fullDiff.split('diff --git ');
  for (const section of sections) {
    if (section.includes(` b/${norm}`) || section.includes(` a/${norm}`)) {
      return section;
    }
  }
  return '';
}

/**
  * Génère le rapport Markdown au format requis pour docs/audit/JOURNAL-COMMITS.md
  * Trié du commit le plus récent au plus ancien.
  */
export function generateMarkdownReport(results: CommitAuditResult[]): string {
  let md = `# Journal d'audit des commits — NEURAPOLIS\n\n`;
  md += `Ce journal recense l'audit systématique de chaque commit selon les invariants du projet (architecture des couches, déterminisme de la simulation, migrations de sauvegarde, neutralité de genre et contrôle des fichiers lourds/interdits).\n\n`;
  md += `---\n\n`;

  for (const res of results) {
    md += `## Commit \`${res.shortHash}\` — ${res.subject}\n\n`;
    md += `- **Hash** : \`${res.hash}\`\n`;
    md += `- **Auteur** : ${res.author}\n`;
    md += `- **Date** : ${res.date}\n`;
    md += `- **Couches concernées** : ${res.layers.map((l) => `\`${l}\``).join(', ') || 'aucune'}\n`;
    md += `- **Fichiers modifiés** (${res.files.length}) :\n`;
    for (const file of res.files) {
      md += `  - \`${file.status}\` \`${file.path}\` (${file.layer})\n`;
    }
    md += `\n### Audit des invariants\n\n`;

    // 1. Architecture des couches
    if (res.violations.layersArchitecture.length === 0) {
      md += `- **Architecture des couches** : ✅ Conforme\n`;
    } else {
      md += `- **Architecture des couches** : ❌ Violation\n`;
      for (const v of res.violations.layersArchitecture) {
        md += `  - ${v}\n`;
      }
    }

    // 2. Déterminisme
    if (res.violations.determinism.length === 0) {
      md += `- **Déterminisme (Math.random / Date.now)** : ✅ Conforme\n`;
    } else {
      md += `- **Déterminisme (Math.random / Date.now)** : ❌ Violation\n`;
      for (const v of res.violations.determinism) {
        md += `  - ${v}\n`;
      }
    }

    // 3. WorldState & Sauvegarde
    if (res.violations.worldStateMigration.length === 0) {
      md += `- **Schéma WorldState & Sauvegarde** : ✅ Conforme\n`;
    } else {
      md += `- **Schéma WorldState & Sauvegarde** : ❌ Violation\n`;
      for (const v of res.violations.worldStateMigration) {
        md += `  - ${v}\n`;
      }
    }

    // 4. Neutralité de genre
    if (res.violations.genderNeutrality.length === 0) {
      md += `- **Textes utilisateur (neutralité de genre)** : ✅ Conforme\n`;
    } else {
      md += `- **Textes utilisateur (neutralité de genre)** : ❌ Violation\n`;
      for (const v of res.violations.genderNeutrality) {
        md += `  - ${v}\n`;
      }
    }

    // 5. Fichiers lourds / interdits
    if (res.violations.forbiddenOrHeavyFiles.length === 0) {
      md += `- **Fichiers lourds / interdits** : ✅ Conforme\n`;
    } else {
      md += `- **Fichiers lourds / interdits** : ❌ Violation\n`;
      for (const v of res.violations.forbiddenOrHeavyFiles) {
        md += `  - ${v}\n`;
      }
    }

    md += `\n**Bilan du commit** : ${
      res.hasViolations
        ? `❌ Violations détectées`
        : `✅ Aucune violation détectée`
    }\n\n`;
    md += `---\n\n`;
  }

  return md;
}

/**
  * Récupère la liste des commits selon la plage spécifiée ou par défaut.
  */
export function resolveCommitList(rangeArg?: string): string[] {
  if (rangeArg) {
    if (rangeArg === '--all' || rangeArg === '-a') {
      try {
        const out = execSync('git rev-list --reverse --all', { encoding: 'utf8' }).trim();
        return out.split('\n').filter(Boolean);
      } catch {}
    } else if (rangeArg.includes('..')) {
      try {
        const out = execSync(`git rev-list --reverse ${rangeArg}`, { encoding: 'utf8' }).trim();
        if (out) return out.split('\n').filter(Boolean);
      } catch {}

      const parts = rangeArg.split('..');
      const target = parts[parts.length - 1];
      if (target) {
        try {
          const out = execSync(`git rev-parse ${target}`, { encoding: 'utf8' }).trim();
          if (out) return [out];
        } catch {}
      }
    } else {
      try {
        const out = execSync(`git rev-parse ${rangeArg}`, { encoding: 'utf8' }).trim();
        if (out) return [out];
      } catch {}
    }
  }

  try {
    const out = execSync('git rev-list --reverse origin/refonte-3d', { encoding: 'utf8' }).trim();
    if (out) return out.split('\n').filter(Boolean);
  } catch {}

  try {
    const out = execSync('git rev-list --reverse --all', { encoding: 'utf8' }).trim();
    if (out) return out.split('\n').filter(Boolean);
  } catch {}

  return [];
}

export function main() {
  const args = process.argv.slice(2);
  let rangeArg: string | undefined;
  let outFile = 'docs/audit/JOURNAL-COMMITS.md';
  let shouldWrite = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    if (arg === '--all' || arg === '-a') {
      rangeArg = '--all';
    } else if (arg === '--out') {
      const next = args[i + 1];
      if (next) {
        outFile = next;
        i++;
      }
    } else if (arg === '--write') {
      shouldWrite = true;
    } else if (arg === '--no-write') {
      shouldWrite = false;
    } else if (!arg.startsWith('-')) {
      rangeArg = arg;
    }
  }

  console.log(`🔍 Démarrage de l'audit des commits (Plage: ${rangeArg || 'automatique'})...`);
  const commits = resolveCommitList(rangeArg);
  console.log(`📋 ${commits.length} commit(s) trouvé(s) à auditer.`);

  const auditResults: CommitAuditResult[] = [];
  for (const commitHash of commits) {
    try {
      const res = auditCommit(commitHash);
      auditResults.push(res);
      console.log(
        `  - [${res.shortHash}] ${res.subject} -> ${
          res.hasViolations ? '❌ Violations trouvées' : '✅ Conforme'
        }`
      );
    } catch (e: any) {
      console.error(`  - Erreur lors de l'audit du commit ${commitHash} :`, e.message);
    }
  }

  // Tri du plus récent au plus ancien pour le rapport cumulatif
  const sortedResults = [...auditResults].reverse();
  const reportMd = generateMarkdownReport(sortedResults);

  if (shouldWrite) {
    const outDir = path.dirname(outFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outFile, reportMd, 'utf8');
    console.log(`\n📄 Rapport d'audit mis à jour avec succès dans : ${outFile}`);
  }

  console.log(`\nAudit terminé avec succès.`);
}

if (!process.env.VITEST) {
  main();
}

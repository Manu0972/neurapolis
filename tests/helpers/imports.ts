import fs from 'fs';
import path from 'path';

/**
 * Recense tous les fichiers .ts sous `dir` (par défaut 'src'), en ignorant les fichiers de définition .d.ts.
 */
export function getAllTsFiles(dir: string = 'src'): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(fullPath.replace(/\\/g, '/'));
    }
  }
  return results.sort();
}

/**
 * Résout un spécificateur d'importation relatif par rapport au fichier source.
 */
export function resolveImportSpecifier(
  sourceFilePath: string,
  specifier: string,
  allFilesSet: Set<string>,
): string | null {
  if (!specifier.startsWith('.')) {
    return null; // Ignore les paquets externes
  }
  const sourceDir = path.dirname(sourceFilePath);
  const normalized = path.normalize(path.join(sourceDir, specifier)).replace(/\\/g, '/');

  if (allFilesSet.has(normalized + '.ts')) {
    return normalized + '.ts';
  }
  if (allFilesSet.has(normalized + '/index.ts')) {
    return normalized + '/index.ts';
  }
  if (allFilesSet.has(normalized)) {
    return normalized;
  }
  return null;
}

/**
 * Extrait les dépendances relatives à l'exécution d'un fichier .ts (ignore les types seuls).
 */
export function extractRuntimeImports(filePath: string, allFilesSet: Set<string>): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  // Supprimer les commentaires
  const cleanContent = content
    .replace(/\/\/.*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const targets = new Set<string>();

  // 1. Imports dynamiques : import('...')
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = dynamicRegex.exec(cleanContent)) !== null) {
    const resolved = resolveImportSpecifier(filePath, match[1]!, allFilesSet);
    if (resolved && resolved !== filePath) {
      targets.add(resolved);
    }
  }

  // 2. Imports/Exports statiques avec 'from' : import ... from '...' / export ... from '...'
  const importExportFromRegex = /(?:^|\n)\s*(import|export)\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = importExportFromRegex.exec(cleanContent)) !== null) {
    const clause = match[2]!.trim();
    const specifier = match[3]!;

    // Ignorer si type pur : `import type ...` ou `export type ...`
    if (clause.startsWith('type ') || clause === 'type') {
      continue;
    }

    // Ignorer si tous les éléments entre acolades sont de type `type X`
    const braceMatch = clause.match(/^\{([\s\S]*)\}$/);
    if (braceMatch) {
      const items = braceMatch[1]!
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0 && items.every((item) => item.startsWith('type ') || item.startsWith('type\n'))) {
        continue;
      }
    }

    const resolved = resolveImportSpecifier(filePath, specifier, allFilesSet);
    if (resolved && resolved !== filePath) {
      targets.add(resolved);
    }
  }

  // 3. Imports sans 'from' (side-effect imports) : import '...'
  const sideEffectRegex = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
  while ((match = sideEffectRegex.exec(cleanContent)) !== null) {
    const specifier = match[1]!;
    const resolved = resolveImportSpecifier(filePath, specifier, allFilesSet);
    if (resolved && resolved !== filePath) {
      targets.add(resolved);
    }
  }

  return Array.from(targets).sort();
}

/**
 * Construit le graphe d'importation relatif à l'exécution de tous les fichiers du dossier `dir`.
 */
export function buildImportGraph(dir: string = 'src'): Record<string, string[]> {
  const files = getAllTsFiles(dir);
  const allFilesSet = new Set(files);
  const graph: Record<string, string[]> = {};

  for (const file of files) {
    graph[file] = extractRuntimeImports(file, allFilesSet);
  }

  return graph;
}

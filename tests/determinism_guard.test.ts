import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Exceptions autorisées pour la simulation et le coeur déterministe.
 * Cette liste d'exceptions est strictement encadrée et ne doit JAMAIS être agrandie
 * sans justification majeure et revue d'architecture.
 */
export const ALLOWED_EXCEPTIONS: ReadonlySet<string> = new Set([
  // src/core/clock.ts utilise `new Date(...)` uniquement pour les calculs de dates UTC
  // et du calendrier officiel/type (horloge simulée déterministe).
  'src/core/clock.ts',
]);

export interface ForbiddenOccurrence {
  filepath: string;
  line: number;
  pattern: string;
  codeLine: string;
}

/**
 * Supprime les commentaires JavaScript / TypeScript (mono-ligne // et multi-lignes /* ... *\/)
 * d'un contenu de fichier tout en conservant exactement les sauts de ligne pour préserver
 * le numéro de ligne exact.
 */
export function stripCommentsKeepLines(code: string): string {
  let result = '';
  let i = 0;
  const len = code.length;
  let inSingleComment = false;
  let inMultiComment = false;
  let inString: string | null = null; // '"', "'", '`'

  while (i < len) {
    const char = code[i];
    const next = code[i + 1];

    if (inSingleComment) {
      if (char === '\n') {
        inSingleComment = false;
        result += '\n';
      } else {
        result += ' ';
      }
      i++;
      continue;
    }

    if (inMultiComment) {
      if (char === '*' && next === '/') {
        inMultiComment = false;
        result += '  ';
        i += 2;
      } else {
        result += char === '\n' ? '\n' : ' ';
        i++;
      }
      continue;
    }

    if (inString !== null) {
      if (char === '\\') {
        result += '  ';
        i += 2;
        continue;
      }
      if (char === inString) {
        inString = null;
      }
      result += char === '\n' ? '\n' : char;
      i++;
      continue;
    }

    // Hors commentaires et hors chaînes
    if (char === '/' && next === '/') {
      inSingleComment = true;
      result += '  ';
      i += 2;
      continue;
    }

    if (char === '/' && next === '*') {
      inMultiComment = true;
      result += '  ';
      i += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
    }

    result += char;
    i++;
  }

  return result;
}

const FORBIDDEN_PATTERNS = [
  { name: 'Math.random', regex: /\bMath\.random\b/ },
  { name: 'Date.now', regex: /\bDate\.now\b/ },
  { name: 'new Date', regex: /\bnew\s+Date\b/ },
];

/**
 * Analyse le contenu d'un fichier source et retourne les occurrences interdites
 * (en ignorant les commentaires et les exceptions autorisées).
 */
export function analyzeSourceContent(
  filepath: string,
  content: string,
  allowedExceptions: ReadonlySet<string> = ALLOWED_EXCEPTIONS
): ForbiddenOccurrence[] {
  const normalizedPath = filepath.replace(/\\/g, '/');
  if (allowedExceptions.has(normalizedPath)) {
    return [];
  }

  const stripped = stripCommentsKeepLines(content);
  const strippedLines = stripped.split('\n');
  const originalLines = content.split('\n');

  const occurrences: ForbiddenOccurrence[] = [];

  for (let idx = 0; idx < strippedLines.length; idx++) {
    const strippedLine = strippedLines[idx];
    if (strippedLine === undefined) continue;
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(strippedLine)) {
        const orig = originalLines[idx];
        occurrences.push({
          filepath: normalizedPath,
          line: idx + 1,
          pattern: pattern.name,
          codeLine: orig !== undefined ? orig.trim() : '',
        });
      }
    }
  }

  return occurrences;
}

/**
 * Parcourt récursivement un dossier et retourne tous les fichiers .ts
 */
function getTsFiles(dirPath: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dirPath)) return files;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Garde-fou automatique de déterminisme (Math.random & Date.now)', () => {
  it('détecte les occurrences interdites dans un code factice (test négatif)', () => {
    const fakeCodeWithRandom = `
      // Commentaire : Math.random() ne doit pas être déclenché ici
      /* Autre commentaire
         new Date() ou Date.now()
      */
      function test() {
        const x = Math.random();
        const t = Date.now();
        const d = new Date();
        return x;
      }
    `;

    const occurrences = analyzeSourceContent('src/simulation/fake_test.ts', fakeCodeWithRandom, new Set());

    expect(occurrences.length).toBe(3);
    expect(occurrences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ filepath: 'src/simulation/fake_test.ts', line: 7, pattern: 'Math.random' }),
        expect.objectContaining({ filepath: 'src/simulation/fake_test.ts', line: 8, pattern: 'Date.now' }),
        expect.objectContaining({ filepath: 'src/simulation/fake_test.ts', line: 9, pattern: 'new Date' }),
      ])
    );
  });

  it('ignore les commentaires contenant Math.random, Date.now ou new Date', () => {
    const fakeCodeWithCommentsOnly = `
      // Note: Ne jamais utiliser Math.random() ou Date.now()
      /**
       * new Date() est prohibé dans le moteur de simulation.
       */
      const a = 42;
    `;

    const occurrences = analyzeSourceContent('src/simulation/fake_comment.ts', fakeCodeWithCommentsOnly, new Set());
    expect(occurrences).toEqual([]);
  });

  it('ne trouve aucune occurrence interdite non autorisée dans src/simulation/ et src/core/', () => {
    const roots = ['src/simulation', 'src/core'];
    const allTsFiles = roots.flatMap((root) => getTsFiles(root));

    const violations: ForbiddenOccurrence[] = [];

    for (const file of allTsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const normalizedPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
      const fileViolations = analyzeSourceContent(normalizedPath, content, ALLOWED_EXCEPTIONS);
      violations.push(...fileViolations);
    }

    if (violations.length > 0) {
      const message = violations
        .map((v) => `  - [${v.pattern}] ${v.filepath}:${v.line} -> "${v.codeLine}"`)
        .join('\n');
      expect.fail(`Des occurrences interdites (Math.random, Date.now, new Date) ont été trouvées dans la simulation / le core :\n${message}`);
    }
  });
});

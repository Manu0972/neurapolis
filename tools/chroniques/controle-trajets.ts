import { createWorld } from '../../src/core/store';
import { tickWorld } from '../../src/simulation/engine';
import { NPCS } from '../../src/data/npcs';
import { NPCS_EXPANDED } from '../../src/data/npcs_expanded';
import { npcPosition, npcsAt } from '../../src/simulation/npc';
import { dateOf, dayIndexOf, minutesOfDay, hhmm, isSchoolDay, isVacances } from '../../src/core/clock';
import { PLACE_OPENING_HOURS, isPlaceOpen } from '../../src/simulation/places';

export type Severity = 'bloquante' | 'gênante' | 'cosmétique';

export interface TrajectoryIssue {
  severity: Severity;
  category: 'ubiquité' | 'lieu_fermé' | 'téléportation' | 'emploi_du_temps_incohérent';
  seed: number;
  day: number;
  dateIso: string;
  time: string;
  tick: number;
  npcId: string;
  npcName: string;
  place: string;
  description: string;
  reproCommand: string;
}

export interface RunOptions {
  seedsCount?: number;
  startSeed?: number;
  daysCount?: number;
  outputFile?: string;
}

// Rôles spécifiquement autorisés la nuit / hors ouverture générale (ex. vigies nocturnes, artiste furtif)
const NIGHT_AUTHORIZED_ROLES: Record<string, string[]> = {
  parc: ['gaspard_vaneck', 'dj_mirabelle'],
  friche: ['louison_zephir', 'louison', 'silvio_taupe', 'silvio'],
};

export function runTrajectoryAudit(opts: RunOptions = {}): {
  issues: TrajectoryIssue[];
  durationMs: number;
  totalTicksSimulated: number;
  seedCount: number;
  daysCount: number;
} {
  const seedsCount = opts.seedsCount ?? 200;
  const startSeed = opts.startSeed ?? 20200901;
  const daysCount = opts.daysCount ?? 60;
  const totalTicksPerSeed = daysCount * 144;

  const issues: TrajectoryIssue[] = [];
  const startTime = Date.now();

  // Ensemble combiné des définitions de PNJ (npcs.ts + npcs_expanded.ts)
  const allNpcDefs = new Map<string, { id: string; name: string; age?: number }>();
  for (const def of NPCS) {
    allNpcDefs.set(def.id, { id: def.id, name: def.name, age: def.age });
  }
  for (const def of NPCS_EXPANDED) {
    if (!allNpcDefs.has(def.id)) {
      allNpcDefs.set(def.id, { id: def.id, name: def.name, age: def.age });
    }
  }

  const issueKeysSeen = new Set<string>();

  function recordIssue(issue: TrajectoryIssue) {
    const key = `${issue.severity}_${issue.category}_${issue.npcId}_${issue.place}_${issue.day}_${issue.time}`;
    if (!issueKeysSeen.has(key)) {
      issueKeysSeen.add(key);
      issues.push(issue);
    }
  }

  for (let s = 0; s < seedsCount; s++) {
    const seed = startSeed + s;
    const w = createWorld({ seed });

    const prevPositions = new Map<string, { place: string; x: number; y: number }>();

    for (let tick = 0; tick < totalTicksPerSeed; tick++) {
      tickWorld(w);

      const day = dayIndexOf(w.time.tick);
      const minutes = minutesOfDay(w.time.tick);
      const dateInfo = dateOf(day);
      const timeStr = hhmm(minutes);
      const schoolDay = isSchoolDay(day);
      const vacances = isVacances(day);
      const isWeekend = dateInfo.weekday === 0 || dateInfo.weekday === 6;
      const isWednesday = dateInfo.weekday === 3;

      // 1. Contrôle d'ubiquité : un même PNJ présent dans deux lieux au même tick
      for (const [npcId, def] of allNpcDefs.entries()) {
        const placesFound: string[] = [];
        const st = w.npcs[npcId];
        if (st) placesFound.push(st.place);

        for (const placeName of Object.keys(PLACE_OPENING_HOURS)) {
          const atPlace = npcsAt(w, placeName);
          if (atPlace.some((n) => n.id === npcId) && !placesFound.includes(placeName)) {
            placesFound.push(placeName);
          }
        }

        if (placesFound.length > 1) {
          recordIssue({
            severity: 'bloquante',
            category: 'ubiquité',
            seed,
            day,
            dateIso: dateInfo.iso,
            time: timeStr,
            tick,
            npcId,
            npcName: def.name,
            place: placesFound.join(' & '),
            description: `PNJ présent dans plusieurs lieux à la fois : ${placesFound.join(', ')}`,
            reproCommand: `npx tsx tools/chroniques/controle-trajets.ts --seeds 1 --startSeed ${seed} --days ${day + 1}`,
          });
        }
      }

      // 2. Contrôle des PNJ
      for (const [npcId, def] of allNpcDefs.entries()) {
        const st = w.npcs[npcId];
        if (!st) continue;

        const currentPlace = st.place;
        const currentPos = npcPosition(w, npcId);
        const age = def.age ?? 30;
        const isChild = age < 18;

        // --- Contrôle Téléportation ---
        const prev = prevPositions.get(npcId);
        if (prev) {
          if (prev.place === currentPlace) {
            const dx = Math.abs(currentPos.x - prev.x);
            const dy = Math.abs(currentPos.y - prev.y);
            const dist = Math.max(dx, dy);
            if (dist > 1) {
              recordIssue({
                severity: 'bloquante',
                category: 'téléportation',
                seed,
                day,
                dateIso: dateInfo.iso,
                time: timeStr,
                tick,
                npcId,
                npcName: def.name,
                place: currentPlace,
                description: `Téléportation interne à ${currentPlace} : déplacement de ${dist} tuiles en 1 tick (${prev.x},${prev.y} -> ${currentPos.x},${currentPos.y})`,
                reproCommand: `npx tsx tools/chroniques/controle-trajets.ts --seeds 1 --startSeed ${seed} --days ${day + 1}`,
              });
            }
          }
        }
        prevPositions.set(npcId, { place: currentPlace, x: currentPos.x, y: currentPos.y });

        // --- Contrôle Lieu Fermé ---
        if (currentPlace !== 'maison') {
          const open = isPlaceOpen(currentPlace, minutes, schoolDay, isWeekend, vacances, dateInfo.weekday);
          const isNightAuthorized = (NIGHT_AUTHORIZED_ROLES[currentPlace] ?? []).includes(npcId);

          if (!open && !isNightAuthorized) {
            const severity: Severity = isChild ? 'bloquante' : 'gênante';
            recordIssue({
              severity,
              category: 'lieu_fermé',
              seed,
              day,
              dateIso: dateInfo.iso,
              time: timeStr,
              tick,
              npcId,
              npcName: def.name,
              place: currentPlace,
              description: `PNJ présent dans un lieu fermé (${currentPlace} à ${timeStr}, ${dateInfo.label})`,
              reproCommand: `npx tsx tools/chroniques/controle-trajets.ts --seeds 1 --startSeed ${seed} --days ${day + 1}`,
            });
          }
        }

        // --- Contrôle Emploi du Temps Incohérent ---
        if (isChild && currentPlace === 'college') {
          let scheduleError = '';
          if (isWeekend) scheduleError = `enfant au collège le week-end (${dateInfo.label})`;
          else if (vacances) scheduleError = `enfant au collège pendant les vacances scolaires (${dateInfo.iso})`;
          else if (!schoolDay) scheduleError = `enfant au collège un jour non d'école`;
          else if (isWednesday && minutes >= 13 * 60 + 30) scheduleError = `enfant au collège le mercredi après-midi (${timeStr})`;
          else if (minutes < 7 * 60 + 30 || minutes >= 18 * 60) scheduleError = `enfant au collège en dehors des heures de cours (${timeStr})`;

          if (scheduleError) {
            recordIssue({
              severity: 'bloquante',
              category: 'emploi_du_temps_incohérent',
              seed,
              day,
              dateIso: dateInfo.iso,
              time: timeStr,
              tick,
              npcId,
              npcName: def.name,
              place: currentPlace,
              description: `Emploi du temps enfant incohérent : ${scheduleError}`,
              reproCommand: `npx tsx tools/chroniques/controle-trajets.ts --seeds 1 --startSeed ${seed} --days ${day + 1}`,
            });
          }
        }

        if (!isChild && npcId === 'moreau' && currentPlace === 'college') {
          if (isWeekend || vacances) {
            recordIssue({
              severity: 'gênante',
              category: 'emploi_du_temps_incohérent',
              seed,
              day,
              dateIso: dateInfo.iso,
              time: timeStr,
              tick,
              npcId,
              npcName: def.name,
              place: currentPlace,
              description: `Enseignante au collège sur un jour de fermeture (${isWeekend ? 'week-end' : 'vacances'})`,
              reproCommand: `npx tsx tools/chroniques/controle-trajets.ts --seeds 1 --startSeed ${seed} --days ${day + 1}`,
            });
          }
        }
      }
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    issues,
    durationMs,
    totalTicksSimulated: seedsCount * totalTicksPerSeed,
    seedCount: seedsCount,
    daysCount,
  };
}

export function generateMarkdownReport(auditResult: ReturnType<typeof runTrajectoryAudit>): string {
  const { issues, durationMs, seedCount, daysCount, totalTicksSimulated } = auditResult;

  const severityOrder: Record<Severity, number> = { bloquante: 0, gênante: 1, cosmétique: 2 };
  const sortedIssues = [...issues].sort((a, b) => {
    const sDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sDiff !== 0) return sDiff;
    if (a.day !== b.day) return a.day - b.day;
    return a.tick - b.tick;
  });

  const bloquantesCount = issues.filter((i) => i.severity === 'bloquante').length;
  const gênantesCount = issues.filter((i) => i.severity === 'gênante').length;
  const cosmétiquesCount = issues.filter((i) => i.severity === 'cosmétique').length;

  let md = `# Rapport d'Analyse de Cohérence des Trajets PNJ

**Date d'exécution :** ${new Date().toISOString().split('T')[0]}
**Périmètre de test :** ${seedCount} graines, ${daysCount} jours de jeu (${totalTicksSimulated.toLocaleString()} ticks simulés)
**Durée totale d'exécution :** ${(durationMs / 1000).toFixed(2)} s (${(durationMs / seedCount).toFixed(1)} ms / graine)

## Synthèse du contrôle spatio-temporel

- **Bloquantes :** ${bloquantesCount}
- **Gênantes :** ${gênantesCount}
- **Cosmétiques :** ${cosmétiquesCount}
- **Total anomalies détectées :** ${issues.length}

---

## Tableau détaillé des incohérences détectées

| Gravité | Graine | Jour / Heure | PNJ | Lieu | Description du problème | Commande de reproduction |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- |
`;

  if (sortedIssues.length === 0) {
    md += `| Aucune | - | - | Aucun | - | Aucun problème spatio-temporel détecté ! | - |\n`;
  } else {
    for (const issue of sortedIssues) {
      const severityTag = issue.severity === 'bloquante' ? '🔴 **bloquante**' : issue.severity === 'gênante' ? '🟠 gênante' : '🟡 cosmétique';
      md += `| ${severityTag} | ${issue.seed} | J${issue.day} ${issue.time} | ${issue.npcName} (\`${issue.npcId}\`) | ${issue.place} | ${issue.description} | \`${issue.reproCommand}\` |\n`;
    }
  }

  md += `
---

## Recommandations & Analyse des causes

1. **Collège des Roses & Mercredi après-midi / Week-ends :**
   - Ajuster la sélection des créneaux dans \`slotFor()\` (\`src/simulation/npc.ts\`) pour libérer les élèves et enseignants après 13h30 le mercredi.
   - Supprimer le drapeau \`weekends: true\` sur le créneau de travail de Mme Moreau au collège.

2. **Accès aux lieux fermés :**
   - L'ouverture des lieux est centralisée dans \`src/simulation/places.ts\` (\`isPlaceOpen\`).
`;

  return md;
}

export async function mainCli(): Promise<void> {
  const proc = (globalThis as unknown as { process?: { argv: string[]; cwd: () => string } }).process;
  if (!proc) return;

  const args = proc.argv.slice(2);
  let seedsCount = 200;
  let daysCount = 60;
  let startSeed = 20200901;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seeds' && args[i + 1]) {
      seedsCount = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === '--days' && args[i + 1]) {
      daysCount = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === '--startSeed' && args[i + 1]) {
      startSeed = parseInt(args[i + 1]!, 10);
      i++;
    }
  }

  console.log(`[controle-trajets] Lancement de l'audit pour ${seedsCount} graines et ${daysCount} jours...`);
  const result = runTrajectoryAudit({ seedsCount, daysCount, startSeed });
  const mdReport = generateMarkdownReport(result);

  const nodeFs = (await import('node:fs')) as unknown as {
    mkdirSync: (p: string, o?: { recursive?: boolean }) => void;
    writeFileSync: (p: string, data: string, enc?: string) => void;
  };
  const nodePath = (await import('node:path')) as unknown as {
    join: (...parts: string[]) => string;
    dirname: (p: string) => string;
    resolve: (...parts: string[]) => string;
  };

  const outputPath = nodePath.resolve(proc.cwd(), 'docs/chroniques/RAPPORT-TRAJETS.md');
  nodeFs.mkdirSync(nodePath.dirname(outputPath), { recursive: true });
  nodeFs.writeFileSync(outputPath, mdReport, 'utf-8');

  console.log(`[controle-trajets] Audit terminé en ${(result.durationMs / 1000).toFixed(2)}s.`);
  console.log(`[controle-trajets] Rapport généré : ${outputPath}`);
  console.log(`[controle-trajets] Anomalies trouvées : ${result.issues.length} (${result.issues.filter((i) => i.severity === 'bloquante').length} bloquantes)`);
}

const procEnv = (globalThis as unknown as { process?: { argv: string[] } }).process;
if (procEnv?.argv[1] && (procEnv.argv[1].endsWith('controle-trajets.ts') || procEnv.argv[1].endsWith('controle-trajets.js'))) {
  void mainCli();
}

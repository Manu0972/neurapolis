/**
 * NEURAPOLIS — Outil de simulation du monde sur 100 ans (niveaux N0-N2).
 * Exécution CLI : npx tsx tools/monde/simuler.ts
 *
 * Exécute la simulation déterministe de 100 ans (2020 - 2120) et écrit le rapport
 * synthétique complet dans docs/monde/RAPPORT-SIMULATION.md.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createWorld } from '../../src/core/store';
import { simulate100Years } from '../../src/simulation/macro_world';
import type { MacroWorldState } from '../../src/core/macro_world_types';

export function formatMarkdownReport(mw: MacroWorldState): string {
  const perf = mw.performance ?? { runtimeMs: 0, heapUsedMB: 0, rssMB: 0 };

  const lines: string[] = [];

  lines.push('# 🌐 NEURAPOLIS — RAPPORT DE SIMULATION DE MONDE SUR 100 ANS (2020 – 2120)');
  lines.push('');
  lines.push('> **Note :** Ce rapport est généré automatiquement par l’outil déterministe `tools/monde/simuler.ts`.');
  lines.push('> Tous les événements, démographies, créations d’entreprises et biographies sont reproductibles à 100% avec le PRNG du projet (seed fixée).');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## ⚡ 1. Mesures de Performance et d’Empreinte Mémoire');
  lines.push('');
  lines.push('| Indicateur | Valeur Mesurée |');
  lines.push('| :--- | :--- |');
  lines.push(`| **Temps d'exécution total (100 ans)** | **${perf.runtimeMs.toFixed(2)} ms** |`);
  lines.push(`| **Mémoire Heap consommée (Delta)** | **${perf.heapUsedMB.toFixed(2)} MB** |`);
  lines.push(`| **Mémoire RSS totale du processus** | **${perf.rssMB.toFixed(2)} MB** |`);
  lines.push(`| **Années simulées** | ${mw.totalYearsSimulated} ans (${mw.startYear} – ${mw.currentYear}) |`);
  lines.push(`| **Citoyens totaux enregistrés** | ${mw.citizens.length} individus |`);
  lines.push(`| **Entreprises totales enregistrées** | ${mw.businesses.length} entités commerciales |`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 📈 2. Courbes et Évolution de la Population');
  lines.push('');
  lines.push(`- **Cumul total des naissances :** ${mw.totalBirths}`);
  lines.push(`- **Cumul total des décès :** ${mw.totalDeaths}`);
  lines.push(`- **Solde naturel net :** ${mw.totalBirths - mw.totalDeaths > 0 ? '+' : ''}${mw.totalBirths - mw.totalDeaths}`);
  lines.push('');
  lines.push('| Année | Population Totale | Naissances | Décès | Solde Naturel | Tendance Macro |');
  lines.push('| :---: | :---: | :---: | :---: | :---: | :--- |');

  // Filtrer l'historique par pas de 10 ans pour la vue d'ensemble, plus le premier et le dernier
  for (const h of mw.history) {
    if (h.year % 10 === 0 || h.year === mw.currentYear - 1) {
      const soldeNat = h.births - h.deaths;
      const soldeNatStr = soldeNat >= 0 ? `+${soldeNat}` : `${soldeNat}`;
      lines.push(`| **${h.year}** | ${h.populationTotal} | ${h.births} | ${h.deaths} | ${soldeNatStr} | \`${h.macroTrend}\` |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🏢 3. Dynamique des Entreprises (Nées & Disparues)');
  lines.push('');
  lines.push(`- **Entreprises nées au cours du siècle :** ${mw.totalBusinessesCreated}`);
  lines.push(`- **Entreprises disparues (cessations / faillites) :** ${mw.totalBusinessesClosed}`);
  lines.push(`- **Taux de pérennité global :** ${((1 - mw.totalBusinessesClosed / Math.max(1, mw.totalBusinessesCreated)) * 100).toFixed(1)} %`);
  lines.push('');
  lines.push('| Année | Entreprises Actives | Créations (Année) | Fermetures (Année) | Solde Entreprises |');
  lines.push('| :---: | :---: | :---: | :---: | :---: |');

  for (const h of mw.history) {
    if (h.year % 10 === 0 || h.year === mw.currentYear - 1) {
      const soldeBiz = h.businessesCreated - h.businessesClosed;
      const soldeBizStr = soldeBiz >= 0 ? `+${soldeBiz}` : `${soldeBiz}`;
      lines.push(`| **${h.year}** | ${h.businessesActive} | ${h.businessesCreated} | ${h.businessesClosed} | ${soldeBizStr} |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🧳 4. Flux Migratoires (Immigrations & Émigrations)');
  lines.push('');
  lines.push(`- **Total immigrants venus à Val-Ferrand :** ${mw.totalImmigrants}`);
  lines.push(`- **Total émigrants partis de Val-Ferrand :** ${mw.totalEmigrants}`);
  lines.push(`- **Solde migratoire net cumulé :** ${mw.totalImmigrants - mw.totalEmigrants > 0 ? '+' : ''}${mw.totalImmigrants - mw.totalEmigrants}`);
  lines.push('');
  lines.push('| Année | Immigrants (Entrées) | Émigrants (Sorties) | Solde Migratoire Annuel |');
  lines.push('| :---: | :---: | :---: | :---: |');

  for (const h of mw.history) {
    if (h.year % 10 === 0 || h.year === mw.currentYear - 1) {
      const soldeMig = h.netMigration;
      const soldeMigStr = soldeMig >= 0 ? `+${soldeMig}` : `${soldeMig}`;
      lines.push(`| **${h.year}** | ${h.immigrants} | ${h.emigrants} | ${soldeMigStr} |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 📜 5. 20 Biographies Tirées de Façon Reproductible');
  lines.push('');
  lines.push('Les 20 biographies ci-dessous ont été sélectionnées de façon totalement déterministe via le PRNG du monde sur l’ensemble des cohorts simulées (2020 – 2120).');
  lines.push('');

  for (let i = 0; i < mw.biographies.length; i++) {
    const bio = mw.biographies[i]!;
    lines.push(`### 👤 Biographie #${i + 1} — ${bio.name}`);
    lines.push(`- **Période :** ${bio.birthYear} – ${bio.deathYear ?? 'Présent'}`);
    lines.push(`- **Profession / Métier :** ${bio.profession}`);
    lines.push(`- **Résumé de vie :** ${bio.summary}`);
    lines.push('- **Chronologie des événements marquants :**');
    for (const ev of bio.timeline) {
      lines.push(`  - **${ev.year}** : ${ev.label}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Rapport de simulation NEURAPOLIS généré avec succès par `tools/monde/simuler.ts`.*');

  return lines.join('\n');
}

export function runSimulationAndWriteReport(): { world: ReturnType<typeof createWorld>; reportPath: string } {
  const world = createWorld({ seed: 20200901 });
  simulate100Years(world);

  const reportContent = formatMarkdownReport(world.macroWorld!);
  const outputDir = path.resolve(process.cwd(), 'docs/monde');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportPath = path.join(outputDir, 'RAPPORT-SIMULATION.md');
  fs.writeFileSync(reportPath, reportContent, 'utf-8');

  return { world, reportPath };
}

// Exécution directe si appelé en CLI
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Lancement de la simulation NEURAPOLIS sur 100 ans...');
  const { world, reportPath } = runSimulationAndWriteReport();
  const perf = world.macroWorld?.performance;
  console.log(`✅ Simulation terminée en ${perf?.runtimeMs} ms !`);
  console.log(`📄 Rapport généré dans : ${reportPath}`);
}

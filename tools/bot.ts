/**
 * Bot de simulation et QA pour NEURAPOLIS (Tâche A-5).
 * Simule N jours selon 3 stratégies distinctes et produit un export CSV :
 * 1. 'prudent' : marge basse, approvisionnement modéré, priorité aux relations et aux études.
 * 2. 'agressif' : marge forte, stock maximal, réinvestissement systématique du cash.
 * 3. 'cooperatif' : partage équitable des bénéfices, relations maximales avec les commerçants du quartier.
 *
 * Utilisation :
 * npx tsx tools/bot.ts [jours=30] [strategie=all]
 */

import { createWorld } from '../src/core/store';
import { tickWorld } from '../src/simulation/engine';
import type { WorldState } from '../src/core/types';

export type StrategyType = 'prudent' | 'agressif' | 'cooperatif';

export interface BotSimulationResult {
  readonly day: number;
  readonly strategy: StrategyType;
  readonly cashEuro: number;
  readonly reputation: number;
  readonly currentAge: number;
  readonly chapter: number;
  readonly actionsCount: number;
}

export function runBotSimulation(strategy: StrategyType, daysCount = 30, seed = 42): BotSimulationResult[] {
  const world: WorldState = createWorld({ seed });
  const results: BotSimulationResult[] = [];

  for (let day = 1; day <= daysCount; day++) {
    // Actions selon la stratégie au début de chaque journée
    if (strategy === 'prudent') {
      // Stratégie prudente : achat limité si trésorerie suffisante
      if (world.player.money >= 15 && world.project) {
        world.project.stock = Math.min(100, world.project.stock + 10);
        world.player.money -= 8;
      }
    } else if (strategy === 'agressif') {
      // Stratégie agressive : achat massif de stock
      if (world.player.money >= 30 && world.project) {
        world.project.stock = Math.min(200, world.project.stock + 35);
        world.player.money -= 25;
      }
    } else if (strategy === 'cooperatif') {
      // Stratégie coopérative : don au quartier ou réinvestissement solidaire
      if (world.player.money >= 20 && world.project) {
        world.project.stock = Math.min(120, world.project.stock + 15);
        world.player.money -= 12;
        world.district.confianceQuartier = Math.min(100, world.district.confianceQuartier + 1);
      }
    }

    // Simulation d'une journée complète (24 ticks d'heures)
    for (let hour = 0; hour < 24; hour++) {
      tickWorld(world);
    }

    // Enregistrement de l'état quotidien
    results.push({
      day,
      strategy,
      cashEuro: Math.round(world.player.money * 100) / 100,
      reputation: Math.round(world.player.reputation * 10) / 10,
      currentAge: world.player.age,
      chapter: world.campaign.currentChapter,
      actionsCount: world.events.length,
    });
  }

  return results;
}

export function formatCsv(results: readonly BotSimulationResult[]): string {
  const headers = ['day', 'strategy', 'cashEuro', 'reputation', 'currentAge', 'chapter', 'actionsCount'];
  const rows = results.map((r) => [
    r.day,
    r.strategy,
    r.cashEuro,
    r.reputation,
    r.currentAge,
    r.chapter,
    r.actionsCount,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

// Déclaration ambiante pour compatibilité d'exécution CLI sans @types/node obligatoire
declare const process: { argv?: string[] } | undefined;

// Exécution autonome si appelé directement par Node / tsx
if (typeof process !== 'undefined' && process && process.argv && process.argv[1]?.includes('bot.ts')) {
  const daysArg = parseInt(process.argv[2] || '30', 10);
  const stratArg = (process.argv[3] as StrategyType) || 'prudent';

  let allResults: BotSimulationResult[] = [];
  if (stratArg === 'prudent' || stratArg === 'agressif' || stratArg === 'cooperatif') {
    allResults = runBotSimulation(stratArg, daysArg);
  } else {
    allResults = [
      ...runBotSimulation('prudent', daysArg),
      ...runBotSimulation('agressif', daysArg),
      ...runBotSimulation('cooperatif', daysArg),
    ];
  }

  const csvOutput = formatCsv(allResults);
  // Affichage direct du CSV sur la sortie standard
  console.log(csvOutput);
}

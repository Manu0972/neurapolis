/**
 * Les paliers 2 et 3 s'ouvrent en jeu normal (preuves : bénéfices, concepts, connexions,
 * réputation), sans tricher sur l'état : un joueur-robot simple joue avec le vrai moteur.
 * Sa routine : un petit boulot chez Mme Bertin quand il manque d'argent, une discussion par jour
 * avec Noah, les idées les moins chères lancées « à sa façon », les gains retirés, les affaires
 * qui gagnent agrandies, les caisses dans le rouge renflouées.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { type WorldState } from '../src/core/types';
import { dayIndexOf, minutesOfDay } from '../src/core/clock';
import { tickWorld } from '../src/simulation/engine';
import { startShift } from '../src/simulation/jobs';
import { replyDialogue } from '../src/simulation/dialogue';
import { IDEAS } from '../src/data/ascension/ideas';
import {
  dailyFixed, ensureAscension, injectVenture, ideaStatus, investCost, investVenture, provenProfit, requestLaunch, rescueVenture, resolveLaunch,
  withdrawVenture,
} from '../src/simulation/ascension';

interface Journey { tier2?: number; tier3?: number; launch3?: number; day: number; money: number; profit: number; ventures: number }

function morningRoutine(w: WorldState): void {
  const a = ensureAscension(w);
  for (const run of Object.values(a.ventures)) {
    if (run.closed) continue;
    if (run.cash < 0) rescueVenture(w, run.ideaId);
    // On garde trois jours de coûts fixes en caisse, on retire le reste.
    const keep = dailyFixed(run) * 3;
    if (run.cash > keep + 1) {
      withdrawVenture(w, run.ideaId);
      injectVenture(w, run.ideaId, keep);
    }
  }
  // Lancer l'idée disponible la moins chère, en gardant une petite réserve.
  const open = IDEAS.filter((i) => i.tier <= a.tier && (!a.ventures[i.id] || a.ventures[i.id]!.closed))
    .map((i) => ({ i, st: ideaStatus(w, i.id) }))
    .filter((x) => x.st.available && w.player.money >= x.st.cost * 1.1)
    .sort((x, y) => x.st.cost - y.st.cost);
  if (open[0] && requestLaunch(w, open[0].i.id).ok) resolveLaunch(w, 'C');
  // Agrandir une affaire qui gagne.
  for (const run of Object.values(a.ventures)) {
    if (run.closed || run.level >= 3 || (run.last?.profit ?? 0) <= 0) continue;
    if (w.player.money >= investCost(run) * 1.5) investVenture(w, run.ideaId);
  }
}

function playNormally(seed: number, maxDays: number): Journey {
  const w = createWorld({ seed });
  const a = ensureAscension(w);
  const j: Journey = { day: 0, money: 0, profit: 0, ventures: 0 };
  let lastDay = -1;
  let talked = -1;
  const start = dayIndexOf(w.time.tick);
  const launched3 = (): boolean => Object.keys(a.ventures).some((id) => IDEAS.find((i) => i.id === id)?.tier === 3);
  while (dayIndexOf(w.time.tick) - start < maxDays && !launched3()) {
    tickWorld(w);
    const day = dayIndexOf(w.time.tick);
    const min = minutesOfDay(w.time.tick);
    if (day !== lastDay && min >= 7 * 60) { lastDay = day; morningRoutine(w); }
    // Un petit boulot l'après-midi tant que l'argent manque ou que Mme Bertin ne le connaît pas encore.
    if ((min === 16 * 60 + 10 || min === 14 * 60 + 10) && (w.player.money < 40 || (w.flags['jobShiftsDone'] ?? 0) < 3)) startShift(w);
    // Une discussion par jour avec Noah, en fin de journée.
    if (min === 19 * 60 + 30 && talked !== day) { talked = day; replyDialogue(w, 'noah', 'chaleureux'); }
    if (a.tier >= 2 && j.tier2 === undefined) j.tier2 = day - start;
    if (a.tier >= 3 && j.tier3 === undefined) j.tier3 = day - start;
    if (launched3() && j.launch3 === undefined) j.launch3 = day - start;
  }
  j.day = dayIndexOf(w.time.tick) - start;
  j.money = Math.round(w.player.money);
  j.profit = Math.round(provenProfit(w));
  j.ventures = Object.values(a.ventures).filter((r) => !r.closed).length;
  return j;
}

describe('paliers atteignables en jeu normal', () => {
  it('la Cour mène au Quartier en quelques semaines, le Quartier à la Ville en quelques mois, puis une affaire de la Ville se finance', () => {
    for (const seed of [2, 9]) {
      const j = playNormally(seed, 200);
      console.log(`graine ${seed} : palier 2 au jour ${j.tier2}, palier 3 au jour ${j.tier3}, première affaire de la Ville au jour ${j.launch3} (bénéfices ${j.profit} €, ${j.ventures} affaires, ${j.money} € en poche)`);
      expect(j.tier2, `graine ${seed}`).toBeDefined();
      expect(j.tier2!, `graine ${seed}`).toBeLessThanOrEqual(45);
      expect(j.tier3, `graine ${seed}`).toBeDefined();
      expect(j.tier3!, `graine ${seed}`).toBeLessThanOrEqual(150);
      // Une fois en Ville, une première grande affaire se finance en quelques semaines d'épargne.
      expect(j.launch3, `graine ${seed}`).toBeDefined();
      expect(j.launch3! - j.tier3!, `graine ${seed}`).toBeLessThanOrEqual(60);
    }
  }, 120000);
});

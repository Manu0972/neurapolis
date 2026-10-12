/**
 * Équilibrage des paliers 1 à 3 de l'Ascension (sprint V1) : chaque idée se lance, tourne et
 * rapporte avec un jeu raisonnable (le joueur renfloue quand une voix le prévient), sur plusieurs
 * graines et avec chacune des trois voies. Aucune faillite mécanique pendant le lancement.
 * Simulation déterministe : mêmes graines, mêmes résultats.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { dayIndexOf } from '../src/core/clock';
import { runTicks } from '../src/simulation/engine';
import { IDEAS, type IdeaDef } from '../src/data/ascension/ideas';
import {
  VERDICT_DAYS, ascensionDay, ensureAscension, ideaDailyEstimate, marketTrend, provenProfit, rescueAmount, rescueVenture,
  requestLaunch, resolveLaunch,
} from '../src/simulation/ascension';

const SEEDS = [1, 7, 42];
const DAYS = 60;
const V1_IDEAS = IDEAS.filter((i) => i.tier <= 3);

interface Outcome { closed: boolean; net: number; perDay: number; closedBeforeVerdict: boolean }

/** Lance une idée avec une voie, joue `days` jours ; `care` = le joueur renfloue quand la caisse passe dans le rouge. */
function play(idea: IdeaDef, k: 'A' | 'B' | 'C', seed: number, care: boolean, days = DAYS, full = false): Outcome {
  const w = createWorld({ seed });
  const a = ensureAscension(w);
  a.tier = idea.tier;
  if (idea.flag) w.flags[idea.flag.id] = idea.flag.value;
  if (idea.minAge) w.player.age = idea.minAge;
  w.player.money = idea.startCost * 2;
  const m0 = w.player.money;
  expect(requestLaunch(w, idea.id).ok).toBe(true);
  expect(resolveLaunch(w, k).ok).toBe(true);
  let own = m0 - w.player.money;
  const run = a.ventures[idea.id]!;
  let closedBeforeVerdict = false;
  for (let d = 0; d < days && !run.closed; d++) {
    stepDay(w, full);
    if (run.closed && !run.verdictDone) closedBeforeVerdict = true;
    if (care && run.cash < 0) {
      const before = w.player.money;
      rescueVenture(w, idea.id);
      own += before - w.player.money;
    }
  }
  const loan = Object.values(run.universes).reduce((s, u) => s + (u?.loan ?? 0), 0);
  return { closed: !!run.closed, net: run.cash - own - loan, perDay: run.profitTotal / days, closedBeforeVerdict };
}

/** Un jour : moteur complet (fil d'infos, surprises…) ou clôture de l'Ascension seule (rapide). */
function stepDay(w: WorldState, full: boolean): void {
  if (full) { runTicks(w, TICKS_PER_DAY); return; }
  const day = dayIndexOf(w.time.tick);
  w.time.tick += TICKS_PER_DAY;
  ascensionDay(w, day);
}

describe('idées des paliers 1 à 3', () => {
  it('au moins cinq idées lançables sans condition spéciale à chaque palier', () => {
    for (const tier of [1, 2, 3] as const) {
      const open = V1_IDEAS.filter((i) => i.tier === tier && !i.flag && !(i.needs?.length));
      expect(open.length, `palier ${tier}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('jeu raisonnable : chaque idée, chaque voie, chaque graine survit et rapporte en 60 jours', () => {
    const fails: string[] = [];
    for (const idea of V1_IDEAS) {
      for (const k of ['A', 'B', 'C'] as const) {
        for (const seed of SEEDS) {
          const o = play(idea, k, seed, true);
          if (o.closed || o.net <= 0 || o.perDay <= 0) fails.push(`${idea.id}/${k}/graine ${seed} : ${o.closed ? 'faillite' : `net ${Math.round(o.net)} €`}`);
        }
      }
    }
    expect(fails).toEqual([]);
  });

  it('lancer et oublier : aucune faillite avant le verdict', () => {
    for (const idea of V1_IDEAS) {
      for (const k of ['A', 'B', 'C'] as const) {
        for (const seed of SEEDS) {
          const o = play(idea, k, seed, false, VERDICT_DAYS + 1);
          expect(o.closedBeforeVerdict, `${idea.id}/${k}/${seed}`).toBe(false);
          expect(o.closed, `${idea.id}/${k}/${seed}`).toBe(false);
        }
      }
    }
  });

  it('avec le monde qui bouge (infos, surprises), les idées de la Cour tiennent quand on renfloue', () => {
    for (const idea of V1_IDEAS.filter((i) => i.tier === 1)) {
      const o = play(idea, 'C', 3, true, 45, true);
      expect(o.closed, idea.id).toBe(false);
      expect(o.net, idea.id).toBeGreaterThan(0);
    }
  });

  it('l’estimation affichée est positive et du bon ordre de grandeur par palier', () => {
    for (const idea of V1_IDEAS) {
      const est = ideaDailyEstimate(idea);
      expect(est, idea.id).toBeGreaterThan(0);
      expect(est, idea.id).toBeLessThan(idea.market);
    }
  });
});

describe('caisse dans le rouge', () => {
  function launched(): WorldState {
    const w = createWorld({ seed: 4 });
    w.player.money = 100;
    requestLaunch(w, 'gouters_cour');
    resolveLaunch(w, 'C');
    return w;
  }

  it('pendant le lancement on patiente, mais une voix prévient avec le geste qui sauve', () => {
    const w = launched();
    const run = ensureAscension(w).ventures['gouters_cour']!;
    // Caisse vide et aucun client encore : le premier soir, les coûts fixes la font passer dans le rouge.
    run.cash = 0;
    for (const u of Object.values(run.universes)) if (u) u.share = 0;
    const out = runTicks(w, 2 * TICKS_PER_DAY);
    run.cash = -500;
    runTicks(w, 10 * TICKS_PER_DAY);
    expect(run.closed).toBeFalsy();
    expect(run.redDays).toBe(0);
    const alert = out.find((n) => n.text.includes('passe dans le rouge'));
    expect(alert?.ghost).toBe('hayek');
    expect(alert?.text).toContain('Renflouer');
  });

  it('renflouer remet la caisse dans le vert avec trois jours d’avance', () => {
    const w = launched();
    const run = ensureAscension(w).ventures['gouters_cour']!;
    run.cash = -12;
    const need = rescueAmount(run);
    expect(need).toBeGreaterThan(12);
    const r = rescueVenture(w, 'gouters_cour');
    expect(r.ok).toBe(true);
    expect(run.cash).toBeGreaterThan(0);
    expect(rescueVenture(w, 'gouters_cour').ok).toBe(false);
  });

  it('sans un sou, renflouer explique quoi faire', () => {
    const w = launched();
    const run = ensureAscension(w).ventures['gouters_cour']!;
    run.cash = -12;
    w.player.money = 0;
    const r = rescueVenture(w, 'gouters_cour');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/petit boulot/);
  });
});

describe('lire la conjoncture', () => {
  it('la tendance du marché suit le cycle : les quatre phases passent en deux mois, déterministe', () => {
    const w = createWorld({ seed: 2 });
    const seen = new Set<string>();
    for (let d = 0; d < 60; d++) {
      seen.add(marketTrend(w, 'journal_college'));
      w.time.tick += TICKS_PER_DAY;
    }
    expect([...seen].sort()).toEqual(['bas', 'descend', 'haut', 'monte']);
    const x = createWorld({ seed: 2 });
    const y = createWorld({ seed: 2 });
    expect(marketTrend(x, 'agence_fetes')).toBe(marketTrend(y, 'agence_fetes'));
  });
});

describe('preuves de l’Ascension', () => {
  it('le Stand des Roses compte comme une affaire : ses ventes oui, les apports et les partages non', () => {
    const w = createWorld();
    const base = provenProfit(w);
    w.project = {
      id: 'stand_des_roses', active: true, stock: 0, price: 1.5, members: [], rules: { collectif: false, contratSecurite: false },
      sessionsDone: 0, coursesDone: 0, balance: 0, week: { index: 0, revenue: 0, expenses: 0, distributed: false }, work: {},
      ledger: [
        { day: 0, date: '', label: 'Apport de capital', amount: 15 },
        { day: 0, date: '', label: 'Achat de stock (20 unités)', amount: -15 },
        { day: 1, date: '', label: 'Vente — 20 unité(s) à 1.50 €', amount: 30 },
        { day: 7, date: '', label: 'Répartition — part de Noah', amount: -10 },
      ],
    };
    expect(provenProfit(w) - base).toBeCloseTo(15);
  });
});

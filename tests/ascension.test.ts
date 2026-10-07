/**
 * L'Ascension : idées au choix libre, double face à chaque lancement, trois univers jusqu'au
 * verdict, carnet d'économie, connexions, paliers, faillite, sauvegarde v17.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { CONCEPT_BY_ID } from '../src/data/ascension/concepts';
import { CONTACT_BY_ID } from '../src/data/ascension/contacts';
import { DUELS, DUEL_BY_ID } from '../src/data/ascension/duels';
import { IDEAS, TIERS } from '../src/data/ascension/ideas';
import {
  BANKRUPTCY_DAYS, VERDICT_DAYS, checkTier, ensureAscension, ideaStatus, investVenture, launchCost, refreshContacts,
  requestLaunch, resolveLaunch, withdrawVenture,
} from '../src/simulation/ascension';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

function launched(idea = 'gouters_cour', choice: 'A' | 'B' | 'C' = 'B', seed = 7) {
  const w = createWorld({ seed });
  w.player.money = 200;
  expect(requestLaunch(w, idea).ok).toBe(true);
  expect(resolveLaunch(w, choice).ok).toBe(true);
  return w;
}

describe('données de l’Ascension', () => {
  it('six paliers, au moins cinq idées chacun, références valides', () => {
    expect(TIERS).toHaveLength(6);
    for (const t of TIERS) expect(IDEAS.filter((i) => i.tier === t.id).length).toBeGreaterThanOrEqual(5);
    expect(new Set(IDEAS.map((i) => i.id)).size).toBe(IDEAS.length);
    for (const i of IDEAS) {
      expect(DUEL_BY_ID[i.duel]).toBeDefined();
      for (const c of [...(i.eases ?? []), ...(i.needs ?? [])]) expect(CONTACT_BY_ID[c]).toBeDefined();
    }
    for (const d of DUELS) {
      expect(CONCEPT_BY_ID[d.a.concept]).toBeDefined();
      expect(CONCEPT_BY_ID[d.b.concept]).toBeDefined();
    }
  });
});

describe('lancer une idée', () => {
  it('le palier 1 est ouvert, le palier 2 non', () => {
    const w = createWorld();
    w.player.money = 100;
    expect(ideaStatus(w, 'soutien_scolaire').available).toBe(true);
    expect(ideaStatus(w, 'livraison_courses').available).toBe(false);
  });

  it('le double face attend la décision ; le choix est suivi et payé', () => {
    const w = createWorld();
    w.player.money = 100;
    requestLaunch(w, 'gouters_cour');
    expect(ensureAscension(w).pending?.duelId).toBe('ford_ohno');
    const cost = launchCost(w, IDEAS.find((i) => i.id === 'gouters_cour')!);
    expect(resolveLaunch(w, 'A').ok).toBe(true);
    expect(w.player.money).toBeCloseTo(100 - cost);
    const a = ensureAscension(w);
    expect(a.ventures['gouters_cour']!.strategy).toBe('A');
    expect(a.trust['ford']!.followed).toBe(1);
    expect(a.trust['ohno']!.ignored).toBe(1);
    expect(ideaStatus(w, 'gouters_cour').available).toBe(false); // déjà lancée
  });

  it('l’emprunt de Keynes réduit l’apport et crée une dette', () => {
    const w = createWorld();
    w.player.money = 100;
    requestLaunch(w, 'journal_college');
    resolveLaunch(w, 'A');
    const run = ensureAscension(w).ventures['journal_college']!;
    expect(run.universes.A!.loan).toBeGreaterThan(0);
    expect(run.level).toBe(2);
    expect(w.player.money).toBeGreaterThan(100 - 15);
  });
});

describe('verdict', () => {
  it('après trois semaines, un fantôme a raison, un concept entre au carnet', () => {
    const w = launched();
    runTicks(w, (VERDICT_DAYS + 2) * TICKS_PER_DAY);
    const a = ensureAscension(w);
    const run = a.ventures['gouters_cour']!;
    expect(run.verdictDone).toBe(true);
    expect(Object.keys(run.universes)).toEqual(['B']);
    expect(a.verdicts).toHaveLength(1);
    expect(Object.keys(a.concepts).length).toBeGreaterThanOrEqual(1);
    const right = (a.trust['ford']?.right ?? 0) + (a.trust['ohno']?.right ?? 0);
    expect(right).toBe(1);
    expect(w.events.some((e) => e.title.startsWith('Verdict — '))).toBe(true);
  });

  it('déterministe : même graine, même verdict, même caisse', () => {
    const x = launched('cartes_collection', 'C', 11);
    const y = launched('cartes_collection', 'C', 11);
    runTicks(x, 25 * TICKS_PER_DAY);
    runTicks(y, 25 * TICKS_PER_DAY);
    expect(ensureAscension(x).ventures).toEqual(ensureAscension(y).ventures);
  });

  it('une petite affaire de la cour peut rapporter, et on retire ses gains', () => {
    const w = launched('soutien_scolaire', 'B');
    runTicks(w, 30 * TICKS_PER_DAY);
    const run = ensureAscension(w).ventures['soutien_scolaire']!;
    expect(run.revenueTotal).toBeGreaterThan(0);
    if (run.cash > 0) {
      const m = w.player.money;
      expect(withdrawVenture(w, 'soutien_scolaire').ok).toBe(true);
      expect(w.player.money).toBeGreaterThan(m);
    }
  });

  it('investir élargit le marché', () => {
    const w = launched();
    w.player.money = 1000;
    expect(investVenture(w, 'gouters_cour').ok).toBe(true);
    expect(ensureAscension(w).ventures['gouters_cour']!.level).toBe(2);
  });

  it('dix jours dans le rouge : faillite, et la leçon reste', () => {
    const w = launched();
    const run = ensureAscension(w).ventures['gouters_cour']!;
    run.cash = -100000;
    runTicks(w, (BANKRUPTCY_DAYS + 1) * TICKS_PER_DAY);
    expect(run.closed).toBe(true);
    expect(ensureAscension(w).concepts['faillite']).toBeDefined();
  });
});

describe('connexions et paliers', () => {
  it('trois services chez Mme Bertin : connexion, et lancement moins cher', () => {
    const w = createWorld();
    const idea = IDEAS.find((i) => i.id === 'gouters_cour')!;
    expect(launchCost(w, idea)).toBe(idea.startCost);
    w.flags['jobShiftsDone'] = 3;
    expect(refreshContacts(w)).toContain('bertin');
    expect(launchCost(w, idea)).toBeCloseTo(idea.startCost * 0.75);
  });

  it('les preuves font franchir le palier, pas la date', () => {
    const w = createWorld();
    const a = ensureAscension(w);
    w.player.reputation = 50;
    a.totalProfit = 200;
    expect(checkTier(w)).toHaveLength(0);
    a.concepts['marge'] = 0;
    checkTier(w);
    expect(a.tier).toBe(2);
  });

  it('une idée exige parfois une connexion précise', () => {
    const w = createWorld({ sandbox: true });
    const a = ensureAscension(w);
    a.tier = 4;
    w.player.money = 1e6;
    expect(ideaStatus(w, 'cooperative_laminoir').available).toBe(false);
    w.flags['laminoirChoix'] = 1;
    refreshContacts(w);
    expect(ideaStatus(w, 'cooperative_laminoir').available).toBe(true);
  });
});

describe('sauvegarde v17', () => {
  it('une sauvegarde v16 reçoit une Ascension vierge ; aller-retour fidèle', () => {
    const w = launched();
    const raw = JSON.parse(exportSave(w)) as Record<string, unknown>;
    raw.version = 16;
    delete raw.ascension;
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.ascension!.tier).toBe(1);
    expect(importSave(exportSave(w)).ascension).toEqual(w.ascension);
  });
});

describe('connexions gagnées en jouant', () => {
  it('aucune connexion d’office au début de la partie', () => {
    const w = createWorld();
    expect(refreshContacts(w)).toEqual([]);
    w.player.relations['lina']!.confiance = 75;
    expect(refreshContacts(w)).toEqual(['lina']);
  });
});

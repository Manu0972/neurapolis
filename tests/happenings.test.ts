/**
 * Le monde bouge : dépêches qui pèsent sur la demande d'un secteur, surprises bonnes ou
 * terribles (jamais au début), dilemmes défendus par deux fantômes, sauvegarde v18.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { NEWS, SURPRISES } from '../src/data/happenings_registry';
import { CONCEPT_BY_ID } from '../src/data/ascension/concepts';
import { GRACE_DAYS, difficulty, ensureHappenings, pendingSurprise, resolveSurprise } from '../src/simulation/happenings';
import { sectorDemand } from '../src/simulation/happenings_effects';
import { ensureAscension, requestLaunch, resolveLaunch } from '../src/simulation/ascension';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

describe('contenu', () => {
  it('identifiants uniques, dilemmes à deux options, concepts connus', () => {
    expect(new Set(NEWS.map((n) => n.id)).size).toBe(NEWS.length);
    expect(new Set(SURPRISES.map((s) => s.id)).size).toBe(SURPRISES.length);
    for (const s of SURPRISES) {
      expect([0, 2]).toContain(s.options?.length ?? 0);
      if (s.concept) expect(CONCEPT_BY_ID[s.concept]).toBeDefined();
    }
    for (const n of NEWS) for (const e of n.effects) expect(e.mult).toBeGreaterThan(0);
  });
});

describe('fil d’infos', () => {
  it('des dépêches tombent chaque jour et pèsent sur la demande', () => {
    const w = createWorld();
    const out = runTicks(w, 3 * TICKS_PER_DAY);
    const h = ensureHappenings(w);
    expect(h.news.length).toBeGreaterThan(0);
    expect(out.some((n) => n.text.startsWith('📰') && !!n.ghost)).toBe(true);
    const e = h.effects[0];
    if (e?.sector) expect(sectorDemand(w, e.sector)).not.toBe(1);
  });

  it('déterministe : même graine, même fil', () => {
    const a = createWorld({ seed: 5 });
    const b = createWorld({ seed: 5 });
    runTicks(a, 4 * TICKS_PER_DAY);
    runTicks(b, 4 * TICKS_PER_DAY);
    expect(ensureHappenings(a).news.map((n) => n.templateId)).toEqual(ensureHappenings(b).news.map((n) => n.templateId));
  });
});

describe('surprises', () => {
  it('aucune surprise pendant la période de grâce, difficulté nulle', () => {
    const w = createWorld();
    expect(difficulty(w)).toBe(0);
    runTicks(w, (GRACE_DAYS - 1) * TICKS_PER_DAY);
    expect(ensureHappenings(w).history).toHaveLength(0);
    expect(ensureHappenings(w).pending).toBeUndefined();
  });

  it('la difficulté monte avec le temps et le palier', () => {
    const w = createWorld();
    runTicks(w, (GRACE_DAYS + 40) * TICKS_PER_DAY);
    const d1 = difficulty(w);
    expect(d1).toBeGreaterThan(0);
    ensureAscension(w).tier = 5;
    expect(difficulty(w)).toBeGreaterThan(d1);
  });

  it('sur une longue période, il se passe des choses, bonnes et mauvaises', () => {
    const w = createWorld({ seed: 3 });
    w.player.money = 500;
    requestLaunch(w, 'gouters_cour');
    resolveLaunch(w, 'C');
    let guard = 0;
    while (guard++ < 120) {
      runTicks(w, TICKS_PER_DAY);
      if (pendingSurprise(w)) resolveSurprise(w, 0);
    }
    const tones = new Set(ensureHappenings(w).history.map((r) => r.tone));
    expect(ensureHappenings(w).history.length).toBeGreaterThan(2);
    expect(tones.size).toBeGreaterThanOrEqual(2);
  });

  it('un dilemme se résout par l’option choisie, et le fantôme qui la défendait est suivi', () => {
    const w = createWorld();
    const h = ensureHappenings(w);
    h.pending = { surpriseId: 's_rumeur', day: 0, target: undefined, targetName: 'Le stand' };
    const p = pendingSurprise(w)!;
    expect(p.text).toContain('« Le stand »');
    const r = resolveSurprise(w, 0);
    expect(r.ok).toBe(true);
    expect(h.pending).toBeUndefined();
    expect(ensureAscension(w).trust['weber']!.followed).toBe(1);
    expect(h.history[0]!.surpriseId).toBe('s_rumeur');
  });
});

describe('sauvegarde v18', () => {
  it('une sauvegarde v17 reçoit un fil vide ; aller-retour fidèle', () => {
    const w = createWorld();
    runTicks(w, 2 * TICKS_PER_DAY);
    const raw = JSON.parse(exportSave(w)) as Record<string, unknown>;
    raw.version = 17;
    delete raw.happenings;
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.happenings!.news).toEqual([]);
    expect(importSave(exportSave(w)).happenings).toEqual(w.happenings);
  });
});

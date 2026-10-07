/**
 * Retour en arrière : détection des très grosses erreurs, sacrifice d'une voix, savoir
 * conservé, voix qui revient, leçon qui prévient, sauvegarde v19.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { BANKRUPTCY_DAYS, ensureAscension, learnConcept, requestLaunch, resolveLaunch } from '../src/simulation/ascension';
import {
  SACRIFICE_DAYS, applyRewind, ensureRewind, isSilenced, lessonWarnings, netWorth, rewindOffer, sacrificeCandidates,
} from '../src/simulation/rewind';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

function bankrupt() {
  const w = createWorld();
  w.player.money = 200;
  requestLaunch(w, 'gouters_cour');
  resolveLaunch(w, 'B');
  const snapshot = structuredClone(w);
  ensureAscension(w).ventures['gouters_cour']!.cash = -100000;
  runTicks(w, (BANKRUPTCY_DAYS + 1) * TICKS_PER_DAY);
  return { w, snapshot };
}

describe('détection', () => {
  it('une faillite ouvre un retour en arrière, pendant deux jours seulement', () => {
    const { w } = bankrupt();
    const offer = rewindOffer(w)!;
    expect(offer.kind).toBe('faillite');
    expect(offer.ideaId).toBe('gouters_cour');
    runTicks(w, 3 * TICKS_PER_DAY);
    expect(rewindOffer(w)).toBeUndefined();
  });

  it('une chute de plus de 40 % de la valeur nette en un jour est une très grosse erreur', () => {
    const w = createWorld();
    w.player.money = 1000;
    runTicks(w, TICKS_PER_DAY);
    expect(netWorth(w)).toBeGreaterThanOrEqual(1000);
    w.player.money = 300;
    runTicks(w, TICKS_PER_DAY);
    expect(rewindOffer(w)?.kind).toBe('chute');
  });

  it('rien de grave : aucun retour proposé', () => {
    const w = createWorld();
    runTicks(w, 3 * TICKS_PER_DAY);
    expect(rewindOffer(w)).toBeUndefined();
  });
});

describe('sacrifice', () => {
  it('le monde d’avant revient, la voix se tait, le savoir reste', () => {
    const { w, snapshot } = bankrupt();
    learnConcept(w, 'marge');
    const ghost = sacrificeCandidates(w)[0]!;
    expect(ghost).toBeDefined();
    const back = applyRewind(snapshot, w, ghost);
    expect(back.time.tick).toBe(snapshot.time.tick);
    expect(ensureAscension(back).ventures['gouters_cour']!.closed).toBeFalsy();
    expect(ensureAscension(back).concepts['faillite']).toBeDefined();
    expect(ensureAscension(back).concepts['marge']).toBeDefined();
    const r = ensureRewind(back);
    expect(r.count).toBe(1);
    expect(r.lessons[0]!.kind).toBe('faillite');
    expect(isSilenced(back, ghost)).toBe(true);
    expect(sacrificeCandidates(back)).not.toContain(ghost);
    expect(w.rewind!.count).toBe(0); // le monde courant n'est pas modifié
  });

  it('la voix revient après son silence', () => {
    const { w, snapshot } = bankrupt();
    const ghost = sacrificeCandidates(w)[0]!;
    const back = applyRewind(snapshot, w, ghost);
    const out = runTicks(back, (SACRIFICE_DAYS + 1) * TICKS_PER_DAY);
    expect(isSilenced(back, ghost)).toBe(false);
    expect(out.some((n) => n.ghost === ghost && n.kind === 'fantome')).toBe(true);
  });

  it('si la même erreur recommence, la voix sacrifiée prévient', () => {
    const { w, snapshot } = bankrupt();
    const ghost = sacrificeCandidates(w)[0]!;
    const back = applyRewind(snapshot, w, ghost);
    expect(lessonWarnings(back)).toHaveLength(0);
    ensureAscension(back).ventures['gouters_cour']!.redDays = 3;
    expect(lessonWarnings(back)[0]!.ghost).toBe(ghost);
  });
});

describe('sauvegarde v19', () => {
  it('une sauvegarde v18 reçoit un état vierge ; aller-retour fidèle', () => {
    const { w } = bankrupt();
    const raw = JSON.parse(exportSave(w)) as Record<string, unknown>;
    raw.version = 18;
    delete raw.rewind;
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.rewind!.count).toBe(0);
    expect(importSave(exportSave(w)).rewind).toEqual(w.rewind);
  });
});

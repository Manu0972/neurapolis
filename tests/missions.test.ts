/**
 * Missions en étapes (vague 5) : une seule étape à la fois, déduite des objectifs des chapitres,
 * avec une cible suivie et une action directe. Un « joueur » qui ne lit que le bandeau doit finir
 * le chapitre 1.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type NpcId, type PlaceId, type WorldState } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { PLACE_ANCHORS } from '../src/data/map';
import { COUNTER_STRATEGIES } from '../src/data/rivals';
import { buyStock, createProject, recruitMember, runCourse, runSalesSession } from '../src/simulation/project';
import { npcLine, replyDialogue } from '../src/simulation/dialogue';
import { executeCounterStrategy } from '../src/simulation/rival';
import { placeAtAdjacent } from '../src/simulation/interact';
import { npcPosition } from '../src/simulation/npc';
import {
  HOME_VISIT_FLAG, MOVEMENT_LESSON_FLAG, currentMission, missionDistance, missionLine, missionTargetReached,
  missionTutorialActive, type MissionStep,
} from '../src/simulation/missions';
import { ecartFenetres, fenetresCalmes } from '../src/simulation/fenetres';
import { hudPartsWanted, nextHudReveal } from '../src/presentation/hud-reveal';

/** Samedi 5 septembre 2020, 14 h : pas de cours. Leçons de déplacement et de maison faites. */
function samedi(): WorldState {
  const w = createWorld({ seed: 7 });
  w.time.tick = 4 * TICKS_PER_DAY + 14 * 6;
  w.seen[MOVEMENT_LESSON_FLAG] = true;
  w.seen[HOME_VISIT_FLAG] = true;
  return w;
}

/** Exécute l'action directe de l'étape, comme le fait la touche E en jeu. */
function agir(w: WorldState, s: MissionStep): void {
  const a = s.action!;
  if (a.do === 'acheter_stock') { if (!w.project?.active) createProject(w); buyStock(w); return; }
  if (a.do === 'tenir_stand') { runSalesSession(w, placeAtAdjacent(w) ?? ''); runTicks(w, 6); return; }
  if (a.do === 'parler') { npcLine(w, a.npc!, 'projet'); replyDialogue(w, a.npc!, 'motive'); runTicks(w, 1); return; }
  if (a.do === 'recruter') { recruitMember(w, a.npc! as NpcId); return; }
  if (a.do === 'passer_temps') { runTicks(w, 6); return; }
  if (a.do === 'course') { runCourse(w); runTicks(w, 2); return; }
  if (a.do === 'contre_offensive') {
    const def = [...COUNTER_STRATEGIES].sort((x, y) => x.costMoney - y.costMoney)[0]!;
    executeCounterStrategy(w, def.id, 1);
    runTicks(w, 1);
    return;
  }
  throw new Error(`action non prévue : ${a.do}`);
}

describe('missions en étapes', () => {
  it('nouvelle partie : apprendre à se déplacer, puis rentrer chez soi, puis en sortir', () => {
    const w = createWorld({ seed: 7 });
    const a = currentMission(w)!;
    expect(a.id).toBe('deplacement');
    expect(a.target).toBeUndefined();
    w.seen[MOVEMENT_LESSON_FLAG] = true;
    const b = currentMission(w)!;
    expect(b.id).toBe('maison');
    expect(b.target).toMatchObject({ kind: 'lieu', place: 'maison' });
    expect(b.rank).toBeGreaterThan(a.rank);
    w.seen[HOME_VISIT_FLAG] = true;
    const c = currentMission(w, { inside: true })!;
    expect(c.id).toBe('sortir');
    expect(c.rank).toBeGreaterThan(b.rank);
    expect(currentMission(w)!.rank).toBeGreaterThan(c.rank);
  });

  it('le tout premier pas : sortir de chez soi, puis aller acheter du stock à l’épicerie', () => {
    const w = samedi();
    const inside = currentMission(w, { inside: true })!;
    expect(inside.id).toBe('sortir');
    expect(inside.text).toBe('Sors de chez toi');
    expect(inside.rank).toBe(2);
    const s = currentMission(w)!;
    expect(s.kind).toBe('aller');
    expect(s.target).toMatchObject({ kind: 'lieu', place: 'epicerie' });
    expect(missionTargetReached(w, s.target!)).toBe(false);
    expect(missionDistance(w, s.target!)).toBeGreaterThan(0);
    expect(missionTutorialActive(w)).toBe(true);
  });

  it('arrivé à la cible, l’étape devient l’action directe, avec un rang supérieur', () => {
    const w = samedi();
    const go = currentMission(w)!;
    w.player.pos = { ...PLACE_ANCHORS.epicerie };
    const act = currentMission(w)!;
    expect(act.kind).toBe('faire');
    expect(act.action?.do).toBe('acheter_stock');
    expect(act.rank).toBeGreaterThan(go.rank);
  });

  it('le compteur de ventes suit les objectifs du chapitre', () => {
    const w = samedi();
    createProject(w);
    buyStock(w);
    w.player.pos = { ...PLACE_ANCHORS.place };
    const s = currentMission(w)!;
    expect(s.action?.do).toBe('tenir_stand');
    expect(missionLine(s)).toBe('Tiens ton stand sur la place du marché (0/3 ventes)');
    w.flags['ventes'] = 2;
    expect(currentMission(w)!.count).toEqual({ done: 2, total: 3, unit: 'ventes' });
  });

  it('sans stock, la mission renvoie d’abord à l’épicerie', () => {
    const w = samedi();
    createProject(w);
    expect(currentMission(w)!.target).toMatchObject({ place: 'epicerie' });
  });

  it('la cible PNJ suit le personnage quand il se déplace', () => {
    const w = samedi();
    createProject(w);
    w.flags['ventes'] = 3;
    const s = currentMission(w)!;
    expect(s.target?.kind).toBe('pnj');
    const npc = (s.target as { npc: string }).npc;
    expect(s.target).toMatchObject(npcPosition(w, npc));
    // Le PNJ change de lieu : la cible aussi.
    const other: PlaceId = w.npcs[npc]!.place === 'parc' ? 'friche' : 'parc';
    w.npcs[npc]!.place = other;
    const after = currentMission(w)!.target as { npc: string; x: number; y: number };
    expect(after).toMatchObject(npcPosition(w, after.npc));
    if (after.npc === npc) expect(after).not.toMatchObject({ x: s.target!.x, y: s.target!.y });
  });

  it('pendant les heures de cours, la mission envoie au collège', () => {
    const w = createWorld({ seed: 3 });
    w.time.tick = 8 * 6; // mardi 1er septembre, 8 h
    w.seen[MOVEMENT_LESSON_FLAG] = true;
    w.seen[HOME_VISIT_FLAG] = true;
    const s = currentMission(w)!;
    expect(s.id).toBe('cours:matin');
    expect(s.target).toMatchObject({ place: 'college' });
  });

  it('un joueur qui suit uniquement le bandeau termine le chapitre 1', () => {
    const w = samedi();
    const seen: string[] = [];
    let maxRank = -1;
    let fetes = 0;
    for (let i = 0; i < 400 && w.campaign.currentChapter === 1; i++) {
      const s = currentMission(w);
      expect(s, `itération ${i}`).not.toBeNull();
      if (seen[seen.length - 1] !== s!.id) seen.push(s!.id);
      if (s!.rank > maxRank) { if (maxRank >= 0) fetes++; maxRank = s!.rank; }
      if (s!.target && !missionTargetReached(w, s!.target)) {
        w.player.pos = { x: s!.target.x, y: s!.target.y };
        continue;
      }
      if (s!.action) agir(w, s!);
      else runTicks(w, 6); // attendre (cours, nuit, fin de journée)
    }
    expect(w.campaign.currentChapter).toBe(2);
    expect(w.campaign.completedChapters).toContain(1);
    expect(fetes).toBeGreaterThanOrEqual(6);
    expect(seen).toEqual(expect.arrayContaining(['c1:stock:faire', 'c1:vente:faire', 'c1:recruter:faire', 'c1:riposte:faire']));
    expect(missionTutorialActive(w)).toBe(false);
  });

  it('chapitres suivants : Samir au chapitre 2, courses au chapitre 3', () => {
    const w = samedi();
    w.campaign.currentChapter = 2;
    w.campaign.stages.find((s) => s.chapter === 1)!.completed = true;
    expect(currentMission(w)!.target).toMatchObject({ kind: 'pnj', npc: 'samir' });
    w.campaign.currentChapter = 3;
    const s3 = currentMission(w)!;
    expect(s3.target).toMatchObject({ place: 'epicerie' });
    expect(s3.count?.total).toBe(5);
  });

  it('chapitre 1 : aucune fenêtre automatique ; au chapitre 2 elles reviennent espacées', () => {
    const w = samedi();
    expect(fenetresCalmes(w)).toBe(true);
    w.campaign.currentChapter = 2;
    w.campaign.completedChapters.push(1);
    expect(fenetresCalmes(w)).toBe(false);
    expect(ecartFenetres(w)).toBeGreaterThan(6);
    w.campaign.currentChapter = 3;
    expect(ecartFenetres(w)).toBe(6);
  });

  it('HUD : au départ rien d’autre que l’essentiel, puis un élément à la fois', () => {
    const w = createWorld({ seed: 7 });
    expect(hudPartsWanted(w, currentMission(w))).toEqual([]);
    expect(nextHudReveal(w, currentMission(w))).toBeNull();
    w.seen[MOVEMENT_LESSON_FLAG] = true;
    w.seen[HOME_VISIT_FLAG] = true;
    w.player.pos = { ...PLACE_ANCHORS.epicerie };
    const s = currentMission(w)!;
    expect(s.action?.do).toBe('acheter_stock');
    expect(nextHudReveal(w, s)).toEqual({ part: 'argent', silent: false });
    w.seen['hud:argent'] = true;
    expect(nextHudReveal(w, s)).toBeNull();
    w.campaign.currentChapter = 2;
    w.campaign.completedChapters.push(1);
    expect(hudPartsWanted(w, null)).toContain('telephone');
  });

  it('lecture seule : calculer l’étape ne modifie pas le monde', () => {
    const w = samedi();
    const before = JSON.stringify(w);
    currentMission(w, { inside: true });
    currentMission(w);
    expect(JSON.stringify(w)).toBe(before);
  });
});

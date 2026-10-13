/**
 * Cadence des fenêtres automatiques sur les trois premiers jours (mesure déterministe).
 *
 * Le joueur va en cours, tient son stand après les cours (ce qui réveille les premières voix)
 * et ferme TOUTES les fenêtres par ✕ — le pire cas signalé en jeu. La file d'attente de la
 * présentation est reproduite : une fenêtre automatique au plus par heure de jeu, pas pendant
 * le sommeil ni en classe.
 */
import { describe, expect, it } from 'vitest';
import { createCustomWorld } from '../src/core/player_customization';
import { dayIndexOf, minutesOfDay } from '../src/core/clock';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { PLACE_ANCHORS } from '../src/data/map';
import { tickWorld } from '../src/simulation/engine';
import { finishOrigin } from '../src/simulation/story';
import { attendClass, classWindow, isInClass } from '../src/simulation/family';
import { buyStock, createProject, runSalesSession } from '../src/simulation/project';
import { councilArrivalSlotOpen, councilPendingArrivals } from '../src/simulation/council';
import { pendingSurprise } from '../src/simulation/happenings';
import { pendingSchoolEvent } from '../src/simulation/school_events';
import {
  arriveesAProposer, ecoleAProposer, fenetreEncoreEnAttente, fermerSansChoisir, surpriseAProposer, type FenetreAuto,
} from '../src/simulation/fenetres';

interface Mesure { fenetres: number; arriveesJour0: number; arrivees: number; forumOuvertures: number }

/** `ancien` : file d'avant (une fenêtre fermée revient une heure plus tard). */
function mesurer(seed: number, modele: 'ancien' | 'nouveau', jours = 3): Mesure {
  const w: WorldState = createCustomWorld({ seed, customization: { firstName: 'Alex', lastName: 'Rythme' } });
  finishOrigin(w);
  const d0 = dayIndexOf(w.time.tick);
  const end = w.time.tick + jours * TICKS_PER_DAY;
  const vues = new Set<string>();
  let arriveesJour0 = 0;
  let fenetres = 0;
  let forumOuvertures = 0;
  let derniere = -1e9;
  while (w.time.tick < end) {
    if (classWindow(w) && !isInClass(w)) attendClass(w);
    tickWorld(w);
    if (minutesOfDay(w.time.tick) === 17 * 60) {
      // Après les cours : le stand (premiers échanges → premières voix).
      createProject(w);
      for (let k = 0; k < 3; k++) {
        if ((w.project?.stock ?? 0) <= 0) buyStock(w);
        const a = PLACE_ANCHORS.place;
        w.player.pos = { x: a.x, y: a.y };
        runSalesSession(w, 'place');
      }
    }
    for (const id of councilPendingArrivals(w)) {
      if (vues.has(id)) continue;
      vues.add(id);
      if (dayIndexOf(w.time.tick) === d0) arriveesJour0 += 1;
    }
    if (w.time.tick - derniere < 6 || w.player.asleep || isInClass(w)) continue;
    let f: FenetreAuto | null = null;
    if (modele === 'ancien') {
      const a = councilPendingArrivals(w)[0];
      const s = w.happenings?.pending;
      const e = pendingSchoolEvent(w);
      if (a) f = { kind: 'arrivee', id: a };
      else if (s && pendingSurprise(w)) f = { kind: 'surprise', id: `${s.surpriseId}@${s.day}` };
      else if (e) f = { kind: 'ecole', id: e.id };
    } else {
      const a = arriveesAProposer(w)[0];
      f = a ? { kind: 'arrivee', id: a } : surpriseAProposer(w) ?? ecoleAProposer(w);
    }
    if (!f) continue;
    fenetres += 1;
    if (f.kind === 'ecole' && f.id === 'expo_metiers') forumOuvertures += 1;
    derniere = w.time.tick;
    // ✕ : fermée sans choisir.
    if (modele === 'nouveau' && fenetreEncoreEnAttente(w, f)) fermerSansChoisir(w, f);
  }
  return { fenetres, arriveesJour0, arrivees: vues.size, forumOuvertures };
}

const GRAINES = [1, 2, 3, 4, 5];

describe('cadence des fenêtres (3 premiers jours)', () => {
  it('au plus une arrivée de fantôme par jour, et une fenêtre fermée ne revient pas dans l’heure', () => {
    const lignes: string[] = [];
    for (const seed of GRAINES) {
      const m = mesurer(seed, 'nouveau');
      lignes.push(`graine ${seed} : ${m.fenetres} fenêtres, ${m.arrivees} arrivées (jour 0 : ${m.arriveesJour0})`);
      expect(m.arriveesJour0).toBeLessThanOrEqual(1);
      expect(m.arrivees).toBeLessThanOrEqual(4); // 3 × 24 h depuis le matin du jour 0 : quatre jours de calendrier entamés
      // Chaque décision : au plus deux ouvertures sur trois jours si le joueur ferme tout (arrivée, dilemme, collège).
      expect(m.fenetres).toBeLessThanOrEqual(10);
      expect(m.forumOuvertures).toBeLessThanOrEqual(2);
    }
    console.log(`[fenêtres] ${lignes.join(' | ')}`);
  });

  it('la règle d’une arrivée par jour s’applique aussi aux retours', () => {
    const w = createCustomWorld({ seed: 7, customization: { firstName: 'Alex', lastName: 'Rythme' } });
    const day = dayIndexOf(w.time.tick);
    expect(councilArrivalSlotOpen(w, day)).toBe(true);
    w.flags['conseilDerniereArrivee'] = day + 1;
    expect(councilArrivalSlotOpen(w, day)).toBe(false);
    expect(councilArrivalSlotOpen(w, day + 1)).toBe(true);
  });

  it('fermer deux fois un événement du collège vaut refus : il ne revient plus', () => {
    const w = createCustomWorld({ seed: 3, customization: { firstName: 'Alex', lastName: 'Rythme' } });
    w.flags['ecoleEnAttente'] = 1;
    const f = ecoleAProposer(w)!;
    expect(f).toBeTruthy();
    expect(fermerSansChoisir(w, f)).toBe('reportee');
    expect(ecoleAProposer(w)).toBeNull();
    w.time.tick += TICKS_PER_DAY;
    expect(ecoleAProposer(w)).toEqual(f);
    expect(fermerSansChoisir(w, f)).toBe('abandonnee');
    expect(pendingSchoolEvent(w)).toBeUndefined();
  });

  it('mesure avant/après (le modèle d’avant rouvre les fenêtres chaque heure)', () => {
    const avant = GRAINES.map((s) => mesurer(s, 'ancien'));
    const apres = GRAINES.map((s) => mesurer(s, 'nouveau'));
    const total = (ms: Mesure[]): number => ms.reduce((a, m) => a + m.fenetres, 0);
    console.log(`[fenêtres] file d'avant (règles d'arrivée actuelles) : ${total(avant)} — après : ${total(apres)}`);
    expect(total(apres)).toBeLessThan(total(avant));
  });
});

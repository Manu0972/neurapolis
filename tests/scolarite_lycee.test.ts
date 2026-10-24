/**
 * Scolarité : collège jusqu'en 3e, lycée dès la rentrée de la 2de (15 ans). Établissement, lieu des
 * cours et des missions, emploi du temps, camarades, textes, carton de rentrée, bilan d'un saut
 * d'un an (compteurs cumulés), anciennes sauvegardes (en 3e ou avant : le collège).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import type { WorldState } from '../src/core/types';
import { TICKS_PER_DAY } from '../src/core/types';
import { dayOfIso } from '../src/core/clock';
import { adapterTexteEcole } from '../src/core/school';
import { PLACE_ANCHORS } from '../src/data/map';
import { INTERIOR_PLACES } from '../src/data/interiors';
import { placeInteriorSpec } from '../src/presentation/city3d/interior3d';
import { attendClass, classWindow, ensureFamily, seanceLabel, sessionsFor } from '../src/simulation/family';
import { currentMission, HOME_VISIT_FLAG, MOVEMENT_LESSON_FLAG } from '../src/simulation/missions';
import { runTicks } from '../src/simulation/engine';
import { npcTick } from '../src/simulation/npc';
import { isPlaceOpen } from '../src/simulation/places';
import { nextStep } from '../src/simulation/guide';
import { shiftWindowOpen } from '../src/simulation/jobs';
import { personalize } from '../src/simulation/story';
import { skipTime } from '../src/simulation/timeskip';
import { eligibleSchoolEvents } from '../src/simulation/school_events';
import {
  AGE_LYCEE, classeScolaire, estLyceen, etablissementDe, etablissementScolaire, lieuScolaire,
} from '../src/simulation/school_life';

const tickAt = (iso: string, h: number, m = 0): number => dayOfIso(iso) * TICKS_PER_DAY + Math.floor((h * 60 + m) / 10);

/** Un joueur de `age` ans, un jour de classe (mardi 5 septembre 2023 ou mardi 6 octobre 2020), 8 h 10. */
function eleve(age: number, iso = age >= AGE_LYCEE ? '2023-09-05' : '2020-10-06'): WorldState {
  const w = createWorld({ seed: 11 });
  w.player.age = age;
  w.time.tick = tickAt(iso, 8, 10);
  w.seen[MOVEMENT_LESSON_FLAG] = true;
  w.seen[HOME_VISIT_FLAG] = true;
  return w;
}

describe('établissement selon la classe', () => {
  it('collège jusqu’en 3e, lycée dès la 2de', () => {
    for (const age of [12, 13, 14]) {
      expect(lieuScolaire(age)).toBe('college');
      expect(etablissementScolaire(age)).toBe('collège Jean-Moulin');
    }
    for (const age of [15, 16]) {
      expect(lieuScolaire(age)).toBe('lycee');
      expect(etablissementScolaire(age)).toBe('lycée Jean-Moulin');
    }
    expect(classeScolaire(14)).toBe('3e');
    expect(classeScolaire(15)).toBe('2de');
    expect(estLyceen(eleve(14))).toBe(false);
    expect(estLyceen(eleve(15))).toBe(true);
    expect(etablissementDe(eleve(14)).chef.role).toMatch(/collège/);
    expect(etablissementDe(eleve(15)).chef.role).toMatch(/lycée/);
  });

  it('le lycée existe sur la grande carte, atteignable, avec un intérieur à lui', () => {
    expect(PLACE_ANCHORS.lycee).toBeDefined();
    const home = PLACE_ANCHORS.maison;
    const d = Math.abs(PLACE_ANCHORS.lycee.x - home.x) + Math.abs(PLACE_ANCHORS.lycee.y - home.y);
    expect(d).toBeLessThan(450); // quelques minutes à pied
    const def = INTERIOR_PLACES.lycee;
    expect(def.title).toBe('Lycée Jean-Moulin');
    expect(def.rooms.map((r) => r.id)).toEqual(INTERIOR_PLACES.college.rooms.map((r) => r.id));
    expect(JSON.stringify(def)).not.toMatch(/collège|Collège/);
    const spec = placeInteriorSpec('lycee', 'classe');
    expect(spec?.title).toMatch(/Lycée Jean-Moulin/);
    expect(placeInteriorSpec('lycee')?.hotspots.some((h) => h.kind === 'sortie')).toBe(true);
    // Le collège garde son intérieur.
    expect(placeInteriorSpec('college')?.title).toMatch(/Collège Jean-Moulin/);
  });
});

describe('cours et missions', () => {
  it('en 3e : la mission envoie au collège, cours de 8 h 30 à 12 h', () => {
    const w = eleve(14);
    expect(sessionsFor(w).matin.start).toBe(8 * 60 + 30);
    expect(seanceLabel(w, 'matin')).toBe('8 h 30 – 12 h');
    const s = currentMission(w)!;
    expect(s.id).toBe('cours:matin');
    expect(s.target).toMatchObject({ place: 'college' });
    expect(s.text).toMatch(/collège/);
  });

  it('en 2de : la mission envoie au lycée, cours de 8 h à 12 h et de 14 h à 17 h', () => {
    const w = eleve(15);
    expect(seanceLabel(w, 'matin')).toBe('8 h – 12 h');
    expect(seanceLabel(w, 'apres')).toBe('14 h – 17 h');
    const s = currentMission(w)!;
    expect(s.id).toBe('cours:matin');
    expect(s.target).toMatchObject({ place: 'lycee', ...PLACE_ANCHORS.lycee });
    expect(s.text).toMatch(/lycée/);
    expect(s.text).not.toMatch(/collège/);
    expect(nextStep(w)?.text ?? '').not.toMatch(/collège/);
    // Devant le lycée : « Entre en cours ».
    w.player.pos = { ...PLACE_ANCHORS.lycee };
    const dedans = currentMission(w)!;
    expect(dedans.id).toBe('cours:matin:entrer');
    expect(dedans.target).toMatchObject({ place: 'lycee' });
    expect(dedans.text).toMatch(/lycée/);
  });

  it('le lycée ouvre ses portes les jours de classe, plus tôt que le collège ne ferme', () => {
    const w = eleve(15);
    expect(classWindow(w)).toBe('matin'); // 8 h 10 : de 7 h 30 à 11 h
    expect(attendClass(w).ok).toBe(true);
    expect(ensureFamily(w).inClass?.untilTick).toBe(tickAt('2023-09-05', 12));
    expect(w.flags['coursSuivis']).toBe(1);
    // Mercredi : matin seulement ; fermé le week-end.
    expect(isPlaceOpen('lycee', 10 * 60, true, false, false, 2)).toBe(true);
    expect(isPlaceOpen('lycee', 13 * 60, true, false, false, 3)).toBe(false);
    expect(isPlaceOpen('lycee', 10 * 60, false, true, false, 6)).toBe(false);
  });

  it('la mission « petit boulot » attend la sortie du lycée', () => {
    const lyceen = eleve(15);
    lyceen.time.tick = tickAt('2023-09-05', 16, 30);
    expect(shiftWindowOpen(lyceen).ok).toBe(false);
    lyceen.time.tick = tickAt('2023-09-05', 17, 40);
    expect(shiftWindowOpen(lyceen).ok).toBe(true);
    const collegien = eleve(14);
    collegien.time.tick = tickAt('2020-10-06', 16, 30);
    expect(shiftWindowOpen(collegien).ok).toBe(true);
  });
});

describe('camarades et enseignants', () => {
  it('la bande suit au lycée ; au collège ils restent au collège', () => {
    const l = eleve(15);
    l.time.tick = tickAt('2023-09-05', 10);
    npcTick(l);
    expect(l.npcs['noah']!.place).toBe('lycee');
    expect(l.npcs['lina']!.place).toBe('lycee');
    expect(l.npcs['moreau']!.place).toBe('lycee');
    const c = eleve(14);
    c.time.tick = tickAt('2020-10-06', 10);
    npcTick(c);
    expect(c.npcs['noah']!.place).toBe('college');
    // Le soir, retour chez soi comme avant.
    l.time.tick = tickAt('2023-09-05', 22);
    npcTick(l);
    expect(l.npcs['noah']!.place).not.toBe('lycee');
  });
});

describe('textes', () => {
  it('collège devient lycée pour un lycéen, pas pour un collégien ; le brevet des collèges reste', () => {
    expect(adapterTexteEcole('Va au collège Jean-Moulin', true)).toBe('Va au lycée Jean-Moulin');
    expect(adapterTexteEcole('Les collégiens du Collège', true)).toBe('Les lycéens du Lycée');
    expect(adapterTexteEcole('Brevet des collèges', true)).toBe('Brevet des collèges');
    expect(adapterTexteEcole('Va au collège', false)).toBe('Va au collège');
    expect(personalize(eleve(15), 'Retour au collège.')).toBe('Retour au lycée.');
    expect(personalize(eleve(14), 'Retour au collège.')).toBe('Retour au collège.');
  });
});

describe('rentrée en 2de', () => {
  it('le 1er septembre de 15 ans : carton de rentrée, brevet, lycée', () => {
    const w = createWorld({ seed: 5 });
    w.player.age = 14;
    w.time.tick = tickAt('2023-08-30', 7);
    runTicks(w, 1); // installe la classe de référence
    w.player.age = 15; // la campagne change l'âge le 1er septembre
    w.time.tick = tickAt('2023-09-01', 7);
    runTicks(w, 2);
    const evt = [...w.events].reverse().find((e) => e.title.startsWith('Rentrée en'));
    expect(evt?.title).toBe('Rentrée en 2de');
    expect(evt?.text).toMatch(/Premier jour au lycée Jean-Moulin/);
    expect(evt?.text).toMatch(/Brevet des collèges/);
    expect(w.flags['rentreeCarton']).toBe(15);
  });

  it('pas de carton aux autres rentrées', () => {
    const w = createWorld({ seed: 5 });
    w.player.age = 13;
    w.time.tick = tickAt('2022-08-30', 7);
    runTicks(w, 1);
    w.player.age = 14;
    w.time.tick = tickAt('2022-09-01', 7);
    runTicks(w, 2);
    expect(w.flags['rentreeCarton'] ?? 0).toBe(0);
  });

  it('les événements du brevet tombent à 14 ans, au printemps, pas au lycée', () => {
    const brevet = (age: number, iso: string): string[] => {
      const w = createWorld({ seed: 2 });
      w.player.age = age;
      w.time.tick = tickAt(iso, 10);
      if (w.ascension) w.ascension.tier = 3;
      return eligibleSchoolEvents(w).map((e) => e.id).filter((id) => id.startsWith('sch_brevet'));
    };
    expect(brevet(14, '2023-05-16').length).toBeGreaterThan(0);
    expect(brevet(14, '2022-10-12')).toHaveLength(0);
    expect(brevet(15, '2023-05-16')).toHaveLength(0);
  });
});

describe('bilan d’un saut d’un an', () => {
  it('la ligne « Cours suivis » est là même quand le journal des séances est plein', () => {
    const w = eleve(13, '2021-09-02');
    const f = ensureFamily(w);
    // Journal plafonné : 120 séances déjà notées (cas d'un joueur qui a deux ans de classe derrière lui).
    for (let i = 0; i < 120; i++) f.attended.push(`${i}:matin`);
    const r = skipTime(w, 'anniversaire');
    expect('error' in r).toBe(false);
    if (!('error' in r)) {
      const ligne = r.lines.find((l) => l.includes('Cours suivis'));
      expect(ligne).toBeDefined();
      expect(Number(/(\d+) demi-journée/.exec(ligne!)?.[1])).toBeGreaterThan(10);
    }
  });
});

describe('anciennes sauvegardes', () => {
  it('un monde en 3e (ou avant) garde le collège partout', () => {
    for (const age of [12, 13, 14]) {
      const w = eleve(age, '2020-10-06');
      expect(etablissementDe(w).place).toBe('college');
      expect(currentMission(w)?.target).toMatchObject({ place: 'college' });
    }
  });
});

/**
 * Tests M2 — quartier jouable : carte, routines à 8 h un jour d'école,
 * collisions murs/bords, journée complète simulée, interactions simples.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { dateOf, dayIndexOf, minutesOfDay } from '../src/core/clock';
import { TICKS_PER_DAY, type PlaceId } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { npcPosition, npcTick } from '../src/simulation/npc';
import { tryMove } from '../src/simulation/movement';
import { npcsNearby, placeAtAdjacent } from '../src/simulation/interact';
import { applyPlaceAction } from '../src/simulation/places';
import { dialogueTopics, npcLine, replyDialogue } from '../src/simulation/dialogue';
import { NPC_BY_ID } from '../src/data/npcs';
import {
  CITY, MAP_H, MAP_W, PLACE_ANCHORS, assertMapValid, entranceAt, isWalkable,
} from '../src/data/map';

const PLACE_IDS: PlaceId[] = ['maison', 'college', 'epicerie', 'friche', 'parc', 'place'];
/** Entrées réelles des lieux, lues dans la description de la ville (1 tuile = 1 m). */
const ENTRIES: ReadonlyArray<readonly [number, number, PlaceId]> = CITY.buildings.flatMap((b) =>
  b.doors.filter((d) => d.place).map((d) => [d.x, d.y, d.place!] as const));

describe('carte — ville de Val-Ferrand', () => {
  it('validation des données et une entrée par lieu', () => {
    expect(() => assertMapValid()).not.toThrow();
    expect(MAP_W).toBeGreaterThan(300);
    expect(MAP_H).toBeGreaterThan(200);
    expect(new Set(ENTRIES.map(([, , p]) => p))).toEqual(new Set(PLACE_IDS));
    expect(ENTRIES.length).toBe(PLACE_IDS.length);
  });

  it('les entrées mènent à leur lieu et restent franchissables', () => {
    for (const [x, y, place] of ENTRIES) {
      expect(entranceAt(x, y)).toBe(place);
      expect(isWalkable(x, y)).toBe(true);
    }
    for (const anchor of Object.values(PLACE_ANCHORS)) {
      expect(isWalkable(anchor.x, anchor.y)).toBe(true);
    }
    const college = CITY.buildings.find((b) => b.id === 'college')!;
    expect(isWalkable(college.x + 2, college.y + 2)).toBe(false); // intérieur du collège : mur
    expect(isWalkable(-1, 0)).toBe(false); // hors carte
  });
});

describe('routines — 8 h un jour d’école (mardi 1er septembre 2020)', () => {
  it('chaque PNJ est au bon endroit à 8 h', () => {
    const w = createWorld(); // mardi, 07:10
    runTicks(w, 5); // → 08:00
    expect(minutesOfDay(w.time.tick)).toBe(480);
    expect(dateOf(dayIndexOf(w.time.tick)).weekday).toBe(2);
    const at = (id: string): PlaceId => w.npcs[id]?.place ?? 'maison';
    expect(at('noah')).toBe('maison');     // 07:00–08:20 : prépare son sac
    expect(at('lina')).toBe('maison');     // 07:00–08:20 : petit-déjeuner
    expect(at('yasmine')).toBe('maison');  // 07:00–08:20 : réveil difficile
    expect(at('moreau')).toBe('college');  // 08:00–12:00 : enseigne
    expect(at('bertin')).toBe('epicerie'); // 07:30–13:00 : tient la boutique
    expect(at('karim')).toBe('place');     // 08:00–12:00 : cherche des annonces
    expect(at('monique')).toBe('maison');  // pas de créneau avant 09:00
    expect(at('samir')).toBe('maison');    // pas de créneau avant 08:30
  });

  it('à 8 h 30, les élèves sont en cours et Samir à la friche', () => {
    const w = createWorld();
    runTicks(w, 8); // → 08:30
    expect(minutesOfDay(w.time.tick)).toBe(510);
    for (const id of ['noah', 'lina', 'yasmine']) {
      expect(w.npcs[id]?.place).toBe('college');
    }
    expect(w.npcs['samir']?.place).toBe('friche');
    expect(w.npcs['karim']?.place).toBe('place');
  });
});

describe('collisions — murs et bords de carte', () => {
  it('un mur bloque le déplacement et la position ne change pas', () => {
    const w = createWorld();
    const college = CITY.buildings.find((b) => b.id === 'college')!;
    // Sur le trottoir, juste devant l'angle sud-ouest du collège (hors de la porte).
    const x = college.x + 1;
    const y = college.y + college.d;
    w.player.pos = { x, y };
    expect(isWalkable(x, y)).toBe(true);
    expect(isWalkable(x, y - 1)).toBe(false);
    expect(tryMove(w, 0, -1)).toBe(false);
    expect(w.player.pos).toEqual({ x, y });
    expect(tryMove(w, 0, 1)).toBe(true);
    expect(w.player.pos).toEqual({ x, y: y + 1 });
  });

  it('les bords de la carte bloquent le déplacement', () => {
    const w = createWorld();
    w.player.pos = { x: 0, y: 0 }; // carrefour nord-ouest, sur la chaussée
    expect(isWalkable(0, 0)).toBe(true);
    expect(tryMove(w, -1, 0)).toBe(false);
    expect(tryMove(w, 0, -1)).toBe(false);
    expect(w.player.pos).toEqual({ x: 0, y: 0 });
    expect(isWalkable(-1, 5)).toBe(false);
    expect(isWalkable(MAP_W, 5)).toBe(false);
    expect(isWalkable(5, MAP_H)).toBe(false);
  });

  it('le joueur part sur une tuile franchissable, devant chez lui', () => {
    const w = createWorld();
    expect(isWalkable(w.player.pos.x, w.player.pos.y)).toBe(true);
    expect(w.player.pos).toEqual(PLACE_ANCHORS.maison);
  });
});

describe('journée complète simulée — ne bloque jamais', () => {
  it('144 ticks consécutifs aboutissent à un état cohérent', () => {
    const w = createWorld({ seed: 42 });
    const t0 = w.time.tick;
    expect(() => runTicks(w, TICKS_PER_DAY)).not.toThrow();
    expect(w.time.tick).toBe(t0 + TICKS_PER_DAY);
    for (const n of Object.values(w.npcs)) {
      expect(PLACE_IDS).toContain(n.place);
    }
    const { fatigue, faim, stress, moral } = w.player.needs;
    for (const v of [fatigue, faim, stress, moral]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(Number.isFinite(w.rng)).toBe(true);
  });

  it('une semaine complète (week-end et vacances compris) non plus', () => {
    const w = createWorld({ seed: 7 });
    expect(() => runTicks(w, 7 * TICKS_PER_DAY)).not.toThrow();
    expect(dayIndexOf(w.time.tick)).toBe(7);
    for (const n of Object.values(w.npcs)) {
      expect(PLACE_IDS).toContain(n.place);
    }
  });
});

describe('interactions — lieux et PNJ', () => {
  it('détecte un lieu adjacent et les PNJ proches', () => {
    const w = createWorld();
    w.player.pos = { ...PLACE_ANCHORS.college }; // sur le trottoir, devant la porte du collège
    expect(placeAtAdjacent(w)).toBe('college');
    w.player.pos = { x: PLACE_ANCHORS.college.x, y: PLACE_ANCHORS.college.y + 2 }; // au bord de la chaussée
    expect(placeAtAdjacent(w)).toBeUndefined();

    w.time.tick = 101; // mardi 16:50 — Noah (et Monique) au parc
    npcTick(w);
    expect(w.npcs['noah']?.place).toBe('parc');
    const p = npcPosition(w, 'noah');
    expect(isWalkable(p.x, p.y)).toBe(true);
    w.player.pos = { ...p };
    expect(npcsNearby(w, 2).map((n) => n.id)).toContain('noah');
  });

  it('les actions de lieu ont des conséquences chiffrées', () => {
    const w = createWorld();
    const faim0 = w.player.needs.faim;
    expect(applyPlaceAction(w, 'maison', 'gouter').ok).toBe(true);
    expect(w.player.needs.faim).toBeLessThan(faim0);

    const money0 = w.player.money;
    expect(applyPlaceAction(w, 'epicerie', 'gouter').ok).toBe(true);
    expect(w.player.money).toBeLessThan(money0);
  });

  it('refuse un achat sans argent', () => {
    const w = createWorld();
    w.player.money = 0;
    expect(applyPlaceAction(w, 'epicerie', 'gouter').ok).toBe(false);
  });

  it('ne valide pas le débat de la place sans choix du projet urbain', () => {
    const w = createWorld();
    w.campaign.currentChapter = 4;
    w.player.age = 15;
    w.flags['chapitre4ConseilMobilise'] = 1;
    w.player.money = 100;
    const trustBefore = w.district.confianceQuartier;
    const outcome = applyPlaceAction(w, 'place', 'debat');

    expect(outcome.ok).toBe(false);
    expect(outcome.message).toContain('choisir un projet');
    expect(w.flags['chapitre4DebatCitoyen']).toBeUndefined();
    expect(w.district.confianceQuartier).toBe(trustBefore);
  });
});

describe('dialogues — Noah, Lina, Mme Bertin', () => {
  it('les trois ont des sujets multiples et des répliques tirées au PRNG', () => {
    for (const id of ['noah', 'lina', 'bertin']) {
      const topics = dialogueTopics(id);
      expect(topics.length).toBeGreaterThanOrEqual(2);
      const w = createWorld({ seed: 1 });
      const topic = topics[0];
      if (!topic) continue;
      const line = npcLine(w, id, topic);
      expect(NPC_BY_ID[id]?.topics[topic] ?? []).toContain(line);
    }
  });

  it('répondre modifie la relation 4D et reste borné 0-100', () => {
    const w = createWorld();
    const before = w.player.relations['noah']?.amitie ?? 0;
    replyDialogue(w, 'noah', 'chaleureux');
    expect(w.player.relations['noah']?.amitie).toBe(before + 1);
    const rel = w.player.relations['noah'];
    if (!rel) throw new Error('relation noah absente');
    rel.amitie = 100;
    replyDialogue(w, 'noah', 'chaleureux');
    expect(rel.amitie).toBe(100);
  });
});

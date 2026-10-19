/**
 * Vague 7 (retours de partie) — la maison en plusieurs pièces aux meubles utilisables, le collège
 * où l'on entre, son nom unique, sa distance réaliste depuis la Cité des Roses, et la touche E
 * qui fait entrer en cours à deux pas de la porte (au lieu d'ouvrir une discussion).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { CITY } from '../src/data/city/layout';
import { INTERIOR_PLACES } from '../src/data/interiors';
import { PLACE_BY_ID } from '../src/data/places';
import { PLACE_ANCHORS, isWalkable, MAP_W, MAP_H } from '../src/data/map';
import { indoorRooms, placeInteriorSpec } from '../src/presentation/city3d/interior3d';
import { findPath } from '../src/presentation/city3d/locomotion';
import { nearPlace, placeAtAdjacent } from '../src/simulation/interact';
import { classWindow } from '../src/simulation/family';
import { HOME_VISIT_FLAG, MOVEMENT_LESSON_FLAG, currentMission } from '../src/simulation/missions';
import { furnitureActionLabel, useFurniture } from '../src/simulation/interior_actions';

const at = (h: number, m = 0): number => Math.floor((h * 60 + m) / 10); // jour 0 (mardi 1er sept.)

describe('maison : plusieurs pièces reliées', () => {
  it('on entre dans le salon ; cuisine en bas, chambre et salle de bain à l’étage, grenier', () => {
    expect(indoorRooms('maison')).toEqual(['salon', 'cuisine', 'chambre', 'salle_de_bain', 'grenier']);
    const rooms = INTERIOR_PLACES.maison.rooms;
    // Chaque passage a son retour ; seule l'entrée donne sur le palier.
    for (const r of rooms) {
      for (const l of r.links ?? []) {
        expect(rooms.find((x) => x.id === l.to)?.links?.some((b) => b.to === r.id), `${r.id} → ${l.to}`).toBe(true);
      }
    }
    expect(rooms.filter((r) => r.exit !== false).map((r) => r.id)).toEqual(['salon']);
    expect(rooms.find((r) => r.id === 'salon')!.links!.find((l) => l.to === 'chambre')!.stairs).toBe(true);
  });

  it('en 3D : passages, escalier, sortie seulement dans l’entrée, points d’interaction séparés', () => {
    for (const place of ['maison', 'college'] as const) {
      for (const rid of indoorRooms(place)) {
        const spec = placeInteriorSpec(place, rid)!;
        const room = INTERIOR_PLACES[place].rooms.find((r) => r.id === rid)!;
        expect(spec.hotspots.some((h) => h.kind === 'sortie')).toBe(room.exit !== false);
        for (const l of room.links ?? []) expect(spec.hotspots.some((h) => h.kind === 'piece' && h.target === l.to)).toBe(true);
        if (room.links?.some((l) => l.stairs)) expect(spec.items.some((it) => it.kind === 'escalier')).toBe(true);
        for (const a of spec.hotspots) for (const b of spec.hotspots) {
          if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z), `${place}:${rid} ${a.id}/${b.id}`).toBeGreaterThan(0.9);
        }
        // À l'arrivée (seuil ou haut de l'escalier), aucune action n'est à portée : pas de sortie involontaire.
        for (const from of [undefined, ...(room.links ?? []).map((l) => l.to)]) {
          const s = placeInteriorSpec(place, rid, [], undefined, from)!;
          expect(s.hotspots.every((h) => Math.hypot(h.x - s.spawn!.x, h.z - s.spawn!.z) > 1.3), `${place}:${rid} depuis ${from}`).toBe(true);
        }
      }
    }
    expect(placeInteriorSpec('maison')!.title).toBe('Chez toi — Entrée et salon (en bas)');
  });
});

describe('maison : les meubles servent vraiment', () => {
  it('le lit : sieste d’une heure le jour, coucher le soir (le temps file jusqu’à 22 h)', () => {
    const w = createWorld();
    w.time.tick = at(15);
    w.player.needs.fatigue = 70;
    expect(furnitureActionLabel(w, 'maison', 'lit')).toContain('sieste');
    const r = useFurniture(w, 'maison', 'lit');
    expect(r.ok).toBe(true);
    expect(r.minutes).toBe(60);
    expect(w.player.needs.fatigue).toBe(45);
    w.time.tick = at(20, 30);
    expect(furnitureActionLabel(w, 'maison', 'lit')).toContain('te coucher');
    expect(useFurniture(w, 'maison', 'lit').minutes).toBe(90);
  });

  it('le bureau fait les devoirs du soir (une fois par jour), le frigo nourrit, la télé remonte le moral', () => {
    const w = createWorld();
    w.time.tick = at(18);
    const comp = w.player.characteristics.comprehension;
    const d1 = useFurniture(w, 'maison', 'bureau');
    expect(d1.ok).toBe(true);
    expect(w.player.characteristics.comprehension).toBe(comp + 2);
    const d2 = useFurniture(w, 'maison', 'bureau');
    expect(d2.ok).toBe(false);
    expect(d2.minutes).toBe(0);
    w.player.needs.faim = 80;
    expect(useFurniture(w, 'maison', 'frigo').minutes).toBe(15);
    expect(w.player.needs.faim).toBe(50);
    w.player.needs.moral = 40;
    useFurniture(w, 'maison', 'tele');
    expect(w.player.needs.moral).toBe(48);
  });

  it('raconte ce que l’on découvre (description du meuble) au lieu d’un simple libellé', () => {
    const w = createWorld();
    const r = useFurniture(w, 'maison', 'malle');
    expect(r.ok).toBe(true);
    expect(r.message).toContain('Ouvrir la malle de papy Lucien — ');
    expect(r.message).toContain('fiches de paie');
    expect(r.message).not.toContain('(20 min)');
  });
});

describe('collège Jean-Moulin', () => {
  it('un seul nom, enseigne 3D comprise', () => {
    const college = CITY.buildings.find((b) => b.id === 'college')!;
    expect(college.label).toBe('Collège Jean-Moulin');
    expect(PLACE_BY_ID.college.name).toBe('Collège Jean-Moulin');
    expect(INTERIOR_PLACES.college.title).toBe('Collège Jean-Moulin');
    expect(CITY.buildings.some((b) => /Taret/.test(b.label ?? '') && /oll[eè]ge/i.test(b.label ?? ''))).toBe(false);
  });

  it('à quelques minutes à pied de la Cité des Roses (200 à 400 m), plus juste en face', () => {
    const path = [{ x: PLACE_ANCHORS.maison.x + 0.5, z: PLACE_ANCHORS.maison.y + 0.5 }, ...findPath(PLACE_ANCHORS.maison, PLACE_ANCHORS.college, isWalkable, MAP_W, MAP_H)];
    let len = 0;
    for (let i = 1; i < path.length; i++) len += Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.z - path[i - 1]!.z);
    expect(len).toBeGreaterThan(200);
    expect(len).toBeLessThan(400);
  });

  it('on entre : hall, salle de classe à l’étage, cantine', () => {
    expect(indoorRooms('college')).toEqual(['hall', 'classe', 'cantine']);
    const w = createWorld();
    w.player.needs.faim = 70;
    expect(useFurniture(w, 'college', 'comptoir_self').ok).toBe(true);
    expect(w.player.needs.faim).toBe(25);
  });

  it('à deux pas de la porte pendant les cours, E fait entrer en cours (pas la discussion du camarade)', () => {
    const w = createWorld();
    w.seen[MOVEMENT_LESSON_FLAG] = true;
    w.seen[HOME_VISIT_FLAG] = true;
    w.time.tick = 0 * TICKS_PER_DAY + at(8, 10);
    expect(classWindow(w)).toBe('matin');
    const a = PLACE_ANCHORS.college;
    for (const [dx, dy] of [[0, 0], [-2, 2], [2, 1], [0, 2]] as const) {
      w.player.pos = { x: a.x + dx, y: a.y + dy };
      expect(nearPlace(w, 'college'), `${dx},${dy}`).toBe(true);
      expect(currentMission(w)?.id).toBe('cours:matin:entrer');
    }
    w.player.pos = { x: a.x, y: a.y + 4 };
    expect(nearPlace(w, 'college')).toBe(false);
    // Ailleurs, l'entrée d'un lieu reste la case collée à la porte : les camarades postés autour
    // d'un lieu restent joignables avec E.
    w.player.pos = { x: a.x, y: a.y + 2 };
    expect(placeAtAdjacent(w)).toBeUndefined();
  });
});

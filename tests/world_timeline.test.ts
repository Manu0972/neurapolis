/**
 * Chronologie du monde : déclenchement à la date, une seule fois, effets sur la demande,
 * fermeture du laminoir Taret en 2032 ; quartier de la Gare présent sur la carte.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { CITY } from '../src/data/city/layout';
import { TIMELINE_EFFECT_DAYS, timelineDemand, worldTimelineDay } from '../src/simulation/world_timeline';

/** Place le monde au 1er jour d'un mois donné (calendrier du jeu : départ le 1er septembre 2020). */
function setDate(w: ReturnType<typeof createWorld>, year: number, month: number): void {
  const start = Date.UTC(2020, 8, 1);
  const target = Date.UTC(year, month - 1, 1);
  w.time.tick = Math.round((target - start) / 86_400_000) * TICKS_PER_DAY + 60;
}

describe('chronologie du monde', () => {
  it('l’événement de la rentrée 2020 se déclenche le premier jour, une seule fois', () => {
    const w = createWorld();
    worldTimelineDay(w);
    expect(w.seen['timeline:rentree_2020_val_ferrand']).toBe(true);
    const n = w.events.length;
    worldTimelineDay(w);
    expect(w.events.length).toBe(n);
    expect(timelineDemand(w, 'papeterie')).toBeCloseTo(1.3);
  });

  it('l’effet sur la demande s’éteint après la période', () => {
    const w = createWorld();
    worldTimelineDay(w);
    w.time.tick += (TIMELINE_EFFECT_DAYS + 1) * TICKS_PER_DAY;
    expect(timelineDemand(w, 'papeterie')).toBe(1);
  });

  it('en 2032, le laminoir ferme et le quartier encaisse le choc', () => {
    const w = createWorld();
    const conf0 = w.district.confianceQuartier;
    setDate(w, 2032, 2);
    worldTimelineDay(w);
    expect(w.flags['laminoirFerme']).toBe(1);
    expect(w.district.confianceQuartier).toBe(Math.max(0, conf0 - 8));
    expect(w.events.some((e) => /laminoir/i.test(e.title))).toBe(true);
  });

  it('le quartier de la Gare et le laminoir existent, avec des locaux à part', () => {
    const ids = CITY.buildings.map((b) => b.id);
    expect(ids).toContain('gare');
    expect(ids).toContain('laminoir');
    expect(CITY.units.some((u) => u.id.startsWith('gare_'))).toBe(true);
  });
});

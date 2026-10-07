/**
 * Bus du Taret : arrêts sur le trottoir, trois lignes en boucle sur des rues réelles (ponts
 * pour le canal), correspondances, ticket (tarif jeune), horaires, quartiers fermés.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { isWalkable, surfaceAt, surfaceFast } from '../src/data/map';
import { BUS_LINES, BUS_LINE_BY_ID, BUS_STOPS } from '../src/data/city/transit';
import { ensureAscension } from '../src/simulation/ascension';
import { runTicks } from '../src/simulation/engine';
import { BUS_FARE, BUS_FARE_YOUTH, busRideTicks, busRoute, isOnBus, stopNear, stopOpen, takeBus } from '../src/simulation/transit';

function atStop(id: string, hour = 10) {
  const w = createWorld();
  runTicks(w, hour * 6 - (w.time.tick % TICKS_PER_DAY) + (w.time.tick % TICKS_PER_DAY > hour * 6 ? TICKS_PER_DAY : 0));
  const s = BUS_STOPS.find((b) => b.id === id)!;
  w.player.pos = { x: s.x, y: s.y };
  w.player.money = 20;
  return w;
}

describe('bus du Taret', () => {
  it('la ligne 1 garde ses 8 arrêts ; tous les arrêts sont distincts, sur des trottoirs praticables', () => {
    expect(BUS_LINE_BY_ID['1']!.stops).toHaveLength(8);
    expect(BUS_LINES).toHaveLength(3);
    expect(new Set(BUS_STOPS.map((s) => `${s.x},${s.y}`)).size).toBe(BUS_STOPS.length);
    for (const s of BUS_STOPS) {
      expect(isWalkable(s.x, s.y)).toBe(true);
      expect(surfaceAt(s.x, s.y)).toBe('trottoir');
      expect(s.lines.length).toBeGreaterThan(0);
    }
  });

  it('chaque tronçon suit une rue (même x ou même y) sur la chaussée, canal franchi par un pont', () => {
    for (const l of BUS_LINES) {
      for (let k = 0; k < l.path.length; k++) {
        const a = l.path[k]!;
        const b = l.path[(k + 1) % l.path.length]!;
        expect(a.x === b.x || a.y === b.y).toBe(true);
        const n = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        for (let t = 0; t <= n; t++) {
          const x = a.x + 4 + Math.sign(b.x - a.x) * t;
          const y = a.y + 4 + Math.sign(b.y - a.y) * t;
          expect(['chaussee', 'passage'], `ligne ${l.id} en (${x}, ${y})`).toContain(surfaceFast(x, y));
        }
      }
    }
  });

  it('le trajet suit la boucle : jamais plus court en allant plus loin', () => {
    expect(busRideTicks('jaures_croizat', 'marche')).toBeGreaterThanOrEqual(1);
    expect(busRideTicks('jaures_croizat', 'gare')).toBeGreaterThanOrEqual(busRideTicks('jaures_croizat', 'marche'));
    expect(busRideTicks('marche', 'jaures_croizat')).toBeGreaterThanOrEqual(busRideTicks('jaures_croizat', 'marche')); // sens unique
    expect(busRideTicks('gare', 'gare')).toBe(0);
  });

  it('relie tout le réseau, avec une correspondance au plus', () => {
    for (const a of BUS_STOPS) {
      for (const b of BUS_STOPS) {
        if (a.id === b.id) continue;
        const r = busRoute(a.id, b.id);
        expect(r, `${a.id} → ${b.id}`).toBeDefined();
        expect(r!.lines.length).toBeLessThanOrEqual(2);
      }
    }
    const r = busRoute('marche', 'hopital')!;
    expect(r.lines).toEqual(['1', '2']);
    expect(r.transfer).toBeDefined();
  });

  it('un collégien paie le tarif jeune et descend à la Gare', () => {
    const w = atStop('jaures_croizat');
    expect(stopNear(w)?.id).toBe('jaures_croizat');
    const r = takeBus(w, 'gare');
    expect(r.ok).toBe(true);
    expect(w.player.money).toBeCloseTo(20 - BUS_FARE_YOUTH);
    expect(stopNear(w, 0)?.id).toBe('gare');
    expect(isOnBus(w)).toBe(true);
    runTicks(w, busRideTicks('jaures_croizat', 'gare'));
    expect(isOnBus(w)).toBe(false);
    expect(BUS_FARE).toBeGreaterThan(BUS_FARE_YOUTH);
  });

  it('ne dépose pas dans un quartier fermé ; ouvre avec le palier, un seul ticket avec correspondance', () => {
    const w = atStop('marche');
    expect(stopOpen(w, 'roses_sud').open).toBe(false);
    const ko = takeBus(w, 'roses_sud');
    expect(ko.ok).toBe(false);
    expect(ko.message).toContain('Grand Ensemble');
    expect(w.player.money).toBe(20);
    ensureAscension(w).tier = 2;
    const ok = takeBus(w, 'roses_sud');
    expect(ok.ok).toBe(true);
    expect(ok.message).toContain('correspondance');
    expect(w.player.money).toBeCloseTo(20 - BUS_FARE_YOUTH);
  });

  it('pas de bus loin d’un arrêt, ni la nuit', () => {
    const far = createWorld();
    far.player.money = 20;
    if (!stopNear(far)) expect(takeBus(far, 'gare').ok).toBe(false);
    const night = atStop('marche', 23);
    expect(takeBus(night, 'gare').ok).toBe(false);
  });
});

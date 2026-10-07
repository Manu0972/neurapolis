/**
 * Ligne 1 des bus : arrêts sur le trottoir, ticket (tarif jeune), horaires de service,
 * trajet qui dépose à l'arrêt choisi et prend du temps de jeu.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { isWalkable, surfaceAt } from '../src/data/map';
import { BUS_STOPS } from '../src/data/city/transit';
import { runTicks } from '../src/simulation/engine';
import { BUS_FARE, BUS_FARE_YOUTH, busRideTicks, isOnBus, stopNear, takeBus } from '../src/simulation/transit';

function atStop(id: string, hour = 10) {
  const w = createWorld();
  runTicks(w, hour * 6 - (w.time.tick % TICKS_PER_DAY) + (w.time.tick % TICKS_PER_DAY > hour * 6 ? TICKS_PER_DAY : 0));
  const s = BUS_STOPS.find((b) => b.id === id)!;
  w.player.pos = { x: s.x, y: s.y };
  w.player.money = 20;
  return w;
}

describe('bus ligne 1', () => {
  it('8 arrêts distincts, sur des trottoirs praticables', () => {
    expect(BUS_STOPS).toHaveLength(8);
    expect(new Set(BUS_STOPS.map((s) => `${s.x},${s.y}`)).size).toBe(8);
    for (const s of BUS_STOPS) {
      expect(isWalkable(s.x, s.y)).toBe(true);
      expect(surfaceAt(s.x, s.y)).toBe('trottoir');
    }
  });

  it('le trajet suit la boucle : jamais plus court en allant plus loin', () => {
    expect(busRideTicks('jaures_croizat', 'marche')).toBeGreaterThanOrEqual(1);
    expect(busRideTicks('jaures_croizat', 'gare')).toBeGreaterThanOrEqual(busRideTicks('jaures_croizat', 'marche'));
    expect(busRideTicks('marche', 'jaures_croizat')).toBeGreaterThanOrEqual(busRideTicks('jaures_croizat', 'marche')); // sens unique
    expect(busRideTicks('gare', 'gare')).toBe(0);
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

  it('pas de bus loin d’un arrêt, ni la nuit', () => {
    const far = createWorld();
    far.player.money = 20;
    if (!stopNear(far)) expect(takeBus(far, 'gare').ok).toBe(false);
    const night = atStop('marche', 23);
    expect(takeBus(night, 'gare').ok).toBe(false);
  });
});

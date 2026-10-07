/**
 * Sur place : après le train, le temps attend le joueur ; chaque activité prend une
 * demi-journée, ne se fait qu'une fois par séjour et peut laisser un effet durable.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import {
  HALF_DAY_TICKS, TRAIN_TICKS, TRAVEL_ACTIVITIES, activitiesAt, doTravelActivity, isOnSite, isTraveling,
  leaveDestination, startTravel, travelShelfBonus, travelSlotsLeft, travelSupplierDiscount,
} from '../src/simulation/travel';

function onTrip(dest: string) {
  const w = createWorld();
  w.player.age = 19;
  w.player.money = 500;
  expect(startTravel(w, dest).ok).toBe(true);
  return w;
}

describe('voyage sur place', () => {
  it('chaque destination propose trois activités', () => {
    for (const d of ['neobaie', 'plateaublanc', 'ilesaphir']) expect(activitiesAt(d)).toHaveLength(3);
    expect(new Set(TRAVEL_ACTIVITIES.map((a) => a.id)).size).toBe(TRAVEL_ACTIVITIES.length);
  });

  it('le train arrive, puis une activité avance le temps d’une demi-journée', () => {
    const w = onTrip('neobaie');
    expect(isOnSite(w)).toBe(false);
    expect(doTravelActivity(w, 'nb_livraison').ok).toBe(false);
    runTicks(w, TRAIN_TICKS);
    expect(isOnSite(w)).toBe(true);
    const slots = travelSlotsLeft(w);
    const money = w.player.money;
    expect(doTravelActivity(w, 'nb_livraison').ok).toBe(true);
    expect(w.player.money).toBe(money + 32);
    expect(travelSlotsLeft(w)).toBe(slots - 1);
    expect(isOnSite(w)).toBe(false);
    expect(w.flags['voyageAvance']).toBe(w.time.tick + HALF_DAY_TICKS);
    runTicks(w, HALF_DAY_TICKS);
    expect(isOnSite(w)).toBe(true);
    expect(doTravelActivity(w, 'nb_livraison').ok).toBe(false); // une fois par séjour
    expect(doTravelActivity(w, 'pb_ferme').ok).toBe(false);     // pas dans cette ville
  });

  it('la criée du port donne une remise durable chez les grossistes', () => {
    const w = onTrip('neobaie');
    runTicks(w, TRAIN_TICKS);
    expect(travelSupplierDiscount(w)).toBe(0);
    expect(doTravelActivity(w, 'nb_marche_port').ok).toBe(true);
    expect(travelSupplierDiscount(w)).toBe(0.05);
    expect(w.events.some((e) => e.title.startsWith('Néo-Baie'))).toBe(true);
  });

  it('la conserverie de l’Île Saphir allonge la conservation', () => {
    const w = onTrip('ilesaphir');
    runTicks(w, TRAIN_TICKS);
    doTravelActivity(w, 'is_centrale');
    expect(travelShelfBonus(w)).toBe(1);
  });

  it('reprendre le train fait filer le temps jusqu’au retour', () => {
    const w = onTrip('plateaublanc');
    runTicks(w, TRAIN_TICKS);
    expect(leaveDestination(w).ok).toBe(true);
    expect(isOnSite(w)).toBe(false);
    runTicks(w, (w.flags['voyageRetour'] ?? 0) - w.time.tick);
    expect(isTraveling(w)).toBe(false);
    expect(w.flags['voyagesFaits']).toBe(1);
    expect(travelSlotsLeft(w)).toBe(0);
  });

  it('au second séjour, les activités redeviennent possibles', () => {
    const w = onTrip('plateaublanc');
    runTicks(w, TRAIN_TICKS);
    expect(doTravelActivity(w, 'pb_ecole').ok).toBe(true);
    leaveDestination(w);
    runTicks(w, (w.flags['voyageRetour'] ?? 0) - w.time.tick);
    expect(startTravel(w, 'plateaublanc').ok).toBe(true);
    runTicks(w, TRAIN_TICKS);
    expect(doTravelActivity(w, 'pb_ecole').ok).toBe(true);
  });
});

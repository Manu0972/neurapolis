/**
 * Vélo : achat, capacité de transport, refus sans argent ni en double.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { BIKE, buyBike, ownsBike } from '../src/simulation/vehicles';

describe('vélo', () => {
  it('s’achète dès 12 ans et augmente la capacité de transport', () => {
    const w = createWorld();
    w.player.money = 100;
    expect(ownsBike(w)).toBe(false);
    const cap = w.economy!.carryCapacity;
    expect(buyBike(w).ok).toBe(true);
    expect(ownsBike(w)).toBe(true);
    expect(w.player.money).toBe(100 - BIKE.price);
    expect(w.economy!.carryCapacity).toBe(cap + BIKE.extraCarry);
    expect(buyBike(w).ok).toBe(false);
  });

  it('refuse sans argent', () => {
    const w = createWorld();
    w.player.money = 10;
    expect(buyBike(w).ok).toBe(false);
    expect(ownsBike(w)).toBe(false);
  });
});

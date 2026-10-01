/**
 * Tests du socle M0 — PRNG mulberry32.
 * Contrat : même seed ⇒ même séquence ; l'état vit dans le monde, pas en global.
 */
import { describe, expect, it } from 'vitest';
import { makeSeed, rngChance, rngInt, rngNext, rngPick, rngRange } from '../src/core/rng';

describe('PRNG mulberry32 — déterminisme', () => {
  it('même seed ⇒ même séquence de floats (1000 tirages, état final inclus)', () => {
    const a = { rng: makeSeed(20200901) };
    const b = { rng: makeSeed(20200901) };
    const seqA: number[] = [];
    const seqB: number[] = [];
    for (let i = 0; i < 1000; i++) {
      seqA.push(rngNext(a));
      seqB.push(rngNext(b));
    }
    expect(seqA).toEqual(seqB);
    expect(a.rng).toBe(b.rng);
  });

  it('même seed ⇒ mêmes résultats pour rngRange, rngInt, rngChance et rngPick', () => {
    const a = { rng: makeSeed(7) };
    const b = { rng: makeSeed(7) };
    const couleurs = ['soleil', 'nuages', 'pluie'] as const;
    for (let i = 0; i < 200; i++) {
      expect(rngRange(a, 0.5, 2.5)).toBe(rngRange(b, 0.5, 2.5));
      expect(rngInt(a, 1, 6)).toBe(rngInt(b, 1, 6));
      expect(rngChance(a, 0.45)).toBe(rngChance(b, 0.45));
      expect(rngPick(a, couleurs)).toBe(rngPick(b, couleurs));
    }
  });

  it('seeds différents ⇒ séquences différentes', () => {
    const a = { rng: makeSeed(1) };
    const b = { rng: makeSeed(2) };
    const seqA = Array.from({ length: 100 }, () => rngNext(a));
    const seqB = Array.from({ length: 100 }, () => rngNext(b));
    expect(seqA).not.toEqual(seqB);
  });

  it('rngNext reste dans [0,1) et rngInt respecte ses bornes inclusives', () => {
    const s = { rng: makeSeed(1234) };
    for (let i = 0; i < 5000; i++) {
      const v = rngNext(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    for (let i = 0; i < 2000; i++) {
      const d = rngInt(s, 1, 6);
      expect(Number.isInteger(d)).toBe(true);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });

  it('makeSeed est déterministe et accepte les entiers négatifs', () => {
    expect(makeSeed(42)).toBe(makeSeed(42));
    expect(makeSeed(-5)).toBe(makeSeed(-5));
    expect(Number.isInteger(makeSeed(0))).toBe(true);
  });
});

/**
 * Tests du socle M0 — moteur de simulation.
 * 3 journées complètes : sommeil nocturne automatique, argent de poche hebdomadaire,
 * déterminisme bout-en-bout de runTicks.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { dateOf, dayIndexOf, minutesOfDay } from '../src/core/clock';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import type { Notification } from '../src/core/types';

const TICKS_PAR_JOUR = TICKS_PER_DAY;

describe('engine — 3 journées complètes', () => {
  it('runTicks avance de 3 journées : mardi 1er → vendredi 4 septembre 2020', () => {
    const w = createWorld();
    expect(w.time.tick).toBe(43); // mardi 07:10
    expect(dayIndexOf(w.time.tick)).toBe(0);

    const fin = runTicks(w, 3 * TICKS_PAR_JOUR);
    expect(w.time.tick).toBe(43 + 3 * TICKS_PAR_JOUR); // vendredi 07:10
    expect(dayIndexOf(w.time.tick)).toBe(3);
    expect(dateOf(3).iso).toBe('2020-09-04');
    expect(dateOf(3).weekday).toBe(5); // vendredi
    expect(minutesOfDay(w.time.tick)).toBe(430);
    expect(fin).toHaveLength(0); // rien à notifier dans le socle sur 3 jours de semaine
  });
});

describe('engine — sommeil nocturne automatique (22:00 → 07:00)', () => {
  it('endormi à 22:00, encore à 06:50, réveillé à 07:00 et à midi', () => {
    const w = createWorld(); // tick 43 = 07:10
    runTicks(w, 89); // → tick 132 = mardi 22:00
    expect(minutesOfDay(w.time.tick)).toBe(22 * 60);
    expect(w.player.asleep).toBe(true);

    runTicks(w, 53); // → tick 185 = mercredi 06:50
    expect(w.player.asleep).toBe(true);

    runTicks(w, 1); // → tick 186 = mercredi 07:00
    expect(w.player.asleep).toBe(false);

    runTicks(w, 54); // → tick 240 = mercredi 12:00
    expect(w.player.asleep).toBe(false);
  });

  it('la nuit répare : la fatigue baisse entre 22:00 et 07:00', () => {
    const w = createWorld();
    runTicks(w, 89); // mardi 22:00 — journée éveillée
    const fatigueAuCoucher = w.player.needs.fatigue;
    runTicks(w, 54); // mercredi 07:00 — nuit complète (stress ≤ 25 : récupération pleine)
    expect(w.player.needs.fatigue).toBeLessThan(fatigueAuCoucher);
  });
});

describe('engine — argent de poche hebdomadaire (+5 €, une fois par semaine)', () => {
  const argentDePoche = (notifs: Notification[]): Notification[] =>
    notifs.filter((n) => n.text.startsWith('Argent de poche'));

  it('aucun +5 pendant les 3 premières journées', () => {
    const w = createWorld();
    runTicks(w, 3 * TICKS_PAR_JOUR);
    expect(w.player.money).toBe(15);
  });

  it('une seule fois la première semaine : +5 au passage au 8e jour', () => {
    const w = createWorld();
    const notifs = runTicks(w, 8 * TICKS_PAR_JOUR); // jour 0 → jour 8
    expect(w.player.money).toBe(20);
    expect(argentDePoche(notifs)).toHaveLength(1);
  });

  it('exactement 2 fois en 16 jours : +5 les passages aux jours 7 et 14', () => {
    const w = createWorld();
    const notifs = runTicks(w, 16 * TICKS_PAR_JOUR);
    expect(w.player.money).toBe(25);
    expect(argentDePoche(notifs)).toHaveLength(2);
  });
});

describe('engine — déterminisme bout-en-bout', () => {
  it('même seed ⇒ mondes identiques après 500 ticks ; seed différente ⇒ mondes différents', () => {
    const a = createWorld({ seed: 99 });
    const b = createWorld({ seed: 99 });
    const c = createWorld({ seed: 100 });
    runTicks(a, 500);
    runTicks(b, 500);
    runTicks(c, 500);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

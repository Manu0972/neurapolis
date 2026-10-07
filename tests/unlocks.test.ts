/**
 * Fonctionnalités à débloquer : le téléphone s'étoffe quand le joueur a fait ses preuves,
 * chaque ouverture présentée par un fantôme ; le bac à sable ouvre tout.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { ensureAscension } from '../src/simulation/ascension';
import { APP_UNLOCKS, STARTING_APPS, isAppOpen } from '../src/simulation/unlocks';

describe('applications à débloquer', () => {
  it('au début, seules Ascension, Infos et Commandes sont ouvertes', () => {
    const w = createWorld();
    for (const id of STARTING_APPS) expect(isAppOpen(w, id)).toBe(true);
    for (const a of APP_UNLOCKS) expect(isAppOpen(w, a.id)).toBe(false);
  });

  it('le bac à sable ouvre tout', () => {
    const w = createWorld({ sandbox: true });
    for (const a of APP_UNLOCKS) expect(isAppOpen(w, a.id)).toBe(true);
  });

  it('deux concepts appris ouvrent la banque, et Keynes la présente le soir', () => {
    const w = createWorld();
    const a = ensureAscension(w);
    a.concepts['marge'] = 0;
    a.concepts['levier'] = 0;
    expect(isAppOpen(w, 'banque')).toBe(true);
    const out = runTicks(w, TICKS_PER_DAY);
    const intro = out.find((n) => n.text.startsWith('📱') && n.ghost === 'keynes');
    expect(intro).toBeDefined();
    expect(w.flags['appli:banque']).toBeGreaterThan(0);
    // Une fois présentée, elle reste ouverte, sans nouvelle présentation.
    delete a.concepts['levier'];
    expect(isAppOpen(w, 'banque')).toBe(true);
    expect(runTicks(w, TICKS_PER_DAY).some((n) => n.text.startsWith('📱'))).toBe(false);
  });
});

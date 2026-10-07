/**
 * Mesure : la sauvegarde reste petite sur une longue partie (localStorage plafonne vers 5 Mo).
 * 200 jours simulés avec une entreprise d'Ascension et la vie du collège.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { requestLaunch, resolveLaunch } from '../src/simulation/ascension';
import { skipTime } from '../src/simulation/timeskip';
import { runTicks } from '../src/simulation/engine';

describe('taille de la sauvegarde', () => {
  it('reste sous 600 Ko après 200 jours de jeu', () => {
    const w = createWorld();
    w.player.money = 500;
    requestLaunch(w, 'gouters_cour');
    resolveLaunch(w, 'B');
    for (let m = 0; m < 6; m++) skipTime(w, 'mois');
    runTicks(w, 30 * TICKS_PER_DAY);
    const bytes = JSON.stringify(w).length;
    console.log(`TAILLE SAUVEGARDE ${Math.round(bytes / 1024)} Ko après ${Math.round(w.time.tick / TICKS_PER_DAY)} jours`);
    expect(bytes).toBeLessThan(600 * 1024);
  });
});

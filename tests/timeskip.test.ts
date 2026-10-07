/**
 * Passer le temps : la journée, la semaine, le mois sont vraiment simulés, avec une routine
 * (cours suivis, repas, nuit à la maison) ; un bilan compare l'avant et l'après.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { dateOf, dayIndexOf, minutesOfDay } from '../src/core/clock';
import { ensureFamily } from '../src/simulation/family';
import { requestLaunch, resolveLaunch } from '../src/simulation/ascension';
import { skipBlocker, skipTarget, skipTime } from '../src/simulation/timeskip';

describe('passer le temps', () => {
  it('finir la journée mène au lendemain 7 h', () => {
    const w = createWorld();
    const day = dayIndexOf(w.time.tick);
    const r = skipTime(w, 'jour');
    expect('error' in r).toBe(false);
    expect(dayIndexOf(w.time.tick)).toBe(day + 1);
    expect(minutesOfDay(w.time.tick)).toBe(7 * 60);
  });

  it('la semaine se passe en cours : aucune absence injustifiée, des notes', () => {
    const w = createWorld();
    const r = skipTime(w, 'semaine');
    if ('error' in r) throw new Error(r.error);
    expect(dateOf(dayIndexOf(w.time.tick)).weekday).toBe(1);
    const f = ensureFamily(w);
    expect(f.absences.filter((a) => !a.excused)).toHaveLength(0);
    expect(f.attended.length).toBeGreaterThan(4);
    expect(f.grades.length).toBeGreaterThan(0);
    expect(r.lines.join(' ')).toContain('Cours suivis');
  });

  it('les affaires tournent pendant le mois, et le bilan le dit', () => {
    const w = createWorld();
    w.player.money = 300;
    requestLaunch(w, 'gouters_cour');
    resolveLaunch(w, 'B');
    const t0 = w.time.tick;
    const r = skipTime(w, 'mois');
    if ('error' in r) throw new Error(r.error);
    expect(w.time.tick - t0).toBeGreaterThanOrEqual(27 * TICKS_PER_DAY);
    expect(r.days).toBeGreaterThanOrEqual(27);
    expect(r.lines[0]).toContain('Argent');
  });

  it('pas de vacances à passer en période de cours ; la cible est toujours un réveil', () => {
    const w = createWorld();
    expect(skipBlocker(w, 'vacances')).not.toBeNull();
    expect(minutesOfDay(skipTarget(w, 'mois'))).toBe(7 * 60);
  });
});

/**
 * Rythme du temps : allures du temps réel à ×20, préférence relue avec repli, durée des actions
 * en ticks de 10 minutes, horloge à la minute entre deux ticks.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_PACE_PREFS, PACES, PACE_BY_ID, TASK_MINUTES, parsePacePrefs, subMinutes, taskTicks } from '../src/presentation/time-pace';

describe('rythme du temps', () => {
  it('propose la pause, le temps réel, et des allures croissantes', () => {
    expect(PACES[0]!.scale).toBe(0);
    expect(PACE_BY_ID.reel.scale).toBeCloseTo(1 / 60);
    for (let i = 1; i < PACES.length; i++) expect(PACES[i]!.scale).toBeGreaterThan(PACES[i - 1]!.scale);
  });

  it('par défaut : allure lente et actions qui prennent du temps', () => {
    expect(DEFAULT_PACE_PREFS).toEqual({ pace: 'lent', tasksTakeTime: true });
  });

  it('relit la préférence avec repli sur une valeur sûre', () => {
    expect(parsePacePrefs(null)).toEqual(DEFAULT_PACE_PREFS);
    expect(parsePacePrefs('pas du json')).toEqual(DEFAULT_PACE_PREFS);
    expect(parsePacePrefs(JSON.stringify({ pace: 'reel', tasksTakeTime: false }))).toEqual({ pace: 'reel', tasksTakeTime: false });
    expect(parsePacePrefs(JSON.stringify({ pace: 'turbo' })).pace).toBe('lent');
  });

  it('convertit la durée des actions en ticks de 10 minutes (au moins un)', () => {
    expect(taskTicks(TASK_MINUTES.parler)).toBe(1);
    expect(taskTicks(TASK_MINUTES.competence)).toBe(3);
    expect(taskTicks(2)).toBe(1);
  });

  it('fait avancer l’horloge à la minute entre deux ticks', () => {
    expect(subMinutes(0, 1000)).toBe(0);
    expect(subMinutes(550, 1000)).toBe(5);
    expect(subMinutes(999, 1000)).toBe(9);
    expect(subMinutes(5000, 1000)).toBe(9);
    expect(subMinutes(10, 0)).toBe(0);
  });
});

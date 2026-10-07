/**
 * Conseils de situation : chaque penseur lit l'état réel du joueur avec sa grille,
 * chiffres à l'appui, sans rien modifier.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { adviceFor, mostUrgentTip } from '../src/simulation/ghost_tips';

describe('conseils de situation', () => {
  it('Dejours voit la fatigue, et c’est urgent', () => {
    const w = createWorld();
    w.player.needs.stress = 80;
    const t = adviceFor(w, 'dejours')!;
    expect(t.weight).toBe(3);
    expect(t.text).toContain('80');
  });

  it('Smith pousse au premier échange tant que rien n’est lancé', () => {
    const w = createWorld();
    expect(adviceFor(w, 'smith')!.text).toMatch(/Ascension/);
  });

  it('Bourdieu compte les cours séchés', () => {
    const w = createWorld();
    w.schoolLife = { attendanceRate: 70, consecutiveClassesAttended: 0, skippedClassesCount: 3, academicAverage: 12, parentSentiment: 'inquiet', parentCongratulatedCount: 0, teacherWarningActive: true, negotiatedExemption: false, lastParentInteractionDay: 0, lastParentMessage: '' };
    expect(adviceFor(w, 'bourdieu')!.text).toContain('3 cours séchés');
  });

  it('le plus urgent passe devant, et la lecture ne modifie pas le monde', () => {
    const w = createWorld();
    w.player.needs.fatigue = 90;
    const before = JSON.stringify(w);
    expect(mostUrgentTip(w, ['smith', 'dejours', 'ostrom'])!.ghost).toBe('dejours');
    expect(JSON.stringify(w)).toBe(before);
  });

  it('un penseur sans grille ne dit rien', () => {
    expect(adviceFor(createWorld(), 'inconnu')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { attendSchoolClass, ensureSchoolLifeState, negotiateWithTeacher, schoolDayTick, skipSchoolForBusiness, studyEveningHomework, talkWithParents, bonusRevisions, DEVOIRS_BONUS_MAX } from '../src/simulation/school_life';
import { fridayGrade } from '../src/simulation/family';
import { dayIndexOf } from '../src/core/clock';
import { TICKS_PER_DAY } from '../src/core/types';

describe('École, Études & Dynamique Familiale', () => {
  it('initialise l’état scolaire avec une moyenne et une assiduité saines', () => {
    const w = createWorld();
    const sl = ensureSchoolLifeState(w);
    expect(sl.academicAverage).toBe(14.5);
    expect(sl.attendanceRate).toBe(92);
    expect(sl.parentSentiment).toBe('satisfait');
  });

  it('assister à un cours améliore la discipline et la compréhension (la moyenne vient des notes du vendredi)', () => {
    const w = createWorld();
    const initDisc = w.player.characteristics.discipline;
    const res = attendSchoolClass(w);
    expect(res.ok).toBe(true);

    const sl = ensureSchoolLifeState(w);
    expect(sl.academicAverage).toBe(14.5);
    expect(w.player.characteristics.discipline).toBe(initDisc + 1);
  });

  it('sécher un cours diminue les notes, l’assiduité et déclenche l’inquiétude des parents', () => {
    const w = createWorld();
    skipSchoolForBusiness(w);
    skipSchoolForBusiness(w);
    skipSchoolForBusiness(w);

    const sl = ensureSchoolLifeState(w);
    expect(sl.skippedClassesCount).toBe(3);
    expect(sl.teacherWarningActive).toBe(true);
    expect(sl.parentSentiment === 'inquiet' || sl.parentSentiment === 'tres_inquiet').toBe(true);
  });

  it('les devoirs ne touchent pas la moyenne : ils préparent la prochaine note (plafonné)', () => {
    const w = createWorld();
    const sl = ensureSchoolLifeState(w);
    const avant = sl.academicAverage;
    const comp = w.player.characteristics.comprehension;
    expect(studyEveningHomework(w).ok).toBe(true);
    expect(studyEveningHomework(w).ok).toBe(false); // une seule séance par jour
    expect(sl.academicAverage).toBe(avant);
    expect(w.player.characteristics.comprehension).toBe(comp + 2);
    // Cinq soirées : le bonus plafonne à +1,5 et la moyenne ne bouge toujours pas.
    for (let d = 1; d <= 5; d++) { w.time.tick += TICKS_PER_DAY; studyEveningHomework(w); }
    expect(sl.academicAverage).toBe(avant);
    expect(bonusRevisions(w)).toBe(DEVOIRS_BONUS_MAX);
    // La note du vendredi consomme le bonus.
    fridayGrade(w, dayIndexOf(w.time.tick));
    expect(bonusRevisions(w)).toBe(0);
  });

  it('permet de négocier un statut officiel d’aménagement avec M. Moreau', () => {
    const w = createWorld();
    w.player.characteristics.influence = 45;
    const res = negotiateWithTeacher(w);
    expect(res.ok).toBe(true);
    const sl = ensureSchoolLifeState(w);
    expect(sl.negotiatedExemption).toBe(true);
  });

  it('discuter avec les parents apporte du réconfort ou des encouragements selon le sentiment', () => {
    const w = createWorld();
    const res = talkWithParents(w);
    expect(res.ok).toBe(true);
    expect(res.message.length).toBeGreaterThan(0);
  });

  it('déclenche des félicitations familiales lors du cycle de jour si les résultats sont brillants', () => {
    const w = createWorld();
    const sl = ensureSchoolLifeState(w);
    sl.academicAverage = 17;
    sl.parentSentiment = 'tres_fier';
    sl.parentCongratulatedCount = 0;

    const notifs = schoolDayTick(w);
    expect(notifs.length).toBe(1);
    expect(notifs[0]!.kind).toBe('bien');
    expect(sl.parentCongratulatedCount).toBe(1);
  });
});

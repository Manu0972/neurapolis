import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { attendSchoolClass, ensureSchoolLifeState, negotiateWithTeacher, schoolDayTick, skipSchoolForBusiness, studyEveningHomework, talkWithParents } from '../src/simulation/school_life';

describe('École, Études & Dynamique Familiale', () => {
  it('initialise l’état scolaire avec une moyenne et une assiduité saines', () => {
    const w = createWorld();
    const sl = ensureSchoolLifeState(w);
    expect(sl.academicAverage).toBe(14.5);
    expect(sl.attendanceRate).toBe(92);
    expect(sl.parentSentiment).toBe('satisfait');
  });

  it('assister à un cours améliore les notes, la discipline et la compréhension', () => {
    const w = createWorld();
    const initDisc = w.player.characteristics.discipline;
    const res = attendSchoolClass(w);
    expect(res.ok).toBe(true);

    const sl = ensureSchoolLifeState(w);
    expect(sl.academicAverage).toBeGreaterThan(14.5);
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

  it('étudier le soir permet de remonter la moyenne', () => {
    const w = createWorld();
    const res = studyEveningHomework(w);
    expect(res.ok).toBe(true);
    const sl = ensureSchoolLifeState(w);
    expect(sl.academicAverage).toBeGreaterThan(14.5);
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

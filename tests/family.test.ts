/**
 * Famille et collège : aller en cours, absences et convocation, arrangement avec la
 * principale, dîners, note du vendredi, punition, garants des baux, sauvegarde v20.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import type { WorldState } from '../src/core/types';
import { TICKS_PER_DAY } from '../src/core/types';
import { minutesOfDay } from '../src/core/clock';
import { runTicks } from '../src/simulation/engine';
import {
  attendClass, classWindow, ensureFamily, familyTrust, isInClass, pendingDinner, resolveConvocation, resolveDinner,
} from '../src/simulation/family';
import { leaseEligibility, listUnits } from '../src/simulation/economy';
import { ensureSchoolLifeState } from '../src/simulation/school_life';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

/** Avance jusqu'à hh:mm (aujourd'hui ou demain). */
function until(w: WorldState, minutes: number): void {
  let guard = 0;
  while (minutesOfDay(w.time.tick) !== minutes && guard++ < TICKS_PER_DAY) runTicks(w, 1);
}

describe('cours', () => {
  it('le mardi matin, on peut rejoindre le cours ; la séance passe et compte', () => {
    const w = createWorld(); // mardi 1er sept., 7 h 10
    until(w, 8 * 60 + 20);
    expect(classWindow(w)).toBe('matin');
    expect(attendClass(w).ok).toBe(true);
    expect(isInClass(w)).toBe(true);
    expect(classWindow(w)).toBeNull();
    until(w, 12 * 60 + 10);
    expect(isInClass(w)).toBe(false);
    expect(ensureFamily(w).absences).toHaveLength(0);
  });

  it('une séance manquée est une absence ; deux dans la semaine : convocation', () => {
    const w = createWorld();
    until(w, 17 * 60);
    const f = ensureFamily(w);
    expect(f.absences.filter((a) => !a.excused)).toHaveLength(2);
    expect(f.convocation).toBeDefined();
    expect(f.parents.nora.worry).toBeGreaterThan(35);
    expect(ensureSchoolLifeState(w).skippedClassesCount).toBe(2);
  });
});

describe('convocation', () => {
  it('la vérité, avec de bonnes notes et la confiance des parents, ouvre un arrangement', () => {
    const w = createWorld();
    until(w, 17 * 60);
    ensureSchoolLifeState(w).academicAverage = 14;
    expect(resolveConvocation(w, 'verite').ok).toBe(true);
    const f = ensureFamily(w);
    expect(f.arrangement?.perWeek).toBe(2);
    expect(f.convocation).toBeUndefined();
    // Le lendemain (mercredi : cours le matin seulement), la demi-journée manquée est excusée.
    const day = f.absences[f.absences.length - 1]!.day;
    runTicks(w, 6);
    until(w, 17 * 60);
    const after = f.absences.filter((a) => a.day > day);
    expect(after.length).toBeGreaterThan(0);
    expect(after.every((a) => a.excused)).toBe(true);
  });

  it('un mensonge découvert coûte la confiance et vaut une punition', () => {
    let found = false;
    for (let seed = 1; seed < 30 && !found; seed++) {
      const w = createWorld({ seed });
      until(w, 17 * 60);
      const before = familyTrust(w);
      resolveConvocation(w, 'mensonge');
      if (familyTrust(w) < before - 20) {
        found = true;
        expect(ensureFamily(w).groundedUntil).toBeGreaterThan(0);
      }
    }
    expect(found).toBe(true);
  });
});

describe('dîners et parents', () => {
  it('à 19 h 30, à la maison, un dîner attend une réponse qui compte', () => {
    const w = createWorld();
    until(w, 19 * 60 + 40);
    const line = pendingDinner(w)!;
    expect(line).toBeDefined();
    expect(line.when).toBe('convocation'); // la journée a été manquée : on en parle
    const r = resolveDinner(w, 0);
    expect(r.ok).toBe(true);
    expect(pendingDinner(w)).toBeUndefined();
  });

  it('sans la confiance des parents, plus de garant pour les baux', () => {
    const w = createWorld();
    const unit = listUnits(w).find((l) => l.unit.buildingId.startsWith('etal_') && l.status === 'libre')!.unit;
    expect(leaseEligibility(w, unit.id).allowed).toBe(true);
    const f = ensureFamily(w);
    f.parents.nora.trust = 20;
    f.parents.thierry.trust = 20;
    const e = leaseEligibility(w, unit.id);
    expect(e.allowed).toBe(false);
    expect(e.reason).toMatch(/garants/);
  });

  it('le vendredi, une note tombe', () => {
    const w = createWorld();
    runTicks(w, 3 * TICKS_PER_DAY); // vendredi matin
    until(w, 16 * 60 + 40);
    expect(ensureFamily(w).grades.length).toBe(1);
  });
});

describe('sauvegarde v20', () => {
  it('une sauvegarde v19 reçoit une famille au départ neutre ; aller-retour fidèle', () => {
    const w = createWorld();
    until(w, 17 * 60);
    const raw = JSON.parse(exportSave(w)) as Record<string, unknown>;
    raw.version = 19;
    delete raw.family;
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.family!.parents.nora.trust).toBe(62);
    expect(importSave(exportSave(w)).family).toEqual(w.family);
  });
});

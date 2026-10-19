/**
 * Garde-fous de la passe QA de la vague 11 (partie jouée comme un débutant).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { FAMILY_EXPENSES, FAMILY_INCOME, FAMILY_MONTHLY_MARGIN, sumBudget } from '../src/data/family_budget';
import { TICKS_PER_DAY } from '../src/core/types';
import { currentMission, HOME_VISIT_FLAG, MOVEMENT_LESSON_FLAG } from '../src/simulation/missions';

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? tsFiles(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('QA vague 11', () => {
  it('les montants affichés en euros utilisent la virgule décimale', () => {
    const fautifs: string[] = [];
    for (const f of tsFiles('src')) {
      if (f.includes('multiplayer')) continue; // moteur multijoueur : hors périmètre
      const s = readFileSync(f, 'utf-8');
      if (/toFixed\([12]\)\}\s?€/.test(s)) fautifs.push(f);
      if (/\b\d+\.\d{2} €/.test(s)) fautifs.push(f);
    }
    expect(fautifs).toEqual([]);
  });

  it('le budget de la famille tombe juste et laisse une petite marge', () => {
    expect(FAMILY_MONTHLY_MARGIN).toBe(sumBudget(FAMILY_INCOME) - sumBudget(FAMILY_EXPENSES));
    expect(FAMILY_MONTHLY_MARGIN).toBeGreaterThan(0);
    expect(FAMILY_MONTHLY_MARGIN).toBeLessThan(600);
  });

  it('la mission du collège annonce le retard quand le cours a commencé', () => {
    const w = createWorld();
    w.seen[MOVEMENT_LESSON_FLAG] = true;
    w.seen[HOME_VISIT_FLAG] = true;
    const day = Math.floor(w.time.tick / TICKS_PER_DAY);
    w.time.tick = day * TICKS_PER_DAY + 8 * 6; // 8 h : le cours de 8 h 30 n'a pas commencé
    expect(currentMission(w, { inside: false })?.text).toBe('Va au collège : les cours commencent à 8 h 30');
    w.time.tick = day * TICKS_PER_DAY + 10 * 6; // 10 h : en retard
    expect(currentMission(w, { inside: false })?.text).toBe('Va au collège : tu es en retard, le cours a commencé à 8 h 30');
  });
});

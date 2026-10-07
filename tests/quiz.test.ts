/**
 * Quiz du carnet : on ne teste qu'un concept appris ; 3/3 le rend maîtrisé (une seule fois) ;
 * données cohérentes.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { CONCEPT_BY_ID } from '../src/data/ascension/concepts';
import { ensureAscension } from '../src/simulation/ascension';
import { QUIZZES, QUIZ_BY_CONCEPT, isMastered, masteredCount, quizBest, submitQuiz } from '../src/simulation/quiz';

describe('quiz du carnet', () => {
  it('chaque quiz porte sur un concept existant, 3 questions à 4 choix', () => {
    for (const q of QUIZZES) {
      expect(CONCEPT_BY_ID[q.conceptId]).toBeDefined();
      expect(q.questions).toHaveLength(3);
      for (const item of q.questions) expect(item.choices).toHaveLength(4);
    }
  });

  it('un concept pas encore appris ne se teste pas', () => {
    const w = createWorld();
    expect(submitQuiz(w, 'marge', [0, 0, 0]).total).toBe(0);
  });

  it('3/3 : maîtrisé ; un moins bon essai ne fait pas reculer', () => {
    const w = createWorld();
    ensureAscension(w).concepts['marge'] = 0;
    const good = QUIZ_BY_CONCEPT['marge']!.questions.map((q) => q.answer);
    const bad = good.map((a) => (a + 1) % 4);
    expect(submitQuiz(w, 'marge', [good[0]!, bad[1]!, bad[2]!]).score).toBe(1);
    expect(quizBest(w, 'marge')).toBe(1);
    const r = submitQuiz(w, 'marge', good);
    expect(r.masteredNow).toBe(true);
    expect(isMastered(w, 'marge')).toBe(true);
    expect(submitQuiz(w, 'marge', bad).masteredNow).toBe(false);
    expect(isMastered(w, 'marge')).toBe(true);
    expect(masteredCount(w)).toBe(1);
  });
});

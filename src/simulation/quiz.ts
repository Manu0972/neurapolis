/**
 * Quiz du carnet d'économie : comprendre, pas réciter. Un concept appris peut se tester
 * (3 questions tirées de situations du jeu). 3/3 : concept maîtrisé ⭐ (un peu de savoir-faire
 * en recherche). État : drapeaux `quiz:<concept>` = meilleur score (1 à 4 : score + 1).
 */
import type { WorldState } from '../core/types';
import { STARTER_QUIZZES, type ConceptQuiz } from '../data/quiz_starter';
import { QUIZZES as AG_QUIZZES } from '../data/ascension_ext/quiz';
import { addXp } from './skills';

/** Quiz de départ, puis ceux d'Antigravity (workflow AG-2) pour tous les autres concepts. */
export const QUIZZES: readonly ConceptQuiz[] = [...STARTER_QUIZZES, ...AG_QUIZZES.filter((q) => !STARTER_QUIZZES.some((s) => s.conceptId === q.conceptId))];
export const QUIZ_BY_CONCEPT: Readonly<Record<string, ConceptQuiz>> = Object.fromEntries(QUIZZES.map((q) => [q.conceptId, q]));

export function quizBest(w: WorldState, conceptId: string): number {
  return Math.max(0, (w.flags[`quiz:${conceptId}`] ?? 0) - 1);
}

export function isMastered(w: WorldState, conceptId: string): boolean {
  const q = QUIZ_BY_CONCEPT[conceptId];
  return !!q && quizBest(w, conceptId) >= q.questions.length;
}

export function masteredCount(w: WorldState): number {
  return QUIZZES.filter((q) => isMastered(w, q.conceptId)).length;
}

/** Enregistre une tentative ; renvoie vrai si le concept vient d'être maîtrisé. */
export function submitQuiz(w: WorldState, conceptId: string, answers: number[]): { score: number; total: number; masteredNow: boolean } {
  const q = QUIZ_BY_CONCEPT[conceptId];
  if (!q || w.ascension?.concepts[conceptId] === undefined) return { score: 0, total: 0, masteredNow: false };
  const score = q.questions.reduce((s, item, i) => s + (answers[i] === item.answer ? 1 : 0), 0);
  const was = isMastered(w, conceptId);
  if (score > quizBest(w, conceptId)) w.flags[`quiz:${conceptId}`] = score + 1;
  const masteredNow = !was && isMastered(w, conceptId);
  if (masteredNow) {
    addXp(w, 'recherche', 1);
    w.flags['conceptsMaitrises'] = masteredCount(w);
  }
  return { score, total: q.questions.length, masteredNow };
}

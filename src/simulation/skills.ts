/**
 * Compétences : niveaux 0-3, XP par pratique. Courbe (data/actions.ts) :
 * 3 / 9 / 18 XP cumulés pour les niveaux 1 / 2 / 3. La faim >70 divise l'XP
 * d'apprentissage par deux (learningFactor, contrat §5). Chaque niveau gagné
 * émet un événement porteur de causes (journal des causes).
 */
import type { Skill, SkillId, WorldState } from '../core/types';
import { SKILL_XP_TABLE, SKILLS_LABELS } from '../data/actions';
import { learningFactor } from './needs';
import { pushEvent, pushJournal } from './events';

export const MAX_SKILL_LEVEL = 3;

/** XP cumulés requis pour atteindre un niveau donné (0 pour le niveau 0). */
export function totalXpForLevel(level: number): number {
  let sum = 0;
  for (let i = 0; i < level; i++) sum += SKILL_XP_TABLE[i] ?? 0;
  return sum;
}

export function skillLevel(w: WorldState, skill: SkillId): number {
  return w.player.skills[skill]?.level ?? 0;
}

export interface XpProgress {
  xp: number;              // XP cumulés
  current: number;         // XP dans le niveau courant
  needed: number | null;   // seuil cumulé du niveau suivant (null au niveau max)
}

export function skillProgress(w: WorldState, skill: SkillId): XpProgress {
  const s = w.player.skills[skill];
  const xp = s?.xp ?? 0;
  const level = s?.level ?? 0;
  if (level >= MAX_SKILL_LEVEL) return { xp, current: xp - totalXpForLevel(level), needed: null };
  return { xp, current: xp - totalXpForLevel(level), needed: totalXpForLevel(level + 1) };
}

export function addXp(w: WorldState, skill: SkillId, amount: number): { leveledUp: boolean } {
  const s = w.player.skills[skill];
  if (!s || s.level >= MAX_SKILL_LEVEL) return { leveledUp: false };
  s.xp += amount * learningFactor(w);
  let leveledUp = false;
  while (s.level < MAX_SKILL_LEVEL) {
    const needed = totalXpForLevel(s.level + 1);
    if (s.xp < needed) break;
    s.level = (s.level + 1) as Skill['level'];
    leveledUp = true;
    pushEvent(w, {
      type: 'consequence',
      title: `${SKILLS_LABELS[skill]} niveau ${s.level}`,
      text: `À force de pratiquer, ta ${SKILLS_LABELS[skill].toLowerCase()} passe au niveau ${s.level}.`,
      causes: [{ facteur: `${SKILLS_LABELS[skill]} — pratique accumulée`, seuil: `${needed} XP`, poids: 2 }],
    });
    pushJournal(
      w,
      `${SKILLS_LABELS[skill]} : niveau ${s.level}`,
      `À force de pratiquer, ta ${SKILLS_LABELS[skill].toLowerCase()} passe au niveau ${s.level}.`,
    );
  }
  return { leveledUp };
}

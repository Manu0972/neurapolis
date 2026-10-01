/**
 * Répliques du joueur dans les dialogues à choix multiples (M2).
 * Chaque ton a des effets distincts sur la relation 4D (aucune statistique sans
 * conséquence) et fait pratiquer une compétence (XP par pratique, M3).
 */
import type { Rel4, SkillId } from '../core/types';

export interface DialogueReply {
  id: string;
  label: string;
  relation: Partial<Rel4>;
  skill?: SkillId; // compétence pratiquée (XP)
  xp?: number;     // XP gagnés (1 par défaut)
}

// Équilibrage M7 : communication xp 2 — le recrutement (niveau 2 = 9 XP) reste
// atteignable en première semaine par le dialogue, sans gâcher la partie.
export const DIALOGUE_REPLIES: DialogueReply[] = [
  { id: 'chaleureux', label: '« Ça me fait plaisir de te parler ! »', relation: { amitie: 1 }, skill: 'communication', xp: 2 },
  { id: 'curieux', label: '« Raconte-m’en plus… »', relation: { confiance: 1 }, skill: 'recherche', xp: 1 },
  { id: 'motive', label: '« Et si on faisait ça ensemble ? »', relation: { respect: 1 }, skill: 'communication', xp: 2 },
  { id: 'taquin', label: '« Tu me testes, là. »', relation: { rivalite: 1 }, skill: 'negociation', xp: 1 },
  { id: 'partir', label: '« Bon, je dois y aller. »', relation: {} },
];

export const REL_LABELS: Record<keyof Rel4, string> = {
  amitie: 'amitié',
  confiance: 'confiance',
  respect: 'respect',
  rivalite: 'rivalité',
};

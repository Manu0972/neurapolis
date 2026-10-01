/**
 * Dialogues à choix multiples : les sujets et répliques vivent dans src/data/npcs.ts,
 * les réponses du joueur dans src/data/dialogue.ts. Le choix de la réplique passe
 * par le PRNG du monde (déterministe).
 */
import type { NpcId, Rel4, WorldState } from '../core/types';
import { rngPick } from '../core/rng';
import { NPC_BY_ID } from '../data/npcs';
import { DIALOGUE_REPLIES } from '../data/dialogue';
import { addXp } from './skills';
import { bump } from './events';
import { isIrritable } from './needs';
import { rememberedNpcLine } from './npc';

/** Sujets disponibles pour un PNJ (clés de ses topics). */
export function dialogueTopics(npcId: NpcId): string[] {
  const def = NPC_BY_ID[npcId];
  return def ? Object.keys(def.topics) : [];
}

/** Une réplique du PNJ tirée au PRNG dans le sujet choisi. */
export function npcLine(w: WorldState, npcId: NpcId, topic: string): string | null {
  const rememberedLine = rememberedNpcLine(w, npcId, topic);
  if (rememberedLine) return rememberedLine;
  const lines = NPC_BY_ID[npcId]?.topics[topic];
  if (!lines || lines.length === 0) return null;
  const line = rngPick(w, lines);
  if (npcId === 'bertin') bump(w, 'marchandages'); // parler prix et rareté avec l'épicière
  if (npcId === 'samir' && topic === 'coop' && w.campaign.currentChapter === 2) {
    bump(w, 'chapitre2ConversationCoopSamir');
  }
  return line;
}

export interface ReplyResult {
  text: string;
  applied: Record<string, number>;
}

/** Applique les effets relationnels de la réponse (bornés 0-100) + XP de pratique. */
export function replyDialogue(w: WorldState, npcId: NpcId, replyId: string): ReplyResult {
  const reply = DIALOGUE_REPLIES.find((r) => r.id === replyId);
  if (!reply) return { text: '…', applied: {} };
  const rel: Rel4 = w.player.relations[npcId] ?? { amitie: 0, confiance: 0, respect: 0, rivalite: 0 };
  const applied: Record<string, number> = {};
  for (const [key, delta] of Object.entries(reply.relation)) {
    if (delta === undefined || delta === 0) continue;
    const dim = key as keyof Rel4;
    // Irritabilité (§5) : l'amitié marque −1 au lieu du + attendu.
    const eff = dim === 'amitie' && delta > 0 && isIrritable(w) ? -1 : delta;
    rel[dim] = Math.max(0, Math.min(100, rel[dim] + eff));
    applied[key] = eff;
  }
  w.player.relations[npcId] = rel;
  bump(w, 'discussions');
  if (reply.skill) addXp(w, reply.skill, reply.xp ?? 1);
  return { text: reply.label, applied };
}

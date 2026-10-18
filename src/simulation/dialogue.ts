/**
 * Dialogues à choix multiples : les sujets et répliques vivent dans src/data/npcs.ts,
 * les réponses du joueur dans src/data/dialogue.ts. Le choix de la réplique passe
 * par le PRNG du monde (déterministe).
 */
import type { NpcId, Rel4, WorldState } from '../core/types';
import { rngPick } from '../core/rng';
import { NPC_BY_ID } from '../data/npcs';
import {
  DEFAULT_TOPIC_REPLIES, DIALOGUE_REPLIES, GENERIC_REACTIONS, NPC_GOODBYES, NPC_REACTIONS, TONE_ICONS, TOPIC_LABELS, TOPIC_REPLIES,
  type DialogueTone,
} from '../data/dialogue';
import { addXp } from './skills';
import { bump } from './events';
import { isIrritable } from './needs';
import { rememberedNpcLine } from './npc';
import { personalize } from './story';

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

/* ------------------------------------------------------------------------------------------
 * Conversation complète (vague 7). Avant : sujet → réplique → 5 réponses génériques → « Fermer »,
 * sans réaction du PNJ ni retour au menu : la discussion « n'aboutissait à rien ». Désormais :
 *   menu des sujets → réplique du PNJ → 3 réponses propres au sujet → réaction du PNJ
 *   → retour au menu (sujets restants) … → au revoir (fin claire).
 * Chaque sujet ne s'aborde qu'une fois par conversation : le nombre d'échanges est borné.
 * ---------------------------------------------------------------------------------------- */

export interface Conversation {
  npcId: NpcId;
  /** Sujets déjà abordés dans cette conversation. */
  asked: string[];
  /** Sujet en cours (en attente d'une réponse du joueur), sinon null. */
  topic: string | null;
  /** La conversation est terminée (au revoir dit). */
  ended: boolean;
}

export interface ConversationChoice { id: string; label: string }

export function startConversation(npcId: NpcId): Conversation {
  return { npcId, asked: [], topic: null, ended: false };
}

/** Nom affiché d'un sujet. */
export function topicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic.charAt(0).toUpperCase() + topic.slice(1);
}

/** Sujets encore disponibles (menu). Vide quand on a fait le tour : il ne reste qu'à se dire au revoir. */
export function conversationMenu(c: Conversation): ConversationChoice[] {
  if (c.ended || c.topic) return [];
  return dialogueTopics(c.npcId).filter((t) => !c.asked.includes(t)).map((t) => ({ id: t, label: topicLabel(t) }));
}

/** Réponses proposées pour un sujet (identifiant = ton, porteur des effets). */
export function topicReplies(topic: string): ConversationChoice[] {
  return (TOPIC_REPLIES[topic] ?? DEFAULT_TOPIC_REPLIES).map((r) => ({ id: r.tone, label: `${TONE_ICONS[r.tone]} ${r.label}` }));
}

export interface AskResult { line: string; replies: ConversationChoice[] }

/** Le joueur choisit un sujet : réplique du PNJ et réponses possibles. */
export function askTopic(w: WorldState, c: Conversation, topic: string): AskResult | null {
  if (c.ended || c.topic || c.asked.includes(topic) || !dialogueTopics(c.npcId).includes(topic)) return null;
  c.asked.push(topic);
  c.topic = topic;
  return { line: npcLine(w, c.npcId, topic) ?? '…', replies: topicReplies(topic) };
}

export interface AnswerResult {
  /** La réponse du joueur, telle qu'affichée. */
  said: string;
  /** La réaction du PNJ. */
  reaction: string;
  applied: Record<string, number>;
  /** Suite : retour au menu des sujets, ou fin (plus rien à dire). */
  next: 'menu' | 'fin';
}

/** Le joueur répond : effets (relation, XP), réaction du PNJ, puis suite. */
export function answerTopic(w: WorldState, c: Conversation, tone: string): AnswerResult | null {
  if (c.ended || !c.topic) return null;
  const options = TOPIC_REPLIES[c.topic] ?? DEFAULT_TOPIC_REPLIES;
  const opt = options.find((r) => r.tone === tone);
  if (!opt) return null;
  const res = replyDialogue(w, c.npcId, opt.tone);
  c.topic = null;
  const reaction = personalize(w, NPC_REACTIONS[c.npcId]?.[opt.tone as DialogueTone] ?? GENERIC_REACTIONS[opt.tone]);
  return { said: opt.label, reaction, applied: res.applied, next: conversationMenu(c).length > 0 ? 'menu' : 'fin' };
}

/** Au revoir : termine la conversation (possible à tout moment). */
export function endConversation(c: Conversation): string {
  c.ended = true;
  c.topic = null;
  return NPC_GOODBYES[c.npcId] ?? '« À bientôt ! »';
}

/**
 * Conversations (vague 7) : chaque sujet atteignable aboutit — une réplique, des réponses,
 * une réaction, puis le menu ou la fin. Aucune boucle, aucune impasse.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { NPCS } from '../src/data/npcs';
import { TOPIC_LABELS, TOPIC_REPLIES } from '../src/data/dialogue';
import {
  answerTopic, askTopic, conversationMenu, endConversation, startConversation, type Conversation,
} from '../src/simulation/dialogue';

/** Parcourt toutes les branches d'une conversation (sujets dans tous les ordres, toutes les réponses). */
function explore(npcId: string, seed: number): { paths: number; maxSteps: number } {
  let paths = 0;
  let maxSteps = 0;
  const walk = (asked: string[], steps: number): void => {
    const w = createWorld(seed);
    const c: Conversation = startConversation(npcId as never);
    for (const a of asked) { askTopic(w, c, a); answerTopic(w, c, TOPIC_REPLIES[a]?.[0]?.tone ?? 'chaleureux'); }
    const menu = conversationMenu(c);
    if (menu.length === 0) {
      const bye = endConversation(c);
      expect(bye.length).toBeGreaterThan(3);
      expect(c.ended).toBe(true);
      expect(conversationMenu(c)).toEqual([]);
      paths += 1;
      maxSteps = Math.max(maxSteps, steps);
      return;
    }
    for (const t of menu) {
      const w2 = createWorld(seed);
      const c2 = startConversation(npcId as never);
      for (const a of asked) { askTopic(w2, c2, a); answerTopic(w2, c2, TOPIC_REPLIES[a]?.[0]?.tone ?? 'chaleureux'); }
      const r = askTopic(w2, c2, t.id);
      expect(r, `${npcId}/${t.id}`).not.toBeNull();
      expect(r!.line.length).toBeGreaterThan(3);
      expect(r!.replies.length).toBeGreaterThanOrEqual(3);
      // Tant qu'une réponse est attendue, le menu est vide et le même sujet ne se relance pas.
      expect(conversationMenu(c2)).toEqual([]);
      expect(askTopic(w2, c2, t.id)).toBeNull();
      for (const rep of r!.replies) {
        const w3 = createWorld(seed);
        const c3 = startConversation(npcId as never);
        for (const a of asked) { askTopic(w3, c3, a); answerTopic(w3, c3, TOPIC_REPLIES[a]?.[0]?.tone ?? 'chaleureux'); }
        askTopic(w3, c3, t.id);
        const ans = answerTopic(w3, c3, rep.id);
        expect(ans, `${npcId}/${t.id}/${rep.id}`).not.toBeNull();
        expect(ans!.reaction).not.toMatch(/\{e\}|\{prenom\}/);
        expect(ans!.reaction.length).toBeGreaterThan(3);
        expect(ans!.next).toBe(conversationMenu(c3).length > 0 ? 'menu' : 'fin');
      }
      walk([...asked, t.id], steps + 1);
    }
  };
  walk([], 0);
  return { paths, maxSteps };
}

describe('conversations : chaque sujet aboutit', () => {
  it('tous les sujets de tous les PNJ ont un nom et des réponses dédiées', () => {
    for (const n of NPCS) {
      for (const t of Object.keys(n.topics)) {
        expect(TOPIC_LABELS[t], `${n.id}/${t}`).toBeTruthy();
        expect(TOPIC_REPLIES[t]?.length, `${n.id}/${t}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('toutes les branches finissent par un au revoir, en un nombre borné d’échanges', () => {
    for (const n of NPCS) {
      const { paths, maxSteps } = explore(n.id, 7);
      expect(paths, n.id).toBeGreaterThan(0);
      expect(maxSteps, n.id).toBe(Object.keys(n.topics).length);
    }
  });

  it('Noah : Accueil → réponse → réaction → retour au menu sans le sujet déjà abordé', () => {
    const w = createWorld(3);
    const c = startConversation('noah');
    expect(conversationMenu(c).map((m) => m.id)).toEqual(['accueil', 'projet', 'argent']);
    const r = askTopic(w, c, 'accueil')!;
    expect(r.replies.map((x) => x.id)).toContain('chaleureux');
    const xp = w.player.skills.communication.xp;
    const ans = answerTopic(w, c, 'chaleureux')!;
    expect(ans.reaction).toMatch(/Noah/);
    expect(ans.next).toBe('menu');
    expect(w.player.skills.communication.xp).toBeGreaterThan(xp);
    expect(conversationMenu(c).map((m) => m.id)).toEqual(['projet', 'argent']);
    // On peut partir à tout moment, avec une fin claire.
    expect(endConversation(c)).toMatch(/parc/);
    expect(askTopic(w, c, 'projet')).toBeNull();
  });

  it('une réponse inventée ou hors sujet ne casse rien', () => {
    const w = createWorld(3);
    const c = startConversation('lina');
    expect(answerTopic(w, c, 'chaleureux')).toBeNull();
    askTopic(w, c, 'ecole');
    expect(answerTopic(w, c, 'motive')).toBeNull(); // pas proposé pour « école »
    expect(answerTopic(w, c, 'curieux')?.next).toBe('menu');
  });
});

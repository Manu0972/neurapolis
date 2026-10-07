/**
 * Le contenu d'Antigravity (AG-2) est branché dans le jeu, pas seulement testé à part :
 * idées, concepts, duels, quiz, secrets, événements de collège et moments de classe.
 */
import { describe, expect, it } from 'vitest';
import { CONCEPT_BY_ID, ECON_CONCEPTS } from '../src/data/ascension/concepts';
import { CONTACT_BY_ID } from '../src/data/ascension/contacts';
import { DUELS, DUEL_BY_ID } from '../src/data/ascension/duels';
import { IDEAS, IDEA_BY_ID } from '../src/data/ascension/ideas';
import { SECRETS } from '../src/data/secrets_registry';
import { QUIZ_BY_CONCEPT } from '../src/simulation/quiz';
import { SCHOOL_EVENTS } from '../src/simulation/school_events';
import { createWorld } from '../src/core/store';
import { ensureAscension, ideaStatus } from '../src/simulation/ascension';

describe('contenu AG-2 branché', () => {
  it('les registres du jeu contiennent tout', () => {
    expect(ECON_CONCEPTS).toHaveLength(32);
    expect(DUELS).toHaveLength(9);
    expect(IDEAS.length).toBe(46);
    expect(SECRETS.length).toBeGreaterThanOrEqual(22);
    expect(SCHOOL_EVENTS.length).toBeGreaterThanOrEqual(31);
  });

  it('chaque concept a son quiz ; chaque idée, un duel ; chaque duel, des concepts connus', () => {
    for (const c of ECON_CONCEPTS) expect(QUIZ_BY_CONCEPT[c.id], c.id).toBeDefined();
    for (const i of IDEAS) {
      expect(DUEL_BY_ID[i.duel], i.id).toBeDefined();
      expect(i.fixed).toBeGreaterThan(0);
      for (const c of [...(i.eases ?? []), ...(i.needs ?? [])]) expect(CONTACT_BY_ID[c], `${i.id} → ${c}`).toBeDefined();
    }
    for (const d of DUELS) {
      expect(CONCEPT_BY_ID[d.a.concept], `${d.id} a`).toBeDefined();
      expect(CONCEPT_BY_ID[d.b.concept], `${d.id} b`).toBeDefined();
    }
    for (const s of SECRETS) if (s.reward.kind === 'idee') expect(IDEA_BY_ID[String(s.reward.value)], s.id).toBeDefined();
    for (const s of SECRETS) if (s.reward.kind === 'concept') expect(CONCEPT_BY_ID[String(s.reward.value)], s.id).toBeDefined();
  });

  it('une idée du palier 4 d’Antigravity se lance depuis l’Ascension', () => {
    const w = createWorld({ sandbox: true });
    ensureAscension(w).tier = 4;
    w.player.money = 1_000_000;
    const st = ideaStatus(w, 'rachat_rival_local');
    expect(st.reasons).toEqual([]);
    expect(st.available).toBe(true);
  });
});

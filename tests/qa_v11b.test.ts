/**
 * QA vague 11, tour 2 : coéquipiers, fin du chapitre 1, chapitres 2 à 5.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TEAM_LINES } from '../src/data/dialogue_team';
import { answerTopic, askTopic, startConversation } from '../src/simulation/dialogue';
import { createProject } from '../src/simulation/project';

describe('coéquipiers recrutés', () => {
  it('Noah ne propose plus de « monter le stand ensemble » une fois dans l’équipe', () => {
    const w = createWorld();
    createProject(w);
    const avant = askTopic(w, startConversation('noah'), 'projet')!;
    expect(avant.replies.map((r) => r.label).join(' ')).toContain('Et si on le montait ensemble');
    w.project!.members.push('noah');
    const c = startConversation('noah');
    const r = askTopic(w, c, 'projet')!;
    expect(TEAM_LINES['noah']!['projet']).toContain(r.line);
    expect(r.replies.map((x) => x.label).join(' ')).not.toContain('Et si on le montait ensemble');
    const a = answerTopic(w, c, 'motive')!;
    expect(a.reaction).not.toContain('Ensemble ?');
  });

  it('les répliques d’équipe varient (tirage déterministe)', () => {
    const vues = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const w = createWorld({ seed });
      createProject(w);
      w.project!.members.push('lina');
      vues.add(askTopic(w, startConversation('lina'), 'projet')!.line);
    }
    expect(vues.size).toBeGreaterThan(1);
  });
});

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

describe('créateur : modèle par défaut', () => {
  it('propose une silhouette libre (sans PNJ attitré) en priorité', async () => {
    const { defaultPlayerRig } = await import('../src/presentation/city3d/rigged/playerModel');
    expect(defaultPlayerRig([{ id: 'bertin_1', pnj: ['bertin'] }, { id: 'L002_ado', pnj: [] }])).toBe('L002_ado');
    expect(defaultPlayerRig([{ id: 'bertin_1', pnj: ['bertin'] }])).toBe('bertin_1');
    expect(defaultPlayerRig([])).toBeUndefined();
  });
});

describe('passer le temps jusqu’à l’anniversaire', () => {
  it('vise le prochain 1er septembre à 7 h', async () => {
    const { skipTarget } = await import('../src/simulation/timeskip');
    const { dateOf, dayIndexOf, minutesOfDay } = await import('../src/core/clock');
    const w = createWorld();
    w.time.tick += 2 * 144; // jeudi 3 septembre 2020
    const t = skipTarget(w, 'anniversaire');
    expect(dateOf(dayIndexOf(t)).iso).toBe('2021-09-01');
    expect(minutesOfDay(t)).toBe(7 * 60);
  });
});

describe('fins de chapitre', () => {
  it('chaque chapitre 1 à 5 a sa cinématique de fin, avec ses propres sous-titres', async () => {
    const { chapterEndCinematic } = await import('../src/presentation/cinematic/plan');
    const vus = new Set<string>();
    for (let ch = 1; ch <= 5; ch++) {
      const p = chapterEndCinematic(ch)!;
      expect(p.outro).toContain(`chapitre ${ch}`);
      expect(p.shots.every((s) => !!s.subtitle)).toBe(true);
      vus.add(p.shots[0]!.subtitle!);
      const speaker = p.shots.find((s) => s.speaker)?.speaker;
      expect(p.ghosts).toContain(speaker);
    }
    expect(vus.size).toBe(5);
    expect(chapterEndCinematic(6)).toBeNull();
  });
});

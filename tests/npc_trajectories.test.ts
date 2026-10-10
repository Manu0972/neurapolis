import { describe, expect, it } from 'vitest';
import { runTrajectoryAudit } from '../tools/chroniques/controle-trajets';

describe('Cohérence des trajets PNJ (npc_trajectories)', () => {
  it('ne détecte aucune incohérence bloquante sur 5 graines et 7 jours de simulation', () => {
    const audit = runTrajectoryAudit({
      seedsCount: 5,
      startSeed: 20200901,
      daysCount: 7,
    });

    const bloquantes = audit.issues.filter((i) => i.severity === 'bloquante');

    if (bloquantes.length > 0) {
      console.error('Incohérences bloquantes détectées dans la simulation :');
      for (const issue of bloquantes) {
        console.error(`- [Graine ${issue.seed}] J${issue.day} ${issue.time} - PNJ ${issue.npcId} à ${issue.place} : ${issue.description}`);
      }
    }

    expect(bloquantes).toHaveLength(0);
  });
});

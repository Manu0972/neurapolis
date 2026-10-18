import { describe, expect, it } from 'vitest';
import { racontePnj } from '../src/simulation/npc_story';
import { NPCS } from '../src/data/npcs';
import { NPCS_EXPANDED } from '../src/data/npcs_expanded';

describe('racontePnj - Récit de vie des PNJ', () => {
  it('produit un récit déterministe identique à chaque appel pour le même PNJ', () => {
    const story1 = racontePnj('noah');
    const story2 = racontePnj('noah');
    const story3 = racontePnj('noah');

    expect(story1).toBe(story2);
    expect(story2).toBe(story3);
  });

  it('ne contient aucune mention de undefined ni de NaN dans le récit', () => {
    const allIds = Array.from(
      new Set([
        ...NPCS.map((n) => n.id),
        ...NPCS_EXPANDED.map((n) => n.id),
      ])
    );

    for (const id of allIds) {
      const story = racontePnj(id);
      expect(story).not.toContain('undefined');
      expect(story).not.toContain('NaN');
      expect(story).not.toContain('null');
    }
  });

  it("mentionne l'âge cohérent pour 5 PNJ d'âges différents (dont au moins un enfant)", () => {
    const npcsToTest = [
      { id: 'noah', expectedName: 'Noah Martin', expectedAge: 12, isChild: true },
      { id: 'yasmine', expectedName: 'Yasmine Diallo', expectedAge: 13, isChild: true },
      { id: 'dj_mirabelle', expectedName: 'Mireille "DJ Mirabelle" Bisset', expectedAge: 26, isChild: false },
      { id: 'karim', expectedName: 'Karim Bensalah', expectedAge: 34, isChild: false },
      { id: 'bertin', expectedName: 'Monique Bertin', expectedAge: 58, isChild: false },
      { id: 'monique_p', expectedName: 'Monique Petitjean', expectedAge: 71, isChild: false },
    ];

    for (const pnj of npcsToTest) {
      const story = racontePnj(pnj.id);
      expect(story).toContain(pnj.expectedName);
      expect(story).toContain(`${pnj.expectedAge} ans`);
      if (pnj.isChild) {
        expect(story).toContain('enfant');
      }
    }
  });

  it('gère proprement le cas d un PNJ inconnu', () => {
    const story = racontePnj('inconnu_xyz');
    expect(story).toContain('PNJ inconnu');
    expect(story).not.toContain('undefined');
  });
});

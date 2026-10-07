/**
 * Objectifs et pensées (V1.1) : indices tirés de l'état du monde, triés par urgence, déterministes.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { PLACE_ANCHORS } from '../src/data/map';
import { currentHints } from '../src/simulation/hints';

describe('objectifs et pensées', () => {
  it('le chapitre en cours est toujours dans les objectifs', () => {
    const w = createWorld();
    expect(currentHints(w).some((h) => h.id.startsWith('chapitre:'))).toBe(true);
  });

  it('la faim devient un objectif urgent avec un lieu où aller', () => {
    const w = createWorld();
    w.player.needs.faim = 80;
    const h = currentHints(w).find((x) => x.id === 'faim');
    expect(h?.priority).toBe(4);
    expect(h?.target).toBeDefined();
    w.player.needs.faim = 95;
    expect(currentHints(w)[0]!.id).toBe('faim_urgente');
  });

  it('parle de l’autre joueur par son prénom, et des propositions en attente', () => {
    const w = createWorld();
    const far = { name: 'Bilal', x: w.player.pos.x + 200, y: w.player.pos.y };
    const hints = currentHints(w, { others: [far], pendingOffers: 1 });
    expect(hints.some((h) => h.id === 'mp_offre' && h.thought.includes('Bilal'))).toBe(true);
    const loin = hints.find((h) => h.id === 'mp_loin:Bilal');
    expect(loin?.thought).toContain('Bilal');
    expect(loin?.target?.name).toBe('Bilal');
    const near = currentHints(w, { others: [{ name: 'Bilal', x: w.player.pos.x + 5, y: w.player.pos.y }] });
    expect(near.some((h) => h.id === 'mp_proche:Bilal')).toBe(true);
  });

  it('est trié du plus urgent au moins urgent et ne dépend pas du hasard', () => {
    const w = createWorld();
    w.player.needs.faim = 80;
    w.player.needs.stress = 80;
    w.player.money = 0;
    w.player.pos = { ...PLACE_ANCHORS.maison };
    const a = currentHints(w);
    const b = currentHints(w);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (let i = 1; i < a.length; i++) expect(a[i - 1]!.priority).toBeGreaterThanOrEqual(a[i]!.priority);
  });
});

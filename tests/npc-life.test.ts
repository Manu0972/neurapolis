import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { dayIndexOf } from '../src/core/clock';
import { TICKS_PER_DAY } from '../src/core/types';
import { npcLine } from '../src/simulation/dialogue';
import { npcTick } from '../src/simulation/npc';

function addEvent(w: ReturnType<typeof createWorld>, id: string, title: string): void {
  w.events.unshift({
    id, day: dayIndexOf(w.time.tick), date: '2020-09-01', type: 'quartier',
    title, text: 'Événement de test observé dans le quartier.',
    causes: [{ facteur: 'scénario de test', poids: 1 }],
  });
}

describe('mémoire des habitants', () => {
  it('enregistre une fermeture une fois et fait réagir Bertin et Monique', () => {
    const w = createWorld();
    addEvent(w, 'e-fermeture', 'Mme Bertin envisage de fermer');

    npcTick(w);
    const bertin = w.npcs.bertin;
    const monique = w.npcs.monique;
    expect(bertin?.memory).toEqual(['e-fermeture']);
    expect(monique?.memory).toEqual(['e-fermeture']);
    expect(npcLine(w, 'bertin', 'quartier')).toContain('baisser le rideau');
    expect(npcLine(w, 'monique', 'epicerie')).toContain('perdre l’épicerie');

    npcTick(w);
    expect(bertin?.memory).toEqual(['e-fermeture']);
  });

  it('fait évoluer la réaction de Bertin après l’embauche', () => {
    const w = createWorld();
    addEvent(w, 'e-fermeture', 'Mme Bertin envisage de fermer');
    npcTick(w);
    addEvent(w, 'e-embauche', 'L’épicerie embauche');

    npcTick(w);

    expect(npcLine(w, 'bertin', 'quartier')).toContain('pu embaucher');
    expect(w.npcs.noah?.memory).toContain('e-embauche');
    expect(npcLine(w, 'noah', 'projet')).toContain('embauché');
  });

  it('reflète une victoire collective dans les conversations de Noah et Samir', () => {
    const w = createWorld();
    addEvent(w, 'e-chapitre-3', 'Chapitre 3 accompli : Le quartier fait front');
    npcTick(w);

    expect(npcLine(w, 'noah', 'projet')).toContain('fait ensemble');
    expect(npcLine(w, 'samir', 'coop')).toContain('soutenu le quartier');
  });

  it('garde une mémoire bornée sans répéter un événement et reste déterministe', () => {
    const first = createWorld({ seed: 77 });
    const second = createWorld({ seed: 77 });
    for (let i = 0; i < 55; i++) {
      first.time.tick = i * TICKS_PER_DAY + 43;
      second.time.tick = i * TICKS_PER_DAY + 43;
      addEvent(first, `e-vente-${i}`, 'Vente au stand — 1 unité');
      addEvent(second, `e-vente-${i}`, 'Vente au stand — 1 unité');
      npcTick(first);
      npcTick(second);
    }

    expect(first.npcs.noah?.memory).toHaveLength(50);
    expect(first.npcs.noah?.memory[0]).toBe('e-vente-5');
    expect(first.npcs.noah?.memory).toEqual(second.npcs.noah?.memory);
    expect(npcLine(first, 'noah', 'projet')).toBe(npcLine(second, 'noah', 'projet'));
  });
});

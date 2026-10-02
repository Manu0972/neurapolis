import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { checkStreetSynergiesAndEncounters, ensureStreetRecognitionState, handleStreetEncounterChoice } from '../src/simulation/street_synergies';
import { askActiveGhostAdvice, ensureGhostCompanionState, getGhostCompanionThought, switchCompanionGhost } from '../src/simulation/ghost_companions';

describe('Synergies Cachées, Rencontres & Compagnon Fantôme Kawaii', () => {
  it('détecte les synergies de statistiques cachées quand les conditions sont réunies', () => {
    const w = createWorld();
    w.player.characteristics.influence = 60;
    w.player.characteristics.confiance = 55;
    w.player.reputation = 65;

    const notifs = checkStreetSynergiesAndEncounters(w);
    const sr = ensureStreetRecognitionState(w);
    expect(sr.hiddenSynergiesUnlocked).toContain('notoriete_populaire');
    expect(notifs.some((n) => n.text.includes('Notoriété Populaire'))).toBe(true);
  });

  it('génère une rencontre spontanée dans la rue et permet de conclure la vente', () => {
    const w = createWorld();
    const sr = ensureStreetRecognitionState(w);
    sr.hiddenSynergiesUnlocked.push('notoriete_populaire');
    sr.lastEncounterDay = -1;

    checkStreetSynergiesAndEncounters(w);
    expect(sr.spontaneousEncounterPending).toBe(true);

    const initMoney = w.player.money;
    const res = handleStreetEncounterChoice(w, true);
    expect(res.ok).toBe(true);
    expect(w.player.money).toBe(initMoney + 6);
    expect(sr.spontaneousEncounterPending).toBe(false);
  });

  it('génère une humeur réactive et un conseil contextualisé pour le compagnon fantôme', () => {
    const w = createWorld();
    w.player.needs.stress = 75;
    const thought = getGhostCompanionThought(w);
    expect(thought.mood).toBe('inquiet');
    expect(thought.speechBubble.length).toBeGreaterThan(0);

    const advice = askActiveGhostAdvice(w);
    expect(advice.adviceText.length).toBeGreaterThan(0);
  });

  it('permet de changer de fantôme compagnon actif', () => {
    const w = createWorld();
    const res = switchCompanionGhost(w, 'smith');
    expect(res.ok).toBe(true);
    const gc = ensureGhostCompanionState(w);
    expect(gc.activeGhostId).toBe('smith');
  });
});

/**
 * Tests du socle M0 — besoins.
 * Contrat §5 : chaque besoin a exactement les 3 conséquences mécaniques listées ici.
 */
import { describe, expect, it } from 'vitest';
import { cloneWorld, createWorld } from '../src/core/store';
import type { WorldState } from '../src/core/types';
import {
  conflictRiskBonus,
  failureBonus,
  fatigueFactor,
  isAffame,
  isDemoralise,
  isEpuise,
  isIrritable,
  isMalaise,
  isStresse,
  learningFactor,
  needsTick,
  proposalAcceptBonus,
  rendementFactor,
  socialTimeFactor,
} from '../src/simulation/needs';

/** Monde réveillé par défaut, besoins ajustés pour isoler la conséquence testée. */
function mondeAvec(besoins: Partial<WorldState['player']['needs']>, asleep = false): WorldState {
  const w = createWorld({ seed: 42 });
  w.player.asleep = asleep;
  Object.assign(w.player.needs, besoins);
  return w;
}

describe('fatigue >70 — vitesse, échec d\'action, irritabilité (§5)', () => {
  it('vitesse −30 % au-delà de 70', () => {
    expect(fatigueFactor(mondeAvec({ fatigue: 80 }))).toBe(0.7);
    expect(fatigueFactor(mondeAvec({ fatigue: 70 }))).toBe(1); // seuil strict
  });

  it('échec d\'action +20 % au-delà de 70', () => {
    expect(failureBonus(mondeAvec({ fatigue: 80 }))).toBe(0.2);
    expect(failureBonus(mondeAvec({ fatigue: 70 }))).toBe(0);
  });

  it('irritabilité (amitié −1 sur les dialogues) au-delà de 70', () => {
    expect(isIrritable(mondeAvec({ fatigue: 80 }))).toBe(true);
    expect(isIrritable(mondeAvec({ fatigue: 71 }))).toBe(true);
    expect(isIrritable(mondeAvec({ fatigue: 70 }))).toBe(false);
  });

  it('>85 : épuisement (rendement école/projet −50 %, cf. rendementFactor)', () => {
    expect(isEpuise(mondeAvec({ fatigue: 86 }))).toBe(true);
    expect(isEpuise(mondeAvec({ fatigue: 85 }))).toBe(false);
  });

  it('dynamique : fatigue +0,08/tick éveillé, −0,35/tick endormi', () => {
    const eveille = mondeAvec({ fatigue: 20 });
    needsTick(eveille);
    expect(eveille.player.needs.fatigue).toBeCloseTo(20.08, 10);
    const endormi = mondeAvec({ fatigue: 20 }, true);
    needsTick(endormi);
    expect(endormi.player.needs.fatigue).toBeCloseTo(19.65, 10);
  });
});

describe('faim >70 — apprentissage, moral, malaise (§5)', () => {
  it('XP d\'apprentissage −50 % au-delà de 70', () => {
    expect(learningFactor(mondeAvec({ faim: 80 }))).toBe(0.5);
    expect(learningFactor(mondeAvec({ faim: 70 }))).toBe(1);
    expect(isAffame(mondeAvec({ faim: 80 }))).toBe(true);
  });

  it('moral −0,05/tick quand la faim dépasse 70 (vs monde rassasié)', () => {
    const affame = mondeAvec({ faim: 80, moral: 50 });
    const rassasie = mondeAvec({ faim: 30, moral: 50 });
    needsTick(affame);
    needsTick(rassasie);
    // Même homeostase (−0,01 à moral 50) dans les deux mondes : l'écart = 0,05.
    expect(rassasie.player.needs.moral - affame.player.needs.moral).toBeCloseTo(0.05, 10);
    expect(affame.player.needs.moral).toBeCloseTo(49.94, 10);
  });

  it('>90 : malaise (journée interrompue)', () => {
    expect(isMalaise(mondeAvec({ faim: 91 }))).toBe(true);
    expect(isMalaise(mondeAvec({ faim: 90 }))).toBe(false);
  });

  it('dynamique : faim +0,15/tick éveillé, +0,05/tick endormi', () => {
    const eveille = mondeAvec({ faim: 30 });
    needsTick(eveille);
    expect(eveille.player.needs.faim).toBeCloseTo(30.15, 10);
    const endormi = mondeAvec({ faim: 30 }, true);
    needsTick(endormi);
    expect(endormi.player.needs.faim).toBeCloseTo(30.05, 10);
  });
});

describe('stress >70 — dialogues, conflit, nuit moins réparatrice (§5)', () => {
  it('dialogues « de haut niveau » verrouillés au-delà de 70', () => {
    expect(isStresse(mondeAvec({ stress: 80 }))).toBe(true);
    expect(isStresse(mondeAvec({ stress: 70 }))).toBe(false);
  });

  it('probabilité de conflit +15 pts au-delà de 70', () => {
    expect(conflictRiskBonus(mondeAvec({ stress: 80 }))).toBe(0.15);
    expect(conflictRiskBonus(mondeAvec({ stress: 70 }))).toBe(0);
  });

  it('nuit moins réparatrice : récupération de fatigue réduite (−40 %)', () => {
    const strese = mondeAvec({ fatigue: 40, stress: 80 }, true);
    const calme = mondeAvec({ fatigue: 40, stress: 20 }, true);
    needsTick(strese);
    needsTick(calme);
    // 0,35 × 0,6 = 0,21 de récupération au lieu de 0,35.
    expect(strese.player.needs.fatigue).toBeCloseTo(39.79, 5);
    expect(calme.player.needs.fatigue).toBeCloseTo(39.65, 5);
    expect(strese.player.needs.fatigue).toBeGreaterThan(calme.player.needs.fatigue);
  });

  it('retombe lentement au-dessus de 25 (homéostase)', () => {
    const w = mondeAvec({ stress: 30 });
    needsTick(w);
    expect(w.player.needs.stress).toBeCloseTo(29.98, 10);
  });
});

describe('moral <30 — coût social, refus, rendement (§5)', () => {
  it('actions sociales coûtent 2× le temps en dessous de 30', () => {
    expect(socialTimeFactor(mondeAvec({ moral: 20 }))).toBe(2);
    expect(socialTimeFactor(mondeAvec({ moral: 30 }))).toBe(1); // seuil strict
    expect(isDemoralise(mondeAvec({ moral: 20 }))).toBe(true);
  });

  it('propositions refusées plus souvent en dessous de 30', () => {
    expect(proposalAcceptBonus(mondeAvec({ moral: 20 }))).toBe(-0.2);
    expect(proposalAcceptBonus(mondeAvec({ moral: 30 }))).toBe(0);
  });

  it('rendement − en dessous de 30 (−25 %), cumulable avec l\'épuisement (−50 %)', () => {
    expect(rendementFactor(mondeAvec({ moral: 20 }))).toBe(0.75);
    expect(rendementFactor(mondeAvec({ moral: 30 }))).toBe(1);
    expect(rendementFactor(mondeAvec({ fatigue: 86 }))).toBe(0.5);
    expect(rendementFactor(mondeAvec({ fatigue: 86, moral: 20 }))).toBe(0.375);
  });

  it('dynamique : remonte lentement sous 50, décroit au-dessus de 50', () => {
    const bas = mondeAvec({ moral: 40 });
    needsTick(bas);
    expect(bas.player.needs.moral).toBeCloseTo(40.01, 10);
    const haut = mondeAvec({ moral: 60 });
    needsTick(haut);
    expect(haut.player.needs.moral).toBeCloseTo(59.99, 10);
  });
});

describe('besoins — interaction faim → moral (§5)', () => {
  it('le clonage du monde préserve les besoins (base des comparaisons)', () => {
    const w = mondeAvec({ faim: 80, moral: 50 });
    const copie = cloneWorld(w);
    needsTick(copie);
    expect(w.player.needs.moral).toBe(50); // l'original n'a pas bougé
  });
});

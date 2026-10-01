/**
 * Besoins — chaque valeur a AU MOINS 3 conséquences mécaniques (Principe 2 du maître) :
 *  - fatigue : vitesse (capacité), échec d'action (performance), irritabilité (relation)
 *  - faim    : apprentissage (capacité), moral (jauge liée), malaise forcé (performance)
 *  - stress  : dialogues verrouillés (capacité), probabilité de conflit (relation), récupération (performance)
 *  - moral   : coût des actions sociales (capacité), refus de propositions (relation), rendement (performance)
 */
import type { WorldState } from '../core/types';

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

/** Évolution par tick (10 min simulées). */
export function needsTick(w: WorldState): void {
  const n = w.player.needs;
  if (w.player.asleep) {
    // Nuit moins réparatrice sous stress (§5) : récupération de fatigue réduite.
    n.fatigue = clamp(n.fatigue - 0.35 * (n.stress > 70 ? 0.6 : 1));
    n.faim = clamp(n.faim + 0.05);
  } else {
    n.fatigue = clamp(n.fatigue + 0.08);
    n.faim = clamp(n.faim + 0.15);
  }
  // Homeostase lente
  if (n.stress > 25) n.stress = clamp(n.stress - 0.02);
  n.moral = clamp(n.moral + (n.moral < 50 ? 0.01 : -0.01));

  // Interactions internes : la faim ronge le moral
  if (n.faim > 70) n.moral = clamp(n.moral - 0.05);
}

// ---------- Lectures de conséquences (utilisé par actions, apprentissage, relations) ----------

export const fatigueFactor = (w: WorldState): number => (w.player.needs.fatigue > 70 ? 0.7 : 1); // vitesse -30 %
export const failureBonus = (w: WorldState): number => (w.player.needs.fatigue > 70 ? 0.2 : 0); // +20 % échec
export const isIrritable = (w: WorldState): boolean => w.player.needs.fatigue > 70;
export const isEpuise = (w: WorldState): boolean => w.player.needs.fatigue > 85;

export const learningFactor = (w: WorldState): number => (w.player.needs.faim > 70 ? 0.5 : 1);
export const isAffame = (w: WorldState): boolean => w.player.needs.faim > 70;
export const isMalaise = (w: WorldState): boolean => w.player.needs.faim > 90;

export const isStresse = (w: WorldState): boolean => w.player.needs.stress > 70;
export const conflictRiskBonus = (w: WorldState): number => (isStresse(w) ? 0.15 : 0);

export const isDemoralise = (w: WorldState): boolean => w.player.needs.moral < 30;
export const socialTimeFactor = (w: WorldState): number => (isDemoralise(w) ? 2 : 1);
export const proposalAcceptBonus = (w: WorldState): number => (isDemoralise(w) ? -0.2 : 0);

/** Rendement école/projet : −50 % si épuisé (>85), −25 % si moral <30 (« rendement − », §5). */
export const rendementFactor = (w: WorldState): number =>
  (isEpuise(w) ? 0.5 : 1) * (isDemoralise(w) ? 0.75 : 1);

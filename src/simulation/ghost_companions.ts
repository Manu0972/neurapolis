/**
 * NEURAPOLIS — Moteur du Compagnon Fantôme Interactif (Widget Kawaii & Avis Spontané).
 */
import type { GhostCompanionState, GhostId, WorldState } from '../core/types';
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';

export function ensureGhostCompanionState(w: WorldState): GhostCompanionState {
  if (!w.ghostCompanion) {
    const actives = Object.values(w.council.ghosts).filter((g) => g.status === 'actif').map((g) => g.id);
    const activeGhostId = actives[0] ?? 'smith';
    w.ghostCompanion = {
      activeGhostId,
      mood: 'curieux',
      speechBubble: 'Je veille sur tes décisions, Camille !',
      lastAdviceTick: 0,
      unlockedThinkers: [...actives],
    };
  }
  return w.ghostCompanion;
}

export function getGhostCompanionThought(w: WorldState): {
  ghostId: GhostId;
  name: string;
  emoji: string;
  mood: 'curieux' | 'enthousiaste' | 'inquiet' | 'tactique' | 'malicieux';
  speechBubble: string;
} {
  const gc = ensureGhostCompanionState(w);
  const actives = Object.values(w.council.ghosts).filter((g) => g.status === 'actif').map((g) => g.id);
  const gid = gc.activeGhostId && actives.includes(gc.activeGhostId) ? gc.activeGhostId : (actives[0] ?? 'smith');
  gc.activeGhostId = gid;

  const def = GHOST_DEFS_BY_ID[gid];
  const name = def?.name ?? 'Conseiller';
  const emoji = def?.emoji ?? '✨';

  // Calculer l'humeur en fonction des jauges du joueur
  let mood: 'curieux' | 'enthousiaste' | 'inquiet' | 'tactique' | 'malicieux' = 'curieux';
  let speech = 'Observe le marché et les besoins du quartier.';

  if (w.player.needs.stress > 60 || w.player.needs.fatigue > 70) {
    mood = 'inquiet';
    speech = 'Tu tires trop sur la corde… Repose-toi avant d’engager un grand coup !';
  } else if (w.player.money > 100) {
    mood = 'enthousiaste';
    speech = 'Notre trésorerie est solide ! C’est le moment d’investir et d’étendre nos réseaux.';
  } else if (w.macroNews && w.macroNews.costModifier > 0.1) {
    mood = 'tactique';
    speech = 'L’inflation monte ! Négocie tes achats auprès de Mme Bertin dès maintenant.';
  } else if (gid === 'marx') {
    mood = 'tactique';
    speech = 'Veille à ce que la valeur produite revienne aux travailleurs, pas aux intermédiaires !';
  } else if (gid === 'ostrom') {
    mood = 'enthousiaste';
    speech = 'La coopération et les règles partagées font la vraie force des communs.';
  } else if (gid === 'smith') {
    mood = 'malicieux';
    speech = 'Laisse faire le penchant naturel à l’échange… et garde un œil sur les marges !';
  }

  gc.mood = mood;
  gc.speechBubble = speech;

  return { ghostId: gid, name, emoji, mood, speechBubble: speech };
}

export function askActiveGhostAdvice(w: WorldState): {
  ghostId: GhostId;
  name: string;
  adviceText: string;
  mood: string;
} {
  const thought = getGhostCompanionThought(w);
  const def = GHOST_DEFS_BY_ID[thought.ghostId];
  let customAdvice = def?.voice.favorable ?? thought.speechBubble;

  if (w.player.money < 10) {
    customAdvice = `« Camille, tes liquidités sont basses. Concentre-toi sur quelques ventes de goûters ou petites réparations pour sécuriser la trésorerie. »`;
  } else if (w.campaign.currentChapter === 1) {
    customAdvice = `« Le collège et la place des Roses sont ton terrain d'apprentissage. Fidélise Mme Bertin et structure ton stand avec Noah et Lina. »`;
  } else if (w.campaign.currentChapter >= 2) {
    customAdvice = `« Ne reste pas isolé : active les rôles dans tes différentes entreprises et coordonne tes actions avec la cartographie stratégique. »`;
  }

  return {
    ghostId: thought.ghostId,
    name: thought.name,
    adviceText: customAdvice,
    mood: thought.mood,
  };
}

export function switchCompanionGhost(w: WorldState, nextGhostId: GhostId): { ok: boolean; message: string } {
  const gc = ensureGhostCompanionState(w);
  const def = GHOST_DEFS_BY_ID[nextGhostId];
  if (!def) return { ok: false, message: 'Fantôme inconnu.' };

  gc.activeGhostId = nextGhostId;
  return { ok: true, message: `${def.emoji} ${def.name} t’accompagne désormais au premier plan.` };
}

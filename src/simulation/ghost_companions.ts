/**
 * NEURAPOLIS — Moteur du Compagnon Fantôme Interactif (Widget Kawaii & Avis Spontané).
 */
import type { GhostCompanionState, GhostId, Notification, WorldState } from '../core/types';
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';

export function ensureGhostCompanionState(w: WorldState): GhostCompanionState {
  if (!w.ghostCompanion) {
    const actives = Object.values(w.council.ghosts).filter((g) => g.status === 'actif').map((g) => g.id);
    const activeGhostId = actives[0] ?? 'smith';
    w.ghostCompanion = {
      activeGhostId,
      mood: 'curieux',
      speechBubble: 'Je veille sur tes décisions !',
      lastAdviceTick: 0,
      unlockedThinkers: [...actives],
    };
  }
  if (!w.ghostCompanion.unlockedThinkers) {
    const actives = Object.values(w.council.ghosts).filter((g) => g.status === 'actif').map((g) => g.id);
    w.ghostCompanion.unlockedThinkers = [...actives];
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

  const pName = w.player.firstName || w.player.name || 'Jeune ami';
  if (w.player.money < 10) {
    customAdvice = `« ${pName}, tes liquidités sont basses. Concentre-toi sur quelques ventes de goûters ou petites réparations pour sécuriser la trésorerie. »`;
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

export interface ThinkerUnlockRule {
  ghostId: GhostId;
  name: string;
  conditionDescription: string;
  check: (w: WorldState) => boolean;
}

export const THINKER_UNLOCK_RULES: ThinkerUnlockRule[] = [
  // 1. Smith : premier échange commercial
  {
    ghostId: 'smith',
    name: 'Adam Smith',
    conditionDescription: 'Premier échange commercial réalisé',
    check: (w) => (w.flags['echanges'] ?? 0) >= 1,
  },
  // 2. Walras : études et compréhension
  {
    ghostId: 'walras',
    name: 'Léon Walras',
    conditionDescription: 'Moyenne scolaire >= 15/20 et Compréhension >= 40',
    check: (w) => (w.schoolLife?.academicAverage ?? 0) >= 15 && w.player.characteristics.comprehension >= 40,
  },
  // 3. Taylor : rigueur et assiduité en classe
  {
    ghostId: 'taylor',
    name: 'Frederick Taylor',
    conditionDescription: 'Discipline >= 50 et 5 cours consécutifs suivis',
    check: (w) => w.player.characteristics.discipline >= 50 && (w.schoolLife?.consecutiveClassesAttended ?? 0) >= 5,
  },
  // 4. Locke : assiduité et sens de la justice
  {
    ghostId: 'locke',
    name: 'John Locke',
    conditionDescription: 'Assiduité scolaire >= 95% et première injustice observée',
    check: (w) => (w.schoolLife?.attendanceRate ?? 0) >= 95 && (w.flags['injustices'] ?? 0) >= 1,
  },
  // 5. Ostrom : notion confiance et incitations
  {
    ghostId: 'ostrom',
    name: 'Elinor Ostrom',
    conditionDescription: 'Notion « Confiance et incitations » maîtrisée (Stade 4)',
    check: (w) => (w.player.notions['confiance_incitations']?.stage ?? 0) >= 4,
  },
  // 6. Marx : notion égalité, équité et incitation
  {
    ghostId: 'marx',
    name: 'Karl Marx',
    conditionDescription: 'Notion « Égalité, équité, incitation » maîtrisée (Stade 4)',
    check: (w) => (w.player.notions['egalite_equite_incitation']?.stage ?? 0) >= 4,
  },
  // 7. Keynes : notion prévision incertaine
  {
    ghostId: 'keynes',
    name: 'John Maynard Keynes',
    conditionDescription: 'Notion « Prévoir, c’est parier » maîtrisée (Stade 4)',
    check: (w) => (w.player.notions['prevision_incertaine']?.stage ?? 0) >= 4,
  },
  // 8. Schumpeter : expansion hors quartier et adaptabilité
  {
    ghostId: 'schumpeter',
    name: 'Joseph Schumpeter',
    conditionDescription: 'Expansion au-delà du quartier et Adaptabilité >= 45',
    check: (w) => w.actionPlanning?.expansionLevel !== 'quartier' && (w.player.characteristics.adaptabilite ?? 0) >= 45,
  },
];

export function checkAndUnlockThinkers(w: WorldState): Notification[] {
  const gc = ensureGhostCompanionState(w);
  const notifs: Notification[] = [];
  for (const rule of THINKER_UNLOCK_RULES) {
    if (!gc.unlockedThinkers.includes(rule.ghostId) && rule.check(w)) {
      gc.unlockedThinkers.push(rule.ghostId);
      notifs.push({
        kind: 'fantome',
        text: `🎓 Nouveau penseur révélé dans ton esprit : ${rule.name} ! (${rule.conditionDescription})`,
        ghost: rule.ghostId,
      });
    }
  }
  return notifs;
}


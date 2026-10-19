/**
 * Missions en étapes, façon GTA : une seule étape active à la fois, courte (verbe + quoi + où),
 * avec une cible (lieu ou PNJ) et, une fois sur place, l'action directe à lancer avec E.
 *
 * Lecture seule et déterministe : l'étape est DÉDUITE de l'état du monde (drapeaux et objectifs
 * des chapitres, src/simulation/campaign.ts), qui restent la seule source de vérité. Aucun champ
 * n'est ajouté à WorldState : la présentation retient seulement quelle étape elle a déjà fêtée.
 *
 * Idée de présentation inspirée de CubeGO (Portalyze 2024, licence MIT) : une mission à la fois,
 * un repère à suivre, « MISSION ACCOMPLIE » puis la suivante. Aucun code n'en est repris ici.
 */
import type { NpcId, PlaceId, WorldState } from '../core/types';
import { dayIndexOf, minutesOfDay } from '../core/clock';
import { PLACE_ANCHORS } from '../data/map';
import { PLACE_BY_ID } from '../data/places';
import { NPC_BY_ID } from '../data/npcs';
import { STAND_CONFIG } from '../data/project';
import { COUNTER_STRATEGIES } from '../data/rivals';
import {
  CHAPTER4_SUPPORT, chapter1Sales, chapter1Team, chapter3Help, chapter4QuarterBacked, chapter4Support,
  chapterObjectivesMet,
} from './campaign';
import { classWindow, isInClass, SESSIONS } from './family';
import { nearPlace, placeAtAdjacent } from './interact';
import { npcPosition } from './npc';
import { coutStock } from './project';
import { totalXpForLevel } from './skills';

export type MissionKind = 'aller' | 'parler' | 'faire' | 'attendre';

/** Actions directes qu'un appui sur E lance une fois sur place (branchées dans la présentation). */
export type MissionDo =
  | 'acheter_stock' | 'tenir_stand' | 'parler' | 'recruter' | 'contre_offensive' | 'course'
  | 'regles' | 'conseil' | 'debat' | 'modele' | 'passer_temps';

export type MissionTarget =
  | { kind: 'lieu'; place: PlaceId; x: number; y: number }
  | { kind: 'pnj'; npc: NpcId; x: number; y: number };

export interface MissionStep {
  /** Identifiant stable de l'étape (sert à détecter « étape terminée »). */
  id: string;
  chapter: number;
  /**
   * Rang dans la progression du chapitre : une étape de rang supérieur à toutes celles déjà vues
   * vaut « MISSION ACCOMPLIE ». Rang négatif : étape de circonstance (cours, sortir), jamais fêtée.
   */
  rank: number;
  kind: MissionKind;
  icon: string;
  /** Texte du bandeau : verbe + quoi + où. */
  text: string;
  count?: { done: number; total: number; unit: string };
  /** Le « comment » en une phrase (sous le bandeau, en petit). */
  detail?: string;
  target?: MissionTarget;
  /** Action directe (E) : à la cible si `target`, sinon n'importe où dehors. */
  action?: { do: MissionDo; label: string; npc?: NpcId };
}

export interface MissionContext {
  /** Le joueur est dans un intérieur (information de présentation). */
  inside?: boolean;
}

/** Rayon (tuiles) dans lequel une cible est atteinte. */
export const MISSION_REACH = 2;

const placeName = (p: PlaceId): string => PLACE_BY_ID[p]?.name ?? p;
const firstName = (id: NpcId): string => {
  const n = NPC_BY_ID[id]?.name ?? id;
  return n.startsWith('Mme ') ? n : n.split(' ')[0]!;
};
const lieu = (place: PlaceId): MissionTarget => ({ kind: 'lieu', place, ...PLACE_ANCHORS[place] });
const pnj = (w: WorldState, npc: NpcId): MissionTarget => ({ kind: 'pnj', npc, ...npcPosition(w, npc) });

/** Distance (en tuiles, ≈ mètres) entre le joueur et la cible. */
export function missionDistance(w: WorldState, t: MissionTarget): number {
  return Math.round(Math.hypot(t.x - w.player.pos.x, t.y - w.player.pos.y));
}

/** Le joueur est-il arrivé à la cible ? (porte du lieu adjacente, ou PNJ à portée de dialogue) */
export function missionTargetReached(w: WorldState, t: MissionTarget): boolean {
  // Un lieu est atteint devant sa porte ; un PNJ, à portée de dialogue.
  const { x, y } = w.player.pos;
  if (t.kind === 'lieu') {
    // Pas besoin de viser la case exacte de la porte : deux pas autour suffisent (E y entre).
    return placeAtAdjacent(w) === t.place || (Math.abs(t.x - x) <= MISSION_REACH && Math.abs(t.y - y) <= MISSION_REACH);
  }
  return Math.abs(t.x - x) <= MISSION_REACH && Math.abs(t.y - y) <= MISSION_REACH;
}

/**
 * Drapeau (dans `w.seen`, pas de changement de schéma) posé par la présentation dès que le joueur
 * a marché quelques pas : la première mission « Apprends à te déplacer » est alors réussie.
 */
export const MOVEMENT_LESSON_FLAG = 'mission:deplacement';

/** La leçon de déplacement est-elle encore à faire ? (nouvelle partie seulement) */
export function needsMovementLesson(w: WorldState): boolean {
  return w.campaign.currentChapter === 1 && !w.project?.active && !w.seen[MOVEMENT_LESSON_FLAG];
}

/** Drapeau posé par la présentation à la première entrée chez soi (mission « Rentre chez toi »). */
export const HOME_VISIT_FLAG = 'mission:maison';

/** La visite de la maison est-elle encore à faire ? (nouvelle partie seulement) */
export function needsHomeVisit(w: WorldState): boolean {
  return w.campaign.currentChapter === 1 && !w.project?.active && !w.seen[HOME_VISIT_FLAG];
}

/** Tutoriel guidé (chapitre 1 non terminé) : les fenêtres non indispensables attendent. */
export function missionTutorialActive(w: WorldState): boolean {
  return w.campaign.currentChapter === 1 && !w.campaign.completedChapters.includes(1);
}

/**
 * Étape « aller à » puis étape « faire » : tant que la cible n'est pas atteinte, on y envoie le
 * joueur (rang r) ; arrivé, l'étape d'action prend le relais (rang r + 1).
 */
function goThenDo(
  w: WorldState, ch: number, r: number, id: string, target: MissionTarget,
  goText: string, doStep: Omit<MissionStep, 'id' | 'chapter' | 'rank' | 'target'>,
): MissionStep {
  if (!missionTargetReached(w, target)) {
    return {
      id: `${id}:aller`, chapter: ch, rank: r, kind: target.kind === 'pnj' ? 'parler' : 'aller', icon: '🎯',
      text: goText, count: doStep.count, detail: doStep.detail, target,
    };
  }
  return { ...doStep, id: `${id}:faire`, chapter: ch, rank: r + 1, target };
}

/** Stock du stand : le racheter chez Mme Bertin (ou gagner de quoi le payer). */
function stockStep(w: WorldState, ch: number, r: number): MissionStep {
  const cost = coutStock(dayIndexOf(w.time.tick));
  const p = w.project;
  const dispo = (p?.balance ?? 0) + w.player.money;
  if (p?.active && dispo < cost) {
    return goThenDo(w, ch, r, `c${ch}:argent`, lieu('epicerie'), `Va à l’${placeName('epicerie')} pour gagner de quoi payer le stock`, {
      kind: 'faire', icon: '🧺', text: `Fais une course pour Mme Bertin (il te manque ${(cost - dispo).toFixed(2).replace('.', ',')} €)`,
      action: { do: 'course', label: 'Faire une course (20 min, 2 €)' },
    });
  }
  return goThenDo(w, ch, r, `c${ch}:stock`, lieu('epicerie'), `Va à l’${placeName('epicerie')} acheter du stock`, {
    kind: 'faire', icon: '📦', text: `Achète ton stock de goûters chez Mme Bertin (${cost} €)`,
    detail: p?.active ? undefined : 'Acheter des goûters en gros pour les revendre un peu plus cher sur la place : ton petit commerce, le Stand des Roses, démarre avec ce premier achat.',
    action: { do: 'acheter_stock', label: `Acheter du stock (${cost} €)` },
  });
}

/** Tenir le stand sur la place (avec le stock en préalable). */
function sellStep(w: WorldState, ch: number, r: number, count?: MissionStep['count'], detail?: string): MissionStep {
  if (!w.project?.active || w.project.stock <= 0) return stockStep(w, ch, r);
  return goThenDo(w, ch, r + 2, `c${ch}:vente`, lieu('place'), `Va sur la ${placeName('place').replace(/^Place/, 'place')} pour tenir ton stand`, {
    kind: 'faire', icon: '🧁', text: 'Tiens ton stand sur la place du Marché', count, detail,
    action: { do: 'tenir_stand', label: 'Tenir le stand (1 h)' },
  });
}

/** Copain à aller voir : le plus proche des deux recrutables encore libres. */
function nearestFriend(w: WorldState, ids: readonly NpcId[]): NpcId {
  const { x, y } = w.player.pos;
  return [...ids].sort((a, b) => {
    const pa = npcPosition(w, a);
    const pb = npcPosition(w, b);
    return Math.hypot(pa.x - x, pa.y - y) - Math.hypot(pb.x - x, pb.y - y) || a.localeCompare(b);
  })[0]!;
}

/** Recruter un copain : d'abord gagner Communication 2 en discutant, puis lui demander. */
function teamStep(w: WorldState, ch: number, r: number, wanted: number): MissionStep | null {
  const p = w.project;
  const free = STAND_CONFIG.recruitables.filter((id) => !p?.members.includes(id));
  if (!p?.active || free.length === 0 || p.members.length >= wanted) return null;
  const friend = nearestFriend(w, free);
  const name = firstName(friend);
  const skill = w.player.skills[STAND_CONFIG.recruitSkill];
  const need = totalXpForLevel(STAND_CONFIG.recruitMinLevel);
  if ((skill?.level ?? 0) < STAND_CONFIG.recruitMinLevel) {
    return goThenDo(w, ch, r, `c${ch}:discuter`, pnj(w, friend), `Rejoins ${name} pour discuter du stand`, {
      kind: 'parler', icon: '💬', text: `Discute avec ${name} pour le convaincre`,
      count: { done: Math.min(need, skill?.xp ?? 0), total: need, unit: 'pts de communication' },
      detail: 'Choisis un sujet, puis une réponse 🤝 motivée ou 😊 chaleureuse : elles font progresser ta communication.',
      action: { do: 'parler', label: `Parler à ${name}`, npc: friend },
    });
  }
  return goThenDo(w, ch, r + 2, `c${ch}:recruter`, pnj(w, friend), `Rejoins ${name} pour lui proposer le stand`, {
    kind: 'faire', icon: '🤝', text: `Propose à ${name} de rejoindre ton stand`,
    action: { do: 'recruter', label: `Recruter ${name}`, npc: friend },
  });
}

/** Contre-offensive contre le drive et les distributeurs (écran Concurrence). */
function counterStep(w: WorldState, ch: number, r: number): MissionStep {
  const cheapest = Math.min(...COUNTER_STRATEGIES.map((s) => s.costMoney));
  const dispo = (w.project?.balance ?? 0) + w.player.money;
  return goThenDo(w, ch, r, `c${ch}:riposte`, lieu('place'), 'Va sur la place du Marché, face au drive', {
    kind: 'faire', icon: '⚔️', text: 'Lance une contre-offensive contre le drive',
    detail: dispo < cheapest ? `Il faut au moins ${cheapest} € (caisse du stand puis ta poche) : vends encore un peu.` : 'Payée par la caisse du stand, puis ta poche.',
    action: { do: 'contre_offensive', label: 'Choisir une contre-offensive' },
  });
}

/** Objectifs remplis : il reste à laisser passer le temps (fin de journée ou anniversaire). */
function waitStep(w: WorldState, ch: number, targetAge: number): MissionStep {
  const skip = { do: 'passer_temps' as const, label: 'Passer le temps' };
  if (w.player.age < targetAge) {
    return {
      id: `c${ch}:anniversaire`, chapter: ch, rank: 50, kind: 'attendre', icon: '📅',
      text: `Fais passer le temps jusqu’à tes ${targetAge} ans (1er septembre)`,
      detail: 'Objectifs remplis : le chapitre se conclura à ton anniversaire. Appuie sur E : « Aller jusqu’à ton anniversaire » t’y amène d’un coup, tes affaires continuent de tourner.',
      action: skip,
    };
  }
  return {
    id: `c${ch}:nuit`, chapter: ch, rank: 50, kind: 'attendre', icon: '🌙',
    text: 'Fais passer le temps jusqu’à demain : le chapitre se termine cette nuit',
    detail: 'Objectifs remplis ! Appuie sur E (ou « 📅 Passer le temps », en haut à gauche) pour finir la journée.',
    action: skip,
  };
}

function chapterStep(w: WorldState): MissionStep | null {
  const ch = w.campaign.currentChapter;
  const stage = w.campaign.stages.find((s) => s.chapter === ch);
  if (!stage || stage.completed) return null;
  if (chapterObjectivesMet(w)) return waitStep(w, ch, stage.targetAge);

  if (ch === 1) {
    if (chapter1Sales(w) < 3) {
      return sellStep(w, 1, 3, { done: chapter1Sales(w), total: 3, unit: 'ventes' }, 'Une heure au stand : les passants achètent tes goûters.');
    }
    if (chapter1Team(w) < 1) return teamStep(w, 1, 10, 1);
    return counterStep(w, 1, 20);
  }
  if (ch === 2) {
    if ((w.flags['chapitre2ConversationCoopSamir'] ?? 0) <= 0) {
      return goThenDo(w, 2, 1, 'c2:samir', pnj(w, 'samir'), 'Rejoins Samir (Friche le matin, place l’après-midi)', {
        kind: 'parler', icon: '💬', text: 'Parle de la coopérative avec Samir',
        detail: 'Choisis le sujet « 🤝 La coop ».',
        action: { do: 'parler', label: 'Parler à Samir', npc: 'samir' },
      });
    }
    if (!(w.project?.rules.collectif ?? false)) {
      const team = teamStep(w, 2, 10, 2);
      if (team) return team;
      return {
        id: 'c2:regles', chapter: 2, rank: 20, kind: 'faire', icon: '📜',
        text: 'Adopte des règles partagées avec ton équipe',
        detail: 'Rôles, partage de la caisse, horaires : décidez ensemble. Appuie sur E quand personne n’est à côté de toi.',
        action: { do: 'regles', label: 'Adopter les règles partagées' },
      };
    }
    return sellStep(w, 2, 30, undefined, 'Une vente tenue avec les règles collectives.');
  }
  if (ch === 3) {
    const help = chapter3Help(w);
    if (help < 5) {
      return goThenDo(w, 3, 1, 'c3:course', lieu('epicerie'), `Va à l’${placeName('epicerie')} pour aider Mme Bertin`, {
        kind: 'faire', icon: '🧺', text: 'Fais des courses pour l’épicerie',
        count: { done: help, total: 5, unit: 'courses' },
        action: { do: 'course', label: 'Faire une course (20 min, 2 €)' },
      });
    }
    return counterStep(w, 3, 10);
  }
  if (ch === 4) {
    if ((w.flags['chapitre4ConseilMobilise'] ?? 0) <= 0) {
      return {
        id: 'c4:conseil', chapter: 4, rank: 1, kind: 'faire', icon: '👻',
        text: 'Mobilise le Conseil pour le débat citoyen', detail: 'Il faut deux voix actives au Conseil.',
        action: { do: 'conseil', label: 'Mobiliser le Conseil' },
      };
    }
    if ((w.flags['chapitre4DebatCitoyen'] ?? 0) <= 0) {
      if (w.player.age < 15) {
        return {
          id: 'c4:attente-debat', chapter: 4, rank: 5, kind: 'attendre', icon: '📅',
          text: 'Fais passer le temps : le débat de la place aura lieu à tes 15 ans',
          detail: 'Le Conseil est prêt. Appuie sur E : « Aller jusqu’à ton anniversaire » t’y amène d’un coup, tes affaires continuent de tourner.',
          action: { do: 'passer_temps', label: 'Passer le temps' },
        };
      }
      return goThenDo(w, 4, 10, 'c4:debat', lieu('place'), 'Va sur la place du Marché pour le grand débat', {
        kind: 'faire', icon: '🗳️', text: 'Choisis l’aménagement de la place',
        action: { do: 'debat', label: 'Participer au grand débat' },
      });
    }
    if (!chapter4QuarterBacked(w)) {
      return goThenDo(w, 4, 20, 'c4:soutien', lieu('epicerie'), `Va à l’${placeName('epicerie')} montrer ton soutien`, {
        kind: 'faire', icon: '🧺', text: 'Fais des courses pour l’épicerie',
        count: { done: chapter4Support(w), total: CHAPTER4_SUPPORT, unit: 'courses' },
        action: { do: 'course', label: 'Faire une course (20 min, 2 €)' },
      });
    }
  }
  if (ch === 5 && (w.flags['chapitre5ModeleFonde'] ?? 0) <= 0) {
    return {
      id: 'c5:modele', chapter: 5, rank: 1, kind: 'faire', icon: '🏛️',
      text: 'Choisis le modèle économique de Val-Ferrand',
      action: { do: 'modele', label: 'Choisir le modèle économique' },
    };
  }
  // Campagne finie : le bandeau ne s'éteint pas sans rien dire, il montre la suite.
  if (w.campaign.completedChapters.includes(5)) {
    return {
      id: 'campagne:fin', chapter: 5, rank: 60, kind: 'faire', icon: '🏁',
      text: 'Campagne de Val-Ferrand terminée : continue ton Ascension',
      detail: 'Ouvre le téléphone (P), appli 🚀 Ascension : lance des idées, gagne des paliers. Tes affaires continuent de tourner.',
    };
  }
  return null;
}

/**
 * L'étape de mission active. Ordre de priorité : dormir/en cours (rien à faire), l'heure des cours,
 * sortir d'un intérieur quand la cible est dehors, puis l'étape du chapitre.
 */
export function currentMission(w: WorldState, ctx: MissionContext = {}): MissionStep | null {
  const ch = w.campaign.currentChapter;
  if (w.player.asleep) return { id: 'sommeil', chapter: ch, rank: -1, kind: 'attendre', icon: '😴', text: 'Tu dors : la nuit passe' };
  if (isInClass(w)) return { id: 'en-cours', chapter: ch, rank: -1, kind: 'attendre', icon: '📚', text: 'Tu es en cours : la mission reprend à la sortie' };
  if (needsMovementLesson(w) && !ctx.inside) {
    return {
      id: 'deplacement', chapter: ch, rank: 0, kind: 'faire', icon: '🚶',
      text: 'Apprends à te déplacer : marche quelques pas',
    };
  }
  if (needsHomeVisit(w) && !ctx.inside) {
    return {
      id: 'maison', chapter: ch, rank: 1, kind: 'aller', icon: '🏠',
      text: 'Rentre chez toi : Cité des Roses, bâtiment A',
      detail: 'Suis la balise dorée, puis E devant la porte pour entrer. La petite maison sur la mini-carte, c’est chez toi.',
      target: lieu('maison'),
    };
  }
  const session = classWindow(w);
  if (session && nearPlace(w, 'college')) {
    return {
      id: `cours:${session}:entrer`, chapter: ch, rank: -1, kind: 'faire', icon: '📚',
      text: 'Entre en cours : appuie sur E devant le collège (ou dans le hall)',
      detail: 'Ta mission reprendra après les cours.', target: lieu('college'),
    };
  }
  if (session) {
    const start = session === 'matin' ? '8 h 30' : '13 h 30';
    // Déjà commencé : on le dit (« commencent à 8 h 30 » à 11 h, c'est trompeur).
    const late = minutesOfDay(w.time.tick) > SESSIONS[session].start;
    return {
      id: `cours:${session}`, chapter: ch, rank: -1, kind: 'aller', icon: '📚',
      text: late
        ? `Va au collège : tu es en retard, le cours a commencé à ${start}`
        : `Va au collège : les cours commencent à ${start}`,
      detail: 'Entre au collège avec E. Ta mission reprendra après les cours.', target: lieu('college'),
    };
  }
  const step = chapterStep(w);
  if (step && ctx.inside && step.target) {
    // Le tout premier pas du tutoriel compte comme une mission (« sors de chez toi »).
    const first = ch === 1 && !w.project?.active;
    return {
      id: 'sortir', chapter: ch, rank: first ? 2 : -1, kind: 'aller', icon: '🚪',
      text: first ? 'Sors de chez toi' : 'Sors du bâtiment',
      detail: `Marche jusqu’à la porte 🚪 (en bas de la pièce) et appuie sur E. Ensuite : ${step.text.charAt(0).toLowerCase()}${step.text.slice(1)}.`,
    };
  }
  if (step && minutesOfDay(w.time.tick) >= 21 * 60 && step.kind !== 'attendre') {
    step.detail = `Il est tard : tu peux aussi dormir et reprendre demain.${step.detail ? ` ${step.detail}` : ''}`;
  }
  return step;
}

/** Texte complet du bandeau : « Tiens ton stand sur la place du Marché (1/3 ventes) ». */
export function missionLine(s: MissionStep): string {
  return s.count ? `${s.text} (${s.count.done}/${s.count.total} ${s.count.unit})` : s.text;
}

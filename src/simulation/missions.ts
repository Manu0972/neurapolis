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
import { classWindow, isInClass, seanceDebut, sessionsFor } from './family';
import { lieuScolaire } from './school_life';
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
  /**
   * Étape « va parler à » : drapeau (`w.flags`) posé quand le joueur parle à ce PNJ pendant que
   * l'étape est active (simulation/dialogue.ts, via `missionTalkFlag`). Pas de champ d'état ajouté.
   */
  talk?: { flag: string; npc: NpcId };
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
      ...(doStep.talk ? { talk: doStep.talk } : {}),
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

/** Drapeau d'une étape « va parler à » (vague 14 : étapes concrètes des chapitres 2 à 5). */
export const talkDone = (w: WorldState, id: string): boolean => (w.flags[`mission:${id}`] ?? 0) > 0;

/**
 * Aller voir quelqu'un (livrer, convaincre, préparer…) : la balise suit le PNJ, puis E ouvre la
 * conversation ; n'importe quel sujet valide l'étape. `where` dit où le trouver.
 */
function talkStep(
  w: WorldState, ch: number, r: number, id: string, npc: NpcId, goText: string, text: string, icon: string,
  detail?: string, target: MissionTarget = pnj(w, npc), count?: MissionStep['count'],
): MissionStep {
  const name = firstName(npc);
  return goThenDo(w, ch, r, id, target, goText, {
    kind: 'parler', icon, text, detail, count, talk: { flag: `mission:${id}`, npc },
    action: { do: 'parler', label: `Parler à ${name}`, npc },
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
    if (!talkDone(w, 'c2:karim')) {
      return talkStep(w, 2, 3, 'c2:karim', 'karim', 'Rejoins Karim (place le matin, Friche Taret l’après-midi)',
        'Demande à Karim ce qu’il faudrait pour rouvrir l’atelier', '🔧',
        'Karim connaît chaque machine de l’usine : écoute ce qu’il en dit avant d’écrire vos règles.');
    }
    if (!(w.project?.rules.collectif ?? false)) {
      const team = teamStep(w, 2, 10, 2);
      if (team) return team;
      if (!talkDone(w, 'c2:lina')) {
        return talkStep(w, 2, 16, 'c2:lina', 'lina', 'Rejoins Lina pour préparer les règles du stand',
          'Prépare les règles avec Lina : rôles, caisse, horaires', '📝',
          'Lina aime que tout soit clair. Parlez-en avant de les adopter avec toute l’équipe.');
      }
      return {
        id: 'c2:regles', chapter: 2, rank: 20, kind: 'faire', icon: '📜',
        text: 'Adopte des règles partagées avec ton équipe',
        detail: 'Rôles, partage de la caisse, horaires : décidez ensemble. Appuie sur E quand personne n’est à côté de toi.',
        action: { do: 'regles', label: 'Adopter les règles partagées' },
      };
    }
    if (!talkDone(w, 'c2:yasmine')) {
      return talkStep(w, 2, 24, 'c2:yasmine', 'yasmine', 'Rejoins Yasmine sur la place (après les cours)',
        'Annonce la vente collective à Yasmine : elle le dira à tout le quartier', '📣',
        'Une vente collective, ça se prépare : plus il y a de monde au courant, plus il y a de clients.');
    }
    return sellStep(w, 2, 30, undefined, 'Une vente tenue avec les règles collectives.');
  }
  if (ch === 3) {
    const help = chapter3Help(w);
    const livraisons = { done: help, total: 5, unit: 'livraisons' };
    const course = (r: number, id: string): MissionStep => goThenDo(w, 3, r, id, lieu('epicerie'), `Va à l’${placeName('epicerie')} chercher une commande`, {
      kind: 'faire', icon: '🧺', text: 'Livre une commande de l’épicerie dans le quartier', count: livraisons,
      action: { do: 'course', label: 'Faire une course (20 min, 2 €)' },
    });
    if (help < 5 && !talkDone(w, 'c3:bertin')) {
      return talkStep(w, 3, 1, 'c3:bertin', 'bertin', `Va à l’${placeName('epicerie')} : Mme Bertin a une liste de livraisons`,
        'Demande sa liste de livraisons à Mme Bertin', '📋',
        'Les clients âgés ne peuvent plus porter leurs sacs : le réseau solidaire commence par là.',
        lieu('epicerie'), livraisons);
    }
    if (help < 2) return course(3, 'c3:course');
    if (help < 5 && !talkDone(w, 'c3:monique')) {
      return talkStep(w, 3, 5, 'c3:monique', 'monique', 'Apporte un panier à Monique (épicerie le matin, parc l’après-midi)',
        'Livre son panier à Monique et demande qui d’autre en a besoin', '🧺',
        'Monique connaît tous les voisins du comité de quartier : elle saura qui aider ensuite.', undefined, livraisons);
    }
    if (help < 5) return course(7, 'c3:livraisons');
    if (!talkDone(w, 'c3:noah')) {
      return talkStep(w, 3, 9, 'c3:noah', 'noah', 'Rejoins Noah (parc après les cours)',
        'Prépare la riposte contre le drive avec Noah', '🛹',
        'Le drive casse les prix : avant de répondre, mettez-vous d’accord sur ce que le stand fait mieux que lui.');
    }
    return counterStep(w, 3, 12);
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
      if (!talkDone(w, 'c4:monique')) {
        return talkStep(w, 4, 2, 'c4:monique', 'monique', 'Rejoins Monique (épicerie le matin, parc l’après-midi)',
          'Convaincs Monique de venir défendre le quartier au débat', '🗣️',
          'Le comité de quartier l’écoute : si elle vient, les anciens viendront aussi.');
      }
      if (!talkDone(w, 'c4:samir')) {
        return talkStep(w, 4, 4, 'c4:samir', 'samir', 'Rejoins Samir (Friche le matin, place l’après-midi)',
          'Prépare tes arguments pour le débat avec Samir', '📝',
          'Qui paie, qui gagne, qui décide ? Trois questions à poser à chaque projet pour la place.');
      }
      if (w.player.age < 15) {
        return {
          id: 'c4:attente-debat', chapter: 4, rank: 6, kind: 'attendre', icon: '📅',
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
    if (!talkDone(w, 'c5:bertin')) {
      return talkStep(w, 5, 1, 'c5:bertin', 'bertin', `Va à l’${placeName('epicerie')} faire le bilan avec Mme Bertin`,
        'Fais le bilan de ces quatre années avec Mme Bertin', '📒',
        'Ce qui a tenu, ce qui a coûté, ce qu’il faut garder : son avis compte avant de choisir un modèle.', lieu('epicerie'));
    }
    if (!talkDone(w, 'c5:noah')) {
      return talkStep(w, 5, 3, 'c5:noah', 'noah', 'Rejoins Noah (parc après les cours)',
        'Demande à Noah ce que l’équipe veut léguer au quartier', '🤝',
        'Un modèle économique, c’est aussi ce que les autres feront sans toi.');
    }
    return {
      id: 'c5:modele', chapter: 5, rank: 5, kind: 'faire', icon: '🏛️',
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
 * Le joueur parle à `npcId` : si l'étape du chapitre en cours est « va parler à » ce PNJ, renvoie
 * le drapeau qui la valide (appelé par simulation/dialogue.ts). Les heures de cours n'y changent
 * rien : seule compte l'étape du chapitre.
 */
export function missionTalkFlag(w: WorldState, npcId: NpcId): string | null {
  const talk = chapterStep(w)?.talk;
  return talk && talk.npc === npcId ? talk.flag : null;
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
  const ecole = lieuScolaire(w.player.age);
  const quoi = ecole === 'lycee' ? 'lycée' : 'collège';
  if (session && nearPlace(w, ecole)) {
    return {
      id: `cours:${session}:entrer`, chapter: ch, rank: -1, kind: 'faire', icon: '📚',
      text: `Entre en cours : appuie sur E devant le ${quoi} (ou dans le hall)`,
      detail: 'Ta mission reprendra après les cours.', target: lieu(ecole),
    };
  }
  if (session) {
    const start = seanceDebut(w, session);
    // Déjà commencé : on le dit (« commencent à 8 h 30 » à 11 h, c'est trompeur).
    const late = minutesOfDay(w.time.tick) > sessionsFor(w)[session].start;
    return {
      id: `cours:${session}`, chapter: ch, rank: -1, kind: 'aller', icon: '📚',
      text: late
        ? `Va au ${quoi} : tu es en retard, le cours a commencé à ${start}`
        : `Va au ${quoi} : les cours commencent à ${start}`,
      detail: `Entre au ${quoi} avec E. Ta mission reprendra après les cours.`, target: lieu(ecole),
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

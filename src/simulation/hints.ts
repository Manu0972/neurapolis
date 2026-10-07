/**
 * Objectifs et pensées (V1.1) : ce qui compte maintenant pour le personnage, lu dans l'état du monde.
 * Chaque indice a une ligne d'objectif (onglet 🎯) et une pensée à la première personne (bulle 💭
 * et voix). Ce sont des indices utiles (« j'ai faim », « Bilal a peut-être trouvé quelque chose »),
 * jamais des révélations sur l'histoire. Fonction pure et déterministe : le choix d'une variante
 * dépend du jour, pas du hasard.
 */
import type { WorldState } from '../core/types';
import { dateOf, dayIndexOf, hhmm, isSchoolDay, minutesOfDay } from '../core/clock';
import { PLACE_ANCHORS } from '../data/map';
import { getCampaignProgressSummary } from './campaign';
import { businessDoor, pickupPoint } from './economy';

export interface HintTarget {
  x: number;
  y: number;
  name: string;
}

export interface Hint {
  id: string;
  icon: string;
  /** 5 = urgent … 1 = idée en passant. */
  priority: number;
  /** Ligne de l'onglet Objectifs. */
  objective: string;
  /** Pensée du personnage (bulle et voix). */
  thought: string;
  target?: HintTarget;
}

/** Ce que la présentation sait des autres joueurs (multijoueur). */
export interface OtherPlayer {
  name: string;
  x: number;
  y: number;
}

export interface HintContext {
  others?: readonly OtherPlayer[];
  pendingOffers?: number;
}

function pick(variants: readonly string[], w: WorldState, salt: number): string {
  const day = dayIndexOf(w.time.tick);
  return variants[(day * 7 + salt) % variants.length]!;
}

function dist(w: WorldState, p: { x: number; y: number }): number {
  return Math.hypot(w.player.pos.x - p.x, w.player.pos.y - p.y);
}

const HOME: HintTarget = { ...PLACE_ANCHORS.maison, name: 'Chez toi' };
const COLLEGE: HintTarget = { ...PLACE_ANCHORS.college, name: 'Collège' };
const PARK: HintTarget = { ...PLACE_ANCHORS.parc, name: 'Parc' };

export function currentHints(w: WorldState, ctx: HintContext = {}): Hint[] {
  const out: Hint[] = [];
  const n = w.player.needs;
  const day = dayIndexOf(w.time.tick);
  const min = minutesOfDay(w.time.tick);
  const wednesday = dateOf(day).weekday === 3;
  const farFromSchool = dist(w, COLLEGE) > 25;

  // ---------- Collège ----------
  if (isSchoolDay(day) && farFromSchool) {
    const classesEnd = wednesday ? 12 * 60 : 16 * 60 + 30;
    if (min >= 7 * 60 + 30 && min < 8 * 60 + 30) {
      out.push({
        id: 'college_depart', icon: '🏫', priority: 5, target: COLLEGE,
        objective: `Aller au collège (les cours commencent à 8 h 30, il est ${hhmm(min)})`,
        thought: pick([`Il est déjà ${hhmm(min)}… Si je traîne, je vais arriver en retard au collège.`, 'Les cours commencent à 8 h 30. Faut que j’y aille.', 'Sac sur le dos, direction le collège. Pas envie de me faire remarquer en retard.'], w, 1),
      });
    } else if (min >= 8 * 60 + 30 && min < classesEnd && !(min >= 12 * 60 && min < 13 * 60 + 30)) {
      out.push({
        id: 'college_absent', icon: '🏫', priority: 4, target: COLLEGE,
        objective: 'Tu manques les cours : retourner au collège',
        thought: pick(['Je devrais être en classe, là… Si le collège appelle mes parents, ça va chauffer.', 'Sécher, ça se paie toujours. Je retourne en cours ?'], w, 2),
      });
    }
  }

  // ---------- Besoins ----------
  if (n.faim > 90) {
    out.push({ id: 'faim_urgente', icon: '🍽️', priority: 5, target: HOME, objective: 'Manger tout de suite (tu te sens mal)', thought: 'J’ai la tête qui tourne… Il faut que je mange maintenant, pas dans une heure.' });
  } else if (n.faim > 70) {
    out.push({ id: 'faim', icon: '🍽️', priority: 4, target: HOME, objective: 'Manger quelque chose (le ventre vide, on apprend et on vend moins bien)', thought: pick(['J’ai faim… Je mange un truc avant de faire n’importe quoi.', 'Mon ventre gargouille. Un goûter, vite.', 'Impossible de réfléchir le ventre vide.'], w, 3) });
  }
  if (n.fatigue > 90 || (n.fatigue > 75 && min >= 21 * 60)) {
    out.push({ id: 'sommeil', icon: '😴', priority: 4, target: HOME, objective: 'Rentrer dormir', thought: pick(['Je tombe de sommeil. Il est temps de rentrer.', 'Mes yeux se ferment tout seuls… Au lit.'], w, 4) });
  }
  if (n.stress > 70) {
    out.push({ id: 'stress', icon: '😣', priority: 3, target: PARK, objective: 'Souffler un peu (parc, amis, loisirs)', thought: pick(['Trop de pression. Un tour au parc me ferait du bien.', 'J’ai besoin de respirer deux minutes.'], w, 5) });
  }
  if (n.moral < 25) {
    out.push({ id: 'moral', icon: '🙂', priority: 3, objective: 'Retrouver le moral (voir des amis, une petite réussite)', thought: pick(['J’ai le moral à zéro… Voir quelqu’un que j’aime bien, ça m’aiderait.', 'Une petite victoire, même minuscule. Juste une.'], w, 6) });
  }

  // ---------- Argent et livraisons ----------
  if (w.player.money < 1) {
    out.push({ id: 'argent', icon: '💸', priority: 3, objective: 'Plus d’argent : demander de l’aide à tes parents (Famille & collège) ou trouver un petit boulot', thought: 'Plus un centime… Je pourrais demander un coup de main à mes parents. Ou trouver un petit boulot.' });
  }
  const e = w.economy;
  if (e && e.carried.length > 0) {
    const b = e.businesses[e.carried[0]!.businessId];
    if (b) {
      const d = businessDoor(b);
      out.push({ id: 'livrer', icon: '📦', priority: 4, target: { ...d, name: b.name }, objective: `Déposer la marchandise à ${b.name}`, thought: `J’ai les cartons sur les bras. Direction ${b.name}, avant que ça me tombe des mains.` });
    }
  } else if (e) {
    const o = e.orders.find((oo) => oo.status === 'a_retirer');
    const p = o ? pickupPoint(o.wholesalerId) : null;
    if (p) out.push({ id: 'retirer', icon: '📦', priority: 3, target: { ...p, name: 'Retrait de commande' }, objective: 'Aller retirer ta commande chez le grossiste', thought: 'Ma commande m’attend chez le grossiste. Faudrait pas qu’elle traîne.' });
  }

  // ---------- Multijoueur ----------
  if ((ctx.pendingOffers ?? 0) > 0) {
    const who = ctx.others?.[0]?.name ?? 'L’autre joueur';
    out.push({ id: 'mp_offre', icon: '📨', priority: 4, objective: `Répondre à la proposition reçue (📡 Multijoueur)`, thought: `${who} m’a fait une proposition. Je devrais regarder ça (📡).` });
  }
  for (const o of ctx.others ?? []) {
    const d = dist(w, o);
    const target = { x: Math.round(o.x), y: Math.round(o.y), name: o.name };
    if (d < 40) {
      out.push({ id: `mp_proche:${o.name}`, icon: '🎮', priority: 2, target, objective: `${o.name} est tout près : parler, s’associer, échanger`, thought: pick([`${o.name} est juste à côté… On pourrait faire équipe sur un coup ?`, `Tiens, ${o.name}. Je vais voir ce qui se passe de son côté.`], w, 7) });
    } else {
      out.push({ id: `mp_loin:${o.name}`, icon: '🎮', priority: 1, target, objective: `Aller voir ${o.name}`, thought: pick([`Je me demande ce que fabrique ${o.name}… ${o.name} a peut-être trouvé un truc dont on a besoin.`, `Ça fait un moment que je n’ai pas vu ${o.name}. Je devrais aller voir.`], w, 8) });
    }
  }

  // ---------- Fil rouge : le chapitre ----------
  const c = getCampaignProgressSummary(w);
  if (!c.completed) {
    out.push({ id: `chapitre:${c.chapter}`, icon: '🎯', priority: 2, objective: `${c.title} — ${c.prompt}`, thought: pick([`Bon. Où j’en suis… ${c.prompt}.`, `${c.title}. Je ne lâche rien.`], w, 9) });
  }

  return out.sort((a, b) => b.priority - a.priority);
}

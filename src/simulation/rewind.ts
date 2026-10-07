/**
 * Retour en arrière par le sacrifice d'un fantôme (vision du 2026-10-07).
 *
 * - Détection : faillite d'une entreprise, catastrophe, ou chute de plus de 40 % de la valeur
 *   nette en une journée. La dernière est gardée tant qu'un retour est possible (2 jours).
 * - Retour : le monde d'un jour antérieur (instantané conservé par la présentation) est
 *   restauré ; on y recopie ce que le joueur a appris (carnet, crédit des penseurs, leçons)
 *   et le fantôme qui s'est sacrifié se tait 45 jours.
 * - Leçon : si le joueur reprend le même chemin, la voix sacrifiée le prévient.
 */
import type { Notification, WorldState } from '../core/types';
import { createRewindState, type CatastropheKind, type Lesson, type RewindState } from '../core/rewind_types';
import { dayIndexOf } from '../core/clock';
import { notify, pushEvent } from './events';

export const SACRIFICE_DAYS = 45;
/** Jours pendant lesquels un retour reste proposé après la catastrophe. */
export const REWIND_WINDOW = 2;
const DROP_RATIO = 0.4;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

export function ensureRewind(w: WorldState): RewindState {
  if (!w.rewind) w.rewind = createRewindState();
  return w.rewind;
}

/** Valeur nette : argent, caisses des commerces et des entreprises, moins les dettes. */
export function netWorth(w: WorldState): number {
  const shops = Object.values(w.economy?.businesses ?? {}).reduce((s, b) => s + b.cash, 0);
  const debts = (w.economy?.loans ?? []).reduce((s, l) => s + l.remaining, 0);
  let ventures = 0;
  for (const r of Object.values(w.ascension?.ventures ?? {})) {
    if (r.closed) continue;
    ventures += r.cash;
    for (const u of Object.values(r.universes)) ventures -= u?.loan ?? 0;
  }
  return Math.round((w.player.money + shops + ventures - debts) * 100) / 100;
}

export function markCatastrophe(w: WorldState, kind: CatastropheKind, text: string, ideaId?: string): void {
  ensureRewind(w).last = { day: dayIndexOf(w.time.tick), kind, text, ideaId };
}

/** Un retour en arrière est-il proposé maintenant ? */
export function rewindOffer(w: WorldState): RewindState['last'] | undefined {
  const r = w.rewind;
  if (!r?.last) return undefined;
  return dayIndexOf(w.time.tick) - r.last.day <= REWIND_WINDOW ? r.last : undefined;
}

export function isSilenced(w: WorldState, ghost: string): boolean {
  const day = dayIndexOf(w.time.tick);
  return (w.rewind?.sacrifices ?? []).some((s) => s.ghost === ghost && !s.returned && s.untilDay > day);
}

/** Fantômes prêts à se sacrifier : voix présentes, assez loyales, pas déjà tues. */
export function sacrificeCandidates(w: WorldState): string[] {
  const council = Object.values(w.council.ghosts)
    .filter((g) => (g.status === 'actif' || g.status === 'endormi') && g.loyalty >= 30)
    .sort((a, b) => b.loyalty - a.loyalty)
    .map((g) => g.id);
  // La première voix, celle de la nuit de la médiathèque, peut toujours se sacrifier.
  const first = w.ghostCompanion?.unlockedThinkers?.[0] ?? 'smith';
  return [...new Set([...council, first])].filter((g) => !isSilenced(w, g));
}

function lessonText(kind: CatastropheKind, text: string): string {
  if (kind === 'faillite') return `Ne jamais laisser une caisse dans le rouge sans réagir. (${text})`;
  if (kind === 'chute') return `Une seule décision peut emporter la moitié de ce qu’on a bâti. (${text})`;
  return `Le hasard frappe ceux qui n’ont pas de réserve. (${text})`;
}

/**
 * Restaure `snapshot` (un monde antérieur) en y recopiant ce que le joueur sait aujourd'hui.
 * `current` n'est pas modifié. Renvoie le monde à reprendre.
 */
export function applyRewind(snapshot: WorldState, current: WorldState, ghost: string): WorldState {
  const cur = ensureRewind(current);
  const cat = cur.last;
  const w = structuredClone(snapshot);
  const day = dayIndexOf(w.time.tick);
  const lesson: Lesson | undefined = cat ? { day, kind: cat.kind, text: lessonText(cat.kind, cat.text), ghost } : undefined;
  w.rewind = {
    count: cur.count + 1,
    lessons: [...cur.lessons, ...(lesson ? [lesson] : [])].slice(-20),
    sacrifices: [...cur.sacrifices, { ghost, day, untilDay: day + SACRIFICE_DAYS, returned: false }],
    last: undefined,
    worthYesterday: undefined,
  };
  // Le savoir ne se perd pas : carnet, crédit des penseurs, connexions déjà comprises.
  if (w.ascension && current.ascension) {
    w.ascension.concepts = { ...current.ascension.concepts, ...w.ascension.concepts };
    for (const [id] of Object.entries(w.ascension.concepts)) w.ascension.concepts[id] = Math.min(w.ascension.concepts[id]!, day);
    w.ascension.trust = structuredClone(current.ascension.trust);
  }
  const g = w.council.ghosts[ghost];
  if (g && (g.status === 'actif' || g.status === 'endormi')) {
    g.status = 'endormi';
    g.loyalty = 20;
    g.lastWords = 'Je te rends ces jours-là. Ne les gaspille pas.';
  }
  w.flags['retoursEnArriere'] = (w.flags['retoursEnArriere'] ?? 0) + 1;
  pushEvent(w, {
    type: 'conseil',
    title: 'Le temps s’est retourné',
    text: `${cat ? `${cat.text} ` : ''}Une voix s’est éteinte pour te ramener ici. Ce que tu as compris, toi, est resté.${lesson ? ` Leçon : ${lesson.text}` : ''}`,
    causes: [
      { facteur: 'sacrifice d’un fantôme', seuil: `${SACRIFICE_DAYS} jours de silence`, poids: 3 },
      { facteur: 'retours en arrière', seuil: `${w.rewind.count}`, poids: 1 },
    ],
  });
  return w;
}

/** Clôture du jour : chute brutale de la valeur nette, retour des voix sacrifiées. */
export function rewindDay(w: WorldState): Notification[] {
  const r = ensureRewind(w);
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);
  const worth = netWorth(w);
  const before = r.worthYesterday;
  if (before !== undefined && before >= 100 && worth < before * (1 - DROP_RATIO)) {
    const pct = Math.round((1 - worth / before) * 100);
    markCatastrophe(w, 'chute', `Ta valeur nette est passée de ${Math.round(before).toLocaleString('fr-FR')} € à ${Math.round(worth).toLocaleString('fr-FR')} € (−${pct} %) en une journée.`);
  }
  r.worthYesterday = worth;
  for (const s of r.sacrifices) {
    if (s.returned || s.untilDay > day) continue;
    s.returned = true;
    const g = w.council.ghosts[s.ghost];
    if (g && g.status === 'endormi') g.loyalty = clamp(g.loyalty + 40, 0, 100);
    out.push(notify('fantome', 'Une voix que tu croyais perdue revient, plus faible mais là : « Tu as bien employé ces jours-là ? »', s.ghost));
  }
  return out;
}

/** Leçons qui s'appliquent maintenant : la voix sacrifiée prévient si l'erreur se répète. */
export function lessonWarnings(w: WorldState): { ghost: string; text: string }[] {
  const r = w.rewind;
  if (!r || r.lessons.length === 0) return [];
  const out: { ghost: string; text: string }[] = [];
  const runs = Object.values(w.ascension?.ventures ?? {}).filter((v) => !v.closed);
  const redRun = runs.find((v) => v.redDays >= 3);
  for (const l of r.lessons) {
    if (l.kind === 'faillite' && redRun) out.push({ ghost: l.ghost, text: `Souviens-toi de ce que je t’ai rendu : une caisse dans le rouge depuis ${redRun.redDays} jours. ${l.text}` });
    if (l.kind === 'chute' && w.player.money < 0.2 * Math.max(1, r.worthYesterday ?? 0)) out.push({ ghost: l.ghost, text: `Tu redescends vers le vide, comme la dernière fois. ${l.text}` });
  }
  return out;
}

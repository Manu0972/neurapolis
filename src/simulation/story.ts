/**
 * Le récit (vision du 2026-10-07) : la scène d'origine, puis les cahiers de Lucien qui se
 * découvrent quand le joueur avance (palier, notions apprises, jours, faits). Un cahier par
 * jour au plus, pour laisser le temps de lire. Textes adaptés au prénom et au genre du joueur.
 */
import type { Notification, WorldState } from '../core/types';
import { createStoryState, type StoryBeat, type StoryState } from '../core/story_types';
import { dayIndexOf } from '../core/clock';
import { BEATS } from '../data/story_registry';
import { notify } from './events';

export function ensureStory(w: WorldState): StoryState {
  if (!w.story) w.story = createStoryState();
  return w.story;
}

/** Prénom et accords : les textes du récit restent justes quel que soit le personnage. */
export function personalize(w: WorldState, text: string): string {
  const name = w.player.firstName || w.player.name || 'toi';
  let t = text.replace(/\{prenom\}/g, name);
  if (w.player.gender !== 'garcon') {
    const fille = w.player.gender === 'fille';
    t = t
      .replace(/\ble jeune garçon\b/g, name)
      .replace(/\bLe jeune garçon\b/g, name)
      .replace(/\b([Mm])on garçon\b/g, '$1on enfant')
      .replace(/\bpetit-fils\b/g, fille ? 'petite-fille' : 'petit enfant')
      .replace(/\bmon grand\b/g, fille ? 'ma grande' : 'mon enfant')
      .replace(/\bfiston\b/g, fille ? 'ma grande' : 'mon enfant');
  }
  return t;
}

function ready(w: WorldState, b: StoryBeat): boolean {
  const t = b.trigger;
  if (t.tier !== undefined && (w.ascension?.tier ?? 1) < t.tier) return false;
  if (t.concepts !== undefined && Object.keys(w.ascension?.concepts ?? {}).length < t.concepts) return false;
  if (t.day !== undefined && dayIndexOf(w.time.tick) < t.day) return false;
  if (t.flag !== undefined && !(w.flags[t.flag] ?? 0)) return false;
  return true;
}

/** Clôture du jour : au plus un nouveau cahier. */
export function storyDay(w: WorldState): Notification[] {
  const s = ensureStory(w);
  const day = dayIndexOf(w.time.tick);
  const next = BEATS.find((b) => s.seen[b.id] === undefined && ready(w, b));
  if (!next) return [];
  s.seen[next.id] = day;
  s.unread.push(next.id);
  return [notify('journal', `📖 Un nouveau cahier de Lucien : « ${personalize(w, next.title)} »`, next.ghost)];
}

export function markRead(w: WorldState, id: string): void {
  const s = ensureStory(w);
  s.unread = s.unread.filter((x) => x !== id);
}

export function finishOrigin(w: WorldState): void {
  ensureStory(w).originDone = true;
}

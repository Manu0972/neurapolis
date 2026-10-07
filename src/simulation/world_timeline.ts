/**
 * L'histoire du monde avance avec le joueur (docs/VISION.md §3.6) : chaque événement de la
 * chronologie 2020 → 2045 (src/data/lore/world_timeline.ts, Antigravity) se déclenche à sa date,
 * s'inscrit au journal avec son contexte local, et module pendant 60 jours la demande des
 * catégories concernées dans les commerces. La fermeture du laminoir Taret (2032) pèse en plus
 * sur la confiance du quartier.
 *
 * État : `w.seen['timeline:<id>']` (déclenché) et deux compteurs par catégorie dans `w.flags`
 * (`demande:<cat>` en centièmes, `demandeFin:<cat>` jour de fin) — pas de champ de sauvegarde ajouté.
 */
import type { Notification, WorldState } from '../core/types';
import type { ProductCategory } from '../core/economy_types';
import { dateOf, dayIndexOf } from '../core/clock';
import { WORLD_TIMELINE } from '../data/lore/world_timeline';
import { notify, pushEvent } from './events';

export const TIMELINE_EFFECT_DAYS = 60;

/** Appelé une fois par jour : déclenche les événements dont la date est atteinte. */
export function worldTimelineDay(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);
  const date = dateOf(day);
  for (const ev of WORLD_TIMELINE) {
    const key = `timeline:${ev.id}`;
    if (w.seen[key]) continue;
    if (date.y < ev.year || (date.y === ev.year && date.m < ev.month)) continue;
    w.seen[key] = true;
    const impacts = Object.entries(ev.macroEffectSuggestion.demandImpact ?? {}) as [ProductCategory, number][];
    for (const [cat, mult] of impacts) {
      w.flags[`demande:${cat}`] = Math.round(mult * 100);
      w.flags[`demandeFin:${cat}`] = day + TIMELINE_EFFECT_DAYS;
    }
    pushEvent(w, {
      type: 'quartier',
      title: ev.title,
      text: `${ev.summary} ${ev.localContextValFerrand}`,
      causes: impacts.length > 0
        ? impacts.map(([cat, mult]) => ({ facteur: `demande « ${cat} »`, seuil: `×${mult.toFixed(2)} pendant ${TIMELINE_EFFECT_DAYS} jours`, poids: (Math.abs(mult - 1) >= 0.2 ? 3 : 2) as 1 | 2 | 3 }))
        : [{ facteur: 'contexte national', poids: 1 }],
    });
    if (ev.id.startsWith('fermeture_laminoir')) {
      w.district.confianceQuartier = Math.max(0, w.district.confianceQuartier - 8);
      w.district.vitaliteEpicerie = Math.max(0, w.district.vitaliteEpicerie - 5);
      w.flags['laminoirFerme'] = 1;
    }
    out.push(notify('journal', `📰 ${ev.title}`));
  }
  return out;
}

/** Multiplicateur de demande en cours pour une catégorie (1 = normal). */
export function timelineDemand(w: WorldState, cat: ProductCategory): number {
  const end = w.flags[`demandeFin:${cat}`] ?? 0;
  if (end <= dayIndexOf(w.time.tick)) return 1;
  return (w.flags[`demande:${cat}`] ?? 100) / 100;
}

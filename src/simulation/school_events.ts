/**
 * Vie au collège : à la sortie d'un cours suivi, un événement peut arriver (environ une
 * séance sur trois), chacun une seule fois. Deux ou trois choix, chacun conseillé par un
 * fantôme, qui changent les amitiés, la moyenne, le stress, la réputation ou la fierté des
 * parents. État : drapeaux `ecole:<id>` (vu) et `ecoleEnAttente` (index + 1) — pas de schéma.
 */
import type { WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { STARTER_SCHOOL_EVENTS, type SchoolEvent } from '../data/school_events_starter';
import { SCHOOL_EVENTS as AG_SCHOOL_EVENTS } from '../data/school/events';
import { econRand } from './economy';
import { ensureSchoolLifeState } from './school_life';
import { pushEvent } from './events';

/** Événements de départ, puis les 25 d'Antigravity (workflow AG-2). */
export const SCHOOL_EVENTS: readonly SchoolEvent[] = [...STARTER_SCHOOL_EVENTS, ...AG_SCHOOL_EVENTS.filter((e) => !STARTER_SCHOOL_EVENTS.some((x) => x.id === e.id))];
const CHANCE = 0.35;

const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));

function eligible(w: WorldState, e: SchoolEvent): boolean {
  if ((w.flags[`ecole:${e.id}`] ?? 0) > 0) return false;
  if (e.minAge !== undefined && w.player.age < e.minAge) return false;
  if (e.tier !== undefined && (w.ascension?.tier ?? 1) < e.tier) return false;
  return true;
}

/** À la fin d'une séance suivie : tirage d'un événement de collège. */
export function rollSchoolEvent(w: WorldState, salt: string): void {
  if ((w.flags['ecoleEnAttente'] ?? 0) > 0) return;
  const day = dayIndexOf(w.time.tick);
  if (econRand(w, 'ecole', day, salt) >= CHANCE) return;
  const pool = SCHOOL_EVENTS.filter((e) => eligible(w, e));
  if (pool.length === 0) return;
  const e = pool[Math.floor(econRand(w, 'ecole-pick', day, salt) * pool.length)]!;
  w.flags['ecoleEnAttente'] = SCHOOL_EVENTS.indexOf(e) + 1;
}

export function pendingSchoolEvent(w: WorldState): SchoolEvent | undefined {
  const i = (w.flags['ecoleEnAttente'] ?? 0) - 1;
  return i >= 0 ? SCHOOL_EVENTS[i] : undefined;
}

export function resolveSchoolEvent(w: WorldState, index: number): { ok: boolean; message: string; ghost?: string } {
  const e = pendingSchoolEvent(w);
  const o = e?.options[index];
  if (!e || !o) return { ok: false, message: 'Rien en cours au collège.' };
  const fx = o.effects;
  for (const [npc, d] of Object.entries(fx.relations ?? {})) {
    const r = (w.player.relations[npc] ??= { amitie: 0, confiance: 0, respect: 0, rivalite: 0 });
    r.amitie = clamp(r.amitie + d, -100, 100);
    r.confiance = clamp(r.confiance + Math.round(d / 2), -100, 100);
  }
  if (fx.average) {
    const sl = ensureSchoolLifeState(w);
    sl.academicAverage = Math.round(clamp(sl.academicAverage + fx.average, 0, 20) * 10) / 10;
  }
  if (fx.stress) w.player.needs.stress = clamp(w.player.needs.stress + fx.stress);
  if (fx.moral) w.player.needs.moral = clamp(w.player.needs.moral + fx.moral);
  if (fx.reputation) w.player.reputation = clamp(w.player.reputation + fx.reputation);
  const p = w.family?.parents;
  if (fx.pride && p) {
    p.nora.pride = clamp(p.nora.pride + fx.pride);
    p.thierry.pride = clamp(p.thierry.pride + fx.pride);
  }
  w.flags[`ecole:${e.id}`] = dayIndexOf(w.time.tick) + 1;
  w.flags['ecoleEnAttente'] = 0;
  pushEvent(w, {
    type: 'vie',
    title: `Collège — ${e.title}`,
    text: `${o.label}. ${o.outcome}`,
    causes: [{ facteur: `conseil suivi : ${o.ghost}`, seuil: o.advice, poids: 2 }],
  });
  return { ok: true, message: o.outcome, ghost: o.ghost };
}

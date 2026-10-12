/**
 * Prise en main : « et maintenant, je fais quoi ? ». Une seule étape à la fois, courte et
 * concrète (où aller, quelle touche), lue dans l'état réel du monde. Lecture seule.
 * L'histoire (chapitres) garde sa carte ; ce guide pousse vers l'action la plus utile tout de suite.
 */
import type { WorldState } from '../core/types';
import type { TierId } from '../core/ascension_types';
import { dayIndexOf } from '../core/clock';
import { IDEAS, IDEA_BY_ID, TIERS } from '../data/ascension/ideas';
import { ensureAscension, ideaStatus, rescueAmount, tierChecks } from './ascension';
import { classWindow, isInClass } from './family';
import { placeAtAdjacent } from './interact';

/** Ce que fait un clic sur l'étape : ouvrir une application du téléphone, ou le plan de la ville. */
export type GuideAction = 'ascension' | 'banque' | 'carte';

export interface GuideStep {
  id: string;
  icon: string;
  text: string;
  /** Le « comment », en une phrase (affiché en petit sous l'étape). */
  detail?: string;
  action?: GuideAction;
}

const eur = (v: number): string => `${Math.round(v).toLocaleString('fr-FR')} €`;

/** L'étape la plus utile maintenant (null : rien à suggérer, le joueur dort ou est en cours). */
export function nextStep(w: WorldState): GuideStep | null {
  if (w.player.asleep || isInClass(w)) return null;
  const a = ensureAscension(w);
  const runs = Object.values(a.ventures).filter((r) => !r.closed);

  if (a.pending) {
    const idea = IDEA_BY_ID[a.pending.ideaId];
    return { id: 'decision', icon: '⚖️', text: `Décision en attente pour « ${idea?.name ?? 'ton idée'} » : choisis une voix.`, action: 'ascension' };
  }

  const red = runs.filter((r) => r.cash < 0).sort((x, y) => x.cash - y.cash)[0];
  if (red) {
    const name = IDEA_BY_ID[red.ideaId]?.name ?? red.ideaId;
    return { id: 'rouge', icon: '🔥', text: `« ${name} » est dans le rouge : renfloue-la (${eur(rescueAmount(red))}).`, action: 'ascension' };
  }

  const session = classWindow(w);
  if (session && placeAtAdjacent(w) !== 'college') {
    return { id: 'cours', icon: '📚', text: `Cours ${session === 'matin' ? 'à 8 h 30' : 'à 13 h 30'} : va au collège Jean-Moulin (E devant l’entrée).`, action: 'carte' };
  }

  const available = IDEAS.filter((i) => i.tier <= a.tier && (!a.ventures[i.id] || a.ventures[i.id]!.closed))
    .map((i) => ({ i, st: ideaStatus(w, i.id) }));
  const affordable = available.filter((x) => x.st.available).sort((x, y) => x.st.cost - y.st.cost)[0];
  const cheapest = available.filter((x) => x.st.reasons.every((r) => r.startsWith('Il faut au moins'))).sort((x, y) => x.st.cost - y.st.cost)[0];

  if (Object.keys(a.ventures).length === 0) {
    if (affordable) return { id: 'premiere', icon: '🚀', text: 'Lance ta première affaire : Téléphone (P) → Ascension → une idée de la Cour.', action: 'ascension' };
    if (cheapest) return { id: 'argent', icon: '💶', text: `Il te faut ${eur(cheapest.st.cost)} : aide Mme Bertin à l’épicerie (16 h – 19 h).`, action: 'carte' };
  }

  // Des gains dorment dans une caisse alors qu'une idée attend faute d'argent.
  const rich = runs.filter((r) => r.cash >= 10).sort((x, y) => y.cash - x.cash)[0];
  if (rich && !affordable && cheapest && w.player.money + rich.cash >= cheapest.st.cost) {
    return { id: 'retirer', icon: '💰', text: `Retire la caisse de « ${IDEA_BY_ID[rich.ideaId]?.name ?? ''} » (+${eur(rich.cash)}) pour lancer la suite.`, action: 'ascension' };
  }

  if (affordable) {
    return { id: 'lancer', icon: '💡', text: `Tu peux lancer « ${affordable.i.name} » (${eur(affordable.st.cost)}).`, action: 'ascension' };
  }

  const shifts = w.flags['jobShiftsDone'] ?? 0;
  if (shifts < 3 && a.contacts['bertin'] === undefined) {
    return { id: 'boulot', icon: '🧺', text: `Après les cours, aide Mme Bertin (16 h – 19 h) : de l’argent et sa confiance (${shifts}/3).`, action: 'carte' };
  }

  if (a.tier < 3) {
    const next = (a.tier + 1) as Exclude<TierId, 1>;
    const missing = tierChecks(w, next).find((c) => !c.ok);
    if (missing) {
      const name = TIERS[next - 1]!.name;
      // Un verdict à venir apprendra un concept : on dit quand.
      if (/concept/.test(missing.label)) {
        const soon = runs.filter((r) => !r.verdictDone).map((r) => r.verdictDay - dayIndexOf(w.time.tick)).sort((x, y) => x - y)[0];
        if (soon !== undefined) return { id: 'palier', icon: '🎯', text: `${name} : il te manque un concept. Prochain verdict dans ${Math.max(0, soon)} j.`, action: 'ascension' };
      }
      return { id: 'palier', icon: '🎯', text: `${name} : ${missing.label}.`, detail: missing.hint, action: 'ascension' };
    }
  }
  return null;
}

/**
 * Apprentissage des notions en 4 étapes (contrat M3 §3) :
 * 1 découverte (événement vécu) → 2 explication (cours / livre / fantôme, au choix) →
 * 3 application (3 réussies) → 4 maîtrise (+ caractéristique associée).
 * Chaque étape émet un événement porteur de causes et une entrée du journal de vie.
 */
import type { WorldState } from '../core/types';
import { NOTIONS, NOTION_BY_ID, type ExplanationSource } from '../data/notions';
import { CHARACTERISTICS_LABELS } from '../data/texts';
import { pushEvent, pushJournal } from './events';

export interface NotionResult {
  ok: boolean;
  message: string;
}

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export function discoverNotion(w: WorldState, id: string): NotionResult {
  const def = NOTION_BY_ID[id];
  if (!def) return { ok: false, message: 'Notion inconnue.' };
  if (w.player.notions[id]) return { ok: false, message: 'Déjà découverte.' };
  w.player.notions[id] = { id, stage: 1, applications: 0 };
  pushEvent(w, {
    type: 'decouverte',
    title: `Découverte — ${def.name}`,
    text: def.discover.text,
    causes: def.discover.causes,
  });
  pushJournal(w, `J’ai découvert : ${def.name}`, def.discover.text);
  return { ok: true, message: def.name };
}

/** Choix de la source d'explication (étape 1 → 2). */
export function explainNotion(w: WorldState, id: string, source: ExplanationSource): NotionResult {
  const def = NOTION_BY_ID[id];
  const n = w.player.notions[id];
  if (!def) return { ok: false, message: 'Notion inconnue.' };
  if (!n) return { ok: false, message: 'Pas encore découverte.' };
  if (n.stage !== 1) return { ok: false, message: 'Explication déjà reçue.' };
  const expl = def.explanations[source];
  n.stage = 2;
  pushEvent(w, {
    type: 'decouverte',
    title: `Explication — ${def.name}`,
    text: expl.text,
    causes: [{ facteur: `explication reçue — ${expl.label.toLowerCase()}`, poids: 1 }],
  });
  pushJournal(w, `J’ai compris : ${def.name}`, expl.text);
  return { ok: true, message: `${def.name} expliquée (${expl.label.toLowerCase()}).` };
}

/**
 * Application d'une notion. Trois applications réussies ⇒ maîtrise :
 * la caractéristique associée augmente (seule voie de progression, contrat M3).
 */
export function applyNotion(w: WorldState, id: string, success = true): NotionResult {
  const def = NOTION_BY_ID[id];
  const n = w.player.notions[id];
  if (!def) return { ok: false, message: 'Notion inconnue.' };
  if (!n) return { ok: false, message: 'Notion pas encore découverte.' };
  if (n.stage < 2) return { ok: false, message: 'Il faut d’abord l’expliquer (cours, livre ou fantôme).' };
  if (n.stage === 4) return { ok: false, message: 'Déjà maîtrisée.' };
  if (!success) return { ok: false, message: 'Application ratée — réessaie.' };
  n.applications += 1;
  if (n.stage === 2) n.stage = 3;
  if (n.applications >= 3) {
    n.stage = 4;
    const label = CHARACTERISTICS_LABELS[def.characteristic];
    w.player.characteristics[def.characteristic] =
      clamp(w.player.characteristics[def.characteristic] + def.gain);
    pushEvent(w, {
      type: 'consequence',
      title: `Maîtrise — ${def.name}`,
      text: `Trois applications réussies : « ${def.name} » fait partie de ta façon de penser. ${label} +${def.gain}.`,
      causes: [
        { facteur: 'applications réussies', seuil: '3', poids: 3 },
        { facteur: `${def.name} expliquée puis appliquée`, poids: 2 },
      ],
    });
    pushJournal(
      w,
      `Je maîtrise : ${def.name}`,
      `Trois applications réussies. La notion est à toi — ${label} +${def.gain}.`,
    );
    return { ok: true, message: `Maîtrisée ! ${label} +${def.gain}.` };
  }
  return { ok: true, message: `Application ${n.applications}/3.` };
}

/**
 * Découvertes par compteurs vécus (flags) — appelé chaque tick par le moteur.
 * Une notion découverte ne l'est qu'une fois (sa présence est le marqueur).
 */
export function notionTick(w: WorldState): void {
  for (const def of NOTIONS) {
    if (w.player.notions[def.id]) continue;
    const { flag, min } = def.discover.when;
    if ((w.flags[flag] ?? 0) >= min) discoverNotion(w, def.id);
  }
}

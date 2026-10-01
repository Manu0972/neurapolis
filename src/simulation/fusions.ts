/**
 * Fusions & affinités (contrat M6 §3).
 * Affinités par paire : +1 quand deux voix actives approuvent la même décision
 * clé (au moins une alignée sur la doctrine, aucune contraire). Fusion
 * Smith+Ostrom : ≥3 décisions « marche » ET ≥3 « communs » prises avec les deux
 * voix actives, et affinité ≥6 → scène → composite « Le Marché des Communs »
 * (déblocage : coopérative pérenne — ventes du week-end sans présence).
 * Données : registry.ts (FUSIONS), composites.ts (fiche + scène), scenes.ts.
 */
import type { DoctrineKey, Notification, WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { FUSIONS } from '../data/ghosts/registry';
import { COMPOSITE_DEFS_BY_ID } from '../data/ghosts/composites';
import { GHOST_DOCTRINES, OPPOSITE_DOCTRINE } from '../data/ghosts/scenes';
import { notify, pushEvent, pushJournal } from './events';

/** Clé de paire stable, triée : l'ordre des voix n'importe pas. */
export const pairKey = (a: string, b: string): string => (a < b ? `${a}+${b}` : `${b}+${a}`);

export const affinityOf = (w: WorldState, a: string, b: string): number =>
  w.council.affinities[pairKey(a, b)] ?? 0;

const activeGhostIds = (w: WorldState): string[] =>
  Object.entries(w.council.ghosts)
    .filter(([, st]) => st.status === 'actif')
    .map(([id]) => id);

const isContrary = (id: string, key: DoctrineKey): boolean =>
  GHOST_DOCTRINES[id] === OPPOSITE_DOCTRINE[key];

/**
 * Une décision clé vient d'être prise (councilKeyDecision) :
 *  - +1 d'affinité pour chaque paire de voix actives qui l'approuvent
 *    (au moins une alignée, aucune contraire) ;
 *  - progression des fusions dont les deux voix sont actives et l'approuvent
 *    (compteur « marche » ou « communs » selon la doctrine).
 */
export function recordPairApproval(w: WorldState, key: DoctrineKey, aligned: string[]): void {
  const actifs = activeGhostIds(w);
  const alignedSet = new Set(aligned);
  for (let i = 0; i < actifs.length; i++) {
    for (let j = i + 1; j < actifs.length; j++) {
      const a = actifs[i] ?? '';
      const b = actifs[j] ?? '';
      if (!alignedSet.has(a) && !alignedSet.has(b)) continue;
      if (isContrary(a, key) || isContrary(b, key)) continue;
      const k = pairKey(a, b);
      w.council.affinities[k] = (w.council.affinities[k] ?? 0) + 1;
    }
  }
  for (const f of FUSIONS) {
    if (w.council.fusionsDone.includes(f.id)) continue;
    const [a, b] = f.from;
    if (!alignedSet.has(a) && !alignedSet.has(b)) continue; // la décision n'engage aucune des deux voix
    const sta = w.council.ghosts[a];
    const stb = w.council.ghosts[b];
    if (!sta || !stb || sta.status !== 'actif' || stb.status !== 'actif') continue;
    if (isContrary(a, key) || isContrary(b, key)) continue;
    const prog = w.council.fusionProgress[f.id] ?? { marches: 0, communs: 0 };
    if (key === 'marche') prog.marches += 1;
    else if (key === 'communs') prog.communs += 1;
    w.council.fusionProgress[f.id] = prog;
  }
}

/** Boucle de simulation (councilTick) : conditions exactes réunies → fusion prête. */
export function fusionTick(w: WorldState, out: Notification[]): void {
  if (w.council.pendingFusion) return;
  for (const f of FUSIONS) {
    if (w.council.fusionsDone.includes(f.id)) continue;
    const [a, b] = f.from;
    if (w.council.ghosts[a]?.status === 'fusionne' || w.council.ghosts[b]?.status === 'fusionne') continue;
    const prog = w.council.fusionProgress[f.id] ?? { marches: 0, communs: 0 };
    if (prog.marches < f.conditions.marches || prog.communs < f.conditions.communs) continue;
    if (affinityOf(w, a, b) < f.affinite) continue;
    w.council.pendingFusion = f.id;
    pushEvent(w, {
      type: 'fusion',
      title: `Fusion prête — ${f.name}`,
      text: 'Smith et Ostrom parlent à l’unisson. Deux voix veulent n’en faire qu’une.',
      causes: [
        { facteur: 'décisions « marché » prises avec les deux voix', seuil: String(f.conditions.marches), poids: 2 },
        { facteur: 'décisions « communs » prises avec les deux voix', seuil: String(f.conditions.communs), poids: 2 },
        { facteur: 'affinité Smith + Ostrom', seuil: String(f.affinite), poids: 3 },
      ],
    });
    out.push(notify('fantome', `${f.name} veut naître : la scène de fusion t’attend.`));
    return;
  }
}

/** Réaction d'une voix témoin de la fusion (contrat M6 : Marx jaloux, Weber curieux). */
function react(w: WorldState, id: string, sentiment: 'jaloux' | 'curieux'): void {
  const st = w.council.ghosts[id];
  if (!st || st.status === 'inconnu' || st.status === 'mort' || st.status === 'fusionne') return;
  pushEvent(w, {
    type: 'fusion',
    title: sentiment === 'jaloux' ? 'Marx observe la fusion' : 'Weber observe la fusion',
    text: sentiment === 'jaloux'
      ? 'Marx regarde la scène, jaloux : « Alors ce sont eux qui font l’histoire, camarade ? L’histoire, c’est le travail — pas les mariages d’idées. »'
      : 'Weber suit tout, curieux : « Une institution née de deux routines qui s’accordent… Collègue, documente tout. Surtout ce qui coince. »',
    causes: [{ facteur: 'fusion de Smith et Ostrom', poids: 2 }],
  });
}

/** Le joueur laisse la fusion se faire : composite actif, les deux voix passent « fusionne ». */
export function fusionConfirm(w: WorldState): { ok: boolean; message: string } {
  const id = w.council.pendingFusion;
  const f = FUSIONS.find((x) => x.id === id);
  const composite = id ? COMPOSITE_DEFS_BY_ID[id] : undefined;
  if (!id || !f || !composite) return { ok: false, message: 'Aucune fusion en attente.' };
  const day = dayIndexOf(w.time.tick);
  // Le plafond des 4 voix actives reste respecté : les deux voix d'origine libèrent leurs sièges.
  w.council.ghosts[id] = {
    id,
    status: activeGhostIds(w).length < 4 ? 'actif' : 'endormi',
    loyalty: 50,
    fiabilite: 60,
    lastWords: '',
    history: [],
    loyaltyZeroDays: 0,
    nextAdviceDay: day + 1,
  };
  for (const gid of f.from) {
    const st = w.council.ghosts[gid];
    if (st) {
      st.status = 'fusionne';
      st.arrivalPending = false;
    }
  }
  w.council.fusionsDone.push(id);
  w.council.pendingFusion = undefined;
  pushEvent(w, {
    type: 'fusion',
    title: `Fusion — ${f.name}`,
    text: `Smith et Ostrom ne font plus qu’une voix. ${f.debloque}`,
    causes: [
      { facteur: 'décisions « marché » avec les deux voix', seuil: String(f.conditions.marches), poids: 2 },
      { facteur: 'décisions « communs » avec les deux voix', seuil: String(f.conditions.communs), poids: 2 },
      { facteur: 'affinité Smith + Ostrom', seuil: String(f.affinite), poids: 3 },
      { facteur: 'choix : laisser les voix fusionner', poids: 2 },
    ],
  });
  pushJournal(w, `${f.name} naît`, `Smith et Ostrom se sont fondus en une seule voix. ${f.debloque}`);
  react(w, 'marx', 'jaloux');
  react(w, 'weber', 'curieux');
  return { ok: true, message: `${f.name} est né : Smith et Ostrom parlent désormais d’une seule voix.` };
}

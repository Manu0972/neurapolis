/**
 * Antagonistes (contrat M6 §3) : Taylor hostile (<20 de loyauté) sabote le
 * rendement du stand (−15 %) et chronomètre l'équipe (stress des PNJ +) ;
 * chaque refus du joueur envers Taylor (conseil ignoré, voix repoussée)
 * nourrit la jauge allianceDesOmbres (teaser super-antagoniste).
 * Données : TAYLOR_SABOTAGE (src/data/project.ts).
 */
import type { WorldState } from '../core/types';
import { TAYLOR_SABOTAGE } from '../data/project';
import { pushEvent } from './events';

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

/** Facteur de rendement des ventes : −15 % quand Taylor est hostile. */
export const taylorSabotageFactor = (w: WorldState): number =>
  w.council.ghosts['taylor']?.status === 'hostile' ? TAYLOR_SABOTAGE.yieldFactor : 1;

/** Journée sous chronométrage : le stress des coéquipiers monte (+2/jour). */
export function taylorChronoDay(w: WorldState): void {
  const st = w.council.ghosts['taylor'];
  if (st?.status !== 'hostile') return;
  const p = w.project;
  if (!p?.active) return;
  pushEvent(w, {
    type: 'antagonisme',
    title: 'Taylor chronomètre l’équipe',
    text: `Taylor note chaque geste, chaque pause, chaque seconde. Le stress des coéquipiers monte (+${TAYLOR_SABOTAGE.chronoStressPerDay}/jour).`,
    causes: [{ facteur: 'loyauté de Taylor', seuil: '20', poids: 3 }],
    once: 'taylor_chrono_notice',
  });
  for (const m of p.members) {
    const npc = w.npcs[m];
    if (npc) npc.stress = clamp(npc.stress + TAYLOR_SABOTAGE.chronoStressPerDay);
  }
}

/** Un refus du joueur envers Taylor : la jauge des ombres monte. */
export function recordTaylorRefusal(w: WorldState): void {
  w.council.allianceDesOmbres += 1;
  if (w.council.allianceDesOmbres >= 3) {
    pushEvent(w, {
      type: 'antagonisme',
      title: 'L’alliance des ombres s’épaissit',
      text: 'Taylor n’est pas seul : quelque part, d’autres voix prennent note de chaque refus. (Jauge allianceDesOmbres — la suite s’écrira.)',
      causes: [{ facteur: 'refus répétés de Taylor', seuil: '3', poids: 3 }],
      once: 'alliance_des_ombres',
    });
  }
}

/** Lecture pure : la jauge des ombres (UI). */
export const allianceDesOmbres = (w: WorldState): number => w.council.allianceDesOmbres;

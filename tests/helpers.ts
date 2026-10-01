/**
 * Outils partagés des tests de simulation — chemins de jeu RÉELS vers les
 * déclencheurs d'apparition (revue de cohérence M6 : plus d'état forgé) et
 * montages récurrents (stand prêt, arrivées, maîtrises).
 */
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { councilArrivalChoose, councilPendingArrivals } from '../src/simulation/council';
import {
  adoptSharedRules, buyStock, createProject, imposeRule, makeEcoChoice, optimizeStand,
  projectDay, projectWeek, recruitMember, repartition, runCourse, runSalesSession,
  sellCustomerData, setPrice,
} from '../src/simulation/project';
import { applyPlaceAction } from '../src/simulation/places';
import { performGatedAction } from '../src/simulation/actions';
import { applyNotion, discoverNotion, explainNotion } from '../src/simulation/notions';

export const DAY = TICKS_PER_DAY;

/** Stand des Roses prêt : projet créé, Noah et Lina recrutés. */
export function standPret(w: WorldState): void {
  w.player.skills.communication.level = 2;
  createProject(w);
  recruitMember(w, 'noah');
  recruitMember(w, 'lina');
}

/** Choix d'arrivée « l'écouter » — la voix devient active. */
export function ecouter(w: WorldState, id: string): void {
  const r = councilArrivalChoose(w, id, 'ecouter');
  if (!r.ok) throw new Error(`arrivée ${id} refusée : ${r.message}`);
}

/** Maîtrise complète d'une notion par le cycle réel : découverte → cours → 3 applications. */
export function maitriser(w: WorldState, id: string): void {
  discoverNotion(w, id);
  explainNotion(w, id, 'cours');
  applyNotion(w, id);
  applyNotion(w, id);
  applyNotion(w, id);
}

/**
 * Le déclencheur doit s'armer par le JEU RÉEL : on balaye des seeds
 * déterministes (PRNG) jusqu'à ce que le chemin produise l'arrivée.
 */
export function tryPathTrigger(id: string, path: (w: WorldState) => void): void {
  for (let seed = 0; seed < 400; seed++) {
    const w = createWorld({ seed });
    try {
      path(w);
    } catch {
      continue;
    }
    runTicks(w, 1);
    if (councilPendingArrivals(w).includes(id)) return;
  }
  throw new Error(`aucun seed ne déclenche l’arrivée de ${id} par ce chemin (400 essais)`);
}

// ---------- Chemins de jeu réels vers chaque déclencheur ----------

/** Marx : premier conflit de répartition (mode incitation, résultat positif). */
export function conflitDeRepartition(w: WorldState): void {
  standPret(w);
  buyStock(w); // poche −15 €
  for (let i = 0; i < 8; i++) runCourse(w); // +16 € → résultat +1 €
  repartition(w, 'incitation'); // chance de conflit 0,35
  if (!w.flags['conflitsRepartition']) throw new Error('pas de conflit de répartition');
}

/** Hobbes & Locke : incident réel au stand (vol/bagarre, équipe ≥ 2). */
export function incidentAuStand(w: WorldState): void {
  standPret(w);
  for (let d = 0; d < 90 && !w.flags['incidents']; d++) {
    w.time.tick += DAY;
    projectDay(w);
  }
  if (!w.flags['incidents']) throw new Error('aucun incident en 90 jours');
}

/** Keynes : première semaine de perte (répartition à résultat négatif). */
export function semaineDePerte(w: WorldState): void {
  standPret(w);
  buyStock(w); // dépense 15 €, aucune recette
  repartition(w, 'egalite'); // résultat −15 → semainesPerte
  if (!w.flags['semainesPerte']) throw new Error('semaine pas en perte');
}

/** Rousseau : dilemme de justice tranché (répartition réussie). */
export function repartitionSimple(w: WorldState): void {
  standPret(w);
  buyStock(w);
  for (let i = 0; i < 8; i++) runCourse(w);
  repartition(w, 'egalite');
  if (!w.flags['dilemmesJustice']) throw new Error('répartition sans dilemme de justice');
}

/** Bourdieu : tout le stock part en session (distinction remarquée). */
export function venduJusquAuBout(w: WorldState): void {
  standPret(w);
  buyStock(w);
  w.district.meteo = 'soleil';
  runSalesSession(w, 'place'); // 7
  runSalesSession(w, 'place'); // 7 → stock 6
  runSalesSession(w, 'place'); // 6 → stock 0
  if (!w.flags['distinctions']) throw new Error('stock pas épuisé en session');
}

/** Ohno : trois sessions réussies — Graeber : la 3e inventa la corvée absurde. */
export function troisSessionsReussies(w: WorldState): void {
  standPret(w);
  buyStock(w);
  w.district.meteo = 'soleil';
  runSalesSession(w, 'place');
  runSalesSession(w, 'place');
  runSalesSession(w, 'place');
  if ((w.flags['sessionsReussies'] ?? 0) < 3) throw new Error('moins de 3 sessions réussies');
}

/** Dejours : sessions ratées en chaîne → un coéquipier dépasse 70 de stress. */
export function coequipierAuBout(w: WorldState): void {
  standPret(w);
  buyStock(w);
  setPrice(w, 2);
  w.district.meteo = 'pluie';
  for (let i = 0; i < 10; i++) runSalesSession(w, 'place'); // 10 échecs : stress +5 chacun
  if (!(w.npcs['noah'] && (w.npcs['noah']?.stress ?? 0) > 70)) throw new Error('coéquipier pas au bout');
}

/** Hayek : règle imposée qui échoue. */
export function regleImposeeQuiEchoue(w: WorldState): void {
  standPret(w);
  for (let i = 0; i < 40 && !w.flags['reglesEchouees']; i++) imposeRule(w);
  if (!w.flags['reglesEchouees']) throw new Error('40 règles imposées sans échec');
}

/** Illich : optimisation ratée (outil contre-productif). */
export function optimisationRatee(w: WorldState): void {
  standPret(w);
  for (let i = 0; i < 40 && !w.flags['outilsContreProductifs']; i++) optimizeStand(w);
  if (!w.flags['outilsContreProductifs']) throw new Error('40 optimisations sans échec');
}

/** Rosa : semaine > 40 h d'activités cumulées (travail réellement fourni). */
export function semaineSurchargee(w: WorldState): void {
  standPret(w);
  const p = w.project;
  if (!p) throw new Error('projet absent');
  p.work = { player: 60, noah: 60, lina: 60 }; // 180 unités de 20 min = 60 h
  projectWeek(w);
  if (!w.flags['semaines40h']) throw new Error('semaine pas surchargée');
}

/** Simon : deux prévisions ratées (prévision du lendemain comparée à la session du jour). */
export function previsionsRatees(w: WorldState): void {
  standPret(w);
  buyStock(w);
  w.player.skills.comptabilite.level = 2;
  w.district.meteo = 'soleil';
  for (let i = 0; i < 2; i++) {
    performGatedAction(w, 'prevision'); // prévoit mercredi (jour +15 %)…
    runSalesSession(w, 'place');        // …et la session de mardi déçoit
  }
  if ((w.flags['previsionsRatees'] ?? 0) < 2) throw new Error('prévisions pas ratées');
}

/** Zuboff : première exploitation des données du stand (fichier clients vendu). */
export function donneesExploitees(w: WorldState): void {
  standPret(w);
  sellCustomerData(w);
  if (!w.flags['donneesExploitees']) throw new Error('données pas exploitées');
}

/** Raworth : premier choix écologique coûteux (5 € payés de la poche). */
export function choixEcoCouteux(w: WorldState): void {
  standPret(w);
  const r = makeEcoChoice(w);
  if (!r.ok) throw new Error(`choix écologique refusé : ${r.message}`);
  if (!w.flags['choixEcoCouteux']) throw new Error('choix écologique pas compté');
}

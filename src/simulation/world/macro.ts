/**
 * NEURAPOLIS — Moteur Macroéconomique Mondial (Démographie, Commerce & Migrations).
 * - Pas annuel déterministe (PRNG mulberry32).
 * - Conservation stricte de la population lors des migrations.
 * - Équilibre comptable parfait du commerce au centime près.
 */

import type { Notification, WorldState } from '../../core/types';
import type { CountryState, MigrationFlow, WorldMacroState } from '../../core/world_macro_types';
import { rngNext } from '../../core/rng';
import { WORLD_COUNTRIES } from '../../data/world/countries';
import { dayIndexOf, dateOf } from '../../core/clock';
import { notify } from '../events';

export function createInitialWorldMacroState(): WorldMacroState {
  const countries: Record<string, CountryState> = {};
  for (const c of WORLD_COUNTRIES) {
    countries[c.id] = {
      id: c.id,
      name: c.name,
      region: c.region,
      population: c.population,
      gdpPerCapita: c.gdpPerCapita,
      sectors: { ...c.sectors },
      birthRate: c.birthRate,
      deathRate: c.deathRate,
      attractiveness: c.attractiveness,
    };
  }

  const state: WorldMacroState = {
    lastUpdatedYear: 2020,
    lastUpdatedDay: 0,
    countries,
    tradeMatrix: {},
    lastMigrationFlows: [],
  };

  // Calcul initial de la matrice de commerce pour le jour 0
  computeTradeMatrix(state, { rng: 20200901 });

  return state;
}

export function ensureWorldMacroState(w: WorldState): WorldMacroState {
  if (!w.worldMacro) {
    w.worldMacro = createInitialWorldMacroState();
  }
  return w.worldMacro;
}

/**
 * Calcul déterministe de la matrice commerciale pays x pays (en centimes d'euros).
 * Invariant : Pour tout couple (i, j), l'exportation de i vers j égale l'importation de j depuis i.
 * La somme globale de la balance commerciale mondiale (Exports - Imports) est strictement égale à 0 centime.
 */
function computeTradeMatrix(state: WorldMacroState, rngState: { rng: number }): void {
  const countryList = Object.values(state.countries);
  const matrix: Record<string, Record<string, number>> = {};

  for (const origin of countryList) {
    matrix[origin.id] = {};
  }

  for (let i = 0; i < countryList.length; i++) {
    const origin = countryList[i]!;
    const gdpOrigin = origin.population * origin.gdpPerCapita;

    for (let j = i + 1; j < countryList.length; j++) {
      const dest = countryList[j]!;
      const gdpDest = dest.population * dest.gdpPerCapita;

      // Facteur de complémentarité sectorielle (technologie / industrie <-> agriculture / énergie)
      const compFactor =
        (origin.sectors.technologie + origin.sectors.industrie) * (dest.sectors.agriculture + dest.sectors.energie) +
        (dest.sectors.technologie + dest.sectors.industrie) * (origin.sectors.agriculture + origin.sectors.energie) + 0.5;

      // Modèle de gravité économique simplifié
      const baseGravity = (Math.sqrt(gdpOrigin) * Math.sqrt(gdpDest)) / 1_000_000;
      const noise1 = 0.85 + rngNext(rngState) * 0.3; // 0.85 .. 1.15
      const noise2 = 0.85 + rngNext(rngState) * 0.3;

      // Montant en centimes d'euros (€ * 100)
      const flowOriginToDestCents = Math.floor(baseGravity * compFactor * noise1 * 100);
      const flowDestToOriginCents = Math.floor(baseGravity * compFactor * noise2 * 100);

      matrix[origin.id]![dest.id] = flowOriginToDestCents;
      matrix[dest.id]![origin.id] = flowDestToOriginCents;
    }
  }

  state.tradeMatrix = matrix;
}

/**
 * Effectue un pas annuel complet de simulation macroéconomique mondiale :
 * 1. Démographie (naissances & décès par pays)
 * 2. Migrations (transferts stricts de population entre pays)
 * 3. Commerce mondial (recalcul de la matrice commerciale)
 */
export function simulateWorldMacroAnnualStep(w: WorldState): { notifications: Notification[] } {
  const macro = ensureWorldMacroState(w);
  const currentDay = dayIndexOf(w.time.tick);
  const currentDate = dateOf(currentDay);
  const year = currentDate.y;

  const notifs: Notification[] = [];
  const countryList = Object.values(macro.countries);

  // 1. Démographie : Naissances & Décès
  for (const c of countryList) {
    const bNoise = 1 + (rngNext(w) * 0.04 - 0.02);
    const dNoise = 1 + (rngNext(w) * 0.04 - 0.02);

    const births = Math.floor(c.population * c.birthRate * bNoise);
    const deaths = Math.floor(c.population * c.deathRate * dNoise);

    c.population = Math.max(10_000, c.population + births - deaths);

    // Ajustement léger du PIB par habitant avec le progrès technologique et l'inflation
    const pibGrowth = (rngNext(w) * 0.03 - 0.005);
    c.gdpPerCapita = Math.max(1_000, Math.round(c.gdpPerCapita * (1 + pibGrowth)));
  }

  // 2. Migrations : Transferts stricts de population
  // Invariant : la population mondiale est parfaitement conservée lors des mouvements migratoires
  const migrationFlows: MigrationFlow[] = [];
  const count = countryList.length;

  for (let i = 0; i < count; i++) {
    const origin = countryList[i]!;
    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const dest = countryList[j]!;

      // Flux de migration si le pays de destination est plus attractif et plus riche
      const attractDiff = dest.attractiveness - origin.attractiveness;
      const gdpRatio = dest.gdpPerCapita / Math.max(1, origin.gdpPerCapita);

      if (attractDiff > 5 && gdpRatio > 1.2) {
        const rate = (attractDiff * 0.00002) * rngNext(w); // Taux modéré
        const maxMove = Math.floor(origin.population * 0.005); // Max 0.5% par an
        const migrants = Math.min(maxMove, Math.floor(origin.population * rate));

        if (migrants > 0 && origin.population - migrants >= 10_000) {
          origin.population -= migrants;
          dest.population += migrants;
          migrationFlows.push({ originId: origin.id, destinationId: dest.id, count: migrants });
        }
      }
    }
  }

  macro.lastMigrationFlows = migrationFlows;

  // 3. Commerce mondial (Matrice pays x pays)
  computeTradeMatrix(macro, w);

  macro.lastUpdatedYear = year;
  macro.lastUpdatedDay = currentDay;

  const totalWorldPop = Object.values(macro.countries).reduce((sum, c) => sum + c.population, 0);
  const worldPopBillions = (totalWorldPop / 1_000_000_000).toFixed(2);

  const notifMsg = `🌍 Bilan Macro Mondial ${year} : Population mondiale = ${worldPopBillions} milliards d'habitants. Flux migratoires = ${migrationFlows.length} corridors actifs.`;
  notifs.push(notify('journal', notifMsg));

  w.events.unshift({
    id: `macro_annual_${year}_${currentDay}`,
    day: currentDay,
    date: currentDate.iso,
    type: 'systeme',
    title: `Bilan Macroéconomique Mondial ${year}`,
    text: `Mis à jour de la démographie mondiale, des flux commerciaux et des cartes migratoires. Population mondiale : ${worldPopBillions} milliards.`,
    causes: [{ facteur: 'Pas annuel de simulation macro-mondiale', poids: 1 }],
  });

  return { notifications: notifs };
}

/**
 * Déclencheur quotidien vérifiant si une année s'est écoulée (365 jours).
 */
export function worldMacroDayTick(w: WorldState): Notification[] {
  const macro = ensureWorldMacroState(w);
  const currentDay = dayIndexOf(w.time.tick);

  if (currentDay > 0 && currentDay - macro.lastUpdatedDay >= 365) {
    return simulateWorldMacroAnnualStep(w).notifications;
  }
  return [];
}

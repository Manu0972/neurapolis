/**
 * NEURAPOLIS — Simulation du Monde 100 ans (Niveaux N0-N2).
 * Couche : core/ (Types stricts, 100% sérialisables, sans dépendances DOM).
 *
 * Architecture multi-échelle :
 * - Niveau N0 : Économie macro & tendances nationales (chocs, inflation, vagues migratoires).
 * - Niveau N1 : Métropole & Région / Val-Ferrand (attractivité, infrastructures, marché local).
 * - Niveau N2 : Quartiers, Individus & Entreprises (démographie, créations/faillites d'entreprises, biographies).
 */

export interface MacroYearHistory {
  year: number;
  populationTotal: number;
  births: number;
  deaths: number;
  immigrants: number;
  emigrants: number;
  netMigration: number;
  businessesActive: number;
  businessesCreated: number;
  businessesClosed: number;
  macroTrend: string;
}

export interface MacroLifeEvent {
  year: number;
  label: string;
}

export interface MacroCitizenRecord {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'fille' | 'garcon' | 'non-binaire';
  birthYear: number;
  deathYear?: number;
  district: string;
  profession: string;
  migratedInYear?: number;
  migratedOutYear?: number;
  lifeEvents: MacroLifeEvent[];
}

export interface MacroBusinessRecord {
  id: string;
  name: string;
  type: string;
  district: string;
  founderId: string;
  foundedYear: number;
  closedYear?: number;
  status: 'actif' | 'ferme';
}

export interface MacroBiography {
  citizenId: string;
  name: string;
  birthYear: number;
  deathYear?: number;
  profession: string;
  summary: string;
  timeline: MacroLifeEvent[];
}

export interface MacroWorldPerformance {
  runtimeMs: number;
  heapUsedMB: number;
  rssMB: number;
}

export interface MacroWorldState {
  startYear: number;
  currentYear: number;
  totalYearsSimulated: number;
  totalBirths: number;
  totalDeaths: number;
  totalImmigrants: number;
  totalEmigrants: number;
  totalBusinessesCreated: number;
  totalBusinessesClosed: number;
  history: MacroYearHistory[];
  citizens: MacroCitizenRecord[];
  businesses: MacroBusinessRecord[];
  biographies: MacroBiography[];
  performance?: MacroWorldPerformance;
}

export function createMacroWorldState(startYear = 2020): MacroWorldState {
  return {
    startYear,
    currentYear: startYear,
    totalYearsSimulated: 0,
    totalBirths: 0,
    totalDeaths: 0,
    totalImmigrants: 0,
    totalEmigrants: 0,
    totalBusinessesCreated: 0,
    totalBusinessesClosed: 0,
    history: [],
    citizens: [],
    businesses: [],
    biographies: [],
  };
}

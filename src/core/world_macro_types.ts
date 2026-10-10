/**
 * NEURAPOLIS — Types du Macro-Monde : Pays, Démographie, Commerce et Migrations.
 */

export interface SectorDistribution {
  agriculture: number;
  industrie: number;
  services: number;
  technologie: number;
  energie: number;
}

export interface CountryDef {
  id: string;
  name: string;
  region: string;
  population: number;
  gdpPerCapita: number;
  sectors: SectorDistribution;
  birthRate: number;
  deathRate: number;
  attractiveness: number;
}

export interface CountryState {
  id: string;
  name: string;
  region: string;
  population: number;
  gdpPerCapita: number;
  sectors: SectorDistribution;
  birthRate: number;
  deathRate: number;
  attractiveness: number;
}

export interface TradeFlow {
  originId: string;
  destinationId: string;
  amountCents: number;
}

export interface MigrationFlow {
  originId: string;
  destinationId: string;
  count: number;
}

export interface WorldMacroState {
  lastUpdatedYear: number;
  lastUpdatedDay: number;
  countries: Record<string, CountryState>;
  /** Matrice commercial paysOrigineId -> paysDestinationId -> montant en centimes d'euros */
  tradeMatrix: Record<string, Record<string, number>>;
  lastMigrationFlows: MigrationFlow[];
}

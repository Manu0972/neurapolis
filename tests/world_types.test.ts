import { describe, it, expect } from 'vitest';
import type {
  MacroWorldState,
  CountryState,
  CityState,
  DemographicCohort,
  DetailedAgentState,
  OnDemandAgentDef,
  PopulationLedger,
  CurrencyLedger,
  CommodityLedger,
  ConservationInvariants,
  WorldPerformanceBudget,
  Tier5RegionalState,
  Tier6GlobalState,
  Tier5_6_WorldInterface,
} from '../src/core/world_types.js';

describe('NEURAPOLIS Extended World Architecture — Data Contracts & Types (Monde 1/6)', () => {

  describe('1. N0 à N4 — Types de la hiérarchie multi-échelle', () => {
    it('instancie un état N0 (Monde Macro) valide', () => {
      const macroState: MacroWorldState = {
        currentYear: 2032,
        globalInflationRate: 0.028,
        markets: {
          energie: { commodity: 'energie', basePrice: 100, currentPrice: 112, volatility: 0.15, trend: 'hausse' },
          cereales: { commodity: 'cereales', basePrice: 50, currentPrice: 48, volatility: 0.08, trend: 'baisse' },
          composants: { commodity: 'composants', basePrice: 200, currentPrice: 210, volatility: 0.22, trend: 'hausse' },
          materiaux: { commodity: 'materiaux', basePrice: 80, currentPrice: 80, volatility: 0.05, trend: 'stable' },
        },
        activeWorldEvents: [
          {
            id: 'evt_2032_ia_souveraine',
            year: 2032,
            title: 'Lancement du Réseau National d’IA Souveraine',
            description: 'Hausse de la demande en composants de calcul et réduction des coûts de gestion.',
            impacts: {
              inflationRateDelta: 0.002,
              commodityPriceModifiers: { composants: 1.15 },
              globalDemandModifier: 1.05,
            },
          },
        ],
      };

      expect(macroState.currentYear).toBe(2032);
      expect(macroState.markets.energie.currentPrice).toBe(112);
      expect(macroState.activeWorldEvents).toHaveLength(1);
    });

    it('instancie un état N1 (Pays & Cadre Institutionnel) valide', () => {
      const countryState: CountryState = {
        id: 'val_de_loire_metropole',
        name: 'République de Val-de-Sarthe',
        currencySymbol: '€',
        taxPolicy: {
          corporateTaxRate: 0.25,
          vatRate: 0.20,
          socialContributionRate: 0.32,
          carbonTaxPerTon: 45.0,
        },
        centralBank: {
          keyInterestRate: 0.0325,
          reserveRequirementRatio: 0.05,
          inflationTarget: 0.02,
        },
        publicInfrastructuresLevel: 72,
      };

      expect(countryState.currencySymbol).toBe('€');
      expect(countryState.taxPolicy.vatRate).toBe(0.20);
      expect(countryState.centralBank.keyInterestRate).toBe(0.0325);
    });

    it('instancie un état N2 (Ville & Cohortes) valide', () => {
      const cohort: DemographicCohort = {
        id: 'cohort_faubourg_artisans',
        districtId: 'faubourg',
        category: 'artisans_commercants',
        populationCount: 1450,
        averageIncome: 2300,
        purchasingPowerIndex: 1.05,
        employmentRate: 0.92,
        satisfactionIndex: 68,
      };

      const cityState: CityState = {
        id: 'neurapolis_centre',
        name: 'NEURAPOLIS',
        totalPopulation: 28500,
        unemploymentRate: 0.068,
        averageQualityOfLife: 74,
        cohorts: [cohort],
      };

      expect(cityState.totalPopulation).toBe(28500);
      expect(cityState.cohorts[0]?.populationCount).toBe(1450);
      expect(cityState.cohorts[0]?.category).toBe('artisans_commercants');
    });

    it('instancie un état N3 (Agent Proche du Joueur) valide', () => {
      const agentN3: DetailedAgentState = {
        id: 'noah_martinez',
        fullName: 'Noah Martinez',
        age: 13,
        role: 'Ami du collège & Coéquipier',
        assignedDistrictId: 'faubourg',
        cohortId: 'cohort_faubourg_jeunesse',
        relationsWithPlayer: {
          amitie: 78,
          confiance: 65,
          respect: 52,
          rivalite: 15,
        },
        needs: {
          fatigue: 25,
          faim: 30,
          stress: 20,
          moral: 80,
        },
        routine: [
          { startHour: 8, endHour: 12, locationId: 'college', activityLabel: 'Cours au collège' },
          { startHour: 14, endHour: 18, locationId: 'roses', activityLabel: 'Vente au Stand des Roses' },
        ],
        memoryEvents: ['evt_inauguration_stand', 'evt_victoire_friche'],
      };

      expect(agentN3.fullName).toBe('Noah Martinez');
      expect(agentN3.relationsWithPlayer.amitie).toBe(78);
      expect(agentN3.routine).toHaveLength(2);
    });

    it('instancie un agent N4 (Généré à la demande) déterministe', () => {
      const ephemeralAgent: OnDemandAgentDef = {
        ephemeralId: 'passant_48291',
        seed: 13379021,
        derivedCohortId: 'cohort_faubourg_artisans',
        visualAppearance: {
          skinTone: 'doree',
          clothingStyle: 'streetwear',
          primaryColor: '#2b2d42',
        },
        currentActivity: 'Achète un produit de rue',
        spendingBudget: 15.5,
      };

      expect(ephemeralAgent.ephemeralId).toBe('passant_48291');
      expect(ephemeralAgent.spendingBudget).toBe(15.5);
    });
  });

  describe('2. Invariants de conservation', () => {
    it('vérifie l’équilibre strict du registre de population (PopulationLedger)', () => {
      const popLedger: PopulationLedger = {
        totalCityPopulation: 25000,
        cohortSum: 24950,
        namedAgentCount: 50,
        instantiatedEphemeralCount: 12, // Actuellement sur la carte
        birthsToday: 3,
        deathsToday: 1,
        netMigrationToday: 5,
        isBalanced: true,
      };

      const totalCalculated = popLedger.cohortSum + popLedger.namedAgentCount;
      expect(totalCalculated).toBe(popLedger.totalCityPopulation);
      expect(popLedger.isBalanced).toBe(true);
    });

    it('vérifie la conservation stricte de la masse monétaire en partie double (CurrencyLedger)', () => {
      const currencyLedger: CurrencyLedger = {
        totalMoneySupply: 500000,
        playerBalance: 1250,
        namedNpcBalanceSum: 18750,
        businessTreasurySum: 145000,
        cohortSavingsSum: 285000,
        publicSectorBalance: 50000,
        unbalancedDiscrepancy: 0,
      };

      const sumComponents =
        currencyLedger.playerBalance +
        currencyLedger.namedNpcBalanceSum +
        currencyLedger.businessTreasurySum +
        currencyLedger.cohortSavingsSum +
        currencyLedger.publicSectorBalance;

      expect(sumComponents).toBe(currencyLedger.totalMoneySupply);
      expect(currencyLedger.unbalancedDiscrepancy).toBe(0);
    });

    it('vérifie l’invariant de conservation physique des marchandises (CommodityLedger)', () => {
      const commodityLedger: CommodityLedger = {
        commodity: 'energie',
        initialStock: 1000,
        producedUnits: 500,
        importedUnits: 200,
        consumedUnits: 1200,
        wastedUnits: 50,
        exportedUnits: 150,
        finalStock: 300,
        conservationError: 0,
      };

      const calculatedFinal =
        commodityLedger.initialStock +
        commodityLedger.producedUnits +
        commodityLedger.importedUnits -
        commodityLedger.consumedUnits -
        commodityLedger.wastedUnits -
        commodityLedger.exportedUnits;

      expect(calculatedFinal).toBe(commodityLedger.finalStock);
      expect(commodityLedger.conservationError).toBe(0);
    });

    it('valide le conteneur complet des invariants de conservation', () => {
      const conservation: ConservationInvariants = {
        population: {
          totalCityPopulation: 100,
          cohortSum: 90,
          namedAgentCount: 10,
          instantiatedEphemeralCount: 0,
          birthsToday: 0,
          deathsToday: 0,
          netMigrationToday: 0,
          isBalanced: true,
        },
        currency: {
          totalMoneySupply: 1000,
          playerBalance: 100,
          namedNpcBalanceSum: 200,
          businessTreasurySum: 300,
          cohortSavingsSum: 300,
          publicSectorBalance: 100,
          unbalancedDiscrepancy: 0,
        },
        commodities: {
          energie: { commodity: 'energie', initialStock: 10, producedUnits: 5, importedUnits: 0, consumedUnits: 5, wastedUnits: 0, exportedUnits: 0, finalStock: 10, conservationError: 0 },
          cereales: { commodity: 'cereales', initialStock: 20, producedUnits: 10, importedUnits: 0, consumedUnits: 10, wastedUnits: 0, exportedUnits: 0, finalStock: 20, conservationError: 0 },
          composants: { commodity: 'composants', initialStock: 5, producedUnits: 2, importedUnits: 0, consumedUnits: 2, wastedUnits: 0, exportedUnits: 0, finalStock: 5, conservationError: 0 },
          materiaux: { commodity: 'materiaux', initialStock: 30, producedUnits: 0, importedUnits: 10, consumedUnits: 10, wastedUnits: 0, exportedUnits: 0, finalStock: 30, conservationError: 0 },
        },
      };

      expect(conservation.population.isBalanced).toBe(true);
      expect(conservation.currency.unbalancedDiscrepancy).toBe(0);
      expect(conservation.commodities.energie.finalStock).toBe(10);
    });
  });

  describe('3. Budgets de performance et temps dans le navigateur', () => {
    it('vérifie la conformité des plafonds de budgets mémoire et calcul', () => {
      const budget: WorldPerformanceBudget = {
        timeLimits: {
          maxTickDurationMs: 2.0,            // Limite absolue < 2ms
          maxDailyAggregationDurationMs: 15.0,// Limite absolue < 15ms
        },
        memoryLimits: {
          maxHeapMemoryMb: 150,               // Limite absolue < 150 Mo
          maxSaveFileSizeKb: 1000,             // Limite absolue < 1 Mo
          maxEphemeralAgentPoolSize: 50,
        },
      };

      expect(budget.timeLimits.maxTickDurationMs).toBeLessThanOrEqual(2.0);
      expect(budget.timeLimits.maxDailyAggregationDurationMs).toBeLessThanOrEqual(15.0);
      expect(budget.memoryLimits.maxHeapMemoryMb).toBeLessThanOrEqual(150);
      expect(budget.memoryLimits.maxSaveFileSizeKb).toBeLessThanOrEqual(1000);
    });
  });

  describe('4. Interfaces du jeu aux Paliers 5 et 6', () => {
    it('instancie l’interface de jeu Paliers 5 (Régional) et 6 (Mondial)', () => {
      const tier5State: Tier5RegionalState = {
        conglomerateName: 'NEURA-HOLDING',
        holdingTreasury: 4500000,
        subsidiaries: [
          {
            id: 'sub_bio_docks',
            name: 'Logistique Bio Docks',
            targetCityId: 'delta_9',
            sector: 'commerce',
            marketShare: 0.35,
            valuation: 1200000,
            monthlyRevenue: 85000,
            employeeCohortCount: 120,
          },
        ],
        unlockedCities: ['neurapolis', 'delta_9', 'plateau_blanc'],
        activeMarketingCampaigns: [
          { targetCohortId: 'cohort_cadres', budgetMonthly: 15000, impactOnDemand: 1.25 },
        ],
      };

      const tier6State: Tier6GlobalState = {
        globalInfluenceScore: 82,
        activeLobbyingDirectives: [
          { targetPolicyKey: 'carbonTaxPerTon', desiredDirection: 'baisse', allocatedBudget: 50000 },
        ],
        macroDoctrinalStance: 'communs',
        rawMaterialConscessions: ['energie', 'composants'],
      };

      const fullInterface: Tier5_6_WorldInterface = {
        tier5: tier5State,
        tier6: tier6State,
      };

      expect(fullInterface.tier5.conglomerateName).toBe('NEURA-HOLDING');
      expect(fullInterface.tier5.subsidiaries).toHaveLength(1);
      expect(fullInterface.tier6.macroDoctrinalStance).toBe('communs');
    });
  });
});

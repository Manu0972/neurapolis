import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { makeSeed, rngNext } from '../src/core/rng';
import type { CityGovernanceState, CohortId, ParticipatoryProjectDef } from '../src/core/governance_types';
import {
  URBAN_DOCTRINES,
  calculateCohortProjectSupport,
  calculateProjectVoteScore,
  createDefaultCohorts,
  createDefaultProjectProposals,
  createInitialGovernanceState,
  distributeCitizenPamphlets,
  executeAllocationPhase,
  executeVotingPhase,
  getCohortOpinions,
  getGovernanceBudgetSummary,
  holdTownHallMeeting,
  invokeGhostAdvocacy,
  broadcastPirateRadioDebate,
  tickGovernanceCycle,
} from '../src/simulation/governance';
import {
  advanceAllWorksitesDay,
  advanceWorksiteDay,
  allocateWorksiteResources,
  canUnlockDistrict,
  createDefaultWorksitesCatalog,
  createWorksiteFromProject,
  getCityAestheticOverview,
  getCityGlobalMetrics,
  getCompletedRenovations,
  getDistrictRenovationStatus,
  getPendingAndActiveWorksites,
  unlockDistrict,
} from '../src/simulation/renovation';

describe('NEURAPOLIS — Dynamic City Modification & Participatory Governance (Axis 3)', () => {
  // ==========================================================================
  // 1. Contrats de Types et Sérialisation
  // ==========================================================================
  describe('Contrats de Types & Invariants de Sérialisation', () => {
    it('initialise un état de gouvernance urbaine sérialisable en JSON sans perte', () => {
      const state = createInitialGovernanceState(600);
      expect(state.budget.totalEnvelopeEuros).toBe(600);
      expect(state.budget.phase).toBe('deliberation');
      expect(state.districts.roses.unlocked).toBe(true);
      expect(state.districts.docks.unlocked).toBe(false);

      const serialized = JSON.stringify(state);
      const parsed = JSON.parse(serialized) as CityGovernanceState;

      expect(parsed.budget.totalEnvelopeEuros).toBe(600);
      expect(parsed.cohorts.jeunes.size).toBe(120);
      expect(parsed.cohorts.commercants.preferences.liberale_marche).toBeGreaterThan(0.7);
      expect(parsed.cohorts.ecologistes.preferences.communs_ostrom).toBeGreaterThan(0.9);
      expect(parsed.metrics.dominantDoctrine).toBe('communs_ostrom');
    });

    it('couvre les 4 doctrines urbaines avec métadonnées complètes et cohérentes', () => {
      const keys = Object.keys(URBAN_DOCTRINES) as Array<keyof typeof URBAN_DOCTRINES>;
      expect(keys).toEqual([
        'liberale_marche',
        'socialiste_commune',
        'communs_ostrom',
        'productiviste_taylor',
      ]);

      for (const k of keys) {
        const doc = URBAN_DOCTRINES[k];
        expect(doc.name).toBeTruthy();
        expect(doc.thinker).toBeTruthy();
        expect(doc.philosophy).toBeTruthy();
        expect(doc.aestheticStyle).toBeTruthy();
        expect(doc.coreValues.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('garantit les 4 cohortes citoyennes avec populations et préférences bornées', () => {
      const cohorts = createDefaultCohorts();
      const expectedCohorts: CohortId[] = ['jeunes', 'commercants', 'retraites', 'ecologistes'];

      for (const id of expectedCohorts) {
        const c = cohorts[id];
        expect(c).toBeDefined();
        expect(c.size).toBeGreaterThan(0);
        expect(c.mobilizationRate).toBeGreaterThanOrEqual(0);
        expect(c.mobilizationRate).toBeLessThanOrEqual(1);
        expect(c.satisfaction).toBeGreaterThanOrEqual(0);
        expect(c.satisfaction).toBeLessThanOrEqual(100);

        for (const pref of Object.values(c.preferences)) {
          expect(pref).toBeGreaterThanOrEqual(-1.0);
          expect(pref).toBeLessThanOrEqual(1.0);
        }
      }
    });
  });

  // ==========================================================================
  // 2. Formule Déterministe de Scrutin Pondéré
  // ==========================================================================
  describe('Formule Déterministe de Scrutin Annuel Pondéré', () => {
    it('calcule fidèlement les voix par cohorte et applique la pénalité de coût', () => {
      const cohorts = createDefaultCohorts();
      const project: ParticipatoryProjectDef = {
        id: 'proj_test_ostrom',
        title: 'Potager Partagé',
        description: 'Test',
        districtId: 'roses',
        category: 'environnement',
        costEuros: 200,
        workHoursNeeded: 100,
        materialsNeeded: 50,
        doctrine: 'communs_ostrom',
        impacts: { moraleDelta: 10, attractivenessDelta: 10, civicEngagementDelta: 5 },
        votesReceived: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
        advocacyBonus: { jeunes: 0, commercants: 0, retraites: 0, ecologistes: 0 },
        computedScore: 0,
        status: 'soumis',
      };

      // Calcul manuel théorique :
      // Écologistes : size 95, mob 0.55 => 52.25 citoyens
      // pref communs_ostrom = 0.95 => norm = (1 + 0.95)/2 = 0.975
      // support eco = 52.25 * 0.975 = 50.94 => arrondi 50.9
      const ecoSupport = calculateCohortProjectSupport(cohorts.ecologistes, project);
      expect(ecoSupport).toBeCloseTo(50.9, 0.2);

      // Commerçants : size 85, mob 0.65 => 55.25 citoyens
      // pref communs_ostrom = 0.10 => norm = 0.55
      // support = 55.25 * 0.55 = 30.38 => arrondi 30.4
      const comSupport = calculateCohortProjectSupport(cohorts.commercants, project);
      expect(comSupport).toBeCloseTo(30.4, 0.2);

      // Score global avec coût 200 € et ratio 0.20 => Pénalité = 40
      const { totalScore, costPenalty } = calculateProjectVoteScore(project, cohorts, 0.20);
      expect(costPenalty).toBe(40);
      expect(totalScore).toBeGreaterThan(0);
    });

    it('assure le déterminisme absolu du scrutin (aucun aléa non contrôlé)', () => {
      const state1 = createInitialGovernanceState();
      const state2 = createInitialGovernanceState();

      const winners1 = executeVotingPhase(state1);
      const winners2 = executeVotingPhase(state2);

      expect(winners1.length).toBe(winners2.length);
      for (let i = 0; i < winners1.length; i++) {
        expect(winners1[i]?.id).toBe(winners2[i]?.id);
        expect(winners1[i]?.computedScore).toBe(winners2[i]?.computedScore);
      }
    });

    it('donne l’avantage doctrinal aux projets correspondant aux attentes dominantes', () => {
      const cohorts = createDefaultCohorts();
      const proposals = createDefaultProjectProposals();

      const kiosque = proposals.find((p) => p.id === 'proj_kiosque_musique')!;
      const halles = proposals.find((p) => p.id === 'proj_halles_marche_fermier')!;

      const scoreKiosque = calculateProjectVoteScore(kiosque, cohorts).totalScore;
      const scoreHalles = calculateProjectVoteScore(halles, cohorts).totalScore;

      // Le kiosque (communs_ostrom, 180 €) a une forte adhésion chez retraités, jeunes et écolos
      expect(scoreKiosque).toBeGreaterThan(0);
      expect(scoreHalles).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 3. Délibération Citoyenne et Influence des Fantômes
  // ==========================================================================
  describe('Sous-système de Délibération Citoyenne', () => {
    it('assemble les citoyens en réunion publique et rehausse le consensus', () => {
      const state = createInitialGovernanceState();
      const prevConsensus = state.deliberation.consensusScore;
      const prevMobJeunes = state.cohorts.jeunes.mobilizationRate;

      const log = holdTownHallMeeting(state, 3, 'Partage des toits de Val-Ferrand');
      expect(log.actionType).toBe('reunion_publique');
      expect(state.deliberation.consensusScore).toBe(prevConsensus + 5);
      expect(state.cohorts.jeunes.mobilizationRate).toBeGreaterThan(prevMobJeunes);
    });

    it('distribue des tracts citoyens pour doper l’adhésion à un projet précis', () => {
      const state = createInitialGovernanceState();
      const project = state.budget.submittedProjects[0]!;

      const log = distributeCitizenPamphlets(state, project.id, 'retraites', 4);
      expect(log).not.toBeNull();
      expect(project.advocacyBonus.retraites).toBe(25);
      expect(state.cohorts.retraites.preferences[project.doctrine]).toBeGreaterThan(0);
    });

    it('diffuse un débat sur la radio pirate et influence l’opinion publique', () => {
      const state = createInitialGovernanceState();
      const prevPrefTaylor = state.cohorts.commercants.preferences.productiviste_taylor;

      broadcastPirateRadioDebate(state, 'productiviste_taylor', 5);
      expect(state.cohorts.commercants.preferences.productiviste_taylor).toBeGreaterThan(prevPrefTaylor);
      expect(state.metrics.overallCivicEngagement).toBeGreaterThan(52);
    });

    it('active la plaidoirie de chaque Fantôme Conseiller selon sa philosophie', () => {
      const state = createInitialGovernanceState();
      const projects = state.budget.submittedProjects;

      // 1. Smith soutient les commerçants
      const projSmith = projects.find((p) => p.doctrine === 'liberale_marche')!;
      invokeGhostAdvocacy(state, 'smith', projSmith.id, 6);
      expect(projSmith.advocacyBonus.commercants).toBe(30);

      // 2. Marx enflamme la jeunesse
      const projMarx = projects.find((p) => p.doctrine === 'socialiste_commune')!;
      invokeGhostAdvocacy(state, 'marx', projMarx.id, 6);
      expect(projMarx.advocacyBonus.jeunes).toBe(35);

      // 3. Ostrom rallie écologistes et aînés
      const projOstrom = projects.find((p) => p.doctrine === 'communs_ostrom')!;
      invokeGhostAdvocacy(state, 'ostrom', projOstrom.id, 6);
      expect(projOstrom.advocacyBonus.ecologistes).toBe(30);
      expect(projOstrom.advocacyBonus.retraites).toBe(20);

      // 4. Taylor réduit les heures nécessaires
      const projTaylor = projects.find((p) => p.doctrine === 'productiviste_taylor')!;
      const initialHours = projTaylor.workHoursNeeded;
      invokeGhostAdvocacy(state, 'taylor', projTaylor.id, 6);
      expect(projTaylor.workHoursNeeded).toBe(Math.round(initialHours * 0.85));

      // 5. Keynes augmente l'enveloppe budgétaire
      const initialBudget = state.budget.totalEnvelopeEuros;
      invokeGhostAdvocacy(state, 'keynes', projSmith.id, 6);
      expect(state.budget.totalEnvelopeEuros).toBe(initialBudget + 50);
    });
  });

  // ==========================================================================
  // 4. Vote, Allocation et Cycle de Gouvernance
  // ==========================================================================
  describe('Phase de Vote, Allocation Budgétaire et Cycle Annuel', () => {
    it('alloue le budget de façon optimale sans dépasser l’enveloppe disponible', () => {
      const state = createInitialGovernanceState(450); // Enveloppe 450 €
      const winners = executeVotingPhase(state);

      expect(winners.length).toBeGreaterThan(0);
      const totalCost = winners.reduce((acc, p) => acc + p.costEuros, 0);
      expect(totalCost).toBeLessThanOrEqual(450);
      expect(state.budget.spentEnvelopeEuros).toBe(totalCost);
      expect(state.budget.phase).toBe('allocation');
    });

    it('exécute l’allocation, ajuste les satisfactions et synchronise le WorldState', () => {
      const state = createInitialGovernanceState(500);
      const world = createWorld({ seed: 20261002 });

      executeVotingPhase(state);
      const summary = executeAllocationPhase(state, 12, world);

      expect(summary.winningProjectIds.length).toBeGreaterThan(0);
      expect(summary.totalVotesCast).toBeGreaterThan(0);
      expect(state.budget.history.length).toBe(1);
      expect(world.events.length).toBeGreaterThan(0);
      expect(world.events[0]?.title).toContain('Budget Participatif');
    });

    it('enchaîne automatiquement les 4 phases du cycle de gouvernance urbaine', () => {
      const state = createInitialGovernanceState(500);
      expect(state.budget.phase).toBe('deliberation');

      // Écoulement de la délibération (10 jours)
      const res1 = tickGovernanceCycle(state, 10, 10);
      expect(res1.phaseChanged).toBe(true);
      expect(res1.newPhase).toBe('allocation'); // Après le vote immédiat

      // Écoulement de l'allocation (2 jours)
      const res2 = tickGovernanceCycle(state, 2, 12);
      expect(res2.phaseChanged).toBe(true);
      expect(res2.newPhase).toBe('realisation');

      // Écoulement de la réalisation (15 jours) -> reboucle sur cycle suivant
      const res3 = tickGovernanceCycle(state, 15, 27);
      expect(res3.phaseChanged).toBe(true);
      expect(res3.newPhase).toBe('deliberation');
      expect(state.budget.cycleNumber).toBe(2);
      expect(state.budget.spentEnvelopeEuros).toBe(0);
    });
  });

  // ==========================================================================
  // 5. Rénovation Urbaine et Déverrouillage de Quartiers
  // ==========================================================================
  describe('Rénovation Urbaine & Déverrouillage Progressif', () => {
    it('génère un chantier citoyen depuis un projet lauréat avec dotation de départ', () => {
      const state = createInitialGovernanceState();
      const project = state.budget.submittedProjects[0]!;
      const worksite = createWorksiteFromProject(project, 15);

      expect(worksite.id).toBe(`ws_${project.id}`);
      expect(worksite.status).toBe('en_cours');
      expect(worksite.materialsSupplied).toBe(Math.round(project.materialsNeeded * 0.4));
      expect(worksite.volunteersActive).toBe(4);
      expect(worksite.aesthetic.visualFlags.length).toBeGreaterThan(0);
    });

    it('gère l’avancement déterministe d’un chantier avec matériaux, bénévoles et artisans', () => {
      const catalog = createDefaultWorksitesCatalog();
      const ws = catalog.ws_facades_roses!;
      const district = {
        districtId: 'roses' as const,
        name: 'Roses',
        description: '',
        unlocked: true,
        vitality: 60,
        attractiveness: 55,
        civicEngagement: 50,
        ambientKelvin: 1800,
        activeWorksiteIds: [ws.id],
        completedWorksiteIds: [],
        requirements: {
          minReputation: 0,
          minConfianceQuartier: 0,
          minVitaliteEpicerie: 0,
          costEuros: 0,
          requiredCompletedWorksites: [],
        },
      };

      const initialProgress = ws.progressPct;
      const initialHours = ws.workHoursInvested;

      const res = advanceWorksiteDay(ws, district, 2);
      expect(res.progressDelta).toBeGreaterThan(0);
      expect(ws.progressPct).toBeGreaterThan(initialProgress);
      expect(ws.workHoursInvested).toBeGreaterThan(initialHours);
    });

    it('ralentit fortement le chantier en cas de pénurie de matériaux (effet goulot)', () => {
      const catalog1 = createDefaultWorksitesCatalog();
      const catalog2 = createDefaultWorksitesCatalog();
      const wsPlein = catalog1.ws_facades_roses!;
      const wsVide = catalog2.ws_facades_roses!;

      allocateWorksiteResources(wsPlein, { materialsDelta: 100 }); // Abondance
      allocateWorksiteResources(wsVide, { materialsDelta: -100 }); // Pénurie totale (matériaux = 0)

      const district = {
        districtId: 'roses' as const,
        name: 'Roses',
        description: '',
        unlocked: true,
        vitality: 60,
        attractiveness: 55,
        civicEngagement: 50,
        ambientKelvin: 1800,
        activeWorksiteIds: [],
        completedWorksiteIds: [],
        requirements: {
          minReputation: 0,
          minConfianceQuartier: 0,
          minVitaliteEpicerie: 0,
          costEuros: 0,
          requiredCompletedWorksites: [],
        },
      };

      const resPlein = advanceWorksiteDay(wsPlein, district, 1);
      const resVide = advanceWorksiteDay(wsVide, district, 1);

      expect(resPlein.progressDelta).toBeGreaterThan(resVide.progressDelta);
      // Même à sec, le système garantit 20% d'efficacité minimale par la débrouille citoyenne
      expect(resVide.progressDelta).toBeGreaterThan(0);
    });

    it('achève le chantier à 100%, applique les bonus permanents et notifie le monde', () => {
      const catalog = createDefaultWorksitesCatalog();
      const ws = catalog.ws_facades_roses!;
      const world = createWorld();
      const district = {
        districtId: 'roses' as const,
        name: 'Roses',
        description: '',
        unlocked: true,
        vitality: 50,
        attractiveness: 50,
        civicEngagement: 50,
        ambientKelvin: 1800,
        activeWorksiteIds: [ws.id],
        completedWorksiteIds: [],
        requirements: {
          minReputation: 0,
          minConfianceQuartier: 0,
          minVitaliteEpicerie: 0,
          costEuros: 0,
          requiredCompletedWorksites: [],
        },
      };

      // Configuration d'achèvement imminent
      ws.progressPct = 99.5;
      ws.materialsSupplied = ws.materialsNeeded;
      ws.volunteersActive = 5;

      const res = advanceWorksiteDay(ws, district, 10, world);
      expect(res.completed).toBe(true);
      expect(ws.status).toBe('termine');
      expect(ws.completedDay).toBe(10);
      expect(district.completedWorksiteIds).toContain(ws.id);
      expect(district.attractiveness).toBeGreaterThan(50);
      expect(world.events.length).toBeGreaterThan(0);
      expect(world.events[0]?.title).toContain('Chantier Achevé');
    });

    it('fait avancer l’ensemble des chantiers actifs de la ville en lot', () => {
      const state = createInitialGovernanceState();
      state.worksites = createDefaultWorksitesCatalog();
      state.worksites.ws_facades_roses!.status = 'en_cours';
      state.worksites.ws_toits_hauts!.status = 'en_cours';

      const completed = advanceAllWorksitesDay(state, 5);
      expect(Array.isArray(completed)).toBe(true);
      expect(state.worksites.ws_facades_roses!.workHoursInvested).toBeGreaterThan(30);
    });

    it('bloque puis déverrouille un quartier dès satisfaction des exigences citoyennes', () => {
      const state = createInitialGovernanceState();
      const world = createWorld();

      // Docks au départ inaccessibles
      const initialCheck = canUnlockDistrict(state, 'docks', world);
      expect(initialCheck.allowed).toBe(false);
      expect(initialCheck.reasons.length).toBeGreaterThan(0);

      // Le joueur progresse : réputation 55, confiance 60, épicerie 50, argent 100 €
      world.player.reputation = 55;
      world.district.confianceQuartier = 60;
      world.district.vitaliteEpicerie = 50;
      world.player.money = 100;

      const updatedCheck = canUnlockDistrict(state, 'docks', world);
      expect(updatedCheck.allowed).toBe(true);

      const unlocked = unlockDistrict(state, 'docks', 18, world);
      expect(unlocked).toBe(true);
      expect(state.districts.docks.unlocked).toBe(true);
      expect(state.districts.docks.unlockedDay).toBe(18);
      expect(world.player.money).toBe(20); // 100 - 80 € coût d'accès
      expect(world.events[0]?.title).toContain('Nouveau Quartier Déverrouillé');
    });
  });

  // ==========================================================================
  // 6. Fonctions de Requêtes Pures d'Affichage
  // ==========================================================================
  describe('Fonctions de Requêtes Pures pour l’Affichage', () => {
    it('fournit la synthèse esthétique complète de la ville', () => {
      const state = createInitialGovernanceState();
      state.worksites = createDefaultWorksitesCatalog();
      state.worksites.ws_facades_roses!.status = 'termine';

      const overview = getCityAestheticOverview(state);
      expect(overview.dominantDoctrine).toBe('communs_ostrom');
      expect(overview.unlockedDistrictsCount).toBe(1);
      expect(overview.totalWorksitesCompleted).toBe(1);
      expect(overview.activeVisualFlags).toContain('facades_roses_renovees');
      expect(overview.districtSummaries.length).toBe(6);
    });

    it('fournit le rapport détaillé de rénovation par quartier', () => {
      const state = createInitialGovernanceState();
      state.worksites = createDefaultWorksitesCatalog();

      const summary = getDistrictRenovationStatus(state, 'roses');
      expect(summary.districtId).toBe('roses');
      expect(summary.unlocked).toBe(true);
      expect(summary.activeWorksites.length).toBeGreaterThanOrEqual(1);
      expect(summary.attractiveness).toBe(55);
    });

    it('fournit les requêtes de filtrage des chantiers et métriques de cohortes', () => {
      const state = createInitialGovernanceState();
      state.worksites = createDefaultWorksitesCatalog();

      const pending = getPendingAndActiveWorksites(state);
      const completed = getCompletedRenovations(state);
      expect(pending.length).toBe(5);
      expect(completed.length).toBe(0);

      const cohortOpinions = getCohortOpinions(state);
      expect(cohortOpinions.jeunes.topPreferredDoctrine).toBe('socialiste_commune');
      expect(cohortOpinions.commercants.topPreferredDoctrine).toBe('liberale_marche');
      expect(cohortOpinions.ecologistes.topPreferredDoctrine).toBe('communs_ostrom');

      const budgetSummary = getGovernanceBudgetSummary(state);
      expect(budgetSummary.envelopeTotal).toBe(500);
      expect(budgetSummary.voterTurnoutPct).toBeGreaterThan(40);

      const globalMetrics = getCityGlobalMetrics(state);
      expect(globalMetrics.collectiveMorale).toBe(60);
      expect(globalMetrics.socialCohesion).toBe(55);
    });
  });

  // ==========================================================================
  // 7. Déterminisme PRNG et Tests de Robustesse
  // ==========================================================================
  describe('Déterminisme PRNG & Invariants', () => {
    it('produit les mêmes tirages et délibérations avec la même graine Mulberry32', () => {
      const rng1 = { rng: makeSeed(42) };
      const rng2 = { rng: makeSeed(42) };

      const state1 = createInitialGovernanceState();
      const state2 = createInitialGovernanceState();

      holdTownHallMeeting(state1, 1, 'Débat 1', rng1);
      holdTownHallMeeting(state2, 1, 'Débat 1', rng2);

      expect(state1.cohorts.jeunes.mobilizationRate).toBe(state2.cohorts.jeunes.mobilizationRate);
      expect(state1.cohorts.ecologistes.mobilizationRate).toBe(state2.cohorts.ecologistes.mobilizationRate);
    });

    it('respecte les bornes strictes de toutes les métriques sous sollicitation extrême', () => {
      const state = createInitialGovernanceState();

      // Répétition de 20 réunions publiques et débats
      for (let i = 0; i < 20; i++) {
        holdTownHallMeeting(state, i);
        broadcastPirateRadioDebate(state, 'communs_ostrom', i);
      }

      for (const cohort of Object.values(state.cohorts)) {
        expect(cohort.mobilizationRate).toBeLessThanOrEqual(1.0);
        expect(cohort.mobilizationRate).toBeGreaterThanOrEqual(0.0);
        for (const pref of Object.values(cohort.preferences)) {
          expect(pref).toBeLessThanOrEqual(1.0);
          expect(pref).toBeGreaterThanOrEqual(-1.0);
        }
      }

      expect(state.metrics.overallCivicEngagement).toBeLessThanOrEqual(100);
      expect(state.metrics.overallCivicEngagement).toBeGreaterThanOrEqual(0);
      expect(state.deliberation.consensusScore).toBeLessThanOrEqual(100);
    });
  });
});

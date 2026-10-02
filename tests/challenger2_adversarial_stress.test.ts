/**
 * Challenger 2 Adversarial Stress Test Harness — NEURAPOLIS
 * 
 * Objectives:
 * 1. Strict Accounting Invariant:
 *    - Subject workshop and project ledgers to 10,000 randomized financial operations
 *      (revenues, expenses, investments, distributions, rounding edge cases with fractional centimes).
 *    - Verify ledgerInvariantHolds holds 100% of the time (ledgerBalance === balance).
 * 2. Simulation Determinism:
 *    - Test PRNG determinism across 100 simulated days on 2 identical seeds.
 *    - Verify exact bit-for-bit event sequence equality and complete state synchronization.
 * 3. Thinker Unlocking:
 *    - Test boundary conditions for checkAndUnlockThinkers (e.g. academicAverage 14.99 vs 15.00, notion stage 3 vs 4).
 *    - Verify strict idempotence (zero duplicates, zero re-notifications).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { dateOf, dayIndexOf } from '../src/core/clock';
import { runTicks } from '../src/simulation/engine';
import {
  acceptOrder, buySalvageParts, createWorkshop, deliverOrder, ensureAvailableOrders,
  ledgerBalance as wsLedgerBalance, ledgerInvariantHolds as wsLedgerInvariantHolds,
  maintainTools, postWorkshop, repairOrder, scavengeParts, setTariffMode,
  workshopDay, workshopWeeklyDistribution,
} from '../src/simulation/workshop';
import {
  buyStock, createProject,
  ledgerBalance as projLedgerBalance, ledgerInvariantHolds as projLedgerInvariantHolds,
  repartition, runCourse, runSalesSession, setPrice,
} from '../src/simulation/project';
import {
  checkAndUnlockThinkers, ensureGhostCompanionState, THINKER_UNLOCK_RULES,
} from '../src/simulation/ghost_companions';
import { ensureActionPlanningState } from '../src/simulation/action_plan';
import { rngNext, rngInt } from '../src/core/rng';
import type { RepairOrder, WorldState } from '../src/core/types';

const round2 = (v: number): number => Math.round(v * 100) / 100;

describe('Challenger 2 — Adversarial Stress Harness', () => {

  describe('1. Strict Accounting Invariant Stress Testing (10,000 Operations)', () => {

    it('Workshop Ledger : 10 000 opérations financières aléatoires et cas limites préservent l’invariant à 100%', () => {
      const w = createWorld({ seed: 421000 });
      w.player.relations['karim']!.confiance = 30;
      expect(createWorkshop(w).ok).toBe(true);
      const ws = w.workshop!;

      expect(wsLedgerInvariantHolds(ws)).toBe(true);
      expect(ws.balance).toBe(0);
      expect(wsLedgerBalance(ws)).toBe(0);

      // Ensemble de cas limites à injecter régulièrement
      const edgeCases = [
        0.001,      // sub-centime inf
        0.0049,     // sub-centime arrondi vers le bas
        0.005,      // sub-centime demi-arrondi vers le haut
        0.0051,     // sub-centime haut
        0.0099,     // presque un centime
        0.01,       // 1 centime
        0.07,       // 7 centimes (flottant connu pour 0.1 * 0.7 !== 0.07)
        0.14,
        0.28,
        0.333333,   // 1/3
        0.666667,   // 2/3
        Math.PI,    // 3.14159265...
        Math.SQRT2, // 1.41421356...
        -0.001,
        -0.005,
        -0.01,
        -0.07,
        -0.333333,
        9999.99,
        -5555.55,
        1e-6,
        -1e-6,
      ];

      let invariantFailures = 0;
      const totalOps = 10000;

      for (let i = 0; i < totalOps; i++) {
        w.time.tick += 10;
        let amount: number;

        if (i % 20 === 0) {
          // Injection systématique d'un cas limite
          amount = edgeCases[(i / 20) % edgeCases.length]!;
        } else if (i % 10 === 0) {
          // Alternance rapide de micro-centimes (+0.01 / -0.01)
          amount = (i % 4 === 0) ? 0.01 : -0.01;
        } else {
          // Opération aléatoire déterministe via w.rng
          const rand = rngNext(w);
          const sign = rngNext(w) > 0.45 ? 1 : -1;
          const mag = (rand * 250) + (rngNext(w) * 0.9999);
          amount = sign * mag;
        }

        postWorkshop(w, `Op_${i}_Stress`, amount);

        // Vérification de l'invariant après chaque opération
        if (!wsLedgerInvariantHolds(ws)) {
          invariantFailures++;
        }
      }

      // Assertions strictes
      expect(ws.ledger.length).toBe(totalOps + 1); // +1 dotation initiale Karim
      expect(invariantFailures).toBe(0);
      expect(wsLedgerInvariantHolds(ws)).toBe(true);
      expect(wsLedgerBalance(ws)).toBe(ws.balance);
      expect(Number.isFinite(ws.balance)).toBe(true);
    });

    it('Workshop Ledger : Cycle de gestion métier complet sur 500 opérations réelles (achats, réparations, livraisons, distributions)', () => {
      const w = createWorld({ seed: 888123 });
      w.player.relations['karim']!.confiance = 40;
      w.player.money = 2000;
      createWorkshop(w);
      const ws = w.workshop!;

      let cyclesCount = 0;

      for (let day = 1; day <= 60; day++) {
        w.time.tick = day * 144;
        workshopDay(w);

        // Fouille ou achat de pièces
        scavengeParts(w);
        if (ws.partsStock < 5) {
          buySalvageParts(w);
          expect(wsLedgerInvariantHolds(ws)).toBe(true);
        }

        // Maintenance des outils si usés
        if (ws.toolCondition < 35) {
          maintainTools(w);
          expect(wsLedgerInvariantHolds(ws)).toBe(true);
        }

        // Traitement de toutes les commandes disponibles
        const available = [...ws.orders.filter((o) => o.status === 'disponible')];
        for (const ord of available) {
          const tariff = ord.difficulty > 2 ? 'soutien' : (ord.difficulty === 1 ? 'solidaire' : 'standard');
          acceptOrder(w, ord.id, tariff);
          if (ws.partsStock >= ord.partsRequired && ws.toolCondition >= 20) {
            repairOrder(w, ord.id);
            deliverOrder(w, ord.id);
            expect(wsLedgerInvariantHolds(ws)).toBe(true);
            cyclesCount++;
          }
        }

        // Répartition hebdomadaire tous les 7 jours
        if (day % 7 === 0) {
          const mode = day % 21 === 0 ? 'incitation' : (day % 14 === 0 ? 'egalite' : 'equite');
          workshopWeeklyDistribution(w, mode);
          expect(wsLedgerInvariantHolds(ws)).toBe(true);
        }
      }

      expect(cyclesCount).toBeGreaterThan(30);
      expect(wsLedgerInvariantHolds(ws)).toBe(true);
      expect(wsLedgerBalance(ws)).toBe(ws.balance);
    });

    it('Project Ledger : 10 000 opérations financières et cas limites préservent l’invariant à 100%', () => {
      const w = createWorld({ seed: 551000 });
      expect(createProject(w).ok).toBe(true);
      const p = w.project!;

      expect(projLedgerInvariantHolds(p)).toBe(true);
      expect(p.balance).toBe(0);
      expect(projLedgerBalance(p)).toBe(0);

      const edgeCases = [
        0.001, 0.0049, 0.005, 0.0051, 0.0099, 0.01, 0.07, 0.14, 0.28,
        0.333333, 0.666667, Math.PI, Math.SQRT2, -0.001, -0.005, -0.01,
        -0.07, -0.333333, 9999.99, -5555.55, 1e-6, -1e-6,
      ];

      // Helper fidèle à post(w) de project.ts
      function testPostProject(wState: WorldState, label: string, amount: number): void {
        const prj = wState.project;
        if (!prj) return;
        const a = round2(amount);
        const day = dayIndexOf(wState.time.tick);
        prj.ledger.push({ day, date: dateOf(day).iso, label, amount: a });
        prj.balance = round2(prj.balance + a);
      }

      let invariantFailures = 0;
      const totalOps = 10000;

      for (let i = 0; i < totalOps; i++) {
        w.time.tick += 10;
        let amount: number;

        if (i % 20 === 0) {
          amount = edgeCases[(i / 20) % edgeCases.length]!;
        } else if (i % 10 === 0) {
          amount = (i % 4 === 0) ? 0.01 : -0.01;
        } else {
          const rand = rngNext(w);
          const sign = rngNext(w) > 0.45 ? 1 : -1;
          const mag = (rand * 300) + (rngNext(w) * 0.9999);
          amount = sign * mag;
        }

        testPostProject(w, `Stand_Op_${i}`, amount);

        if (!projLedgerInvariantHolds(p)) {
          invariantFailures++;
        }
      }

      expect(p.ledger.length).toBe(totalOps);
      expect(invariantFailures).toBe(0);
      expect(projLedgerInvariantHolds(p)).toBe(true);
      expect(projLedgerBalance(p)).toBe(p.balance);
      expect(Number.isFinite(p.balance)).toBe(true);
    });

    it('Project Ledger : Cycle économique réel du Stand des Roses (stocks, ventes, courses, répartitions)', () => {
      const w = createWorld({ seed: 777123 });
      createProject(w);
      const p = w.project!;
      w.player.money = 500;
      w.player.skills.communication.level = 3;
      p.members = ['noah', 'lina'];
      p.work['player'] = 10;
      p.work['noah'] = 8;
      p.work['lina'] = 6;

      for (let day = 1; day <= 35; day++) {
        w.time.tick = day * 144 + 60;

        // Achat de stock si besoin
        if (p.stock < 10 && (p.balance + w.player.money) >= 15) {
          buyStock(w);
          expect(projLedgerInvariantHolds(p)).toBe(true);
        }

        // Sessions de vente
        if (p.stock > 0) {
          runSalesSession(w, 'place');
          expect(projLedgerInvariantHolds(p)).toBe(true);
        }

        // Service de courses
        runCourse(w);
        expect(projLedgerInvariantHolds(p)).toBe(true);

        // Répartition dominicale
        if (day % 7 === 0) {
          const mode = day % 21 === 0 ? 'incitation' : (day % 14 === 0 ? 'equite' : 'egalite');
          if (p.week.revenue > p.week.expenses && p.balance > 0) {
            repartition(w, mode);
            expect(projLedgerInvariantHolds(p)).toBe(true);
          }
        }
      }

      expect(projLedgerInvariantHolds(p)).toBe(true);
      expect(projLedgerBalance(p)).toBe(p.balance);
    });

  });

  describe('2. Simulation Determinism Stress Testing (100 Simulated Days)', () => {

    it('Deux mondes avec la même seed restent bit-à-bit strictement identiques sur 100 jours de simulation (14 400 ticks)', () => {
      const seed = 987654321;
      const w1 = createWorld({ seed });
      const w2 = createWorld({ seed });

      // Vérification initiale
      expect(w1.rng).toBe(w2.rng);
      const initialTick = w1.time.tick;
      expect(initialTick).toBe(43); // mardi 1er septembre 2020, 07:10 (réveil)
      expect(w2.time.tick).toBe(43);

      const totalDays = 100;
      const ticksPerDay = 144;

      for (let day = 1; day <= totalDays; day++) {
        const notifs1 = runTicks(w1, ticksPerDay);
        const notifs2 = runTicks(w2, ticksPerDay);

        // 1. Horloge & PRNG
        expect(w1.time.tick).toBe(initialTick + day * ticksPerDay);
        expect(w2.time.tick).toBe(initialTick + day * ticksPerDay);
        expect(w1.rng).toBe(w2.rng);

        // 2. Notifications produites durant la journée
        expect(notifs1).toEqual(notifs2);

        // 3. Événements du journal et historique
        expect(w1.events.length).toBe(w2.events.length);
        expect(w1.lifeJournal.length).toBe(w2.lifeJournal.length);

        // 4. Variables d'état critiques du joueur
        expect(w1.player.money).toBe(w2.player.money);
        expect(w1.player.reputation).toBe(w2.player.reputation);
        expect(w1.player.needs).toEqual(w2.player.needs);
        expect(w1.player.characteristics).toEqual(w2.player.characteristics);

        // 5. Macro News feed
        if (w1.macroNews || w2.macroNews) {
          expect(w1.macroNews?.feed).toEqual(w2.macroNews?.feed);
          expect(w1.macroNews?.currentTrend).toBe(w2.macroNews?.currentTrend);
          expect(w1.macroNews?.costModifier).toBe(w2.macroNews?.costModifier);
        }

        // 6. District & rivaux
        expect(w1.district).toEqual(w2.district);
        expect(w1.rivals).toEqual(w2.rivals);
      }

      // Vérification finale exhaustive de l'ensemble des événements
      expect(w1.events).toEqual(w2.events);
      expect(w1.lifeJournal).toEqual(w2.lifeJournal);
      expect(w1.events.length).toBeGreaterThan(10);
    }, 60000);

    it('Deux seeds différentes divergent immédiatement', () => {
      const wA = createWorld({ seed: 11111 });
      const wB = createWorld({ seed: 22222 });

      runTicks(wA, 144 * 5);
      runTicks(wB, 144 * 5);

      expect(wA.rng).not.toBe(wB.rng);
      expect(wA.events).not.toEqual(wB.events);
    });

  });

  describe('3. Thinker Unlocking Boundary Conditions & Idempotence', () => {

    it('Boundary conditions : Walras (14.99 vs 15.00 moyenne, 39 vs 40 compréhension)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      // Cas 1 : 14.99 et 40 -> NON
      if (w.schoolLife) w.schoolLife.academicAverage = 14.99;
      w.player.characteristics.comprehension = 40;
      expect(checkAndUnlockThinkers(w)).toEqual([]);
      expect(gc.unlockedThinkers.includes('walras')).toBe(false);

      // Cas 2 : 15.00 et 39 -> NON
      if (w.schoolLife) w.schoolLife.academicAverage = 15.00;
      w.player.characteristics.comprehension = 39;
      expect(checkAndUnlockThinkers(w)).toEqual([]);
      expect(gc.unlockedThinkers.includes('walras')).toBe(false);

      // Cas 3 : Seuil exact 15.00 et 40 -> DÉBLOQUÉ
      if (w.schoolLife) w.schoolLife.academicAverage = 15.00;
      w.player.characteristics.comprehension = 40;
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.length).toBe(1);
      expect(notifs[0]?.ghost).toBe('walras');
      expect(gc.unlockedThinkers).toContain('walras');
    });

    it('Boundary conditions : Taylor (discipline 49 vs 50, cours consécutifs 4 vs 5)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      // Discipline 49, cours 5 -> NON
      w.player.characteristics.discipline = 49;
      if (w.schoolLife) w.schoolLife.consecutiveClassesAttended = 5;
      expect(checkAndUnlockThinkers(w)).toEqual([]);

      // Discipline 50, cours 4 -> NON
      w.player.characteristics.discipline = 50;
      if (w.schoolLife) w.schoolLife.consecutiveClassesAttended = 4;
      expect(checkAndUnlockThinkers(w)).toEqual([]);

      // Discipline 50, cours 5 -> DÉBLOQUÉ
      w.player.characteristics.discipline = 50;
      if (w.schoolLife) w.schoolLife.consecutiveClassesAttended = 5;
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.some((n) => n.ghost === 'taylor')).toBe(true);
      expect(gc.unlockedThinkers).toContain('taylor');
    });

    it('Boundary conditions : Locke (assiduité 94.99 vs 95.00 %, injustices 0 vs 1)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      // 94.99% et injustice 1 -> NON
      if (w.schoolLife) w.schoolLife.attendanceRate = 94.99;
      w.flags['injustices'] = 1;
      expect(checkAndUnlockThinkers(w)).toEqual([]);

      // 95.00% et injustice 0 -> NON
      if (w.schoolLife) w.schoolLife.attendanceRate = 95.00;
      w.flags['injustices'] = 0;
      expect(checkAndUnlockThinkers(w)).toEqual([]);

      // 95.00% et injustice 1 -> DÉBLOQUÉ
      if (w.schoolLife) w.schoolLife.attendanceRate = 95.00;
      w.flags['injustices'] = 1;
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.some((n) => n.ghost === 'locke')).toBe(true);
      expect(gc.unlockedThinkers).toContain('locke');
    });

    it('Boundary conditions : Ostrom (notion confiance_incitations stade 3 vs stade 4)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      w.player.notions['confiance_incitations'] = { id: 'confiance_incitations', stage: 3, applications: 2 };
      expect(checkAndUnlockThinkers(w)).toEqual([]);
      expect(gc.unlockedThinkers.includes('ostrom')).toBe(false);

      w.player.notions['confiance_incitations'] = { id: 'confiance_incitations', stage: 4, applications: 3 };
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.some((n) => n.ghost === 'ostrom')).toBe(true);
      expect(gc.unlockedThinkers).toContain('ostrom');
    });

    it('Boundary conditions : Marx (notion egalite_equite_incitation stade 3 vs stade 4)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      w.player.notions['egalite_equite_incitation'] = { id: 'egalite_equite_incitation', stage: 3, applications: 1 };
      expect(checkAndUnlockThinkers(w)).toEqual([]);
      expect(gc.unlockedThinkers.includes('marx')).toBe(false);

      w.player.notions['egalite_equite_incitation'] = { id: 'egalite_equite_incitation', stage: 4, applications: 2 };
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.some((n) => n.ghost === 'marx')).toBe(true);
      expect(gc.unlockedThinkers).toContain('marx');
    });

    it('Boundary conditions : Keynes (notion prevision_incertaine stade 3 vs stade 4)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      w.player.notions['prevision_incertaine'] = { id: 'prevision_incertaine', stage: 3, applications: 2 };
      expect(checkAndUnlockThinkers(w)).toEqual([]);
      expect(gc.unlockedThinkers.includes('keynes')).toBe(false);

      w.player.notions['prevision_incertaine'] = { id: 'prevision_incertaine', stage: 4, applications: 3 };
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.some((n) => n.ghost === 'keynes')).toBe(true);
      expect(gc.unlockedThinkers).toContain('keynes');
    });

    it('Boundary conditions : Schumpeter (expansion quartier vs inter_quartiers, adaptabilité 44.99 vs 45)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      const ap = ensureActionPlanningState(w);
      gc.unlockedThinkers = [];

      // Quartier et 45 -> NON
      ap.expansionLevel = 'quartier';
      w.player.characteristics.adaptabilite = 45;
      expect(checkAndUnlockThinkers(w)).toEqual([]);

      // Inter-quartiers et 44.99 -> NON
      ap.expansionLevel = 'inter_quartiers';
      w.player.characteristics.adaptabilite = 44.99;
      expect(checkAndUnlockThinkers(w)).toEqual([]);

      // Inter-quartiers et 45.00 -> DÉBLOQUÉ
      ap.expansionLevel = 'inter_quartiers';
      w.player.characteristics.adaptabilite = 45;
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.some((n) => n.ghost === 'schumpeter')).toBe(true);
      expect(gc.unlockedThinkers).toContain('schumpeter');
    });

    it('Boundary conditions : Smith (échanges 0 vs 1)', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      w.flags['echanges'] = 0;
      expect(checkAndUnlockThinkers(w)).toEqual([]);
      expect(gc.unlockedThinkers.includes('smith')).toBe(false);

      w.flags['echanges'] = 1;
      const notifs = checkAndUnlockThinkers(w);
      expect(notifs.some((n) => n.ghost === 'smith')).toBe(true);
      expect(gc.unlockedThinkers).toContain('smith');
    });

    it('Idempotence Stricte : 1000 exécutions consécutives de checkAndUnlockThinkers ne produisent aucun doublon ni re-notification', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      // Mettre en place les conditions pour débloquer l'ensemble des 8 penseurs
      w.flags['echanges'] = 5;
      if (w.schoolLife) {
        w.schoolLife.academicAverage = 17;
        w.schoolLife.consecutiveClassesAttended = 10;
        w.schoolLife.attendanceRate = 98;
      }
      w.player.characteristics.comprehension = 50;
      w.player.characteristics.discipline = 60;
      w.player.characteristics.adaptabilite = 55;
      w.flags['injustices'] = 2;
      w.player.notions['confiance_incitations'] = { id: 'confiance_incitations', stage: 4, applications: 4 };
      w.player.notions['egalite_equite_incitation'] = { id: 'egalite_equite_incitation', stage: 4, applications: 3 };
      w.player.notions['prevision_incertaine'] = { id: 'prevision_incertaine', stage: 4, applications: 3 };
      const ap = ensureActionPlanningState(w);
      ap.expansionLevel = 'regionale';

      // Premier appel : tous les 8 penseurs doivent se débloquer
      const initialNotifs = checkAndUnlockThinkers(w);
      expect(initialNotifs.length).toBe(8);
      expect(gc.unlockedThinkers.length).toBe(8);
      expect(new Set(gc.unlockedThinkers).size).toBe(8);

      // Appels 2 à 1000 : ZÉRO nouvelle notification, ZÉRO doublon dans unlockedThinkers
      for (let run = 2; run <= 1000; run++) {
        const subsequentNotifs = checkAndUnlockThinkers(w);
        expect(subsequentNotifs.length).toBe(0);
        expect(gc.unlockedThinkers.length).toBe(8);
      }

      expect(new Set(gc.unlockedThinkers).size).toBe(8);
      expect(gc.unlockedThinkers).toEqual([
        'smith', 'walras', 'taylor', 'locke', 'ostrom', 'marx', 'keynes', 'schumpeter',
      ]);
    });

    it('Adversarial Boundary Flaw : Schumpeter se débloque par inadvertance si actionPlanning est undefined mais adaptabilité >= 45', () => {
      const w = createWorld();
      const gc = ensureGhostCompanionState(w);
      gc.unlockedThinkers = [];

      // Vulnérabilité d'implémentation documentée par Challenger 2 :
      // La règle utilise `w.actionPlanning?.expansionLevel !== 'quartier'`.
      // Si w.actionPlanning est undefined (sauvegarde ancienne ou objet partiel),
      // `undefined !== 'quartier'` est vrai (true).
      w.actionPlanning = undefined as any;
      w.player.characteristics.adaptabilite = 45;

      const notifs = checkAndUnlockThinkers(w);
      // Ceci prouve empiriquement la faiblesse de la condition négative :
      expect(notifs.some((n) => n.ghost === 'schumpeter')).toBe(true);
      expect(gc.unlockedThinkers).toContain('schumpeter');
    });

  });

  describe('4. Deep Adversarial Stress & Interactive Determinism', () => {

    it('Déterminisme interactif : Deux mondes exécutant la même séquence d’actions joueur restent bit-à-bit identiques sur 100 jours', () => {
      const seed = 314159265;
      const w1 = createWorld({ seed });
      const w2 = createWorld({ seed });

      for (let day = 1; day <= 100; day++) {
        // Ticks du matin
        runTicks(w1, 72);
        runTicks(w2, 72);

        // Action interactive déterministe le jour 3 : ouverture stand
        if (day === 3) {
          createProject(w1);
          createProject(w2);
        }

        // Action interactive le jour 5 : achat stock
        if (day === 5) {
          w1.player.money += 20;
          w2.player.money += 20;
          buyStock(w1);
          buyStock(w2);
        }

        // Action interactive le jour 10 : ouverture atelier Karim
        if (day === 10) {
          w1.player.relations['karim']!.confiance = 25;
          w2.player.relations['karim']!.confiance = 25;
          createWorkshop(w1);
          createWorkshop(w2);
        }

        // Ticks de l'après-midi / soir
        runTicks(w1, 72);
        runTicks(w2, 72);

        expect(w1.rng).toBe(w2.rng);
      }

      expect(w1.events).toEqual(w2.events);
      expect(w1.lifeJournal).toEqual(w2.lifeJournal);
      expect(w1.player.money).toBe(w2.player.money);
      expect(w1.player.needs).toEqual(w2.player.needs);
    }, 60000);

    it('Dérive Flottante IEEE-754 : 50 000 opérations avec fractions non représentables exactement en binaire (0.1, 0.2, 0.7)', () => {
      const w = createWorld({ seed: 999111 });
      w.player.relations['karim']!.confiance = 30;
      createWorkshop(w);
      const ws = w.workshop!;

      const pathologicalAmounts = [0.1, 0.2, -0.3, 0.7, -0.7, 0.14, -0.14, 0.28, -0.28, 0.01, -0.01];

      for (let i = 0; i < 50000; i++) {
        const amt = pathologicalAmounts[i % pathologicalAmounts.length]!;
        postWorkshop(w, `Pathological_${i}`, amt);
      }

      expect(wsLedgerInvariantHolds(ws)).toBe(true);
      expect(wsLedgerBalance(ws)).toBe(ws.balance);
    });

  });

});


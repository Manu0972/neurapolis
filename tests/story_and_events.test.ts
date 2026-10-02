/**
 * NEURAPOLIS — Suite de Tests Unitaires & Intégration : Histoire, Quartiers, Personnages & Événements (Axe 2)
 * Valide les exigences R1, R2, R3 et l'intégrité narrative complète.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import {
  DISTRICTS,
  DISTRICT_BY_ID,
  CANONICAL_DISTRICTS,
  type ExtendedDistrictId,
} from '../src/data/districts';
import {
  NPCS_EXPANDED,
  CANONICAL_CHARACTERS_14,
  CANONICAL_CHARACTERS_15,
  EXPANDED_NPC_BY_ID,
} from '../src/data/npcs_expanded';
import {
  GHOST_JOUST_DEFS,
  GHOST_JOUST_BY_ID,
} from '../src/data/ghosts/joutes';
import {
  INTERACTIVE_EVENTS,
  INTERACTIVE_EVENTS_BY_ID,
  type EventCategory,
} from '../src/data/events/interactive_events';

describe('NEURAPOLIS Axis 2: Histoire, Quartiers, Personnages & Événements', () => {

  // ==========================================================================
  // 1. CARTOGRAPHIE & LORE DES 5 NOUVEAUX QUARTIERS (+ Cité des Roses)
  // ==========================================================================
  describe('1. Cartographie & Nouveaux Quartiers', () => {
    it('1.1 — Exactement 6 quartiers répertoriés (Roses + 5 nouveaux)', () => {
      expect(DISTRICTS.length).toBe(6);
      const expectedIds: ExtendedDistrictId[] = ['roses', 'docks', 'hauts', 'bassin', 'caves', 'tramway'];
      for (const id of expectedIds) {
        expect(DISTRICT_BY_ID[id]).toBeDefined();
        expect(CANONICAL_DISTRICTS[id]).toBeDefined();
      }
    });

    it('1.2 — Chaque quartier possède au moins 4 POIs avec descriptions et ambiance', () => {
      for (const d of DISTRICTS) {
        expect(d.pois.length).toBeGreaterThanOrEqual(4);
        expect(d.poiDetails).toBeDefined();
        expect(d.poiDetails!.length).toBeGreaterThanOrEqual(4);

        for (const poi of d.poiDetails!) {
          expect(poi.id.length).toBeGreaterThan(0);
          expect(poi.name.length).toBeGreaterThan(0);
          expect(poi.description.length).toBeGreaterThan(20);
          expect(poi.atmosphere.length).toBeGreaterThan(15);
          expect(poi.systemicRole.length).toBeGreaterThan(15);
          expect(poi.suggestedActivities.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('1.3 — Respect de la charte hygge 1800K pour tous les quartiers', () => {
      for (const d of DISTRICTS) {
        expect(d.ambientKelvin).toBe(1800);
      }
    });

    it('1.4 — Chaque quartier dispose d’acteurs clés et de fantômes dominants', () => {
      for (const d of DISTRICTS) {
        expect(d.keyNpcs.length).toBeGreaterThanOrEqual(2);
        expect(d.dominantGhosts.length).toBeGreaterThanOrEqual(2);
        expect(d.economicRole.length).toBeGreaterThan(20);
      }
    });

    it('1.5 — Le réseau de transitions entre quartiers est cohérent', () => {
      for (const d of DISTRICTS) {
        const transitionKeys = Object.keys(d.transitions);
        expect(transitionKeys.length).toBeGreaterThanOrEqual(1);
        for (const key of transitionKeys) {
          const trans = d.transitions[key]!;
          expect(DISTRICT_BY_ID[trans.targetDistrict]).toBeDefined();
          expect(trans.targetPoi.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ==========================================================================
  // 2. APPROFONDISSEMENT PSYCHOLOGIQUE DES HABITANTS (15 PNJ)
  // ==========================================================================
  describe('2. Galerie des 15 Personnages Approfondis', () => {
    it('2.1 — Les 15 fiches de personnages sont complètes et typées', () => {
      expect(NPCS_EXPANDED.length).toBe(15);
      expect(CANONICAL_CHARACTERS_15.length).toBe(15);
      expect(CANONICAL_CHARACTERS_14.length).toBe(14); // Rétrocompatibilité M2
    });

    it('2.2 — Chaque habitant a au moins 3 traits, un secret intime, un tic comique et un hook', () => {
      for (const pnj of NPCS_EXPANDED) {
        expect(pnj.id.length).toBeGreaterThan(0);
        expect(pnj.name.length).toBeGreaterThan(0);
        expect(pnj.age).toBeGreaterThan(0);
        expect(pnj.traits.length).toBeGreaterThanOrEqual(3);
        expect(pnj.intimateSecret.length).toBeGreaterThan(25);
        expect(pnj.humorAndTics.length).toBeGreaterThan(20);
        expect(pnj.systemicHook.length).toBeGreaterThan(25);
      }
    });

    it('2.3 — Fiches signatures (Noah, Lina, Bertin, Samir, Karim, Gaspard, Louison, Solange)', () => {
      const noah = EXPANDED_NPC_BY_ID['noah']!;
      expect(noah.intimateSecret).toContain('Échappés du Val');
      expect(noah.humorAndTics).toContain('casquette');

      const lina = EXPANDED_NPC_BY_ID['lina']!;
      expect(lina.intimateSecret).toContain('poèmes');
      expect(lina.humorAndTics).toContain('stylo 4-couleurs');

      const bertin = EXPANDED_NPC_BY_ID['bertin']!;
      expect(bertin.intimateSecret).toContain('tisanes');
      expect(bertin.humorAndTics).toContain('Léon');

      const samir = EXPANDED_NPC_BY_ID['samir']!;
      expect(samir.intimateSecret).toContain('factures');

      const karim = EXPANDED_NPC_BY_ID['karim']!;
      expect(karim.intimateSecret).toContain('DS 19');
      expect(karim.humorAndTics).toContain('CLANG');

      const gaspard = EXPANDED_NPC_BY_ID['gaspard_vaneck']!;
      expect(gaspard.intimateSecret).toContain('chats');
      expect(gaspard.humorAndTics).toContain('74 clés');

      const louison = EXPANDED_NPC_BY_ID['louison_zephir']!;
      expect(louison.intimateSecret).toContain('crise sanitaire');

      const solange = EXPANDED_NPC_BY_ID['solange_vasseur']!;
      expect(solange.humorAndTics).toContain('valse');
    });

    it('2.4 — Chaque habitant possède une routine et des répliques diégétiques', () => {
      for (const pnj of NPCS_EXPANDED) {
        expect(pnj.routine.length).toBeGreaterThanOrEqual(1);
        expect(pnj.dialoguePharesi.accueil.length).toBeGreaterThanOrEqual(1);
        if (pnj.specialAbility) {
          expect(pnj.specialAbility.id.length).toBeGreaterThan(0);
          expect(pnj.specialAbility.label.length).toBeGreaterThan(0);
          expect(pnj.specialAbility.effectDescription.length).toBeGreaterThan(10);
        }
      }
    });
  });

  // ==========================================================================
  // 3. JOUTES VERBALES DÉCHAÎNÉES DES 5 FANTÔMES
  // ==========================================================================
  describe('3. Joutes Verbales des Fantômes', () => {
    it('3.1 — Exactement 8 joutes verbales complètes répertoriées', () => {
      expect(GHOST_JOUST_DEFS.length).toBe(8);
      const expectedIds = [
        'joute_pause_cafe',
        'joute_croissant_beurre',
        'joute_prise_electrique',
        'joute_pommes_fletries',
        'joute_balai_atelier',
        'joute_cadenas_recettes',
        'joute_affiche_dessinee',
        'joute_wifi_ouvert',
      ];
      for (const id of expectedIds) {
        expect(GHOST_JOUST_BY_ID[id]).toBeDefined();
      }
    });

    it('3.2 — Chaque joute implique au moins 3 penseurs avec répliques substantielles', () => {
      for (const j of GHOST_JOUST_DEFS) {
        expect(j.thinkers.length).toBeGreaterThanOrEqual(3);
        expect(j.dialogueExchanges.length).toBeGreaterThanOrEqual(3);
        for (const exchange of j.dialogueExchanges) {
          expect(exchange.ghost.length).toBeGreaterThan(0);
          expect(exchange.quote.length).toBeGreaterThan(30);
        }
      }
    });

    it('3.3 — Chaque joute offre 2 ou 3 options aux alignements doctrinaux explicites', () => {
      const allowedDoctrines = ['marche', 'communs', 'autorite', 'solidarite'];
      for (const j of GHOST_JOUST_DEFS) {
        expect(j.options.length).toBeGreaterThanOrEqual(2);
        for (const opt of j.options) {
          expect(allowedDoctrines).toContain(opt.philosophicalAlignment);
          expect(typeof opt.impactOnTeam.fatigueDelta).toBe('number');
          expect(typeof opt.impactOnTeam.stressDelta).toBe('number');
          expect(typeof opt.impactOnTeam.moraleDelta).toBe('number');
          expect(typeof opt.impactOnBusiness.speedMultiplier).toBe('number');
          expect(typeof opt.impactOnBusiness.marginDelta).toBe('number');
          expect(typeof opt.impactOnBusiness.customerTrustDelta).toBe('number');
        }
      }
    });

    it('3.4 — Joute 1 (La Pause-Café) vérifie le contrat d’impact psychologique et d’efficacité', () => {
      const j1 = GHOST_JOUST_BY_ID['joute_pause_cafe']!;
      expect(j1.thinkers).toContain('taylor');
      expect(j1.thinkers).toContain('marx');
      expect(j1.thinkers).toContain('dejours');
      // Option Taylor augmente la vitesse
      expect(j1.options[0]!.impactOnBusiness.speedMultiplier).toBeGreaterThan(1.0);
      // Option Dejours réduit le stress
      expect(j1.options[1]!.impactOnTeam.stressDelta).toBeLessThan(0);
    });

    it('3.5 — Joute 3 (La Prise Électrique) vérifie l’application de la gouvernance Ostromienne', () => {
      const j3 = GHOST_JOUST_BY_ID['joute_prise_electrique']!;
      expect(j3.thinkers).toContain('ostrom');
      expect(j3.thinkers).toContain('hobbes');
      expect(j3.thinkers).toContain('locke');
      const ostromOpt = j3.options.find((o) => o.philosophicalAlignment === 'communs');
      expect(ostromOpt).toBeDefined();
      expect(ostromOpt!.impactOnTeam.stressDelta).toBeLessThan(0);
      expect(ostromOpt!.impactOnBusiness.customerTrustDelta).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 4. CATALOGUE DES 32 ÉVÉNEMENTS ÉMERGENTS
  // ==========================================================================
  describe('4. Catalogue des 32 Événements Émergents', () => {
    it('4.1 — Au moins 32 événements émergents structurés sont définis', () => {
      expect(INTERACTIVE_EVENTS.length).toBeGreaterThanOrEqual(32);
    });

    it('4.2 — Les 6 catégories thématiques sont représentées', () => {
      const categories: EventCategory[] = [
        'canal_faune',
        'glitch_urbain',
        'guerre_commerciale',
        'rivalites_locales',
        'joutes_fantomes',
        'economie_emergente',
      ];
      for (const cat of categories) {
        const evtsInCat = INTERACTIVE_EVENTS.filter((e) => e.category === cat);
        expect(evtsInCat.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('4.3 — Les 5 événements majeurs obligatoires de la mission sont présents', () => {
      expect(INTERACTIVE_EVENTS_BY_ID['EVT_CANARDS_CANAL']).toBeDefined();
      expect(INTERACTIVE_EVENTS_BY_ID['EVT_PANNE_GEANTE_BANQUET']).toBeDefined();
      expect(INTERACTIVE_EVENTS_BY_ID['EVT_TRESOR_CANALISATIONS']).toBeDefined();
      expect(INTERACTIVE_EVENTS_BY_ID['EVT_TOURNOI_ECHECS_NAVETS']).toBeDefined();
      expect(INTERACTIVE_EVENTS_BY_ID['EVT_DRONES_LANCE_PIERRES']).toBeDefined();
    });

    it('4.4 — Chaque événement a une condition fonctionnelle et au moins 2 choix traçables', () => {
      const mockWorld = createWorld();

      for (const evt of INTERACTIVE_EVENTS) {
        expect(evt.id.length).toBeGreaterThan(0);
        expect(evt.title.length).toBeGreaterThan(0);
        expect(evt.prompt.length).toBeGreaterThan(15);
        expect(typeof evt.condition(mockWorld)).toBe('boolean');
        expect(evt.choices.length).toBeGreaterThanOrEqual(2);

        for (const ch of evt.choices) {
          expect(ch.text.length).toBeGreaterThan(0);
          expect(ch.consequences).toBeDefined();
          expect(ch.consequences.causes).toBeDefined();
          expect(ch.consequences.causes.length).toBeGreaterThanOrEqual(1);
          expect(ch.consequences.causes[0]!.facteur.length).toBeGreaterThan(5);
          expect(ch.consequences.causes[0]!.poids).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('4.5 — Application déterministe d’un événement sur le WorldState', () => {
      const w = createWorld();
      const initialRep = w.player.reputation;
      const initialVitalite = w.district.vitaliteEpicerie;
      const initialMoney = w.player.money;

      const evtCanards = INTERACTIVE_EVENTS_BY_ID['EVT_CANARDS_CANAL']!;
      expect(evtCanards.condition(w)).toBe(true);

      // Choix 1 : Vente de graines
      const choice1 = evtCanards.choices[0]!;
      w.player.money += choice1.consequences.moneyDelta ?? 0;
      w.player.reputation += choice1.consequences.reputationDelta ?? 0;
      w.district.vitaliteEpicerie += choice1.consequences.vitaliteEpicerieDelta ?? 0;

      expect(w.player.money).toBe(initialMoney + 8);
      expect(w.player.reputation).toBe(initialRep + 3);
      expect(w.district.vitaliteEpicerie).toBe(initialVitalite + 4);
    });

    it('4.6 — Citation des fantômes présente sur les événements réflexifs', () => {
      const evtTaylor = INTERACTIVE_EVENTS_BY_ID['EVT_TAYLOR_PAUSE_CAFE']!;
      expect(evtTaylor.choices[0]!.ghostQuotes).toBeDefined();
      expect(evtTaylor.choices[0]!.ghostQuotes!.dejours).toBeDefined();
      expect(evtTaylor.choices[0]!.ghostQuotes!.taylor).toBeDefined();
    });
  });
});

/**
 * Tests M6 — fusions & antagonistes (contrat §3 M6) :
 *  - affinités par paire (+1 quand deux voix actives approuvent la même décision) ;
 *  - fusion Smith+Ostrom : conditions EXACTES (≥3 « marché » ET ≥3 « communs »
 *    avec les deux voix actives, affinité ≥6) → scène → composite « Le Marché
 *    des Communs » (voix alternées, coopérative pérenne : ventes du week-end
 *    sans présence), réactions (Marx jaloux, Weber curieux) ;
 *  - Contrat de Sécurité (Hobbes) : proposé après un incident, rendement +20 %,
 *    amitié −2/semaine, sortie uniquement par vote unanime ET amitié ≥ 60 ;
 *  - Taylor hostile : sabotage −15 %, chronométrage des PNJ (stress +),
 *    jauge allianceDesOmbres à chaque refus ;
 *  - cohérence (revue M6) : chaque déclencheur du §6 est atteignable par le jeu
 *    réel, chaque flag d'apparition est armé par au moins un bump() du moteur.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import {
  councilAnswerAdvice, councilKeyDecision,
} from '../src/simulation/council';
import { affinityOf, fusionConfirm, pairKey } from '../src/simulation/fusions';
import {
  contractChoose, exitSecurityContract, securityPending, securityYieldFactor, weeklySecurityCost,
} from '../src/simulation/security';
import {
  recordTaylorRefusal, taylorChronoDay, taylorSabotageFactor,
} from '../src/simulation/antagonists';
import {
  adoptSharedRules, buyStock, optimizeStand, projectDay, runSalesSession,
} from '../src/simulation/project';
import { applyPlaceAction } from '../src/simulation/places';
import { NOTIONS } from '../src/data/notions';
import { exportSave, importSave } from '../src/saves/persist';
import {
  choixEcoCouteux, coequipierAuBout, conflitDeRepartition, donneesExploitees, ecouter,
  incidentAuStand, maitriser, optimisationRatee, previsionsRatees, regleImposeeQuiEchoue,
  repartitionSimple, semaineDePerte, semaineSurchargee, standPret, troisSessionsReussies,
  tryPathTrigger, venduJusquAuBout,
} from './helpers';

const DAY = TICKS_PER_DAY;

/** Smith et Ostrom actifs par le jeu réel (achat → Smith ; règles partagées → Ostrom). */
function duoSmithOstrom(w: WorldState): void {
  w.flags['echanges'] = 1;
  runTicks(w, 1);
  ecouter(w, 'smith');
  standPret(w);
  expect(adoptSharedRules(w).ok).toBe(true);
  runTicks(w, 1);
  ecouter(w, 'ostrom');
}

/** Fusion complète (conditions exactes) — renvoie le monde prêt à la scène. */
function pretAFusionner(w: WorldState): void {
  duoSmithOstrom(w);
  councilKeyDecision(w, 'marche');
  councilKeyDecision(w, 'marche');
  councilKeyDecision(w, 'marche');
  councilKeyDecision(w, 'communs');
  councilKeyDecision(w, 'communs');
  councilKeyDecision(w, 'communs');
  runTicks(w, 1);
  expect(w.council.pendingFusion).toBe('marche_des_communs');
}

// ---------- Affinités par paire ----------

describe('affinités — +1 quand deux voix actives approuvent la même décision', () => {
  it('deux voix alignées sur la même doctrine gagnent +1', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    w.flags['semainesPerte'] = 1;
    runTicks(w, 1);
    ecouter(w, 'smith'); // doctrine : marche
    ecouter(w, 'keynes'); // doctrine : marche
    expect(affinityOf(w, 'smith', 'keynes')).toBe(0);
    councilKeyDecision(w, 'marche');
    expect(affinityOf(w, 'smith', 'keynes')).toBe(1);
    expect(pairKey('keynes', 'smith')).toBe('keynes+smith'); // clé triée, stable
  });

  it('une voix contraire à la décision n’engrange aucune affinité', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    w.flags['conflitsRepartition'] = 1;
    runTicks(w, 1);
    ecouter(w, 'smith'); // marche
    ecouter(w, 'marx');  // solidarite — contraire
    councilKeyDecision(w, 'marche');
    expect(affinityOf(w, 'smith', 'marx')).toBe(0);
  });

  it('deux voix présentes mais aucune alignée : rien', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    w.flags['semainesPerte'] = 1;
    runTicks(w, 1);
    ecouter(w, 'smith');  // marche
    ecouter(w, 'keynes'); // marche
    councilKeyDecision(w, 'communs'); // aucune des deux alignée (et aucune contraire)
    expect(affinityOf(w, 'smith', 'keynes')).toBe(0);
  });
});

// ---------- Fusion Smith + Ostrom : conditions exactes ----------

describe('fusion Smith+Ostrom — conditions EXACTES du contrat', () => {
  it('progresse par décisions prises avec les deux voix actives, rien avant 3+3+6', () => {
    const w = createWorld();
    duoSmithOstrom(w);
    expect(w.council.fusionProgress['marche_des_communs']).toEqual({ marches: 0, communs: 0 });

    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'marche');
    expect(w.council.fusionProgress['marche_des_communs']).toEqual({ marches: 2, communs: 0 });
    expect(affinityOf(w, 'smith', 'ostrom')).toBe(2);
    runTicks(w, 1);
    expect(w.council.pendingFusion).toBeUndefined();

    councilKeyDecision(w, 'marche');
    expect(w.council.fusionProgress['marche_des_communs']).toEqual({ marches: 3, communs: 0 });
    runTicks(w, 1);
    expect(w.council.pendingFusion).toBeUndefined(); // communs < 3

    councilKeyDecision(w, 'communs');
    councilKeyDecision(w, 'communs');
    expect(affinityOf(w, 'smith', 'ostrom')).toBe(5);
    runTicks(w, 1);
    expect(w.council.pendingFusion).toBeUndefined(); // affinité 5 < 6

    councilKeyDecision(w, 'communs');
    expect(affinityOf(w, 'smith', 'ostrom')).toBe(6);
    expect(w.council.pendingFusion).toBeUndefined(); // la scène attend le prochain tick
    runTicks(w, 1);
    expect(w.council.pendingFusion).toBe('marche_des_communs');
    expect(w.council.ghosts['smith']?.status).toBe('actif'); // rien ne bouge avant le choix
  });

  it('les décisions sans les deux voix actives ne comptent pas', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    ecouter(w, 'smith'); // Ostrom absent
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'marche');
    expect(w.council.fusionProgress['marche_des_communs']).toEqual({ marches: 0, communs: 0 });
    runTicks(w, 1);
    expect(w.council.pendingFusion).toBeUndefined();
  });

  it('la scène puis le choix : composite actif, smith et ostrom « fusionne », déblocage', () => {
    const w = createWorld();
    pretAFusionner(w);
    const r = fusionConfirm(w);
    expect(r.ok).toBe(true);
    expect(w.council.ghosts['smith']?.status).toBe('fusionne');
    expect(w.council.ghosts['ostrom']?.status).toBe('fusionne');
    const composite = w.council.ghosts['marche_des_communs'];
    expect(composite?.status).toBe('actif');
    expect(composite?.loyalty).toBe(50);
    expect(composite?.fiabilite).toBe(60);
    expect(w.council.fusionsDone).toContain('marche_des_communs');
    expect(w.council.pendingFusion).toBeUndefined();
    expect(w.events.some((e) => e.title === 'Fusion — Le Marché des Communs')).toBe(true);
    const evt = w.events.find((e) => e.title === 'Fusion — Le Marché des Communs');
    expect(evt?.causes).toContainEqual({ facteur: 'décisions « marché » avec les deux voix', seuil: '3', poids: 2 });
    // Pas de nouvelle fusion possible, pas de doublon.
    runTicks(w, DAY);
    expect(w.council.pendingFusion).toBeUndefined();
    expect(w.council.fusionsDone.filter((x) => x === 'marche_des_communs')).toHaveLength(1);
  });

  it('réactions : Marx jaloux, Weber curieux — seulement s’ils sont déjà là', () => {
    const w = createWorld();
    pretAFusionner(w);
    expect(w.events.some((e) => e.title === 'Marx observe la fusion')).toBe(false); // encore inconnu
    fusionConfirm(w);
    expect(w.events.some((e) => e.title === 'Marx observe la fusion')).toBe(false);
    expect(w.events.some((e) => e.title === 'Weber observe la fusion')).toBe(false);
  });

  it('réactions émises quand Marx et Weber sont des voix connues', () => {
    const w = createWorld();
    duoSmithOstrom(w);
    w.council.ghosts['marx']!.status = 'actif';
    w.council.ghosts['weber']!.status = 'actif';
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'marche');
    councilKeyDecision(w, 'communs');
    councilKeyDecision(w, 'communs');
    councilKeyDecision(w, 'communs');
    runTicks(w, 1);
    fusionConfirm(w);
    const jaloux = w.events.find((e) => e.title === 'Marx observe la fusion');
    const curieux = w.events.find((e) => e.title === 'Weber observe la fusion');
    expect(jaloux?.text).toContain('jaloux');
    expect(curieux?.text).toContain('curieux');
  });

  it('coopérative pérenne : ventes du week-end sans présence, uniquement le week-end', () => {
    const w = createWorld();
    pretAFusionner(w);
    fusionConfirm(w);
    buyStock(w); // poche 15 → caisse −15 → stock 20
    const p = w.project!;
    expect(p.stock).toBe(20);

    w.district.meteo = 'soleil';
    w.time.tick = 4 * DAY; // samedi 5 septembre 2020
    projectDay(w);
    const coop = p.ledger.find((e) => e.label.includes('Coopérative'));
    expect(coop?.amount).toBe(9); // 14 × 0,45 × 1,3 (week-end) × 1,2 (soleil) → 9
    expect(p.stock).toBe(11);
    expect(p.week.revenue).toBeCloseTo(9, 5);
    expect(exportSave(importSave(exportSave(w)))).toBe(exportSave(w)); // état sérialisable

    w.time.tick = 2 * DAY; // jeudi : pas de vente sans présence
    projectDay(w);
    expect(p.ledger.filter((e) => e.label.includes('Coopérative'))).toHaveLength(1);
  });
});

// ---------- Contrat de Sécurité (Hobbes) ----------

describe('Contrat de Sécurité — après incident, +20 %, −2 amitié/semaine, sortie verrouillée', () => {
  function hobbesActif(w: WorldState): void {
    w.flags['incidents'] = 1; // l'incident réel est produit par projectDay (testé plus bas)
    w.council.ghosts['hobbes']!.status = 'actif';
  }

  it('rien avant un incident ; proposé après, une fois par incident', () => {
    const w = createWorld();
    w.council.ghosts['hobbes']!.status = 'actif';
    runTicks(w, DAY);
    expect(securityPending(w)).toBe(false);
    w.flags['incidents'] = 1;
    runTicks(w, DAY); // la proposition tombe au passage de jour (councilDay)
    expect(securityPending(w)).toBe(true);
    expect(w.council.contratSecurite).toMatchObject({ active: false });
  });

  it('accepter : rendement +20 % et amitié du groupe −2/semaine', () => {
    const w = createWorld();
    hobbesActif(w);
    runTicks(w, DAY);
    expect(contractChoose(w, true).ok).toBe(true);
    expect(w.council.contratSecurite?.active).toBe(true);
    expect(securityYieldFactor(w)).toBeCloseTo(1.2, 5);

    standPret(w);
    buyStock(w);
    w.district.meteo = 'soleil';
    const r = runSalesSession(w, 'place'); // mercredi, soleil : 8 unités à 1 €, × 1,2
    expect(r.sold).toBe(8);
    expect(r.revenue).toBeCloseTo(9.6, 5);

    const noah0 = w.player.relations['noah']?.amitie ?? 0; // 78
    const lina0 = w.player.relations['lina']?.amitie ?? 0; // 55
    weeklySecurityCost(w, []);
    expect(w.player.relations['noah']?.amitie).toBe(noah0 - 2);
    expect(w.player.relations['lina']?.amitie).toBe(lina0 - 2);
    expect(w.events.some((e) => e.title === 'Le Contrat de Sécurité pèse sur l’amitié')).toBe(true);
  });

  it('refuser : le contrat ne revient qu’au prochain incident', () => {
    const w = createWorld();
    hobbesActif(w);
    runTicks(w, DAY);
    expect(contractChoose(w, false).ok).toBe(true);
    expect(w.council.contratSecurite).toBeNull();
    runTicks(w, DAY);
    expect(securityPending(w)).toBe(false); // le même incident ne repropose rien
    w.flags['incidents'] = 2;
    runTicks(w, DAY);
    expect(securityPending(w)).toBe(true);
  });

  it('sortie : impossible sans vote unanime (amitié ≥ 60 partout), possible ensuite', () => {
    const w = createWorld();
    hobbesActif(w);
    runTicks(w, DAY);
    contractChoose(w, true);
    standPret(w);
    w.player.relations['noah']!.amitie = 50;
    const r1 = exitSecurityContract(w);
    expect(r1.ok).toBe(false);
    expect(r1.message).toContain('unanime');
    expect(w.council.contratSecurite?.active).toBe(true);

    w.player.relations['noah']!.amitie = 65;
    w.player.relations['lina']!.amitie = 61;
    const confiance0 = w.player.relations['noah']?.confiance ?? 0;
    const r2 = exitSecurityContract(w);
    expect(r2.ok).toBe(true);
    expect(w.council.contratSecurite).toBeNull();
    expect(securityYieldFactor(w)).toBe(1); // le bonus tombe avec le contrat
    expect(w.player.relations['noah']?.confiance).toBe(confiance0 + 3);
  });
});

// ---------- Taylor hostile ----------

describe('Taylor hostile — sabotage −15 %, chronométrage, jauge allianceDesOmbres', () => {
  it('sabotage : rendement −15 % quand Taylor est hostile', () => {
    const w = createWorld();
    standPret(w);
    buyStock(w);
    w.council.ghosts['taylor']!.status = 'hostile';
    expect(taylorSabotageFactor(w)).toBeCloseTo(0.85, 5);
    const r = runSalesSession(w, 'place');
    expect(r.sold).toBe(7);
    expect(r.revenue).toBeCloseTo(7 * 0.85, 5);
    w.council.ghosts['taylor']!.status = 'actif';
    expect(taylorSabotageFactor(w)).toBe(1);
  });

  it('chronométrage : stress des coéquipiers +2/jour, notice unique', () => {
    const w = createWorld();
    standPret(w);
    w.council.ghosts['taylor']!.status = 'hostile';
    const s0 = w.npcs['noah']?.stress ?? 0; // 25
    taylorChronoDay(w);
    taylorChronoDay(w);
    expect(w.npcs['noah']?.stress).toBe(s0 + 4);
    expect(w.npcs['lina']?.stress).toBe(s0 + 4);
    expect(w.events.filter((e) => e.title === 'Taylor chronomètre l’équipe')).toHaveLength(1);
  });

  it('allianceDesOmbres : un refus = +1, l’événement tombe à 3', () => {
    const w = createWorld();
    recordTaylorRefusal(w);
    recordTaylorRefusal(w);
    expect(w.council.allianceDesOmbres).toBe(2);
    expect(w.events.some((e) => e.title === 'L’alliance des ombres s’épaissit')).toBe(false);
    recordTaylorRefusal(w);
    expect(w.council.allianceDesOmbres).toBe(3);
    expect(w.events.filter((e) => e.title === 'L’alliance des ombres s’épaissit')).toHaveLength(1);
  });

  it('ignorer un conseil de Taylor nourrit la jauge (chemin réel)', () => {
    const w = createWorld();
    w.flags['optimisations'] = 1;
    runTicks(w, 1);
    ecouter(w, 'taylor');
    runTicks(w, DAY); // premier conseil au jour 1
    const rec = w.council.ghosts['taylor']?.history[0];
    expect(rec).toBeDefined();
    expect(councilAnswerAdvice(w, 'taylor', rec!.adviceId, false).ok).toBe(true);
    expect(w.council.allianceDesOmbres).toBe(1);
    expect(councilAnswerAdvice(w, 'taylor', rec!.adviceId, true).ok).toBe(false); // déjà répondu
  });
});

// ---------- Cohérence (revue M6) : chaque déclencheur par le jeu réel ----------

describe('cohérence — les 22 déclencheurs du §6 s’arment par le jeu réel', () => {
  const CASES: ReadonlyArray<[string, (w: WorldState) => void]> = [
    ['smith', (w) => { expect(applyPlaceAction(w, 'epicerie', 'gouter').ok).toBe(true); }],
    ['marx', conflitDeRepartition],
    ['ostrom', (w) => { standPret(w); expect(adoptSharedRules(w).ok).toBe(true); }],
    ['hobbes', incidentAuStand],
    ['locke', incidentAuStand],
    ['rousseau', repartitionSimple],
    ['ricardo', (w) => { maitriser(w, 'prix_rarete'); maitriser(w, 'prevision_incertaine'); }],
    ['weber', (w) => { standPret(w); expect(adoptSharedRules(w).ok).toBe(true); }],
    ['keynes', semaineDePerte],
    ['hayek', regleImposeeQuiEchoue],
    ['bourdieu', venduJusquAuBout],
    ['machiavel', (w) => { maitriser(w, 'alliances_durables'); }],
    ['taylor', optimizeStandTrigger],
    ['ohno', troisSessionsReussies],
    ['dejours', coequipierAuBout],
    ['graeber', troisSessionsReussies],
    ['zuboff', donneesExploitees],
    ['stiegler', (w) => {
      expect(applyPlaceAction(w, 'maison', 'telephone').ok).toBe(true);
      expect(applyPlaceAction(w, 'maison', 'telephone').ok).toBe(true);
    }],
    ['rosa', semaineSurchargee],
    ['raworth', choixEcoCouteux],
    ['illich', optimisationRatee],
    ['simon', previsionsRatees],
  ];

  for (const [id, path] of CASES) {
    it(`${id} apparaît via un parcours de jeu réel`, () => {
      tryPathTrigger(id, path);
    });
  }
});

/** Taylor : la tentative d'optimisation arme le compteur quel que soit le résultat. */
function optimizeStandTrigger(w: WorldState): void {
  standPret(w);
  optimizeStand(w);
  if (!w.flags['optimisations']) throw new Error('optimisation pas comptée');
}

// ---------- Cohérence statique : chaque flag d'apparition a son bump() ----------

describe('cohérence — chaque compteur d’apparition est armé par le moteur', () => {
  // Source du moteur lue via le bundler (import.meta.glob raw) : aucun fs dans les tests.
  const simModules = import.meta.glob('../src/simulation/*.ts', { query: '?raw', import: 'default', eager: true });
  const sources = Object.values(simModules).join('\n');

  const TRIGGER_FLAGS = [
    'echanges', 'conflitsRepartition', 'incidents', 'injustices', 'dilemmesJustice',
    'procedures', 'reglesEchouees', 'semainesPerte', 'distinctions', 'optimisations',
    'sessionsReussies', 'corveesAbsurdes', 'donneesExploitees', 'distractions',
    'semaines40h', 'choixEcoCouteux', 'outilsContreProductifs', 'previsionsRatees',
  ];

  it('chaque flag déclencheur du §6 est incrémenté par au moins un bump() de la simulation', () => {
    for (const flag of TRIGGER_FLAGS) {
      expect(sources, `flag « ${flag} » jamais armé`).toMatch(
        new RegExp(`bump\\([^,]+,\\s*['"]${flag}['"]`),
      );
    }
  });

  it('rules.collectif est activé par une action de simulation (Ostrom)', () => {
    expect(sources).toMatch(/rules\.collectif\s*=\s*true/);
  });

  it('le stress des coéquipiers évolue dans la simulation (Dejours)', () => {
    expect(sources).toMatch(/npc\.stress\s*=\s*clamp\(npc\.stress/);
  });

  it('les seuils de caractéristiques du §6 sont atteignables par la maîtrise des notions', () => {
    const w = createWorld();
    const gains: Record<string, number> = {};
    for (const n of NOTIONS) gains[n.characteristic] = (gains[n.characteristic] ?? 0) + n.gain;
    // Ricardo : Compréhension ≥ 50 ; Machiavel : Influence ≥ 55 (contrat §6).
    expect(w.player.characteristics.comprehension + (gains['comprehension'] ?? 0))
      .toBeGreaterThanOrEqual(50);
    expect(w.player.characteristics.influence + (gains['influence'] ?? 0))
      .toBeGreaterThanOrEqual(55);
  });

  it('sauvegarde aller-retour identique après fusion et contrat', () => {
    const w = createWorld();
    pretAFusionner(w);
    fusionConfirm(w);
    w.flags['incidents'] = 1;
    w.council.ghosts['hobbes']!.status = 'actif';
    runTicks(w, DAY);
    contractChoose(w, true);
    const w2 = importSave(exportSave(w));
    expect(w2).toEqual(w);
  });
});

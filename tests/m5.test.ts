/**
 * Tests M5 — premier projet & quartier réactif : Stand des Roses (stock 15 €,
 * prix 0,5-2 €, demande = f(prix, réputation, jour, météo), sessions d'1 h,
 * courses 2 €), équipe Noah + Lina (communication ≥ 2), échecs (stock invendu,
 * rivalité > 60 → départ), invariant du livre de comptes (Σ entrées − sorties
 * = solde, toujours), trésorerie ≠ résultat hebdo, répartition égalité / équité /
 * incitation aux effets 4D distincts, quartier (vitalité +1/course, seuils
 * 35/60, réputation, teaser Samir ≥ 70) et météo saisonnière.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { TICKS_PER_DAY, type RepartitionMode, type WorldState } from '../src/core/types';
import {
  buyStock, createProject, demandAt, ledgerBalance, ledgerInvariantHolds,
  recruitMember, repartition, runCourse, runSalesSession, setPrice, weeklyResult,
} from '../src/simulation/project';
import {
  drawMeteo, checkVitaliteEvents, vitaliteCheck, SEUIL_EMBAUCHE, SEUIL_FERMETURE,
} from '../src/simulation/district';
import { councilPendingArrivals } from '../src/simulation/council';
import { seasonOfMonth } from '../src/data/district';
import { makeSeed } from '../src/core/rng';

const DAY = TICKS_PER_DAY;

function equipePret(w: WorldState, seed?: number): WorldState {
  w.player.skills.communication.level = 2;
  expect(createProject(w).ok).toBe(true);
  expect(recruitMember(w, 'noah').ok).toBe(true);
  expect(recruitMember(w, 'lina').ok).toBe(true);
  return w;
}

// ---------- Équipe : recruter exige communication ≥ 2 ----------

describe('équipe — Noah + Lina, gate communication ≥ 2 (contrat M3/M5)', () => {
  it('refusé sans la compétence, accepté au niveau 2, une seule fois par personne', () => {
    const w = createWorld();
    expect(createProject(w).ok).toBe(true);
    const refuse = recruitMember(w, 'noah');
    expect(refuse.ok).toBe(false);
    expect(refuse.message).toContain('Communication niveau 2');
    w.player.skills.communication.level = 2;
    expect(recruitMember(w, 'noah').ok).toBe(true);
    expect(recruitMember(w, 'lina').ok).toBe(true);
    expect(recruitMember(w, 'noah').ok).toBe(false);
    expect(w.project?.members).toEqual(['noah', 'lina']);
  });

  it('seuls Noah et Lina peuvent rejoindre ; trop de rivalité fait refuser', () => {
    const w = createWorld();
    w.player.skills.communication.level = 2;
    createProject(w);
    expect(recruitMember(w, 'karim').ok).toBe(false);
    w.player.relations['noah']!.rivalite = 61;
    const refuse = recruitMember(w, 'noah');
    expect(refuse.ok).toBe(false);
    expect(refuse.message).toContain('rivalité');
  });
});

// ---------- Stock & prix ----------

describe('stock & prix — 15 € la livraison, prix borné 0,5-2 €', () => {
  it('achat payé de la poche : apport + achat, caisse à zéro, stock +20', () => {
    const w = createWorld();
    createProject(w);
    const r = buyStock(w);
    expect(r.ok).toBe(true);
    expect(w.project?.stock).toBe(20);
    expect(w.player.money).toBe(0);
    expect(w.project?.balance).toBe(0);
    expect(w.project?.ledger.map((e) => e.label)).toEqual(['Apport de capital', 'Achat de stock (20 unités)']);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
  });

  it('sans argent ni caisse, l’achat est refusé ; la caisse paie quand elle peut', () => {
    const w = createWorld();
    createProject(w);
    w.player.money = 10;
    expect(buyStock(w).ok).toBe(false);
    for (let i = 0; i < 8; i++) expect(runCourse(w).ok).toBe(true); // caisse : +16 €
    const money = w.player.money;
    expect(buyStock(w).ok).toBe(true);
    expect(w.player.money).toBe(money); // payé par la caisse, pas par la poche
    expect(w.project?.stock).toBe(20);
    expect(w.project?.week.expenses).toBe(15);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
  });

  it('le prix est borné : 3 € → 2 €, 0,10 € → 0,50 €', () => {
    const w = createWorld();
    createProject(w);
    setPrice(w, 3);
    expect(w.project?.price).toBe(2);
    setPrice(w, 0.1);
    expect(w.project?.price).toBe(0.5);
  });
});

// ---------- Demande ----------

describe('demande — f(prix, réputation, jour de semaine, météo)', () => {
  it('baisse avec le prix, monte avec la réputation, le week-end et le soleil', () => {
    expect(demandAt(0.5, 45, 2, 'soleil')).toBe(10);   // mardi : 20 × 0,45 × 1,2
    expect(demandAt(1, 45, 2, 'nuages')).toBe(6);      // 14 × 0,45
    expect(demandAt(1, 70, 2, 'nuages')).toBe(9);      // 14 × 0,70
    expect(demandAt(2, 70, 2, 'nuages')).toBe(1);      // prix max, bonne réputation : 2 × 0,70
    expect(demandAt(2, 45, 6, 'nuages')).toBe(1);      // week-end +30 % : 0,9 × 1,3
    expect(demandAt(1, 45, 2, 'pluie')).toBe(3);       // pluie −40 % : 6,3 × 0,6
  });

  it('prix trop élevé et mauvaise réputation : personne ne s’arrête', () => {
    expect(demandAt(2, 45, 2, 'nuages')).toBe(0);      // 0,9 → 0
    expect(demandAt(2, 45, 2, 'pluie')).toBe(0);       // 0,54 → 0
  });
});

// ---------- Sessions & courses ----------

describe('sessions & courses — ventes, réputation, vitalité', () => {
  it('une session vend à hauteur de la demande et du stock, réputation +2', () => {
    const w = createWorld(); // mardi, soleil (état initial), réputation 45
    createProject(w);
    buyStock(w);
    const r = runSalesSession(w, 'place');
    expect(r.ok).toBe(true);
    expect(r.sold).toBe(7);
    expect(r.revenue).toBe(7);
    expect(w.project?.stock).toBe(13);
    expect(w.player.reputation).toBe(47);
    expect(w.project?.week.revenue).toBe(7);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
  });

  it('session hors récré/place ou sans stock : refusée', () => {
    const w = createWorld();
    createProject(w);
    expect(runSalesSession(w, 'maison').ok).toBe(false);
    expect(runSalesSession(w, 'place').ok).toBe(false); // stock vide
    buyStock(w);
    expect(runSalesSession(w, 'place').ok).toBe(true);
  });

  it('une course : 2 € pour le stand, 20 min de fatigue, vitalité +1, réputation +1', () => {
    const w = createWorld();
    createProject(w);
    const fatigue = w.player.needs.fatigue;
    const r = runCourse(w);
    expect(r.ok).toBe(true);
    expect(w.project?.balance).toBe(2);
    expect(w.project?.coursesDone).toBe(1);
    expect(w.district.vitaliteEpicerie).toBeCloseTo(46, 5);
    expect(w.player.reputation).toBe(46);
    expect(w.player.needs.fatigue).toBeCloseTo(fatigue + 5, 5);
    expect(w.project?.work.player).toBe(1);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
  });
});

// ---------- Livre de comptes : invariant & trésorerie ≠ résultat ----------

describe('livre de comptes — Σ(entrées − sorties) = solde, toujours', () => {
  it('l’invariant tient après chaque opération d’une séquence complète', () => {
    const w = createWorld();
    createProject(w);
    const p = w.project!;
    const verifie = (): void => {
      expect(ledgerInvariantHolds(p)).toBe(true);
      expect(ledgerBalance(p)).toBe(p.balance);
    };
    verifie();
    buyStock(w);
    verifie();
    runCourse(w);
    verifie();
    w.district.meteo = 'soleil';
    runSalesSession(w, 'place');
    verifie();
    // Répartition avec perte : le livre ne bouge pas, l’invariant non plus.
    w.player.skills.communication.level = 2;
    recruitMember(w, 'noah');
    p.week.revenue = 0; // semaine à perte (achat 15 € jamais amorti)
    p.week.expenses = 15;
    const r = repartition(w, 'egalite');
    expect(r.ok).toBe(false);
    verifie();
    expect(w.flags['semainesPerte']).toBe(1);
  });

  it('trésorerie (cumul) ≠ résultat hebdo (semaine en cours)', () => {
    const w = createWorld();
    createProject(w);
    const p = w.project!;
    buyStock(w); // −15 € en semaine
    runCourse(w);
    runCourse(w);
    expect(weeklyResult(p)).toBeCloseTo(4 - 15, 5); // 2 courses − achat
    expect(p.balance).toBe(4);                     // le cumul de toutes les écritures
  });

  it('la répartition est exacte au centime près et ne se fait qu’une fois par semaine', () => {
    const w = createWorld({ seed: 2 });
    equipePret(w);
    buyStock(w); // poche −15
    w.district.meteo = 'soleil';
    runSalesSession(w, 'place'); // +7
    runSalesSession(w, 'place'); // +7
    for (let i = 0; i < 8; i++) runCourse(w); // +16
    const p = w.project!;
    expect(weeklyResult(p)).toBeCloseTo(15, 5); // 30 − 15 : résultat réel de la boucle économique
    expect(ledgerInvariantHolds(p)).toBe(true);
    const r = repartition(w, 'egalite');
    expect(r.ok).toBe(true);
    expect(r.shares.reduce((s, x) => s + x.amount, 0)).toBe(15);
    expect(p.balance).toBe(15); // la caisse garde le capital (15 €) : on ne répartit que le résultat
    expect(ledgerInvariantHolds(p)).toBe(true);
    const bis = repartition(w, 'egalite');
    expect(bis.ok).toBe(false);
    expect(bis.message).toContain('déjà répartis');
  });
});

// ---------- Répartition : les 3 modes aux effets 4D distincts ----------

describe('répartition — égalité / équité / incitation, effets distincts (seed 2 : aucun conflit)', () => {
  function monde(mode: RepartitionMode): WorldState {
    const w = createWorld({ seed: 2 });
    equipePret(w);
    buyStock(w); // poche −15
    w.district.meteo = 'soleil';
    runSalesSession(w, 'place'); // +7
    runSalesSession(w, 'place'); // +7 → stock 6
    for (let i = 0; i < 8; i++) runCourse(w); // +16
    const p = w.project!;
    expect(weeklyResult(p)).toBeCloseTo(15, 5); // résultat réel : 30 − 15
    expect(ledgerInvariantHolds(p)).toBe(true);
    // Seul le travail fourni est forgé (pour isoler les modes) — jamais la comptabilité.
    p.work = { player: 3, noah: 9, lina: 0 }; // Noah a travaillé 3× plus que toi, Lina rien
    const r = repartition(w, mode);
    expect(r.ok).toBe(true);
    expect(r.shares.reduce((s, x) => s + x.amount, 0)).toBe(15);
    expect(ledgerInvariantHolds(p)).toBe(true);
    expect(w.flags['conflitsRepartition']).toBeUndefined();
    return w;
  }

  it('égalité : parts égales, amitié +2 partout, rivalité +1 chez le gros travailleur, solidarite +1', () => {
    const w = monde('egalite');
    expect(w.player.money).toBe(5); // 15 − 15 (stock) + 5 (part)
    expect(w.project?.ledger.filter((e) => e.amount === -5)).toHaveLength(3);
    expect(w.player.relations['noah']?.amitie).toBe(80);  // 78 + 2
    expect(w.player.relations['noah']?.rivalite).toBe(19); // 18 + 1 : travaillé plus, reçu pareil
    expect(w.player.relations['lina']?.amitie).toBe(57);
    expect(w.council.decisions.solidarite).toBe(1);
  });

  it('équité : selon le travail fourni, confiance +3 et respect +2, communs +1', () => {
    const w = monde('equite');
    expect(w.player.money).toBe(3.75); // part : 15 × 3/12
    expect(w.project?.ledger.some((e) => e.amount === -11.25 && e.label.includes('Noah'))).toBe(true);
    expect(w.project?.ledger.some((e) => e.label.includes('Lina'))).toBe(false); // zéro travail, zéro part
    expect(w.player.relations['noah']?.confiance).toBe(68);
    expect(w.player.relations['noah']?.respect).toBe(52); // 48 + 2 (recrutement) + 2 (équité)
    expect(w.player.relations['lina']?.confiance).toBe(53);
    expect(w.player.relations['lina']?.respect).toBe(54); // 50 + 2 (recrutement) + 2 (équité)
    expect(w.council.decisions.communs).toBe(1);
  });

  it('incitation : prime au plus gros travailleur, respect +3 pour lui, rivalité +3 et amitié −2 pour l’autre, marche +1', () => {
    const w = monde('incitation');
    expect(w.player.money).toBe(2.5); // base 2,5, pas de prime
    expect(w.project?.ledger.some((e) => e.amount === -10 && e.label.includes('Noah'))).toBe(true);
    expect(w.player.relations['noah']?.respect).toBe(53); // 48 + 2 (recrutement) + 3 (prime)
    expect(w.player.relations['lina']?.rivalite).toBe(13); // 10 + 3
    expect(w.player.relations['lina']?.amitie).toBe(53);   // 55 − 2
    expect(w.council.decisions.marche).toBe(1);
  });

  it('les trois modes produisent des vecteurs relationnels 4D tous différents', () => {
    const rels: Record<RepartitionMode, Record<string, { amitie: number; confiance: number; respect: number; rivalite: number }>> = {
      egalite: {}, equite: {}, incitation: {},
    };
    for (const mode of Object.keys(rels) as RepartitionMode[]) {
      const w = monde(mode);
      rels[mode] = {
        noah: { ...w.player.relations['noah']! },
        lina: { ...w.player.relations['lina']! },
      };
    }
    expect(rels['egalite']).not.toEqual(rels['equite']);
    expect(rels['equite']).not.toEqual(rels['incitation']);
    expect(rels['incitation']).not.toEqual(rels['egalite']);
  });
});

// ---------- Scénario bout-en-bout : une partie qui gagne ----------

describe('scénario bout-en-bout — la partie qui gagne', () => {
  it('achat, équipe, trois sessions, fin de semaine : répartition et caisses justes', () => {
    const w = createWorld(); // mardi 1er septembre, 15 € en poche, réputation 45
    equipePret(w);
    expect(buyStock(w).ok).toBe(true);

    w.district.meteo = 'soleil';
    const s1 = runSalesSession(w, 'place'); // demande 7
    const s2 = runSalesSession(w, 'place'); // demande 7
    const s3 = runSalesSession(w, 'college'); // demande 8, stock 6
    expect([s1.sold, s2.sold, s3.sold]).toEqual([7, 7, 6]);
    expect(w.project?.stock).toBe(0);
    expect(w.player.reputation).toBe(51);
    expect(w.project?.balance).toBe(20);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);

    // Fin de semaine : saut au dimanche soir, puis le lundi matin tout se règle.
    w.time.tick = 7 * DAY - 1;
    runTicks(w, 1);
    const p = w.project!;
    expect(w.player.money).toBeCloseTo(6.67, 2); // 15 − 15 + 5 d'argent de poche + 1,67 de part
    expect(p.balance).toBeCloseTo(15, 2);        // la caisse garde le capital, on répartit le résultat
    expect(p.lastRepartition).toBe('egalite');
    expect(p.week.revenue).toBe(0);
    expect(p.week.expenses).toBe(0);
    expect(p.week.distributed).toBe(false);
    expect(w.council.decisions.solidarite).toBe(1);
    expect(w.player.relations['noah']?.amitie).toBe(80);
    expect(w.player.relations['lina']?.amitie).toBe(57);
    expect(w.events.some((e) => e.title === 'Répartition — Égalité')).toBe(true);
    expect(ledgerInvariantHolds(p)).toBe(true);
  });
});

// ---------- Scénario bout-en-bout : la partie qui échoue ----------

describe('scénario bout-en-bout — la partie qui échoue', () => {
  it('prix trop élevé sous la pluie : stock invendu, puis rivalité > 60 : un membre part', () => {
    const w = createWorld();
    equipePret(w);
    buyStock(w);
    setPrice(w, 2);
    w.district.meteo = 'pluie';

    const session = runSalesSession(w, 'place');
    expect(session.ok).toBe(false);
    expect(session.sold).toBe(0);
    expect(w.project?.stock).toBe(20); // tout le stock reste sur les bras
    expect(w.flags['echecsVente']).toBe(1);
    expect(w.player.needs.stress).toBeGreaterThan(25);
    const echec = w.events.find((e) => e.title === 'Stand désert');
    expect(echec).toBeDefined();
    expect(echec?.causes.map((c) => c.seuil)).toContain('2.00 €');

    // La rivalité explose : au passage du jour suivant, Noah claque la porte.
    w.player.relations['noah']!.rivalite = 61;
    runTicks(w, DAY);
    expect(w.project?.members).toEqual(['lina']);
    expect(w.flags['departsMembres']).toBe(1);
    const depart = w.events.find((e) => e.title === 'Noah Martin quitte le stand');
    expect(depart?.causes[0]).toMatchObject({ facteur: 'rivalité avec Noah Martin', seuil: '60' });

    // Fin de semaine à perte : rien à répartir, Keynes se manifeste.
    w.time.tick = 7 * DAY - 1;
    runTicks(w, 1);
    expect(w.flags['semainesPerte']).toBe(1);
    expect(w.events.some((e) => e.title === 'Semaine de perte')).toBe(true);
    expect(w.project?.week.distributed).toBe(false);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
    runTicks(w, 1);
    expect(councilPendingArrivals(w)).toContain('keynes');
  });
});

// ---------- Quartier : seuils 35/60, réputation, teaser Samir ----------

describe('quartier — vitalité, seuils 35/60, réputation et teaser Samir', () => {
  it('sous 35 : Mme Bertin envisage de fermer (une seule fois)', () => {
    const w = createWorld();
    w.district.vitaliteEpicerie = 35;
    runTicks(w, DAY); // drive −0,2/jour → 34,8
    expect(w.district.vitaliteEpicerie).toBeCloseTo(34.8, 5);
    expect(vitaliteCheck(w)).toBe('fermeture');
    expect(w.events.some((e) => e.title === 'Mme Bertin envisage de fermer')).toBe(true);
    const evt = w.events.find((e) => e.title === 'Mme Bertin envisage de fermer');
    expect(evt?.causes[0]).toMatchObject({ facteur: 'vitalité de l’épicerie', seuil: String(SEUIL_FERMETURE) });
    runTicks(w, DAY);
    expect(w.events.filter((e) => e.title === 'Mme Bertin envisage de fermer')).toHaveLength(1);
  });

  it('au-delà de 60 (course rendue) : embauche + confiance du quartier +10', () => {
    const w = createWorld();
    createProject(w);
    w.district.vitaliteEpicerie = 59.9;
    const confiance = w.district.confianceQuartier;
    expect(runCourse(w).ok).toBe(true); // +1 → 60,9 : le seuil est franchi par une course
    expect(w.district.vitaliteEpicerie).toBeCloseTo(60.9, 5);
    expect(vitaliteCheck(w)).toBe('embauche');
    expect(w.district.confianceQuartier).toBe(confiance + 10);
    const evt = w.events.find((e) => e.title === 'L’épicerie embauche');
    expect(evt?.causes[0]).toMatchObject({ facteur: 'vitalité de l’épicerie', seuil: String(SEUIL_EMBAUCHE) });
    expect(checkVitaliteEvents(w)).toBeUndefined(); // pas de doublon
    expect(w.events.filter((e) => e.title === 'L’épicerie embauche')).toHaveLength(1);
  });

  it('réputation ≥ 70 : Samir propose un stage (teaser, une fois)', () => {
    const w = createWorld();
    w.player.reputation = 70;
    runTicks(w, DAY);
    expect(w.events.some((e) => e.title === 'Samir te propose un stage')).toBe(true);
    runTicks(w, DAY);
    expect(w.events.filter((e) => e.title === 'Samir te propose un stage')).toHaveLength(1);
  });

  it('confiance du quartier ≥ 60 entretient la réputation (+1/jour)', () => {
    const w = createWorld();
    w.district.confianceQuartier = 65;
    runTicks(w, DAY);
    expect(w.player.reputation).toBe(46);
  });
});

// ---------- Météo saisonnière ----------

describe('météo — tirage saisonnier au PRNG (contrat M5)', () => {
  it('drawMeteo respecte les fréquences du contrat sur un grand échantillon déterministe', () => {
    const N = 120000;
    const saisons: ReadonlyArray<readonly [number, readonly [number, number, number]]> = [
      [9, [0.6, 0.3, 0.1]],   // fin d'été : soleil 60 / nuages 30 / pluie 10
      [10, [0.3, 0.4, 0.3]],  // automne : 30 / 40 / 30
      [12, [0.2, 0.3, 0.5]],  // hiver : 20 / 30 / 50
    ];
    for (const [mois, attendu] of saisons) {
      const rng = { rng: makeSeed(20200901) };
      const comptes = { soleil: 0, nuages: 0, pluie: 0 };
      for (let i = 0; i < N; i++) comptes[drawMeteo(rng, mois)] += 1;
      expect(comptes.soleil / N).toBeCloseTo(attendu[0], 1);
      expect(comptes.nuages / N).toBeCloseTo(attendu[1], 1);
      expect(comptes.pluie / N).toBeCloseTo(attendu[2], 1);
    }
  });

  it('septembre = fin d’été, octobre-novembre = automne, décembre-février = hiver', () => {
    expect(seasonOfMonth(9)).toBe('finEte');
    expect(seasonOfMonth(10)).toBe('automne');
    expect(seasonOfMonth(11)).toBe('automne');
    expect(seasonOfMonth(12)).toBe('hiver');
    expect(seasonOfMonth(1)).toBe('hiver');
  });

  it('le tirage est déterministe et ne sort que des valeurs valides', () => {
    for (let seed = 0; seed < 40; seed++) {
      const rng = { rng: makeSeed(seed) };
      for (const month of [9, 10, 12, 3]) {
        const a = drawMeteo(rng, month);
        expect(['soleil', 'nuages', 'pluie']).toContain(a);
      }
    }
    const r1 = { rng: makeSeed(7) };
    const r2 = { rng: makeSeed(7) };
    expect(drawMeteo(r1, 9)).toBe(drawMeteo(r2, 9));
  });
});

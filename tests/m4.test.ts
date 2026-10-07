/**
 * Tests M4 — Le Conseil : roster §6, les 5 déclencheurs de la slice, choix
 * d'arrivée (écouter/repousser), refus différé à condition majorée, plafond de
 * 4 voix, seuils 80/20, mort symbolique après 3 jours à 0 (adieu + legs),
 * véracité secrète et rétrospection du mensonge (fiabilité −20).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { dayIndexOf } from '../src/core/clock';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import {
  councilActiveCount, councilAnswerAdvice, councilArrivalChoose, councilColumns,
  councilDay, councilKeyDecision, councilPendingArrivals, councilSleep, councilTick,
  councilWake, ghostSignature,
} from '../src/simulation/council';
import { applyPlaceAction } from '../src/simulation/places';
import { adoptSharedRules, optimizeStand } from '../src/simulation/project';
import { GHOST_DEFS, GEN1_RESTANTS, GEN2_IDS } from '../src/data/ghosts/registry';
import { ADVICE_POOL, ARRIVAL_SCENES, FAREWELLS, GHOST_DOCTRINES } from '../src/data/ghosts/scenes';
import {
  conflitDeRepartition, incidentAuStand, standPret, tryPathTrigger,
} from './helpers';

const DAY = TICKS_PER_DAY;

const ROSTER_G1 = ['smith', 'marx', 'ostrom', 'hobbes', 'locke', 'rousseau', 'ricardo', 'weber',
  'keynes', 'hayek', 'bourdieu', 'machiavel'];
const ROSTER_G2 = ['taylor', 'ohno', 'dejours', 'graeber', 'zuboff', 'stiegler', 'rosa', 'raworth',
  'illich', 'simon'];

function arrive(w: WorldState, id: string): void {
  const r = councilArrivalChoose(w, id, 'ecouter');
  if (!r.ok) throw new Error(`arrivée ${id} refusée : ${r.message}`);
}

function giveProject(w: WorldState, collectif: boolean): void {
  w.project = {
    id: 'stand_des_roses', active: true, stock: 10, price: 1,
    members: ['noah', 'lina'],
    rules: { collectif, contratSecurite: false },
    sessionsDone: 0, coursesDone: 0, ledger: [],
    balance: 0,
    week: { index: 0, revenue: 0, expenses: 0, distributed: false },
    work: { player: 0 },
  };
}

// ---------- Registre : roster du contrat §6 ----------

describe('registre — les 22 fiches du contrat §6 sont intégrées', () => {
  it('G1 et G2 exactes, id stables et uniques', () => {
    expect(GHOST_DEFS.map((g) => g.id).sort()).toEqual([...ROSTER_G1, ...ROSTER_G2].sort());
    expect(GHOST_DEFS.filter((g) => g.generation === 1).map((g) => g.id)).toEqual(ROSTER_G1);
    expect(GHOST_DEFS.filter((g) => g.generation === 2).map((g) => g.id)).toEqual(ROSTER_G2);
    expect(new Set(GHOST_DEFS.map((g) => g.id)).size).toBe(22);
    expect(GEN1_RESTANTS).toEqual([]);
    expect(GEN2_IDS).toEqual([]);
  });

  it('chaque fiche a sa scène d’arrivée (4-6 répliques), son adieu, ses conseils — et peut mentir (§4)', () => {
    for (const g of GHOST_DEFS) {
      const scene = ARRIVAL_SCENES[g.id];
      expect(scene?.lines.length, `scène ${g.id}`).toBeGreaterThanOrEqual(4);
      expect(scene?.lines.length).toBeLessThanOrEqual(6);
      const fw = FAREWELLS[g.id];
      expect(fw?.lines.length).toBeGreaterThanOrEqual(2);
      expect(fw?.citation.length).toBeGreaterThan(10);
      expect(fw?.notion).toBeTruthy();
      const pool = ADVICE_POOL[g.id] ?? [];
      expect(pool.length).toBeGreaterThanOrEqual(2);
      expect(pool.some((a) => a.veracite === 'mensonge')).toBe(true);
      expect(pool.some((a) => a.veracite === 'vraie')).toBe(true);
      expect(g.apparition.sceneId).toBe(`arrivee_${g.id}`);
      expect(GHOST_DOCTRINES[g.id]).toBeTruthy();
    }
  });

  it('au départ : aucune voix, 22 silhouettes, aucun déclencheur armé', () => {
    const w = createWorld();
    runTicks(w, DAY);
    expect(councilPendingArrivals(w)).toEqual([]);
    expect(councilActiveCount(w)).toBe(0);
    const cols = councilColumns(w);
    expect(cols.actives).toEqual([]);
    expect(cols.inconnues).toHaveLength(22);
  });
});

// ---------- Les 5 déclencheurs de la slice (parcours de jeu réels) ----------

describe('apparitions — les 5 déclencheurs de la slice par le jeu réel (§6)', () => {
  it('smith apparaît au premier échange (achat à l’épicerie)', () => {
    tryPathTrigger('smith', (w) => {
      expect(applyPlaceAction(w, 'epicerie', 'gouter').ok).toBe(true);
    });
  });

  it('marx apparaît au premier conflit de répartition (répartition réelle)', () => {
    tryPathTrigger('marx', conflitDeRepartition);
  });

  it('hobbes apparaît au premier incident au stand (projectDay réel)', () => {
    tryPathTrigger('hobbes', incidentAuStand);
  });

  it('taylor apparaît à la première optimisation tentée', () => {
    tryPathTrigger('taylor', (w) => {
      standPret(w);
      optimizeStand(w);
      expect(w.flags['optimisations']).toBe(1);
    });
  });

  it('ostrom n’apparaît qu’au stand collectif : 2+ membres ET règles partagées', () => {
    tryPathTrigger('ostrom', (w) => {
      standPret(w);
      expect(adoptSharedRules(w).ok).toBe(true);
    });
  });

  it('l’arrivée n’est notifiée qu’une seule fois tant que le choix n’est pas fait', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    const notifs = runTicks(w, 30);
    // Les dépêches du fil d'infos (📰) commentées par Smith ne sont pas des arrivées.
    expect(notifs.filter((n) => n.ghost === 'smith' && !n.text.startsWith('📰'))).toHaveLength(1);
    expect(notifs[0]?.kind).toBe('fantome');
  });
});

// ---------- Choix d'arrivée : écouter / repousser ----------

describe('choix d’arrivée — écouter rend actif, repousser diffère', () => {
  it('« l’écouter » active la voix (loyauté 50, fiabilité 60) et le premier conseil suit le lendemain', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    const r = councilArrivalChoose(w, 'smith', 'ecouter');
    expect(r.ok).toBe(true);
    expect(w.council.ghosts['smith']?.status).toBe('actif');
    expect(w.council.ghosts['smith']?.loyalty).toBe(50);
    expect(w.events.some((e) => e.title === 'Adam Smith rejoint ton Conseil')).toBe(true);
    runTicks(w, DAY);
    expect(w.council.ghosts['smith']?.history.length).toBe(1); // premier conseil
  });

  it('« le repousser » met la voix en refus avec un jour de retour', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    const day = dayIndexOf(w.time.tick);
    const r = councilArrivalChoose(w, 'smith', 'repousser');
    expect(r.ok).toBe(true);
    const st = w.council.ghosts['smith'];
    expect(st?.status).toBe('refuse');
    expect(st?.returnDay).toBe(day + 2);
    expect(st?.arrivalPending).toBe(false);
  });

  it('une voix repoussée ne revient pas pendant le délai, ni sans progrès — puis revient (condition majorée)', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    councilArrivalChoose(w, 'smith', 'repousser');
    const st = w.council.ghosts['smith'];
    expect(st).toBeDefined();

    runTicks(w, DAY); // jour 1 : délai non écoulé
    expect(st?.arrivalPending).toBe(false);
    runTicks(w, DAY); // jour 2 : délai écoulé mais aucun progrès
    expect(st?.arrivalPending).toBe(false);
    expect(st?.status).toBe('refuse');

    w.flags['echanges'] = 2; // un nouvel échange : condition majorée remplie
    runTicks(w, 1);
    expect(st?.arrivalPending).toBe(true);
    expect(councilArrivalChoose(w, 'smith', 'ecouter').ok).toBe(true);
    expect(st?.status).toBe('actif');
  });
});

// ---------- Plafond de 4 voix actives ----------

describe('plafond — 4 voix actives, réveil et endormissement manuels', () => {
  it('la 5e voix est refusée tant que l’une des quatre n’est pas endormie', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    w.flags['conflitsRepartition'] = 1;
    w.flags['incidents'] = 1;
    w.flags['optimisations'] = 1;
    runTicks(w, 1);
    for (const id of ['smith', 'marx', 'hobbes', 'taylor']) arrive(w, id);
    expect(councilActiveCount(w)).toBe(4);

    giveProject(w, true);
    runTicks(w, 1);
    expect(councilPendingArrivals(w)).toContain('ostrom');
    const refuse = councilArrivalChoose(w, 'ostrom', 'ecouter');
    expect(refuse.ok).toBe(false);
    expect(refuse.message).toContain('Quatre voix');

    expect(councilSleep(w, 'smith').ok).toBe(true);
    expect(councilActiveCount(w)).toBe(3);
    expect(councilArrivalChoose(w, 'ostrom', 'ecouter').ok).toBe(true);
    expect(councilActiveCount(w)).toBe(4);

    expect(councilWake(w, 'smith').ok).toBe(false); // plafond atteint
    expect(councilSleep(w, 'marx').ok).toBe(true);
    expect(councilWake(w, 'smith').ok).toBe(true);
    expect(w.council.ghosts['smith']?.status).toBe('actif');
  });

  it('une voix endormie se tait et perd 1 de loyauté par jour', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    arrive(w, 'smith');
    expect(councilSleep(w, 'smith').ok).toBe(true);
    runTicks(w, DAY);
    expect(w.council.ghosts['smith']?.status).toBe('endormi');
    expect(w.council.ghosts['smith']?.loyalty).toBe(49);
  });
});

// ---------- Seuils : signature > 80, hostilité < 20 ----------

describe('seuils — signature à loyauté > 80, hostilité à loyauté < 20', () => {
  it('la signature n’est acquise qu’au-delà de 80, strictement', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    arrive(w, 'smith');
    const st = w.council.ghosts['smith'];
    expect(st).toBeDefined();
    st!.loyalty = 79;
    expect(ghostSignature(w, 'smith')).toBe(false);
    st!.loyalty = 80;
    expect(ghostSignature(w, 'smith')).toBe(false);
    st!.loyalty = 81;
    expect(ghostSignature(w, 'smith')).toBe(true);
  });

  it('sous 20 la voix devient hostile ; revenue à 20 elle se rendort (le réveil est manuel)', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    arrive(w, 'smith');
    const st = w.council.ghosts['smith'];
    st!.loyalty = 19;
    runTicks(w, 1);
    expect(st?.status).toBe('hostile');
    expect(w.events.some((e) => e.title === 'Adam Smith devient hostile')).toBe(true);
    expect(councilColumns(w).hostiles).toContain('smith');
    st!.loyalty = 20;
    runTicks(w, 1);
    expect(st?.status).toBe('endormi');
  });
});

// ---------- Mort symbolique ----------

describe('mort symbolique — 3 jours à loyauté 0, puis adieu et legs', () => {
  it('la voix meurt au 3e jour à 0 et lègue une citation et une notion', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    arrive(w, 'smith');
    const st = w.council.ghosts['smith'];
    st!.loyalty = 0;

    runTicks(w, DAY);
    expect(st?.loyaltyZeroDays).toBe(1);
    expect(st?.status).toBe('hostile'); // 0 < 20
    runTicks(w, DAY);
    expect(st?.loyaltyZeroDays).toBe(2);
    expect(st?.status).not.toBe('mort');

    runTicks(w, DAY);
    expect(st?.status).toBe('mort');
    expect(st?.lastWords).toBe(FAREWELLS['smith']?.citation);
    expect(w.events.some((e) => e.title === 'Adieu — Adam Smith')).toBe(true);
    expect(w.player.notions['prix_rarete']?.stage).toBe(1); // legs : +1 notion
    const evt = w.events.find((e) => e.title === 'Adieu — Adam Smith');
    expect(evt?.causes[0]).toMatchObject({ facteur: 'loyauté de Adam Smith à 0', seuil: '3 jours' });
  });

  it('remonter au-dessus de 0 interrompt le compte à rebours', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    runTicks(w, 1);
    arrive(w, 'smith');
    const st = w.council.ghosts['smith'];
    st!.loyalty = 0;
    runTicks(w, DAY);
    runTicks(w, DAY);
    expect(st?.loyaltyZeroDays).toBe(2);
    st!.loyalty = 5;
    runTicks(w, DAY);
    expect(st?.loyaltyZeroDays).toBe(0);
    expect(st?.status).not.toBe('mort');
  });
});

// ---------- Véracité secrète & rétrospection ----------

describe('véracité secrète — le mensonge est révélé 3-7 jours plus tard (fiabilité −20)', () => {
  it('le premier conseil de Taylor est un mensonge, caché puis révélé', () => {
    const w = createWorld();
    w.flags['optimisations'] = 1;
    runTicks(w, 1);
    arrive(w, 'taylor');
    const dayOfAdvice = dayIndexOf(w.time.tick) + 1;
    runTicks(w, DAY); // conseil donné au jour 1
    const st = w.council.ghosts['taylor'];
    expect(st?.history).toHaveLength(1);
    const rec = st?.history[0];
    expect(rec?.veracite).toBe('mensonge');
    expect(rec?.revealed).toBe(false);
    expect(rec?.revealDay).toBeGreaterThanOrEqual(dayOfAdvice + 3);
    expect(rec?.revealDay).toBeLessThanOrEqual(dayOfAdvice + 7);
    expect(st?.fiabilite).toBe(60);

    // Jours suivants : seule la décroît quotidienne s'applique (pas de nouveaux conseils).
    const revealDay = rec?.revealDay ?? 0;
    w.time.tick = (revealDay - 1) * TICKS_PER_DAY;
    councilDay(w);
    expect(rec?.revealed).toBe(false); // pas encore le bon jour

    w.time.tick = revealDay * TICKS_PER_DAY;
    councilDay(w);
    expect(rec?.revealed).toBe(true);
    expect(st?.fiabilite).toBe(40); // −20 permanent
    expect(w.events.some((e) => e.title === 'Rétrospection — Frederick W. Taylor')).toBe(true);
    w.time.tick = (revealDay + 1) * TICKS_PER_DAY;
    councilDay(w);
    expect(st?.fiabilite).toBe(40); // la perte ne se répare pas seule
  });
});

// ---------- Loyauté : conseils et décisions ----------

describe('loyauté — +5 suivi, −3 ignoré, +8 aligné, −10 contraire', () => {
  it('suivre puis ignorer un conseil déplace la loyauté de +5 puis −3', () => {
    const w = createWorld();
    w.flags['optimisations'] = 1;
    runTicks(w, 1);
    arrive(w, 'taylor');
    runTicks(w, DAY); // premier conseil (mensonge — peu importe ici)
    const st = w.council.ghosts['taylor'];
    const premier = st?.history[0]?.adviceId ?? '';

    const suivi = councilAnswerAdvice(w, 'taylor', premier, true);
    expect(suivi.ok).toBe(true);
    expect(st?.loyalty).toBe(55);
    expect(st?.history[0]?.answered).toBe(true);
    expect(st?.history[0]?.followed).toBe(true);

    st!.nextAdviceDay = dayIndexOf(w.time.tick);
    councilTick(w);
    expect(st?.history).toHaveLength(2);
    const second = st?.history[1]?.adviceId ?? '';
    expect(second).not.toBe(premier);
    const ignore = councilAnswerAdvice(w, 'taylor', second, false);
    expect(ignore.ok).toBe(true);
    expect(st?.loyalty).toBe(52);
    expect(councilAnswerAdvice(w, 'taylor', premier, true).ok).toBe(false); // déjà répondu
  });

  it('une décision clé donne +8 aux voix alignées et −10 aux doctrines contraires', () => {
    const w = createWorld();
    w.flags['echanges'] = 1;
    w.flags['conflitsRepartition'] = 1;
    runTicks(w, 1);
    arrive(w, 'smith'); // doctrine : marche
    arrive(w, 'marx');  // doctrine : solidarite

    const aligned = councilKeyDecision(w, 'marche');
    expect(aligned).toEqual(['smith']);
    expect(w.council.ghosts['smith']?.loyalty).toBe(58);
    expect(w.council.ghosts['marx']?.loyalty).toBe(40);
    expect(w.council.decisions['marche']).toBe(1);

    const aligned2 = councilKeyDecision(w, 'communs');
    expect(aligned2).toEqual([]);
    expect(w.council.ghosts['marx']?.loyalty).toBe(40); // solidarite ≠ contraire de communs
  });

  it('la paire communs/autorité fonctionne aussi', () => {
    const w = createWorld();
    giveProject(w, true);
    w.flags['incidents'] = 1;
    runTicks(w, 1);
    arrive(w, 'ostrom'); // communs
    arrive(w, 'hobbes'); // autorite
    councilKeyDecision(w, 'communs');
    expect(w.council.ghosts['ostrom']?.loyalty).toBe(58);
    expect(w.council.ghosts['hobbes']?.loyalty).toBe(40);
  });
});

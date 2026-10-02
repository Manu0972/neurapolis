/**
 * Tests J5 — Atelier de la Friche avec Karim Bensalah.
 *
 * Vérifie :
 * - Conditions d'ouverture avec Karim (confiance, amitié ou compétence technique)
 * - Dotation initiale, membres et pièces de départ
 * - Récupération de pièces (fouille friche déterministe) et achat de lots
 * - Usure des outils à chaque réparation (barème par difficulté) et blocage sous 20 %
 * - Révision et maintenance des outils (restauration à 100 %)
 * - Grille tarifaire à 3 niveaux (Solidaire −30 %, Standard, Soutien +35 %)
 * - Cycle complet des commandes : disponible → en_cours → repare → livre
 * - Encaissement, alimentation du fonds solidaire et impacts relationnels/quartier
 * - Répartition hebdomadaire (égalité, équité, incitation)
 * - Invariant comptable STRICT : Σ(entrées − sorties) = balance, vérifié après chaque écriture
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import {
  acceptOrder, buySalvageParts, createWorkshop, deliverOrder, ensureAvailableOrders,
  ledgerBalance, ledgerInvariantHolds, maintainTools, repairOrder, scavengeParts,
  setTariffMode, weeklyResult, workshopDay, workshopWeek, workshopWeeklyDistribution,
} from '../src/simulation/workshop';
import { TARIFF_GRID, WORKSHOP_CONFIG } from '../src/data/workshop';
import { runTicks } from '../src/simulation/engine';
import { TICKS_PER_DAY, type RepairOrder, type WorldState } from '../src/core/types';

function openWorkshopForTest(w: WorldState): WorldState {
  w.player.relations['karim']!.confiance = 25;
  expect(createWorkshop(w).ok).toBe(true);
  return w;
}

describe('Atelier de la Friche — création & prérequis (Karim)', () => {
  it('refusé si la confiance, l’amitié et la technique sont trop faibles', () => {
    const w = createWorld();
    w.player.relations['karim']!.confiance = 10;
    w.player.relations['karim']!.amitie = 10;
    w.player.skills.technique.level = 0;

    const refuse = createWorkshop(w);
    expect(refuse.ok).toBe(false);
    expect(refuse.message).toContain('Karim hésite');
    expect(w.workshop).toBeUndefined();
  });

  it('accepté dès que la confiance envers Karim atteint 20', () => {
    const w = createWorld();
    w.player.relations['karim']!.confiance = 20;

    const r = createWorkshop(w);
    expect(r.ok).toBe(true);
    expect(w.workshop?.active).toBe(true);
    expect(w.workshop?.partner).toBe('karim');
    expect(w.workshop?.members).toEqual(['karim']);
    expect(w.workshop?.partsStock).toBe(WORKSHOP_CONFIG.initialPartsStock);
    expect(w.workshop?.toolCondition).toBe(100);
    expect(w.workshop?.solidarityFund).toBe(0);
    expect(w.workshop?.balance).toBe(0);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });

  it('accepté si Camille a Technique niveau 1, même sans relation préalable', () => {
    const w = createWorld();
    w.player.relations['karim']!.confiance = 5;
    w.player.skills.technique.level = 1;

    const r = createWorkshop(w);
    expect(r.ok).toBe(true);
    expect(w.workshop?.active).toBe(true);
  });

  it('ne peut pas être ouvert deux fois', () => {
    const w = createWorld();
    w.player.relations['karim']!.confiance = 25;
    expect(createWorkshop(w).ok).toBe(true);

    const deuxieme = createWorkshop(w);
    expect(deuxieme.ok).toBe(false);
    expect(deuxieme.message).toContain('déjà en activité');
  });

  it('l’ouverture renforce durablement la relation avec Karim et la réputation', () => {
    const w = createWorld();
    w.player.relations['karim']!.confiance = 25;
    const initialRep = w.player.reputation;
    const initialAmitie = w.player.relations['karim']!.amitie;

    createWorkshop(w);
    expect(w.player.relations['karim']!.amitie).toBeGreaterThan(initialAmitie);
    expect(w.player.reputation).toBeGreaterThan(initialRep);
  });
});

describe('Atelier de la Friche — pièces de récupération', () => {
  it('la fouille dans la friche rapporte des pièces et fatigue le joueur', () => {
    const w = openWorkshopForTest(createWorld());
    const stockAvant = w.workshop!.partsStock;
    const fatigueAvant = w.player.needs.fatigue;

    const res = scavengeParts(w);
    expect(res.ok).toBe(true);
    expect(w.workshop!.partsStock).toBeGreaterThan(stockAvant);
    expect(w.player.needs.fatigue).toBeGreaterThan(fatigueAvant);
    expect(w.player.skills.technique.xp).toBeGreaterThan(0);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });

  it('l’achat de lot de pièces est payé par la caisse si elle est garnie', () => {
    const w = openWorkshopForTest(createWorld());
    w.workshop!.balance = 20;
    w.workshop!.ledger.push({ day: 0, date: '2020-09-01', label: 'Caisse test', amount: 20 });
    const stockAvant = w.workshop!.partsStock;
    const moneyJoueur = w.player.money;

    const res = buySalvageParts(w);
    expect(res.ok).toBe(true);
    expect(w.workshop!.partsStock).toBe(stockAvant + WORKSHOP_CONFIG.partsBatchUnits);
    expect(w.workshop!.balance).toBe(20 - WORKSHOP_CONFIG.partsBatchCost);
    expect(w.player.money).toBe(moneyJoueur); // la poche n'a rien payé
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });

  it('l’achat de lot est payé par apport personnel si la caisse est vide', () => {
    const w = openWorkshopForTest(createWorld());
    w.workshop!.balance = 0;
    w.player.money = 25;
    const stockAvant = w.workshop!.partsStock;

    const res = buySalvageParts(w);
    expect(res.ok).toBe(true);
    expect(w.workshop!.partsStock).toBe(stockAvant + WORKSHOP_CONFIG.partsBatchUnits);
    expect(w.workshop!.balance).toBe(0); // apport + dépense = 0
    expect(w.player.money).toBe(25 - WORKSHOP_CONFIG.partsBatchCost);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });

  it('l’achat est refusé si ni la caisse ni le joueur ne peuvent payer', () => {
    const w = openWorkshopForTest(createWorld());
    w.workshop!.balance = 0;
    w.player.money = 5;

    const res = buySalvageParts(w);
    expect(res.ok).toBe(false);
    expect(res.message).toContain('Fonds insuffisants');
  });
});

describe('Atelier de la Friche — usure et révision des outils', () => {
  it('chaque réparation use les outils selon la difficulté', () => {
    const w = openWorkshopForTest(createWorld());
    const order = w.workshop!.orders[0]!;
    acceptOrder(w, order.id, 'standard');

    const condAvant = w.workshop!.toolCondition;
    const res = repairOrder(w, order.id);
    expect(res.ok).toBe(true);
    expect(w.workshop!.toolCondition).toBeLessThan(condAvant);
    const expectedWear = order.difficulty * 6 + 4;
    expect(w.workshop!.toolCondition).toBe(condAvant - expectedWear);
  });

  it('refuse la réparation si les outils sont sous le seuil d’usure (20 %)', () => {
    const w = openWorkshopForTest(createWorld());
    w.workshop!.toolCondition = 15;
    const order = w.workshop!.orders[0]!;
    acceptOrder(w, order.id, 'standard');

    const res = repairOrder(w, order.id);
    expect(res.ok).toBe(false);
    expect(res.message).toContain('Outils trop usés');
  });

  it('maintainTools restaure l’outillage à 100 % et maintient l’invariant comptable', () => {
    const w = openWorkshopForTest(createWorld());
    w.workshop!.toolCondition = 30;
    w.player.money = 20;

    const res = maintainTools(w);
    expect(res.ok).toBe(true);
    expect(w.workshop!.toolCondition).toBe(100);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });
});

describe('Atelier de la Friche — grille tarifaire & cycle de commande', () => {
  it('le tarif Solidaire accorde un rabais de 30 % et augmente fortement la confiance', () => {
    const w = openWorkshopForTest(createWorld());
    const order = w.workshop!.orders[0]!;
    acceptOrder(w, order.id, 'solidaire');

    const expectedPrice = Math.round(order.basePrice * TARIFF_GRID.solidaire.multiplier * 100) / 100;
    expect(order.finalPrice).toBe(expectedPrice);

    repairOrder(w, order.id);
    const relAvant = w.player.relations[order.clientNpc]!.amitie;
    const confQuartierAvant = w.district.confianceQuartier;

    const del = deliverOrder(w, order.id);
    expect(del.ok).toBe(true);
    expect(order.status).toBe('livre');
    expect(w.player.relations[order.clientNpc]!.amitie).toBe(relAvant + TARIFF_GRID.solidaire.clientRelBonus);
    expect(w.district.confianceQuartier).toBe(confQuartierAvant + TARIFF_GRID.solidaire.reputationBonus);
  });

  it('le tarif Soutien majore le prix de 35 % et alimente davantage le fonds solidaire', () => {
    const w = openWorkshopForTest(createWorld());
    const order = w.workshop!.orders[0]!;
    acceptOrder(w, order.id, 'soutien');

    const expectedPrice = Math.round(order.basePrice * TARIFF_GRID.soutien.multiplier * 100) / 100;
    expect(order.finalPrice).toBe(expectedPrice);

    repairOrder(w, order.id);
    const fundAvant = w.workshop!.solidarityFund;

    deliverOrder(w, order.id);
    const expectedSolidarity = Math.round(order.finalPrice * TARIFF_GRID.soutien.solidarityContributionFactor * 100) / 100;
    expect(w.workshop!.solidarityFund).toBe(fundAvant + expectedSolidarity);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });

  it('une commande ne peut pas être livrée avant d’avoir été réparée', () => {
    const w = openWorkshopForTest(createWorld());
    const order = w.workshop!.orders[0]!;
    acceptOrder(w, order.id, 'standard');

    const del = deliverOrder(w, order.id);
    expect(del.ok).toBe(false);
    expect(del.message).toContain('doit être réparée');
  });

  it('une commande refuse la réparation si le stock de pièces est insuffisant', () => {
    const w = openWorkshopForTest(createWorld());
    w.workshop!.partsStock = 0;
    const order = w.workshop!.orders[0]!;
    acceptOrder(w, order.id, 'standard');

    const rep = repairOrder(w, order.id);
    expect(rep.ok).toBe(false);
    expect(rep.message).toContain('Pièces de rechange insuffisantes');
  });
});

describe('Atelier de la Friche — Grand Livre & Répartition hebdomadaire', () => {
  it('l’invariant comptable Σ entrées − sorties = balance est respecté à chaque opération', () => {
    const w = openWorkshopForTest(createWorld());
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);

    // 1. Achat pièces
    w.player.money = 50;
    buySalvageParts(w);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);

    // 2. Traitement d'une commande
    const order = w.workshop!.orders[0]!;
    acceptOrder(w, order.id, 'standard');
    repairOrder(w, order.id);
    deliverOrder(w, order.id);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);

    // 3. Maintenance
    maintainTools(w);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);

    // 4. Seconde commande au tarif soutien
    ensureAvailableOrders(w, 2);
    const order2 = w.workshop!.orders.find((o: RepairOrder) => o.status === 'disponible')!;
    acceptOrder(w, order2.id, 'soutien');
    repairOrder(w, order2.id);
    deliverOrder(w, order2.id);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);

    // 5. Répartition hebdomadaire
    const moneyJoueurAvant = w.player.money;
    const dist = workshopWeeklyDistribution(w, 'equite');
    expect(dist.ok).toBe(true);
    expect(w.player.money).toBeGreaterThan(moneyJoueurAvant);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
    expect(ledgerBalance(w.workshop!)).toBe(w.workshop!.balance);
  });

  it('la répartition en mode égalité partage équitablement les gains 50/50', () => {
    const w = openWorkshopForTest(createWorld());
    // Injection d'une caisse propre
    w.workshop!.balance = 30;
    w.workshop!.ledger.push({ day: 0, date: '2020-09-01', label: 'Bénéfice test', amount: 30 });
    w.workshop!.week.revenue = 30;
    w.workshop!.week.expenses = 0;

    const moneyJoueurAvant = w.player.money;
    const res = workshopWeeklyDistribution(w, 'egalite');
    expect(res.ok).toBe(true);
    expect(w.player.money).toBe(moneyJoueurAvant + 15);
    expect(w.workshop!.balance).toBe(0);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });
});

describe('Atelier de la Friche — cadence moteur (engine ticks)', () => {
  it('workshopDay renouvelle automatiquement les commandes si moins de 3 sont disponibles', () => {
    const w = openWorkshopForTest(createWorld());
    // Accepter toutes les commandes
    for (const ord of w.workshop!.orders) {
      acceptOrder(w, ord.id, 'standard');
    }
    expect(w.workshop!.orders.filter((o: RepairOrder) => o.status === 'disponible').length).toBe(0);

    workshopDay(w);
    expect(w.workshop!.orders.filter((o: RepairOrder) => o.status === 'disponible').length).toBeGreaterThanOrEqual(2);
  });

  it('une simulation de 7 jours déclenche le tick de l’atelier sans erreur ni régression', () => {
    const w = openWorkshopForTest(createWorld());
    runTicks(w, TICKS_PER_DAY * 7);

    expect(w.workshop?.active).toBe(true);
    expect(ledgerInvariantHolds(w.workshop!)).toBe(true);
  });
});

describe('Dynamisme du rendu 2.5D — props, marche dynamique & fantômes conseillers', () => {
  const createMockCtx = () => {
    const calls: string[] = [];
    const gradientStub = { addColorStop: () => {} };
    const base: Record<string, unknown> = {
      calls,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      shadowBlur: 0,
      shadowColor: 'transparent',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      lineCap: 'butt',
      lineJoin: 'miter',
      canvas: { width: 480, height: 270 },
    };
    return new Proxy(base, {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        // Return stubs for known return-value methods
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient')
          return () => gradientStub;
        if (prop === 'measureText') return () => ({ width: 50 });
        if (prop === 'getImageData')
          return () => ({ data: new Uint8ClampedArray(4) });
        // Default: any method call records itself and returns undefined
        return (..._args: unknown[]) => { calls.push(prop as string); };
      },
      set(target, prop, value) {
        target[prop as string] = value;
        return true;
      },
    }) as unknown as CanvasRenderingContext2D & { calls: string[] };
  };

  it('drawGhostSilhouette dessine la silhouette spectrale en mode murmure et débat', async () => {
    const { drawGhostSilhouette } = await import('../src/presentation/sprite');
    const { GHOST_DEFS_BY_ID } = await import('../src/data/ghosts/registry');

    const ctx = createMockCtx();
    const smith = GHOST_DEFS_BY_ID['smith']!;
    const marx = GHOST_DEFS_BY_ID['marx']!;
    const ostrom = GHOST_DEFS_BY_ID['ostrom']!;

    // Murmure de Smith
    expect(() => drawGhostSilhouette(ctx, 100, 100, 2, smith, 1000, 'murmure')).not.toThrow();
    expect(ctx.calls).toContain('save');
    expect(ctx.calls).toContain('restore');

    // Débat de Marx et Ostrom
    expect(() => drawGhostSilhouette(ctx, 150, 120, 2, marx, 1200, 'debat')).not.toThrow();
    expect(() => drawGhostSilhouette(ctx, 200, 120, 2, ostrom, 1200, 'debat')).not.toThrow();
  });

  it('drawWorldProp gère le mobilier urbain et les lampadaires allumés en soirée/nuit', async () => {
    const { drawWorldProp } = await import('../src/presentation/world-sprites');
    const ctx = createMockCtx();

    // Arbre, banc, jardinière
    expect(() => drawWorldProp(ctx, 'arbre', 10, 20, 32, 1000)).not.toThrow();
    expect(() => drawWorldProp(ctx, 'banc', 50, 60, 32, 1000)).not.toThrow();
    expect(() => drawWorldProp(ctx, 'jardiniere', 80, 90, 32, 1000)).not.toThrow();

    // Lampadaire éteint le jour vs allumé le soir
    expect(() => drawWorldProp(ctx, 'lampadaire', 100, 100, 32, 1000, false)).not.toThrow();
    expect(() => drawWorldProp(ctx, 'lampadaire', 100, 100, 32, 1000, true)).not.toThrow();
    expect(ctx.calls).toContain('arc'); // halo lumineux tracé
  });

  it('renderWorld s’exécute avec marche dynamique et fantômes conseillers sans régression', async () => {
    const { renderWorld } = await import('../src/presentation/renderer');
    const w = createWorld();
    const ctx = createMockCtx();

    // Marche active du joueur et fantôme murmure
    expect(() => {
      renderWorld(ctx, w, 480, 270, 500, {
        walkingEntities: { player: true },
        whisperingGhosts: ['smith'],
      });
    }).not.toThrow();

    // Débat de fantômes conseillers
    expect(() => {
      renderWorld(ctx, w, 480, 270, 600, {
        walkingEntities: { player: false },
        debatingGhosts: ['smith', 'marx', 'ostrom'],
      });
    }).not.toThrow();
  });
});

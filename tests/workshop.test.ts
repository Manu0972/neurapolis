/**
 * Tests J5 — Second projet économique : Atelier de Réparation de la Friche.
 * Création, approvisionnement (pièces & récupération), carnet de commandes,
 * requis de compétence `technique`, recrutement de Karim/Yasmine,
 * risques de retards, invariant strict du livre de comptes, et déterminisme.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { TICKS_PER_DAY } from '../src/core/types';
import {
  buyWorkshopParts, collectSalvage, createWorkshop, ledgerBalanceWorkshop,
  ledgerInvariantHoldsWorkshop, recruitWorkshopMember, workOnOrder, workshopDay,
} from '../src/simulation/workshop';

const DAY = TICKS_PER_DAY;

describe('Atelier de Réparation — création & recrutement', () => {
  it('ouvre l’atelier avec Karim par défaut et crée le carnet de commandes initial', () => {
    const w = createWorld();
    const r = createWorkshop(w);
    expect(r.ok).toBe(true);
    expect(w.workshop?.active).toBe(true);
    expect(w.workshop?.members).toEqual(['karim']);
    expect(w.workshop?.orders.length).toBeGreaterThanOrEqual(4);
    expect(ledgerInvariantHoldsWorkshop(w.workshop!)).toBe(true);

    const r2 = createWorkshop(w);
    expect(r2.ok).toBe(false);
    expect(r2.message).toContain('déjà ouvert');
  });

  it('recruter Yasmine exige technique ≥ 1', () => {
    const w = createWorld();
    createWorkshop(w);
    const refuse = recruitWorkshopMember(w, 'yasmine');
    expect(refuse.ok).toBe(false);
    expect(refuse.message).toMatch(/technique/i);

    w.player.skills.technique.level = 1;
    const ok = recruitWorkshopMember(w, 'yasmine');
    expect(ok.ok).toBe(true);
    expect(w.workshop?.members).toEqual(['karim', 'yasmine']);
  });
});

describe('Atelier de Réparation — approvisionnement (pièces & récupération)', () => {
  it('collectSalvage augmente la réserve de récup’ et la fatigue', () => {
    const w = createWorld();
    createWorkshop(w);
    const initialSalvage = w.workshop!.salvageStock;
    const initialFatigue = w.player.needs.fatigue;

    const r = collectSalvage(w);
    expect(r.ok).toBe(true);
    expect(w.workshop?.salvageStock).toBeGreaterThan(initialSalvage);
    expect(w.player.needs.fatigue).toBeGreaterThan(initialFatigue);
    expect(w.player.skills.technique.xp).toBe(2);
  });

  it('buyWorkshopParts achète 10 pièces pour 15 € et respecte l’invariant du livre de comptes', () => {
    const w = createWorld();
    createWorkshop(w);
    const initialParts = w.workshop!.partsStock;

    const r = buyWorkshopParts(w); // payé de la poche du joueur (15 €)
    expect(r.ok).toBe(true);
    expect(w.workshop?.partsStock).toBe(initialParts + 10);
    expect(w.player.money).toBe(0);
    expect(w.workshop?.balance).toBe(0);
    expect(ledgerInvariantHoldsWorkshop(w.workshop!)).toBe(true);
  });
});

describe('Atelier de Réparation — traitement des commandes & livre de comptes', () => {
  it('une commande exige du stock et la compétence requise, et verse la récompense à la livraison', () => {
    const w = createWorld();
    createWorkshop(w);
    const order = w.workshop!.orders.find((o) => o.id === 'velo_bertin')!;
    expect(order.status).toBe('pending');

    // Avancement 1/2
    const res1 = workOnOrder(w, 'velo_bertin');
    expect(res1.ok).toBe(true);
    expect(res1.completed).toBe(false);
    expect(order.status).toBe('in_progress');

    // Avancement 2/2 -> complété
    const res2 = workOnOrder(w, 'velo_bertin');
    expect(res2.ok).toBe(true);
    expect(res2.completed).toBe(true);
    expect(order.status).toBe('completed');
    expect(w.workshop?.balance).toBe(14);
    expect(ledgerBalanceWorkshop(w.workshop!)).toBe(14);
    expect(ledgerInvariantHoldsWorkshop(w.workshop!)).toBe(true);
    expect(w.player.reputation).toBeGreaterThan(45);
  });

  it('refuse une commande si la compétence technique est trop faible', () => {
    const w = createWorld();
    createWorkshop(w);
    const order = w.workshop!.orders.find((o) => o.minTechnique > 0)!;

    const res = workOnOrder(w, order.id);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/technique/i);
  });
});

describe('Atelier de Réparation — simulation des retards & risques', () => {
  it('une commande non honorée à la date limite échoue et baisse la réputation', () => {
    const w = createWorld();
    createWorkshop(w);
    const rep = w.player.reputation;

    // Avancer de 6 jours sans faire les réparations
    runTicks(w, 6 * DAY);

    const failedOrders = w.workshop!.orders.filter((o) => o.status === 'failed');
    expect(failedOrders.length).toBeGreaterThan(0);
    expect(w.player.reputation).toBeLessThan(rep);
    expect(w.events.some((e) => e.title.includes('Commande non honorée'))).toBe(true);
  });
});

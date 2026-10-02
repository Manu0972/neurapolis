import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { assignVentureRole, ensureMultiVentureState, multiVenturesDayTick, resolveEconomicHazard, unassignVentureRole, updateVentureSynergies } from '../src/simulation/multi_ventures';

describe('Multi-Activités, Rôles & Aléas Économiques', () => {
  it('initialise les entreprises et les aléas de départ', () => {
    const w = createWorld();
    const mv = ensureMultiVentureState(w);
    expect(mv.ventures.stand_roses).toBeDefined();
    expect(mv.ventures.stand_roses.active).toBe(true);
    expect(mv.hazards.length).toBeGreaterThan(0);
  });

  it('assigne et libère un rôle de gestion dans une entreprise', () => {
    const w = createWorld();
    const rAssign = assignVentureRole(w, 'stand_roses', 'logistique', 'noah');
    expect(rAssign.ok).toBe(true);

    const mv = ensureMultiVentureState(w);
    expect(mv.ventures.stand_roses.roles.logistique).toBe('noah');

    const rUnassign = unassignVentureRole(w, 'stand_roses', 'logistique');
    expect(rUnassign.ok).toBe(true);
    expect(mv.ventures.stand_roses.roles.logistique).toBeUndefined();
  });

  it('calcule les synergies inter-entreprises lorsque plusieurs activités sont actives', () => {
    const w = createWorld();
    const mv = ensureMultiVentureState(w);
    mv.ventures.stand_roses.active = true;
    mv.ventures.coursiers_doux.active = true;
    mv.ventures.atelier_friche.active = true;

    const synergies = updateVentureSynergies(w);
    expect(synergies.length).toBeGreaterThanOrEqual(2);
    expect(synergies.some((s) => s.includes('Livraison Douce'))).toBe(true);
  });

  it('résout un aléa économique en payant les frais de résolution', () => {
    const w = createWorld();
    w.player.money = 20;
    const mv = ensureMultiVentureState(w);
    const hazard = mv.hazards[0]!;

    const res = resolveEconomicHazard(w, hazard.id);
    expect(res.ok).toBe(true);
    expect(hazard.resolved).toBe(true);
    expect(w.player.money).toBe(20 - hazard.costToResolve);
  });

  it('génère des revenus passifs lors du cycle journalier selon les entreprises actives et rôles', () => {
    const w = createWorld();
    w.player.money = 10;
    const mv = ensureMultiVentureState(w);
    mv.ventures.stand_roses.active = true;
    assignVentureRole(w, 'stand_roses', 'directeur', 'noah');

    multiVenturesDayTick(w);
    expect(w.player.money).toBeGreaterThan(10);
  });
});

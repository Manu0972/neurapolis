import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { activateActionPlan, ensureActionPlanningState, payTerritoryConcession, progressActionPlanStep, unlockTerritoryNode } from '../src/simulation/action_plan';

describe('Plans d’Action & Cartographie Stratégique', () => {
  it('initialise les plans d’action avec le premier plan actif par défaut', () => {
    const w = createWorld();
    const ap = ensureActionPlanningState(w);
    expect(ap.activePlanId).toBe('plan_approvisionnement_direct');
    expect(ap.plans.plan_approvisionnement_direct?.active).toBe(true);
    expect(ap.expansionLevel).toBe('quartier');
  });

  it('permet d’activer un autre plan d’action', () => {
    const w = createWorld();
    const res = activateActionPlan(w, 'plan_optimisation_logistique');
    expect(res.ok).toBe(true);
    const ap = ensureActionPlanningState(w);
    expect(ap.activePlanId).toBe('plan_optimisation_logistique');
    expect(ap.plans.plan_optimisation_logistique?.active).toBe(true);
    expect(ap.plans.plan_approvisionnement_direct?.active).toBe(false);
  });

  it('valide les étapes une à une et déclenche l’accomplissement du plan avec promotion d’expansion', () => {
    const w = createWorld();
    const planId = 'plan_approvisionnement_direct';
    const ap = ensureActionPlanningState(w);
    const plan = ap.plans[planId]!;

    const s1 = plan.steps[0]!.id;
    const r1 = progressActionPlanStep(w, planId, s1);
    expect(r1.ok).toBe(true);
    expect(r1.planCompleted).toBe(false);

    const s2 = plan.steps[1]!.id;
    const s3 = plan.steps[2]!.id;
    progressActionPlanStep(w, planId, s2);
    const r3 = progressActionPlanStep(w, planId, s3);

    expect(r3.planCompleted).toBe(true);
    expect(plan.completed).toBe(true);
    expect(w.flags[`plan_completed_${planId}`]).toBe(1);
    expect(ap.expansionLevel).toBe('inter_quartiers');
    expect(w.player.characteristics.discipline).toBeGreaterThan(48);
  });

  it('débloque un nœud territorial et permet de régler une concession diplomatique', () => {
    const w = createWorld();
    w.player.money = 50;
    const rUnlock = unlockTerritoryNode(w, 'tramway');
    expect(rUnlock.ok).toBe(true);

    const ap = ensureActionPlanningState(w);
    expect(ap.territory.tramway.unlocked).toBe(true);
    expect(ap.territory.tramway.activeArrangement).toBe(false);

    const rConcession = payTerritoryConcession(w, 'tramway');
    expect(rConcession.ok).toBe(true);
    expect(ap.territory.tramway.activeArrangement).toBe(true);
    expect(w.player.money).toBe(50 - 35);
  });
});

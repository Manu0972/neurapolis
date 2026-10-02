/**
 * NEURAPOLIS — Moteur des Plans d'Action et de la Cartographie Stratégique.
 */
import type { ActionPlanCategory, ActionPlanState, ActionPlanningState, TerritorialZoneId, TerritoryNodeState, WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { INITIAL_ACTION_PLANS, INITIAL_TERRITORY_NODES } from '../data/action_plans';
import { notify } from './events';

export function ensureActionPlanningState(w: WorldState): ActionPlanningState {
  if (!w.actionPlanning) {
    const plans: Record<string, ActionPlanState> = {};
    for (const t of INITIAL_ACTION_PLANS) {
      plans[t.id] = {
        id: t.id,
        title: t.title,
        category: t.category,
        description: t.description,
        ghostAdvisorId: t.ghostAdvisorId,
        ghostInsight: t.ghostInsight,
        steps: t.steps.map((s) => ({ id: s.id, label: s.label, completed: false })),
        active: t.id === INITIAL_ACTION_PLANS[0]?.id,
        completed: false,
        unlockedDay: t.unlockedDay,
        rewardDescription: t.rewardDescription,
      };
    }
    w.actionPlanning = {
      plans,
      activePlanId: INITIAL_ACTION_PLANS[0]?.id,
      territory: structuredClone(INITIAL_TERRITORY_NODES),
      expansionLevel: 'quartier',
    };
  }
  return w.actionPlanning;
}

export function activateActionPlan(w: WorldState, planId: string): { ok: boolean; message: string } {
  const ap = ensureActionPlanningState(w);
  const target = ap.plans[planId];
  if (!target) return { ok: false, message: 'Plan introuvable.' };

  for (const p of Object.values(ap.plans)) {
    p.active = p.id === planId;
  }
  ap.activePlanId = planId;
  return { ok: true, message: `Plan actif : ${target.title}. Objectif engagé.` };
}

export function progressActionPlanStep(
  w: WorldState,
  planId: string,
  stepId: string,
): { ok: boolean; message: string; planCompleted: boolean } {
  const ap = ensureActionPlanningState(w);
  const plan = ap.plans[planId];
  if (!plan) return { ok: false, message: 'Plan introuvable.', planCompleted: false };

  const step = plan.steps.find((s) => s.id === stepId);
  if (!step) return { ok: false, message: 'Étape introuvable.', planCompleted: false };

  if (step.completed) return { ok: false, message: 'Étape déjà validée.', planCompleted: false };

  step.completed = true;
  const allDone = plan.steps.every((s) => s.completed);
  if (allDone) {
    plan.completed = true;
    w.flags[`plan_completed_${planId}`] = 1;
    w.player.reputation = Math.min(100, w.player.reputation + 10);
    w.player.characteristics.discipline = Math.min(100, w.player.characteristics.discipline + 4);
    w.player.characteristics.comprehension = Math.min(100, w.player.characteristics.comprehension + 4);

    // Mettre à jour le palier d'expansion
    const completedCount = Object.values(ap.plans).filter((p) => p.completed).length;
    if (completedCount >= 4) ap.expansionLevel = 'nationale';
    else if (completedCount >= 3) ap.expansionLevel = 'regionale';
    else if (completedCount >= 2) ap.expansionLevel = 'ville';
    else if (completedCount >= 1) ap.expansionLevel = 'inter_quartiers';

    const day = (w.time as { tick: number; day?: number }).day ?? dayIndexOf(w.time.tick);
    w.events.unshift({
      id: `plan_complete_${planId}_${w.time.tick}`,
      day,
      date: dateOf(day).iso,
      type: 'vie',
      title: `Plan d’Action accompli : ${plan.title}`,
      text: `${plan.description} Récompense : ${plan.rewardDescription}`,
      causes: [{ facteur: 'Exécution intégrale des jalons stratégiques', poids: 3 }],
    });
  }

  return {
    ok: true,
    message: allDone
      ? `🎉 Plan d’action « ${plan.title} » complété avec succès ! ${plan.rewardDescription}`
      : `Étape validée : ${step.label} (${plan.steps.filter((s) => s.completed).length}/${plan.steps.length} complétées).`,
    planCompleted: allDone,
  };
}

export function unlockTerritoryNode(
  w: WorldState,
  zoneId: TerritorialZoneId,
): { ok: boolean; message: string } {
  const ap = ensureActionPlanningState(w);
  const node = ap.territory[zoneId];
  if (!node) return { ok: false, message: 'Zone territoriale inconnue.' };
  if (node.unlocked) return { ok: false, message: 'Zone déjà débloquée.' };

  node.unlocked = true;
  node.ourPresence = 15;
  w.player.reputation = Math.min(100, w.player.reputation + 5);

  return {
    ok: true,
    message: `Nouvelle zone territoriale ouverte : ${node.name} ! Potentiel de marché : ${node.marketPotential} %.`,
  };
}

export function payTerritoryConcession(
  w: WorldState,
  zoneId: TerritorialZoneId,
): { ok: boolean; message: string } {
  const ap = ensureActionPlanningState(w);
  const node = ap.territory[zoneId];
  if (!node) return { ok: false, message: 'Zone inconnue.' };
  if (node.activeArrangement) return { ok: false, message: 'Arrangement diplomatique déjà actif pour cette zone.' };

  if (w.player.money < node.concessionCost) {
    return {
      ok: false,
      message: `Fonds insuffisants (${node.concessionCost} € requis, tu as ${w.player.money.toFixed(2)} €).`,
    };
  }

  w.player.money -= node.concessionCost;
  node.activeArrangement = true;
  node.ourPresence = Math.min(100, node.ourPresence + 30);
  node.competitorPresence = Math.max(0, node.competitorPresence - 20);

  return {
    ok: true,
    message: `Arrangement et concession sécurisés pour ${node.name} (−${node.concessionCost} €). Présence accrue à ${node.ourPresence} %.`,
  };
}

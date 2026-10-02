/**
 * NEURAPOLIS — Moteur Multi-Entreprises, Attribution des Rôles et Gestion des Aléas.
 */
import type { EconomicHazard, MultiVentureState, Notification, VentureId, VentureRole, VentureState, WorldState } from '../core/types';
import { INITIAL_ECONOMIC_HAZARDS, VENTURE_DEFS, VENTURE_ROLE_DEFS } from '../data/multi_ventures';
import { notify } from './events';

export function ensureMultiVentureState(w: WorldState): MultiVentureState {
  if (!w.multiVentures) {
    const ventures: Partial<Record<VentureId, VentureState>> = {};
    for (const [id, def] of Object.entries(VENTURE_DEFS) as [VentureId, typeof VENTURE_DEFS[VentureId]][]) {
      ventures[id] = {
        id,
        name: def.name,
        active: def.unlockedByDefault,
        roles: {},
        dailyRevenue: def.baseRevenuePerDay,
        dailyExpenses: def.baseExpensesPerDay,
        level: 1,
      };
    }
    w.multiVentures = {
      ventures: ventures as Record<VentureId, VentureState>,
      hazards: structuredClone(INITIAL_ECONOMIC_HAZARDS),
      synergiesActive: [],
    };
  }
  return w.multiVentures;
}

export function assignVentureRole(
  w: WorldState,
  ventureId: VentureId,
  role: VentureRole,
  npcId: string,
): { ok: boolean; message: string } {
  const mv = ensureMultiVentureState(w);
  const venture = mv.ventures[ventureId];
  if (!venture) return { ok: false, message: 'Entreprise introuvable.' };

  // Vérifier si le PNJ est déjà assigné à ce rôle dans cette entreprise
  venture.roles[role] = npcId;
  const roleDef = VENTURE_ROLE_DEFS[role];
  updateVentureSynergies(w);

  return {
    ok: true,
    message: `${npcId} assigné au rôle de ${roleDef.title} chez ${venture.name}. Bonus : ${roleDef.bonusText}`,
  };
}

export function unassignVentureRole(
  w: WorldState,
  ventureId: VentureId,
  role: VentureRole,
): { ok: boolean; message: string } {
  const mv = ensureMultiVentureState(w);
  const venture = mv.ventures[ventureId];
  if (!venture || !venture.roles[role]) return { ok: false, message: 'Aucun titulaire pour ce rôle.' };

  delete venture.roles[role];
  updateVentureSynergies(w);
  return { ok: true, message: `Rôle ${role} libéré chez ${venture.name}.` };
}

export function updateVentureSynergies(w: WorldState): string[] {
  const mv = ensureMultiVentureState(w);
  const synergies: string[] = [];

  const standActive = mv.ventures.stand_roses.active;
  const workshopActive = mv.ventures.atelier_friche.active;
  const coursiersActive = mv.ventures.coursiers_doux.active;
  const gazetteActive = mv.ventures.gazette_citoyenne.active;

  if (standActive && coursiersActive) {
    synergies.push('Synergie Vente & Livraison Douce : Tournées optimisées (+25% de volume de vente)');
  }
  if (workshopActive && coursiersActive) {
    synergies.push('Synergie Flotte Réparée : Entretien interne des triporteurs (Usure −50%, 0 panne)');
  }
  if (gazetteActive && (standActive || workshopActive)) {
    synergies.push('Synergie Média & Confiance : Tribune locale (+15% de clientèle pour les ateliers & stands)');
  }
  if (standActive && workshopActive && coursiersActive && gazetteActive) {
    synergies.push('Écosystème Circulaire Complet : Autonomie économique de Val-Ferrand (+40% marge nette globale)');
  }

  mv.synergiesActive = synergies;
  return synergies;
}

export function resolveEconomicHazard(
  w: WorldState,
  hazardId: string,
): { ok: boolean; message: string } {
  const mv = ensureMultiVentureState(w);
  const hazard = mv.hazards.find((h) => h.id === hazardId);
  if (!hazard) return { ok: false, message: 'Aléa économique introuvable.' };
  if (hazard.resolved) return { ok: false, message: 'Aléa déjà résolu.' };

  if (w.player.money < hazard.costToResolve) {
    return {
      ok: false,
      message: `Fonds insuffisants pour régler la situation (${hazard.costToResolve} € requis, tu as ${w.player.money.toFixed(2)} €).`,
    };
  }

  w.player.money -= hazard.costToResolve;
  hazard.resolved = true;
  w.player.characteristics.adaptabilite = Math.min(100, w.player.characteristics.adaptabilite + 3);
  w.player.reputation = Math.min(100, w.player.reputation + 4);

  return {
    ok: true,
    message: `Aléa réglé avec succès : ${hazard.title} (−${hazard.costToResolve} €). La situation commerciale est rétablie.`,
  };
}

export function multiVenturesDayTick(w: WorldState): Notification[] {
  const mv = ensureMultiVentureState(w);
  const notifs: Notification[] = [];

  // Mettre à jour l'activation des filières en fonction des autres systèmes
  if (w.workshop && !mv.ventures.atelier_friche.active) {
    mv.ventures.atelier_friche.active = true;
  }
  updateVentureSynergies(w);

  let totalNetProfit = 0;
  for (const v of Object.values(mv.ventures)) {
    if (!v.active) continue;
    // Les activités manuelles Stand et Atelier sont gérées par leurs Grands Livres respectifs.
    // Seules les filières déléguées (coursiers, gazette, grossiste) ou dotées d'une direction dédiée génèrent des flux automatisés.
    const isDelegated = v.id === 'coursiers_doux' || v.id === 'gazette_citoyenne' || v.id === 'grossiste_regional';
    const hasActiveManagement = Object.keys(v.roles).length > 0;
    if (!isDelegated && !hasActiveManagement) continue;

    let rev = v.dailyRevenue;
    let exp = v.dailyExpenses;

    // Bonus liés aux rôles assignés
    if (v.roles.directeur) rev *= 1.25;
    if (v.roles.logistique) rev *= 1.15;
    if (v.roles.negociateur) exp *= 0.85;
    if (v.roles.tresorier) rev += 2;

    // Bonus de synergie
    if (mv.synergiesActive.length > 0) {
      rev *= 1 + 0.08 * mv.synergiesActive.length;
    }

    const net = rev - exp;
    if (net > 0) totalNetProfit += net;
  }

  if (totalNetProfit > 0) {
    const playerGain = Math.round(totalNetProfit * 0.25 * 100) / 100;
    if (playerGain > 0) {
      w.player.money += playerGain;
      if (playerGain >= 2) {
        notifs.push(notify('bien', `Rendement des filières déléguées : +${playerGain.toFixed(2)} € nets perçus aujourd’hui.`));
      }
    }
  }

  return notifs;
}

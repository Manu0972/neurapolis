/**
 * Atelier de Réparation de la Friche — second projet économique.
 * Collecte de récupération à la Friche, achat de pièces détachées,
 * gestion de commandes sur mesure avec délais et requis de compétence `technique`,
 * recrutement de Karim/Yasmine, livre de comptes et impact sur la confiance du quartier.
 */
import type { NpcId, Notification, WorkshopState, WorldState } from '../core/types';
import { dateOf, dayIndexOf, weekIndexOf } from '../core/clock';
import { rngPick } from '../core/rng';
import { DYNAMIC_ORDER_TEMPLATES, INITIAL_REPAIR_ORDERS, WORKSHOP_CONFIG } from '../data/workshop';
import { NPC_BY_ID } from '../data/npcs';
import { SKILLS_LABELS } from '../data/actions';
import { bump, pushEvent } from './events';
import { applyRelation } from './relations';
import { addXp, skillLevel } from './skills';

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const round2 = (v: number): number => Math.round(v * 100) / 100;

export interface WorkshopActionResult { ok: boolean; message: string }
export interface OrderWorkResult { ok: boolean; message: string; completed?: boolean; reward?: number }

// ---------- Création ----------

export function createWorkshop(w: WorldState): WorkshopActionResult {
  if (w.workshop?.active) return { ok: false, message: 'L’Atelier de Réparation est déjà ouvert.' };
  const day = dayIndexOf(w.time.tick);

  const initialOrders = INITIAL_REPAIR_ORDERS.map((def) => ({
    id: def.id,
    clientName: def.clientName,
    npcId: def.npcId,
    itemLabel: def.itemLabel,
    partsNeeded: def.partsNeeded,
    salvageNeeded: def.salvageNeeded,
    workNeeded: def.workNeeded,
    workDone: 0,
    reward: def.reward,
    deadlineDay: day + def.deadlineDays,
    minTechnique: def.minTechnique,
    status: 'pending' as const,
  }));

  w.workshop = {
    id: 'atelier_friche',
    active: true,
    partsStock: 4,
    salvageStock: 4,
    members: ['karim'], // Karim est l'associé naturel à la Friche
    orders: initialOrders,
    completedOrdersCount: 0,
    ledger: [],
    balance: 0,
    week: { index: weekIndexOf(day), revenue: 0, expenses: 0, distributed: false },
    work: { player: 0, karim: 0 },
  };

  bump(w, 'ateliersCrees');
  pushEvent(w, {
    type: 'vie',
    title: 'L’Atelier de Réparation ouvre à la Friche',
    text: 'Avec Karim, tu lances un atelier de réparation. Récupérer des pièces, diagnostiquer les pannes et réparer les objets du quartier !',
    causes: [{ facteur: 'choix du joueur : entreprendre à la Friche avec Karim', poids: 2 }],
  });

  return { ok: true, message: 'L’Atelier de Réparation de la Friche est ouvert.' };
}

// ---------- Livre de comptes (Invariant strict) ----------

function postWorkshop(w: WorldState, label: string, amount: number): void {
  const ws = w.workshop;
  if (!ws) return;
  const a = round2(amount);
  const day = dayIndexOf(w.time.tick);
  ws.ledger.push({ day, date: dateOf(day).iso, label, amount: a });
  ws.balance = round2(ws.balance + a);
}

export function ledgerBalanceWorkshop(ws: WorkshopState): number {
  return round2(ws.ledger.reduce((sum, e) => sum + e.amount, 0));
}

export function ledgerInvariantHoldsWorkshop(ws: WorkshopState): boolean {
  return ledgerBalanceWorkshop(ws) === ws.balance;
}

// ---------- Approvisionnement (Pièces & Récupération) ----------

export function buyWorkshopParts(w: WorldState): WorkshopActionResult {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Pas d’atelier actif.' };
  const cost = WORKSHOP_CONFIG.partsCost;

  if (ws.balance + w.player.money < cost) {
    return {
      ok: false,
      message: `Pas assez d'argent : 10 pièces coûtent ${cost} € (caisse ${ws.balance.toFixed(2)} € · poche ${w.player.money.toFixed(2)} €).`,
    };
  }

  const fromCaisse = Math.min(ws.balance, cost);
  const fromPoche = round2(cost - fromCaisse);

  if (fromCaisse > 0) postWorkshop(w, 'Achat de pièces (10 unités)', -fromCaisse);
  if (fromPoche > 0) {
    w.player.money = round2(w.player.money - fromPoche);
    postWorkshop(w, 'Apport de capital atelier', fromPoche);
    postWorkshop(w, 'Achat de pièces (10 unités)', -fromPoche);
  }

  ws.partsStock += WORKSHOP_CONFIG.partsUnits;
  ws.week.expenses = round2(ws.week.expenses + cost);
  bump(w, 'achatsPiecesAtelier');
  return { ok: true, message: `Pièces détachées +10 unités (−${cost} €).` };
}

export function collectSalvage(w: WorldState): WorkshopActionResult {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Pas d’atelier actif.' };
  if (w.player.asleep) return { ok: false, message: 'Tu dors.' };

  const tech = skillLevel(w, 'technique');
  const gained = 2 + tech;

  ws.salvageStock += gained;
  w.player.needs.fatigue = clamp(w.player.needs.fatigue + WORKSHOP_CONFIG.salvageFatigue, 0, 100);
  ws.work.player = (ws.work['player'] ?? 0) + WORKSHOP_CONFIG.salvageTimeTicks;

  addXp(w, 'technique', 2);
  bump(w, 'collectesRecup');

  pushEvent(w, {
    type: 'vie',
    title: 'Collecte de matériel à la Friche',
    text: `20 minutes de fouille dans la Friche : +${gained} unités de matériaux de récupération récupérés.`,
    causes: [
      { facteur: `compétence technique niveau ${tech}`, poids: 2 },
      { facteur: 'fouille à la Friche', poids: 1 },
    ],
  });

  return { ok: true, message: `Collecte réussie : +${gained} matériaux de récup' · fatigue +${WORKSHOP_CONFIG.salvageFatigue}.` };
}

// ---------- Équipe ----------

export function recruitWorkshopMember(w: WorldState, npcId: NpcId): WorkshopActionResult {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Pas d’atelier actif.' };
  if (!WORKSHOP_CONFIG.recruitables.includes(npcId)) {
    return { ok: false, message: 'Seuls Karim et Yasmine peuvent rejoindre l’atelier.' };
  }
  if (ws.members.includes(npcId)) return { ok: false, message: 'Déjà membre de l’atelier.' };

  const level = skillLevel(w, WORKSHOP_CONFIG.recruitSkill);
  if (level < WORKSHOP_CONFIG.recruitMinLevel) {
    return {
      ok: false,
      message: `Convaincre demande ${SKILLS_LABELS[WORKSHOP_CONFIG.recruitSkill]} niveau ${WORKSHOP_CONFIG.recruitMinLevel} (actuel : ${level}).`,
    };
  }

  const rel = w.player.relations[npcId];
  if (rel && rel.rivalite > 60) {
    return { ok: false, message: 'Trop de rivalité entre vous pour travailler ensemble.' };
  }

  const name = NPC_BY_ID[npcId]?.name ?? npcId;
  ws.members.push(npcId);
  ws.work[npcId] = 0;
  applyRelation(w, npcId, { respect: 2, confiance: 2 });
  addXp(w, WORKSHOP_CONFIG.recruitSkill, 3);
  bump(w, 'recrutementsAtelier');

  pushEvent(w, {
    type: 'vie',
    title: `${name} rejoint l’Atelier`,
    text: `${name} rejoint l’équipe de l’Atelier. Les réparations iront plus vite !`,
    causes: [{ facteur: `compétence technique niveau ${level}`, poids: 2 }],
  });

  return { ok: true, message: `${name} a rejoint l’Atelier.` };
}

// ---------- Traitement des Commandes ----------

export function workOnOrder(w: WorldState, orderId: string): OrderWorkResult {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Pas d’atelier actif.' };
  if (w.player.asleep) return { ok: false, message: 'Tu dors.' };

  const order = ws.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Commande introuvable.' };
  if (order.status === 'completed' || order.status === 'failed') {
    return { ok: false, message: 'Cette commande est déjà terminée.' };
  }

  const techLevel = skillLevel(w, 'technique');
  if (techLevel < order.minTechnique) {
    return {
      ok: false,
      message: `Requis : ${SKILLS_LABELS.technique} niveau ${order.minTechnique} (actuel : ${techLevel}).`,
    };
  }

  // Si c'est le début du travail sur la commande, prêter/consommer les matériaux
  if (order.workDone === 0) {
    if (ws.partsStock < order.partsNeeded || ws.salvageStock < order.salvageNeeded) {
      return {
        ok: false,
        message: `Stock insuffisant pour démarrer : il faut ${order.partsNeeded} pièce(s) et ${order.salvageNeeded} récuration(s).`,
      };
    }
    ws.partsStock -= order.partsNeeded;
    ws.salvageStock -= order.salvageNeeded;
    order.status = 'in_progress';
  }

  order.workDone += 1;
  ws.work.player = (ws.work['player'] ?? 0) + 1;
  for (const m of ws.members) ws.work[m] = (ws.work[m] ?? 0) + 1;

  w.player.needs.fatigue = clamp(w.player.needs.fatigue + 7, 0, 100);
  addXp(w, 'technique', 2);

  if (order.workDone < order.workNeeded) {
    return {
      ok: true,
      message: `Avancement sur « ${order.itemLabel} » (${order.workDone}/${order.workNeeded} sessions).`,
      completed: false,
    };
  }

  // Commande complétée !
  order.status = 'completed';
  ws.completedOrdersCount += 1;
  postWorkshop(w, `Livraison — ${order.itemLabel} (${order.clientName})`, order.reward);
  ws.week.revenue = round2(ws.week.revenue + order.reward);

  w.player.reputation = clamp(w.player.reputation + 2, 0, 100);
  w.district.confianceQuartier = clamp(w.district.confianceQuartier + 2, 0, 100);
  w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie + 1, 0, 100);

  if (order.npcId) {
    applyRelation(w, order.npcId, { amitie: 2, respect: 2, confiance: 2 });
  }

  bump(w, 'reparationsReussies');
  pushEvent(w, {
    type: 'vie',
    title: `Réparation livrée — ${order.itemLabel}`,
    text: `Objet réparé et rendu à ${order.clientName} ! +${order.reward.toFixed(2)} € dans la caisse, réputation +2, confiance du quartier +2.`,
    causes: [
      { facteur: 'travail et diagnostic à l’Atelier', poids: 2 },
      { facteur: `satisfaction de ${order.clientName}`, poids: 2 },
    ],
  });

  return {
    ok: true,
    message: `Réparation terminée ! +${order.reward.toFixed(2)} € pour l'Atelier.`,
    completed: true,
    reward: order.reward,
  };
}

// ---------- Simulation quotidienne & hebdomadaire ----------

export function workshopDay(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const ws = w.workshop;
  if (!ws?.active) return out;

  const currentDay = dayIndexOf(w.time.tick);

  // Vérification des délais expirés
  for (const order of ws.orders) {
    if ((order.status === 'pending' || order.status === 'in_progress') && currentDay > order.deadlineDay) {
      order.status = 'failed';
      w.player.reputation = clamp(w.player.reputation - 2, 0, 100);
      w.player.needs.stress = clamp(w.player.needs.stress + 5, 0, 100);
      bump(w, 'reparationsRetard');

      pushEvent(w, {
        type: 'consequence',
        title: `Commande non honorée — ${order.itemLabel}`,
        text: `Le délai est dépassé pour la commande de ${order.clientName}. La réputation de l'atelier en souffre (−2).`,
        causes: [
          { facteur: 'date limite dépassée', seuil: `jour ${order.deadlineDay}`, poids: 3 },
        ],
      });
    }
  }

  // Génération déterministe de nouvelles commandes si la file faiblit
  const activeOrders = ws.orders.filter((o) => o.status === 'pending' || o.status === 'in_progress');
  if (activeOrders.length < 3) {
    const tmpl = rngPick(w, DYNAMIC_ORDER_TEMPLATES);
    const newOrder = {
      id: `order_${currentDay}_${ws.orders.length}`,
      clientName: tmpl.clientName,
      npcId: tmpl.npcId,
      itemLabel: tmpl.itemLabel,
      partsNeeded: tmpl.partsNeeded,
      salvageNeeded: tmpl.salvageNeeded,
      workNeeded: tmpl.workNeeded,
      workDone: 0,
      reward: tmpl.reward,
      deadlineDay: currentDay + tmpl.deadlineDays,
      minTechnique: tmpl.minTechnique,
      status: 'pending' as const,
    };
    ws.orders.push(newOrder);
  }

  return out;
}

export function workshopWeek(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const ws = w.workshop;
  if (!ws?.active) return out;

  ws.week = { index: weekIndexOf(dayIndexOf(w.time.tick)), revenue: 0, expenses: 0, distributed: false };
  ws.work = { player: 0 };
  for (const m of ws.members) ws.work[m] = 0;

  return out;
}

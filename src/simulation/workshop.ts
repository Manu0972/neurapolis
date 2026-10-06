/**
 * Atelier de la Friche (J5) — simulation complète du second projet économique.
 * Partenariat avec Karim Bensalah (ancien ouvrier Taret).
 *
 * Invariants & Contrats :
 * 1. Grand livre (Ledger) : Σ(entrées − sorties) = balance, TOUJOURS.
 * 2. Pièces de récupération (fouille friche + lots de ferraille).
 * 3. Usure des outils à chaque réparation (blocage si < 20 %, révision 8 €).
 * 4. Grille tarifaire à 3 niveaux : Solidaire (−30 %), Standard, Soutien (+35 %).
 * 5. Part solidaire : alimentation continue d'un fonds de secours du quartier.
 * 6. Déterminisme PRNG (w.rng) et horloge (clock.ts).
 */
import type { NpcId, Notification, RepartitionMode, SolidarityTariff, WorkshopState, WorldState } from '../core/types';
import { dateOf, dayIndexOf, weekIndexOf } from '../core/clock';
import { rngInt, rngNext } from '../core/rng';
import { CATALOG_ORDERS, TARIFF_GRID, WORKSHOP_CONFIG, type CatalogOrderTemplate } from '../data/workshop';
import { bump, notify, pushEvent } from './events';
import { applyRelation } from './relations';
import { addXp } from './skills';

const round2 = (v: number): number => Math.round(v * 100) / 100;

export interface WorkshopAction {
  ok: boolean;
  message: string;
}

// ---------- Création de l'Atelier ----------

export function createWorkshop(w: WorldState): WorkshopAction {
  if (w.workshop?.active) {
    return { ok: false, message: 'L’Atelier de la Friche est déjà en activité.' };
  }

  const relKarim = w.player.relations['karim'];
  const confiance = relKarim?.confiance ?? 0;
  const amitie = relKarim?.amitie ?? 0;
  const techniqueLvl = w.player.skills.technique.level;

  if (confiance < WORKSHOP_CONFIG.minRelationKarim && amitie < WORKSHOP_CONFIG.minRelationKarim && techniqueLvl < 1) {
    return {
      ok: false,
      message: `Karim hésite : « Tu es sympa, gamin, mais un atelier demande de la technique ou une vraie confiance mutuelle. » (Confiance ou amitié ≥ ${WORKSHOP_CONFIG.minRelationKarim}, ou Technique niveau 1 requis).`,
    };
  }

  const day = dayIndexOf(w.time.tick);

  w.workshop = {
    id: 'atelier_friche',
    active: true,
    partner: 'karim',
    members: ['karim'],
    partsStock: WORKSHOP_CONFIG.initialPartsStock,
    toolCondition: WORKSHOP_CONFIG.initialToolCondition,
    orders: [],
    tariffMode: 'standard',
    solidarityRate: WORKSHOP_CONFIG.defaultSolidarityRate,
    solidarityFund: 0,
    balance: 0,
    ledger: [],
    week: {
      index: weekIndexOf(day),
      revenue: 0,
      expenses: 0,
      repairsCount: 0,
      distributed: false,
    },
    work: { player: 0, karim: 0 },
    completedRepairsCount: 0,
  };

  // Enregistrer le premier apport d'outillage offert par Karim
  postWorkshop(w, 'Dotation initiale en outillage (Karim)', 0);

  // Remplir 3 premières commandes d'habitants
  ensureAvailableOrders(w, 3);

  // Évolution relationnelle avec Karim
  applyRelation(w, 'karim', { amitie: 10, confiance: 15, respect: 15, rivalite: -5 });
  w.player.reputation = Math.min(100, w.player.reputation + 4);

  pushEvent(w, {
    type: 'vie',
    title: 'L’Atelier de la Friche ouvre ses portes',
    text: 'Avec Karim, vous réhabilitez un coin de la Friche Taret : un établi, un jeu de clés plates et la volonté de réparer ce que la ville jette.',
    causes: [
      { facteur: 'confiance établie avec Karim Bensalah', seuil: String(Math.max(confiance, amitie)), poids: 3 },
      { facteur: 'compétence technique ou projet collectif', poids: 2 },
    ],
  });

  const pName = w.player.name || 'Le joueur';
  w.lifeJournal.push({
    day,
    date: dateOf(day).iso,
    title: 'Ouverture de l’Atelier de la Friche',
    text: `${pName} et Karim ont posé les premiers outils à la Friche Taret. Les habitants pourront y faire réparer vélos, petit électroménager et matériel du quartier.`,
  });

  return { ok: true, message: 'L’Atelier de la Friche est ouvert avec Karim.' };
}

// ---------- Invariant du Livre de Comptes ----------

/** Écriture comptable unique : grand livre et caisse bougent ensemble, toujours. */
export function postWorkshop(w: WorldState, label: string, amount: number): void {
  const ws = w.workshop;
  if (!ws) return;
  const a = round2(amount);
  const day = dayIndexOf(w.time.tick);
  ws.ledger.push({ day, date: dateOf(day).iso, label, amount: a });
  ws.balance = round2(ws.balance + a);
}

/** Σ(entrées − sorties) du livre de comptes. */
export function ledgerBalance(ws: WorkshopState): number {
  return round2(ws.ledger.reduce((sum, e) => sum + e.amount, 0));
}

/** Vérification stricte de l'invariant. */
export function ledgerInvariantHolds(ws: WorkshopState): boolean {
  return ledgerBalance(ws) === ws.balance;
}

/** Résultat financier de la semaine courante. */
export function weeklyResult(ws: WorkshopState): number {
  return round2(ws.week.revenue - ws.week.expenses);
}

// ---------- Pièces de récupération & Outils ----------

/** Fouiller les ferrailles de la Friche pour trouver des pièces de rechange. */
export function scavengeParts(w: WorldState): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  const tech = w.player.skills.technique.level;
  // Déterminisme : jet PRNG
  const baseYield = rngInt(w, 1, 2);
  const bonus = rngNext(w) < (tech * 0.25) ? 1 : 0;
  const yieldCount = baseYield + bonus;

  ws.partsStock += yieldCount;
  ws.work['player'] = (ws.work['player'] ?? 0) + 1;

  // Impact sur le joueur (fatigue et soif de pratique)
  w.player.needs.fatigue = Math.min(100, w.player.needs.fatigue + 14);
  w.player.needs.faim = Math.min(100, w.player.needs.faim + 8);
  addXp(w, 'technique', 2);
  bump(w, 'fouilles_friche');

  pushEvent(w, {
    type: 'decouverte',
    title: 'Fouille dans les carcasses de la Friche',
    text: `Tu as fouillé les anciens hangars de l’usine Taret et récupéré ${yieldCount} pièce(s) de rechange exploitable(s).`,
    causes: [
      { facteur: 'compétence technique', seuil: String(tech), poids: 2 },
      { facteur: 'recherche de pièces de récupération', poids: 1 },
    ],
  });

  return { ok: true, message: `Fouille réussie : +${yieldCount} pièces de récupération (stock : ${ws.partsStock}).` };
}

/** Acheter un lot de pièces de récupération auprès d'un ferrailleur local. */
export function buySalvageParts(w: WorldState): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  const cost = WORKSHOP_CONFIG.partsBatchCost;
  const units = WORKSHOP_CONFIG.partsBatchUnits;

  // Paiement : caisse d'abord, apport personnel si nécessaire
  if (ws.balance >= cost) {
    postWorkshop(w, `Achat de ${units} pièces de récupération (caisse)`, -cost);
  } else {
    const manque = round2(cost - ws.balance);
    if (w.player.money < manque) {
      return {
        ok: false,
        message: `Fonds insuffisants : le lot coûte ${cost} €. L'atelier a ${ws.balance} € et ta poche ${w.player.money} €.`,
      };
    }
    // Le joueur avance l'argent sous forme d'apport
    w.player.money = round2(w.player.money - manque);
    postWorkshop(w, `Apport personnel pour pièces (+${manque} €)`, manque);
    postWorkshop(w, `Achat de ${units} pièces de récupération`, -cost);
  }

  ws.partsStock += units;
  ws.week.expenses = round2(ws.week.expenses + cost);

  return {
    ok: true,
    message: `Lot de ${units} pièces acheté pour ${cost} € (stock total : ${ws.partsStock}).`,
  };
}

/** Entretien et affûtage des outils de l'atelier pour restaurer leur état à 100 %. */
export function maintainTools(w: WorldState): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  if (ws.toolCondition >= 95) {
    return { ok: false, message: 'Les outils sont déjà en excellent état.' };
  }

  const cost = WORKSHOP_CONFIG.maintenanceCost;

  if (ws.balance >= cost) {
    postWorkshop(w, 'Maintenance et révision des outils (caisse)', -cost);
  } else {
    const manque = round2(cost - ws.balance);
    if (w.player.money < manque) {
      return {
        ok: false,
        message: `Fonds insuffisants pour l'entretien : ${cost} € requis (manque ${manque} €).`,
      };
    }
    w.player.money = round2(w.player.money - manque);
    postWorkshop(w, `Apport personnel maintenance (+${manque} €)`, manque);
    postWorkshop(w, 'Maintenance et révision des outils', -cost);
  }

  ws.toolCondition = 100;
  ws.week.expenses = round2(ws.week.expenses + cost);
  ws.work['player'] = (ws.work['player'] ?? 0) + 1;
  ws.work['karim'] = (ws.work['karim'] ?? 0) + 1;
  addXp(w, 'technique', 2);

  // Karim apprécie le respect de l'outillage
  applyRelation(w, 'karim', { respect: 4, amitie: 2 });

  return { ok: true, message: `Outils révisés et affûtés avec Karim : condition restaurée à 100 %.` };
}

// ---------- Grille tarifaire & Commandes ----------

/** Définir la politique tarifaire par défaut de l'atelier. */
export function setTariffMode(w: WorldState, mode: SolidarityTariff): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  ws.tariffMode = mode;
  return { ok: true, message: `Politique tarifaire de l'atelier définie sur : ${TARIFF_GRID[mode].label}.` };
}

/** Accepter une commande disponible et lui assigner un barème tarifaire. */
export function acceptOrder(w: WorldState, orderId: string, tariff?: SolidarityTariff): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  const order = ws.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Commande introuvable.' };
  if (order.status !== 'disponible') {
    return { ok: false, message: 'Cette commande a déjà été prise en charge.' };
  }

  const chosenTariff = tariff ?? ws.tariffMode;
  const tariffDetail = TARIFF_GRID[chosenTariff];
  const finalPrice = round2(order.basePrice * tariffDetail.multiplier);

  order.appliedTariff = chosenTariff;
  order.finalPrice = finalPrice;
  order.status = 'en_cours';

  return {
    ok: true,
    message: `Commande « ${order.item} » acceptée au tarif ${tariffDetail.label} (${finalPrice} €).`,
  };
}

/** Exécuter la réparation d'un objet en atelier. */
export function repairOrder(w: WorldState, orderId: string): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  const order = ws.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Commande introuvable.' };
  if (order.status !== 'en_cours') {
    return { ok: false, message: 'Cette commande doit être acceptée avant d’être réparée.' };
  }

  // Vérification pièces
  if (ws.partsStock < order.partsRequired) {
    return {
      ok: false,
      message: `Pièces de rechange insuffisantes : il faut ${order.partsRequired} pièce(s), stock : ${ws.partsStock}. Fouille la friche ou achète un lot.`,
    };
  }

  // Vérification outils
  if (ws.toolCondition < WORKSHOP_CONFIG.minToolConditionForRepair) {
    return {
      ok: false,
      message: `Outils trop usés (${ws.toolCondition} %) ! Procède à un entretien avant de risquer de casser la pièce.`,
    };
  }

  // Consommation et usure
  ws.partsStock -= order.partsRequired;
  const toolWear = order.difficulty * 6 + 4;
  ws.toolCondition = Math.max(0, ws.toolCondition - toolWear);

  // Heures et compétences
  ws.work['player'] = (ws.work['player'] ?? 0) + 1;
  ws.work['karim'] = (ws.work['karim'] ?? 0) + 1;
  addXp(w, 'technique', order.difficulty * 2);
  w.player.needs.fatigue = Math.min(100, w.player.needs.fatigue + 12);

  order.status = 'repare';

  pushEvent(w, {
    type: 'vie',
    title: `Réparation achevée : ${order.item}`,
    text: `À l’établi, avec les conseils de Karim, vous avez remis en état « ${order.item} ». Consommation : ${order.partsRequired} pièce(s), usure outillage : −${toolWear} %.`,
    causes: [
      { facteur: 'pièces de récupération utilisées', seuil: String(order.partsRequired), poids: 2 },
      { facteur: `travail conjoint ${w.player.name} et Karim`, poids: 2 },
    ],
  });

  return {
    ok: true,
    message: `« ${order.item} » réparé avec succès ! Prêt pour la livraison. (Outils : ${ws.toolCondition} %).`,
  };
}

/** Livrer l'objet réparé, encaisser le paiement et alimenter la part solidaire. */
export function deliverOrder(w: WorldState, orderId: string): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  const order = ws.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Commande introuvable.' };
  if (order.status !== 'repare') {
    return { ok: false, message: 'Cette commande doit être réparée avant d’être livrée.' };
  }

  const tariffDetail = TARIFF_GRID[order.appliedTariff];
  const price = order.finalPrice;

  // Encaissement par l'atelier
  postWorkshop(w, `Paiement réparation (${order.item}) — client ${order.clientName}`, price);
  ws.week.revenue = round2(ws.week.revenue + price);
  ws.week.repairsCount += 1;
  ws.completedRepairsCount += 1;

  // Calcul et mise en réserve de la part solidaire
  const solidarityShare = round2(price * tariffDetail.solidarityContributionFactor);
  ws.solidarityFund = round2(ws.solidarityFund + solidarityShare);

  // Effets relationnels avec le client
  applyRelation(w, order.clientNpc, {
    amitie: tariffDetail.clientRelBonus,
    confiance: tariffDetail.clientRelBonus,
    respect: 3,
    rivalite: -2,
  });

  // Confiance du quartier & réputation
  w.district.confianceQuartier = Math.min(100, w.district.confianceQuartier + tariffDetail.reputationBonus);
  w.player.reputation = Math.min(100, w.player.reputation + tariffDetail.reputationBonus);
  bump(w, 'reparations_reussies');

  order.status = 'livre';

  pushEvent(w, {
    type: 'consequence',
    title: `Livraison effectuée : ${order.item}`,
    text: `${order.clientName} a récupéré son bien réparé. Rentrée d'argent : +${price} € (dont +${solidarityShare} € versés au fonds solidaire).`,
    causes: [
      { facteur: `tarif appliqué (${order.appliedTariff})`, seuil: `${price} €`, poids: 3 },
      { facteur: 'service rendu au quartier', poids: 2 },
    ],
  });

  return {
    ok: true,
    message: `Livraison à ${order.clientName} effectuée ! +${price} € en caisse, +${solidarityShare} € au fonds solidaire.`,
  };
}

// ---------- Répartition Hebdomadaire & Invariants ----------

/**
 * Répartition hebdomadaire des gains de l'Atelier.
 * Partage équitable entre Karim et le joueur, avec consolidation du fonds solidaire.
 * L'invariant comptable est strictement garanti par chaque écriture.
 */
export function workshopWeeklyDistribution(w: WorldState, mode: RepartitionMode = 'equite'): WorkshopAction {
  const ws = w.workshop;
  if (!ws?.active) return { ok: false, message: 'Aucun atelier actif.' };

  const result = weeklyResult(ws);
  if (result <= 0) {
    ws.week.distributed = true;
    return { ok: true, message: `Pas de bénéfice à répartir cette semaine (résultat : ${result} €).` };
  }

  // Solde disponible en caisse pour distribution (on garde au moins un fond de roulement si possible)
  const availableToDistribute = Math.min(ws.balance, result);
  if (availableToDistribute <= 0) {
    ws.week.distributed = true;
    return { ok: true, message: 'Aucun solde distribuable en caisse.' };
  }

  let playerShare = 0;
  let karimShare = 0;

  if (mode === 'egalite') {
    playerShare = round2(availableToDistribute * 0.5);
    karimShare = round2(availableToDistribute - playerShare);
  } else if (mode === 'equite') {
    const playerHours = ws.work['player'] ?? 1;
    const karimHours = ws.work['karim'] ?? 1;
    const totalHours = Math.max(1, playerHours + karimHours);
    playerShare = round2((availableToDistribute * playerHours) / totalHours);
    karimShare = round2(availableToDistribute - playerShare);
  } else {
    // incitation : bonus proportionnel aux réparations accomplies
    playerShare = round2(availableToDistribute * 0.45);
    karimShare = round2(availableToDistribute - playerShare);
  }

  // Inscriptions au grand livre
  if (karimShare > 0) {
    postWorkshop(w, `Rémunération hebdomadaire Karim (${mode})`, -karimShare);
  }
  if (playerShare > 0) {
    postWorkshop(w, `Rémunération hebdomadaire ${w.player.name} (${mode})`, -playerShare);
    w.player.money = round2(w.player.money + playerShare);
  }

  // Karim gagne en moral et en confiance
  applyRelation(w, 'karim', { amitie: 4, confiance: 5, respect: 4 });
  const karimState = w.npcs['karim'];
  if (karimState) karimState.moral = Math.min(100, karimState.moral + 10);

  ws.week.distributed = true;
  // Réinitialiser les compteurs d'heures pour la nouvelle semaine
  ws.work = { player: 0, karim: 0 };

  return {
    ok: true,
    message: `Répartition effectuée : ${playerShare} € pour ${w.player.name}, ${karimShare} € pour Karim (mode : ${mode}).`,
  };
}

// ---------- Cadence Quotidienne & Hebdomadaire ----------

/** Ajout de commandes disponibles jusqu'à un quota cible. */
export function ensureAvailableOrders(w: WorldState, targetCount = 3): void {
  const ws = w.workshop;
  if (!ws) return;

  const currentAvailable = ws.orders.filter((o) => o.status === 'disponible');
  if (currentAvailable.length >= targetCount) return;

  const day = dayIndexOf(w.time.tick);
  const needed = targetCount - currentAvailable.length;

  // Filtrer les templates dont la commande n'est pas déjà présente en disponible/en_cours
  const existingItems = new Set(ws.orders.filter((o) => o.status !== 'livre').map((o) => o.item));
  const pool = CATALOG_ORDERS.filter((tpl) => !existingItems.has(tpl.item));

  for (let i = 0; i < needed && pool.length > 0; i++) {
    const idx = rngInt(w, 0, pool.length - 1);
    const chosen = pool.splice(idx, 1)[0]!;
    const orderId = `${chosen.templateId}_d${day}_${i}`;

    ws.orders.push({
      id: orderId,
      clientNpc: chosen.clientNpc,
      clientName: chosen.clientName,
      item: chosen.item,
      description: chosen.description,
      difficulty: chosen.difficulty,
      partsRequired: chosen.partsRequired,
      basePrice: chosen.basePrice,
      appliedTariff: ws.tariffMode,
      finalPrice: round2(chosen.basePrice * TARIFF_GRID[ws.tariffMode].multiplier),
      status: 'disponible',
      receivedDay: day,
      deadlineDay: day + 7,
    });
  }
}

/** Tick quotidien de l'atelier : renouvellement des commandes et activité autonome de Karim. */
export function workshopDay(w: WorldState): Notification[] {
  const ws = w.workshop;
  if (!ws?.active) return [];

  const out: Notification[] = [];
  ensureAvailableOrders(w, 3);

  // Karim contribue s'il a de bons outils : il trouve parfois 1 pièce de récupération
  if (ws.toolCondition >= 50 && rngNext(w) < 0.35) {
    ws.partsStock += 1;
    ws.work['karim'] = (ws.work['karim'] ?? 0) + 1;
    out.push(notify('info', 'Karim a déniché une pièce utile dans les bennes de la Friche.'));
  }

  return out;
}

/** Tick hebdomadaire de l'atelier : clôture de semaine et répartition. */
export function workshopWeek(w: WorldState): Notification[] {
  const ws = w.workshop;
  if (!ws?.active) return [];

  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);

  if (!ws.week.distributed) {
    const action = workshopWeeklyDistribution(w, 'equite');
    if (action.ok) {
      out.push(notify('bien', `Atelier : ${action.message}`));
    }
  }

  // Démarrer une nouvelle semaine
  ws.week = {
    index: weekIndexOf(day),
    revenue: 0,
    expenses: 0,
    repairsCount: 0,
    distributed: false,
  };

  return out;
}

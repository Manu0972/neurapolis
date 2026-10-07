/**
 * NEURAPOLIS — Moteur de Relation avec les Marchands et Paliers de Fidélité (Tiers).
 */
import type { Notification, VendorId, VendorRelationship, VendorTier, WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { createInitialVendorsState, VENDOR_DEFS } from '../data/vendors';
import { notify } from './events';

declare module '../core/types' {
  interface VendorRelationship {
    creditLineLimit: number;
    creditBalance: number;
  }
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function ensureVendorsState(w: WorldState): Record<VendorId, VendorRelationship> {
  if (!w.vendors || !w.vendors.vendors) {
    w.vendors = { vendors: createInitialVendorsState() };
  }
  for (const rel of Object.values(w.vendors.vendors)) {
    if (rel.creditLineLimit === undefined) rel.creditLineLimit = 0;
    if (rel.creditBalance === undefined) rel.creditBalance = 0;
  }
  return w.vendors.vendors;
}

export function getVendorRelationship(w: WorldState, vendorId: VendorId): VendorRelationship {
  const vendors = ensureVendorsState(w);
  let rel = vendors[vendorId];
  if (!rel) {
    const def = VENDOR_DEFS[vendorId];
    rel = {
      vendorId,
      name: def?.name ?? vendorId,
      location: def?.location ?? 'place',
      tier: 0,
      spentTotal: 0,
      tradeCount: 0,
      discountRate: 0,
      unlockedPerks: def?.tierBenefits[0]?.perk ? [def.tierBenefits[0].perk] : [],
      friendshipDialogueUnlocked: false,
      specialStockAvailable: false,
      creditLineLimit: 0,
      creditBalance: 0,
    };
    vendors[vendorId] = rel;
  }
  if (rel.creditLineLimit === undefined) rel.creditLineLimit = 0;
  if (rel.creditBalance === undefined) rel.creditBalance = 0;
  if (vendorId === 'bertin' && rel.creditLineLimit === 0 && rel.tier > 0) {
    rel.creditLineLimit = rel.tier === 3 ? 100 : rel.tier === 2 ? 50 : 25;
  }
  return rel;
}

export function getVendorDiscountRate(w: WorldState, vendorId: VendorId): number {
  const rel = getVendorRelationship(w, vendorId);
  return rel.discountRate;
}

export function getVendorCreditLineLimit(w: WorldState, vendorId: VendorId): number {
  const rel = getVendorRelationship(w, vendorId);
  return rel.creditLineLimit;
}

export function getVendorCreditAvailable(w: WorldState, vendorId: VendorId): number {
  const rel = getVendorRelationship(w, vendorId);
  return round2(Math.max(0, rel.creditLineLimit - rel.creditBalance));
}

export function borrowVendorCredit(w: WorldState, vendorId: VendorId, amount: number): boolean {
  if (amount <= 0) return false;
  const amt = round2(amount);
  if (amt <= 0) return false;

  const rel = getVendorRelationship(w, vendorId);
  const available = round2(rel.creditLineLimit - rel.creditBalance);
  if (available < amt) return false;

  rel.creditBalance = round2(rel.creditBalance + amt);
  w.player.money = round2(w.player.money + amt);

  const day = (w.time as { tick: number; day?: number }).day ?? dayIndexOf(w.time.tick);
  w.events.unshift({
    id: `vendor_borrow_${vendorId}_${w.time.tick}`,
    day,
    date: dateOf(day).iso,
    type: 'consequence',
    title: `Crédit marchand accordé : ${rel.name}`,
    text: `Emprunt de ${amt.toFixed(2)} € sur la ligne de crédit de ${rel.name}. Dette actuelle : ${rel.creditBalance.toFixed(2)} / ${rel.creditLineLimit.toFixed(2)} €.`,
    causes: [
      { facteur: `Ligne de crédit disponible : ${available.toFixed(2)} €`, poids: 3 },
      { facteur: `Niveau de relation marchand : Palier ${rel.tier}`, poids: 2 },
    ],
  });

  return true;
}

export function repayVendorCredit(w: WorldState, vendorId: VendorId, amount: number): boolean {
  if (amount <= 0) return false;
  const amt = round2(amount);
  if (amt <= 0) return false;

  const rel = getVendorRelationship(w, vendorId);
  if (rel.creditBalance <= 0) return false;
  if (w.player.money < amt) return false;

  const actualRepay = round2(Math.min(amt, rel.creditBalance));
  if (actualRepay <= 0) return false;

  w.player.money = round2(w.player.money - actualRepay);
  rel.creditBalance = round2(rel.creditBalance - actualRepay);

  const day = (w.time as { tick: number; day?: number }).day ?? dayIndexOf(w.time.tick);
  w.events.unshift({
    id: `vendor_repay_${vendorId}_${w.time.tick}`,
    day,
    date: dateOf(day).iso,
    type: 'consequence',
    title: `Remboursement crédit marchand : ${rel.name}`,
    text: `Remboursement de ${actualRepay.toFixed(2)} € sur la dette chez ${rel.name}. Dette restante : ${rel.creditBalance.toFixed(2)} €.`,
    causes: [
      { facteur: `Remboursement effectué : ${actualRepay.toFixed(2)} €`, poids: 3 },
      { facteur: `Trésorerie restante : ${w.player.money.toFixed(2)} €`, poids: 2 },
    ],
  });

  return true;
}

export function recordVendorTrade(
  w: WorldState,
  vendorId: VendorId,
  amount: number,
): { ok: boolean; message: string; tierUpgraded: boolean; notifications: Notification[] } {
  const def = VENDOR_DEFS[vendorId];
  if (!def) return { ok: false, message: 'Marchand inconnu.', tierUpgraded: false, notifications: [] };

  const rel = getVendorRelationship(w, vendorId);

  rel.spentTotal = round2(rel.spentTotal + Math.max(0, amount));
  rel.tradeCount += 1;

  let tierUpgraded = false;
  const notifs: Notification[] = [];

  // Vérifier promotion de palier (0 -> 1 -> 2 -> 3)
  for (const tier of [3, 2, 1] as VendorTier[]) {
    const req = def.tierRequirements[tier];
    if (rel.tier < tier && rel.spentTotal >= req.spent && rel.tradeCount >= req.trades) {
      rel.tier = tier;
      const ben = def.tierBenefits[tier];
      rel.discountRate = ben.discountRate;
      if (ben.creditLine !== undefined) {
        rel.creditLineLimit = ben.creditLine;
      } else if (vendorId === 'bertin') {
        rel.creditLineLimit = tier === 3 ? 100 : tier === 2 ? 50 : 25;
      }
      if (!rel.unlockedPerks.includes(ben.perk)) rel.unlockedPerks.push(ben.perk);
      rel.friendshipDialogueUnlocked = tier >= 2;
      rel.specialStockAvailable = tier >= 1;
      tierUpgraded = true;

      const notifMsg = `Relation marchande renforcée avec ${def.name} : Palier ${tier} (${ben.title}) ! ${ben.description}`;
      notifs.push(notify('bien', notifMsg));
      const day = (w.time as { tick: number; day?: number }).day ?? dayIndexOf(w.time.tick);
      w.events.unshift({
        id: `vendor_tier_${vendorId}_${tier}_${w.time.tick}`,
        day,
        date: dateOf(day).iso,
        type: 'consequence',
        title: `Palier marchand atteint : ${def.name}`,
        text: notifMsg,
        causes: [
          { facteur: `Volume d’échanges cumulé : ${rel.spentTotal.toFixed(2)} €`, poids: 3 },
          { facteur: `Nombre de transactions : ${rel.tradeCount}`, poids: 2 },
        ],
      });
      break;
    }
  }

  return {
    ok: true,
    message: tierUpgraded
      ? `Tier ${rel.tier} débloqué chez ${def.name} ! Remise : ${Math.round(rel.discountRate * 100)} % (Ligne de crédit : ${rel.creditLineLimit} €)`
      : `Achat enregistré chez ${def.name}. Total dépensé : ${rel.spentTotal.toFixed(2)} € (${rel.tradeCount} transactions).`,
    tierUpgraded,
    notifications: notifs,
  };
}

export function buyVendorSpecialGood(
  w: WorldState,
  vendorId: VendorId,
  goodId: string,
): { ok: boolean; message: string } {
  const def = VENDOR_DEFS[vendorId];
  if (!def) return { ok: false, message: 'Marchand inconnu.' };
  const good = def.specialGoods.find((g) => g.id === goodId);
  if (!good) return { ok: false, message: 'Article spécial introuvable.' };

  const vendors = ensureVendorsState(w);
  const rel = vendors[vendorId];
  if (!rel || rel.tier < good.requiredTier) {
    return { ok: false, message: `Niveau de relation insuffisant (Tier ${good.requiredTier} requis).` };
  }

  const finalCost = good.cost * (1 - rel.discountRate);
  if (w.player.money < finalCost) {
    return { ok: false, message: `Fonds insuffisants (${finalCost.toFixed(2)} € requis, tu as ${w.player.money.toFixed(2)} €).` };
  }

  w.player.money -= finalCost;
  rel.spentTotal += finalCost;
  rel.tradeCount += 1;
  w.flags[`special_good_${goodId}`] = (w.flags[`special_good_${goodId}`] ?? 0) + 1;

  if (vendorId === 'bertin' && w.project) {
    w.project.stock += 20;
  }
  if (vendorId === 'karim' && w.workshop) {
    w.workshop.partsStock += 6;
    w.workshop.toolCondition = Math.min(100, w.workshop.toolCondition + 20);
  }

  return {
    ok: true,
    message: `Acquisition réussie : ${good.name} pour ${finalCost.toFixed(2)} € (${Math.round(rel.discountRate * 100)} % de remise appliquée).`,
  };
}

export interface StockPurchaseCalculation {
  baseCost: number;
  discountRate: number;
  finalCost: number;
  neededCredit: number;
  canAfford: boolean;
  creditAvailable: number;
}

export function calculateStockPurchaseWithVendor(
  w: WorldState,
  vendorId: VendorId = 'bertin',
  baseCost: number = 15,
  availableFunds?: number,
): StockPurchaseCalculation {
  const p = w.project;
  const funds = availableFunds !== undefined ? availableFunds : round2((p?.balance ?? 0) + w.player.money);
  const discountRate = getVendorDiscountRate(w, vendorId);
  const finalCost = round2(baseCost * (1 - discountRate));
  const creditAvailable = getVendorCreditAvailable(w, vendorId);
  const neededCredit = round2(Math.max(0, finalCost - funds));
  const canAfford = neededCredit === 0 || creditAvailable >= neededCredit;
  return {
    baseCost,
    discountRate,
    finalCost,
    neededCredit,
    canAfford,
    creditAvailable,
  };
}

export interface VendorStockPurchaseResult {
  ok: boolean;
  message: string;
  baseCost: number;
  finalCost: number;
  discountRate: number;
  borrowedCredit: number;
  fromCaisse: number;
  fromPoche: number;
}

export function executeVendorStockPurchase(
  w: WorldState,
  vendorId: VendorId = 'bertin',
  baseCost: number = 15,
  stockUnits: number = 20,
): VendorStockPurchaseResult {
  const p = w.project;
  if (!p?.active) {
    return {
      ok: false,
      message: 'Pas de projet actif.',
      baseCost,
      finalCost: baseCost,
      discountRate: 0,
      borrowedCredit: 0,
      fromCaisse: 0,
      fromPoche: 0,
    };
  }

  const discountRate = getVendorDiscountRate(w, vendorId);
  const finalCost = round2(baseCost * (1 - discountRate));
  const availableFunds = round2(p.balance + w.player.money);
  let borrowedCredit = 0;

  if (availableFunds < finalCost) {
    const deficit = round2(finalCost - availableFunds);
    const availableCredit = getVendorCreditAvailable(w, vendorId);
    if (availableCredit < deficit) {
      return {
        ok: false,
        message: `Pas assez d'argent : le stock coûte ${finalCost.toFixed(2)} € (caisse ${p.balance.toFixed(2)} € · toi ${w.player.money.toFixed(2)} € · crédit dispo ${availableCredit.toFixed(2)} €).`,
        baseCost,
        finalCost,
        discountRate,
        borrowedCredit: 0,
        fromCaisse: 0,
        fromPoche: 0,
      };
    }
    const borrowed = borrowVendorCredit(w, vendorId, deficit);
    if (!borrowed) {
      return {
        ok: false,
        message: `Échec de l'emprunt sur la ligne de crédit.`,
        baseCost,
        finalCost,
        discountRate,
        borrowedCredit: 0,
        fromCaisse: 0,
        fromPoche: 0,
      };
    }
    borrowedCredit = deficit;
  }

  const fromCaisse = Math.min(p.balance, finalCost);
  const fromPoche = round2(finalCost - fromCaisse);

  const day = dayIndexOf(w.time.tick);
  const dateStr = dateOf(day).iso;

  if (fromCaisse > 0) {
    p.balance = round2(p.balance - fromCaisse);
    p.ledger.push({
      day,
      date: dateStr,
      label: `Achat de stock (${stockUnits} unités)`,
      amount: -fromCaisse,
    });
  }

  if (fromPoche > 0) {
    w.player.money = round2(w.player.money - fromPoche);
    p.ledger.push({
      day,
      date: dateStr,
      label: 'Apport de capital',
      amount: fromPoche,
    });
    p.ledger.push({
      day,
      date: dateStr,
      label: `Achat de stock (${stockUnits} unités)`,
      amount: -fromPoche,
    });
  }

  p.stock += stockUnits;
  p.week.expenses = round2(p.week.expenses + finalCost);

  recordVendorTrade(w, vendorId, finalCost);

  return {
    ok: true,
    message: `Stock +${stockUnits} unités (−${finalCost.toFixed(2)} €).${borrowedCredit > 0 ? ` (${borrowedCredit.toFixed(2)} € financés par crédit marchand)` : ''}`,
    baseCost,
    finalCost,
    discountRate,
    borrowedCredit,
    fromCaisse,
    fromPoche,
  };
}

export function calculateMacroAdjustedDemand(
  baseDemand: number,
  macroDemandModifier: number,
  playerShare: number = 50,
): { marketPotential: number; demand: number } {
  const marketPotential = Math.max(0, Math.round(baseDemand * 2 * (1 + macroDemandModifier)));
  const demand = Math.max(0, Math.round((marketPotential * playerShare) / 100));
  return { marketPotential, demand };
}

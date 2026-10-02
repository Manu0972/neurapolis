/**
 * NEURAPOLIS — Moteur de Relation avec les Marchands et Paliers de Fidélité (Tiers).
 */
import type { Notification, VendorId, VendorRelationship, VendorTier, WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { createInitialVendorsState, VENDOR_DEFS } from '../data/vendors';
import { notify } from './events';

export function ensureVendorsState(w: WorldState): Record<VendorId, VendorRelationship> {
  if (!w.vendors || !w.vendors.vendors) {
    w.vendors = { vendors: createInitialVendorsState() };
  }
  return w.vendors.vendors;
}

export function getVendorDiscountRate(w: WorldState, vendorId: VendorId): number {
  const vendors = ensureVendorsState(w);
  const rel = vendors[vendorId];
  if (!rel) return 0;
  return rel.discountRate;
}

export function recordVendorTrade(
  w: WorldState,
  vendorId: VendorId,
  amount: number,
): { ok: boolean; message: string; tierUpgraded: boolean; notifications: Notification[] } {
  const def = VENDOR_DEFS[vendorId];
  if (!def) return { ok: false, message: 'Marchand inconnu.', tierUpgraded: false, notifications: [] };

  const vendors = ensureVendorsState(w);
  let rel = vendors[vendorId];
  if (!rel) {
    vendors[vendorId] = {
      vendorId,
      name: def.name,
      location: def.location,
      tier: 0,
      spentTotal: 0,
      tradeCount: 0,
      discountRate: 0,
      unlockedPerks: [def.tierBenefits[0].perk],
      friendshipDialogueUnlocked: false,
      specialStockAvailable: false,
    };
    rel = vendors[vendorId];
  }

  rel.spentTotal += Math.max(0, amount);
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
      ? `Tier ${rel.tier} débloqué chez ${def.name} ! Remise : ${Math.round(rel.discountRate * 100)} %`
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

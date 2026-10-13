/**
 * Payer une dépense du Stand des Roses : la caisse du stand paie d'abord, la poche du joueur
 * complète (même règle que l'achat de stock, project.ts `buyStock`, équilibrage M7).
 * Le livre de comptes et la caisse bougent ensemble : la part payée de la poche entre d'abord
 * comme « Apport de capital », puis sort comme dépense — l'invariant Σ(livre) = caisse tient.
 * Sans stand actif, tout est payé de la poche.
 */
import type { WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';

const round2 = (v: number): number => Math.round(v * 100) / 100;

export interface StandPayment {
  ok: boolean;
  fromCaisse: number;
  fromPoche: number;
}

/** Ce que le joueur peut engager : caisse du stand (si actif) + argent de poche. */
export function standSpendable(w: WorldState): number {
  const p = w.project?.active ? w.project : undefined;
  return round2((p ? Math.max(0, p.balance) : 0) + Math.max(0, w.player.money));
}

export function payFromStandThenPocket(w: WorldState, label: string, cost: number): StandPayment {
  const p = w.project?.active ? w.project : undefined;
  if (standSpendable(w) < cost) return { ok: false, fromCaisse: 0, fromPoche: 0 };
  const fromCaisse = p ? round2(Math.min(Math.max(0, p.balance), cost)) : 0;
  const fromPoche = round2(cost - fromCaisse);
  if (fromPoche > 0) w.player.money = round2(w.player.money - fromPoche);
  if (p) {
    const day = dayIndexOf(w.time.tick);
    const date = dateOf(day).iso;
    const post = (l: string, amount: number): void => {
      const a = round2(amount);
      p.ledger.push({ day, date, label: l, amount: a });
      p.balance = round2(p.balance + a);
    };
    if (fromCaisse > 0) post(label, -fromCaisse);
    if (fromPoche > 0) {
      post('Apport de capital', fromPoche);
      post(label, -fromPoche);
    }
    p.week.expenses = round2(p.week.expenses + cost);
  }
  return { ok: true, fromCaisse, fromPoche };
}

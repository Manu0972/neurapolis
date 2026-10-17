/**
 * Dépenses courantes d'un ado (choisies par le joueur, jamais imposées).
 *
 * Avant, rien ne dépensait l'argent de poche : il montait sans fin. Ici, des achats plausibles
 * pour un collégien — goûter, ticket de bus, sortie avec les copains, petit cadeau, fournitures,
 * BD — chacun avec un petit effet (faim, fatigue, moral, stress, amitiés). Le forfait téléphone
 * (dès 15 ans) est un abonnement que le joueur prend ou résilie ; il se suspend tout seul si
 * l'argent manque, sans pénalité.
 *
 * État : drapeaux `depense:<id>` (jour + 1 du dernier achat), `abonnementTel` (1 = actif),
 * `depensesTotal` (cumul) — pas de changement de schéma. Déterministe.
 */
import type { Notification, NpcId, WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { notify } from './events';

export type DepenseId = 'gouter' | 'bus' | 'sortie' | 'cadeau' | 'fournitures' | 'bd';

export interface DepenseDef {
  id: DepenseId;
  icon: string;
  label: string;
  price: number;
  /** Jours avant de pouvoir refaire cet achat (0 = une fois par jour). */
  everyDays: number;
  /** Ce que ça fait, en clair. */
  effect: string;
}

export const DEPENSES: readonly DepenseDef[] = [
  { id: 'gouter', icon: '🥐', label: 'Un goûter à la boulangerie', price: 2.5, everyDays: 1, effect: 'faim −30, moral +2' },
  { id: 'bus', icon: '🚌', label: 'Un ticket de bus', price: 1.7, everyDays: 1, effect: 'fatigue −8 (moins de marche)' },
  { id: 'sortie', icon: '🎳', label: 'Ciné ou bowling avec les copains', price: 9, everyDays: 7, effect: 'moral +8, stress −10, amitié +3 avec Noah, Lina et Yasmine' },
  { id: 'cadeau', icon: '🎁', label: 'Un petit cadeau pour ton ami·e le plus proche', price: 8, everyDays: 14, effect: 'amitié +6, confiance +3' },
  { id: 'fournitures', icon: '✏️', label: 'De jolies fournitures', price: 6, everyDays: 30, effect: 'discipline +1, stress −4' },
  { id: 'bd', icon: '📚', label: 'Une BD ou un magazine', price: 6, everyDays: 7, effect: 'compréhension +1, moral +4' },
];
export const DEPENSE_BY_ID: Readonly<Record<DepenseId, DepenseDef>> = Object.fromEntries(DEPENSES.map((d) => [d.id, d])) as Record<DepenseId, DepenseDef>;

/** Forfait téléphone : 15 € par mois, prélevé chaque semaine (3,50 €). */
export const FORFAIT_MIN_AGE = 15;
export const FORFAIT_SEMAINE = 3.5;
export const AMIS: readonly NpcId[] = ['noah', 'lina', 'yasmine'];

const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));
const round2 = (v: number): number => Math.round(v * 100) / 100;

function payer(w: WorldState, amount: number): void {
  w.player.money = round2(w.player.money - amount);
  w.flags['depensesTotal'] = round2((w.flags['depensesTotal'] ?? 0) + amount);
}

function amitie(w: WorldState, npc: NpcId, d: number, confiance = 0): void {
  const r = (w.player.relations[npc] ??= { amitie: 0, confiance: 0, respect: 0, rivalite: 0 });
  r.amitie = clamp(r.amitie + d, -100, 100);
  r.confiance = clamp(r.confiance + confiance, -100, 100);
}

/** L'ami·e le plus proche (pour le cadeau). */
export function amiLePlusProche(w: WorldState): NpcId {
  return [...AMIS].sort((a, b) => (w.player.relations[b]?.amitie ?? 0) - (w.player.relations[a]?.amitie ?? 0))[0]!;
}

export function depenseStatus(w: WorldState, id: DepenseId): { ok: boolean; raison: string } {
  const d = DEPENSE_BY_ID[id];
  if (!d) return { ok: false, raison: 'Achat inconnu.' };
  const day = dayIndexOf(w.time.tick);
  const last = (w.flags[`depense:${id}`] ?? 0) - 1;
  if (last >= 0 && day - last < d.everyDays) {
    const left = d.everyDays - (day - last);
    return { ok: false, raison: d.everyDays === 1 ? 'Déjà fait aujourd’hui.' : `Encore ${left} jour${left > 1 ? 's' : ''} avant d’y retourner.` };
  }
  if (w.player.money < d.price) return { ok: false, raison: `Il te faut ${d.price.toLocaleString('fr-FR')} € (tu as ${w.player.money.toFixed(2)} €).` };
  return { ok: true, raison: '' };
}

/** Le joueur choisit une dépense. */
export function faireDepense(w: WorldState, id: DepenseId): { ok: boolean; message: string } {
  const st = depenseStatus(w, id);
  if (!st.ok) return { ok: false, message: st.raison };
  const d = DEPENSE_BY_ID[id];
  const n = w.player.needs;
  payer(w, d.price);
  w.flags[`depense:${id}`] = dayIndexOf(w.time.tick) + 1;
  let extra = '';
  switch (id) {
    case 'gouter': n.faim = clamp(n.faim - 30); n.moral = clamp(n.moral + 2); break;
    case 'bus': n.fatigue = clamp(n.fatigue - 8); break;
    case 'sortie':
      n.moral = clamp(n.moral + 8);
      n.stress = clamp(n.stress - 10);
      for (const a of AMIS) amitie(w, a, 3);
      break;
    case 'cadeau': {
      const ami = amiLePlusProche(w);
      amitie(w, ami, 6, 3);
      extra = ` (${ami.charAt(0).toUpperCase()}${ami.slice(1)} est touché·e)`;
      break;
    }
    case 'fournitures':
      w.player.characteristics.discipline = clamp(w.player.characteristics.discipline + 1);
      n.stress = clamp(n.stress - 4);
      break;
    case 'bd':
      w.player.characteristics.comprehension = clamp(w.player.characteristics.comprehension + 1);
      n.moral = clamp(n.moral + 4);
      break;
  }
  return { ok: true, message: `${d.icon} ${d.label} : −${d.price.toLocaleString('fr-FR')} €${extra}.` };
}

export function forfaitActif(w: WorldState): boolean {
  return (w.flags['abonnementTel'] ?? 0) > 0;
}

/** Prendre ou résilier le forfait téléphone (dès 15 ans). La première semaine est payée tout de suite. */
export function basculerForfait(w: WorldState): { ok: boolean; message: string } {
  if (forfaitActif(w)) {
    w.flags['abonnementTel'] = 0;
    return { ok: true, message: '📵 Forfait résilié. Plus de prélèvement.' };
  }
  if (w.player.age < FORFAIT_MIN_AGE) return { ok: false, message: `Tes parents disent : forfait à ${FORFAIT_MIN_AGE} ans.` };
  if (w.player.money < FORFAIT_SEMAINE) return { ok: false, message: `Il faut ${FORFAIT_SEMAINE.toLocaleString('fr-FR')} € pour la première semaine.` };
  payer(w, FORFAIT_SEMAINE);
  w.flags['abonnementTel'] = 1;
  w.player.needs.moral = clamp(w.player.needs.moral + 3);
  return { ok: true, message: `📱 Forfait pris : 15 € par mois (${FORFAIT_SEMAINE.toLocaleString('fr-FR')} € par semaine).` };
}

/** Changement de semaine (moteur) : le forfait se paie, ou se suspend sans pénalité si l'argent manque. */
export function depensesSemaine(w: WorldState): Notification[] {
  if (!forfaitActif(w)) return [];
  if (w.player.money < FORFAIT_SEMAINE) {
    w.flags['abonnementTel'] = 0;
    return [notify('info', '📵 Forfait téléphone suspendu : pas assez d’argent cette semaine. Tu pourras le reprendre.')];
  }
  payer(w, FORFAIT_SEMAINE);
  // Rester joignable : on garde le contact avec les copains.
  w.player.needs.moral = clamp(w.player.needs.moral + 1);
  for (const a of AMIS) amitie(w, a, 1);
  return [];
}

/**
 * Le prête-nom (2026-10-07) : l'argent n'a pas d'âge, la signature si.
 *
 * Un collégien peut gagner 15 000 € — ou 15 millions — grâce à ses idées, ses équipes et son
 * réseau ; ce qu'il ne peut pas faire seul, c'est signer. Un adulte de confiance signe en son nom
 * (bail, embauche, grossistes, murs, prêts, grandes idées de l'Ascension) contre une commission
 * sur les bénéfices. Réaliste, mais pas trop : en vrai, il faudrait une SAS, un mandat, et
 * beaucoup de paperasse ; ici, il faut une relation et un prix.
 *
 * Leçon : déléguer sa signature, c'est payer une rente à quelqu'un — ou dépendre de la confiance
 * de ses parents. État : drapeaux `mandat` (indice + 1), `mandatDepuis`, `mandatBase`,
 * `mandatCommissions` — pas de changement de schéma.
 */
import type { Notification, WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { notify } from './events';

export interface MandateDef {
  id: string;
  name: string;
  /** Part des bénéfices prélevée chaque jour. */
  commission: number;
  /** Frais de mise en place (statuts, greffe, notaire…). */
  setupFee: number;
  lore: string;
  /** Fantôme qui commente la signature. */
  ghost: string;
  ghostLine: string;
}

export const MANDATES: readonly MandateDef[] = [
  {
    id: 'parents', name: 'Nora et Thierry (SAS familiale)', commission: 0, setupFee: 250,
    lore: 'Thierry préside une petite SAS ; Nora tient les comptes. Tu décides, ils signent — tant qu’ils te font confiance.',
    ghost: 'smith', ghostLine: 'La confiance est le capital le moins cher du monde. Et le plus facile à perdre.',
  },
  {
    id: 'bertin', name: 'Mme Bertin, l’épicière', commission: 0.1, setupFee: 0,
    lore: 'Elle signe à ta place chez les grossistes et les bailleurs. Son prix : 10 % de tes bénéfices, chaque jour.',
    ghost: 'marx', ghostLine: 'Tu travailles, elle signe, elle encaisse 10 %. Tu viens d’inventer la rente.',
  },
  {
    id: 'samir', name: 'Samir Ould-Ali', commission: 0.08, setupFee: 0,
    lore: 'L’ancien du laminoir prête son nom « pour que la vallée ait un patron qui lui ressemble ». 8 % pour la caisse de solidarité.',
    ghost: 'marx', ghostLine: 'Au moins, ses 8 % retournent aux ouvriers. Vérifie quand même.',
  },
  {
    id: 'lina', name: 'Lina Kessler et Maître Kessler', commission: 0.04, setupFee: 400,
    lore: 'La mère de Lina, avocate d’affaires, monte un vrai mandat de gestion. Cher à l’entrée, presque rien ensuite.',
    ghost: 'hayek', ghostLine: 'Un contrat clair vaut mieux qu’une poignée de main floue. Les règles libèrent.',
  },
];

export const MANDATE_BY_ID: Readonly<Record<string, MandateDef>> = Object.fromEntries(MANDATES.map((m) => [m.id, m]));

const parentsTrust = (w: WorldState): number => {
  const p = w.family?.parents;
  return p ? (p.nora.trust + p.thierry.trust) / 2 : 60;
};

/** Mandat signé (même suspendu). */
export function currentMandate(w: WorldState): MandateDef | undefined {
  const i = (w.flags['mandat'] ?? 0) - 1;
  return i >= 0 ? MANDATES[i] : undefined;
}

/** Le mandat joue-t-il ? (celui des parents s'arrête si leur confiance tombe sous 35) */
export function mandateActive(w: WorldState): boolean {
  const m = currentMandate(w);
  if (!m) return false;
  if (m.id === 'parents') return parentsTrust(w) >= 35;
  return true;
}

/**
 * Âge « économique » : celui qui compte pour signer. Le bac à sable et un prête-nom actif
 * lèvent les limites d'âge des affaires (pas celles de la vie : école, voyages, sommeil).
 */
export function econAge(w: WorldState): number {
  if (w.economy?.sandbox || mandateActive(w)) return Math.max(18, w.player.age);
  return w.player.age;
}

/** Peut-on signer ce mandat ? Liste des conditions manquantes (vide = oui). */
export function mandateBlockers(w: WorldState, id: string): string[] {
  const m = MANDATE_BY_ID[id];
  if (!m) return ['Inconnu.'];
  const out: string[] = [];
  const contacts = w.ascension?.contacts ?? {};
  if (id === 'parents') {
    if (parentsTrust(w) < 60) out.push(`Confiance de tes parents : ${Math.round(parentsTrust(w))}/60.`);
    if ((w.flags['ventes'] ?? 0) + (w.flags['ventesEtal'] ?? 0) < 20 && Object.keys(w.ascension?.ventures ?? {}).length === 0) out.push('Leur prouver que tu sais vendre (20 ventes ou une entreprise lancée).');
  } else if (contacts[id] === undefined) {
    out.push('En faire une de tes connexions (application Ascension → Connexions).');
  }
  if (id === 'lina' && w.player.age < 14) out.push('Maître Kessler ne signe pas pour un client de moins de 14 ans.');
  if (m.setupFee > w.player.money) out.push(`Frais de mise en place : ${m.setupFee} € (tu as ${w.player.money.toFixed(2)} €).`);
  return out;
}

export function signMandate(w: WorldState, id: string, provenProfitNow: number): { ok: boolean; message: string; notifications: Notification[] } {
  const m = MANDATE_BY_ID[id];
  if (!m) return { ok: false, message: 'Mandat inconnu.', notifications: [] };
  const blockers = mandateBlockers(w, id);
  if (blockers.length) return { ok: false, message: blockers.join(' '), notifications: [] };
  w.player.money = Math.round((w.player.money - m.setupFee) * 100) / 100;
  w.flags['mandat'] = MANDATES.indexOf(m) + 1;
  w.flags['mandatDepuis'] = dayIndexOf(w.time.tick);
  w.flags['mandatBase'] = provenProfitNow;
  return {
    ok: true,
    message: `✍️ ${m.name} signe désormais pour toi${m.commission ? ` (${Math.round(m.commission * 100)} % des bénéfices)` : ''}.`,
    notifications: [notify('fantome', m.ghostLine, m.ghost)],
  };
}

export function endMandate(w: WorldState): { ok: boolean; message: string } {
  const m = currentMandate(w);
  if (!m) return { ok: false, message: 'Aucun mandat en cours.' };
  w.flags['mandat'] = 0;
  return { ok: true, message: `Mandat terminé avec ${m.name}. Les affaires déjà signées continuent.` };
}

/** Chaque jour : la commission sur les bénéfices nouveaux ; alerte si les parents retirent leur signature. */
export function mandateDay(w: WorldState, provenProfitNow: number): Notification[] {
  const m = currentMandate(w);
  if (!m) return [];
  const out: Notification[] = [];
  const base = w.flags['mandatBase'] ?? provenProfitNow;
  const gain = provenProfitNow - base;
  w.flags['mandatBase'] = Math.max(base, provenProfitNow);
  if (gain > 0 && m.commission > 0) {
    const fee = Math.min(w.player.money, Math.round(gain * m.commission * 100) / 100);
    if (fee > 0) {
      w.player.money = Math.round((w.player.money - fee) * 100) / 100;
      w.flags['mandatCommissions'] = Math.round(((w.flags['mandatCommissions'] ?? 0) + fee) * 100) / 100;
    }
  }
  if (m.id === 'parents') {
    const wasOn = (w.flags['mandatSuspendu'] ?? 0) === 0;
    const on = mandateActive(w);
    if (wasOn && !on) out.push(notify('alerte', 'Nora et Thierry ne signent plus rien tant que leur confiance n’est pas revenue (35/100). Tes affaires en cours continuent, rien de nouveau.'));
    if (!wasOn && on) out.push(notify('bien', 'Tes parents ont retrouvé confiance : la SAS familiale signe de nouveau pour toi.'));
    w.flags['mandatSuspendu'] = on ? 0 : 1;
  }
  return out;
}

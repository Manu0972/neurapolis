/**
 * Écran d'accueil du téléphone « façon GTA » : peu de grosses icônes, jamais de liste de réglages.
 * Logique pure (testable sans DOM) : quelles icônes selon l'état du joueur et quelles pastilles.
 * Les icônes encore verrouillées n'apparaissent pas (dévoilement progressif, cf. hud-reveal.ts).
 */
import type { WorldState } from '../core/types';
import type { MissionStep } from '../simulation/missions';
import { isAppOpen } from '../simulation/unlocks';
import { pendingDinner } from '../simulation/family';
import { ascensionDebts } from '../simulation/ascension';
import { hudSeenKey } from './hud-reveal';

export type HomeApp = 'mission' | 'messages' | 'plan' | 'argent' | 'ascension' | 'affaires';

export interface HomeIcon { id: HomeApp; icon: string; label: string; badge: number }

/** Sous-applications regroupées dans « Affaires » (2 clics max depuis l'accueil). */
export const BUSINESS_SUBAPPS = ['commandes', 'commerces', 'immobilier', 'emploi', 'banque'] as const;

/** Applications d'avant la refonte → icône d'accueil qui les contient. */
export function homeOf(app: string): HomeApp | 'accueil' {
  if (app === 'accueil') return 'accueil';
  if (app === 'ascension') return 'ascension';
  if (app === 'infos') return 'messages';
  if (app === 'depenses' || app === 'banque') return app === 'banque' ? 'affaires' : 'argent';
  if ((BUSINESS_SUBAPPS as readonly string[]).includes(app)) return 'affaires';
  if (app === 'mission' || app === 'messages' || app === 'plan' || app === 'argent' || app === 'affaires') return app;
  return 'accueil';
}

const seen = (w: WorldState, k: Parameters<typeof hudSeenKey>[0]): boolean => !!w.seen[hudSeenKey(k)];

/** Y a-t-il des affaires à gérer ? (commerce, bail, ou une application d'affaires méritée) */
export function businessesVisible(w: WorldState): boolean {
  return Object.keys(w.economy?.businesses ?? {}).length > 0
    || Object.keys(w.economy?.leases ?? {}).length > 0
    || (['commerces', 'immobilier', 'emploi', 'banque'] as const).some((a) => isAppOpen(w, a));
}

/** Pastille de Messages : un dîner qui attend, une convocation à l'école. */
export function messagesBadge(w: WorldState): number {
  return (pendingDinner(w) ? 1 : 0) + (w.family?.convocation ? 1 : 0);
}

/** Pastille d'Argent : le compte est dans le rouge. */
export function moneyBadge(w: WorldState): number {
  return w.player.money < 0 ? 1 : 0;
}

/** Icônes d'accueil visibles (4 à 6), dans l'ordre d'affichage. */
export function homeIcons(w: WorldState, step: MissionStep | null): HomeIcon[] {
  const out: HomeIcon[] = [{ id: 'mission', icon: '🎯', label: 'Mission', badge: step ? 1 : 0 }];
  if (seen(w, 'conseil') || messagesBadge(w) > 0) out.push({ id: 'messages', icon: '💬', label: 'Messages', badge: messagesBadge(w) });
  if (seen(w, 'plan')) out.push({ id: 'plan', icon: '🗺️', label: 'Plan', badge: 0 });
  if (seen(w, 'argent')) out.push({ id: 'argent', icon: '💶', label: 'Argent', badge: moneyBadge(w) });
  if (isAppOpen(w, 'ascension') && w.campaign.currentChapter > 1) {
    out.push({ id: 'ascension', icon: '🚀', label: 'Ascension', badge: ascensionDebts(w).length > 0 ? 1 : 0 });
  }
  if (businessesVisible(w)) out.push({ id: 'affaires', icon: '🏪', label: 'Affaires', badge: 0 });
  return out;
}

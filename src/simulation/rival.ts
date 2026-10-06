/**
 * Concurrence & Rivalité économique persistante (contrat Big Ambitions / NEURAPOLIS).
 * 
 * Principes architecturaux :
 * 1. Déterministe et pur : calcul des parts de marché basé sur les prix relatifs,
 *    la qualité et la réputation, sans aléatoire non reproductible.
 * 2. Réactions réelles et compréhensibles : les rivaux réagissent si le joueur
 *    domine leur marché (>50% de part) ou les concurrence par les prix.
 * 3. Contre-stratégies jouables : le joueur a des options claires (circuit court,
 *    dégustation, fidélité solidaire) avec des compromis en temps et en argent.
 * 4. Conséquence systémique sur le territoire : la part de marché du Drive détermine
 *    la pression subie par l’épicerie de Mme Bertin au lieu d'une dérive fixe.
 */
import type { Notification, PlaceId, RivalId, RivalState, WorldState, CounterStrategyDef } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { COUNTER_STRATEGIES, INITIAL_RIVALS } from '../data/rivals';
import { bump, notify, pushEvent } from './events';
import { addXp } from './skills';

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));
const round2 = (v: number): number => Math.round(v * 100) / 100;

export function isCounterStrategyActive(w: WorldState, rival: RivalState, strategyId: string): boolean {
  const day = dayIndexOf(w.time.tick);
  return rival.activeCounterActions.some((action) => action.strategyId === strategyId && day < action.expiresDay);
}

export function counterStrategyDaysRemaining(w: WorldState, rival: RivalState, strategyId: string): number {
  const action = rival.activeCounterActions.find((candidate) => candidate.strategyId === strategyId);
  return action ? Math.max(0, action.expiresDay - dayIndexOf(w.time.tick)) : 0;
}

/** Enregistre une session jouée. Le rival sert les clients de la demande totale qui n'ont pas acheté au joueur. */
export function recordMarketSession(w: WorldState, place: PlaceId, potentialCustomers: number, playerUnitsSold: number): void {
  const rival = getRivalForPlace(w, place);
  const potential = Math.max(0, Math.floor(potentialCustomers));
  if (!rival || potential === 0) return;

  const day = dayIndexOf(w.time.tick);
  if (rival.marketObservation.day !== day) {
    rival.marketObservation = { day, playerUnitsSold: 0, rivalUnitsServed: 0, sessions: 0, lastClosed: null };
  }
  const sold = Math.max(0, Math.min(potential, Math.floor(playerUnitsSold)));
  rival.marketObservation.playerUnitsSold += sold;
  rival.marketObservation.rivalUnitsServed += potential - sold;
  rival.marketObservation.sessions += 1;
}

/** Récupère le rival présent sur un lieu donné (ex: 'place' -> Drive HyperVal, 'college' -> Distributeur). */
export function getRivalForPlace(w: WorldState, place: PlaceId): RivalState | undefined {
  return Object.values(w.rivals).find((r) => r.place === place);
}

/** Calcule l'attractivité du stand du joueur face au rival du lieu. */
export function calculateMarketShares(w: WorldState, place: PlaceId): {
  playerShare: number;
  rivalShare: number;
  rival?: RivalState;
} {
  const rival = getRivalForPlace(w, place);
  if (!rival) {
    return { playerShare: 100, rivalShare: 0 };
  }

  const p = w.project;
  // Sans projet actif ou sans stock, le rival règne sur le marché.
  if (!p?.active || p.stock <= 0) {
    return { playerShare: 0, rivalShare: 100, rival };
  }

  // Bonus conférés par les contre-stratégies actives
  let bonusPlayer = 0;
  let penaltyRival = 0;
  const today = dayIndexOf(w.time.tick);
  for (const action of rival.activeCounterActions) {
    if (today >= action.expiresDay) continue;
    const def = COUNTER_STRATEGIES.find((c) => c.id === action.strategyId);
    if (def) {
      bonusPlayer += def.playerShareBonus;
      penaltyRival += def.rivalSharePenalty;
    }
  }

  // Attractivité joueur : prix bas = attrait fort, réputation du quartier, bonus qualité
  const basePlayerPrice = p.price;
  const playerPriceScore = Math.max(10, 100 - basePlayerPrice * 40);
  const playerReputationScore = w.player.reputation;
  const playerQualityScore = 50 + bonusPlayer;
  const playerAttractiveness = (playerPriceScore * 0.4) + (playerReputationScore * 0.3) + (playerQualityScore * 0.3);

  // Attractivité rival : prix rival, qualité rival, agressivité commerciale
  const rivalPriceScore = Math.max(10, 100 - rival.price * 40);
  const rivalQualityScore = Math.max(10, rival.quality - penaltyRival);
  const rivalAggressivenessScore = rival.aggressiveness;
  const rivalAttractiveness = (rivalPriceScore * 0.4) + (rivalQualityScore * 0.3) + (rivalAggressivenessScore * 0.3);

  const total = playerAttractiveness + rivalAttractiveness;
  if (total <= 0) {
    return { playerShare: 50, rivalShare: 50, rival };
  }

  const playerShare = round2(clamp((playerAttractiveness / total) * 100));
  const rivalShare = round2(100 - playerShare);

  return { playerShare, rivalShare, rival };
}

/** Exécution d'une contre-stratégie par le joueur. */
export function executeCounterStrategy(w: WorldState, strategyId: string, startAfterTicks = 0): { ok: boolean; message: string; timeCostTicks?: number } {
  const def = COUNTER_STRATEGIES.find((c) => c.id === strategyId);
  if (!def) return { ok: false, message: 'Stratégie inconnue.' };

  const rival = w.rivals[def.rivalId];
  if (!rival) return { ok: false, message: 'Rival introuvable.' };

  if (isCounterStrategyActive(w, rival, strategyId)) {
    return { ok: false, message: 'Cette contre-stratégie est déjà active.' };
  }

  if (w.player.money < def.costMoney) {
    return { ok: false, message: `Pas assez d'argent (${w.player.money.toFixed(2)} € / ${def.costMoney.toFixed(2)} € requis).` };
  }

  if (w.player.needs.fatigue > 85) {
    return { ok: false, message: 'Trop fatigué pour lancer cette action commerciale.' };
  }

  // Application des coûts
  w.player.money = round2(w.player.money - def.costMoney);
  w.player.needs.fatigue = clamp(w.player.needs.fatigue + 15);
  const today = dayIndexOf(w.time.tick);
  rival.activeCounterActions = rival.activeCounterActions.filter((action) => action.strategyId !== def.id || today < action.expiresDay);
  const startsOnDay = dayIndexOf(w.time.tick + Math.max(0, startAfterTicks));
  rival.activeCounterActions.push({ strategyId: def.id, expiresDay: startsOnDay + def.durationDays });

  // Bénéfices immédiats
  w.player.reputation = clamp(w.player.reputation + def.reputationBonus);
  addXp(w, 'negociation', 3);
  bump(w, 'contreStrategiesLancees');

  // Cette valeur est une projection; la part observée ne change qu'après une session de vente réelle.
  const { playerShare } = calculateMarketShares(w, rival.place);

  pushEvent(w, {
    type: 'consequence',
    title: `Contre-offensive : ${def.label}`,
    text: `${def.description} Projection avant vente : ton attractivité représente ${playerShare}% face à ${rival.name}. La part observée changera après les ventes.`,
    causes: [
      { facteur: 'décision tactique du joueur', poids: 3 },
      { facteur: `investissement financier (${def.costMoney} €)`, poids: 2 },
    ],
  });

  return {
    ok: true,
    message: `${def.label} activée. Projection avant vente : ${playerShare}%.`,
    timeCostTicks: Math.ceil(def.costTimeMinutes / 10),
  };
}

/** Tick quotidien de la concurrence : évolution des parts, réactions des rivaux, impact territorial. */
export function rivalDay(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);

  for (const rival of Object.values(w.rivals)) {
    let transactionsObserved = false;
    const observation = rival.marketObservation;
    if (observation.day < day) {
      const totalServed = observation.playerUnitsSold + observation.rivalUnitsServed;
      if (observation.sessions > 0 && totalServed > 0) {
        rival.marketShare = round2(clamp((observation.rivalUnitsServed / totalServed) * 100));
        transactionsObserved = true;
        observation.lastClosed = {
          day: observation.day,
          playerUnitsSold: observation.playerUnitsSold,
          rivalUnitsServed: observation.rivalUnitsServed,
          sessions: observation.sessions,
        };
        pushEvent(w, {
          type: 'systeme',
          title: `Bilan du marché : ${rival.name}`,
          text: `Après ${observation.sessions} session(s) à ${rival.place}, ${observation.playerUnitsSold} unité(s) ont été vendues par ton stand et ${observation.rivalUnitsServed} par le concurrent. Part observée du rival : ${rival.marketShare}%.`,
          causes: [
            { facteur: 'transactions réellement conclues par le stand', seuil: `${observation.playerUnitsSold} unité(s)`, poids: 3 },
            { facteur: 'demande servie par le rival', seuil: `${observation.rivalUnitsServed} unité(s)`, poids: 2 },
          ],
        });
      }
      rival.marketObservation = {
        day,
        playerUnitsSold: 0,
        rivalUnitsServed: 0,
        sessions: 0,
        lastClosed: observation.lastClosed,
      };
    }

    const expired = rival.activeCounterActions.filter((action) => day >= action.expiresDay);
    if (expired.length > 0) {
      rival.activeCounterActions = rival.activeCounterActions.filter((action) => day < action.expiresDay);
      for (const action of expired) {
        const def = COUNTER_STRATEGIES.find((candidate) => candidate.id === action.strategyId);
        const label = def?.label ?? action.strategyId;
        pushEvent(w, {
          type: 'consequence',
          title: `Fin de la contre-offensive : ${label}`,
          text: `L’effet temporaire de « ${label} » prend fin. Il peut être relancé si tu en as les moyens.`,
          causes: [{ facteur: 'échéance de la contre-stratégie', seuil: `jour ${action.expiresDay}`, poids: 2 }],
        });
        out.push(notify('info', `La contre-stratégie « ${label} » est terminée.`));
      }
    }

    // Diminution du temps de recharge de réaction
    if (rival.reactionCooldown > 0) {
      rival.reactionCooldown -= 1;
    }

    // La prévision sert à la prochaine session; seules les transactions clôturées modifient la part réelle.
    const playerShare = 100 - rival.marketShare;

    // Réaction des rivaux en cas de domination du joueur (> 50% de part de marché)
    if (transactionsObserved && playerShare >= 50 && rival.reactionCooldown === 0) {
      if (rival.id === 'drive_hyper') {
        // Le Drive réplique par une baisse agressive de ses prix et une hausse de communication
        rival.price = round2(Math.max(0.70, rival.price - 0.15));
        rival.aggressiveness = clamp(rival.aggressiveness + 10);
        rival.strategy = 'prix_casse';
        rival.reactionCooldown = 4; // Pas de nouvelle contre-attaque avant 4 jours

        pushEvent(w, {
          type: 'antagonisme',
          title: 'Guerre des prix du Drive HyperVal',
          text: `Face au succès de ton Stand des Roses (${playerShare}% du marché sur la place), le Drive baisse le prix de ses goûters industriels à ${rival.price.toFixed(2)} € et intensifie ses tracts publicitaires.`,
          causes: [
            { facteur: 'domination du joueur sur la place', seuil: `${playerShare}%`, poids: 3 },
            { facteur: 'réaction concurrentielle agressive', poids: 2 },
          ],
        });
        out.push(notify('alerte', `Le Drive HyperVal réplique : prix cassés à ${rival.price.toFixed(2)} € !`));
      } else if (rival.id === 'distributeur_college') {
        // Le distributeur est approvisionné en nouveautés
        rival.quality = clamp(rival.quality + 10);
        rival.aggressiveness = clamp(rival.aggressiveness + 15);
        rival.strategy = 'campagne_com';
        rival.reactionCooldown = 3;

        pushEvent(w, {
          type: 'antagonisme',
          title: 'Le distributeur du collège fait le plein',
          text: `Le gérant du distributeur du collège remarque la perte de clientèle et remplit l’appareil de nouveaux sodas et barres énergétiques tendance.`,
          causes: [
            { facteur: 'concurrence du stand à la récré', seuil: `${playerShare}%`, poids: 3 },
          ],
        });
        out.push(notify('info', 'Le distributeur du collège propose de nouveaux snacks pour regagner du terrain.'));
      }
    } else if (transactionsObserved && playerShare < 20 && rival.strategy === 'prix_casse') {
      // Si le joueur est repoussé, le rival remonte progressivement ses marges
      rival.price = round2(rival.price + 0.10);
      rival.strategy = 'standard';
    }
  }

  // Impact sur la vitalité de l'épicerie du quartier (Territoire vivant)
  // Plus le joueur prend des parts de marché au Drive, moins l'épicerie souffre !
  const drive = w.rivals['drive_hyper'];
  if (drive) {
    if (drive.marketShare >= 65) {
      // Le drive écrase le quartier : dérive de −0,2/jour (contrat de base)
      w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie - 0.20);
    } else if (drive.marketShare >= 45) {
      // Équilibre fragile : pression réduite
      w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie - 0.10);
    } else {
      // Le joueur et les circuits courts ont affaibli le drive : l'épicerie respire !
      w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie + 0.10);
      if (day % 3 === 0) {
        out.push(notify('bien', 'Grâce à la dynamique locale face au Drive, l’épicerie retrouve des couleurs !'));
      }
    }
  }

  return out;
}

/** Liste des contre-stratégies disponibles pour l'UI. */
export function getAvailableCounterStrategies(w: WorldState): CounterStrategyDef[] {
  return COUNTER_STRATEGIES;
}

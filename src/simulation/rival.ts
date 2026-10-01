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
  for (const csId of rival.activeCounterActions) {
    const def = COUNTER_STRATEGIES.find((c) => c.id === csId);
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
export function executeCounterStrategy(w: WorldState, strategyId: string): { ok: boolean; message: string } {
  const def = COUNTER_STRATEGIES.find((c) => c.id === strategyId);
  if (!def) return { ok: false, message: 'Stratégie inconnue.' };

  const rival = w.rivals[def.rivalId];
  if (!rival) return { ok: false, message: 'Rival introuvable.' };

  if (rival.activeCounterActions.includes(strategyId)) {
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
  rival.activeCounterActions.push(def.id);

  // Bénéfices immédiats
  w.player.reputation = clamp(w.player.reputation + def.reputationBonus);
  addXp(w, 'negociation', 3);
  bump(w, 'contreStrategiesLancees');

  // Recalcul immédiat de la part de marché
  const { playerShare, rivalShare } = calculateMarketShares(w, rival.place);
  rival.marketShare = rivalShare;

  pushEvent(w, {
    type: 'consequence',
    title: `Contre-offensive : ${def.label}`,
    text: `${def.description} Résultat : ta part de marché monte à ${playerShare}% face à ${rival.name}.`,
    causes: [
      { facteur: 'décision tactique du joueur', poids: 3 },
      { facteur: `investissement financier (${def.costMoney} €)`, poids: 2 },
    ],
  });

  return {
    ok: true,
    message: `${def.label} activée avec succès ! (Part de marché : ${playerShare}%).`,
  };
}

/** Tick quotidien de la concurrence : évolution des parts, réactions des rivaux, impact territorial. */
export function rivalDay(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);

  for (const rival of Object.values(w.rivals)) {
    // Diminution du temps de recharge de réaction
    if (rival.reactionCooldown > 0) {
      rival.reactionCooldown -= 1;
    }

    // Calcul de la part de marché effective sur le lieu du rival
    const { playerShare, rivalShare } = calculateMarketShares(w, rival.place);
    rival.marketShare = rivalShare;

    // Réaction des rivaux en cas de domination du joueur (> 50% de part de marché)
    if (playerShare >= 50 && rival.reactionCooldown === 0) {
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
    } else if (playerShare < 20 && rival.strategy === 'prix_casse') {
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

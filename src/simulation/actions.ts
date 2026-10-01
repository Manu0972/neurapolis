/**
 * Actions débloquées par compétences (contrat M3 §3). Une pratique :
 * 1 vérifie le gate de niveau, 2 peut échouer (fatigue >70 → +20 %, §5),
 * 3 applique ses conséquences, 4 donne de l'XP, 5 émet un événement à causes,
 * 6 fait avancer les notions liées (étape application).
 */
import type { NpcId, WorldState } from '../core/types';
import { GATED_ACTION_BY_ID, SKILLS_LABELS } from '../data/actions';
import { NOTIONS } from '../data/notions';
import { rngChance } from '../core/rng';
import { failureBonus } from './needs';
import { addXp, skillLevel } from './skills';
import { applyNotion } from './notions';
import { applyRelation, bestFriendId } from './relations';
import { bump, pushEvent } from './events';
import { registerForecast } from './project';

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export interface ActionOutcome {
  ok: boolean;
  message: string;
  eventId?: string;
}

export function performGatedAction(w: WorldState, actionId: string, npcId?: NpcId): ActionOutcome {
  const def = GATED_ACTION_BY_ID[actionId];
  if (!def) return { ok: false, message: 'Action inconnue.' };
  const level = skillLevel(w, def.skill);
  if (level < def.minLevel) {
    return {
      ok: false,
      message: `« ${def.label} » demande ${SKILLS_LABELS[def.skill]} niveau ${def.minLevel} (actuel : ${level}).`,
    };
  }
  // Échec d'action : +20 % si fatigue > 70 (§5).
  if (rngChance(w, failureBonus(w))) {
    w.player.needs.stress = clamp(w.player.needs.stress + 5);
    return { ok: false, message: 'Raté — la fatigue te joue des tours.' };
  }

  const effects: string[] = [];
  switch (def.id) {
    case 'partager': {
      const target = npcId ?? bestFriendId(w);
      if (target) {
        applyRelation(w, target, { confiance: 1 });
        effects.push('confiance +1');
      }
      bump(w, 'partages');
      break;
    }
    case 'arbitrer':
      w.player.reputation = clamp(w.player.reputation + 3);
      w.player.needs.stress = clamp(w.player.needs.stress + 5);
      effects.push('réputation +3');
      bump(w, 'arbitrages');
      break;
    case 'comptes':
      bump(w, 'livresComptes');
      break;
    case 'prevision':
      bump(w, 'previsions');
      registerForecast(w); // prévision à comparer à la prochaine session (déclencheur Simon)
      break;
    case 'recruter': {
      const target = npcId ?? bestFriendId(w);
      if (target) {
        applyRelation(w, target, { respect: 2 });
        effects.push('respect +2');
      }
      break;
    }
    case 'multitache':
      bump(w, 'multitache');
      break;
    case 'reparer':
      bump(w, 'devis');
      break;
    case 'autodidacte':
      break;
    default:
      break;
  }
  w.player.needs.fatigue = clamp(w.player.needs.fatigue + 5);
  addXp(w, def.skill, def.xp);
  const evt = pushEvent(w, {
    type: def.eventType,
    title: def.label,
    text: def.text,
    causes: [{ facteur: `${SKILLS_LABELS[def.skill]} niveau ${def.minLevel}`, seuil: String(def.minLevel), poids: 2 }],
  });
  // Une pratique réussie fait avancer les notions qu'elle met en œuvre.
  for (const notion of NOTIONS) {
    if (notion.applicationAction === def.id) applyNotion(w, notion.id, true);
  }
  return { ok: true, message: effects.length > 0 ? effects.join(' · ') : 'Fait.', eventId: evt?.id };
}

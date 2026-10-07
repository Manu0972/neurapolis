/**
 * NEURAPOLIS — Moteur de Synergies Cachées & Reconnaissance de Rue.
 */
import type { Notification, StreetRecognitionState, WorldState } from '../core/types';
import { dayIndexOf } from '../core/clock';
import { notify } from './events';

export function ensureStreetRecognitionState(w: WorldState): StreetRecognitionState {
  if (!w.streetRecognition) {
    w.streetRecognition = {
      streetReputationLevel: w.player.reputation,
      spontaneousEncounterPending: false,
      lastEncounterDay: 0,
      hiddenSynergiesUnlocked: [],
      lastEncounterDialogue: '',
    };
  }
  return w.streetRecognition;
}

export function checkStreetSynergiesAndEncounters(w: WorldState): Notification[] {
  const sr = ensureStreetRecognitionState(w);
  const day = dayIndexOf(w.time.tick);
  const notifs: Notification[] = [];
  const p = w.player;

  // 1. Détection des synergies de statistiques cachées
  if (
    p.characteristics.influence >= 55 &&
    p.characteristics.confiance >= 50 &&
    p.reputation >= 60 &&
    !sr.hiddenSynergiesUnlocked.includes('notoriete_populaire')
  ) {
    sr.hiddenSynergiesUnlocked.push('notoriete_populaire');
    notifs.push(notify('bien', '✨ Synergie Cachée Débloquée : [Notoriété Populaire] ! Les passants te reconnaissent dans la rue et viennent te commander spontanément.'));
  }

  if (
    p.characteristics.discipline >= 55 &&
    p.skills.technique.level >= 1 &&
    !sr.hiddenSynergiesUnlocked.includes('rigueur_industrielle')
  ) {
    sr.hiddenSynergiesUnlocked.push('rigueur_industrielle');
    notifs.push(notify('bien', '✨ Synergie Cachée Débloquée : [Rigueur Industrielle] ! Tes marges sont impeccables, zéro gâchis dans les stocks.'));
  }

  if (
    p.characteristics.comprehension >= 55 &&
    p.characteristics.adaptabilite >= 55 &&
    !sr.hiddenSynergiesUnlocked.includes('vision_macroeconomique')
  ) {
    sr.hiddenSynergiesUnlocked.push('vision_macroeconomique');
    notifs.push(notify('bien', '✨ Synergie Cachée Débloquée : [Vision Macroéconomique] ! Tu anticipes les fluctuations de prix avant tout le monde.'));
  }

  // 2. Rencontres spontanées dans la rue
  if (
    sr.hiddenSynergiesUnlocked.includes('notoriete_populaire') &&
    day > sr.lastEncounterDay &&
    !sr.spontaneousEncounterPending
  ) {
    sr.spontaneousEncounterPending = true;
    sr.lastEncounterDay = day;
    const pName = w.player.firstName || w.player.name || 'toi';
    sr.lastEncounterDialogue = `Un voisin pressé t’aborde avec un grand sourire : « Ah ${pName} ! Dis, tu as encore de ces délicieux biscuits artisanaux du stand ? Je t’en prends trois pour le bureau ! »`;
    notifs.push(notify('info', `🗣 Rencontre dans la rue : Un passant te reconnaît et veut t'acheter des collations !`));
  }

  return notifs;
}

export function handleStreetEncounterChoice(
  w: WorldState,
  accept: boolean,
): { ok: boolean; message: string } {
  const sr = ensureStreetRecognitionState(w);
  if (!sr.spontaneousEncounterPending) {
    return { ok: false, message: 'Aucune rencontre en cours dans la rue.' };
  }

  sr.spontaneousEncounterPending = false;
  if (accept) {
    w.player.money += 6;
    w.player.reputation = Math.min(100, w.player.reputation + 2);
    w.player.needs.moral = Math.min(100, w.player.needs.moral + 5);
    return {
      ok: true,
      message: 'Vente spontanée conclue dans la rue ! (+6.00 €, Réputation +2, Moral +5). Le passant repart ravi.',
    };
  } else {
    w.player.characteristics.influence = Math.min(100, w.player.characteristics.influence + 1);
    return {
      ok: true,
      message: 'Tu as discuté poliment avec le voisin en lui indiquant nos horaires réguliers. (Influence +1).',
    };
  }
}

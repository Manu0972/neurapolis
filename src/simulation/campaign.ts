/**
 * Système de Campagne & Progression de vie (de 12 ans à la maturité).
 * Gère l'évolution de Camille, les jalons de vie, les choix à retardement
 * et la conclusion narrative de NEURAPOLIS.
 */
import type { Notification, WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { notify, pushEvent } from './events';

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

/** Vérifie et fait progresser les chapitres de la campagne. */
export function campaignTick(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);
  const currentChapter = w.campaign.currentChapter;

  // Traitement des conséquences différées (choix passés avec retombées ultérieures)
  for (let i = w.campaign.delayedConsequences.length - 1; i >= 0; i--) {
    const dc = w.campaign.delayedConsequences[i];
    if (!dc) continue;
    if (day >= dc.triggerDay) {
      if (dc.impactType === 'reputation') {
        w.player.reputation = clamp(w.player.reputation + dc.value);
      } else if (dc.impactType === 'money') {
        w.player.money += dc.value;
      } else if (dc.impactType === 'quartier') {
        w.district.confianceQuartier = clamp(w.district.confianceQuartier + dc.value);
      }

      pushEvent(w, {
        type: 'consequence',
        title: dc.title,
        text: dc.text,
        causes: [{ facteur: 'conséquence à retardement d’un choix passé', poids: 3 }],
      });
      out.push(notify('journal', `Effet à retardement : ${dc.title}`));

      // Retirer la conséquence consommée
      w.campaign.delayedConsequences.splice(i, 1);
    }
  }

  // Vérification de progression des chapitres
  if (currentChapter === 1) {
    const p = w.project;
    const salesDone = (w.flags['ventes'] ?? 0) >= 3;
    const teamReady = (p?.members.length ?? 0) >= 1;
    const counterUsed = (w.flags['contreStrategiesLancees'] ?? 0) >= 1;

    if (salesDone && teamReady && counterUsed) {
      const stage = w.campaign.stages.find((s) => s.chapter === 1);
      if (stage && !stage.completed) {
        stage.completed = true;
        w.campaign.completedChapters.push(1);
        w.campaign.currentChapter = 2;

        pushEvent(w, {
          type: 'vie',
          title: 'Chapitre 1 accompli : Le Stand des Roses est lancé !',
          text: 'Tu as prouvé que le Stand des Roses pouvait tenir tête aux distributeurs et au drive. Le quartier commence à te regarder différemment.',
          causes: [
            { facteur: 'ventes régulières', poids: 2 },
            { facteur: 'équipe constituée', poids: 2 },
            { facteur: 'première contre-offensive de marché', poids: 2 },
          ],
        });

        // Enregistrer dans le journal de vie
        w.lifeJournal.push({
          day,
          date: dateOf(day).iso,
          title: 'Victoire au Stand des Roses',
          text: `Le stand fonctionne. Avec l'équipe et nos choix de circuit court, nous avons trouvé notre place face aux géants.`,
        });

        out.push(notify('bien', 'Chapitre 1 complété ! Chapitre 2 débloqué : La Friche Taret.'));
      }
    }
  }

  return out;
}

/** Programme une conséquence différée issue d'un choix du joueur. */
export function addDelayedConsequence(
  w: WorldState,
  params: {
    delayDays: number;
    title: string;
    text: string;
    impactType: 'reputation' | 'money' | 'relation' | 'quartier';
    value: number;
  }
): void {
  const currentDay = dayIndexOf(w.time.tick);
  w.campaign.delayedConsequences.push({
    id: `dc_${w.time.tick}_${w.campaign.delayedConsequences.length}`,
    triggerDay: currentDay + params.delayDays,
    title: params.title,
    text: params.text,
    impactType: params.impactType,
    value: params.value,
  });
}

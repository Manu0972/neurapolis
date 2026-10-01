/**
 * Système de Campagne & Progression de vie (de 12 ans à la maturité).
 * Gère l'évolution de Camille, les jalons de vie, les choix à retardement
 * et la conclusion narrative de NEURAPOLIS.
 */
import { STARTING_PLAYER_AGE, type Notification, type WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { notify, pushEvent } from './events';

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

/** Âge calendaire : l'anniversaire est le 1er septembre, jour de départ du jeu. */
function ageForDay(day: number): number {
  const start = dateOf(0);
  const current = dateOf(day);
  const beforeBirthday = current.m < start.m || (current.m === start.m && current.d < start.d);
  return STARTING_PLAYER_AGE + Math.max(0, current.y - start.y - (beforeBirthday ? 1 : 0));
}

/** Vérifie et fait progresser les chapitres de la campagne. */
export function campaignTick(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);
  const age = ageForDay(day);
  if (age > w.player.age) {
    w.player.age = age;
    const date = dateOf(day);
    const title = `${w.player.name} fête ses ${age} ans`;
    pushEvent(w, {
      type: 'vie',
      title,
      text: `Le 1er septembre, une nouvelle année commence pour toi. Tu as maintenant ${age} ans.`,
      causes: [{ facteur: 'anniversaire calendaire', seuil: date.iso, poids: 3 }],
    });
    w.lifeJournal.push({ day, date: date.iso, title, text: `Une année de plus à grandir dans le quartier. J’ai ${age} ans.` });
    out.push(notify('journal', title));
  }
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

  if (currentChapter === 2) {
    const stage = w.campaign.stages.find((s) => s.chapter === 2);
    const samirContact = (w.flags['chapitre2ConversationCoopSamir'] ?? 0) > 0;
    const sharedRules = w.project?.rules.collectif ?? false;
    const collectiveSale = (w.flags['chapitre2VentesCollectives'] ?? 0) > 0;
    if (stage && !stage.completed && w.player.age >= stage.targetAge && samirContact && sharedRules && collectiveSale) {
      stage.completed = true;
      if (!w.campaign.completedChapters.includes(2)) w.campaign.completedChapters.push(2);
      w.campaign.currentChapter = 3;

      pushEvent(w, {
        type: 'vie',
        title: 'Chapitre 2 accompli : La Friche Taret ouvre ses portes',
        text: 'À la Friche, Samir ne t’a pas offert une solution toute faite. Avec l’équipe, tu as écrit des règles, puis vous les avez mises à l’épreuve d’une vraie vente.',
        causes: [
          { facteur: 'âge du joueur', seuil: `${w.player.age} ans`, poids: 1 },
          { facteur: 'conversation avec Samir sur la coopérative', poids: 2 },
          { facteur: 'règles collectives du Stand adoptées', poids: 2 },
          { facteur: 'vente réussie sous règles collectives', seuil: String(w.flags['chapitre2VentesCollectives']), poids: 3 },
        ],
      });
      w.lifeJournal.push({
        day,
        date: dateOf(day).iso,
        title: 'Les règles tiennent au marché',
        text: 'On a décidé ensemble comment faire tourner le stand, puis on l’a essayé pour de vrai. Samir nous a proposé de revenir à la Friche.',
      });
      out.push(notify('bien', 'Chapitre 2 complété ! Chapitre 3 débloqué : Le Réseau Solidaire.'));
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

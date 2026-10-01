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
      // Le chapitre 3 demande des actes nouveaux : les courses et tactiques
      // déjà réalisés avant l’ouverture du Réseau Solidaire ne comptent pas.
      w.flags['chapitre3CoursesDepart'] = w.flags['courses'] ?? 0;
      w.flags['chapitre3ContreStrategiesDepart'] = w.flags['contreStrategiesLancees'] ?? 0;

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

  if (currentChapter === 3) {
    const stage = w.campaign.stages.find((s) => s.chapter === 3);
    const codeChoice = w.flags['chapitre3ChoixReseau'] ?? 0;
    const hasChosenStrategy = codeChoice > 0;
    const coursesSinceOpening = (w.flags['courses'] ?? 0) - (w.flags['chapitre3CoursesDepart'] ?? 0);
    const strategiesSinceOpening = (w.flags['contreStrategiesLancees'] ?? 0)
      - (w.flags['chapitre3ContreStrategiesDepart'] ?? 0);
    if (stage && !stage.completed && w.player.age >= stage.targetAge
      && hasChosenStrategy && coursesSinceOpening >= 5 && strategiesSinceOpening >= 1) {
      stage.completed = true;
      if (!w.campaign.completedChapters.includes(3)) w.campaign.completedChapters.push(3);
      w.campaign.currentChapter = 4;

      const choiceLabel = codeChoice === 1 ? 'Commercial' : codeChoice === 2 ? 'Solidaire' : 'Combat';

      pushEvent(w, {
        type: 'vie',
        title: 'Chapitre 3 accompli : Le quartier fait front',
        text: 'Cinq courses ont aidé l’épicerie à garder ses habitués. Avec votre stratégie de Réseau Solidaire et votre contre-offensive face au Drive, l’alliance du quartier est devenue incontournable.',
        causes: [
          { facteur: 'âge du joueur', seuil: `${w.player.age} ans`, poids: 1 },
          { facteur: 'choix stratégique du Réseau Solidaire', seuil: choiceLabel, poids: 3 },
          { facteur: 'courses livrées pour l’épicerie depuis la Friche', seuil: String(coursesSinceOpening), poids: 2 },
          { facteur: 'nouvelle contre-stratégie lancée depuis la Friche', seuil: String(strategiesSinceOpening), poids: 2 },
        ],
      });
      w.lifeJournal.push({
        day,
        date: dateOf(day).iso,
        title: 'Le quartier fait front',
        text: 'Les livraisons maintiennent l’épicerie dans le jeu. Notre choix stratégique et notre contre-offensive portent leurs fruits : le Drive ne peut plus ignorer notre réseau.',
      });
      out.push(notify('bien', 'Chapitre 3 complété ! Chapitre 4 débloqué : La Voix du Quartier.'));
    }
  }

  return out;
}

export type ReseauStrategy = 'commercial' | 'solidaire' | 'combat';

/** Effectue le choix de stratégie pour le Réseau Solidaire (Chapitre 3). */
export function chooseReseauStrategy(
  w: WorldState,
  strategy: ReseauStrategy
): { ok: boolean; message: string } {
  if (w.campaign.currentChapter !== 3) {
    return { ok: false, message: 'Le Réseau Solidaire n’est actif qu’au chapitre 3.' };
  }
  if ((w.flags['chapitre3ChoixReseau'] ?? 0) > 0) {
    return { ok: false, message: 'La stratégie du Réseau Solidaire a déjà été tranchée.' };
  }

  w.flags['chapitre3ChoixReseau'] = strategy === 'commercial' ? 1 : strategy === 'solidaire' ? 2 : 3;
  const day = dayIndexOf(w.time.tick);

  if (strategy === 'commercial') {
    w.player.money += 25;
    if (w.project) w.project.balance += 15;
    w.player.reputation = clamp(w.player.reputation + 2);

    addDelayedConsequence(w, {
      delayDays: 3,
      title: 'Partenariat commercial rentable',
      text: 'Les marges garanties entre le Stand et l’épicerie rapportent leurs premiers revenus réguliers.',
      impactType: 'money',
      value: 20,
    });

    pushEvent(w, {
      type: 'vie',
      title: 'Réseau Solidaire : Partenariat commercial',
      text: 'Tu as choisi de sécuriser les marges financières du Stand et de l’épicerie. L’accord apporte des liquidités immédiates (+25 €).',
      causes: [
        { facteur: 'accord commercial avec Mme Bertin', poids: 3 },
        { facteur: 'priorité à la rentabilité', poids: 2 },
      ],
    });

    w.lifeJournal.push({
      day,
      date: dateOf(day).iso,
      title: 'Partenariat commercial conclu',
      text: 'Nous avons garanti des marges stables sur les produits distribués avec Mme Bertin. Un choix prudent pour la trésorerie.',
    });

    return { ok: true, message: 'Stratégie commerciale adoptée (+25 € pour toi, +15 € en caisse du Stand) !' };
  }

  if (strategy === 'solidaire') {
    w.district.confianceQuartier = clamp(w.district.confianceQuartier + 15);
    const relBertin = w.player.relations['bertin'] ?? { amitie: 0, confiance: 0, respect: 0, rivalite: 0 };
    relBertin.amitie = clamp(relBertin.amitie + 15);
    relBertin.confiance = clamp(relBertin.confiance + 10);
    w.player.relations['bertin'] = relBertin;

    const relMonique = w.player.relations['monique'] ?? { amitie: 0, confiance: 0, respect: 0, rivalite: 0 };
    relMonique.amitie = clamp(relMonique.amitie + 10);
    w.player.relations['monique'] = relMonique;

    addDelayedConsequence(w, {
      delayDays: 3,
      title: 'Confiance de quartier consolidée',
      text: 'L’alliance de livraison mutuelle et le circuit court incitent de nombreux habitants âgés à soutenir l’épicerie.',
      impactType: 'quartier',
      value: 10,
    });

    pushEvent(w, {
      type: 'vie',
      title: 'Réseau Solidaire : Alliance solidaire de quartier',
      text: 'Tu as privilégié la mutualisation des livraisons et la solidarité intergénérationnelle. La confiance du quartier grimpe en flèche (+15).',
      causes: [
        { facteur: 'mutualisation des livraisons avec Mme Bertin', poids: 3 },
        { facteur: 'engagement de quartier', poids: 2 },
      ],
    });

    w.lifeJournal.push({
      day,
      date: dateOf(day).iso,
      title: 'Alliance solidaire nouée',
      text: 'Mme Bertin et Monique ont salué notre engagement. Le quartier sait désormais qu’il peut compter sur le Stand et l’épicerie.',
    });

    return { ok: true, message: 'Alliance solidaire adoptée (Confiance quartier +15, amitié Mme Bertin +15) !' };
  }

  // strategy === 'combat'
  w.player.reputation = clamp(w.player.reputation + 5);
  if (w.rivals['drive_hyper']) {
    w.rivals['drive_hyper'].aggressiveness = Math.max(0, w.rivals['drive_hyper'].aggressiveness - 15);
  }

  addDelayedConsequence(w, {
    delayDays: 3,
    title: 'Pression sur le Drive HyperVal',
    text: 'La campagne de prix réduits combinés perturbe les marges du Drive, obligeant l’hypermarché à réduire sa pression.',
    impactType: 'reputation',
    value: 5,
  });

  pushEvent(w, {
    type: 'vie',
    title: 'Réseau Solidaire : Pacte offensive Anti-Drive',
    text: 'Vous avez déclenché une politique agressive de prix et d’offres croisées pour freiner le Drive HyperVal.',
    causes: [
      { facteur: 'pacte de prix réduits croisés', poids: 3 },
      { facteur: 'offensive de marché contre Drive HyperVal', poids: 2 },
    ],
  });

  w.lifeJournal.push({
    day,
    date: dateOf(day).iso,
    title: 'Pacte offensif lancé',
    text: 'Nous avons lancé une offensive de prix coordinée avec l’épicerie. Le Drive HyperVal perd de sa superbe dans le quartier.',
  });

  return { ok: true, message: 'Pacte offensif Anti-Drive adopté (Réputation +5, agressivité du Drive diminuée) !' };
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

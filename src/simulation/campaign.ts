/**
 * Système de Campagne & Progression de vie (de 12 ans à la maturité).
 * Gère l'évolution de Camille, les jalons de vie, les choix à retardement
 * et la conclusion narrative de NEURAPOLIS.
 */
import { STARTING_PLAYER_AGE, type EndingModelId, type Notification, type WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { ENDING_MODELS } from '../data/campaign';
import { notify, pushEvent } from './events';

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

export interface CampaignActionResult {
  ok: boolean;
  message: string;
}

/** Mobilise les habitants et le conseil lors du réaménagement de la place (Chapitre 4). */
export function holdUrbanCouncil(w: WorldState): CampaignActionResult {
  if (w.campaign.currentChapter !== 4) {
    return { ok: false, message: 'Le Conseil Urbain n’est disponible qu’au chapitre 4.' };
  }
  if (w.player.age < 15) {
    return { ok: false, message: 'Tu dois avoir au moins 15 ans pour organiser l’assemblée du quartier.' };
  }
  w.flags['chapitre4Mobilisation'] = (w.flags['chapitre4Mobilisation'] ?? 0) + 1;
  pushEvent(w, {
    type: 'quartier',
    title: 'Assemblée du Conseil Urbain de Val-Ferrand',
    text: 'Habitants, commerçants et conseillers du quartier se sont réunis sur la place pour débattre de l’avenir de Val-Ferrand.',
    causes: [
      { facteur: 'âge du joueur', seuil: `${w.player.age} ans`, poids: 2 },
      { facteur: 'mobilisation citoyenne', poids: 3 },
    ],
  });
  return { ok: true, message: 'L’assemblée du Conseil Urbain a réuni le quartier avec succès !' };
}

/** Scelle le choix final du modèle durable pour Val-Ferrand (Chapitre 5). */
export function chooseFinalModel(w: WorldState, modelId: EndingModelId): CampaignActionResult {
  if (w.campaign.ending) {
    return { ok: false, message: 'La conclusion de Val-Ferrand a déjà été scellée.' };
  }
  if (w.campaign.currentChapter !== 5) {
    return { ok: false, message: 'La décision finale n’est accessible qu’au chapitre 5.' };
  }
  if (w.player.age < 16) {
    return { ok: false, message: 'Tu dois avoir atteint l’âge de 16 ans pour trancher l’avenir de NEURAPOLIS.' };
  }

  const option = ENDING_MODELS.find((m) => m.id === modelId);
  if (!option) {
    return { ok: false, message: 'Modèle économique non reconnu.' };
  }

  const day = dayIndexOf(w.time.tick);
  const dateIso = dateOf(day).iso;

  // Calcul des accomplissements et sacrifices de l'arc (Chapitres 1 à 4)
  const totalSales = w.flags['ventes'] ?? 0;
  const coursesDone = w.flags['courses'] ?? 0;
  const counterStrategiesCount = w.flags['contreStrategiesLancees'] ?? 0;
  const fusions = w.council.fusionsDone.length;

  let builtText = `En quatre ans (12 → 16 ans), tu as lancé le Stand des Roses (${totalSales} sessions de vente), aidé l'épicerie Bertin (${coursesDone} livraisons), `;
  if (counterStrategiesCount > 0) {
    builtText += `organisé ${counterStrategiesCount} contre-offensives face au Drive HyperVal, `;
  }
  if (fusions > 0) {
    builtText += `et fait émerger ${fusions} synthèse(s) philosophique(s) au Conseil. `;
  } else {
    builtText += `et porté la voix des habitants au Conseil Urbain. `;
  }

  let sacrificedText = '';
  if (modelId === 'coop_citoyenne') {
    sacrificedText = 'Tu as sacrifié la recherche de profit individuel au profit de la gouvernance partagée et du temps passé en débats collectifs.';
    w.district.confianceQuartier = clamp(w.district.confianceQuartier + 20);
    w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie + 15);
    w.player.reputation = clamp(w.player.reputation + 10);
    if (w.rivals.drive_hyper) w.rivals.drive_hyper.marketShare = Math.max(25, w.rivals.drive_hyper.marketShare - 25);
  } else if (modelId === 'marche_equitable') {
    sacrificedText = 'Tu as renoncé à un contrôle étatique strict, acceptant une concurrence encadrée par une charte sociale exigeante.';
    w.district.confianceQuartier = clamp(w.district.confianceQuartier + 10);
    w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie + 20);
    w.player.reputation = clamp(w.player.reputation + 15);
    if (w.rivals.drive_hyper) w.rivals.drive_hyper.marketShare = Math.max(35, w.rivals.drive_hyper.marketShare - 15);
  } else {
    sacrificedText = 'Tu as renoncé aux marges privées et à l’agressivité marchande pour inscrire les biens vitaux sous gestion citoyenne et municipale.';
    w.district.confianceQuartier = clamp(w.district.confianceQuartier + 25);
    w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie + 10);
    w.player.reputation = clamp(w.player.reputation + 12);
    if (w.rivals.drive_hyper) w.rivals.drive_hyper.marketShare = Math.max(20, w.rivals.drive_hyper.marketShare - 30);
  }

  w.campaign.ending = {
    modelId,
    title: option.title,
    summary: `${option.subtitle}. ${option.description}`,
    builtText,
    sacrificedText,
    day,
    date: dateIso,
  };

  const stage5 = w.campaign.stages.find((s) => s.chapter === 5);
  if (stage5) {
    stage5.completed = true;
    if (!w.campaign.completedChapters.includes(5)) {
      w.campaign.completedChapters.push(5);
    }
  }

  pushEvent(w, {
    type: 'vie',
    title: `Conclusion de NEURAPOLIS : ${option.title}`,
    text: `${builtText} ${sacrificedText}`,
    causes: [
      { facteur: 'décision finale à 16 ans', seuil: option.title, poids: 3 },
      { facteur: 'historique des chapitres 1 à 4', poids: 3 },
    ],
  });

  w.lifeJournal.push({
    day,
    date: dateIso,
    title: `L'Héritage de Val-Ferrand — ${option.title}`,
    text: `À 16 ans, j'ai tranché le modèle durable de notre quartier : ${option.title}. ${builtText} ${sacrificedText}`,
  });

  return { ok: true, message: `L'avenir de Val-Ferrand est scellé sous le modèle : ${option.title}.` };
}

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
    const coursesSinceOpening = (w.flags['courses'] ?? 0) - (w.flags['chapitre3CoursesDepart'] ?? 0);
    const strategiesSinceOpening = (w.flags['contreStrategiesLancees'] ?? 0)
      - (w.flags['chapitre3ContreStrategiesDepart'] ?? 0);
    if (stage && !stage.completed && w.player.age >= stage.targetAge
      && coursesSinceOpening >= 5 && strategiesSinceOpening >= 1) {
      stage.completed = true;
      if (!w.campaign.completedChapters.includes(3)) w.campaign.completedChapters.push(3);
      w.campaign.currentChapter = 4;

      pushEvent(w, {
        type: 'vie',
        title: 'Chapitre 3 accompli : Le quartier fait front',
        text: 'Cinq courses ont aidé l’épicerie à garder ses habitués. Face au Drive, vous avez aussi investi dans une nouvelle contre-offensive : l’alliance du quartier commence à peser.',
        causes: [
          { facteur: 'âge du joueur', seuil: `${w.player.age} ans`, poids: 1 },
          { facteur: 'courses livrées pour l’épicerie depuis la Friche', seuil: String(coursesSinceOpening), poids: 2 },
          { facteur: 'nouvelle contre-stratégie lancée depuis la Friche', seuil: String(strategiesSinceOpening), poids: 2 },
        ],
      });
      w.lifeJournal.push({
        day,
        date: dateOf(day).iso,
        title: 'Le quartier fait front',
        text: 'Les livraisons maintiennent l’épicerie dans le jeu. Notre contre-offensive a coûté de l’argent et de l’énergie, mais le Drive ne peut plus faire comme si nous n’existions pas.',
      });
      out.push(notify('bien', 'Chapitre 3 complété ! Chapitre 4 débloqué : La Voix du Quartier.'));
    }
  }

  if (currentChapter === 4) {
    const stage = w.campaign.stages.find((s) => s.chapter === 4);
    const mobilizationDone = (w.flags['chapitre4Mobilisation'] ?? 0) >= 1;
    if (stage && !stage.completed && w.player.age >= stage.targetAge && mobilizationDone) {
      stage.completed = true;
      if (!w.campaign.completedChapters.includes(4)) w.campaign.completedChapters.push(4);
      w.campaign.currentChapter = 5;

      pushEvent(w, {
        type: 'vie',
        title: 'Chapitre 4 accompli : La Voix du Quartier s’élève',
        text: 'L’assemblée du Conseil Urbain sur la place a réuni habitants et commerçants. Le réaménagement de Val-Ferrand ne se fera pas sans nous.',
        causes: [
          { facteur: 'âge du joueur', seuil: `${w.player.age} ans`, poids: 1 },
          { facteur: 'assemblée du Conseil Urbain tenue', poids: 3 },
        ],
      });
      w.lifeJournal.push({
        day,
        date: dateOf(day).iso,
        title: 'La Voix du Quartier',
        text: 'À 15 ans, nous avons mobilisé le quartier face aux projets d’aménagement. Il est temps de penser à la suite.',
      });
      out.push(notify('bien', 'Chapitre 4 complété ! Chapitre 5 débloqué : L’Héritage de Val-Ferrand (16 ans).'));
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

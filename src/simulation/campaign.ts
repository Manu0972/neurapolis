/**
 * Système de Campagne & Progression de vie (de 12 ans à la maturité).
 * Gère l'évolution du personnage, les jalons de vie, les choix à retardement
 * et la conclusion narrative de NEURAPOLIS.
 */
import { STARTING_PLAYER_AGE, type DoctrineKey, type GhostId, type Notification, type WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { LASTING_ECONOMIC_MODELS, URBAN_CHOICES, type LastingEconomicModelId, type UrbanChoiceId } from '../data/campaign';
import { DOCTRINE_LABELS } from '../data/texts';
import { NPC_BY_ID } from '../data/npcs';
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';
import { councilKeyDecision } from './council';
import { addXp } from './skills';
import { bump, notify, pushEvent } from './events';

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
    const salesDone = chapter1Sales(w) >= 3;
    const teamReady = chapter1Team(w) >= 1;
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
      w.flags['chapitre3BoulotsDepart'] = w.flags['jobShiftsDone'] ?? 0;
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
    // Courses pour l'épicerie et services rendus chez Mme Bertin (petit boulot) depuis l'ouverture.
    const coursesSinceOpening = chapter3Help(w);
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
    const councilMobilized = (w.flags['chapitre4ConseilMobilise'] ?? 0) > 0;
    const citizenDebateDone = (w.flags['chapitre4DebatCitoyen'] ?? 0) > 0;
    const districtTrust = w.district.confianceQuartier >= 50;

    if (stage && !stage.completed && w.player.age >= stage.targetAge
      && councilMobilized && citizenDebateDone && districtTrust) {
      stage.completed = true;
      if (!w.campaign.completedChapters.includes(4)) w.campaign.completedChapters.push(4);
      w.campaign.currentChapter = 5;

      pushEvent(w, {
        type: 'vie',
        title: 'Chapitre 4 accompli : La Voix du Quartier a triomphé !',
        text: 'La mobilisation du Conseil et la force du débat citoyen sur la place ont convaincu la ville. Val-Ferrand ne subira plus les décisions de l’extérieur sans mot dire.',
        causes: [
          { facteur: 'âge du joueur', seuil: `${w.player.age} ans`, poids: 1 },
          { facteur: 'mobilisation du Conseil', poids: 2 },
          { facteur: 'grand débat citoyen sur la place', poids: 3 },
          { facteur: 'confiance du quartier', seuil: `${w.district.confianceQuartier}/100`, poids: 2 },
        ],
      });
      w.lifeJournal.push({
        day,
        date: dateOf(day).iso,
        title: 'La Voix du Quartier a triomphé',
        text: 'Sur la place, nous avons tenu tête. Le Conseil dans ma tête et les habitants sur le pavé ne faisaient plus qu’un. À 15 ans, notre voix compte.',
      });
      out.push(notify('bien', 'Chapitre 4 complété ! Chapitre 5 débloqué : L’Héritage de Val-Ferrand.'));
    }
  }

  if (currentChapter === 5) {
    const stage = w.campaign.stages.find((s) => s.chapter === 5);
    const modelFounded = (w.flags['chapitre5ModeleFonde'] ?? 0) > 0;

    if (stage && !stage.completed && w.player.age >= stage.targetAge && modelFounded) {
      stage.completed = true;
      if (!w.campaign.completedChapters.includes(5)) w.campaign.completedChapters.push(5);

      const epilogue = calculateEpilogue(w);
      pushEvent(w, {
        type: 'vie',
        title: 'Chapitre 5 accompli : L’Héritage de Val-Ferrand est scellé !',
        text: `À 16 ans, tu as fondé le modèle économique de NEURAPOLIS : « ${epilogue.modelTitle} ». Ton legs guide durablement le destin du quartier.`,
        causes: [
          { facteur: 'âge de maturité', seuil: `${w.player.age} ans`, poids: 1 },
          { facteur: 'modèle économique durable fondé', seuil: epilogue.modelTitle, poids: 3 },
          { facteur: 'titre de postérité', seuil: epilogue.legacyTitle, poids: 2 },
        ],
      });
      w.lifeJournal.push({
        day,
        date: dateOf(day).iso,
        title: 'L’Héritage de Val-Ferrand',
        text: 'Seize ans. Depuis les premiers bonbons vendus à la grille du collège jusqu’à la fondation de notre modèle, nous avons prouvé qu’une autre économie était possible.',
      });
      out.push(notify('bien', 'NEURAPOLIS accompli ! L’Héritage de Val-Ferrand est gravé dans l’histoire.'));
    }
  }

  return out;
}

/** Participer au grand débat citoyen sur la place de Val-Ferrand (Chapitre 4). */
export function holdCitizenDebate(
  w: WorldState,
  choiceId: UrbanChoiceId,
): { ok: boolean; message: string; confianceGain: number; choiceId?: UrbanChoiceId } {
  if (w.campaign.currentChapter !== 4) {
    return { ok: false, message: 'Le quartier n’est pas encore prêt pour son choix d’aménagement.', confianceGain: 0 };
  }
  if (w.player.age < 15) {
    return { ok: false, message: 'Tu dois avoir 15 ans pour porter ce choix devant le quartier.', confianceGain: 0 };
  }
  if ((w.flags['chapitre4ConseilMobilise'] ?? 0) < 1) {
    return {
      ok: false,
      message: 'Tu dois d’abord mobiliser ton Conseil intérieur pour préparer des arguments solides.',
      confianceGain: 0,
    };
  }
  if ((w.flags['chapitre4DebatCitoyen'] ?? 0) > 0) {
    return { ok: false, message: 'Le quartier a déjà choisi son aménagement.', confianceGain: 0 };
  }
  const choice = URBAN_CHOICES[choiceId];
  if (!choice) return { ok: false, message: 'Ce projet d’aménagement est inconnu.', confianceGain: 0 };
  if (w.player.money < choice.cost) {
    return {
      ok: false,
      message: `Il manque ${(choice.cost - w.player.money).toFixed(2)} € pour financer ce projet.`,
      confianceGain: 0,
    };
  }

  const { effects } = choice;
  councilKeyDecision(w, choice.doctrine);
  w.player.money -= choice.cost;
  bump(w, 'depenses');
  bump(w, 'discussions');
  addXp(w, 'communication', 2);
  w.player.needs.fatigue = clamp(w.player.needs.fatigue + 15);
  w.player.needs.stress = clamp(w.player.needs.stress - 5);
  w.player.needs.moral = clamp(w.player.needs.moral + 10);

  w.district.vitaliteEpicerie = clamp(w.district.vitaliteEpicerie + effects.vitaliteEpicerie);
  w.district.frequentationParc = clamp(w.district.frequentationParc + effects.frequentationParc);
  w.district.confianceQuartier = clamp(w.district.confianceQuartier + effects.confianceQuartier);
  w.player.reputation = clamp(w.player.reputation + effects.reputation);
  w.flags['chapitre4DebatCitoyen'] = 1;
  w.flags['chapitre4DoctrineChoisie'] = choice.doctrine === 'communs' ? 1 : choice.doctrine === 'marche' ? 2 : 4;
  w.flags['chapitre4ChoixUrbain'] = choiceId === 'marche_paysan' ? 1 : choiceId === 'agora_verte' ? 2 : 3;

  const day = dayIndexOf(w.time.tick);
  pushEvent(w, {
    type: 'quartier',
    title: `La place choisit : ${choice.title}`,
    text: `${choice.description} Le projet coûte ${choice.cost} €. Vitalité de l’épicerie ${effects.vitaliteEpicerie >= 0 ? '+' : ''}${effects.vitaliteEpicerie}, fréquentation du parc ${effects.frequentationParc >= 0 ? '+' : ''}${effects.frequentationParc}, confiance du quartier +${effects.confianceQuartier}, réputation +${effects.reputation}.`,
    causes: [
      { facteur: 'conseil intérieur mobilisé', poids: 3 },
      { facteur: `choix : ${choice.title}`, poids: 3 },
      { facteur: 'coût du projet', seuil: `${choice.cost} €`, poids: 2 },
      { facteur: `doctrine : ${DOCTRINE_LABELS[choice.doctrine]}`, poids: 2 },
    ],
  });

  w.lifeJournal.push({
    day,
    date: dateOf(day).iso,
    title: `Le quartier choisit ${choice.title}`,
    text: `Après le débat, les habitants ont choisi : ${choice.title}. ${choice.epilogueSummary}`,
  });

  return {
    ok: true,
    message: `Choix adopté : ${choice.title}. Coût : ${choice.cost} €. Confiance du quartier +${effects.confianceQuartier}.`,
    confianceGain: effects.confianceQuartier,
    choiceId,
  };
}

export interface EpilogueResult {
  chosenModel: LastingEconomicModelId;
  modelTitle: string;
  legacyTitle: string;
  urbanChoiceTitle: string;
  urbanChoiceSummary: string;
  districtSummary: string;
  vitaliteEpicerie: number;
  confianceQuartier: number;
  dominantGhost: { id: string; name: string; quote: string };
  relationshipHighlights: Array<{ npcId: string; name: string; role: string; highlight: string }>;
  epilogueText: string;
}

/** Calcule l'épilogue narratif complet reflétant les choix du joueur et affinités de fantômes. */
export function calculateEpilogue(w: WorldState): EpilogueResult {
  const modelIdx = w.flags['chapitre5ModeleChoisiIndex'];
  let chosenModel: LastingEconomicModelId = modelIdx === 1 ? 'communs_cooperatifs'
    : modelIdx === 2 ? 'marche_equitable'
    : modelIdx === 3 ? 'planification_solidaire'
    : modelIdx === 4 ? 'synergie_hybride'
    : 'synergie_hybride';
  if (!modelIdx) {
    for (const id of Object.keys(LASTING_ECONOMIC_MODELS) as LastingEconomicModelId[]) {
      if ((w.flags[`chapitre5Modele_${id}`] ?? 0) > 0) {
        chosenModel = id;
        break;
      }
    }
  }
  const modelDef = LASTING_ECONOMIC_MODELS[chosenModel];
  const urbanChoiceCode = w.flags['chapitre4ChoixUrbain'];
  const urbanChoiceId: UrbanChoiceId | undefined = urbanChoiceCode === 1
    ? 'marche_paysan'
    : urbanChoiceCode === 2 ? 'agora_verte' : urbanChoiceCode === 3 ? 'foyer_cooperatif' : undefined;
  const urbanChoice = urbanChoiceId ? URBAN_CHOICES[urbanChoiceId] : undefined;

  // Fantôme dominant
  let dominantId: GhostId = 'smith';
  let bestLoyalty = -1;
  for (const [id, st] of Object.entries(w.council.ghosts)) {
    if (st.status === 'actif' && st.loyalty > bestLoyalty) {
      bestLoyalty = st.loyalty;
      dominantId = id;
    }
  }
  if (bestLoyalty < 0) {
    for (const [id, st] of Object.entries(w.council.ghosts)) {
      if (st.loyalty > bestLoyalty) {
        bestLoyalty = st.loyalty;
        dominantId = id;
      }
    }
  }
  const ghostDef = GHOST_DEFS_BY_ID[dominantId];
  const ghostSt = w.council.ghosts[dominantId];
  const quote = ghostSt?.lastWords || ghostDef?.voice.favorable || 'Le travail porte toujours ses fruits.';
  const dominantGhost = {
    id: dominantId,
    name: ghostDef?.name ?? dominantId,
    quote,
  };

  // Destin du quartier
  const epicerieVit = w.district.vitaliteEpicerie;
  const quartierConf = w.district.confianceQuartier;
  let districtSummary = '';
  if (epicerieVit >= 50) {
    districtSummary += 'L’épicerie Bertin est devenue le pivot central d’un réseau de distribution éthique et prospère. ';
  } else if (epicerieVit >= 35) {
    districtSummary += 'L’épicerie Bertin a survécu à la pression des grands groupes grâce à la fidélité têtue des habitués. ';
  } else {
    districtSummary += 'L’épicerie s’est réorganisée sous forme de comptoir citoyen solidaire. ';
  }
  if (quartierConf >= 60) {
    districtSummary += 'La confiance populaire est au plus haut : la place de Val-Ferrand accueille des assemblées régulières respectées de la mairie.';
  } else {
    districtSummary += 'Le quartier garde la mémoire de ses luttes et veille jalousement sur ses acquis.';
  }

  // Relations marquantes
  const relationshipHighlights: Array<{ npcId: string; name: string; role: string; highlight: string }> = [];
  const trackedNpcs = ['noah', 'lina', 'samir', 'bertin', 'karim', 'monique'];
  for (const nid of trackedNpcs) {
    const def = NPC_BY_ID[nid];
    const r = w.player.relations[nid];
    if (!def || !r) continue;
    let high = 'Allié fidèle du quartier.';
    if (r.amitie >= 60) high = `Amitié inébranlable (${r.amitie}/100) — complices de chaque instant.`;
    else if (r.confiance >= 60) high = `Confiance totale (${r.confiance}/100) — partenaire de premier plan.`;
    else if (r.respect >= 60) high = `Grand respect mutuel (${r.respect}/100) — estime reconnue.`;
    relationshipHighlights.push({
      npcId: nid,
      name: def.name,
      role: def.role,
      highlight: high,
    });
  }

  const pName = w.player.name || 'Le protagoniste';
  const epilogueText = [
    `Quatre ans ont passé depuis ce matin de rentrée où ${pName}, douze ans, ouvrait son premier stand de goûters face aux grilles du collège des Roses. De la négociation des premiers caramels jusqu’aux réunions tumultueuses de la Friche Taret, chaque étape a façonné l’âme de Val-Ferrand.`,
    urbanChoice?.epilogueSummary ?? 'Sur la place, les habitants ont continué à débattre de la meilleure façon de partager leur ville.',
    `En fondant « ${modelDef.title} », ${pName} et le quartier ont prouvé que l’économie n’était pas une fatalité subie, mais un contrat vivant que l’on réinvente chaque jour. Dans les pensées de ${pName}, la voix de ${dominantGhost.name} résonne avec sagesse : « ${quote} ».`,
    `Aujourd’hui, à seize ans, ${pName} regarde la place de Val-Ferrand s’animer. L’Héritage est vivant, transmis et partagé. NEURAPOLIS est devenue une cité où l’on grandit debout.`,
  ].join('\n\n');

  return {
    chosenModel,
    modelTitle: modelDef.title,
    legacyTitle: modelDef.legacyTitle,
    urbanChoiceTitle: urbanChoice?.title ?? 'Aménagement débattu par le quartier',
    urbanChoiceSummary: urbanChoice?.epilogueSummary ?? 'La place est restée un sujet de discussion entre habitants.',
    districtSummary,
    vitaliteEpicerie: epicerieVit,
    confianceQuartier: quartierConf,
    dominantGhost,
    relationshipHighlights,
    epilogueText,
  };
}

/** Fonder le modèle économique durable de la ville (Chapitre 5). */
export function foundLastingEconomicModel(
  w: WorldState,
  modelId: LastingEconomicModelId,
): { ok: boolean; message: string; epilogue: EpilogueResult } {
  const modelDef = LASTING_ECONOMIC_MODELS[modelId];
  if (!modelDef) {
    throw new Error(`Modèle économique inconnu : ${modelId}`);
  }
  if (w.campaign.currentChapter < 5) {
    return {
      ok: false,
      message: 'Tu n’as pas encore atteint l’étape finale de fondation économique.',
      epilogue: calculateEpilogue(w),
    };
  }

  if ((w.flags['chapitre5ModeleFonde'] ?? 0) > 0) {
    return {
      ok: false,
      message: 'Le modèle économique de Val-Ferrand a déjà été fondé.',
      epilogue: calculateEpilogue(w),
    };
  }

  w.flags['chapitre5ModeleFonde'] = 1;
  w.flags[`chapitre5Modele_${modelId}`] = 1;
  const MODEL_INDICES: Record<LastingEconomicModelId, number> = {
    communs_cooperatifs: 1,
    marche_equitable: 2,
    planification_solidaire: 3,
    synergie_hybride: 4,
  };
  w.flags['chapitre5ModeleChoisiIndex'] = MODEL_INDICES[modelId] ?? 4;

  // Clé doctrinale
  councilKeyDecision(w, modelDef.doctrine);

  const day = dayIndexOf(w.time.tick);
  pushEvent(w, {
    type: 'systeme',
    title: `Fondation : ${modelDef.title}`,
    text: `${modelDef.description} Scellé sous la bannière : « ${modelDef.legacyTitle} ».`,
    causes: [
      { facteur: 'choix de modèle économique à 16 ans', poids: 3 },
      { facteur: `doctrine : ${DOCTRINE_LABELS[modelDef.doctrine]}`, poids: 3 },
    ],
  });

  w.lifeJournal.push({
    day,
    date: dateOf(day).iso,
    title: `L’Héritage : ${modelDef.title}`,
    text: 'À 16 ans, nous avons posé les fondations durables de notre économie locale. Val-Ferrand a un avenir tracé.',
  });

  const epilogue = calculateEpilogue(w);
  return {
    ok: true,
    message: `Le modèle « ${modelDef.title} » est fondé pour Val-Ferrand !`,
    epilogue,
  };
}

export interface CampaignSummary {
  chapter: number;
  chapterLabel: string;
  title: string;
  prompt: string;
  completed: boolean;
}

/** Fournit le résumé d'avancement en temps réel pour le HUD (.campaign-card). */
/**
 * Chapitre 1 : les ventes du Stand et celles d'un étal du marché comptent toutes deux
 * (docs/VISION.md §4.2 : stand → étal → local).
 */
export function chapter1Sales(w: WorldState): number {
  return (w.flags['ventes'] ?? 0) + (w.flags['ventesEtal'] ?? 0);
}

/** Chapitre 1 : membres du Stand, ou personnes embauchées dans un commerce du joueur. */
export function chapter1Team(w: WorldState): number {
  const hired = Object.values(w.economy?.employees ?? {}).filter((e) => e.businessId).length;
  return (w.project?.members.length ?? 0) + hired;
}

/** Chapitre 3 : courses pour l'épicerie et services chez Mme Bertin depuis l'ouverture du chapitre. */
export function chapter3Help(w: WorldState): number {
  const courses = (w.flags['courses'] ?? 0) - (w.flags['chapitre3CoursesDepart'] ?? 0);
  const shifts = (w.flags['jobShiftsDone'] ?? 0) - (w.flags['chapitre3BoulotsDepart'] ?? 0);
  return Math.max(0, courses) + Math.max(0, shifts);
}

export function getCampaignProgressSummary(w: WorldState): CampaignSummary {
  const ch = w.campaign.currentChapter;
  const stage = w.campaign.stages.find((s) => s.chapter === ch);
  const age = w.player.age;

  if (ch === 1) {
    const v = Math.min(3, chapter1Sales(w));
    const m = chapter1Team(w);
    const c = Math.min(1, w.flags['contreStrategiesLancees'] ?? 0);
    return {
      chapter: 1,
      chapterLabel: `Chapitre 1 (${age} ans)`,
      title: stage?.title ?? 'Les Goûters de Val-Ferrand',
      prompt: `Ventes : ${v}/3 · Équipe : ${m}/1 · Contre-offensive : ${c}/1`,
      completed: false,
    };
  }

  if (ch === 2) {
    const samir = (w.flags['chapitre2ConversationCoopSamir'] ?? 0) > 0;
    const rules = w.project?.rules.collectif ?? false;
    const colSale = (w.flags['chapitre2VentesCollectives'] ?? 0) > 0;
    return {
      chapter: 2,
      chapterLabel: `Chapitre 2 (${age} ans)`,
      title: stage?.title ?? 'L’Appel de la Friche Taret',
      prompt: `Âge : ${age}/13 ans · Samir : ${samir ? '✓' : 'non'} · Règles coop : ${rules ? '✓' : 'non'} · Vente collective : ${colSale ? '✓' : 'non'}`,
      completed: false,
    };
  }

  if (ch === 3) {
    const courses = chapter3Help(w);
    const strat = (w.flags['contreStrategiesLancees'] ?? 0) - (w.flags['chapitre3ContreStrategiesDepart'] ?? 0);
    return {
      chapter: 3,
      chapterLabel: `Chapitre 3 (${age} ans)`,
      title: stage?.title ?? 'Le Réseau Solidaire',
      prompt: `Âge : ${age}/14 ans · Courses épicerie : ${Math.max(0, courses)}/5 · Nouvelle riposte : ${Math.max(0, strat)}/1`,
      completed: false,
    };
  }

  if (ch === 4) {
    const conseil = (w.flags['chapitre4ConseilMobilise'] ?? 0) > 0;
    const debat = (w.flags['chapitre4DebatCitoyen'] ?? 0) > 0;
    const conf = w.district.confianceQuartier;
    return {
      chapter: 4,
      chapterLabel: `Chapitre 4 (${age} ans)`,
      title: stage?.title ?? 'La Voix du Quartier',
      prompt: `Âge : ${age}/15 ans · Conseil : ${conseil ? '✓' : 'non'} · Débat place : ${debat ? '✓' : 'non'} · Confiance : ${conf}/50`,
      completed: false,
    };
  }

  if (ch === 5) {
    const fonde = (w.flags['chapitre5ModeleFonde'] ?? 0) > 0;
    const allDone = w.campaign.completedChapters.includes(5);
    return {
      chapter: 5,
      chapterLabel: `Chapitre 5 (${age} ans)`,
      title: stage?.title ?? 'L’Héritage de Val-Ferrand',
      prompt: allDone
        ? '✦ NEURAPOLIS accompli · Épilogue gravé dans l’histoire de la cité'
        : `Âge : ${age}/16 ans · Modèle économique : ${fonde ? 'Fondé ✓' : 'À choisir'}`,
      completed: allDone,
    };
  }

  return {
    chapter: ch,
    chapterLabel: `Épilogue (${age} ans)`,
    title: 'L’Héritage de Val-Ferrand',
    prompt: '✦ NEURAPOLIS accompli · Épilogue gravé dans l’histoire de la cité',
    completed: true,
  };
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

/**
 * Ellipse narrative et vacances annuelles (Standard AAA / Big Ambitions).
 * Permet de franchir une année de transition scolaire et personnelle
 * lorsque le chapitre en cours est complété mais que l'âge requis pour le suivant
 * n'est pas encore atteint.
 */
export function canTriggerAnnualHolidayTimeskip(w: WorldState): boolean {
  const ch = w.campaign.currentChapter;
  if (ch >= 5) return false;
  const currentStage = w.campaign.stages.find((s) => s.chapter === ch);
  const nextStage = w.campaign.stages.find((s) => s.chapter === ch + 1);
  if (!nextStage) return false;
  // Disponible si le chapitre en cours a été validé ou si les objectifs de chapitre sont remplis
  const completed = currentStage?.completed || w.campaign.completedChapters.includes(ch);
  return completed && w.player.age < nextStage.targetAge;
}

export function triggerAnnualHolidayTimeskip(w: WorldState): {
  ok: boolean;
  message: string;
  previousAge: number;
  newAge: number;
  report: string;
} {
  const ch = w.campaign.currentChapter;
  const nextStage = w.campaign.stages.find((s) => s.chapter === ch + 1);
  if (!canTriggerAnnualHolidayTimeskip(w) || !nextStage) {
    return {
      ok: false,
      message: 'Les conditions pour une transition annuelle ne sont pas encore réunies.',
      previousAge: w.player.age,
      newAge: w.player.age,
      report: '',
    };
  }

  const previousAge = w.player.age;
  const newAge = nextStage.targetAge;
  w.player.age = newAge;

  // Calcul du saut temporel en jours (365 jours de rentrée à rentrée)
  const currentDay = dayIndexOf(w.time.tick);
  // Trouver le prochain 1er septembre
  let targetDay = currentDay + 1;
  while (ageForDay(targetDay) < newAge) {
    targetDay += 10;
  }
  while (ageForDay(targetDay) > newAge && targetDay > currentDay) {
    targetDay -= 1;
  }
  const ticksToAdvance = Math.max(0, (targetDay - currentDay) * 144);
  w.time.tick += ticksToAdvance;

  // Récupération des besoins et consolidation
  w.player.needs.fatigue = 0;
  w.player.needs.stress = Math.max(0, w.player.needs.stress - 20);
  w.player.needs.moral = Math.min(100, w.player.needs.moral + 15);
  w.player.characteristics.confiance = Math.min(100, w.player.characteristics.confiance + 5);
  w.player.characteristics.adaptabilite = Math.min(100, w.player.characteristics.adaptabilite + 4);

  const report = [
    `✦ Bilan de l'Année Scolaire & Grandes Vacances (${previousAge} → ${newAge} ans) ✦`,
    `Le temps a fait son œuvre : les grandes vacances se sont écoulées, consolidant tes relations et ton expérience à Val-Ferrand.`,
    `Tu entres désormais dans ta ${newAge}e année avec une confiance renouvelée (+5 Confiance, +4 Adaptabilité, Stress apaisé).`,
    `Un nouveau chapitre commence : « ${nextStage.title} ».`,
  ].join('\n\n');

  const pName = w.player.firstName || w.player.name || 'Le protagoniste';
  pushEvent(w, {
    type: 'vie',
    title: `Ellipse : ${pName} fête ses ${newAge} ans`,
    text: `Les grandes vacances sont passées. ${pName} grandit et aborde le chapitre « ${nextStage.title} » avec maturité.`,
    causes: [
      { facteur: 'transition annuelle & grandes vacances', poids: 3 },
      { facteur: `nouvel âge atteint : ${newAge} ans`, poids: 2 },
    ],
  });

  w.lifeJournal.push({
    day: dayIndexOf(w.time.tick),
    date: dateOf(dayIndexOf(w.time.tick)).iso,
    title: `Grandes Vacances & Bilan (${newAge} ans)`,
    text: `Une nouvelle rentrée commence. J'ai maintenant ${newAge} ans. Le quartier et nos projets entrent dans une nouvelle dimension.`,
  });

  return {
    ok: true,
    message: `Ellipse accomplie : ${pName} a désormais ${newAge} ans !`,
    previousAge,
    newAge,
    report,
  };
}

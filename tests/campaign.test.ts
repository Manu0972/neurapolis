import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { npcLine } from '../src/simulation/dialogue';
import {
  campaignTick, calculateEpilogue, foundLastingEconomicModel,
  getCampaignProgressSummary, holdCitizenDebate,
} from '../src/simulation/campaign';
import { adoptSharedRules, buyStock, createProject, runCourse, runSalesSession } from '../src/simulation/project';
import { executeCounterStrategy } from '../src/simulation/rival';
import { councilArrivalChoose, mobilizeCouncilForDebate } from '../src/simulation/council';
import { LASTING_ECONOMIC_MODELS, URBAN_CHOICES, type LastingEconomicModelId, type UrbanChoiceId } from '../src/data/campaign';

describe('campagne — chapitre 2 et âge du joueur', () => {
  it('fait passer l’âge à 13 ans au premier anniversaire du 1er septembre, une seule fois', () => {
    const w = createWorld();
    w.time.tick = 364 * TICKS_PER_DAY + 43;
    campaignTick(w);
    expect(w.player.age).toBe(12);

    w.time.tick = 365 * TICKS_PER_DAY + 43;
    const notifications = campaignTick(w);
    expect(w.player.age).toBe(13);
    expect(notifications.some((entry) => entry.text.includes('13 ans'))).toBe(true);
    const eventsAtBirthday = w.events.filter((event) => event.title === 'Camille fête ses 13 ans');
    campaignTick(w);
    expect(w.events.filter((event) => event.title === 'Camille fête ses 13 ans')).toHaveLength(eventsAtBirthday.length);
  });

  it('ne compte la conversation de Samir qu’au chapitre 2 et sur le sujet de la coopérative', () => {
    const w = createWorld();
    npcLine(w, 'samir', 'coop');
    expect(w.flags['chapitre2ConversationCoopSamir']).toBeUndefined();

    w.campaign.currentChapter = 2;
    npcLine(w, 'samir', 'accueil');
    expect(w.flags['chapitre2ConversationCoopSamir']).toBeUndefined();
    npcLine(w, 'samir', 'coop');
    expect(w.flags['chapitre2ConversationCoopSamir']).toBe(1);
  });

  it('ne compte qu’une vente réelle après la conversation et les règles collectives', () => {
    const w = createWorld();
    w.campaign.currentChapter = 2;
    createProject(w);
    w.project!.members.push('noah', 'lina');
    adoptSharedRules(w);
    buyStock(w);

    const beforeMeeting = runSalesSession(w, 'place');
    expect(beforeMeeting.ok).toBe(true);
    expect(w.flags['chapitre2VentesCollectives']).toBeUndefined();

    npcLine(w, 'samir', 'coop');
    buyStock(w);
    const afterMeeting = runSalesSession(w, 'place');
    expect(afterMeeting.ok).toBe(true);
    expect(afterMeeting.sold).toBeGreaterThan(0);
    expect(w.flags['chapitre2VentesCollectives']).toBe(1);
  });

  it('débloque le chapitre 3 une fois les critères réunis à 13 ans, sans double validation', () => {
    const w = createWorld();
    w.campaign.currentChapter = 2;
    w.flags['chapitre2ConversationCoopSamir'] = 1;
    w.flags['chapitre2VentesCollectives'] = 1;
    createProject(w);
    w.project!.rules.collectif = true;

    expect(campaignTick(w)).toHaveLength(0);
    expect(w.campaign.currentChapter).toBe(2);
    w.time.tick = 365 * TICKS_PER_DAY + 43;
    const notifications = campaignTick(w);
    expect(w.campaign.currentChapter).toBe(3);
    expect(w.campaign.completedChapters).toEqual([2]);
    expect(notifications.some((entry) => entry.text.includes('Chapitre 3 débloqué'))).toBe(true);
    campaignTick(w);
    expect(w.campaign.completedChapters).toEqual([2]);
    expect(w.events.filter((event) => event.title.includes('Chapitre 2 accompli'))).toHaveLength(1);
  });

  it('ne crédite au chapitre 3 que les courses et contre-offensives engagées après son ouverture', () => {
    const w = createWorld();
    w.campaign.currentChapter = 3;
    w.player.age = 14;
    w.flags['courses'] = 5;
    w.flags['contreStrategiesLancees'] = 1;
    w.flags['chapitre3CoursesDepart'] = 5;
    w.flags['chapitre3ContreStrategiesDepart'] = 1;

    expect(campaignTick(w)).toHaveLength(0);
    expect(w.campaign.currentChapter).toBe(3);
  });

  it('fait progresser le chapitre 3 après cinq livraisons réelles et une contre-offensive nouvelle', () => {
    const w = createWorld();
    w.campaign.currentChapter = 3;
    w.campaign.stages.find((stage) => stage.chapter === 3)!.targetAge = 13;
    w.player.age = 13;
    w.flags['chapitre3CoursesDepart'] = 0;
    w.flags['chapitre3ContreStrategiesDepart'] = 0;
    createProject(w);

    for (let i = 0; i < 5; i++) expect(runCourse(w).ok).toBe(true);
    expect(w.district.vitaliteEpicerie).toBe(50);
    expect(executeCounterStrategy(w, 'degustation').ok).toBe(true);

    const notifications = campaignTick(w);
    expect(w.campaign.currentChapter).toBe(4);
    expect(w.campaign.completedChapters).toContain(3);
    expect(notifications.some((entry) => entry.text.includes('Chapitre 4 débloqué'))).toBe(true);
    expect(w.events.find((event) => event.title.includes('Chapitre 3 accompli'))?.causes).toHaveLength(3);
    campaignTick(w);
    expect(w.events.filter((event) => event.title.includes('Chapitre 3 accompli'))).toHaveLength(1);
  });
});

describe('campagne — chapitre 4 : La Voix du Quartier', () => {
  it('exige au moins deux voix actives pour mobiliser le Conseil pour le débat', () => {
    const w = createWorld();
    w.campaign.currentChapter = 4;

    // 0 voix active au départ
    const res0 = mobilizeCouncilForDebate(w);
    expect(res0.ok).toBe(false);
    expect(res0.message).toContain('au moins deux voix actives');
    expect(w.flags['chapitre4ConseilMobilise']).toBeUndefined();

    // 1 voix active
    w.council.ghosts['smith']!.arrivalPending = true;
    councilArrivalChoose(w, 'smith', 'ecouter');
    const res1 = mobilizeCouncilForDebate(w);
    expect(res1.ok).toBe(false);

    // 2 voix actives
    w.council.ghosts['ostrom']!.arrivalPending = true;
    councilArrivalChoose(w, 'ostrom', 'ecouter');
    
    // Tentative au chapitre 3 -> rejetée
    w.campaign.currentChapter = 3;
    const resPre4 = mobilizeCouncilForDebate(w);
    expect(resPre4.ok).toBe(false);
    expect(resPre4.message).toContain('attendre le Chapitre 4');

    // Au chapitre 4 -> acceptée
    w.campaign.currentChapter = 4;
    const res2 = mobilizeCouncilForDebate(w);
    expect(res2.ok).toBe(true);
    expect(res2.mobilizedGhosts).toEqual(['smith', 'ostrom']);
    expect(res2.supportScore).toBeGreaterThanOrEqual(2);
    expect(w.flags['chapitre4ConseilMobilise']).toBe(1);
    const inflAfter = w.player.characteristics.influence;
    expect(inflAfter).toBeGreaterThan(35);

    // Deuxième appel -> idempotent, pas de double boost ni de double événement
    const eventsBefore = w.events.filter((e) => e.title.includes('Mobilisation du Conseil')).length;
    const resRepeat = mobilizeCouncilForDebate(w);
    expect(resRepeat.ok).toBe(true);
    expect(resRepeat.message).toContain('déjà été mobilisé');
    expect(w.player.characteristics.influence).toBe(inflAfter);
    expect(w.events.filter((e) => e.title.includes('Mobilisation du Conseil'))).toHaveLength(eventsBefore);
  });

  it('exige la mobilisation préalable du Conseil pour choisir un aménagement', () => {
    const w = createWorld();
    w.campaign.currentChapter = 4;
    w.player.age = 15;

    // Débat sans conseil mobilisé
    const resSans = holdCitizenDebate(w, 'agora_verte');
    expect(resSans.ok).toBe(false);
    expect(resSans.message).toContain('mobiliser ton Conseil');
    expect(w.flags['chapitre4DebatCitoyen']).toBeUndefined();

    // Avec conseil mobilisé
    w.flags['chapitre4ConseilMobilise'] = 1;
    w.player.money = 100;
    const initialTrust = w.district.confianceQuartier;
    const initialMoney = w.player.money;
    const resAvec = holdCitizenDebate(w, 'agora_verte');
    expect(resAvec.ok).toBe(true);
    expect(w.flags['chapitre4DebatCitoyen']).toBe(1);
    expect(w.district.confianceQuartier).toBe(initialTrust + URBAN_CHOICES.agora_verte.effects.confianceQuartier);
    expect(w.player.money).toBe(initialMoney - URBAN_CHOICES.agora_verte.cost);
    expect(w.flags['chapitre4ChoixUrbain']).toBe(2);
    expect(w.events.some((e) => e.title === `La place choisit : ${URBAN_CHOICES.agora_verte.title}`)).toBe(true);
  });

  it('applique des coûts et des compromis distincts pour les trois projets urbains', () => {
    const ids: UrbanChoiceId[] = ['marche_paysan', 'agora_verte', 'foyer_cooperatif'];
    const outcomes = ids.map((id) => {
      const w = createWorld();
      w.campaign.currentChapter = 4;
      w.player.age = 15;
      w.flags['chapitre4ConseilMobilise'] = 1;
      w.player.money = 100;
      const before = {
        money: w.player.money,
        vitality: w.district.vitaliteEpicerie,
        park: w.district.frequentationParc,
        trust: w.district.confianceQuartier,
        reputation: w.player.reputation,
      };
      const choice = URBAN_CHOICES[id];
      const result = holdCitizenDebate(w, id);
      expect(result.ok).toBe(true);
      expect(result.choiceId).toBe(id);
      expect(w.player.money).toBe(before.money - choice.cost);
      expect(w.district.vitaliteEpicerie).toBe(before.vitality + choice.effects.vitaliteEpicerie);
      expect(w.district.frequentationParc).toBe(before.park + choice.effects.frequentationParc);
      expect(w.district.confianceQuartier).toBe(before.trust + choice.effects.confianceQuartier);
      expect(w.player.reputation).toBe(before.reputation + choice.effects.reputation);
      expect(w.council.decisions[choice.doctrine]).toBe(1);
      expect(w.events[0]?.text).toContain(choice.description);
      return choice.effects;
    });

    expect(new Set(outcomes.map((effect) => JSON.stringify(effect))).size).toBe(3);
  });

  it('refuse un projet trop cher et interdit de faire voter deux fois', () => {
    const w = createWorld();
    w.campaign.currentChapter = 4;
    w.player.age = 15;
    w.flags['chapitre4ConseilMobilise'] = 1;
    w.player.money = 20;
    const beforeTrust = w.district.confianceQuartier;
    const tooExpensive = holdCitizenDebate(w, 'agora_verte');
    expect(tooExpensive.ok).toBe(false);
    expect(w.flags['chapitre4DebatCitoyen']).toBeUndefined();
    expect(w.district.confianceQuartier).toBe(beforeTrust);

    w.player.money = 100;
    expect(holdCitizenDebate(w, 'agora_verte').ok).toBe(true);
    const afterVote = w.player.money;
    const repeated = holdCitizenDebate(w, 'marche_paysan');
    expect(repeated.ok).toBe(false);
    expect(w.player.money).toBe(afterVote);
    expect(w.flags['chapitre4ChoixUrbain']).toBe(2);
    expect(w.events.filter((event) => event.title.startsWith('La place choisit :'))).toHaveLength(1);
  });

  it('attend les 15 ans avant de soumettre un projet au quartier', () => {
    const w = createWorld();
    w.campaign.currentChapter = 4;
    w.flags['chapitre4ConseilMobilise'] = 1;
    w.player.money = 100;

    const result = holdCitizenDebate(w, 'foyer_cooperatif');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('15 ans');
    expect(w.flags['chapitre4DebatCitoyen']).toBeUndefined();
    expect(w.player.money).toBe(100);
  });

  it('débloque le chapitre 5 à 15 ans avec conseil mobilisé, débat mené et confiance >= 50', () => {
    const w = createWorld();
    w.campaign.currentChapter = 4;
    w.player.age = 15;
    w.flags['chapitre4ConseilMobilise'] = 1;
    w.flags['chapitre4DebatCitoyen'] = 1;
    w.district.confianceQuartier = 55;

    const notifs = campaignTick(w);
    expect(w.campaign.currentChapter).toBe(5);
    expect(w.campaign.completedChapters).toContain(4);
    expect(notifs.some((n) => n.text.includes('Chapitre 5 débloqué'))).toBe(true);
    expect(w.events.some((e) => e.title.includes('Chapitre 4 accompli'))).toBe(true);

    // Pas de double validation
    campaignTick(w);
    expect(w.events.filter((e) => e.title.includes('Chapitre 4 accompli'))).toHaveLength(1);
  });
});

describe('campagne — chapitre 5 : L’Héritage de Val-Ferrand & Épilogue', () => {
  it('permet de fonder chacun des 4 modèles économiques durables au chapitre 5', () => {
    const models: LastingEconomicModelId[] = [
      'communs_cooperatifs',
      'marche_equitable',
      'planification_solidaire',
      'synergie_hybride',
    ];

    for (const mId of models) {
      const w = createWorld();
      w.campaign.currentChapter = 5;
      w.player.age = 16;

      const res = foundLastingEconomicModel(w, mId);
      expect(res.ok).toBe(true);
      expect(res.message).toContain(LASTING_ECONOMIC_MODELS[mId].title);
      expect(res.epilogue.chosenModel).toBe(mId);
      expect(w.flags['chapitre5ModeleFonde']).toBe(1);
      expect(w.flags[`chapitre5Modele_${mId}`]).toBe(1);

      // Rejet si déjà fondé dans ce même monde
      const resRepeat = foundLastingEconomicModel(w, mId);
      expect(resRepeat.ok).toBe(false);
      expect(resRepeat.message).toContain('déjà été fondé');
    }

    // Rejet si appelé avant le chapitre 5
    const wPre5 = createWorld();
    wPre5.campaign.currentChapter = 4;
    const resPre5 = foundLastingEconomicModel(wPre5, 'communs_cooperatifs');
    expect(resPre5.ok).toBe(false);
    expect(resPre5.message).toContain('pas encore atteint');
  });

  it('valide le chapitre 5 et conclut NEURAPOLIS avec un épilogue riche et cohérent', () => {
    const w = createWorld();
    w.campaign.currentChapter = 5;
    w.player.age = 16;
    w.flags['chapitre5ModeleFonde'] = 1;
    w.flags['chapitre5Modele_communs_cooperatifs'] = 1;

    // Voix actives pour affinité épilogue
    w.council.ghosts['ostrom']!.status = 'actif';
    w.council.ghosts['ostrom']!.loyalty = 85;

    const notifs = campaignTick(w);
    expect(w.campaign.completedChapters).toContain(5);
    expect(notifs.some((n) => n.text.includes('NEURAPOLIS accompli'))).toBe(true);

    const epilogue = calculateEpilogue(w);
    expect(epilogue.chosenModel).toBe('communs_cooperatifs');
    expect(epilogue.urbanChoiceTitle).toBe('Aménagement débattu par le quartier');
    expect(epilogue.legacyTitle).toBe('Bâtisseur des Communs');
    expect(epilogue.dominantGhost.id).toBe('ostrom');
    expect(epilogue.dominantGhost.quote.length).toBeGreaterThan(5);
    expect(epilogue.districtSummary.length).toBeGreaterThan(20);
    expect(epilogue.relationshipHighlights.length).toBeGreaterThan(0);
    expect(epilogue.epilogueText).toContain('Camille');
    expect(epilogue.epilogueText).toContain('Val-Ferrand');
  });

  it('fournit le résumé d’avancement de campagne en temps réel à chaque chapitre', () => {
    const w = createWorld();

    // Chapitre 1
    const s1 = getCampaignProgressSummary(w);
    expect(s1.chapter).toBe(1);
    expect(s1.prompt).toContain('Ventes : 0/3');

    // Chapitre 2
    w.campaign.currentChapter = 2;
    w.player.age = 13;
    const s2 = getCampaignProgressSummary(w);
    expect(s2.chapter).toBe(2);
    expect(s2.prompt).toContain('Samir : non');

    // Chapitre 3
    w.campaign.currentChapter = 3;
    w.player.age = 14;
    const s3 = getCampaignProgressSummary(w);
    expect(s3.chapter).toBe(3);
    expect(s3.prompt).toContain('Courses épicerie');

    // Chapitre 4
    w.campaign.currentChapter = 4;
    w.player.age = 15;
    const s4 = getCampaignProgressSummary(w);
    expect(s4.chapter).toBe(4);
    expect(s4.prompt).toContain('Conseil : non');

    // Chapitre 5
    w.campaign.currentChapter = 5;
    w.player.age = 16;
    const s5 = getCampaignProgressSummary(w);
    expect(s5.chapter).toBe(5);
    expect(s5.prompt).toContain('Modèle économique');

    // Terminé
    w.campaign.completedChapters.push(5);
    const sDone = getCampaignProgressSummary(w);
    expect(sDone.completed).toBe(true);
    expect(sDone.prompt).toContain('NEURAPOLIS accompli');
  });
});

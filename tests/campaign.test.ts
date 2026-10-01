import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { dialogueTopics, npcLine } from '../src/simulation/dialogue';
import { campaignTick, chooseReseauStrategy } from '../src/simulation/campaign';
import { adoptSharedRules, buyStock, createProject, runCourse, runSalesSession } from '../src/simulation/project';
import { executeCounterStrategy } from '../src/simulation/rival';

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
    w.flags['chapitre3ChoixReseau'] = 2; // Stratégie Solidaire choisie
    createProject(w);

    for (let i = 0; i < 5; i++) expect(runCourse(w).ok).toBe(true);
    expect(w.district.vitaliteEpicerie).toBe(50);
    expect(executeCounterStrategy(w, 'degustation').ok).toBe(true);

    const notifications = campaignTick(w);
    expect(w.campaign.currentChapter).toBe(4);
    expect(w.campaign.completedChapters).toContain(3);
    expect(notifications.some((entry) => entry.text.includes('Chapitre 4 débloqué'))).toBe(true);
    expect(w.events.find((event) => event.title.includes('Chapitre 3 accompli'))?.causes).toHaveLength(4);
    campaignTick(w);
    expect(w.events.filter((event) => event.title.includes('Chapitre 3 accompli'))).toHaveLength(1);
  });
});

describe('campagne — chapitre 3 jouable (Le Réseau Solidaire)', () => {
  it('expose le sujet "reseau" pour Mme Bertin uniquement au chapitre 3', () => {
    const w = createWorld();
    w.campaign.currentChapter = 2;
    let topics = dialogueTopics('bertin', w);
    expect(topics).not.toContain('reseau');

    w.campaign.currentChapter = 3;
    topics = dialogueTopics('bertin', w);
    expect(topics).toContain('reseau');
  });

  it('permet de choisir entre 3 stratégies pour le Réseau Solidaire et applique les effets', () => {
    const wSolidaire = createWorld();
    wSolidaire.campaign.currentChapter = 3;
    const resSol = chooseReseauStrategy(wSolidaire, 'solidaire');
    expect(resSol.ok).toBe(true);
    expect(wSolidaire.flags['chapitre3ChoixReseau']).toBe(2);
    expect(wSolidaire.district.confianceQuartier).toBe(65); // 50 départ + 15
    expect(wSolidaire.player.relations['bertin']?.amitie).toBe(50); // 35 départ + 15
    expect(wSolidaire.campaign.delayedConsequences).toHaveLength(1);

    const wCommercial = createWorld();
    wCommercial.campaign.currentChapter = 3;
    createProject(wCommercial);
    const moneyBefore = wCommercial.player.money;
    const resCom = chooseReseauStrategy(wCommercial, 'commercial');
    expect(resCom.ok).toBe(true);
    expect(wCommercial.flags['chapitre3ChoixReseau']).toBe(1);
    expect(wCommercial.player.money).toBe(moneyBefore + 25);
    expect(wCommercial.project?.balance).toBe(15);

    const wCombat = createWorld();
    wCombat.campaign.currentChapter = 3;
    const resCombat = chooseReseauStrategy(wCombat, 'combat');
    expect(resCombat.ok).toBe(true);
    expect(wCombat.flags['chapitre3ChoixReseau']).toBe(3);
    expect(wCombat.player.reputation).toBe(50); // 45 départ + 5
  });

  it('refuse de trancher une seconde fois la stratégie du Réseau Solidaire', () => {
    const w = createWorld();
    w.campaign.currentChapter = 3;
    expect(chooseReseauStrategy(w, 'solidaire').ok).toBe(true);
    const again = chooseReseauStrategy(w, 'commercial');
    expect(again.ok).toBe(false);
    expect(again.message).toContain('déjà été tranchée');
  });

  it('exige la décision stratégique pour compléter le chapitre 3', () => {
    const w = createWorld();
    w.campaign.currentChapter = 3;
    w.player.age = 14;
    w.flags['chapitre3CoursesDepart'] = 0;
    w.flags['chapitre3ContreStrategiesDepart'] = 0;
    createProject(w);

    for (let i = 0; i < 5; i++) runCourse(w);
    executeCounterStrategy(w, 'degustation');

    // Sans la décision
    campaignTick(w);
    expect(w.campaign.currentChapter).toBe(3);

    // Avec la décision
    chooseReseauStrategy(w, 'solidaire');
    const notifs = campaignTick(w);
    expect(w.campaign.currentChapter).toBe(4);
    expect(notifs.some((n) => n.text.includes('Chapitre 4 débloqué'))).toBe(true);
  });

  it('conserve la progression et le non-doublon des événements après sauvegarde et rechargement', () => {
    const w = createWorld();
    w.campaign.currentChapter = 3;
    w.player.age = 14;
    w.flags['chapitre3CoursesDepart'] = 0;
    w.flags['chapitre3ContreStrategiesDepart'] = 0;
    createProject(w);

    chooseReseauStrategy(w, 'solidaire');
    for (let i = 0; i < 5; i++) runCourse(w);
    executeCounterStrategy(w, 'degustation');

    campaignTick(w);
    expect(w.campaign.currentChapter).toBe(4);

    // Simulation sauvegarde / rechargement
    const saved = JSON.parse(JSON.stringify(w));
    const reloaded = saved;

    expect(reloaded.campaign.currentChapter).toBe(4);
    expect(reloaded.flags['chapitre3ChoixReseau']).toBe(2);

    const eventsCount = reloaded.events.length;
    campaignTick(reloaded);
    expect(reloaded.events.length).toBe(eventsCount);
  });
});

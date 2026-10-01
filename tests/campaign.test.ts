import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { npcLine } from '../src/simulation/dialogue';
import { campaignTick, chooseFinalModel, holdUrbanCouncil } from '../src/simulation/campaign';
import { adoptSharedRules, buyStock, createProject, runCourse, runSalesSession } from '../src/simulation/project';
import { executeCounterStrategy } from '../src/simulation/rival';
import { exportSave, importSave } from '../src/saves/persist';

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

describe('campagne — chapitres 4, 5 et fin jouable à 16 ans', () => {
  it('débloque le chapitre 5 après mobilisation citoyenne à 15 ans au chapitre 4', () => {
    const w = createWorld();
    w.campaign.currentChapter = 4;
    w.player.age = 15;

    // Tentative sans mobilisation
    campaignTick(w);
    expect(w.campaign.currentChapter).toBe(4);

    // Organiser l'assemblée du Conseil Urbain
    const res = holdUrbanCouncil(w);
    expect(res.ok).toBe(true);

    const notifications = campaignTick(w);
    expect(w.campaign.currentChapter).toBe(5);
    expect(w.campaign.completedChapters).toContain(4);
    expect(notifications.some((entry) => entry.text.includes('Chapitre 5 débloqué'))).toBe(true);
  });

  it('exige l’âge 16 ans et le chapitre 5 pour choisir le modèle final, sans épilogue automatique', () => {
    const w = createWorld();
    w.campaign.currentChapter = 5;
    w.player.age = 15;

    // Pas d'épilogue automatique sur campaignTick
    campaignTick(w);
    expect(w.campaign.ending).toBeUndefined();

    // Rejet si âge < 16
    const tooYoung = chooseFinalModel(w, 'coop_citoyenne');
    expect(tooYoung.ok).toBe(false);

    // À 16 ans
    w.player.age = 16;
    campaignTick(w);
    expect(w.campaign.ending).toBeUndefined(); // toujours aucune fin automatique sans action du joueur
  });

  it('teste chaque branche de fin (coop_citoyenne, marche_equitable, planification_communs) et leurs retombées', () => {
    const branches = ['coop_citoyenne', 'marche_equitable', 'planification_communs'] as const;

    for (const modelId of branches) {
      const w = createWorld();
      w.campaign.currentChapter = 5;
      w.player.age = 16;
      w.flags['ventes'] = 8;
      w.flags['courses'] = 12;
      w.flags['contreStrategiesLancees'] = 3;

      const res = chooseFinalModel(w, modelId);
      expect(res.ok).toBe(true);
      expect(w.campaign.ending).toBeDefined();
      expect(w.campaign.ending?.modelId).toBe(modelId);
      expect(w.campaign.stages.find((s) => s.chapter === 5)?.completed).toBe(true);

      // Vérifier enregistrement unique et stable
      expect(w.lifeJournal.some((j) => j.title.includes('L\'Héritage de Val-Ferrand'))).toBe(true);
      expect(w.events.some((e) => e.title.includes('Conclusion de NEURAPOLIS'))).toBe(true);

      // Impossible de choisir une seconde fin
      const secondTry = chooseFinalModel(w, 'marche_equitable');
      expect(secondTry.ok).toBe(false);
      expect(secondTry.message).toMatch(/déjà été scellée/);
    }
  });

  it('permet de continuer après la fin et de recharger la sauvegarde sans dupliquer la scène ni réinitialiser', () => {
    const w = createWorld();
    w.campaign.currentChapter = 5;
    w.player.age = 16;

    chooseFinalModel(w, 'coop_citoyenne');
    const journalCountBefore = w.lifeJournal.length;
    const eventsCountBefore = w.events.length;

    // Avancer le temps / simuler un tick
    campaignTick(w);
    expect(w.lifeJournal.length).toBe(journalCountBefore);
    expect(w.events.length).toBe(eventsCountBefore);
    expect(w.campaign.ending?.modelId).toBe('coop_citoyenne');

    // Sauvegarder et recharger
    const savedJson = exportSave(w);
    const reloadedWorld = importSave(savedJson);

    expect(reloadedWorld.campaign.ending).toEqual(w.campaign.ending);
    expect(reloadedWorld.campaign.completedChapters).toContain(5);

    // Ticks additionnels post-chargement
    campaignTick(reloadedWorld);
    expect(reloadedWorld.lifeJournal.length).toBe(journalCountBefore);
    expect(reloadedWorld.events.length).toBe(eventsCountBefore);
  });
});

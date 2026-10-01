import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { npcLine } from '../src/simulation/dialogue';
import { campaignTick } from '../src/simulation/campaign';
import { adoptSharedRules, buyStock, createProject, runSalesSession } from '../src/simulation/project';

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
});

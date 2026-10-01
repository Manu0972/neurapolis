/**
 * Tests M3 — vie & progression : gates de compétences (seuils du contrat),
 * XP et niveaux 0-3, apprentissage des notions en 4 étapes (3 applications =
 * maîtrise + caractéristique), relations 4D modifiées par les événements,
 * journal des causes complet (facteur / seuil / poids sur chaque événement).
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { runTicks } from '../src/simulation/engine';
import { performGatedAction } from '../src/simulation/actions';
import { addXp, skillLevel, skillProgress, totalXpForLevel } from '../src/simulation/skills';
import { applyNotion, discoverNotion, explainNotion, notionTick } from '../src/simulation/notions';
import { applyRelation, bestFriendId } from '../src/simulation/relations';
import { replyDialogue } from '../src/simulation/dialogue';
import { applyPlaceAction } from '../src/simulation/places';
import { GATED_ACTION_BY_ID, GATED_ACTIONS } from '../src/data/actions';
import { NOTION_BY_ID } from '../src/data/notions';
import type { GameEvent, SkillId, WorldState } from '../src/core/types';

// ---------- Gates de compétences (contrat M3 §3) ----------

describe('gates — les actions exigent le bon niveau de compétence', () => {
  it('proposer un partage : refusé sans négociation, permis au niveau 1', () => {
    const w = createWorld();
    expect(skillLevel(w, 'negociation')).toBe(0);
    const refuse = performGatedAction(w, 'partager');
    expect(refuse.ok).toBe(false);
    expect(w.player.skills['negociation']?.xp).toBe(0); // rien n'a bougé
    w.player.skills['negociation']!.level = 1;
    expect(performGatedAction(w, 'partager', 'noah').ok).toBe(true);
  });

  it('arbitrer un conflit : refusé au niveau 1, permis au niveau 2', () => {
    const w = createWorld();
    w.player.skills['negociation']!.level = 1;
    expect(performGatedAction(w, 'arbitrer').ok).toBe(false);
    w.player.skills['negociation']!.level = 2;
    expect(performGatedAction(w, 'arbitrer').ok).toBe(true);
  });

  it('les huit seuils du contrat sont exactement ceux des données', () => {
    const attendus: Record<string, [SkillId, number]> = {
      partager: ['negociation', 1],
      arbitrer: ['negociation', 2],
      comptes: ['comptabilite', 1],
      prevision: ['comptabilite', 2],
      recruter: ['communication', 2],
      multitache: ['organisation', 1],
      reparer: ['technique', 1],
      autodidacte: ['recherche', 2],
    };
    expect(GATED_ACTIONS.map((a) => a.id).sort()).toEqual(Object.keys(attendus).sort());
    for (const [id, [skill, niveau]] of Object.entries(attendus)) {
      expect(GATED_ACTION_BY_ID[id]?.skill).toBe(skill);
      expect(GATED_ACTION_BY_ID[id]?.minLevel).toBe(niveau);
    }
  });

  it('une pratique réussie donne de l’XP, émet un événement à causes et avance les compteurs', () => {
    const w = createWorld();
    w.player.skills['negociation']!.level = 1;
    const before = w.player.skills['negociation']?.xp ?? 0;
    const r = performGatedAction(w, 'partager', 'noah');
    expect(r.ok).toBe(true);
    expect(w.player.skills['negociation']?.xp).toBe(before + 2);
    expect(w.flags['partages']).toBe(1);
    const evt = w.events.find((e) => e.id === r.eventId);
    expect(evt).toBeDefined();
    expect(evt?.causes.length).toBeGreaterThan(0);
  });
});

// ---------- XP et niveaux ----------

describe('compétences — XP par pratique, niveaux 0-3', () => {
  it('3 / 9 / 18 XP cumulés font passer aux niveaux 1 / 2 / 3', () => {
    const w = createWorld();
    addXp(w, 'negociation', 3);
    expect(skillLevel(w, 'negociation')).toBe(1);
    addXp(w, 'negociation', 6);
    expect(skillLevel(w, 'negociation')).toBe(2);
    addXp(w, 'negociation', 9);
    expect(skillLevel(w, 'negociation')).toBe(3);
    expect(totalXpForLevel(1)).toBe(3);
    expect(totalXpForLevel(2)).toBe(9);
    expect(totalXpForLevel(3)).toBe(18);
  });

  it('le niveau est plafonné à 3 et l’XP n’augmente plus', () => {
    const w = createWorld();
    addXp(w, 'negociation', 100);
    expect(skillLevel(w, 'negociation')).toBe(3);
    const xp = w.player.skills['negociation']?.xp ?? 0;
    addXp(w, 'negociation', 5);
    expect(w.player.skills['negociation']?.xp).toBe(xp);
    expect(skillProgress(w, 'negociation').needed).toBeNull();
  });

  it('dialogues et actions de lieu font pratiquer des compétences', () => {
    const w = createWorld();
    replyDialogue(w, 'noah', 'taquin');
    expect(w.player.skills['negociation']?.xp).toBe(1);
    applyPlaceAction(w, 'friche', 'explorer');
    expect(w.player.skills['technique']?.xp).toBe(1);
    applyPlaceAction(w, 'epicerie', 'gouter');
    expect(w.player.skills['comptabilite']?.xp).toBe(1);
  });

  it('la faim >70 divise l’XP d’apprentissage par deux (§5)', () => {
    const w = createWorld();
    w.player.needs.faim = 80;
    addXp(w, 'negociation', 2);
    expect(w.player.skills['negociation']?.xp).toBe(1);
  });

  it('un passage de niveau émet un événement porteur de causes', () => {
    const w = createWorld();
    addXp(w, 'negociation', 3);
    const evt = w.events[0];
    expect(evt?.title).toContain('Négociation niveau 1');
    expect(evt?.causes[0]).toMatchObject({ facteur: expect.stringContaining('Négociation'), seuil: '3 XP', poids: 2 });
  });
});

// ---------- Notions — 4 étapes ----------

describe('notions — découverte, explication, 3 applications, maîtrise', () => {
  it('3 applications réussies mènent à la maîtrise et augmentent la caractéristique associée', () => {
    const w = createWorld();
    const def = NOTION_BY_ID['egalite_equite_incitation'];
    if (!def) throw new Error('notion absente');
    const avant = w.player.characteristics[def.characteristic];

    expect(discoverNotion(w, def.id).ok).toBe(true);
    const decouverte = w.events[0];
    expect(decouverte?.type).toBe('decouverte');
    expect(decouverte?.causes.length).toBeGreaterThan(0);
    expect(w.player.notions[def.id]?.stage).toBe(1);

    expect(explainNotion(w, def.id, 'cours').ok).toBe(true);
    expect(w.player.notions[def.id]?.stage).toBe(2);

    expect(applyNotion(w, def.id).ok).toBe(true);
    expect(w.player.notions[def.id]?.stage).toBe(3);
    expect(applyNotion(w, def.id).ok).toBe(true);
    expect(w.player.notions[def.id]?.applications).toBe(2);
    expect(applyNotion(w, def.id).ok).toBe(true);

    expect(w.player.notions[def.id]?.stage).toBe(4);
    expect(w.player.characteristics[def.characteristic]).toBe(avant + def.gain);
    const maitrise = w.events[0];
    expect(maitrise?.type).toBe('consequence');
    expect(maitrise?.causes).toContainEqual({ facteur: 'applications réussies', seuil: '3', poids: 3 });
  });

  it('les applications ratées ne comptent pas ; pas de maîtrise avant 3 réussies', () => {
    const w = createWorld();
    discoverNotion(w, 'cout_opportunite');
    explainNotion(w, 'cout_opportunite', 'livre');
    applyNotion(w, 'cout_opportunite', false);
    applyNotion(w, 'cout_opportunite');
    applyNotion(w, 'cout_opportunite');
    expect(w.player.notions['cout_opportunite']?.stage).toBe(3);
    expect(w.player.notions['cout_opportunite']?.applications).toBe(2);
  });

  it('la maîtrise ne s’applique qu’une seule fois', () => {
    const w = createWorld();
    discoverNotion(w, 'prix_rarete');
    explainNotion(w, 'prix_rarete', 'fantome');
    applyNotion(w, 'prix_rarete');
    applyNotion(w, 'prix_rarete');
    applyNotion(w, 'prix_rarete');
    const comprehension = w.player.characteristics.comprehension;
    expect(applyNotion(w, 'prix_rarete').ok).toBe(false);
    expect(w.player.characteristics.comprehension).toBe(comprehension);
  });

  it('la découverte est déclenchée par les compteurs vécus, une seule fois', () => {
    const w = createWorld();
    w.flags['partages'] = 1;
    notionTick(w);
    expect(w.player.notions['egalite_equite_incitation']?.stage).toBe(1);
    notionTick(w);
    expect(w.events.filter((e) => e.title === 'Découverte — Égalité, équité, incitation')).toHaveLength(1);
  });

  it('boucle complète : dialogue → négociation 1 → partage → découverte → explication → 3 partages → maîtrise', () => {
    const w = createWorld();
    replyDialogue(w, 'noah', 'taquin');
    replyDialogue(w, 'noah', 'taquin');
    replyDialogue(w, 'noah', 'taquin');
    expect(skillLevel(w, 'negociation')).toBe(1);

    expect(performGatedAction(w, 'partager', 'noah').ok).toBe(true);
    notionTick(w);
    expect(w.player.notions['egalite_equite_incitation']?.stage).toBe(1);
    explainNotion(w, 'egalite_equite_incitation', 'cours');

    const influence0 = w.player.characteristics.influence;
    performGatedAction(w, 'partager', 'noah');
    performGatedAction(w, 'partager', 'noah');
    performGatedAction(w, 'partager', 'noah');
    expect(w.player.notions['egalite_equite_incitation']?.stage).toBe(4);
    expect(w.player.characteristics.influence).toBe(influence0 + 3);
  });
});

// ---------- Relations 4D modifiées par les événements ----------

describe('relations 4D — modifiées par les événements', () => {
  it('fatigue >70 : événement unique qui coûte de l’amitié au meilleur ami', () => {
    const w = createWorld();
    w.player.needs.fatigue = 75;
    runTicks(w, 1);
    const evt = w.events.find((e) => e.title === 'À bout de nerfs');
    expect(evt).toBeDefined();
    expect(evt?.causes).toEqual([{ facteur: 'fatigue', seuil: '70', poids: 3 }]);
    expect(bestFriendId(w)).toBe('noah');
    expect(w.player.relations['noah']?.amitie).toBe(77);
    const avant = w.events.length;
    runTicks(w, 3);
    expect(w.events.length).toBe(avant); // une seule fois
  });

  it('proposer un partage augmente la confiance, portée par un événement à causes', () => {
    const w = createWorld();
    w.player.skills['negociation']!.level = 1;
    const avant = w.player.relations['noah']?.confiance ?? 0;
    const r = performGatedAction(w, 'partager', 'noah');
    expect(r.ok).toBe(true);
    expect(w.player.relations['noah']?.confiance).toBe(avant + 1);
    expect(w.events.find((e) => e.id === r.eventId)?.causes.length).toBeGreaterThan(0);
  });

  it('applyRelation reste borné 0-100 sur les quatre dimensions', () => {
    const w = createWorld();
    applyRelation(w, 'lina', { amitie: -1000, rivalite: 1000, confiance: 50, respect: -5 });
    expect(w.player.relations['lina']).toEqual({ amitie: 0, confiance: 100, respect: 45, rivalite: 100 });
  });
});

// ---------- Journal des causes — complet ----------

describe('journal des causes — chaque événement porte facteurs, seuils et poids', () => {
  function verifieCauses(evt: GameEvent): void {
    expect(evt.causes.length).toBeGreaterThan(0);
    for (const c of evt.causes) {
      expect(c.facteur.length).toBeGreaterThan(0);
      expect(c.poids).toBeGreaterThanOrEqual(1);
      expect(c.poids).toBeLessThanOrEqual(3);
      if (c.seuil !== undefined) expect(c.seuil.length).toBeGreaterThan(0);
    }
    expect(evt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(evt.day).toBeGreaterThanOrEqual(0);
  }

  function scenario(): WorldState {
    const w = createWorld({ seed: 7 });
    replyDialogue(w, 'noah', 'taquin');
    replyDialogue(w, 'noah', 'taquin');
    replyDialogue(w, 'noah', 'taquin');          // niveau 1 négociation (événement)
    performGatedAction(w, 'partager', 'noah');   // événement vie + confiance
    notionTick(w);                               // découvertes de notions
    explainNotion(w, 'egalite_equite_incitation', 'fantome');
    performGatedAction(w, 'partager', 'noah');   // application 1
    performGatedAction(w, 'partager', 'noah');   // application 2
    performGatedAction(w, 'partager', 'noah');   // application 3 → maîtrise
    w.player.needs.fatigue = 75;
    runTicks(w, 1);                              // événement fatigue → amitié −1
    return w;
  }

  it('tous les événements d’un scénario vécu ont des causes complètes', () => {
    const w = scenario();
    expect(w.events.length).toBeGreaterThanOrEqual(8);
    for (const evt of w.events) verifieCauses(evt);
  });

  it('le journal de vie raconte découvertes, explications, maîtrises et niveaux', () => {
    const w = scenario();
    const titres = w.lifeJournal.map((e) => e.title).join(' | ');
    expect(titres).toContain('J’ai découvert');
    expect(titres).toContain('J’ai compris');
    expect(titres).toContain('Je maîtrise');
    expect(titres).toContain('Négociation : niveau 1');
  });

  it('même seed + même scénario ⇒ journal des causes identique', () => {
    const a = scenario().events;
    const b = scenario().events;
    expect(a).toEqual(b);
  });
});

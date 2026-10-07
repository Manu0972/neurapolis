/**
 * Récit : scène d'origine à la nouvelle partie, cahiers de Lucien selon la progression,
 * un par jour, textes adaptés au prénom et au genre, sauvegarde v22.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { ensureAscension } from '../src/simulation/ascension';
import { ensureStory, finishOrigin, personalize } from '../src/simulation/story';
import { ORIGIN } from '../src/data/story_registry';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

describe('récit', () => {
  it('une nouvelle partie commence par la nuit de la Maison du Peuple', () => {
    const w = createWorld();
    expect(ensureStory(w).originDone).toBe(false);
    finishOrigin(w);
    expect(ensureStory(w).originDone).toBe(true);
    expect(ORIGIN.pages.length).toBeGreaterThanOrEqual(4);
  });

  it('les cahiers arrivent avec la progression, un par jour au plus', () => {
    const w = createWorld();
    runTicks(w, TICKS_PER_DAY);
    expect(Object.keys(ensureStory(w).seen)).toHaveLength(0);
    const a = ensureAscension(w);
    for (const c of ['marge', 'main_invisible', 'plus_value']) a.concepts[c] = 0;
    a.tier = 2;
    const out = runTicks(w, TICKS_PER_DAY);
    expect(Object.keys(ensureStory(w).seen)).toHaveLength(1);
    expect(ensureStory(w).unread).toHaveLength(1);
    expect(out.some((n) => n.text.startsWith('📖'))).toBe(true);
    // Jamais plus d'un cahier par jour, quel que soit le nombre de cahiers prêts.
    runTicks(w, 2 * TICKS_PER_DAY);
    const n = Object.keys(ensureStory(w).seen).length;
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(3);
  });

  it('les textes s’accordent au prénom et au genre du joueur', () => {
    const w = createWorld({ playerName: 'Inès' });
    w.player.firstName = 'Inès';
    w.player.gender = 'fille';
    expect(personalize(w, '{prenom} se relève. Mon garçon, petit-fils de Lucien.')).toBe('Inès se relève. Mon enfant, petite-fille de Lucien.');
    expect(personalize(w, 'Le jeune garçon grimpe.')).toBe('Inès grimpe.');
    w.player.gender = 'garcon';
    expect(personalize(w, 'Mon garçon')).toBe('Mon garçon');
  });
});

describe('sauvegarde v22', () => {
  it('une partie déjà commencée (v21) ne rejoue pas l’origine ; aller-retour fidèle', () => {
    const w = createWorld();
    const raw = JSON.parse(exportSave(w)) as Record<string, unknown>;
    raw.version = 21;
    delete raw.story;
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.story!.originDone).toBe(true);
    expect(importSave(exportSave(w)).story).toEqual(w.story);
  });
});

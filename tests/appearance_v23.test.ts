/**
 * Personnalisation approfondie (save v23) : nouveaux champs validés, tenues liées au palier,
 * migration d'une apparence v22, aller-retour fidèle.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { DEFAULT_PLAYER_APPEARANCE } from '../src/core/types';
import { outfitAllowed, validateAppearance } from '../src/core/player_customization';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

describe('personnalisation approfondie', () => {
  it('accepte une apparence complète et refuse les valeurs inventées', () => {
    const ok = validateAppearance({ ...DEFAULT_PLAYER_APPEARANCE, skinTone: 'olive', hairStyle: 'locks', body: 'ronde', heightAdj: 2, eyes: 'amande', eyeColor: 'vert', glasses: 'ecaille', freckles: true, beard: 'aucune', accessory: 'ecouteurs' });
    expect(ok.valid).toBe(true);
    const bad = validateAppearance({ ...DEFAULT_PLAYER_APPEARANCE, body: 'geant', heightAdj: 7, glasses: 'monocle' });
    expect(bad.valid).toBe(false);
    expect(bad.appearance.body).toBe('moyenne');
    expect(bad.appearance.heightAdj).toBe(0);
    expect(bad.appearance.glasses).toBe('aucune');
  });

  it('les tenues de dirigeant·e se gagnent avec les paliers', () => {
    expect(outfitAllowed('ecolier', 1)).toBe(true);
    expect(outfitAllowed('entrepreneur', 2)).toBe(false);
    expect(outfitAllowed('entrepreneur', 3)).toBe(true);
    expect(outfitAllowed('magnat', 5)).toBe(false);
  });

  it('une sauvegarde v22 reçoit les valeurs par défaut ; aller-retour fidèle', () => {
    const w = createWorld();
    const raw = JSON.parse(exportSave(w)) as { version: number; player: { appearance: Record<string, unknown> } };
    raw.version = 22;
    raw.player.appearance = { skinTone: 'ebene', hairColor: 'noir', hairStyle: 'tresse', outfitStyle: 'citoyen', outfitColor: 'indigo' };
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.player.appearance.skinTone).toBe('ebene');
    expect(m.player.appearance.body).toBe('moyenne');
    expect(m.player.appearance.accessory).toBe('aucun');
    w.player.appearance = { ...w.player.appearance, hairStyle: 'afro', glasses: 'rondes', freckles: true };
    expect(importSave(exportSave(w)).player.appearance).toEqual(w.player.appearance);
  });
});

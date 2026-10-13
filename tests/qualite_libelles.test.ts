import { describe, expect, it } from 'vitest';
import { dateOf } from '../src/core/clock';
import { INITIAL_RIVALS } from '../src/data/rivals';
import { RIVAL_STRATEGY_LABELS, euros, frenchDateLabel } from '../src/presentation/labels';
import { newerManualSlot, slotNumber } from '../src/presentation/save-choice';
import { mapFrame } from '../src/presentation/minimap';
import { CITY_AREAS } from '../src/data/city/layout';
import { MAP_H, MAP_W } from '../src/data/map';

describe('libellés français de l’interface (qualité de jeu)', () => {
  it('la date du HUD garde les mois en minuscules et écrit « 1er »', () => {
    expect(frenchDateLabel(dateOf(0).label)).toBe('Mardi 1er septembre 2020');
    expect(frenchDateLabel(dateOf(1).label)).toBe('Mercredi 2 septembre 2020');
    // « 1 » ailleurs que le jour (année, 11, 21…) reste intact.
    expect(frenchDateLabel('samedi 11 septembre 2021')).toBe('Samedi 11 septembre 2021');
  });

  it('les montants s’écrivent avec une virgule', () => {
    expect(euros(28.5)).toBe('28,50 €');
    expect(euros(0)).toBe('0,00 €');
  });

  it('chaque stratégie de rival a un libellé lisible', () => {
    for (const r of Object.values(INITIAL_RIVALS)) {
      const label = RIVAL_STRATEGY_LABELS[r.strategy];
      expect(label, r.id).toBeTruthy();
      expect(label).not.toContain('_');
    }
  });
});

describe('écran d’accueil : sauvegarde manuelle plus récente', () => {
  const slot = (s: string, tick?: number, extra: Partial<{ exists: boolean; error: string }> = {}) =>
    ({ slot: s, exists: true, tick, ...extra });

  it('propose l’emplacement manuel le plus avancé quand il dépasse l’auto-sauvegarde', () => {
    const r = newerManualSlot(4176, [slot('slot1', 4303), slot('slot2', 4200), slot('slot3', 100)]);
    expect(r?.slot).toBe('slot1');
    expect(slotNumber(r!.slot)).toBe('1');
  });

  it('ne propose rien si l’auto-sauvegarde est à jour', () => {
    expect(newerManualSlot(4303, [slot('1', 4303), slot('2', 10)])).toBeNull();
  });

  it('ignore les emplacements vides ou illisibles', () => {
    expect(newerManualSlot(0, [slot('1', undefined, { exists: false }), slot('2', 99, { error: 'sauvegarde illisible' })])).toBeNull();
  });

  it('sans auto-sauvegarde, la plus récente des sauvegardes manuelles est proposée', () => {
    expect(newerManualSlot(undefined, [slot('2', 50), slot('3', 70)])?.slot).toBe('3');
  });
});

describe('grand plan de la ville : cadré sur les quartiers ouverts', () => {
  it('au palier 1, le cadre se limite au centre (plus une marge)', () => {
    const centre = CITY_AREAS.find((a) => a.id === 'centre')!;
    const f = mapFrame([centre], { x: 40, z: 95 }, MAP_W, MAP_H);
    expect(f.x).toBe(0);
    expect(f.y).toBe(0);
    expect(f.w).toBeLessThanOrEqual(centre.w + 12);
    expect(f.h).toBeLessThanOrEqual(centre.h + 12);
  });

  it('le joueur reste toujours dans le cadre', () => {
    const centre = CITY_AREAS.find((a) => a.id === 'centre')!;
    const f = mapFrame([centre], { x: 500, z: 300 }, MAP_W, MAP_H);
    expect(f.x + f.w).toBeGreaterThan(500);
    expect(f.y + f.h).toBeGreaterThan(300);
  });

  it('sans quartier ouvert, toute la ville', () => {
    expect(mapFrame([], { x: 0, z: 0 }, MAP_W, MAP_H)).toEqual({ x: 0, y: 0, w: MAP_W, h: MAP_H });
  });
});

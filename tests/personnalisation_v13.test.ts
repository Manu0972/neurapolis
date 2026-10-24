/**
 * V13 — personnalisation complète : zones de recolorage (haut, bas, chaussures), mesure du corps
 * et attaches d'accessoires, accessoires multiples, sérialisation (save v26) et aléatoire déterministe.
 */
import { describe, expect, it } from 'vitest';
import { FEET_TOP, recolorKey, regionOf, zoneOf } from '../src/presentation/city3d/rigged/recolorLogic';
import { fitBody, placeGear, quatFromX, sampleBody, type Vec3 } from '../src/presentation/city3d/rigged/gearLogic';
import { silhouetteChoices } from '../src/presentation/city3d/rigged/playerModel';
import {
  createCustomWorld, gearColorHex, randomAppearance, toggleGear, validateAppearance, wornGear, chosenModel,
} from '../src/core/player_customization';
import { DEFAULT_PLAYER_APPEARANCE, VALID_GEAR, type PlayerAppearance } from '../src/core/types';
import { migrateSave, CURRENT_SAVE_VERSION } from '../src/saves/migrations';
import { exportSave as serializeWorld, importSave as deserializeWorld } from '../src/saves/persist';

describe('zones de recolorage', () => {
  it('le corps se découpe en tête, torse, jambes et pieds', () => {
    expect(zoneOf(0.97, 0.05)).toBe('cheveux');
    expect(zoneOf(0.9, 0.05)).toBe('visage');
    expect(zoneOf(0.7, 0)).toBe('torse');
    expect(zoneOf(0.3, 0)).toBe('jambes');
    expect(zoneOf(FEET_TOP + 0.001, 0)).toBe('jambes');
    expect(zoneOf(0.03, 0)).toBe('pieds');
  });
  it('chaque zone donne sa région, la peau reste de la peau partout', () => {
    const skin: [number, number, number] = [0.8, 0.6, 0.5];
    const jean: [number, number, number] = [0.15, 0.2, 0.45];
    expect(regionOf('torse', jean, skin)).toBe('outfit');
    expect(regionOf('jambes', jean, skin)).toBe('bottom');
    expect(regionOf('pieds', jean, skin)).toBe('shoes');
    expect(regionOf('jambes', [0.79, 0.61, 0.5], skin)).toBe('skin');
    expect(regionOf('pieds', [0.79, 0.61, 0.5], skin)).toBe('skin');
    expect(regionOf('fond', jean, skin)).toBeNull();
  });
  it('la clé de recolorage distingue bas et chaussures', () => {
    expect(recolorKey({ outfit: '#111111' })).not.toBe(recolorKey({ outfit: '#111111', bottom: '#222222' }));
    expect(recolorKey({ shoes: '#333333' })).not.toBe(recolorKey({ bottom: '#333333' }));
  });
});

/** Petit « mannequin » synthétique : une tête (os 0), un torse (os 1), un avant-bras gauche (os 2). */
function mannequin(): ReturnType<typeof sampleBody> {
  const pos: number[] = [];
  const idx: number[] = [];
  const wt: number[] = [];
  const add = (x: number, y: number, z: number, bone: number): void => { pos.push(x, y, z); idx.push(bone, 0, 0, 0); wt.push(1, 0, 0, 0); };
  for (const x of [-0.12, 0.12]) for (const y of [1.35, 1.65]) for (const z of [-0.15, 0.1]) add(x, y, z, 0);
  for (const x of [-0.1, 0.1]) for (const y of [1.0, 1.3]) for (const z of [-0.08, 0.1]) add(x, y, z, 1);
  for (const x of [0.45, 0.65]) for (const y of [1.1, 1.17]) for (const z of [0.0, 0.07]) add(x, y, z, 2);
  add(0, 0, 0, 1); // pieds au sol
  const names = ['Head', 'spine_03', 'lowerarm_l', 'hand_l', 'neck_01', 'pelvis'];
  const bones: Vec3[] = [[0, 1.38, 0], [0, 1.14, 0], [0.43, 1.15, 0.04], [0.67, 1.15, 0.04], [0, 1.29, 0], [0, 0.82, 0]];
  return sampleBody(pos, idx, wt, names, bones);
}

describe('mesure du corps et attaches d’accessoires', () => {
  it('mesure les boîtes par os dominant et la hauteur', () => {
    const s = mannequin();
    expect(s.minY).toBe(0);
    expect(s.maxY).toBeCloseTo(1.65);
    expect(s.boxes.Head!.min).toEqual([-0.12, 1.35, -0.15]);
    expect(s.boxes.lowerarm_l!.max[0]).toBeCloseTo(0.65);
    expect(s.bones.hand_l).toEqual([0.67, 1.15, 0.04]);
  });
  it('les couvre-chefs coiffent la tête, les lunettes sont devant les yeux', () => {
    const f = fitBody(mannequin());
    const [cap] = placeGear('casquette', f);
    expect(cap!.bone).toBe('Head');
    expect(cap!.pos[1]).toBeGreaterThan(1.35);
    expect(cap!.pos[1] + cap!.scale[1]).toBeGreaterThanOrEqual(1.65);
    expect(cap!.scale[0]).toBeGreaterThan(0.12); // plus large que la tête
    const glasses = placeGear('lunettes', f);
    expect(glasses).toHaveLength(1);
    expect(glasses[0]!.pos[2]).toBeGreaterThan(0.08);
    expect(glasses[0]!.pos[1]).toBeGreaterThan(1.4);
    expect(glasses[0]!.pos[1]).toBeLessThan(1.55);
    expect(placeGear('lunettes', f, { sunglasses: true }).map((p) => p.piece)).toEqual(['lunettes', 'verres']);
  });
  it('sac au dos, écharpe au cou, montre au poignet gauche', () => {
    const f = fitBody(mannequin());
    const [bag, straps] = placeGear('sac_dos', f);
    expect(bag!.bone).toBe('spine_03');
    expect(bag!.pos[2]).toBeLessThan(-0.08); // derrière le dos
    expect(straps!.pos[2]).toBeGreaterThan(0.1); // bretelles devant la poitrine
    const [scarf] = placeGear('echarpe', f);
    expect(scarf!.bone).toBe('neck_01');
    expect(scarf!.pos[1]).toBeGreaterThan(1.25);
    expect(scarf!.pos[1]).toBeLessThan(1.4);
    const [watch] = placeGear('montre', f);
    expect(watch!.bone).toBe('lowerarm_l');
    expect(watch!.pos[0]).toBeGreaterThan(0.5);
    expect(watch!.pos[0]).toBeLessThan(0.67); // avant la main
    expect(watch!.scale[0]).toBeGreaterThan(0.02);
  });
  it('replis sur les proportions quand un os ou une boîte manque', () => {
    const f = fitBody({ minY: 0, maxY: 1.65, bones: {}, boxes: {} });
    for (const k of [...VALID_GEAR, 'lunettes' as const]) {
      for (const p of placeGear(k, f)) {
        expect(p.pos.every(Number.isFinite)).toBe(true);
        expect(p.scale.every((v) => v > 0)).toBe(true);
      }
    }
  });
  it('quatFromX oriente +X vers la direction demandée', () => {
    const q = quatFromX([0, 1, 0]);
    // Rotation de +90° autour de Z : (0, 0, sin45, cos45).
    expect(q[2]).toBeCloseTo(Math.SQRT1_2);
    expect(q[3]).toBeCloseTo(Math.SQRT1_2);
    expect(quatFromX([1, 0, 0])).toEqual([0, -0, 0, 1]);
  });
});

describe('accessoires multiples', () => {
  const base: PlayerAppearance = { ...DEFAULT_PLAYER_APPEARANCE };
  it('reprend l’ancien accessoire unique', () => {
    expect(wornGear({ accessory: 'montre' })).toEqual(['montre']);
    expect(wornGear({ accessory: 'aucun' })).toEqual([]);
    expect(wornGear({ gear: [], accessory: 'montre' })).toEqual([]);
  });
  it('plusieurs à la fois, casquette et bonnet s’excluent', () => {
    let a = toggleGear(base, 'casquette');
    a = toggleGear(a, 'sac_dos');
    a = toggleGear(a, 'montre');
    expect(wornGear(a)).toEqual(['casquette', 'sac_dos', 'montre']);
    a = toggleGear(a, 'bonnet');
    expect(wornGear(a)).toEqual(['sac_dos', 'montre', 'bonnet']);
    a = toggleGear(a, 'montre');
    expect(wornGear(a)).toEqual(['sac_dos', 'bonnet']);
    expect(a.accessory).toBe('sac_dos');
  });
  it('couleurs : choisie ou par défaut', () => {
    expect(gearColorHex({ gearColors: { echarpe: 'bordeaux' } }, 'echarpe')).toBe('#7a2436');
    expect(gearColorHex({}, 'lunettes')).toBe('#24222a');
  });
});

describe('sérialisation de l’apparence (save v26)', () => {
  const full: PlayerAppearance = {
    ...DEFAULT_PLAYER_APPEARANCE, model: 'L050_ado', bottomColor: 'noir', shoesColor: 'blanc',
    gear: ['bonnet', 'echarpe', 'montre'], gearColors: { bonnet: 'vert', echarpe: 'moutarde', lunettes: 'bordeaux' }, glasses: 'rondes',
  };
  it('la validation garde les nouveaux champs valides et signale les autres', () => {
    const ok = validateAppearance(full);
    expect(ok.valid).toBe(true);
    expect(ok.appearance).toMatchObject({ model: 'L050_ado', bottomColor: 'noir', shoesColor: 'blanc', gear: ['bonnet', 'echarpe', 'montre'] });
    const bad = validateAppearance({ ...full, bottomColor: 'fuchsia', model: '../x', gear: ['casquette', 'bonnet', 'cape'] });
    expect(bad.valid).toBe(false);
    expect(bad.appearance.bottomColor).toBeUndefined();
    expect(bad.appearance.model).toBeUndefined();
    expect(bad.appearance.gear).toEqual(['casquette']);
    expect(chosenModel({ model: 'dessin' })).toBeNull();
    expect(chosenModel({})).toBeUndefined();
  });
  it('aller-retour : création, sauvegarde, rechargement', () => {
    const w = createCustomWorld({ seed: 7, customization: { appearance: full } });
    expect(w.version).toBe(26);
    const back = deserializeWorld(serializeWorld(w));
    expect(back.player.appearance).toEqual(w.player.appearance);
    expect(back.player.appearance.gear).toEqual(['bonnet', 'echarpe', 'montre']);
  });
  it('migration 25 → 26 : l’accessoire unique devient la liste', () => {
    const w = createCustomWorld({ seed: 3 });
    const old = JSON.parse(JSON.stringify(w));
    old.version = 25;
    old.player.appearance = { ...DEFAULT_PLAYER_APPEARANCE, accessory: 'casquette' };
    delete old.player.appearance.gear;
    const m = migrateSave(old);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.player.appearance.gear).toEqual(['casquette']);
    expect(m.player.appearance.gearColors).toEqual({});
    expect(m.player.appearance.model).toBeUndefined();
    // Aller-retour de la partie migrée.
    expect(deserializeWorld(serializeWorld(m)).player.appearance).toEqual(m.player.appearance);
  });
});

describe('aléatoire déterministe et silhouettes', () => {
  it('même graine → même apparence ; graines différentes → apparences variées', () => {
    const ids = ['L002_ado', 'L050_ado', 'L088_ado'];
    expect(randomAppearance(5, 12, 1, ids)).toEqual(randomAppearance(5, 12, 1, ids));
    const set = new Set(Array.from({ length: 12 }, (_, i) => JSON.stringify(randomAppearance(i + 1, 12, 1, ids))));
    expect(set.size).toBe(12);
    for (let i = 1; i < 40; i++) {
      const a = randomAppearance(i, 12, 1, ids);
      expect(validateAppearance(a).valid).toBe(true);
      expect(ids).toContain(a.model);
      expect(a.beard).toBe('aucune');
      expect(wornGear(a).length).toBeLessThanOrEqual(3);
    }
  });
  it('sans silhouette disponible, pas de modèle tiré', () => {
    expect(randomAppearance(9, 12, 1).model).toBeUndefined();
  });
  it('silhouettes de la tranche d’âge, repli sans jamais prendre un enfant pour un ado', () => {
    const models = [{ id: 'a', ageClass: 'ado' as const }, { id: 'j', ageClass: 'jeune' as const }, { id: 'e', ageClass: 'enfant' as const }];
    expect(silhouetteChoices(models, 12).map((m) => m.id)).toEqual(['a']);
    expect(silhouetteChoices(models.slice(1), 13).map((m) => m.id)).toEqual(['j']);
    expect(silhouetteChoices([{ id: 'e', ageClass: 'enfant' as const }], 12)).toEqual([]);
  });
});

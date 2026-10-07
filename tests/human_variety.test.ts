/**
 * Logique humaine (V1.1) : croissance vers la taille adulte visée, famille cohérente, variété
 * réaliste des habitants, et sauvegarde v25 (taille adulte) avec migration depuis v24.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { createCustomWorld } from '../src/core/player_customization';
import { VALID_SKIN_TONES, type PlayerAppearance } from '../src/core/types';
import { adultHeightOf, familyLooks, generateLook, growthFraction, heightAtAge, playerHeightM, visibleAppearance } from '../src/core/human_variety';
import { validateAppearance } from '../src/core/player_customization';
import { BODY_SHAPE_KEYS } from '../src/core/types';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

const kid = (over: Partial<PlayerAppearance> = {}): PlayerAppearance => ({
  skinTone: 'ebene', hairColor: 'noir', hairStyle: 'afro', outfitStyle: 'ecolier', outfitColor: 'coral', adultHeightCm: 190, ...over,
});

describe('croissance', () => {
  it('la taille choisie est la taille adulte : à 12 ans on n’en a qu’une partie', () => {
    expect(heightAtAge(12, 190, 'garcon')).toBeCloseTo(1.6, 1);
    expect(heightAtAge(18, 190, 'garcon')).toBe(1.9);
    // Les filles ont leur poussée plus tôt.
    expect(growthFraction(12, 'fille')).toBeGreaterThan(growthFraction(12, 'garcon'));
    for (let a = 12; a < 18; a++) expect(growthFraction(a + 1, 'garcon')).toBeGreaterThanOrEqual(growthFraction(a, 'garcon'));
  });

  it('un grand de 12 ans reste un enfant, plus grand que la moyenne de son âge', () => {
    const tall = heightAtAge(12, 195, 'garcon');
    const avg = heightAtAge(12, 176, 'garcon');
    expect(tall).toBeGreaterThan(avg);
    expect(tall).toBeLessThan(1.7);
  });

  it('une nouvelle partie enregistre toujours la taille adulte visée', () => {
    const w = createCustomWorld({ customization: { firstName: 'Ama', lastName: 'Mensah', gender: 'garcon', appearance: kid({ adultHeightCm: 188 }) } });
    expect(w.player.appearance.adultHeightCm).toBe(188);
    expect(playerHeightM(w.player)).toBeCloseTo(1.58, 1);
  });
});

describe('famille cohérente', () => {
  it('les parents encadrent la teinte de peau de l’enfant', () => {
    for (const tone of VALID_SKIN_TONES) {
      const [mere, pere] = familyLooks(kid({ skinTone: tone }), 'fille');
      const i = VALID_SKIN_TONES.indexOf(tone);
      const a = VALID_SKIN_TONES.indexOf(mere!.appearance.skinTone);
      const b = VALID_SKIN_TONES.indexOf(pere!.appearance.skinTone);
      expect(Math.min(a, b)).toBeLessThanOrEqual(i);
      expect(Math.max(a, b)).toBeGreaterThanOrEqual(i);
      expect(Math.abs(a - b)).toBeLessThanOrEqual(6);
    }
  });

  it('un enfant à peau noire et cheveux crépus a des parents plausibles', () => {
    const fam = familyLooks(kid(), 'garcon');
    for (const p of fam) {
      expect(VALID_SKIN_TONES.indexOf(p.appearance.skinTone)).toBeGreaterThanOrEqual(3);
      expect(['noir', 'brun', 'gris', 'chatain']).toContain(p.appearance.hairColor);
    }
  });

  it('la taille visée de l’enfant correspond à la taille cible de ses parents', () => {
    for (const [g, target] of [['garcon', 190], ['fille', 158], ['non-binaire', 172]] as const) {
      const [mere, pere] = familyLooks(kid({ adultHeightCm: target }), g);
      const mid = (mere!.heightM + pere!.heightM) * 50;
      const expected = g === 'garcon' ? target - 6.5 : g === 'fille' ? target + 6.5 : target;
      expect(Math.abs(mid - expected)).toBeLessThanOrEqual(1);
      expect(pere!.appearance.beard).toBeDefined();
    }
  });
});

describe('famille : cheveux plausibles', () => {
  it('un parent à peau très foncée n’hérite pas de cheveux châtains ou blonds', () => {
    for (const hair of ['chatain', 'blond', 'roux'] as const) {
      for (const p of familyLooks(kid({ hairColor: hair, hairStyle: 'court' }), 'garcon')) {
        if (VALID_SKIN_TONES.indexOf(p.appearance.skinTone) >= 6) expect(['noir', 'brun', 'gris']).toContain(p.appearance.hairColor);
      }
    }
  });
});

describe('habitants', () => {
  it('toutes les teintes, cheveux surtout naturels, corpulences variées, barbes seulement chez les hommes adultes', () => {
    const looks = Array.from({ length: 600 }, (_, i) => generateLook(`t${i}`));
    expect(new Set(looks.map((l) => l.appearance.skinTone)).size).toBe(VALID_SKIN_TONES.length);
    expect(new Set(looks.map((l) => l.appearance.body)).size).toBe(4);
    const dyed = looks.filter((l) => ['platine', 'bleu', 'rose', 'vert'].includes(l.appearance.hairColor)).length;
    expect(dyed / looks.length).toBeLessThan(0.12);
    for (const l of looks) if (l.gender !== 'garcon') expect(l.appearance.beard).toBe('aucune');
    const heights = looks.map((l) => l.heightM);
    expect(Math.min(...heights)).toBeLessThan(1.5);
    expect(Math.max(...heights)).toBeGreaterThan(1.85);
  });

  it('même graine, même habitant ; personnage nommé sans genre décrit : jamais de barbe imposée', () => {
    expect(JSON.stringify(generateLook('bertin', { age: 58 }))).toBe(JSON.stringify(generateLook('bertin', { age: 58 })));
    for (let i = 0; i < 50; i++) expect(generateLook(`n${i}`, { age: 40, unknownGender: true }).appearance.beard).toBe('aucune');
  });
});

describe('silhouette adulte', () => {
  it('les adultes ont une silhouette variée, les enfants non', () => {
    const adults = Array.from({ length: 300 }, (_, i) => generateLook(`s${i}`, { age: 35 }));
    for (const k of BODY_SHAPE_KEYS) {
      const vals = adults.map((l) => l.appearance.physique![k]!);
      // Toute l'amplitude : des valeurs basses et hautes pour chaque trait.
      expect(Math.min(...vals)).toBeLessThan(-0.5);
      expect(Math.max(...vals)).toBeGreaterThan(0.5);
    }
    expect(generateLook('enfant', { age: 12 }).appearance.physique).toBeUndefined();
    for (const p of familyLooks(kid(), 'fille')) expect(p.appearance.physique).toBeDefined();
  });

  it('la silhouette du joueur est réglée dès la création mais ne se voit qu’à 18 ans', () => {
    const a = kid({ physique: { fessier: 0.8, muscles: 0.6 } });
    expect(visibleAppearance(a, 12).physique).toBeUndefined();
    expect(visibleAppearance(a, 18).physique).toEqual({ fessier: 0.8, muscles: 0.6 });
    expect(validateAppearance(a).valid).toBe(true);
    expect(validateAppearance({ ...a, physique: { fessier: 3 } }).valid).toBe(false);
  });
});

describe('sauvegarde v25', () => {
  it('une v24 avec l’ancienne échelle de taille migre vers une taille adulte visée', () => {
    const w = createWorld();
    const raw = JSON.parse(JSON.stringify(w));
    raw.version = 24;
    raw.player.gender = 'garcon';
    raw.player.appearance.heightAdj = 2;
    delete raw.player.appearance.adultHeightCm;
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.player.appearance.adultHeightCm).toBe(188);
    // Aller-retour : la taille visée survit à l'enregistrement.
    const back = migrateSave(JSON.parse(JSON.stringify(m)));
    expect(back.player.appearance.adultHeightCm).toBe(188);
    expect(adultHeightOf(back.player.appearance, 'garcon')).toBe(188);
    // La silhouette adulte (champ facultatif de v25) fait aussi l'aller-retour.
    back.player.appearance.physique = { hanches: 0.4, ventre: -0.2 };
    expect(migrateSave(JSON.parse(JSON.stringify(back))).player.appearance.physique).toEqual({ hanches: 0.4, ventre: -0.2 });
  });
});

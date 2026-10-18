import { describe, expect, it } from 'vitest';
import { baseHeightForAge, heightForAge } from '../src/presentation/city3d/bodyScale';
import { LOCO_SPEC, locoBlend, movingAmount, smoothSpeed } from '../src/presentation/city3d/rigged/animState';
import { ageClassOf, modelFor, parseManifest } from '../src/presentation/city3d/rigged/manifest';
import { labelTexel, zoneOf } from '../src/presentation/city3d/rigged/recolorLogic';

describe('taille selon l’âge', () => {
  it('suit la courbe 12 ans 1,50 m → 16 ans 1,68 m, enfant nettement plus petit qu’un adulte', () => {
    expect(heightForAge(12)).toBeCloseTo(1.5, 2);
    expect(heightForAge(16)).toBeCloseTo(1.68, 2);
    expect(heightForAge(8)).toBeLessThan(1.35);
    expect(baseHeightForAge(80)).toBeLessThan(baseHeightForAge(40));
    for (let i = 0; i < 100; i++) expect(heightForAge(40, `p${i}`) - heightForAge(12, `p${i}`)).toBeGreaterThan(0.12);
  });
  it('variation déterministe par graine', () => {
    expect(heightForAge(35, 'bertin')).toBe(heightForAge(35, 'bertin'));
    const s = new Set(Array.from({ length: 50 }, (_, i) => heightForAge(35, `x${i}`)));
    expect(s.size).toBeGreaterThan(10);
  });
});

describe('fondu d’allures sans patinage', () => {
  const footSpeed = (v: number, ls = 1): number => {
    const b = locoBlend(v, ls);
    // vitesse du pied d'appui = foulée fondue × cadence
    let L = 0;
    for (const k of ['walk', 'jog', 'run'] as const) L += b[k] * LOCO_SPEC[k].v * LOCO_SPEC[k].dur;
    return L * b.cadence * ls;
  };
  it('la vitesse du pied égale la vitesse au sol de la marche à la course', () => {
    for (const v of [0.5, 1, 1.6, 3, 4.5, 6.2, 8]) expect(Math.abs(footSpeed(v) - v) / v).toBeLessThan(0.02);
  });
  it('un petit gabarit a la même propriété, avec une cadence plus haute', () => {
    expect(Math.abs(footSpeed(3, 0.8) - 3)).toBeLessThan(0.06);
    expect(locoBlend(3, 0.8).cadence).toBeGreaterThan(locoBlend(3, 1).cadence);
  });
  it('poids normalisés et arrêt net', () => {
    const b = locoBlend(3);
    expect(b.walk + b.jog + b.run).toBeCloseTo(1, 5);
    expect(movingAmount(0)).toBe(0);
    expect(movingAmount(2)).toBe(1);
    expect(smoothSpeed(3, 0, 0.2)).toBeLessThan(0.1);
    expect(smoothSpeed(0, 3, 0.05)).toBeLessThan(3 * 0.5);
  });
});

describe('modèle selon la tranche d’âge', () => {
  const m = parseManifest({ personnages: [{ id: 'a_enfant' }, { id: 'b_ado' }, { id: 'c_jeune' }, { id: 'd_adulte' }, { id: 'e_aine' }] })!;
  it('choisit la bonne tranche, sans jamais mettre un enfant en adulte', () => {
    expect(ageClassOf(8)).toBe('enfant');
    expect(ageClassOf(70)).toBe('aine');
    expect(modelFor(m, { key: 'k1', age: 8 })?.id).toBe('a_enfant');
    expect(modelFor(m, { key: 'k2', age: 70 })?.id).toBe('e_aine');
    expect(modelFor(m, { key: 'k3', age: 22 })?.id).toBe('c_jeune');
    const sans = parseManifest({ personnages: [{ id: 'd_adulte' }] })!;
    expect(modelFor(sans, { key: 'k4', age: 8 })).toBeNull();
  });
  it('un modèle imposé l’emporte (choix du joueur)', () => {
    expect(modelFor(m, { key: 'joueur', role: 'joueur', model: 'b_ado' })?.id).toBe('b_ado');
    expect(modelFor(m, { key: 'joueur', role: 'joueur', model: 'inconnu' })).toBeNull();
  });
});

describe('masque de recolorage', () => {
  it('zones et étiquettes', () => {
    expect(zoneOf(0.97, 0.05)).toBe('cheveux');
    expect(zoneOf(0.9, 0.05)).toBe('visage');
    expect(zoneOf(0.9, -0.02)).toBe('cheveux');
    expect(zoneOf(0.7, 0)).toBe('torse');
    const skin: [number, number, number] = [0.8, 0.6, 0.5];
    expect(labelTexel('torse', [0.1, 0.2, 0.7], skin).outfit).toBe(true);
    expect(labelTexel('torse', [0.78, 0.6, 0.5], skin).skin).toBe(true);
    expect(labelTexel('cheveux', [0.2, 0.1, 0.05], skin).hair).toBe(true);
    expect(labelTexel('reste', [0.1, 0.2, 0.7], skin)).toEqual({ skin: false, hair: false, outfit: false });
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DEFAULT_PLAYER_APPEARANCE } from '../src/core/types';
import { activityFromLabel, animInterval, chooseClip, gaitRate, nextGait, type Gait } from '../src/presentation/city3d/rigged/animState';
import { ageClassOf, baseIdOf, modelFor, parseManifest } from '../src/presentation/city3d/rigged/manifest';
import { resetRiggedLibraryForTests, retargetClip, riggedState, startRiggedCharacters } from '../src/presentation/city3d/rigged/library';
import { createCharacter } from '../src/presentation/city3d/simpleCharacter';

const NPCS = ['noah', 'lina', 'yasmine', 'karim', 'monique', 'samir', 'bertin', 'moreau'];
const STUDIO_INDEX = [{ id: 'bertin_1', glb: '/studio/sorties/personnages/bertin_1/rig.glb', faces: 6000, hauteur: 1.65 }];

describe('personnages riggés — manifeste', () => {
  it('lit le index.json du studio tel quel et ramène le .glb dans public/personnages', () => {
    const m = parseManifest(STUDIO_INDEX, NPCS)!;
    expect(m.models).toHaveLength(1);
    expect(m.models[0]).toMatchObject({ id: 'bertin_1', url: 'personnages/bertin_1/rig.glb', hauteur: 1.65, ageClass: 'adulte', pnj: ['bertin'], auto: false });
    expect(m.repartition).toBe(1);
  });

  it('refuse ce qui n’est pas un manifeste et filtre les entrées dangereuses ou non prêtes', () => {
    expect(parseManifest('<!doctype html>')).toBeNull();
    expect(parseManifest({ foo: 1 })).toBeNull();
    const m = parseManifest([
      { id: '../evil' }, { id: 'a', glb: '../../secret.glb' }, { id: 'b', glb: 'b/rig.glb' }, { id: 'c', etat: 'DOUTEUX' }, { id: 'b' }, 42,
    ])!;
    expect(m.models.map((x) => [x.id, x.url])).toEqual([['a', 'personnages/a/rig.glb'], ['b', 'personnages/b/rig.glb']]);
  });

  it('associe par id : attribution explicite, puis modèle attitré (convention bertin_1 → bertin)', () => {
    const m = parseManifest({
      personnages: [{ id: 'bertin_1' }, { id: 'passant_3' }, { id: 'eleve_2', categorie: 'ado' }],
      attributions: { karim: 'passant_3', samir: null, moreau: 'inconnu' },
    }, NPCS)!;
    expect(modelFor(m, { key: 'bertin', age: 58 })?.id).toBe('bertin_1');
    expect(modelFor(m, { key: 'karim', age: 34 })?.id).toBe('passant_3');
    expect(modelFor(m, { key: 'samir', age: 41 })).toBeNull(); // forcé procédural
    expect(baseIdOf('monique2')).toBe('monique');
  });

  it('répartit de façon déterministe, par tranche d’âge, sans cloner un modèle attitré', () => {
    const m = parseManifest({ personnages: [{ id: 'bertin_1' }, { id: 'passant_1' }, { id: 'passant_2' }, { id: 'eleve_1', age: 13 }] }, NPCS)!;
    const keys = Array.from({ length: 200 }, (_, i) => `habitant:h${i}`);
    const a = keys.map((key) => modelFor(m, { key, age: 40 })?.id);
    const b = keys.map((key) => modelFor(m, { key, age: 40 })?.id);
    expect(a).toEqual(b);
    expect(new Set(a)).toEqual(new Set(['passant_1', 'passant_2']));
    expect(modelFor(m, { key: 'noah', age: 12 })?.id).toBe('eleve_1');
    expect(modelFor(m, { key: 'habitant:x', heightM: 1.55 })?.id).toBe('eleve_1');
    expect(ageClassOf(undefined, 1.72)).toBe('adulte');
    // Proportion : environ 30 % des habitants.
    const part = parseManifest({ personnages: [{ id: 'passant_1' }], repartition: 0.3 })!;
    const n = keys.filter((key) => modelFor(part, { key, age: 40 })).length;
    expect(n).toBeGreaterThan(40);
    expect(n).toBeLessThan(80);
    expect(modelFor(parseManifest({ personnages: [{ id: 'passant_1' }], repartition: 0 }), { key: 'x', age: 40 })).toBeNull();
  });

  it('le joueur ne prend un modèle que si le manifeste le désigne', () => {
    const sans = parseManifest({ personnages: [{ id: 'passant_1' }] })!;
    expect(modelFor(sans, { key: 'joueur', role: 'joueur', age: 12 })).toBeNull();
    const avec = parseManifest({ personnages: [{ id: 'camille_1' }], joueur: 'camille_1' })!;
    expect(modelFor(avec, { key: 'joueur', role: 'joueur' })?.id).toBe('camille_1');
    expect(modelFor(null, { key: 'noah' })).toBeNull();
  });
});

describe('personnages riggés — choix du clip', () => {
  const run = (speeds: number[], start: Gait = 'idle'): Gait[] => {
    let g = start;
    return speeds.map((s) => (g = nextGait(g, s)));
  };

  it('repos, marche, petite course, course selon la vitesse (vitesses du jeu)', () => {
    expect(nextGait('idle', 0)).toBe('idle');
    expect(nextGait('idle', 1.4)).toBe('walk'); // PNJ
    expect(nextGait('idle', 3.0)).toBe('jog'); // joueur qui marche (WALK_SPEED)
    expect(nextGait('idle', 6.2)).toBe('run'); // joueur qui court (RUN_SPEED)
  });

  it('hystérésis : pas de clignotement autour d’un seuil, retour au repos à l’arrêt', () => {
    expect(run([1.8, 1.95, 1.8, 1.7, 1.8])).toEqual(['walk', 'jog', 'jog', 'jog', 'jog']);
    expect(run([1.5], 'jog')).toEqual(['walk']);
    expect(run([7, 3, 0.2, 0.1, 0])).toEqual(['run', 'jog', 'walk', 'idle', 'idle']);
  });

  it('un petit personnage passe plus tôt à la course ; la cadence suit la vitesse', () => {
    expect(nextGait('walk', 1.6, 0.8)).toBe('jog');
    expect(nextGait('walk', 1.6, 1)).toBe('walk');
    expect(gaitRate('walk', 0.9)).toBeCloseTo(1, 5);
    expect(gaitRate('walk', 0.2)).toBe(0.5);
    expect(gaitRate('run', 50)).toBe(2);
    expect(gaitRate('idle', 3)).toBe(1);
  });

  it('assis et parler seulement à l’arrêt ; libellés de routine', () => {
    expect(chooseClip('idle', 'sit')).toBe('sit');
    expect(chooseClip('idle', 'talk')).toBe('talk');
    expect(chooseClip('walk', 'talk')).toBe('walk');
    expect(chooseClip('idle', 'auto')).toBe('idle');
    expect(activityFromLabel('discute avec tout le monde')).toBe('talk');
    expect(activityFromLabel('enseigne')).toBe('talk');
    expect(activityFromLabel('sur le banc des anciens')).toBe('idle');
    expect(activityFromLabel(undefined)).toBe('idle');
  });

  it('niveau de détail : animation à chaque image de près, de plus en plus rare au loin', () => {
    expect(animInterval(5)).toBe(0);
    expect(animInterval(30)).toBeGreaterThan(0);
    expect(animInterval(80)).toBeGreaterThan(animInterval(30));
    expect(animInterval(500)).toBeGreaterThan(animInterval(80));
  });
});

describe('personnages riggés — reciblage et repli', () => {
  afterEach(() => resetRiggedLibraryForTests());

  it('recible le bassin à l’échelle du modèle et ignore le déplacement de la racine', () => {
    const clip = new THREE.AnimationClip('walk', 1, [
      new THREE.QuaternionKeyframeTrack('thigh_l.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0.7071, 0.7071]),
      new THREE.VectorKeyframeTrack('pelvis.position', [0, 1], [0, 0.05, 0.9, 0, 0.05, 0.5]),
      new THREE.VectorKeyframeTrack('root.position', [0, 1], [0, 0, 0, 0, 3, 0]),
      new THREE.VectorKeyframeTrack('thigh_l.scale', [0, 1], [1, 1, 1, 2, 2, 2]),
    ]);
    const out = retargetClip(clip, new THREE.Vector3(0, 0.05, 0.9), new THREE.Vector3(0, -0.04, 0.45));
    expect(out.tracks.map((t) => t.name)).toEqual(['thigh_l.quaternion', 'pelvis.position']);
    const p = Array.from(out.tracks[1]!.values);
    expect(p[0]).toBeCloseTo(0, 5);
    expect(p[1]).toBeCloseTo(-0.04, 5);
    expect(p[2]).toBeCloseTo(0.45, 5); // repos du modèle
    // Descente de 0,4 m mise à l'échelle des jambes (rapport des bassins au repos, ≈ 0,5).
    const k = Math.hypot(0.04, 0.45) / Math.hypot(0.05, 0.9);
    expect(p[5]).toBeCloseTo(0.45 - 0.4 * k, 5);
  });

  it('sans manifeste (404 ou page HTML du serveur de dev), le personnage reste procédural', async () => {
    for (const reply of [{ ok: false, text: async () => '' }, { ok: true, text: async () => '<!doctype html><html></html>' }]) {
      resetRiggedLibraryForTests();
      await startRiggedCharacters(async () => reply);
      expect(riggedState()).toBe('absent');
      const ch = createCharacter({ appearance: DEFAULT_PLAYER_APPEARANCE, heightM: 1.72, rig: { key: 'bertin', age: 58 } });
      const ref = createCharacter({ appearance: DEFAULT_PLAYER_APPEARANCE, heightM: 1.72 });
      expect(ch.root.name).not.toBe('personnage_rigge');
      expect(ch.root.children.length).toBe(ref.root.children.length);
      let skinned = 0;
      ch.root.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned++; });
      expect(skinned).toBe(0);
    }
  });

  it('sans DOM (tests, CI), aucune requête : état absent immédiat', async () => {
    expect(await startRiggedCharacters()).toBeNull();
    expect(riggedState()).toBe('absent');
  });

  it('un PNJ sans modèle prévu reste procédural même avec un manifeste', async () => {
    await startRiggedCharacters(async () => ({ ok: true, text: async () => JSON.stringify(STUDIO_INDEX) }));
    expect(riggedState()).toBe('ready');
    const ch = createCharacter({ appearance: DEFAULT_PLAYER_APPEARANCE, heightM: 1.52, rig: { key: 'noah', age: 12 } });
    expect(ch.root.name).not.toBe('personnage_rigge');
    const player = createCharacter({ appearance: DEFAULT_PLAYER_APPEARANCE, heightM: 1.52, rig: { key: 'joueur', role: 'joueur' } });
    expect(player.root.name).not.toBe('personnage_rigge');
  });
});

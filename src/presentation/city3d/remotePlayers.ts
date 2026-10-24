/**
 * Autres joueurs (multijoueur) et habitants des quartiers vus dans la ville.
 *
 * Un autre joueur est habillé comme il se voit lui-même : même modèle 3D (choix de son créateur,
 * envoyé à sa présentation) et mêmes teintes. Son nom flotte au-dessus de sa tête, avec 💬 quand
 * il est dans une fenêtre ou une cinématique (il ne répond pas tout de suite, son temps est en pause).
 * Sa position arrive déjà lissée par la session (src/net/interp.ts) : on la suit telle quelle,
 * seul le cap est adouci. Les habitants, eux, gardent un léger rattrapage.
 */
import * as THREE from 'three';
import type { PlayerAppearance, PlayerGender } from '../../core/types';
import { wrapAngle } from '../../net/interp';
import { groundHeightAt } from './cityScene';
import { createCharacter, type Character3D } from './simpleCharacter';

/** Autre joueur (multijoueur) ou habitant vu dans la ville. */
export interface RemoteAvatar {
  id: string;
  name: string;
  appearance: PlayerAppearance;
  gender?: PlayerGender;
  heightM: number;
  /** Âge connu : choix du modèle par tranche d'âge (habitants). */
  age?: number;
  /** Modèle 3D choisi par l'autre joueur dans son créateur (ignoré s'il n'existe pas ici). */
  model?: string;
  /** L'autre joueur est dans une fenêtre ou une cinématique. */
  busy?: boolean;
  x: number;
  z: number;
  h: number;
  s: number;
  /** Étiquette : joueur (doré, 🎮) par défaut, ou habitant. */
  label?: { text: string; color: string; bg: string };
}

interface View { ch: Character3D; tag: THREE.Sprite; tagText: string; x: number; z: number; h: number; key: string }

/** Texte de l'étiquette d'un autre joueur. */
export function playerTagText(name: string, busy: boolean): string {
  return `🎮 ${name}${busy ? ' 💬' : ''}`;
}

/**
 * Étiquette lisible au-dessus d'une tête ; sa texture est libérée avec elle. `xray` : visible même
 * derrière un immeuble (autres joueurs : on retrouve son ami dans la ville).
 */
function tagSprite(text: string, color: string, bg: string, xray = false): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 72;
  const ctx = c.getContext('2d')!;
  ctx.font = '700 30px system-ui, sans-serif';
  const w = Math.min(312, ctx.measureText(text).width + 32);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect((320 - w) / 2, 10, w, 52, 16);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 160, 37);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, depthTest: !xray, transparent: true }));
  sp.scale.set(2, 0.45, 1);
  sp.renderOrder = 11;
  return sp;
}

function disposeTag(tag: THREE.Sprite): void {
  tag.removeFromParent();
  tag.material.map?.dispose();
  tag.material.dispose();
}

export class RemotePlayerViews {
  private readonly views = new Map<string, View>();

  constructor(private readonly scene: THREE.Scene) {}

  /** Racines des personnages affichés (ombres de contact). */
  roots(): THREE.Object3D[] {
    return [...this.views.values()].map((v) => v.ch.root);
  }

  sync(list: readonly RemoteAvatar[], dt: number): void {
    const live = new Set<string>();
    for (const r of list) {
      live.add(r.id);
      const key = `${r.id}|${JSON.stringify(r.appearance)}|${r.gender ?? ''}|${r.heightM}|${r.model ?? ''}`;
      let v = this.views.get(r.id);
      if (v && v.key !== key) {
        this.drop(r.id, v);
        v = undefined;
      }
      if (!v) {
        // Habitant : modèle riggé de sa tranche d'âge. Autre joueur : le même modèle et les mêmes
        // teintes que sur son propre écran (CityRenderer habille le joueur local de la même façon).
        const ch = r.label
          ? createCharacter({ appearance: r.appearance, gender: r.gender, heightM: r.heightM, rig: { key: r.id, age: r.age }, rigRecolor: 'tenue' })
          : createCharacter({ appearance: r.appearance, gender: r.gender, heightM: r.heightM, rig: { key: `joueur:${r.id}`, role: 'joueur', age: r.age, model: r.model }, rigRecolor: 'joueur' });
        const tagText = r.label ? r.label.text : playerTagText(r.name, !!r.busy);
        const tag = r.label ? tagSprite(tagText, r.label.color, r.label.bg) : tagSprite(tagText, '#ffe08a', 'rgba(60,36,10,0.88)', true);
        this.scene.add(ch.root, tag);
        v = { ch, tag, tagText, x: r.x, z: r.z, h: r.h, key };
        this.views.set(r.id, v);
      }
      if (!r.label) {
        const text = playerTagText(r.name, !!r.busy);
        if (text !== v.tagText) {
          disposeTag(v.tag);
          v.tag = tagSprite(text, '#ffe08a', 'rgba(60,36,10,0.88)', true);
          v.tagText = text;
          this.scene.add(v.tag);
        }
        v.x = r.x;
        v.z = r.z;
      } else {
        // Habitant : rattrapage doux ; téléportation si l'écart est grand.
        const far = Math.hypot(r.x - v.x, r.z - v.z) > 12;
        const k = far ? 1 : 1 - Math.exp(-dt * 12);
        v.x += (r.x - v.x) * k;
        v.z += (r.z - v.z) * k;
      }
      v.h += wrapAngle(r.h - v.h) * (1 - Math.exp(-dt * 14));
      const y = groundHeightAt(v.x, v.z);
      v.ch.root.position.set(v.x, y, v.z);
      v.ch.setHeading(v.h);
      v.ch.update(dt, r.s);
      v.tag.position.set(v.x, y + r.heightM + 0.6, v.z);
    }
    for (const [id, v] of this.views) if (!live.has(id)) this.drop(id, v);
  }

  private drop(id: string, v: View): void {
    v.ch.dispose();
    v.ch.root.removeFromParent();
    disposeTag(v.tag);
    this.views.delete(id);
  }

  dispose(): void {
    for (const [id, v] of this.views) this.drop(id, v);
  }
}

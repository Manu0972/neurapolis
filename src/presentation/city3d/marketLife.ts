/**
 * La place du Marché vivante (présentation pure, n'écrit jamais l'état du monde) :
 *  - la fontaine coule pour de vrai : jets en gerbe, gouttes, ronds dans l'eau ;
 *  - des marchands derrière les étals qui ne sont pas à toi, qui crient leurs prix ;
 *  - des chalands qui flânent d'étal en étal, nombreux les jours de marché (mercredi et
 *    samedi matin), rares le soir ;
 *  - des pigeons qui picorent autour de la fontaine et s'envolent quand tu approches ;
 *  - un accordéoniste les jours de marché et le dimanche après-midi.
 * Le hasard vient de `visualRng`.
 */
import * as THREE from 'three';
import type { WorldState } from '../../core/types';
import { dateOf, dayIndexOf, minutesOfDay } from '../../core/clock';
import { CITY } from '../../data/city/layout';
import { groundHeightAt } from './cityScene';
import { createCharacter, type Character3D } from './simpleCharacter';
import { visualRng } from './textures';
import { VALID_HAIR_COLORS, VALID_HAIR_STYLES, VALID_OUTFIT_COLORS, VALID_OUTFIT_STYLES, VALID_SKIN_TONES, type PlayerAppearance } from '../../core/types';

const CRIES = [
  'Les belles tomates du Plateau Blanc !', 'Deux barquettes, trois euros !', 'Goûtez, c’est gratuit !', 'Le fromage d’Odile, tout frais !',
  'Elles sont belles, mes pêches !', 'Allez, on se fait plaisir !', 'Dernières fraises de la saison !', 'Pain au levain, sorti du four !',
  'Qui veut mes radis ?', 'Faites-vous servir, ma petite dame !', 'Promo sur les courgettes !', 'Le miel des Hauts du Taret !',
];

function bubble(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const g = c.getContext('2d')!;
  g.font = '600 30px system-ui, sans-serif';
  const w = Math.min(500, g.measureText(text).width + 40);
  g.fillStyle = 'rgba(255,250,236,0.95)';
  g.beginPath();
  g.roundRect((512 - w) / 2, 8, w, 62, 22);
  g.fill();
  g.beginPath();
  g.moveTo(246, 68); g.lineTo(256, 90); g.lineTo(266, 68);
  g.fill();
  g.fillStyle = '#3a2418';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(3.2, 0.6, 1);
  s.renderOrder = 11;
  return s;
}

function appearanceFrom(r: () => number): PlayerAppearance {
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)]!;
  return { skinTone: pick(VALID_SKIN_TONES), hairColor: pick(VALID_HAIR_COLORS), hairStyle: pick(VALID_HAIR_STYLES), outfitStyle: pick(VALID_OUTFIT_STYLES), outfitColor: pick(VALID_OUTFIT_COLORS) };
}

interface Shopper { ch: Character3D; x: number; z: number; tx: number; tz: number; wait: number; speed: number; r: () => number }
interface Vendor { ch: Character3D; x: number; z: number; unitId: string; bubble: THREE.Sprite | null; next: number; until: number }
interface Pigeon { g: THREE.Group; hx: number; hz: number; x: number; z: number; y: number; vy: number; flying: number; hop: number; r: () => number }

export interface MarketLife {
  group: THREE.Group;
  update(dt: number, world: WorldState, player: { x: number; z: number }): void;
  dispose(): void;
}

export function createMarketLife(): MarketLife {
  const group = new THREE.Group();
  group.name = 'place du marché';
  const rnd = visualRng(3131);
  // Fontaine : coin commun des quatre tuiles (comme le décor de cityScene).
  const tiles = CITY.props.filter((p) => p.kind === 'fontaine');
  const fx = tiles.length ? Math.max(...tiles.map((p) => p.x)) : 0;
  const fz = tiles.length ? Math.max(...tiles.map((p) => p.y)) : 0;
  const fy = groundHeightAt(fx, fz);
  const stalls = CITY.props.filter((p) => p.kind === 'etal');
  const units = CITY.units.filter((u) => u.buildingId.startsWith('etal_'));

  // ----- Fontaine qui coule -----
  const N = 260;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const life = new Float32Array(N);
  const resetDrop = (i: number, t: number): void => {
    const central = i % 4 === 0;
    const a = rnd() * Math.PI * 2;
    pos[i * 3] = fx + (central ? 0 : Math.cos(a) * 0.35);
    pos[i * 3 + 1] = fy + (central ? 2.25 : 1.95);
    pos[i * 3 + 2] = fz + (central ? 0 : Math.sin(a) * 0.35);
    const sp = central ? 0.25 + rnd() * 0.25 : 0.9 + rnd() * 0.4;
    vel[i * 3] = Math.cos(a) * sp;
    vel[i * 3 + 1] = central ? 3.2 + rnd() * 0.6 : 1.2 + rnd() * 0.5;
    vel[i * 3 + 2] = Math.sin(a) * sp;
    life[i] = t;
  };
  for (let i = 0; i < N; i++) resetDrop(i, -rnd() * 1.5);
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dropMat = new THREE.PointsMaterial({ color: '#cfeaf5', size: 0.07, transparent: true, opacity: 0.85, depthWrite: false });
  const drops = new THREE.Points(dropGeo, dropMat);
  drops.frustumCulled = false;
  group.add(drops);
  const ripples: THREE.Mesh[] = [];
  const rippleGeo = new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(rippleGeo, new THREE.MeshBasicMaterial({ color: '#e8f6fb', transparent: true, opacity: 0.4, depthWrite: false }));
    m.position.set(fx, fy + 0.6, fz);
    m.userData.t = i / 4;
    ripples.push(m);
    group.add(m);
  }

  // ----- Marchands -----
  const vendors: Vendor[] = stalls.map((s, i) => {
    const r = visualRng(4400 + i);
    const ch = createCharacter({ appearance: appearanceFrom(r), heightM: 1.6 + r() * 0.2, bodyColor: ['#3f6b4a', '#7a4a3a', '#2f4f6a'][i % 3], detail: 'low' });
    const x = s.x + 0.5;
    const z = s.y + 0.5 - 1.3;
    ch.root.position.set(x, groundHeightAt(x, z), z);
    ch.setHeading(Math.PI);
    group.add(ch.root);
    const unit = units.find((u) => u.door.x === s.x && u.door.y === s.y);
    return { ch, x, z, unitId: unit?.id ?? '', bubble: null, next: 2 + r() * 8, until: 0 };
  });

  // ----- Chalands -----
  const spots = [
    ...stalls.map((s) => ({ x: s.x + 0.5 + (rnd() - 0.5), z: s.y + 1.9 })),
    ...Array.from({ length: 6 }, (_, k) => ({ x: fx + Math.cos((k / 6) * Math.PI * 2) * 3.4, z: fz + Math.sin((k / 6) * Math.PI * 2) * 3.4 })),
  ];
  const shoppers: Shopper[] = Array.from({ length: 22 }, (_, i) => {
    const r = visualRng(5500 + i * 7);
    const ch = createCharacter({ appearance: appearanceFrom(r), heightM: 1.25 + r() * 0.6, detail: 'low' });
    const s = spots[Math.floor(r() * spots.length)]!;
    group.add(ch.root);
    return { ch, x: s.x, z: s.z, tx: s.x, tz: s.z, wait: r() * 6, speed: 0.9 + r() * 0.4, r };
  });

  // ----- Pigeons -----
  const pigeonBody = new THREE.SphereGeometry(0.12, 8, 6).scale(1, 0.85, 1.5);
  const pigeonHead = new THREE.SphereGeometry(0.06, 8, 6);
  const grey = new THREE.MeshStandardMaterial({ color: '#7d8590', roughness: 0.8 });
  const neck = new THREE.MeshStandardMaterial({ color: '#4f6f6a', roughness: 0.5, metalness: 0.3 });
  const pigeons: Pigeon[] = Array.from({ length: 12 }, (_, i) => {
    const r = visualRng(6600 + i);
    const g = new THREE.Group();
    const body = new THREE.Mesh(pigeonBody, grey);
    body.position.y = 0.12;
    const head = new THREE.Mesh(pigeonHead, neck);
    head.position.set(0, 0.24, -0.16);
    g.add(body, head);
    const a = r() * Math.PI * 2;
    const d = 2.6 + r() * 3;
    const hx = fx + Math.cos(a) * d;
    const hz = fz + Math.sin(a) * d;
    group.add(g);
    return { g, hx, hz, x: hx, z: hz, y: 0, vy: 0, flying: 0, hop: r() * 2, r };
  });

  // ----- Accordéoniste -----
  const musician = createCharacter({ appearance: appearanceFrom(visualRng(7777)), heightM: 1.7, bodyColor: '#6b2f3a', detail: 'low' });
  const mx = fx + 4.2;
  const mz = fz - 2.2;
  musician.root.position.set(mx, groundHeightAt(mx, mz), mz);
  musician.setHeading(-Math.PI / 2);
  const accordion = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.22), new THREE.MeshStandardMaterial({ color: '#b02a2a', roughness: 0.4 }));
  accordion.position.set(0, 1.0, -0.25);
  musician.root.add(accordion);
  const notes = bubble('♪ ♫ ♪');
  notes.scale.set(1.4, 0.3, 1);
  group.add(musician.root, notes);

  let t = 0;
  return {
    group,
    update(dt: number, world: WorldState, player: { x: number; z: number }): void {
      // Rien à animer si l'on est loin de la place.
      const far = Math.hypot(player.x - fx, player.z - fz) > 160;
      group.visible = !far;
      if (far) return;
      t += dt;
      const day = dayIndexOf(world.time.tick);
      const wd = dateOf(day).weekday;
      const h = minutesOfDay(world.time.tick) / 60;
      const marketDay = wd === 3 || wd === 6;
      const morning = h >= 7 && h < 13.5;
      const night = h < 7 || h >= 21;
      const crowd = night ? 0 : marketDay && morning ? shoppers.length : morning ? 8 : h < 19 ? 6 : 3;

      // Fontaine (coupée la nuit, comme les fontaines municipales).
      drops.visible = !night || (h >= 21 && h < 23);
      if (drops.visible) {
        for (let i = 0; i < N; i++) {
          life[i]! += dt;
          if (life[i]! < 0) continue;
          vel[i * 3 + 1]! -= 9.8 * dt;
          pos[i * 3]! += vel[i * 3]! * dt;
          pos[i * 3 + 1]! += vel[i * 3 + 1]! * dt;
          pos[i * 3 + 2]! += vel[i * 3 + 2]! * dt;
          if (pos[i * 3 + 1]! < fy + 0.55) resetDrop(i, 0);
        }
        dropGeo.attributes.position!.needsUpdate = true;
      }
      for (const m of ripples) {
        const k = ((m.userData.t as number) + t * 0.45) % 1;
        m.scale.setScalar(0.3 + k * 1.3);
        (m.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - k) * (drops.visible ? 1 : 0);
      }

      // Marchands : présents aux heures de marché, sur les étals qui ne sont pas loués par le joueur.
      for (const v of vendors) {
        const mine = !!world.economy?.leases[v.unitId];
        v.ch.root.visible = !mine && !night && h < 19.5;
        if (!v.ch.root.visible) { if (v.bubble) { v.bubble.removeFromParent(); v.bubble = null; } continue; }
        v.ch.update(dt, 0);
        v.next -= dt;
        if (v.bubble && t > v.until) { v.bubble.removeFromParent(); v.bubble = null; }
        if (v.next <= 0 && Math.hypot(player.x - v.x, player.z - v.z) < 45) {
          v.next = (marketDay && morning ? 6 : 14) + rnd() * 10;
          v.bubble?.removeFromParent();
          v.bubble = bubble(CRIES[Math.floor(rnd() * CRIES.length)]!);
          v.bubble.position.set(v.x, groundHeightAt(v.x, v.z) + 2.6, v.z);
          v.until = t + 3.2;
          group.add(v.bubble);
        }
      }

      // Chalands : d'un étal à l'autre, une pause, on repart.
      shoppers.forEach((s, i) => {
        s.ch.root.visible = i < crowd;
        if (!s.ch.root.visible) return;
        const dx = s.tx - s.x;
        const dz = s.tz - s.z;
        const d = Math.hypot(dx, dz);
        let speed = 0;
        if (d < 0.15) {
          s.wait -= dt;
          if (s.wait <= 0) {
            const n = spots[Math.floor(s.r() * spots.length)]!;
            s.tx = n.x + (s.r() - 0.5) * 1.2;
            s.tz = n.z + (s.r() - 0.5) * 0.8;
            s.wait = 2 + s.r() * 7;
          }
        } else {
          speed = s.speed;
          const step = Math.min(d, speed * dt);
          s.x += (dx / d) * step;
          s.z += (dz / d) * step;
          s.ch.setHeading(Math.atan2(-dx, -dz));
        }
        s.ch.root.position.set(s.x, groundHeightAt(s.x, s.z), s.z);
        s.ch.update(dt, speed);
      });

      // Pigeons : picorent, sautillent, s'envolent si l'on approche, reviennent plus tard.
      for (const p of pigeons) {
        const close = Math.hypot(player.x - p.x, player.z - p.z) < 3;
        if (close && p.flying <= 0) { p.flying = 8 + p.r() * 6; p.vy = 4; }
        if (p.flying > 0) {
          p.flying -= dt;
          p.y = Math.min(9, p.y + p.vy * dt);
          const a = t * 0.8 + p.hx;
          p.x += Math.cos(a) * 3 * dt;
          p.z += Math.sin(a) * 3 * dt;
          if (p.flying <= 0) { p.x = p.hx; p.z = p.hz; p.y = 0; }
        } else {
          p.hop -= dt;
          if (p.hop <= 0) {
            p.hop = 0.6 + p.r() * 2;
            p.x = p.hx + (p.r() - 0.5) * 1.6;
            p.z = p.hz + (p.r() - 0.5) * 1.6;
            p.g.rotation.y = p.r() * Math.PI * 2;
          }
        }
        const peck = p.flying > 0 ? 0 : Math.max(0, Math.sin(t * 9 + p.hx * 3)) * 0.4;
        p.g.position.set(p.x, groundHeightAt(p.x, p.z) + p.y, p.z);
        p.g.rotation.x = peck;
        p.g.visible = !night;
      }

      // Accordéon : jours de marché le matin, dimanche après-midi.
      const plays = !night && ((marketDay && morning) || (wd === 0 && h >= 14 && h < 18));
      musician.root.visible = plays;
      notes.visible = plays;
      if (plays) {
        musician.update(dt, 0);
        accordion.scale.x = 1 + Math.sin(t * 3.2) * 0.25;
        notes.position.set(mx, groundHeightAt(mx, mz) + 2.3 + Math.sin(t * 1.5) * 0.12, mz);
      }
    },
    dispose(): void {
      for (const s of shoppers) s.ch.dispose();
      for (const v of vendors) v.ch.dispose();
      musician.dispose();
      dropGeo.dispose();
      dropMat.dispose();
      rippleGeo.dispose();
      pigeonBody.dispose();
      pigeonHead.dispose();
      group.removeFromParent();
    },
  };
}

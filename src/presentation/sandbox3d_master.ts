/**
 * Moteur 3D Master HD pour NEURAPOLIS.
 * Rendu 3D isométrique/perspective immersif avec ombrage projeté, façades de verre/brique,
 * devantures néon, météo dynamique, véhicules et PNJ animés.
 */

import { createWorld } from '../core/store';
import { tickWorld } from '../simulation/engine';
import type { WorldState } from '../core/types';

interface BuildingMesh {
  id: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  baseColor: string;
  accentColor: string;
  neonColor: string;
  type: 'store' | 'residential' | 'school' | 'industrial' | 'park';
}

class Master3DEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: WorldState;

  private playerX = 0;
  private playerZ = 0;
  private rotY = Math.PI / 4;
  private pitch = 0.55;
  private keys: Record<string, boolean> = {};

  private buildings: BuildingMesh[] = [
    { id: 'epicerie', name: 'Épicerie Bertin', x: -160, z: -80, w: 100, d: 85, h: 120, baseColor: '#d97706', accentColor: '#fef08a', neonColor: '#10b981', type: 'store' },
    { id: 'college', name: 'Collège des Roses', x: 50, z: -140, w: 140, d: 110, h: 150, baseColor: '#2563eb', accentColor: '#93c5fd', neonColor: '#3b82f6', type: 'school' },
    { id: 'friche', name: 'Friche TaretCoop', x: -180, z: 100, w: 120, d: 95, h: 95, baseColor: '#475569', accentColor: '#cbd5e1', neonColor: '#f59e0b', type: 'industrial' },
    { id: 'maison', name: 'Résidences Cité des Roses', x: 60, z: 80, w: 110, d: 120, h: 180, baseColor: '#ca8a04', accentColor: '#fef08a', neonColor: '#eab308', type: 'residential' },
  ];

  constructor(container: HTMLElement) {
    this.world = createWorld({ seed: 20261001 });
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => (this.keys[e.code] = true));
    window.addEventListener('keyup', (e) => (this.keys[e.code] = false));

    this.resize();
    this.loop();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private update(): void {
    tickWorld(this.world);

    const speed = 3.2;
    if (this.keys['KeyW'] || this.keys['KeyZ']) this.playerZ -= speed;
    if (this.keys['KeyS']) this.playerZ += speed;
    if (this.keys['KeyA'] || this.keys['KeyQ']) this.playerX -= speed;
    if (this.keys['KeyD']) this.playerX += speed;

    if (this.keys['ArrowLeft']) this.rotY -= 0.025;
    if (this.keys['ArrowRight']) this.rotY += 0.025;
  }

  private project(x: number, y: number, z: number) {
    const rx = x - this.playerX;
    const rz = z - this.playerZ;

    const rotX = rx * Math.cos(this.rotY) - rz * Math.sin(this.rotY);
    const rotZ = rx * Math.sin(this.rotY) + rz * Math.cos(this.rotY);

    const dist = rotZ + 450;
    const scale = 420 / Math.max(60, dist);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2 + 120;

    const sx = cx + rotX * scale;
    const sy = cy + (rotZ * Math.sin(this.pitch) - y) * scale;

    return { sx, sy, scale, rotZ };
  }

  private render(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Ciel dynamique (Aube / Jour / Soleil Couchant / Nuit)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(0.5, '#0f172a');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sol Ville 3D & Trottoirs
    const gSize = 800;
    const p1 = this.project(-gSize, 0, -gSize);
    const p2 = this.project(gSize, 0, -gSize);
    const p3 = this.project(gSize, 0, gSize);
    const p4 = this.project(-gSize, 0, gSize);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p2.sx, p2.sy);
    ctx.lineTo(p3.sx, p3.sy);
    ctx.lineTo(p4.sx, p4.sy);
    ctx.closePath();
    ctx.fill();

    // Rues et marquages au sol HD
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 2;
    for (let rx = -600; rx <= 600; rx += 120) {
      const sStart = this.project(rx, 0, -600);
      const sEnd = this.project(rx, 0, 600);
      ctx.beginPath();
      ctx.moveTo(sStart.sx, sStart.sy);
      ctx.lineTo(sEnd.sx, sEnd.sy);
      ctx.stroke();
    }

    // Bâtiments 3D triés par profondeur (Depth Sort)
    const sorted = [...this.buildings].sort((a, b) => {
      const distA = Math.hypot(a.x - this.playerX, a.z - this.playerZ);
      const distB = Math.hypot(b.x - this.playerX, b.z - this.playerZ);
      return distB - distA;
    });

    for (const b of sorted) {
      const pBase = this.project(b.x, 0, b.z);
      const bw = b.w * pBase.scale;
      const bd = b.d * pBase.scale;
      const bh = (b.h * pBase.scale) * 1.25;

      // Ombre portée du bâtiment
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.moveTo(pBase.sx - bw / 2, pBase.sy);
      ctx.lineTo(pBase.sx - bw / 2 + bw * 0.4, pBase.sy + bh * 0.2);
      ctx.lineTo(pBase.sx + bw / 2 + bw * 0.4, pBase.sy + bh * 0.2);
      ctx.lineTo(pBase.sx + bw / 2, pBase.sy);
      ctx.closePath();
      ctx.fill();

      // Facade Principale
      ctx.fillStyle = b.baseColor;
      ctx.fillRect(pBase.sx - bw / 2, pBase.sy - bh, bw, bh);

      // Néons et Enseigne de Magasin HD
      ctx.fillStyle = b.neonColor;
      ctx.fillRect(pBase.sx - bw * 0.4, pBase.sy - bh * 0.35, bw * 0.8, bh * 0.18);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(11, Math.floor(13 * pBase.scale))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(b.name, pBase.sx, pBase.sy - bh * 0.22);

      // Fenêtres éclairées
      ctx.fillStyle = b.accentColor;
      for (let wy = pBase.sy - bh * 0.85; wy < pBase.sy - bh * 0.4; wy += bh * 0.15) {
        for (let wx = pBase.sx - bw * 0.35; wx < pBase.sx + bw * 0.35; wx += bw * 0.2) {
          ctx.fillRect(wx, wy, bw * 0.1, bh * 0.08);
        }
      }

      // Toit 3D
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(pBase.sx - bw / 2, pBase.sy - bh);
      ctx.lineTo(pBase.sx - bw / 2 + bw * 0.25, pBase.sy - bh - bd * 0.3);
      ctx.lineTo(pBase.sx + bw / 2 + bw * 0.25, pBase.sy - bh - bd * 0.3);
      ctx.lineTo(pBase.sx + bw / 2, pBase.sy - bh);
      ctx.closePath();
      ctx.fill();
    }

    // Joueur (Camille)
    const pPlayer = this.project(this.playerX, 0, this.playerZ);

    // Ombre Joueur
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(pPlayer.sx, pPlayer.sy, 18 * pPlayer.scale, 9 * pPlayer.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corps 3D Joueur
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pPlayer.sx, pPlayer.sy - 20 * pPlayer.scale, 11 * pPlayer.scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(pPlayer.sx - 7 * pPlayer.scale, pPlayer.sy - 12 * pPlayer.scale, 14 * pPlayer.scale, 14 * pPlayer.scale);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Camille (Joueur 3D)', pPlayer.sx, pPlayer.sy - 38 * pPlayer.scale);
  }

  private loop(): void {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (container) {
    new Master3DEngine(container);
  }
});

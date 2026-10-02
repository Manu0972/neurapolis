/**
 * Moteur 3D Style "Big Ambitions" pour NEURAPOLIS.
 * Rendu 3D isométrique avec bâtiments textured, façades de boutiques,
 * trottoirs, routes, véhicules, éclairages de devantures et personnage 3D.
 */

interface Building3D {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roofColor: string;
  name: string;
  type: 'store' | 'residential' | 'school' | 'industrial';
}

class BigAmbitions3DEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playerX = 0;
  private playerZ = 0;
  private cameraAngle = Math.PI / 4;
  private cameraPitch = 0.6;
  private keys: Record<string, boolean> = {};

  private buildings: Building3D[] = [
    { x: -140, z: -100, w: 90, d: 80, h: 110, color: '#e89a56', roofColor: '#b86d2f', name: 'Épicerie Mme Bertin', type: 'store' },
    { x: 30, z: -120, w: 120, d: 100, h: 140, color: '#6ba7d6', roofColor: '#3a729e', name: 'Collège des Roses', type: 'school' },
    { x: -160, z: 80, w: 110, d: 90, h: 90, color: '#8f96a3', roofColor: '#5a616e', name: 'Friche TaretCoop', type: 'industrial' },
    { x: 50, z: 90, w: 100, d: 110, h: 160, color: '#f2c94c', roofColor: '#b89428', name: 'Résidences Cité des Roses', type: 'residential' },
  ];

  constructor(container: HTMLElement) {
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
    const speed = 2.8;
    if (this.keys['KeyW'] || this.keys['KeyZ']) this.playerZ -= speed;
    if (this.keys['KeyS']) this.playerZ += speed;
    if (this.keys['KeyA'] || this.keys['KeyQ']) this.playerX -= speed;
    if (this.keys['KeyD']) this.playerX += speed;

    if (this.keys['ArrowLeft']) this.cameraAngle -= 0.02;
    if (this.keys['ArrowRight']) this.cameraAngle += 0.02;
  }

  private project(x: number, y: number, z: number): { sx: number; sy: number; scale: number } {
    const relX = x - this.playerX;
    const relZ = z - this.playerZ;

    // Rotation isométrique selon cameraAngle
    const rotX = relX * Math.cos(this.cameraAngle) - relZ * Math.sin(this.cameraAngle);
    const rotZ = relX * Math.sin(this.cameraAngle) + relZ * Math.cos(this.cameraAngle);

    const dist = rotZ + 400;
    const scale = 380 / Math.max(50, dist);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2 + 100;

    const sx = cx + rotX * scale;
    const sy = cy + (rotZ * Math.sin(this.cameraPitch) - y) * scale;

    return { sx, sy, scale };
  }

  private render(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Fond Ciel / Ambiance Ville Nuit / Crépuscule Big Ambitions
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#090d16');
    skyGrad.addColorStop(0.6, '#111827');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Dessin de la Ville / Sol et Routes 3D
    const groundSize = 600;
    const g1 = this.project(-groundSize, 0, -groundSize);
    const g2 = this.project(groundSize, 0, -groundSize);
    const g3 = this.project(groundSize, 0, groundSize);
    const g4 = this.project(-groundSize, 0, groundSize);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(g1.sx, g1.sy);
    ctx.lineTo(g2.sx, g2.sy);
    ctx.lineTo(g3.sx, g3.sy);
    ctx.lineTo(g4.sx, g4.sy);
    ctx.closePath();
    ctx.fill();

    // Grille de rues Big Ambitions
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1.5;
    for (let rx = -500; rx <= 500; rx += 100) {
      const pStart = this.project(rx, 0, -500);
      const pEnd = this.project(rx, 0, 500);
      ctx.beginPath();
      ctx.moveTo(pStart.sx, pStart.sy);
      ctx.lineTo(pEnd.sx, pEnd.sy);
      ctx.stroke();
    }

    // Tri par profondeur (Z-buffering simplifié)
    const sortedBuildings = [...this.buildings].sort((a, b) => {
      const distA = Math.hypot(a.x - this.playerX, a.z - this.playerZ);
      const distB = Math.hypot(b.x - this.playerX, b.z - this.playerZ);
      return distB - distA;
    });

    // Rendu des bâtiments 3D volumétriques
    for (const b of sortedBuildings) {
      const pBase = this.project(b.x, 0, b.z);
      const pTop = this.project(b.x, b.h, b.z);

      const bw = b.w * pBase.scale;
      const bd = b.d * pBase.scale;
      const bh = (b.h * pBase.scale) * 1.2;

      // Facade Principale
      ctx.fillStyle = b.color;
      ctx.fillRect(pBase.sx - bw / 2, pBase.sy - bh, bw, bh);

      // Devanture éclairée / Enseigne Big Ambitions
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(pBase.sx - bw * 0.35, pBase.sy - bh * 0.3, bw * 0.7, bh * 0.2);

      ctx.fillStyle = '#0f172a';
      ctx.font = `${Math.max(10, Math.floor(12 * pBase.scale))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(b.name, pBase.sx, pBase.sy - bh * 0.18);

      // Toit 3D
      ctx.fillStyle = b.roofColor;
      ctx.beginPath();
      ctx.moveTo(pBase.sx - bw / 2, pBase.sy - bh);
      ctx.lineTo(pBase.sx - bw / 2 + bw * 0.25, pBase.sy - bh - bd * 0.3);
      ctx.lineTo(pBase.sx + bw / 2 + bw * 0.25, pBase.sy - bh - bd * 0.3);
      ctx.lineTo(pBase.sx + bw / 2, pBase.sy - bh);
      ctx.closePath();
      ctx.fill();
    }

    // Avatar 3D Joueur (Camille)
    const pPlayer = this.project(this.playerX, 0, this.playerZ);

    // Ombre 3D
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(pPlayer.sx, pPlayer.sy, 16 * pPlayer.scale, 8 * pPlayer.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corps 3D Joueur
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pPlayer.sx, pPlayer.sy - 18 * pPlayer.scale, 10 * pPlayer.scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(pPlayer.sx - 6 * pPlayer.scale, pPlayer.sy - 10 * pPlayer.scale, 12 * pPlayer.scale, 12 * pPlayer.scale);
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
    new BigAmbitions3DEngine(container);
  }
});

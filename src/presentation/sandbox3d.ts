/**
 * Prototype Bac à Sable 3D Isolé pour NEURAPOLIS.
 * Déduisit un rendu WebGL/Canvas 3D autonome pour charger le kit 3D de l'utilisateur.
 */

class Sandbox3DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private posX = 0;
  private posZ = 0;
  private keys: Record<string, boolean> = {};

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
    const speed = 2.5;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.posZ -= speed;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.posZ += speed;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.posX -= speed;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.posX += speed;
  }

  private render(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Ciel
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grille de sol avec projection pseudo-3D
    const cx = w / 2;
    const cy = h / 2 + 50;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;

    for (let z = 10; z < 400; z += 20) {
      const pZ = z + (this.posZ % 20);
      const scale = 200 / pZ;
      const y = cy + scale * 30;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    for (let x = -400; x <= 400; x += 40) {
      const pX = x - this.posX;
      ctx.beginPath();
      ctx.moveTo(cx + pX * 0.2, cy);
      ctx.lineTo(cx + pX * 2.5, h);
      ctx.stroke();
    }

    // Bâtiments en volumes 3D simples (placeholders)
    const buildings = [
      { x: -120, z: 120, w: 60, h: 80, color: '#3b82f6' },
      { x: 100, z: 150, w: 80, h: 100, color: '#f59e0b' },
      { x: -50, z: 220, w: 90, h: 120, color: '#10b981' },
    ];

    for (const b of buildings) {
      const relX = b.x - this.posX;
      const relZ = b.z + this.posZ;
      if (relZ <= 20) continue;

      const scale = 220 / relZ;
      const screenX = cx + relX * scale;
      const screenY = cy + scale * 30;
      const bw = b.w * scale;
      const bh = b.h * scale;

      // Facade avant
      ctx.fillStyle = b.color;
      ctx.fillRect(screenX - bw / 2, screenY - bh, bw, bh);

      // Toit / Profondeur 3D
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(screenX - bw / 2, screenY - bh);
      ctx.lineTo(screenX - bw / 2 + bw * 0.2, screenY - bh - bh * 0.2);
      ctx.lineTo(screenX + bw / 2 + bw * 0.2, screenY - bh - bh * 0.2);
      ctx.lineTo(screenX + bw / 2, screenY - bh);
      ctx.closePath();
      ctx.fill();
    }

    // Joueur (Avatar 3D)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy + 30, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
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
    new Sandbox3DRenderer(container);
  }
});

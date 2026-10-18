/**
 * Lecteur de cinématique : plein écran au-dessus du jeu, rendu Three.js du décor (sets.ts) piloté
 * par la liste de plans (plan.ts), bandes noires, sous-titres en français, petit fantôme 2D qui
 * parle à côté du sous-titre, bouton « Passer » (Espace / Échap), clic = plan suivant, puis
 * fondu au noir, carton (« Le lendemain matin… ») et fondu vers le jeu.
 */
import * as THREE from 'three';
import { ghostAvatar, mouthOpenAt, speak, thinkerMeta } from '../ghost-avatar';
import { cameraAt, nextShotStart, planDuration, shotAt, type CinematicPlan, type Cue } from './plan';
import { buildSet, type CineSet, type SetOptions } from './sets';

export interface CinematicOptions extends SetOptions {
  /** Prénom et accords dans les sous-titres. */
  text(s: string): string;
  /** Musique : état imposé pendant la cinématique (titre de scène), puis null. */
  music?(scene: string | null): void;
  /** Un repère commence (bruitages). */
  onCue?(cue: Cue): void;
}

const CSS = `
.cine { position: fixed; inset: 0; z-index: 400; background: #000; color: #f9ecd0; font-family: inherit; overflow: hidden; cursor: pointer; }
.cine canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.cine-bar { position: absolute; left: 0; right: 0; height: 9vh; background: #0b0709; z-index: 2; }
.cine-bar.top { top: 0; } .cine-bar.bottom { bottom: 0; }
.cine-sub { position: absolute; left: 50%; bottom: calc(9vh + 18px); transform: translateX(-50%); z-index: 3;
  width: min(880px, calc(100vw - 32px)); display: flex; align-items: center; gap: 14px; justify-content: center; }
.cine-sub p { margin: 0; padding: 10px 16px; border-radius: 12px; background: rgba(20, 12, 16, 0.62); font-size: clamp(16px, 2.1vw, 22px);
  line-height: 1.45; text-align: center; text-shadow: 0 1px 2px #000; opacity: 0; transition: opacity 0.6s; }
.cine-sub p.in { opacity: 1; }
.cine-sub .gk { flex: none; width: clamp(72px, 9vw, 104px); height: auto; filter: drop-shadow(0 0 10px rgba(255, 217, 138, 0.5)); }
.cine-skip { position: absolute; right: 16px; top: calc(9vh + 12px); z-index: 4; border: 1px solid rgba(249, 236, 208, 0.5);
  background: rgba(20, 12, 16, 0.6); color: #f9ecd0; border-radius: 999px; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.cine-skip:hover, .cine-skip:focus-visible { background: rgba(255, 217, 138, 0.25); outline: none; }
.cine-veil { position: absolute; inset: 0; z-index: 5; background: #000; opacity: 1; transition: opacity 1s, background-color 0.9s; pointer-events: none;
  display: flex; align-items: center; justify-content: center; }
.cine-veil.morning { background: #f6e3b8; color: #4a3220; }
.cine-card { font-size: clamp(20px, 3vw, 30px); letter-spacing: 0.04em; opacity: 0; transition: opacity 0.8s; font-style: italic; }
.cine-card.in { opacity: 1; }
.cine-hint { position: absolute; left: 16px; top: calc(9vh + 16px); z-index: 4; font-size: 12px; opacity: 0.6; }
@media (prefers-reduced-motion: reduce) { .cine-veil, .cine-card, .cine-sub p { transition: none; } }
`;
let cssDone = false;
function ensureCss(): void {
  if (cssDone) return;
  cssDone = true;
  const st = document.createElement('style');
  st.dataset.owner = 'cinematic';
  st.textContent = CSS;
  document.head.appendChild(st);
}

/** Cinématique en cours (une seule à la fois), pour la QA (passer sans clavier). */
let current: { skip(): void; time(): number; seek(t: number): void; capture(t: number): string } | null = null;
export function currentCinematic(): { skip(): void; time(): number; seek(t: number): void; capture(t: number): string } | null { return current; }

/**
 * Joue une cinématique. Retourne faux si WebGL est indisponible (l'appelant affiche alors la
 * version texte). `done` est appelé une seule fois, après le fondu vers le jeu.
 */
export function playCinematic(host: HTMLElement, plan: CinematicPlan, opts: CinematicOptions, done: () => void): boolean {
  ensureCss();
  const root = document.createElement('div');
  root.className = 'cine';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Cinématique');
  const canvas = document.createElement('canvas');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return false;
  }
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  let set: CineSet;
  try {
    set = buildSet(plan, opts);
  } catch {
    renderer.dispose();
    return false;
  }
  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.05, 400);

  root.appendChild(canvas);
  for (const cls of ['top', 'bottom']) { const b = document.createElement('div'); b.className = `cine-bar ${cls}`; root.appendChild(b); }
  const sub = document.createElement('div');
  sub.className = 'cine-sub';
  const subText = document.createElement('p');
  sub.appendChild(subText);
  root.appendChild(sub);
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'cine-skip';
  skipBtn.textContent = 'Passer ⏭  (Espace / Échap)';
  root.appendChild(skipBtn);
  const hint = document.createElement('div');
  hint.className = 'cine-hint';
  hint.textContent = 'Clic : plan suivant';
  root.appendChild(hint);
  const veil = document.createElement('div');
  veil.className = 'cine-veil';
  const card = document.createElement('div');
  card.className = 'cine-card';
  veil.appendChild(card);
  root.appendChild(veil);
  host.appendChild(root);
  opts.music?.('Une voix s’éveille');

  const total = planDuration(plan);
  let t = 0;
  let last = performance.now();
  let raf = 0;
  let shotIndex = -1;
  let ending = false;
  let finished = false;
  let speakerSvg: SVGSVGElement | null = null;
  let stopTalk: (() => void) | null = null;
  let typed = { text: '', start: 0 };
  const firedCues = new Set<Cue>();

  const resize = (): void => {
    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  };

  const showShot = (i: number): void => {
    const sh = plan.shots[i]!;
    for (const c of sh.cues ?? []) if (!firedCues.has(c)) { firedCues.add(c); opts.onCue?.(c); }
    stopTalk?.();
    stopTalk = null;
    speakerSvg?.remove();
    speakerSvg = null;
    subText.classList.remove('in');
    const text = sh.subtitle ? opts.text(sh.subtitle) : '';
    window.setTimeout(() => {
      if (finished || shotIndex !== i) return;
      if (sh.speaker) {
        // Le fantôme parle : petit personnage 2D à côté du sous-titre, bouche au rythme du texte.
        speakerSvg = ghostAvatar(sh.speaker, 'joie', 104);
        speakerSvg.setAttribute('aria-label', thinkerMeta(sh.speaker).name);
        sub.insertBefore(speakerSvg, subText);
        subText.classList.add('in');
        stopTalk = speak(speakerSvg, subText, text, { cps: Math.max(18, text.length / Math.max(1, sh.duration - 1.6)) });
        typed = { text, start: t };
      } else {
        subText.textContent = text;
        subText.classList.toggle('in', text.length > 0);
      }
    }, 250);
  };

  const finish = (): void => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey, true);
    current = null;
    stopTalk?.();
    set.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    opts.music?.(null);
    root.remove();
    done();
  };

  /** Fondu au noir → carton → fondu vers le jeu (matin). */
  const end = (): void => {
    if (ending) return;
    ending = true;
    stopTalk?.();
    veil.style.opacity = '1';
    window.setTimeout(() => {
      veil.classList.add('morning');
      card.textContent = opts.text(plan.outro);
      card.classList.add('in');
      sub.style.display = 'none';
      skipBtn.style.display = 'none';
      hint.style.display = 'none';
      canvas.style.visibility = 'hidden';
    }, 1000);
    window.setTimeout(() => { card.classList.remove('in'); veil.style.opacity = '0'; root.style.background = 'transparent'; }, 3600);
    window.setTimeout(finish, 4700);
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'Space' || e.code === 'Escape' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      end();
    }
  };
  window.addEventListener('keydown', onKey, true);
  skipBtn.addEventListener('click', (e) => { e.stopPropagation(); end(); });
  root.addEventListener('click', () => { if (!ending) t = Math.min(total, nextShotStart(plan, t)); });
  current = { skip: end, time: () => t, seek: (x) => { t = Math.max(0, Math.min(total, x)); }, capture: () => '' };

  const frame = (): void => {
    if (finished) return;
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!ending) t += dt;
    draw(dt);
  };
  const draw = (dt: number): void => {
    const s = shotAt(plan, t);
    if (!s && !ending) end();
    if (s && s.index !== shotIndex) { shotIndex = s.index; showShot(s.index); }
    const pose = cameraAt(plan, t);
    camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
    camera.lookAt(pose.look.x, pose.look.y, pose.look.z);
    const speaker = s?.shot.speaker ?? null;
    const shown = typed.text ? Math.floor(subText.textContent?.length ?? 0) : 0;
    const open = !!speaker && (speakerSvg?.classList.contains('gk-open') ?? mouthOpenAt(typed.text, shown));
    set.update(t, dt, speaker, open);
    resize();
    renderer.render(set.scene, camera);
  };
  current.capture = (x: number): string => {
    t = Math.max(0, Math.min(total - 0.01, x));
    draw(0.016);
    return canvas.toDataURL('image/jpeg', 0.82);
  };
  // Ouverture : fondu depuis le noir.
  requestAnimationFrame(() => { veil.style.opacity = '0'; });
  frame();
  return true;
}

// QA (développement) : avancer ou passer une cinématique quand le panneau est masqué.
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  (window as unknown as { __NEURAPOLIS_CINE__?: () => unknown }).__NEURAPOLIS_CINE__ = currentCinematic;
}

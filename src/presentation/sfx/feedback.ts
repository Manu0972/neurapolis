/**
 * Retours visuels des actions (DOM, sans Three.js) : pièces qui s'envolent vers la caisse,
 * compteur d'argent animé, rebond des boutons, invite « E — … » qui pulse, fondu d'entrée
 * dans un intérieur, éclat de la balise de mission. Tout respecte « Réduire les animations ».
 */
import { moneyTrend } from './logic';
import { reduceMotion } from './prefs';

let styled = false;
function injectStyle(): void {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style');
  s.textContent = `
.fx-coin { position: fixed; left: 0; top: 0; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%;
  z-index: 40; pointer-events: none; background: radial-gradient(circle at 35% 30%, #fff6c8 0 18%, #f6c945 40%, #c98a12 100%);
  box-shadow: 0 0 0 1.5px #8a5a06 inset, 0 2px 4px rgba(0,0,0,.35); will-change: transform, opacity; }
.fx-gain { position: fixed; z-index: 40; pointer-events: none; transform: translate(-50%, -50%);
  font: 900 18px system-ui, sans-serif; color: #ffd75a; text-shadow: 0 2px 0 #5a3a08, 0 0 10px rgba(255, 200, 60, .6); white-space: nowrap; }
.fx-veil { position: fixed; inset: 0; z-index: 10; pointer-events: none; background: #120c08; opacity: 0; }
.fx-ring { position: fixed; z-index: 12; pointer-events: none; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%;
  border: 3px solid var(--or, #f2b53a); box-shadow: 0 0 18px rgba(242, 181, 58, .8); opacity: 0; }
.hud-money.fx-up { color: #7fe08a !important; }
.hud-money.fx-down { color: #ff8a7a !important; }
.hud-money { transition: color .35s ease; }
@keyframes fxPromptPulse { 0%, 100% { box-shadow: 0 8px 20px rgba(0,0,0,.35), 0 0 0 0 rgba(242,181,58,0); scale: 1; }
  50% { box-shadow: 0 8px 20px rgba(0,0,0,.35), 0 0 0 4px rgba(242,181,58,.45); scale: 1.035; } }
.interact-prompt:not(.hidden) { animation: fxPromptPulse 1.6s ease-in-out infinite; }
html.reduce-motion .interact-prompt:not(.hidden) { animation: none; box-shadow: 0 8px 20px rgba(0,0,0,.35), 0 0 0 3px rgba(242,181,58,.45); }
`;
  document.head.appendChild(s);
}

const center = (el: Element | null): { x: number; y: number } | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Petit rebond (propriété `scale`, indépendante des `transform` existants). */
export function bump(el: Element | null, strength = 1): void {
  if (!el || reduceMotion() || typeof (el as HTMLElement).animate !== 'function') return;
  const k = 0.08 * strength;
  (el as HTMLElement).animate(
    [{ scale: '1' }, { scale: String(1 + k), offset: 0.35 }, { scale: String(1 - k * 0.3), offset: 0.7 }, { scale: '1' }],
    { duration: 320, easing: 'ease-out' },
  );
}

/** « +12,50 € » qui flotte et s'efface. */
function floatGain(at: { x: number; y: number }, text: string): void {
  const g = document.createElement('div');
  g.className = 'fx-gain';
  g.textContent = text;
  g.style.left = `${at.x}px`;
  g.style.top = `${at.y}px`;
  document.body.appendChild(g);
  const rise = reduceMotion() ? 0 : -46;
  const a = g.animate([{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0', offset: 0.15 }, { opacity: 0, translate: `0 ${rise}px` }],
    { duration: 1300, easing: 'ease-out' });
  a.onfinish = () => g.remove();
}

/**
 * Pièces qui jaillissent de `from` puis filent vers `to` (la caisse ou le porte-monnaie).
 * `n` pièces (3 à 12) ; avec « Réduire les animations », seul le montant flotte.
 */
export function coinBurst(from: { x: number; y: number }, to: Element | null, n: number, label?: string): void {
  injectStyle();
  if (label) floatGain({ x: from.x, y: from.y - 30 }, label);
  if (reduceMotion() || n <= 0 || typeof document.body.animate !== 'function') return;
  const dest = center(to) ?? { x: from.x, y: from.y - 160 };
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'fx-coin';
    document.body.appendChild(c);
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const r = 40 + Math.random() * 50;
    const px = from.x + Math.cos(ang) * r;
    const py = from.y + Math.sin(ang) * r;
    const a = c.animate([
      { transform: `translate(${from.x}px, ${from.y}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${px}px, ${py}px) scale(1.1) rotateY(180deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dest.x}px, ${dest.y}px) scale(.55) rotateY(540deg)`, opacity: 0.9 },
    ], { duration: 780 + Math.random() * 220, delay: i * 45, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });
    a.onfinish = () => { c.remove(); if (i === n - 1) bump(to, 1.4); };
  }
}

/* ─────────────── Compteur d'argent ─────────────── */

const tickers = new WeakMap<HTMLElement, { shown: number; target: number; raf: number; timer: number }>();

/**
 * Affiche `value` dans `el` ; si la valeur change, les chiffres défilent (0,5 s) et le compteur
 * flashe en vert (gain) ou en rouge (dépense). Le premier affichage est immédiat.
 */
export function setMoney(el: HTMLElement, value: number, format: (v: number) => string): void {
  injectStyle();
  const st = tickers.get(el);
  if (!st) {
    el.textContent = format(value);
    tickers.set(el, { shown: value, target: value, raf: 0, timer: 0 });
    return;
  }
  const trend = moneyTrend(st.target, value);
  if (!trend) return;
  st.target = value;
  el.classList.toggle('fx-up', trend === 'up');
  el.classList.toggle('fx-down', trend === 'down');
  window.clearTimeout(st.timer);
  st.timer = window.setTimeout(() => el.classList.remove('fx-up', 'fx-down'), 900);
  bump(el, trend === 'up' ? 1 : 0.6);
  cancelAnimationFrame(st.raf);
  const from = st.shown;
  if (reduceMotion() || typeof requestAnimationFrame !== 'function') {
    st.shown = value;
    el.textContent = format(value);
    return;
  }
  const t0 = performance.now();
  const step = (now: number): void => {
    const k = Math.min(1, (now - t0) / 500);
    const e = 1 - (1 - k) ** 3;
    st.shown = from + (value - from) * e;
    el.textContent = format(k >= 1 ? value : st.shown);
    if (k < 1) st.raf = requestAnimationFrame(step);
  };
  st.raf = requestAnimationFrame(step);
}

/* ─────────────── Fondu, balise, boutons ─────────────── */

let veil: HTMLElement | null = null;
/** Fondu au noir chaud, bref, en passant une porte (entrée ou sortie d'un intérieur). */
export function fadeVeil(): void {
  injectStyle();
  if (typeof document === 'undefined' || typeof document.body.animate !== 'function') return;
  if (!veil) {
    veil = document.createElement('div');
    veil.className = 'fx-veil';
    document.body.appendChild(veil);
  }
  veil.getAnimations().forEach((a) => a.cancel());
  veil.animate([{ opacity: 0.92 }, { opacity: 0.92, offset: 0.15 }, { opacity: 0 }], { duration: reduceMotion() ? 260 : 520, easing: 'ease-out' });
}

/** Éclat discret à l'écran sur la balise de mission (anneau qui s'élargit et s'efface). */
export function beaconFlash(at: { x: number; y: number }): void {
  injectStyle();
  if (typeof document === 'undefined' || typeof document.body.animate !== 'function') return;
  const ring = document.createElement('div');
  ring.className = 'fx-ring';
  ring.style.left = `${at.x}px`;
  ring.style.top = `${at.y}px`;
  document.body.appendChild(ring);
  const grow = reduceMotion() ? '1' : '2.6';
  const a = ring.animate([{ opacity: 0.95, scale: '0.6' }, { opacity: 0, scale: grow }], { duration: 750, easing: 'ease-out' });
  a.onfinish = () => ring.remove();
}

const BOUNCY = 'button, .btn, .ph-btn, .hud2-btn, [role="button"]';

/** Rebond des boutons à la pression (délégué : couvre les fenêtres créées plus tard). */
export function installButtonBounce(root: HTMLElement, onPress?: () => void): () => void {
  injectStyle();
  const handler = (e: PointerEvent): void => {
    const b = (e.target as Element | null)?.closest?.(BOUNCY) as HTMLButtonElement | null;
    if (!b || b.disabled) return;
    onPress?.();
    if (reduceMotion() || typeof b.animate !== 'function') return;
    b.animate([{ scale: '1' }, { scale: '0.93', offset: 0.35 }, { scale: '1.03', offset: 0.7 }, { scale: '1' }], { duration: 220, easing: 'ease-out' });
  };
  root.addEventListener('pointerdown', handler);
  return () => root.removeEventListener('pointerdown', handler);
}

/** Petit « pop » de l'invite quand une nouvelle action devient possible. */
export function popPrompt(el: HTMLElement): void {
  injectStyle();
  bump(el, 0.7);
}

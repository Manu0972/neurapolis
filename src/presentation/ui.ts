/**
 * Interface DOM : HUD (horloge, date, 4 besoins), invite d'interaction,
 * panneau modal (lieu/dialogue), joystick et bouton d'action.
 */
import type { NeedId, WorldState } from '../core/types';
import { dateOf, dayIndexOf, hhmmOfTick } from '../core/clock';
import { NEED_LABELS } from '../data/places';
import { SAVE_LABEL } from '../data/texts';

export const NEED_IDS: readonly NeedId[] = ['fatigue', 'faim', 'stress', 'moral'];

export interface UiRefs {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  clockEl: HTMLElement;
  dateEl: HTMLElement;
  barEls: Record<NeedId, HTMLElement>;
  promptEl: HTMLElement;
  modalEl: HTMLElement;
  joyZone: HTMLElement;
  actionBtn: HTMLElement;
  navEl: HTMLElement; // écrans : personnage / relations / journal / conseil
  bannerEl: HTMLElement; // bandeau in-world teinté quand un fantôme parle
  saveEl: HTMLElement;   // « Sauvegardé » en fin de journée de jeu
  lastIso: string;       // dernière date affichée (détection du changement de jour)
  saveTimer: number | undefined;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function buildUi(root: HTMLElement): UiRefs {
  const canvas = el('canvas', 'map-canvas');
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible.');

  const hud = el('div', 'hud');
  const clockEl = el('div', 'hud-clock', '--:--');
  const dateEl = el('div', 'hud-date', '');
  hud.appendChild(clockEl);
  hud.appendChild(dateEl);
  const bars = el('div', 'hud-bars');
  const barEls = {} as Record<NeedId, HTMLElement>;
  for (const id of NEED_IDS) {
    const bar = el('div', 'need-bar');
    bar.appendChild(el('span', 'need-label', NEED_LABELS[id]));
    const track = el('div', 'need-track');
    const fill = el('div', 'need-fill');
    track.appendChild(fill);
    bar.appendChild(track);
    bars.appendChild(bar);
    barEls[id] = bar;
  }
  hud.appendChild(bars);
  root.appendChild(hud);

  const navEl = el('div', 'hud-nav');
  for (const label of ['Personnage', 'Relations', 'Journal', 'Projet', 'Conseil']) {
    navEl.appendChild(el('button', 'hud-nav-btn', label));
  }
  root.appendChild(navEl);

  const bannerEl = el('div', 'ghost-banner hidden', '');
  root.appendChild(bannerEl);

  const saveEl = el('div', 'save-toast hidden', SAVE_LABEL);
  root.appendChild(saveEl);

  const promptEl = el('div', 'interact-prompt hidden', '');
  root.appendChild(promptEl);

  const modalEl = el('div', 'modal hidden');
  root.appendChild(modalEl);

  const joyZone = el('div', 'joy-zone');
  const actionBtn = el('button', 'action-btn', 'E');
  root.appendChild(joyZone);
  root.appendChild(actionBtn);

  const ui: UiRefs = {
    canvas, ctx, cw: 0, ch: 0,
    clockEl, dateEl, barEls, promptEl, modalEl, joyZone, actionBtn, navEl, bannerEl,
    saveEl, lastIso: '', saveTimer: undefined,
  };
  resizeCanvas(ui, root);
  return ui;
}

export function resizeCanvas(ui: UiRefs, root: HTMLElement): void {
  ui.cw = root.clientWidth || window.innerWidth;
  ui.ch = root.clientHeight || window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ui.canvas.width = Math.round(ui.cw * dpr);
  ui.canvas.height = Math.round(ui.ch * dpr);
  ui.canvas.style.width = `${ui.cw}px`;
  ui.canvas.style.height = `${ui.ch}px`;
  ui.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function updateHud(ui: UiRefs, w: WorldState, prompt: string): void {
  const day = dayIndexOf(w.time.tick);
  ui.clockEl.textContent = hhmmOfTick(w.time.tick);
  ui.dateEl.textContent = dateOf(day).label;
  for (const id of NEED_IDS) {
    const fill = ui.barEls[id].querySelector<HTMLElement>('.need-fill');
    if (!fill) continue;
    const v = w.player.needs[id];
    fill.style.width = `${Math.round(v)}%`;
    fill.dataset.level = v > 70 ? 'high' : v < 30 ? 'low' : 'ok';
  }
  ui.promptEl.textContent = prompt;
  ui.promptEl.classList.toggle('hidden', prompt === '');
  // Indicateur de l'auto-sauvegarde de fin de journée (l'UI lit l'état, la
  // sauvegarde elle-même vit dans la simulation — engine.ts).
  const iso = dateOf(day).iso;
  if (ui.lastIso !== '' && iso !== ui.lastIso) {
    ui.saveEl.classList.remove('hidden');
    if (ui.saveTimer !== undefined) window.clearTimeout(ui.saveTimer);
    ui.saveTimer = window.setTimeout(() => ui.saveEl.classList.add('hidden'), 3000);
  }
  ui.lastIso = iso;
}

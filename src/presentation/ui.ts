/**
 * Interface DOM : HUD (horloge, date, 4 besoins), invite d'interaction,
 * panneau modal (lieu/dialogue), joystick et bouton d'action.
 */
import type { NeedId, WorldState } from '../core/types';
import { dateOf, dayIndexOf, hhmmOfTick } from '../core/clock';
import { NEED_LABELS } from '../data/places';
import { SAVE_LABEL } from '../data/texts';
import { getCampaignProgressSummary } from '../simulation/campaign';

export const NEED_IDS: readonly NeedId[] = ['fatigue', 'faim', 'stress', 'moral'];

export interface UiRefs {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  clockEl: HTMLElement;
  dateEl: HTMLElement;
  moneyEl: HTMLElement;
  newsTickerEl: HTMLElement;
  ghostCompanionWidgetEl: HTMLElement;
  campaignCardEl: HTMLElement;
  campaignChapterEl: HTMLElement;
  campaignObjectiveEl: HTMLElement;
  campaignPromptEl: HTMLElement;
  barEls: Record<NeedId, HTMLElement>;
  promptEl: HTMLElement;
  modalEl: HTMLElement;
  joyZone: HTMLElement;
  actionBtn: HTMLElement;
  navEl: HTMLElement; // écrans : personnage / relations / stratégie / entreprises / marchands / actualités / études / concurrence / conseil / journal
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

  // Barre supérieure Big Ambitions : horloge, trésorerie & actualités
  const topBar = el('div', 'hud-top-dashboard');
  topBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;margin-bottom:4px;';

  const clockEl = el('div', 'hud-clock', '--:--');
  const dateEl = el('div', 'hud-date', '');
  const moneyEl = el('div', 'hud-money', '💰 15.00 €');
  moneyEl.style.cssText = 'font-weight:700;color:var(--or);background:var(--panel2);padding:2px 6px;border-radius:4px;border:1px solid var(--line);font-size:11px;';

  const newsTickerEl = el('div', 'hud-news-ticker', '📰 Flash Info : Marché stable');
  newsTickerEl.style.cssText = 'flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px;color:var(--ink-muted);background:var(--panel2);padding:2px 6px;border-radius:4px;border:1px solid var(--line);cursor:pointer;';

  // Widget compagnon fantôme Kawaii
  const ghostCompanionWidgetEl = el('div', 'hud-ghost-companion', '👻 💬');
  ghostCompanionWidgetEl.style.cssText = 'display:flex;align-items:center;gap:4px;background:rgba(120,80,220,0.18);border:1px solid var(--violet);color:var(--ink);padding:2px 8px;border-radius:12px;font-size:11px;cursor:pointer;font-weight:600;';

  topBar.appendChild(clockEl);
  topBar.appendChild(dateEl);
  topBar.appendChild(moneyEl);
  topBar.appendChild(newsTickerEl);
  topBar.appendChild(ghostCompanionWidgetEl);
  hud.appendChild(topBar);

  const campaignCardEl = el('div', 'campaign-card');
  const campaignChapterEl = el('div', 'campaign-chapter', '');
  const campaignObjectiveEl = el('div', 'campaign-objective', '');
  const campaignPromptEl = el('div', 'campaign-prompt', '');
  campaignCardEl.appendChild(campaignChapterEl);
  campaignCardEl.appendChild(campaignObjectiveEl);
  campaignCardEl.appendChild(campaignPromptEl);
  hud.appendChild(campaignCardEl);

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

  // Contrôle de vitesse
  const speedRow = el('div', 'speed-row');
  speedRow.style.cssText = 'display:flex;gap:4px;margin-top:4px;pointer-events:auto;';
  for (const spd of [1, 5, 20]) {
    const btn = el('button', 'speed-btn', `×${spd}`);
    btn.dataset.speed = String(spd);
    btn.style.cssText = 'font-size:10px;padding:2px 6px;border-radius:3px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);cursor:pointer;font-weight:700;';
    speedRow.appendChild(btn);
  }
  hud.appendChild(speedRow);

  root.appendChild(hud);

  const navEl = el('div', 'hud-nav');
  navEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;';
  const navLabels = [
    'Personnage',
    'Relations',
    'Stratégie / Carte',
    'Entreprises & Rôles',
    'Marchands & Tiers',
    'Actualités & Chocs',
    'Études & Famille',
    'Projet',
    'Concurrence',
    'Conseil',
    'Journal',
  ];
  for (const label of navLabels) {
    const b = el('button', 'hud-nav-btn', label);
    b.dataset.nav = label;
    navEl.appendChild(b);
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
    clockEl, dateEl, moneyEl, newsTickerEl, ghostCompanionWidgetEl,
    campaignCardEl, campaignChapterEl, campaignObjectiveEl, campaignPromptEl,
    barEls, promptEl, modalEl, joyZone, actionBtn, navEl, bannerEl,
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
  ui.moneyEl.textContent = `💰 ${w.player.money.toFixed(2)} €`;

  if (w.macroNews && w.macroNews.feed[0]) {
    ui.newsTickerEl.textContent = `📰 ${w.macroNews.feed[0].headline}`;
  }

  if (w.ghostCompanion) {
    const emoji = w.ghostCompanion.activeGhostId === 'marx' ? '⚙️'
      : w.ghostCompanion.activeGhostId === 'ostrom' ? '🌱'
        : w.ghostCompanion.activeGhostId === 'taylor' ? '⏱️'
          : '📊';
    ui.ghostCompanionWidgetEl.textContent = `${emoji} « ${w.ghostCompanion.mood} »`;
    ui.ghostCompanionWidgetEl.title = `${w.ghostCompanion.speechBubble} (Clique pour un conseil)`;
  }

  const summary = getCampaignProgressSummary(w);
  ui.campaignChapterEl.textContent = summary.chapterLabel;
  ui.campaignObjectiveEl.textContent = summary.title;
  ui.campaignPromptEl.textContent = summary.prompt;

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

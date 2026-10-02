/**
 * Interface DOM : HUD (horloge, date, 4 besoins, dashboard Big Ambitions),
 * invite d'interaction, panneau modal (lieu/dialogue), joystick, bouton d'action,
 * et barre de contrôle de caméra 3D rotative & audio.
 */
import type { NeedId, WorldState } from '../core/types';
import { dateOf, dayIndexOf, hhmmOfTick } from '../core/clock';
import { NEED_LABELS } from '../data/places';
import { SAVE_LABEL } from '../data/texts';
import { getCampaignProgressSummary } from '../simulation/campaign';
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';

export const NEED_IDS: readonly NeedId[] = ['fatigue', 'faim', 'stress', 'moral'];

export const MOOD_EMOTICONS: Record<string, string> = {
  curieux: '🧐',
  enthousiaste: '✨',
  inquiet: '⚠️',
  tactique: '💡',
  malicieux: '😏',
};

export interface UiRefs {
  canvas: HTMLCanvasElement;
  canvas3d: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  clockEl: HTMLElement;
  dateEl: HTMLElement;
  moneyEl: HTMLElement;
  newsTickerEl: HTMLElement;
  ghostCompanionWidgetEl: HTMLElement;
  ghostAdviceBubbleEl: HTMLElement;
  ghostAdviceTimer?: number;
  campaignCardEl: HTMLElement;
  campaignChapterEl: HTMLElement;
  campaignObjectiveEl: HTMLElement;
  campaignPromptEl: HTMLElement;
  barEls: Record<NeedId, HTMLElement>;
  promptEl: HTMLElement;
  modalEl: HTMLElement;
  joyZone: HTMLElement;
  actionBtn: HTMLElement;
  navEl: HTMLElement; // navigation : personnage / relations / stratégie / entreprises / marchands / actualités / études / concurrence / conseil / journal
  bannerEl: HTMLElement; // bandeau in-world teinté quand un fantôme parle
  saveEl: HTMLElement;   // « Sauvegardé » en fin de journée de jeu
  cameraToolbarEl: HTMLElement; // barre de contrôle caméra 3D & audio
  btnRotLeft: HTMLButtonElement;
  btnRotRight: HTMLButtonElement;
  btnCamView: HTMLButtonElement;
  btnToggle3D: HTMLButtonElement;
  btnZoomIn: HTMLButtonElement;
  btnZoomOut: HTMLButtonElement;
  btnMuteAudio: HTMLButtonElement;
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
  // Canvas 2D Fallback
  const canvas = el('canvas', 'map-canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;image-rendering:pixelated;';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible.');

  // Canvas 3D WebGL
  const canvas3d = el('canvas', 'map-canvas-3d');
  canvas3d.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;';
  root.appendChild(canvas3d);

  const hud = el('div', 'hud');
  hud.style.zIndex = '10';

  // Barre supérieure Big Ambitions : horloge, trésorerie & actualités
  const topBar = el('div', 'hud-top-dashboard');
  topBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;margin-bottom:4px;';

  const clockEl = el('div', 'hud-clock', '--:--');
  const dateEl = el('div', 'hud-date', '');
  const moneyEl = el('div', 'hud-money', '💰 15.00 €');
  moneyEl.style.cssText = 'font-weight:700;color:var(--or);background:var(--panel2);padding:2px 6px;border-radius:4px;border:1px solid var(--line);font-size:11px;';

  const newsTickerEl = el('div', 'hud-news-ticker', '📰 Flash Info : Marché stable');
  newsTickerEl.style.cssText = 'flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px;color:var(--ink-muted);background:var(--panel2);padding:2px 6px;border-radius:4px;border:1px solid var(--line);cursor:pointer;';

  // Injection styles animations pour le compagnon fantôme
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes ghostFloatLevitation {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }
    @keyframes ghostPulseGlow {
      0%, 100% { box-shadow: 0 0 6px rgba(120, 80, 220, 0.25); }
      50% { box-shadow: 0 0 14px rgba(120, 80, 220, 0.65); }
    }
    @keyframes ghostBubblePop {
      0% { transform: translateY(8px) scale(0.92); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    .hud-ghost-companion:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 4px 14px rgba(120, 80, 220, 0.45);
    }
  `;
  root.appendChild(styleEl);

  // Widget compagnon fantôme Kawaii flottant
  const ghostCompanionWidgetEl = el('div', 'hud-ghost-companion', '👻 💬');
  ghostCompanionWidgetEl.style.cssText = 'display:flex;align-items:center;gap:6px;background:rgba(120,80,220,0.18);border:1.5px solid var(--violet);color:var(--ink);padding:3px 10px;border-radius:14px;font-size:11px;cursor:pointer;font-weight:600;box-shadow:0 0 8px rgba(120,80,220,0.25);animation:ghostFloatLevitation 2.6s ease-in-out infinite;transition:transform 0.2s,box-shadow 0.2s;user-select:none;';

  // Bulle d'avis flottante en temps réel
  const ghostAdviceBubbleEl = el('div', 'hud-ghost-advice-bubble hidden');
  ghostAdviceBubbleEl.style.cssText = 'position:absolute;top:44px;right:16px;max-width:320px;background:var(--panel);border:2px solid var(--violet);box-shadow:0 8px 24px rgba(42,26,20,0.4), 0 0 14px rgba(120,80,220,0.35);border-radius:10px;padding:10px 14px;font-size:11px;color:var(--ink);z-index:9999;pointer-events:auto;cursor:pointer;animation:ghostBubblePop 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);line-height:1.45;';

  topBar.appendChild(clockEl);
  topBar.appendChild(dateEl);
  topBar.appendChild(moneyEl);
  topBar.appendChild(newsTickerEl);
  topBar.appendChild(ghostCompanionWidgetEl);
  hud.appendChild(topBar);
  hud.appendChild(ghostAdviceBubbleEl);

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

  // Barre de contrôle Caméra 3D & Audio (coin supérieur droit)
  const cameraToolbarEl = el('div', 'camera-toolbar');
  cameraToolbarEl.style.cssText = 'position:fixed;top:10px;right:10px;display:flex;gap:4px;z-index:20;background:rgba(42,26,20,0.85);padding:4px 6px;border-radius:8px;border:1px solid var(--line);box-shadow:0 4px 12px rgba(0,0,0,0.3);';

  const btnRotLeft = el('button', 'cam-btn', '↺');
  btnRotLeft.title = 'Pivoter la caméra vers la gauche [R ou clic]';
  const btnRotRight = el('button', 'cam-btn', '↻');
  btnRotRight.title = 'Pivoter la caméra vers la droite [T ou clic]';
  const btnCamView = el('button', 'cam-btn', '📐 Iso');
  btnCamView.title = 'Basculer vue isométrique / vue du dessus';
  const btnZoomIn = el('button', 'cam-btn', '🔍+');
  btnZoomIn.title = 'Zoom avant';
  const btnZoomOut = el('button', 'cam-btn', '🔍-');
  btnZoomOut.title = 'Zoom arrière';
  const btnToggle3D = el('button', 'cam-btn', '🧊 3D');
  btnToggle3D.title = 'Basculer Rendu 3D WebGL / 2D Canvas';
  const btnMuteAudio = el('button', 'cam-btn', '🔊');
  btnMuteAudio.title = 'Activer / Couper le son';

  const camBtns = [btnRotLeft, btnRotRight, btnCamView, btnZoomIn, btnZoomOut, btnToggle3D, btnMuteAudio];
  for (const b of camBtns) {
    b.style.cssText = 'font-size:11px;font-weight:700;padding:4px 7px;border-radius:4px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);cursor:pointer;line-height:1;';
    cameraToolbarEl.appendChild(b);
  }
  root.appendChild(cameraToolbarEl);

  const navEl = el('div', 'hud-nav');
  navEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;z-index:10;';
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
  modalEl.style.zIndex = '30';
  root.appendChild(modalEl);

  const joyZone = el('div', 'joy-zone');
  const actionBtn = el('button', 'action-btn', 'E');
  root.appendChild(joyZone);
  root.appendChild(actionBtn);

  const ui: UiRefs = {
    canvas, canvas3d, ctx, cw: 0, ch: 0,
    clockEl, dateEl, moneyEl, newsTickerEl, ghostCompanionWidgetEl,
    ghostAdviceBubbleEl, ghostAdviceTimer: undefined,
    campaignCardEl, campaignChapterEl, campaignObjectiveEl, campaignPromptEl,
    barEls, promptEl, modalEl, joyZone, actionBtn, navEl, bannerEl,
    saveEl, cameraToolbarEl, btnRotLeft, btnRotRight, btnCamView, btnToggle3D,
    btnZoomIn, btnZoomOut, btnMuteAudio, lastIso: '', saveTimer: undefined,
  };
  resizeCanvas(ui, root);
  return ui;
}

export function showGhostAdvicePopup(
  ui: UiRefs,
  speaker: string,
  text: string,
  emoticon = '💡',
): void {
  if (!ui.ghostAdviceBubbleEl) return;
  ui.ghostAdviceBubbleEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:5px;border-bottom:1px solid rgba(120,80,220,0.25);padding-bottom:3px;">
      <span style="font-weight:700;color:var(--violet);font-size:11px;display:flex;align-items:center;gap:4px;">
        <span style="font-size:14px;display:inline-block;animation:ghostFloatLevitation 2s ease-in-out infinite;">${emoticon}</span> ${speaker}
      </span>
      <span style="font-size:9px;color:var(--ink-muted);font-style:italic;">Conseil en direct ✦</span>
    </div>
    <div style="font-size:11px;color:var(--ink);line-height:1.4;">${text}</div>
    <div style="margin-top:5px;text-align:right;font-size:9px;color:var(--ink-muted);">Clique pour ouvrir le Conseil</div>
  `;
  ui.ghostAdviceBubbleEl.classList.remove('hidden');
  if (ui.ghostAdviceTimer !== undefined) {
    window.clearTimeout(ui.ghostAdviceTimer);
  }
  ui.ghostAdviceTimer = window.setTimeout(() => {
    ui.ghostAdviceBubbleEl?.classList.add('hidden');
  }, 6500);
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

  if (ui.canvas3d) {
    ui.canvas3d.width = Math.round(ui.cw * dpr);
    ui.canvas3d.height = Math.round(ui.ch * dpr);
    ui.canvas3d.style.width = `${ui.cw}px`;
    ui.canvas3d.style.height = `${ui.ch}px`;
  }
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
    const emoticon = MOOD_EMOTICONS[w.ghostCompanion.mood] ?? '🧐';
    const ghostId = w.ghostCompanion.activeGhostId;
    const def = ghostId ? GHOST_DEFS_BY_ID[ghostId] : undefined;
    const ghostName = def?.name ?? 'Conseiller';
    ui.ghostCompanionWidgetEl.innerHTML = `<span style="font-size:13px;display:inline-block;animation:ghostFloatLevitation 2s ease-in-out infinite;">${emoticon}</span> <span>${ghostName}</span> <span style="opacity:0.85;font-size:10px;">« ${w.ghostCompanion.mood} »</span>`;
    ui.ghostCompanionWidgetEl.title = `${w.ghostCompanion.speechBubble ?? ''} (Clique pour un conseil)`;
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

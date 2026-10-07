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
  weatherEl: HTMLElement;
  bizEl: HTMLElement;
  phoneBtn: HTMLButtonElement;
  mapBtn: HTMLButtonElement;
  menuBtn: HTMLButtonElement;
  menuDrawer: HTMLElement;
  minimapCanvas: HTMLCanvasElement;
  minimapCtx: CanvasRenderingContext2D | null;
  streetEl: HTMLElement;
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

  // ---------- HUD épuré façon Big Ambitions (docs/VISION.md §5) ----------
  const hud = el('div', 'hud hud2');

  // Animations du compagnon fantôme.
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes ghostFloatLevitation { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
    @keyframes ghostBubblePop { 0% { transform: translateY(8px) scale(0.92); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
  `;
  root.appendChild(styleEl);

  // Carte d'état (haut gauche) : heure, date, météo, vitesse du temps.
  const status = el('div', 'hud2-status');
  const clockRow = el('div', 'hud2-clock-row');
  const clockEl = el('div', 'hud-clock', '--:--');
  const dateCol = el('div', 'hud2-date-col');
  const dateEl = el('div', 'hud-date', '');
  const weatherEl = el('div', 'hud2-weather', '');
  dateCol.appendChild(dateEl);
  dateCol.appendChild(weatherEl);
  clockRow.appendChild(clockEl);
  clockRow.appendChild(dateCol);
  status.appendChild(clockRow);
  const speedRow = el('div', 'speed-row');
  for (const [spd, label] of [[0, '⏸'], [1, '▶'], [5, '▶▶'], [20, '▶▶▶']] as const) {
    const btn = el('button', 'speed-btn', label);
    btn.dataset.speed = String(spd);
    btn.title = spd === 0 ? 'Pause' : `Vitesse ×${spd}`;
    speedRow.appendChild(btn);
  }
  status.appendChild(speedRow);
  hud.appendChild(status);

  // Besoins (sous la carte d'état).
  const NEED_ICONS: Record<NeedId, string> = { fatigue: '😴', faim: '🍽️', stress: '😣', moral: '🙂' };
  const bars = el('div', 'hud-bars hud2-needs');
  const barEls = {} as Record<NeedId, HTMLElement>;
  for (const id of NEED_IDS) {
    const bar = el('div', 'need-bar');
    bar.title = NEED_LABELS[id];
    bar.appendChild(el('span', 'need-label', `${NEED_ICONS[id]} ${NEED_LABELS[id]}`));
    const track = el('div', 'need-track');
    const fill = el('div', 'need-fill');
    track.appendChild(fill);
    bar.appendChild(track);
    bars.appendChild(bar);
    barEls[id] = bar;
  }
  hud.appendChild(bars);

  // Objectif de campagne (repliable d'un clic).
  const campaignCardEl = el('div', 'campaign-card');
  const campaignChapterEl = el('div', 'campaign-chapter', '');
  const campaignObjectiveEl = el('div', 'campaign-objective', '');
  const campaignPromptEl = el('div', 'campaign-prompt', '');
  campaignCardEl.appendChild(campaignChapterEl);
  campaignCardEl.appendChild(campaignObjectiveEl);
  campaignCardEl.appendChild(campaignPromptEl);
  campaignCardEl.title = 'Clique pour replier / déplier';
  campaignCardEl.addEventListener('click', () => campaignCardEl.classList.toggle('folded'));
  hud.appendChild(campaignCardEl);
  root.appendChild(hud);

  // Colonne droite : argent, affaires, téléphone, plan, menu, compagnon.
  const right = el('div', 'hud2-right');
  const moneyEl = el('div', 'hud-money', '15,00 €');
  const bizEl = el('div', 'hud2-biz hidden', '');
  const ghostCompanionWidgetEl = el('div', 'hud-ghost-companion', '👻 💬');
  const ghostAdviceBubbleEl = el('div', 'hud-ghost-advice-bubble hidden');
  const buttons = el('div', 'hud2-buttons');
  const phoneBtn = el('button', 'hud2-btn primary', '📱 Téléphone');
  phoneBtn.title = 'Téléphone [P]';
  const mapBtn = el('button', 'hud2-btn', '🗺️ Plan');
  mapBtn.title = 'Plan de la ville [M]';
  const menuBtn = el('button', 'hud2-btn', '☰');
  menuBtn.title = 'Tous les panneaux';
  buttons.appendChild(phoneBtn);
  buttons.appendChild(mapBtn);
  buttons.appendChild(menuBtn);
  right.appendChild(moneyEl);
  right.appendChild(bizEl);
  right.appendChild(buttons);
  right.appendChild(ghostCompanionWidgetEl);
  root.appendChild(right);
  root.appendChild(ghostAdviceBubbleEl);

  // Fil d'actualité discret (bas de l'écran).
  const newsTickerEl = el('div', 'hud-news-ticker', '📰 Flash Info : Marché stable');
  root.appendChild(newsTickerEl);

  // Tiroir « menu » : tous les panneaux historiques, caméra et son.
  const menuDrawer = el('div', 'hud2-drawer hidden');
  menuDrawer.appendChild(el('div', 'hud2-drawer-title', 'Panneaux'));
  const cameraToolbarEl = el('div', 'camera-toolbar');
  const btnRotLeft = el('button', 'cam-btn', '↺');
  btnRotLeft.title = 'Pivoter la caméra [R]';
  const btnRotRight = el('button', 'cam-btn', '↻');
  btnRotRight.title = 'Pivoter la caméra [T]';
  const btnCamView = el('button', 'cam-btn', '🎥 Rue');
  btnCamView.title = 'Vue rue / vue en plongée [V]';
  const btnZoomIn = el('button', 'cam-btn', '🔍+');
  btnZoomIn.title = 'Zoom avant (molette)';
  const btnZoomOut = el('button', 'cam-btn', '🔍−');
  btnZoomOut.title = 'Zoom arrière (molette)';
  const btnToggle3D = el('button', 'cam-btn', '🧊 3D');
  btnToggle3D.title = 'Rendu 3D / plan 2D de secours';
  const btnMuteAudio = el('button', 'cam-btn', '🔊');
  btnMuteAudio.title = 'Activer / couper le son';
  for (const b of [btnRotLeft, btnRotRight, btnCamView, btnZoomIn, btnZoomOut, btnToggle3D, btnMuteAudio]) cameraToolbarEl.appendChild(b);
  const navEl = el('div', 'hud-nav');
  const navLabels = [
    '💾 Sauvegardes',
    '📱 Téléphone',
    'Personnage',
    'Relations',
    'Stratégie / Carte',
    'Entreprises & Rôles',
    'Marchands & Tiers',
    'Actualités & Chocs',
    'Études & Famille',
    'Chambre & plans',
    'Projet',
    'Concurrence',
    'Conseil',
    'Journal',
  ];
  for (const label of navLabels) {
    const b = el('button', 'hud-nav-btn', label);
    b.dataset.nav = label;
    b.addEventListener('click', () => menuDrawer.classList.add('hidden'));
    navEl.appendChild(b);
  }
  menuDrawer.appendChild(navEl);
  menuDrawer.appendChild(el('div', 'hud2-drawer-title', 'Caméra et son'));
  menuDrawer.appendChild(cameraToolbarEl);
  menuDrawer.appendChild(el('p', 'hud2-help', 'ZQSD / WASD : marcher · Maj : courir · B : vélo · clic glissé : tourner la caméra · molette : zoom · E : interagir · P : téléphone · M : plan'));
  menuBtn.addEventListener('click', () => menuDrawer.classList.toggle('hidden'));
  root.appendChild(menuDrawer);

  // Mini-carte (bas gauche) et nom de la rue.
  const minimapWrap = el('div', 'hud2-minimap');
  const minimapCanvas = el('canvas', 'hud2-minimap-canvas');
  minimapCanvas.width = 360;
  minimapCanvas.height = 360;
  const minimapCtx = minimapCanvas.getContext('2d');
  const streetEl = el('div', 'hud2-street', '');
  minimapWrap.appendChild(minimapCanvas);
  minimapWrap.appendChild(streetEl);
  root.appendChild(minimapWrap);

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
    btnZoomIn, btnZoomOut, btnMuteAudio, weatherEl, bizEl, phoneBtn, mapBtn, menuBtn, menuDrawer,
    minimapCanvas, minimapCtx, streetEl, lastIso: '', saveTimer: undefined,
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

interface HudCache {
  clock?: string;
  date?: string;
  money?: string;
  headline?: string;
  companionKey?: string;
  campaignKey?: string;
  needsKey?: string;
  prompt?: string;
  weather?: string;
  biz?: string;
}

const hudCache = new WeakMap<UiRefs, HudCache>();

export function updateHud(ui: UiRefs, w: WorldState, prompt: string): void {
  let cache = hudCache.get(ui);
  if (!cache) {
    cache = {};
    hudCache.set(ui, cache);
  }

  const day = dayIndexOf(w.time.tick);
  const clockStr = hhmmOfTick(w.time.tick);
  if (cache.clock !== clockStr) {
    ui.clockEl.textContent = clockStr;
    cache.clock = clockStr;
  }

  const dateStr = dateOf(day).label;
  if (cache.date !== dateStr) {
    ui.dateEl.textContent = dateStr;
    cache.date = dateStr;
  }

  const moneyStr = `${w.player.money.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  if (cache.money !== moneyStr) {
    ui.moneyEl.textContent = moneyStr;
    cache.money = moneyStr;
  }

  const weatherStr = w.district.meteo === 'pluie' ? '🌧️ Pluie' : w.district.meteo === 'nuages' ? '⛅ Nuageux' : '☀️ Beau temps';
  if (cache.weather !== weatherStr) {
    ui.weatherEl.textContent = weatherStr;
    cache.weather = weatherStr;
  }
  const eco = w.economy;
  const bizStr = eco && Object.keys(eco.businesses).length > 0
    ? `🏪 ${Object.keys(eco.businesses).length} commerce(s) · caisses ${Object.values(eco.businesses).reduce((t, b) => t + b.cash, 0).toFixed(0)} €${eco.carried.length ? ` · 📦 ${eco.carried.reduce((t, c) => t + c.qty, 0)} u.` : ''}`
    : '';
  if (cache.biz !== bizStr) {
    ui.bizEl.textContent = bizStr;
    ui.bizEl.classList.toggle('hidden', bizStr === '');
    cache.biz = bizStr;
  }

  if (w.macroNews && w.macroNews.feed[0]) {
    const headlineStr = `📰 ${w.macroNews.feed[0].headline}`;
    if (cache.headline !== headlineStr) {
      ui.newsTickerEl.textContent = headlineStr;
      cache.headline = headlineStr;
    }
  }

  if (w.ghostCompanion) {
    const companionKey = `${w.ghostCompanion.activeGhostId}_${w.ghostCompanion.mood}_${w.ghostCompanion.speechBubble}`;
    if (cache.companionKey !== companionKey) {
      cache.companionKey = companionKey;
      const emoticon = MOOD_EMOTICONS[w.ghostCompanion.mood] ?? '🧐';
      const ghostId = w.ghostCompanion.activeGhostId;
      const def = ghostId ? GHOST_DEFS_BY_ID[ghostId] : undefined;
      const ghostName = def?.name ?? 'Conseiller';
      ui.ghostCompanionWidgetEl.innerHTML = `<span style="font-size:13px;display:inline-block;animation:ghostFloatLevitation 2s ease-in-out infinite;">${emoticon}</span> <span>${ghostName}</span> <span style="opacity:0.85;font-size:10px;">« ${w.ghostCompanion.mood} »</span>`;
      ui.ghostCompanionWidgetEl.title = `${w.ghostCompanion.speechBubble ?? ''} (Clique pour un conseil)`;
    }
  }

  const summary = getCampaignProgressSummary(w);
  const campaignKey = `${summary.chapterLabel}_${summary.title}_${summary.prompt}`;
  if (cache.campaignKey !== campaignKey) {
    cache.campaignKey = campaignKey;
    ui.campaignChapterEl.textContent = summary.chapterLabel;
    ui.campaignObjectiveEl.textContent = summary.title;
    ui.campaignPromptEl.textContent = summary.prompt;
  }

  const needsKey = `${Math.round(w.player.needs.fatigue)}_${Math.round(w.player.needs.faim)}_${Math.round(w.player.needs.stress)}_${Math.round(w.player.needs.moral)}`;
  if (cache.needsKey !== needsKey) {
    cache.needsKey = needsKey;
    for (const id of NEED_IDS) {
      const fill = ui.barEls[id]?.querySelector<HTMLElement>('.need-fill');
      if (!fill) continue;
      const v = w.player.needs[id];
      fill.style.width = `${Math.round(v)}%`;
      fill.dataset.level = v > 70 ? 'high' : v < 30 ? 'low' : 'ok';
    }
  }

  if (cache.prompt !== prompt) {
    cache.prompt = prompt;
    ui.promptEl.textContent = prompt;
    ui.promptEl.classList.toggle('hidden', prompt === '');
  }

  // Indicateur de l'auto-sauvegarde de fin de journée
  const iso = dateOf(day).iso;
  if (ui.lastIso !== '' && iso !== ui.lastIso) {
    ui.saveEl.classList.remove('hidden');
    if (ui.saveTimer !== undefined) window.clearTimeout(ui.saveTimer);
    ui.saveTimer = window.setTimeout(() => ui.saveEl.classList.add('hidden'), 3000);
  }
  ui.lastIso = iso;
}

/**
 * Missions façon GTA (vague 5) : bandeau unique en haut de l'écran, balise 3D au-dessus de la
 * cible, drapeau et flèche sur la mini-carte, flèche de bord d'écran quand la cible est hors champ,
 * action directe avec E une fois sur place, « MISSION ACCOMPLIE ! » à chaque étape franchie.
 * Dévoile aussi le HUD élément par élément (hud-reveal.ts).
 *
 * L'étape vient de src/simulation/missions.ts (lecture seule). Bandeau qui pulse au changement
 * d'étape et écran « MISSION ACCOMPLIE » de 1,5 s : idées reprises de CubeGO (MissionManager,
 * © 2024 Portalyze, licence MIT), réécrites aux couleurs de la DA (or chaud et brun, sans néon).
 */
import type { NpcId, PlaceId, WorldState } from '../core/types';
import { PLACE_BY_ID } from '../data/places';
import {
  MOVEMENT_LESSON_FLAG, currentMission, missionDistance, missionLine, missionTargetReached, needsMovementLesson,
  type MissionStep,
} from '../simulation/missions';
import { adoptSharedRules, buyStock, createProject, recruitMember, runCourse, runSalesSession } from '../simulation/project';
import { placeAtAdjacent } from '../simulation/interact';
import { isInClass } from '../simulation/family';
import { HUD_PARTS, hudSeenKey, nextHudReveal, type HudPart } from './hud-reveal';
import { TASK_MINUTES } from './time-pace';
import { setMissionMarker } from './minimap';
import { el } from './ui';

export interface MissionUiDeps {
  root: HTMLElement;
  /** Carte de chapitre détaillée (repliée derrière le bouton « Détails » du bandeau). */
  campaignCard: HTMLElement;
  inside: () => boolean;
  modalOpen: () => boolean;
  beacon: (t: { x: number; y: number; npc?: string } | null) => void;
  screenPos: (cw: number, ch: number) => { x: number; y: number; behind: boolean } | null;
  openNpcDialogue: (id: NpcId) => void;
  openConcurrence: () => void;
  openUrbanDebate: () => void;
  /** Menu « Passer le temps ». */
  openSkipMenu: () => void;
  /** Entrer dans un lieu (comme E devant sa porte). */
  enterPlace: (place: PlaceId) => void;
  spendTaskTime: (minutes: number, label: string) => void;
  toast: (text: string, ok: boolean) => void;
  celebrate?: (chapter: boolean) => void;
}

export interface MissionAction { label: string; run: () => void }

export interface MissionUi {
  /** Rafraîchit l'étape, le bandeau, les repères et le HUD (quelques fois par seconde). */
  sync(w: WorldState): void;
  /** Chaque image : flèche de bord d'écran et leçon de déplacement. */
  frame(w: WorldState, cw: number, ch: number): void;
  /** Action directe ciblée disponible ici (prioritaire sur les autres invites). */
  actionHere(w: WorldState): MissionAction | null;
  /** Action directe sans cible (dernier recours de la touche E, dehors). */
  actionAnywhere(w: WorldState): MissionAction | null;
  /** Étape affichée (QA). */
  current(): MissionStep | null;
}

let styled = false;
function injectStyle(): void {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style');
  s.id = 'mission-ui-style';
  s.textContent = `
.mission-top { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 14; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; gap: 6px; width: min(620px, calc(100vw - 32px)); }
@media (max-width: 1180px) { .mission-top { top: 82px; } }
.mission-banner { pointer-events: auto; box-sizing: border-box; width: 100%;
  display: flex; align-items: flex-start; gap: 10px; padding: 9px 14px;
  background: rgba(42, 26, 20, 0.92); border: 2px solid var(--or); border-radius: 14px; color: var(--ink);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35); }
.mission-banner.hidden { display: none; }
.mission-banner .mb-icon { font-size: 22px; line-height: 1.1; }
.mission-banner .mb-col { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.mission-banner .mb-text { font-size: 15.5px; font-weight: 800; line-height: 1.3; }
.mission-banner .mb-dist { color: var(--or); font-weight: 800; white-space: nowrap; }
.mission-banner .mb-detail { font-size: 12px; color: var(--ink-dim); line-height: 1.35; }
.mission-banner .mb-keys { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; font-size: 12px; }
.mission-banner .mb-keys kbd { display: inline-block; min-width: 20px; padding: 2px 6px; border-radius: 6px; text-align: center;
  background: var(--ink); color: var(--panel); border: 1px solid var(--line); box-shadow: 0 2px 0 var(--line); font: 800 12px system-ui, sans-serif; }
.mission-banner .mb-more { margin-left: auto; align-self: center; flex: none; padding: 4px 9px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255, 217, 138, 0.5); background: transparent; color: var(--or); font: 700 12px system-ui, sans-serif; }
.mission-banner .mb-more:hover { background: rgba(255, 217, 138, 0.14); }
.mission-banner.pulse { animation: missionPulse 1.6s ease-out 2; }
@keyframes missionPulse { 0% { box-shadow: 0 0 0 0 rgba(255, 217, 138, 0.55), 0 8px 22px rgba(0,0,0,0.35); }
  70% { box-shadow: 0 0 0 14px rgba(255, 217, 138, 0), 0 8px 22px rgba(0,0,0,0.35); } 100% { box-shadow: 0 8px 22px rgba(0,0,0,0.35); } }
.mission-reveal { max-width: 100%;
  padding: 7px 14px; border-radius: 10px; background: var(--ink); color: var(--panel); border: 1px solid var(--line);
  font-size: 13px; font-weight: 700; box-shadow: 0 6px 16px rgba(0,0,0,0.3); pointer-events: none; animation: ghostBubblePop 0.35s ease; }
.mission-reveal.hidden { display: none; }
.nm-new { outline: 3px solid var(--or); outline-offset: 2px; border-radius: 12px; }
.mission-done { position: fixed; inset: 0; z-index: 28; display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none; opacity: 0; transition: opacity 0.25s ease; }
.mission-done.show { opacity: 1; }
.mission-done .md-title { font: 900 clamp(30px, 6vw, 58px) system-ui, sans-serif; letter-spacing: 0.04em; color: var(--or);
  -webkit-text-stroke: 2px var(--line); text-shadow: 0 4px 0 var(--line), 0 0 26px rgba(255, 217, 138, 0.45); text-align: center; }
.mission-done.show .md-title { animation: missionGlow 1.5s ease-out; }
.mission-done .md-sub { margin-top: 6px; font: 700 16px system-ui, sans-serif; color: var(--ink); text-shadow: 0 2px 0 var(--line); text-align: center; padding: 0 16px; }
@keyframes missionGlow { 0% { transform: scale(0.8); } 18% { transform: scale(1.06); } 30% { transform: scale(1); } 100% { transform: scale(1); } }
.mission-arrow { position: fixed; z-index: 13; width: 0; height: 0; pointer-events: none; }
.mission-arrow.hidden { display: none; }
.mission-arrow .ma-body { position: absolute; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 50%;
  background: rgba(42, 26, 20, 0.85); border: 2px solid var(--or); display: flex; align-items: center; justify-content: center; }
.mission-arrow .ma-tip { width: 0; height: 0; border-top: 9px solid transparent; border-bottom: 9px solid transparent; border-left: 16px solid var(--or); margin-left: 4px; }
.mission-arrow .ma-dist { position: absolute; left: -30px; top: 24px; width: 60px; text-align: center; font: 800 11px system-ui, sans-serif;
  color: var(--ink); text-shadow: 0 1px 0 var(--line), 0 0 4px var(--line); }
.nm-veiled { display: none !important; }
@media (prefers-reduced-motion: reduce) { .mission-banner.pulse, .mission-done.show .md-title, .mission-reveal { animation: none; } }
`;
  document.head.appendChild(s);
}

/** Éléments du HUD couverts par chaque partie dévoilable. */
const PART_SELECTORS: Record<HudPart, string[]> = {
  argent: ['.hud2-right .hud-money', '.hud2-right .hud2-biz'],
  plan: ['.hud2-buttons .hud2-btn:nth-child(2)'],
  menu: ['.hud2-buttons .hud2-btn:nth-child(3)'],
  temps: ['.hud2-status .speed-row', '.hud2-status .task-toggle'],
  besoins: ['.hud2-needs'],
  telephone: ['.hud2-buttons .hud2-btn.primary'],
  conseil: ['.hud-ghost-companion', '.hud-ghost-advice-bubble', '.ghost-bar'],
  actus: ['.hud-news-ticker'],
};
const RIGHT_PARTS: HudPart[] = ['argent', 'plan', 'menu', 'telephone', 'conseil'];

/** Clavier AZERTY ou QWERTY : on affiche les touches que le joueur a réellement sous les doigts. */
function movementKeys(): string[] {
  const lang = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
  return /^fr|^be/i.test(lang) ? ['Z', 'Q', 'S', 'D'] : ['W', 'A', 'S', 'D'];
}

export function createMissionUi(deps: MissionUiDeps): MissionUi {
  injectStyle();
  const banner = el('div', 'mission-banner hidden');
  const icon = el('span', 'mb-icon', '🎯');
  const col = el('div', 'mb-col');
  const text = el('span', 'mb-text', '');
  const detail = el('span', 'mb-detail', '');
  const keys = el('div', 'mb-keys');
  const more = el('button', 'mb-more', 'Détails');
  more.type = 'button';
  more.title = 'Voir le chapitre en détail';
  col.append(text, detail, keys);
  banner.append(icon, col, more);
  const top = el('div', 'mission-top');
  top.appendChild(banner);
  deps.root.appendChild(top);
  const reveal = el('div', 'mission-reveal hidden', '');
  top.appendChild(reveal);
  const done = el('div', 'mission-done');
  const doneTitle = el('div', 'md-title', 'MISSION ACCOMPLIE !');
  const doneSub = el('div', 'md-sub', '');
  done.append(doneTitle, doneSub);
  deps.root.appendChild(done);
  const arrow = el('div', 'mission-arrow hidden');
  const arrowBody = el('div', 'ma-body');
  arrowBody.appendChild(el('div', 'ma-tip'));
  const arrowDist = el('div', 'ma-dist', '');
  arrow.append(arrowBody, arrowDist);
  deps.root.appendChild(arrow);

  // La carte de chapitre (et la ligne « Maintenant ») ne s'affiche que sur demande.
  let details = false;
  deps.campaignCard.classList.add('nm-veiled');
  more.addEventListener('click', () => {
    details = !details;
    deps.campaignCard.classList.toggle('nm-veiled', !details);
    deps.campaignCard.classList.remove('folded');
    more.textContent = details ? 'Masquer' : 'Détails';
  });

  let step: MissionStep | null = null;
  let key = '';
  let lastId = '';
  let lastChapter = -1;
  const maxRank = new Map<number, number>();
  let doneTimer: number | undefined;
  let revealUntil = 0;
  let firstSync = true;
  let start: { x: number; y: number } | null = null;

  function showDone(title: string, sub: string): void {
    doneTitle.textContent = title;
    doneSub.textContent = sub;
    done.classList.remove('show');
    void done.offsetWidth;
    done.classList.add('show');
    window.clearTimeout(doneTimer);
    doneTimer = window.setTimeout(() => done.classList.remove('show'), 1500);
  }

  function applyVeils(w: WorldState): void {
    for (const p of HUD_PARTS) {
      const hidden = !w.seen[hudSeenKey(p.id)];
      for (const sel of PART_SELECTORS[p.id]) {
        deps.root.querySelectorAll<HTMLElement>(sel).forEach((n) => n.classList.toggle('nm-veiled', hidden));
      }
    }
    const right = deps.root.querySelector<HTMLElement>('.hud2-right');
    right?.classList.toggle('nm-veiled', RIGHT_PARTS.every((p) => !w.seen[hudSeenKey(p)]));
  }

  function syncReveal(w: WorldState): void {
    const now = performance.now();
    if (now < revealUntil) return;
    // Écran voilé (nuit, cours) : la présentation suivante attend le réveil.
    if (!firstSync && (w.player.asleep || isInClass(w))) return;
    reveal.classList.add('hidden');
    deps.root.querySelectorAll('.nm-new').forEach((n) => n.classList.remove('nm-new'));
    // Partie avancée chargée : tout s'affiche d'un coup, sans phrases.
    let next = nextHudReveal(w, step);
    while (next && (next.silent || firstSync && w.campaign.currentChapter > 1)) {
      w.seen[hudSeenKey(next.part)] = true;
      next = nextHudReveal(w, step);
    }
    if (next) {
      w.seen[hudSeenKey(next.part)] = true;
      reveal.textContent = HUD_PARTS.find((p) => p.id === next!.part)?.intro ?? '';
      reveal.classList.remove('hidden');
      revealUntil = now + 6000;
      applyVeils(w);
      for (const sel of PART_SELECTORS[next.part]) deps.root.querySelectorAll(sel).forEach((n) => n.classList.add('nm-new'));
      return;
    }
    applyVeils(w);
  }

  function render(w: WorldState): void {
    const s = step;
    banner.classList.toggle('hidden', !s);
    if (!s) return;
    const dist = s.target && !deps.inside() && !missionTargetReached(w, s.target) ? missionDistance(w, s.target) : null;
    const k = `${s.id}|${missionLine(s)}|${s.detail ?? ''}|${dist ?? ''}`;
    if (k === key) return;
    key = k;
    icon.textContent = s.icon;
    text.textContent = missionLine(s);
    if (dist !== null) text.appendChild(el('span', 'mb-dist', ` · ${dist} m`));
    detail.textContent = s.detail ?? '';
    detail.style.display = s.detail ? '' : 'none';
    keys.replaceChildren();
    if (s.id === 'deplacement') {
      const add = (label: string, ...ks: string[]): void => {
        const span = el('span', '');
        for (const kk of ks) span.appendChild(el('kbd', '', kk));
        span.appendChild(document.createTextNode(` ${label}`));
        keys.appendChild(span);
      };
      add('marcher', ...movementKeys());
      add('ou flèches', '↑', '←', '↓', '→');
      add('courir', 'Maj');
      add('caméra : clic glissé + molette');
      add('agir', 'E');
    }
    keys.style.display = keys.childElementCount ? '' : 'none';
  }

  function runAction(w: WorldState, s: MissionStep): void {
    const a = s.action!;
    const say = (r: { ok: boolean; message: string }): void => deps.toast(r.message, r.ok);
    switch (a.do) {
      case 'acheter_stock': {
        if (!w.project?.active) createProject(w);
        const r = buyStock(w);
        if (r.ok) deps.spendTaskTime(TASK_MINUTES.economie, 'Achat du stock');
        say(r);
        break;
      }
      case 'tenir_stand': {
        const lieuIci = placeAtAdjacent(w);
        const ici = lieuIci === 'college' || lieuIci === 'lycee' ? lieuIci : 'place';
        const r = runSalesSession(w, ici);
        deps.spendTaskTime(60, 'Tenir le stand');
        say(r);
        break;
      }
      case 'parler': if (a.npc) deps.openNpcDialogue(a.npc); break;
      case 'recruter': if (a.npc) say(recruitMember(w, a.npc)); break;
      case 'course': {
        const r = runCourse(w);
        if (r.ok) deps.spendTaskTime(20, 'Course pour l’épicerie');
        say(r);
        break;
      }
      case 'regles': say(adoptSharedRules(w)); break;
      case 'debat': deps.openUrbanDebate(); break;
      case 'passer_temps': deps.openSkipMenu(); break;
      case 'contre_offensive': case 'conseil': case 'modele': deps.openConcurrence(); break;
    }
    api.sync(w);
  }

  const api: MissionUi = {
    current: () => step,
    sync(w: WorldState): void {
      // Fenêtre ou cinématique ouverte : « Mission accomplie », « Chapitre terminé » et les
      // présentations du HUD (téléphone…) attendent qu'on la ferme, sinon le joueur les rate.
      if (deps.modalOpen() && !firstSync) return;
      const s = currentMission(w, { inside: deps.inside() });
      const ch = w.campaign.currentChapter;
      // Étape franchie : rang supérieur à tout ce qui a déjà été vu dans ce chapitre.
      if (s && !firstSync) {
        if (lastChapter !== -1 && ch > lastChapter) {
          showDone('CHAPITRE TERMINÉ', `Chapitre ${lastChapter} accompli · le chapitre ${ch} commence`);
          deps.celebrate?.(true);
        } else if (s.rank >= 0 && s.rank > (maxRank.get(ch) ?? -1) && (maxRank.get(ch) ?? -1) >= 0 && s.id !== lastId) {
          showDone('MISSION ACCOMPLIE !', `Prochaine étape : ${s.text}`);
          deps.celebrate?.(false);
        }
      }
      if (s && s.rank >= 0) maxRank.set(ch, Math.max(maxRank.get(ch) ?? -1, s.rank));
      if (s && s.id !== lastId && lastId !== '') {
        banner.classList.remove('pulse');
        void banner.offsetWidth;
        banner.classList.add('pulse');
      }
      lastId = s?.id ?? '';
      lastChapter = ch;
      step = s;
      const t = s?.target && !deps.inside() ? s.target : null;
      deps.beacon(t ? { x: t.x, y: t.y, npc: t.kind === 'pnj' ? t.npc : undefined } : null);
      setMissionMarker(t);
      render(w);
      syncReveal(w);
      firstSync = false;
    },
    frame(w: WorldState, cw: number, ch: number): void {
      // Leçon de déplacement : réussie après quelques pas.
      if (needsMovementLesson(w)) {
        const p = w.player.pos;
        if (!start) start = { x: p.x, y: p.y };
        else if (Math.abs(p.x - start.x) + Math.abs(p.y - start.y) >= 3) w.seen[MOVEMENT_LESSON_FLAG] = true;
      }
      const s = step;
      const sp = s?.target && !deps.modalOpen() ? deps.screenPos(cw, ch) : null;
      const margin = 40;
      if (!s?.target || !sp || missionTargetReached(w, s.target)) { arrow.classList.add('hidden'); return; }
      const on = !sp.behind && sp.x >= margin && sp.x <= cw - margin && sp.y >= margin + 60 && sp.y <= ch - margin;
      if (on) { arrow.classList.add('hidden'); return; }
      // Flèche de bord : direction depuis le centre de l'écran, collée au cadre.
      const cx = cw / 2;
      const cy = ch / 2;
      let dx = sp.x - cx;
      let dy = sp.y - cy;
      if (sp.behind) { dx = -dx; dy = Math.abs(dy) < 1 ? ch : Math.abs(dy); }
      const kx = dx === 0 ? Infinity : (cw / 2 - margin) / Math.abs(dx);
      const ky = dy === 0 ? Infinity : (ch / 2 - margin - 30) / Math.abs(dy);
      const k = Math.min(kx, ky);
      arrow.style.left = `${cx + dx * k}px`;
      arrow.style.top = `${cy + dy * k}px`;
      arrowBody.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      arrowDist.textContent = `${missionDistance(w, s.target)} m`;
      arrow.classList.remove('hidden');
    },
    actionHere(w: WorldState): MissionAction | null {
      const s = step;
      // Attendre (passer le temps) : l'étape le demande, E le fait, où que tu sois dehors.
      if (s?.action && !s.target && s.kind === 'attendre' && !deps.inside()) return { label: `E — ${s.action.label}`, run: () => runAction(w, s) };
      if (!s?.target || deps.inside() || !missionTargetReached(w, s.target)) return null;
      if (!s.action) {
        // Cible sans action propre (rentrer chez soi, aller en cours) : E fait entrer, même à deux pas de la porte.
        const t = s.target;
        if (t.kind !== 'lieu' || t.place !== 'maison') return null; // ailleurs, l'invite du lieu (cours…) prime
        return { label: `E — Entrer : ${PLACE_BY_ID[t.place]?.name ?? t.place}`, run: () => deps.enterPlace(t.place) };
      }
      return { label: `E — ${s.action.label}`, run: () => runAction(w, s) };
    },
    actionAnywhere(w: WorldState): MissionAction | null {
      const s = step;
      // Étape sans lieu (règles, Conseil, modèle…) : faisable partout, même à l'intérieur.
      if (!s?.action || s.target) return null;
      return { label: `E — ${s.action.label}`, run: () => runAction(w, s) };
    },
  };
  return api;
}

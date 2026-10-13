/**
 * Mini-tutoriels portés par les fantômes (docs/ASCENSION.md §3.2, lot ASC-3) : quand une
 * application du téléphone s'ouvre, le fantôme qui la présente surgit avec trois étapes courtes.
 * Non bloquant, désactivable (même réglage que les astuces), rejouable depuis le téléphone.
 * Lit le monde ; n'écrit que l'état « vu » des tutoriels (`world.tutorials`).
 */
import type { WorldState } from '../core/types';
import { APP_TUTORIALS, INITIAL_TUTORIALS, appTutorialId } from '../data/tutorials';
import { APP_UNLOCKS, isAppOpen, type AppId } from '../simulation/unlocks';
import { ghostAvatar, thinkerMeta } from './ghost-avatar';
import { el } from './ui';

/** Même clé que les astuces contextuelles de game.ts : un seul interrupteur pour tout. */
export const TIPS_OFF_KEY = 'neurapolis.astuces.off';

export function tutorsOff(): boolean {
  try { return localStorage.getItem(TIPS_OFF_KEY) === '1'; } catch { return false; }
}

function setTutorsOff(): void {
  try { localStorage.setItem(TIPS_OFF_KEY, '1'); } catch { /* préférence non enregistrée */ }
}

export function appTutorialSeen(w: WorldState, app: string): boolean {
  return !!w.tutorials?.tutorials[appTutorialId(app)]?.seen;
}

export function markAppTutorialSeen(w: WorldState, app: string): void {
  if (!w.tutorials) w.tutorials = { tutorials: {} };
  const id = appTutorialId(app);
  const t = w.tutorials.tutorials[id] ?? structuredClone(INITIAL_TUTORIALS[id]);
  if (!t) return;
  t.seen = true;
  w.tutorials.tutorials[id] = t;
}

/** Faut-il présenter cette application maintenant ? (ouverte, jamais présentée, tutos actifs, pas en bac à sable). */
export function shouldPresent(w: WorldState, app: string): boolean {
  return !!APP_TUTORIALS[app] && !w.economy?.sandbox && !tutorsOff() && !appTutorialSeen(w, app) && isAppOpen(w, app as AppId);
}

let styled = false;
function injectStyle(): void {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style');
  s.id = 'ghost-tutor-style';
  s.textContent = `
.gt-card { display: flex; gap: 10px; align-items: flex-start; background: var(--panel); color: var(--ink);
  border: 3px solid var(--gc, var(--or)); border-radius: 16px; padding: 10px 12px; box-shadow: 0 8px 0 rgba(0,0,0,0.3); }
.gt-card.floating { position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%); z-index: 22;
  width: min(460px, calc(100vw - 32px)); animation: ghostBubblePop 0.3s ease; }
.gt-card.inline { margin: 0 0 8px; }
.gt-card.hidden { display: none; }
.gt-art { flex: 0 0 auto; line-height: 0; }
.gt-bubble { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.gt-head { font-size: 12px; color: var(--ink-dim); }
.gt-head b { color: var(--gc, var(--or)); filter: brightness(1.3); font-size: 13px; }
.gt-text { margin: 0; font-size: 14px; line-height: 1.4; }
.gt-foot { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.gt-dots { margin-right: auto; letter-spacing: 3px; font-size: 11px; color: var(--gc, var(--or)); }
.gt-off { align-self: flex-end; border: 0; background: transparent; color: var(--ink-dim); font-size: 11px; cursor: pointer; text-decoration: underline; padding: 0; }
@media (prefers-reduced-motion: reduce) { .gt-card.floating { animation: none; } }
`;
  document.head.appendChild(s);
}

export interface TutorCardOptions {
  /** Bouton « Ouvrir l'application » à la dernière étape (hors téléphone). */
  onOpen?: () => void;
  /** Fin (compris, passé ou désactivé). */
  onClose: () => void;
  inline?: boolean;
  /** Titre de l'en-tête : nouvelle application, ou simple rappel. */
  fresh?: boolean;
}

function btn(label: string, cls: string, run: () => void): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', (e) => { e.stopPropagation(); run(); });
  return b;
}

/** Étape en cours par application : un téléphone redessiné (achat, lancement…) ne relance pas le tuto au début. */
const tutorSteps = new Map<string, number>();

/** La carte du fantôme : son dessin, une étape à la fois, et de quoi passer. */
export function tutorCard(w: WorldState, app: string, opts: TutorCardOptions): HTMLElement {
  injectStyle();
  const t = APP_TUTORIALS[app]!;
  const meta = thinkerMeta(t.ghost);
  const card = el('div', `gt-card ${opts.inline ? 'inline' : 'floating'}`);
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', `${meta.name} présente ${t.label}`);
  card.style.setProperty('--gc', meta.color);
  const art = el('div', 'gt-art');
  art.appendChild(ghostAvatar(t.ghost, 'joie', opts.inline ? 44 : 60));
  card.appendChild(art);
  const bubble = el('div', 'gt-bubble');
  card.appendChild(bubble);
  let step = Math.min(tutorSteps.get(app) ?? 0, t.steps.length - 1);
  const done = (): void => { tutorSteps.delete(app); markAppTutorialSeen(w, app); opts.onClose(); };
  const draw = (): void => {
    bubble.replaceChildren();
    const head = el('div', 'gt-head');
    head.appendChild(el('b', '', meta.name));
    head.appendChild(document.createTextNode(` · ${opts.fresh ? '📱 Nouvelle application' : 'Application'} ${t.icon} ${t.label}`));
    bubble.appendChild(head);
    bubble.appendChild(el('p', 'gt-text', t.steps[step]));
    const foot = el('div', 'gt-foot');
    foot.appendChild(el('span', 'gt-dots', t.steps.map((_, i) => (i === step ? '●' : '○')).join('')));
    const last = step === t.steps.length - 1;
    if (!last) {
      foot.appendChild(btn('Passer', 'ph-btn', done));
      foot.appendChild(btn('Suivant ›', 'ph-btn primary', () => { step += 1; tutorSteps.set(app, step); draw(); }));
    } else {
      if (opts.onOpen) foot.appendChild(btn(`Ouvrir ${t.icon} ${t.label}`, 'ph-btn primary', () => { const go = opts.onOpen!; done(); go(); }));
      foot.appendChild(btn('Compris', opts.onOpen ? 'ph-btn' : 'ph-btn primary', done));
    }
    bubble.appendChild(foot);
    bubble.appendChild(btn('Ne plus afficher les tutos', 'gt-off', () => { setTutorsOff(); done(); }));
  };
  draw();
  return card;
}

export interface AppTutor {
  /** À appeler régulièrement : présente la prochaine application ouverte et jamais présentée. */
  sync(w: WorldState): void;
}

/**
 * Les applications gagnées en jouant (Immobilier, Commerces, Emploi, Banque) sont présentées hors
 * du téléphone, dès qu'aucune fenêtre n'est ouverte. Les applications de départ se présentent
 * dans le téléphone, à la première visite (phone.ts).
 */
export function createAppTutor(host: HTMLElement, deps: { busy: () => boolean; openApp: (app: AppId) => void }): AppTutor {
  let shown: { app: string; node: HTMLElement } | null = null;
  const close = (): void => { shown?.node.remove(); shown = null; };
  return {
    sync(w: WorldState): void {
      if (shown && (appTutorialSeen(w, shown.app) || tutorsOff())) close();
      if (shown || deps.busy()) return;
      const next = APP_UNLOCKS.find((u) => shouldPresent(w, u.id));
      if (!next) return;
      const app = next.id;
      const node = tutorCard(w, app, { fresh: true, onClose: close, onOpen: () => deps.openApp(app) });
      shown = { app, node };
      host.appendChild(node);
    },
  };
}

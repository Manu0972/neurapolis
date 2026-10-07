/**
 * Aide en jeu (V1.1, lot A) : bulle au survol (ou appui long au doigt) sur tout élément annoté
 * `data-help`, mode « ❓ Qu'est-ce que c'est ? » (bouton ou F1) où un clic explique au lieu d'agir,
 * et bouton ❓ dans les fenêtres qui ont une fiche. Lecture seule : rien ne touche au monde.
 */
import { CONTROL_HELP, SCREEN_HELP, type HelpEntry } from '../data/help/controls';

const HOVER_DELAY_MS = 450;
const LONG_PRESS_MS = 500;

/** Annote un élément : sa fiche d'aide remplace l'info-bulle native du navigateur. */
export function setHelp(element: HTMLElement, id: string): void {
  element.dataset.help = id;
  if (element.title) {
    if (!element.getAttribute('aria-label') && !element.textContent?.trim()) element.setAttribute('aria-label', element.title);
    element.removeAttribute('title');
  }
}

export function helpFor(id: string): HelpEntry | undefined {
  return CONTROL_HELP[id];
}

export function screenHelpFor(title: string): HelpEntry | undefined {
  return SCREEN_HELP[title];
}

function fill(bubble: HTMLElement, entry: HelpEntry, hint?: string): void {
  bubble.replaceChildren();
  const head = document.createElement('div');
  head.className = 'help-bubble-title';
  head.textContent = entry.title;
  if (entry.key) {
    const key = document.createElement('kbd');
    key.textContent = entry.key;
    head.appendChild(key);
  }
  const body = document.createElement('p');
  body.className = 'help-bubble-body';
  body.textContent = entry.body;
  bubble.append(head, body);
  if (hint) {
    const h = document.createElement('p');
    h.className = 'help-bubble-hint';
    h.textContent = hint;
    bubble.appendChild(h);
  }
}

/** Place la bulle près de l'élément, sans sortir de l'écran. */
function place(bubble: HTMLElement, target: Element): void {
  const r = target.getBoundingClientRect();
  bubble.style.left = '0px';
  bubble.style.top = '0px';
  bubble.classList.remove('hidden');
  const b = bubble.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let x = r.left + r.width / 2 - b.width / 2;
  x = Math.max(8, Math.min(vw - b.width - 8, x));
  let y = r.bottom + 8;
  if (y + b.height > vh - 8) y = r.top - b.height - 8;
  y = Math.max(8, y);
  bubble.style.left = `${Math.round(x)}px`;
  bubble.style.top = `${Math.round(y)}px`;
}

export interface HelpController {
  /** Bouton ❓ à placer dans l'interface. */
  button: HTMLButtonElement;
  toggleMode(on?: boolean): void;
  readonly modeOn: boolean;
  /** Ajoute un ❓ à l'en-tête d'une fenêtre si son titre a une fiche. */
  decorateModal(head: HTMLElement, title: string): void;
  dispose(): void;
}

export function installHelp(root: HTMLElement): HelpController {
  const bubble = document.createElement('div');
  bubble.className = 'help-bubble hidden';
  bubble.setAttribute('role', 'tooltip');
  root.appendChild(bubble);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hud2-btn help-btn';
  button.textContent = '❓';
  setHelp(button, 'help-btn');

  let modeOn = false;
  let pinned = false;
  let hoverTimer: number | undefined;
  let pressTimer: number | undefined;
  let suppressClick = false;

  const hide = (): void => {
    bubble.classList.add('hidden');
    pinned = false;
  };
  const show = (target: Element, entry: HelpEntry, pin: boolean, hint?: string): void => {
    fill(bubble, entry, hint);
    place(bubble, target);
    pinned = pin;
    // Une bulle de survol ne doit jamais bloquer un clic ; une bulle épinglée reste cliquable.
    bubble.classList.toggle('pinned', pin);
  };
  const helpTarget = (t: EventTarget | null): HTMLElement | null =>
    t instanceof Element ? (t.closest('[data-help]') as HTMLElement | null) : null;

  const toggleMode = (on = !modeOn): void => {
    modeOn = on;
    root.classList.toggle('help-mode', modeOn);
    button.classList.toggle('on', modeOn);
    if (modeOn) {
      show(button, { title: 'Mode aide', body: 'Clique sur un bouton, une jauge ou un panneau pour savoir à quoi il sert. Échap ou ❓ pour sortir.' }, true);
    } else hide();
  };

  const onOver = (e: PointerEvent): void => {
    if (e.pointerType === 'touch' || pinned) return;
    window.clearTimeout(hoverTimer);
    const t = helpTarget(e.target);
    if (!t) {
      if (!modeOn) hide();
      return;
    }
    const entry = CONTROL_HELP[t.dataset.help ?? ''];
    if (!entry) return;
    hoverTimer = window.setTimeout(() => show(t, entry, false), modeOn ? 0 : HOVER_DELAY_MS);
  };
  const onOut = (e: PointerEvent): void => {
    if (pinned) return;
    const t = helpTarget(e.target);
    if (t && e.relatedTarget instanceof Node && t.contains(e.relatedTarget)) return;
    window.clearTimeout(hoverTimer);
    hide();
  };
  // Appui long au doigt : la fiche s'affiche et le clic qui suit est annulé.
  const onDown = (e: PointerEvent): void => {
    if (e.pointerType !== 'touch') return;
    const t = helpTarget(e.target);
    if (!t) return;
    const entry = CONTROL_HELP[t.dataset.help ?? ''];
    if (!entry) return;
    window.clearTimeout(pressTimer);
    pressTimer = window.setTimeout(() => {
      suppressClick = true;
      show(t, entry, true, 'Touche ailleurs pour fermer.');
    }, LONG_PRESS_MS);
  };
  const onUp = (): void => window.clearTimeout(pressTimer);
  // Phase de capture : en mode aide, le clic explique au lieu d'agir.
  const onClick = (e: MouseEvent): void => {
    if (e.target === button || (e.target instanceof Node && button.contains(e.target))) {
      e.stopPropagation();
      toggleMode();
      return;
    }
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!modeOn) {
      window.clearTimeout(hoverTimer);
      if (!pinned || !(e.target instanceof Node && bubble.contains(e.target))) hide();
      return;
    }
    if (e.target instanceof Node && bubble.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    const t = helpTarget(e.target);
    const entry = t ? CONTROL_HELP[t.dataset.help ?? ''] : undefined;
    if (t && entry) show(t, entry, true, 'Clique sur autre chose, ou Échap pour sortir du mode aide.');
    else if (e.target instanceof Element) show(e.target, { title: 'Pas de fiche ici', body: 'Essaie un bouton, une jauge ou un panneau de l’interface.' }, true);
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'F1') {
      e.preventDefault();
      toggleMode();
    } else if (e.code === 'Escape' && (modeOn || pinned)) {
      if (modeOn) {
        e.stopImmediatePropagation();
        toggleMode(false);
      } else hide();
    }
  };

  root.addEventListener('pointerover', onOver);
  root.addEventListener('pointerout', onOut);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('click', onClick, true);
  window.addEventListener('keydown', onKey, true);

  return {
    button,
    toggleMode,
    get modeOn() { return modeOn; },
    decorateModal(head: HTMLElement, title: string): void {
      const entry = SCREEN_HELP[title];
      if (!entry) return;
      const q = document.createElement('button');
      q.type = 'button';
      q.className = 'modal-help';
      q.textContent = '❓';
      q.setAttribute('aria-label', `Aide : ${entry.title}`);
      q.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pinned) hide();
        else show(q, entry, true);
      });
      head.appendChild(q);
    },
    dispose(): void {
      window.clearTimeout(hoverTimer);
      window.clearTimeout(pressTimer);
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerout', onOut);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
      bubble.remove();
    },
  };
}

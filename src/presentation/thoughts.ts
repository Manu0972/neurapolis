/**
 * Onglet 🎯 Objectifs (haut gauche) et voix de la pensée (V1.1).
 * Lit `currentHints` (simulation) : l'onglet liste ce qui compte maintenant, avec « 🧭 Y aller » ;
 * la pensée la plus importante s'affiche en bulle 💭 et se fait entendre (synthèse vocale du
 * système, en attendant Piper dans l'application). Préférence (voix / texte / rien) gardée dans
 * le navigateur, pas dans la sauvegarde.
 */
import type { WorldState } from '../core/types';
import { currentHints, type Hint, type HintContext, type HintTarget } from '../simulation/hints';
import { setHelp } from './help';

type ThoughtMode = 'voix' | 'texte' | 'off';
const MODE_KEY = 'neurapolis:pensees';
/** Écart minimal entre deux pensées, et avant de répéter la même (ms réelles). */
const GAP_MS = 45_000;
const REPEAT_MS = 4 * 60_000;
const SHOW_MS = 7_000;

function readMode(): ThoughtMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === 'voix' || v === 'texte' || v === 'off') return v;
  } catch { /* stockage indisponible */ }
  return 'voix';
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export interface ThoughtDeps {
  world: WorldState;
  context: () => HintContext;
  /** Voix plus aiguë chez les plus jeunes. */
  age: () => number;
  busy: () => boolean;
  goTo: (t: HintTarget) => void;
}

export class Thoughts {
  readonly button: HTMLButtonElement;
  readonly panel: HTMLElement;
  readonly bubble: HTMLElement;
  private mode: ThoughtMode = readMode();
  private lastShown = 0;
  private shownAt = new Map<string, number>();
  private hideTimer: number | undefined;
  private lastCheck = 0;
  private listKey = '';

  constructor(private readonly deps: ThoughtDeps) {
    // Première pensée une dizaine de secondes après l'arrivée en ville.
    this.lastShown = performance.now() - GAP_MS + 10_000;
    this.button = el('button', 'task-toggle objectives-btn', '🎯 Objectifs');
    this.button.type = 'button';
    setHelp(this.button, 'objectives');
    this.panel = el('div', 'objectives-panel hidden');
    this.bubble = el('div', 'thought-bubble hidden');
    this.bubble.setAttribute('role', 'status');
    setHelp(this.bubble, 'thought');
    this.button.addEventListener('click', () => {
      this.panel.classList.toggle('hidden');
      this.listKey = '';
      this.renderPanel();
    });
  }

  private hints(): Hint[] {
    return currentHints(this.deps.world, this.deps.context());
  }

  private renderPanel(): void {
    if (this.panel.classList.contains('hidden')) return;
    const hints = this.hints();
    const key = hints.map((h) => h.id + h.objective).join('|') + this.mode;
    if (key === this.listKey) return;
    this.listKey = key;
    this.panel.replaceChildren();
    for (const h of hints) {
      const row = el('div', `objective-row p${h.priority}`);
      row.appendChild(el('span', 'objective-icon', h.icon));
      row.appendChild(el('span', 'objective-text', h.objective));
      if (h.target) {
        const go = el('button', 'objective-go', '🧭 Y aller');
        go.type = 'button';
        const t = h.target;
        go.addEventListener('click', () => { this.deps.goTo(t); this.panel.classList.add('hidden'); });
        row.appendChild(go);
      }
      this.panel.appendChild(row);
    }
    // Réglage de la pensée : voix, texte seul, ou rien.
    const modes = el('div', 'objective-modes');
    modes.appendChild(el('span', 'objective-modes-label', '💭 Pensées :'));
    for (const [m, label] of [['voix', '🔊 voix'], ['texte', '💬 texte'], ['off', '🔇 aucune']] as const) {
      const b = el('button', `objective-mode${m === this.mode ? ' on' : ''}`, label);
      b.type = 'button';
      b.addEventListener('click', () => {
        this.mode = m;
        try { localStorage.setItem(MODE_KEY, m); } catch { /* stockage indisponible */ }
        if (m !== 'voix') this.stopVoice();
        this.listKey = '';
        this.renderPanel();
      });
      modes.appendChild(b);
    }
    this.panel.appendChild(modes);
  }

  /** Boucle de jeu : met l'onglet à jour et laisse venir une pensée de temps en temps. */
  tick(now: number): void {
    if (now - this.lastCheck < 1500) return;
    this.lastCheck = now;
    this.renderPanel();
    if (this.mode === 'off' || this.deps.busy() || now - this.lastShown < GAP_MS) return;
    const next = this.hints().find((h) => now - (this.shownAt.get(h.id) ?? -Infinity) > REPEAT_MS);
    if (!next) return;
    // Une idée en passant (priorité 1-2) n'interrompt pas toutes les 45 s : on espace davantage.
    if (next.priority <= 2 && now - this.lastShown < GAP_MS * 3) return;
    this.say(next, now);
  }

  private say(h: Hint, now: number): void {
    this.lastShown = now;
    this.shownAt.set(h.id, now);
    this.bubble.textContent = `💭 ${h.thought}`;
    this.bubble.classList.remove('hidden');
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => this.bubble.classList.add('hidden'), SHOW_MS);
    if (this.mode === 'voix') this.speak(h.thought);
  }

  private speak(text: string): void {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR';
      const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('fr'));
      if (voice) u.voice = voice;
      const age = this.deps.age();
      u.pitch = age < 15 ? 1.35 : age < 18 ? 1.15 : 1;
      u.rate = 1.05;
      u.volume = 0.9;
      synth.speak(u);
    } catch { /* synthèse vocale indisponible : la bulle suffit */ }
  }

  private stopVoice(): void {
    try { window.speechSynthesis?.cancel(); } catch { /* rien */ }
  }

  dispose(): void {
    window.clearTimeout(this.hideTimer);
    this.stopVoice();
  }
}

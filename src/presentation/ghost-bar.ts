/**
 * Barre des fantômes (vision utilisateur du 2026-10-07) : leurs petites têtes en haut de
 * l'écran, comme des boutons. Quand l'un d'eux veut parler, sa tête bouge et une pastille
 * apparaît ; les messages importants surgissent en petit dessin qui parle (pop-up).
 * On peut aussi aller les chercher : un clic sur une tête ouvre ce qu'il a à dire.
 */
import type { WorldState } from '../core/types';
import { adviceFor } from '../simulation/ghost_tips';
import { isSilenced } from '../simulation/rewind';
import { dayIndexOf } from '../core/clock';
import { ghostAvatar, thinkerMeta, type GhostMood } from './ghost-avatar';
import { el } from './ui';

export interface Whisper {
  ghost: string;
  text: string;
  mood?: GhostMood;
  /** Surgir en pop-up (sinon : la tête bouge et une pastille s'allume). */
  pop?: boolean;
  action?: { label: string; run: () => void };
}

export interface GhostBar {
  root: HTMLElement;
  push(w: Whisper): void;
  /** Recalcule les têtes présentes (Conseil + penseurs rencontrés). */
  sync(world: WorldState): void;
  /** Fantômes visibles dans la barre, dans l'ordre. */
  roster(): string[];
}

const MAX_HEADS = 9;
const POP_MS = 9000;
const POP_COOLDOWN_MS = 12000;

export function createGhostBar(host: HTMLElement, getWorld: () => WorldState, isBusy: () => boolean): GhostBar {
  const root = el('div', 'ghost-bar');
  root.setAttribute('role', 'toolbar');
  root.setAttribute('aria-label', 'Tes fantômes');
  const pop = el('div', 'ghost-pop hidden');
  pop.setAttribute('role', 'status');
  const panel = el('div', 'ghost-panel hidden');
  host.appendChild(root);
  host.appendChild(pop);
  host.appendChild(panel);

  const inbox = new Map<string, Whisper[]>();
  const heads = new Map<string, HTMLButtonElement>();
  let order: string[] = [];
  let orderKey = '';
  let popTimer: number | undefined;
  let lastPop = 0;
  const popQueue: Whisper[] = [];

  function present(world: WorldState): string[] {
    const council = Object.values(world.council.ghosts)
      .filter((g) => g.status === 'actif' || g.status === 'endormi')
      .sort((a, b) => (a.status === b.status ? b.loyalty - a.loyalty : a.status === 'actif' ? -1 : 1))
      .map((g) => g.id);
    const met = Object.keys(world.ascension?.trust ?? {});
    // La première voix (celle de la nuit de la médiathèque) est là dès le début.
    const first = world.ghostCompanion?.unlockedThinkers ?? ['smith'];
    // Les voix sacrifiées pour un retour en arrière restent visibles, endormies et muettes.
    return [...new Set([...council, ...first, ...met])].slice(0, MAX_HEADS);
  }

  function badge(id: string): void {
    const h = heads.get(id);
    if (!h) return;
    const n = inbox.get(id)?.length ?? 0;
    h.classList.toggle('wants', n > 0);
    const b = h.querySelector('.ghost-badge');
    if (b) b.textContent = n > 0 ? String(Math.min(n, 9)) : '';
  }

  function sync(world: WorldState): void {
    const next = present(world);
    const asleep = new Set(Object.values(world.council.ghosts).filter((g) => g.status === 'endormi').map((g) => g.id));
    for (const id of next) if (isSilenced(world, id)) asleep.add(id);
    const key = `${next.join()}|${[...asleep].sort().join()}`;
    if (key !== orderKey) {
      orderKey = key;
      order = next;
      root.replaceChildren();
      heads.clear();
      for (const id of order) {
        const m = thinkerMeta(id);
        const b = el('button', 'ghost-head');
        b.type = 'button';
        b.title = `${m.name} — clique pour l’écouter`;
        b.appendChild(ghostAvatar(id, asleep.has(id) ? 'dort' : 'calme', 36));
        b.appendChild(el('span', 'ghost-badge', ''));
        b.addEventListener('click', () => openPanel(id));
        heads.set(id, b);
        root.appendChild(b);
        badge(id);
      }
    }
    for (const [id, h] of heads) h.classList.toggle('asleep', asleep.has(id));
  }

  function hidePop(): void {
    pop.classList.add('hidden');
    if (popTimer !== undefined) window.clearTimeout(popTimer);
    popTimer = undefined;
    const next = popQueue.shift();
    if (next) window.setTimeout(() => showPop(next), 600);
  }

  function showPop(w: Whisper): void {
    if (isBusy() || performance.now() - lastPop < POP_COOLDOWN_MS || !pop.classList.contains('hidden')) {
      if (!popQueue.includes(w)) popQueue.push(w);
      return;
    }
    lastPop = performance.now();
    const m = thinkerMeta(w.ghost);
    pop.replaceChildren();
    pop.style.setProperty('--gc', m.color);
    const art = el('div', 'ghost-pop-art');
    art.appendChild(ghostAvatar(w.ghost, w.mood ?? 'calme', 64));
    pop.appendChild(art);
    const bubble = el('div', 'ghost-pop-bubble');
    bubble.appendChild(el('div', 'ghost-pop-name', m.name));
    bubble.appendChild(el('p', 'ghost-pop-text', w.text));
    const row = el('div', 'ghost-pop-actions');
    if (w.action) {
      const a = el('button', 'ph-btn primary', w.action.label);
      a.type = 'button';
      a.addEventListener('click', () => { w.action!.run(); read(w); hidePop(); });
      row.appendChild(a);
    }
    const ok = el('button', 'ph-btn', 'Compris');
    ok.type = 'button';
    ok.addEventListener('click', () => { read(w); hidePop(); });
    row.appendChild(ok);
    bubble.appendChild(row);
    pop.appendChild(bubble);
    pop.classList.remove('hidden');
    heads.get(w.ghost)?.classList.add('talking');
    popTimer = window.setTimeout(() => { heads.get(w.ghost)?.classList.remove('talking'); hidePop(); }, POP_MS);
  }

  function read(w: Whisper): void {
    const list = inbox.get(w.ghost);
    if (!list) return;
    const i = list.indexOf(w);
    if (i >= 0) list.splice(i, 1);
    badge(w.ghost);
    heads.get(w.ghost)?.classList.remove('talking');
  }

  function openPanel(id: string): void {
    const world = getWorld();
    const m = thinkerMeta(id);
    const silence = (world.rewind?.sacrifices ?? []).find((x) => x.ghost === id && !x.returned && isSilenced(world, id));
    panel.replaceChildren();
    panel.style.setProperty('--gc', m.color);
    const head = el('div', 'ghost-panel-head');
    head.appendChild(ghostAvatar(id, 'joie', 52));
    head.appendChild(el('div', 'ghost-pop-name', m.name));
    const close = el('button', 'ghost-panel-close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', 'Fermer');
    close.addEventListener('click', () => panel.classList.add('hidden'));
    head.appendChild(close);
    panel.appendChild(head);
    const list = inbox.get(id) ?? [];
    for (const w of list.slice(-5).reverse()) {
      const item = el('div', 'ghost-panel-item');
      item.appendChild(el('p', 'ghost-pop-text', w.text));
      if (w.action) {
        const a = el('button', 'ph-btn primary', w.action.label);
        a.type = 'button';
        a.addEventListener('click', () => { w.action!.run(); panel.classList.add('hidden'); });
        item.appendChild(a);
      }
      panel.appendChild(item);
    }
    inbox.set(id, []);
    badge(id);
    if (silence) {
      panel.appendChild(el('p', 'ghost-pop-text', `Sa voix s’est éteinte pour te ramener en arrière. Elle reviendra dans ${silence.untilDay - dayIndexOf(world.time.tick)} jours.`));
      panel.classList.remove('hidden');
      return;
    }
    const ask = el('button', 'ph-btn', '💬 Que penses-tu de ma situation ?');
    ask.type = 'button';
    const answer = el('p', 'ghost-pop-text ghost-answer', '');
    ask.addEventListener('click', () => {
      const t = adviceFor(world, id);
      answer.textContent = t ? t.text : `${m.name} t’observe en silence. Rien ne l’inquiète pour l’instant.`;
    });
    panel.appendChild(ask);
    panel.appendChild(answer);
    if (list.length === 0) answer.textContent = 'Pas de message en attente. Tu peux lui demander son avis.';
    panel.classList.remove('hidden');
  }

  function push(w: Whisper): void {
    const list = inbox.get(w.ghost) ?? [];
    list.push(w);
    if (list.length > 12) list.splice(0, list.length - 12);
    inbox.set(w.ghost, list);
    badge(w.ghost);
    if (w.pop) showPop(w);
  }

  // Les pop-up mis en attente pendant une fenêtre ouverte ressortent ensuite.
  window.setInterval(() => {
    if (!isBusy() && popQueue.length > 0 && pop.classList.contains('hidden')) showPop(popQueue.shift()!);
  }, 1500);

  return { root, push, sync, roster: () => order.slice() };
}

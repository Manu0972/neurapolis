/**
 * Le récit à l'écran : la scène d'origine en plein écran (page après page, jusqu'à la première
 * voix), la lecture d'un cahier de Lucien, et les « Carnets » pour relire.
 */
import type { WorldState } from '../core/types';
import type { StoryBeat } from '../core/story_types';
import { dateOf } from '../core/clock';
import { BEATS, BEAT_BY_ID, ORIGIN } from '../data/story_registry';
import { ensureStory, finishOrigin, markRead, personalize } from '../simulation/story';
import { ghostAvatar, thinkerMeta } from './ghost-avatar';
import { el } from './ui';

export interface StoryCtx {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
}

/** La nuit de la Maison du Peuple, en plein écran. */
export function playOrigin(host: HTMLElement, w: WorldState, done: () => void): void {
  const b = ORIGIN;
  const root = el('div', 'origin');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', b.title);
  const rain = el('div', 'origin-rain');
  root.appendChild(rain);
  const card = el('div', 'origin-card');
  const title = el('div', 'origin-title', b.title);
  const text = el('p', 'origin-text', '');
  const art = el('div', 'origin-art');
  const note = el('p', 'origin-note', '');
  const row = el('div', 'origin-actions');
  const skip = el('button', 'ph-btn', 'Passer');
  skip.type = 'button';
  const next = el('button', 'ph-btn primary', 'Continuer');
  next.type = 'button';
  row.appendChild(skip);
  row.appendChild(next);
  card.appendChild(title);
  card.appendChild(art);
  card.appendChild(text);
  card.appendChild(note);
  card.appendChild(row);
  root.appendChild(card);
  host.appendChild(root);
  let i = 0;
  const finish = (): void => {
    finishOrigin(w);
    root.classList.add('leaving');
    window.setTimeout(() => { root.remove(); done(); }, 600);
  };
  const show = (): void => {
    text.classList.remove('in');
    void text.offsetWidth; // relance le fondu
    text.textContent = personalize(w, b.pages[i]!);
    text.classList.add('in');
    root.classList.toggle('flash', i === 2);
    const last = i === b.pages.length - 1;
    art.replaceChildren();
    if (last && b.ghost) {
      art.appendChild(ghostAvatar(b.ghost, 'joie', 96));
      art.appendChild(el('div', 'origin-ghost-name', thinkerMeta(b.ghost).name));
      note.textContent = b.note ? personalize(w, b.note) : '';
      next.textContent = 'Se relever';
    }
  };
  next.addEventListener('click', () => {
    if (i < b.pages.length - 1) { i += 1; show(); } else finish();
  });
  skip.addEventListener('click', finish);
  show();
  next.focus();
}

function beatBody(w: WorldState, b: StoryBeat): HTMLElement {
  const body = el('div', 'panel-body story');
  for (const p of b.pages) body.appendChild(el('p', 'story-page', personalize(w, p)));
  if (b.note) body.appendChild(el('p', 'story-note', personalize(w, b.note)));
  if (b.ghost) {
    const g = el('div', 'news-reaction');
    g.appendChild(ghostAvatar(b.ghost, 'calme', 36));
    g.appendChild(el('p', 'ph-note', `${thinkerMeta(b.ghost).name} écoute en silence.`));
    body.appendChild(g);
  }
  return body;
}

/** Ouvre le prochain cahier non lu ; renvoie faux s'il n'y en a pas. */
export function openUnreadBeat(ctx: StoryCtx): boolean {
  const s = ensureStory(ctx.world);
  const id = s.unread[0];
  const b = id ? BEAT_BY_ID[id] : undefined;
  if (!id || !b) return false;
  markRead(ctx.world, id);
  ctx.showModal(`📖 ${personalize(ctx.world, b.title)}`, 'Les Carnets de Lucien', beatBody(ctx.world, b), true);
  return true;
}

/** Les Carnets : relire l'origine et les cahiers découverts ; deviner les autres. */
export function openNotebooks(ctx: StoryCtx): void {
  const w = ctx.world;
  const s = ensureStory(w);
  const body = el('div', 'panel-body');
  const list = el('div', 'ph-list');
  const entry = (b: StoryBeat, known: boolean, when?: number): void => {
    const card = el('button', `ph-card story-entry${known ? '' : ' locked'}`);
    card.type = 'button';
    card.appendChild(el('div', 'ph-card-title', known ? `📖 ${personalize(w, b.title)}` : '📕 Cahier encore introuvable'));
    if (known && when !== undefined) card.appendChild(el('p', 'ph-note', `Retrouvé le ${dateOf(when).label}`));
    if (known) card.addEventListener('click', () => ctx.showModal(`📖 ${personalize(w, b.title)}`, 'Les Carnets de Lucien', beatBody(w, b), true));
    else card.disabled = true;
    list.appendChild(card);
  };
  entry(ORIGIN, true);
  for (const b of BEATS) entry(b, s.seen[b.id] !== undefined, s.seen[b.id]);
  body.appendChild(list);
  ctx.showModal('📚 Les Carnets de Lucien', `${Object.keys(s.seen).length}/${BEATS.length} cahiers retrouvés`, body, true);
}

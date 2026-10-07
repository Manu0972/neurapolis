/**
 * Le monde bouge, côté écran : notification façon téléphone à chaque dépêche, application
 * « Infos » (fil, effets en cours, surprises vécues) et fenêtre des dilemmes, où deux
 * fantômes défendent chacun une option.
 */
import type { WorldState } from '../core/types';
import type { NewsCategory, NewsItem, Sector } from '../core/happenings_types';
import { dayIndexOf } from '../core/clock';
import { ensureHappenings, pendingSurprise, resolveSurprise } from '../simulation/happenings';
import { ghostAvatar, thinkerMeta } from './ghost-avatar';
import { el } from './ui';

export const SECTOR_LABEL: Record<Sector, string> = {
  alimentation: '🍞 Alimentation', commerce: '🛍️ Commerce', services: '🧰 Services', logistique: '🚚 Logistique',
  mode: '👕 Mode', tech: '💻 Tech', immobilier: '🏢 Immobilier', culture: '🎭 Culture', industrie: '🏭 Industrie',
  finance: '💶 Finance', energie: '⚡ Énergie', medias: '📡 Médias',
};

const CATEGORY_ICON: Record<NewsCategory, string> = {
  geopolitique: '🌍', economie: '📈', tech: '💡', social: '✊', climat: '🌡️', local: '📍',
};

function effectChip(e: { sector: Sector; mult: number; days: number }): HTMLElement {
  const pct = Math.round((e.mult - 1) * 100);
  return el('span', `news-chip ${pct >= 0 ? 'up' : 'down'}`, `${SECTOR_LABEL[e.sector]} ${pct >= 0 ? '+' : ''}${pct} % · ${e.days} j`);
}

export interface NewsToaster { check(world: WorldState): void }

/** Notification façon téléphone quand une dépêche tombe. */
export function createNewsToaster(host: HTMLElement, open: () => void): NewsToaster {
  const box = el('div', 'news-toasts');
  host.appendChild(box);
  let lastId = '';
  let primed = false;
  return {
    check(world) {
      const latest = world.happenings?.news[0];
      // Au chargement, on ne rejoue pas les vieilles dépêches (mais la toute première d'une partie, oui).
      if (!primed) { primed = true; lastId = latest?.id ?? ''; return; }
      if (!latest || latest.id === lastId) return;
      lastId = latest.id;
      const card = el('button', 'news-toast');
      card.type = 'button';
      const top = el('div', 'news-toast-top');
      top.appendChild(el('span', 'news-toast-app', `${CATEGORY_ICON[latest.category]} Infos`));
      top.appendChild(el('span', 'news-toast-time', 'maintenant'));
      card.appendChild(top);
      card.appendChild(el('div', 'news-toast-title', latest.headline));
      const chips = el('div', 'news-chips');
      for (const e of latest.effects) chips.appendChild(effectChip(e));
      card.appendChild(chips);
      card.addEventListener('click', () => { card.remove(); open(); });
      box.prepend(card);
      while (box.children.length > 3) box.lastElementChild?.remove();
      window.setTimeout(() => card.classList.add('leaving'), 8000);
      window.setTimeout(() => card.remove(), 8600);
    },
  };
}

function newsCard(n: NewsItem, today: number): HTMLElement {
  const card = el('div', 'ph-card news-card');
  card.appendChild(el('div', 'ph-card-title', `${CATEGORY_ICON[n.category]} ${n.headline}`));
  card.appendChild(el('p', 'ph-note', `${today - n.day === 0 ? 'Aujourd’hui' : `Il y a ${today - n.day} j`} · ${n.body}`));
  const chips = el('div', 'news-chips');
  for (const e of n.effects) {
    const active = n.day + e.days > today;
    const c = effectChip(e);
    if (!active) c.classList.add('over');
    chips.appendChild(c);
  }
  card.appendChild(chips);
  const react = el('div', 'news-reaction');
  react.appendChild(ghostAvatar(n.ghost, 'calme', 30));
  react.appendChild(el('p', 'ph-note', `${thinkerMeta(n.ghost).name} : « ${n.reaction} »`));
  card.appendChild(react);
  return card;
}

/** Application « Infos » du téléphone. */
export function renderInfosApp(world: WorldState, screen: HTMLElement): void {
  const h = ensureHappenings(world);
  const today = dayIndexOf(world.time.tick);
  const active = h.effects.filter((e) => e.untilDay > today);
  const sum = el('div', 'ph-card');
  sum.appendChild(el('div', 'ph-card-title', '📊 Ce qui pèse sur tes marchés en ce moment'));
  if (active.length === 0) sum.appendChild(el('p', 'ph-note', 'Rien de particulier : la demande suit son cours.'));
  for (const e of active) {
    const pct = Math.round((e.mult - 1) * 100);
    sum.appendChild(el('p', `ph-note ${pct >= 0 ? 'ok' : ''}`, `${e.sector ? SECTOR_LABEL[e.sector] : '🎯 Une de tes affaires'} ${pct >= 0 ? '+' : ''}${pct} % · encore ${e.untilDay - today} j · ${e.label}`));
  }
  screen.appendChild(sum);
  screen.appendChild(el('h3', 'ph-h', '📰 Fil d’infos'));
  if (h.news.length === 0) screen.appendChild(el('p', 'ph-note', 'Les premières dépêches tombent à 7 h, 12 h et 18 h.'));
  for (const n of h.news.slice(0, 15)) screen.appendChild(newsCard(n, today));
  if (h.history.length > 0) {
    screen.appendChild(el('h3', 'ph-h', '⚡ Ce qui t’est arrivé'));
    for (const r of h.history.slice(0, 10)) {
      const c = el('div', `ph-card surprise-${r.tone}`);
      c.appendChild(el('div', 'ph-card-title', `${r.tone === 'bon' ? '🍀' : r.tone === 'catastrophe' ? '💥' : '⚡'} ${r.title} · il y a ${today - r.day} j`));
      c.appendChild(el('p', 'ph-note', `${r.text}${r.cash ? ` (${r.cash > 0 ? '+' : ''}${Math.round(r.cash).toLocaleString('fr-FR')} €)` : ''}`));
      screen.appendChild(c);
    }
  }
}

export interface SurpriseCtx {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
}

/** Dilemme : deux options, chacune défendue par un fantôme. */
export function openSurpriseModal(ctx: SurpriseCtx, onResolved: (ghost: string, text: string, failed: boolean) => void): boolean {
  const p = pendingSurprise(ctx.world);
  if (!p) return false;
  const body = el('div', 'panel-body surprise');
  body.appendChild(el('p', 'panel-desc', p.text));
  const split = el('div', 'duel-split');
  p.def.options!.forEach((o, i) => {
    const m = thinkerMeta(o.ghost);
    const box = el('div', `duel-face duel-${i === 0 ? 'a' : 'b'}`);
    box.style.setProperty('--face', m.color);
    box.appendChild(ghostAvatar(o.ghost, p.def.tone === 'bon' ? 'joie' : 'alerte', 48));
    box.appendChild(el('div', 'duel-name', m.name));
    box.appendChild(el('div', 'duel-strategy', o.label));
    box.appendChild(el('p', 'duel-advice', `« ${o.advice} »`));
    if (o.risk) box.appendChild(el('p', 'ph-note', `Risque : ${o.risk >= 0.5 ? 'élevé' : o.risk >= 0.3 ? 'réel' : 'faible'}`));
    const b = el('button', 'ph-btn primary', 'Choisir');
    b.type = 'button';
    b.addEventListener('click', () => {
      const r = resolveSurprise(ctx.world, i);
      ctx.closeModal();
      ctx.toast(r.message, r.ok && !r.failed);
      if (r.ok) onResolved(o.ghost, r.failed ? `Ça a mal tourné… ${r.message}` : r.message, r.failed);
    });
    box.appendChild(b);
    split.appendChild(box);
  });
  body.appendChild(split);
  const tone = p.def.tone === 'catastrophe' ? '💥' : p.def.tone === 'bon' ? '🍀' : '⚡';
  ctx.showModal(`${tone} ${p.def.title}`, p.targetName ? `Concerne : ${p.targetName}` : 'Une décision t’attend', body, true);
  return true;
}

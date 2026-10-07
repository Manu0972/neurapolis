/**
 * Fenêtre du retour en arrière : choisir le jour où revenir et le fantôme qui se sacrifie.
 * Le monde restauré est repris par le chemin habituel de chargement (rechargement de page).
 */
import type { WorldState } from '../core/types';
import { PENDING_LOAD_KEY, saveToSlot } from '../saves/persist';
import { listChronicle, loadChronicle, truncateAfter } from '../saves/chronicle';
import { SACRIFICE_DAYS, applyRewind, rewindOffer, sacrificeCandidates } from '../simulation/rewind';
import { ghostAvatar, thinkerMeta } from './ghost-avatar';
import { el } from './ui';

export interface RewindCtx {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
}

export function openRewindModal(ctx: RewindCtx): void {
  const w = ctx.world;
  const cat = rewindOffer(w);
  const days = listChronicle().filter((d) => !cat || d.day <= cat.day).reverse();
  const ghosts = sacrificeCandidates(w);
  const body = el('div', 'panel-body rewind');
  if (!cat) {
    body.appendChild(el('p', 'panel-desc', 'Le temps ne se retourne qu’après une très grosse erreur. Pour l’instant, il suit son cours.'));
    ctx.showModal('⏳ Remonter le temps', 'Indisponible', body, true);
    return;
  }
  body.appendChild(el('p', 'panel-desc', `${cat.text} Une de tes voix peut te ramener avant. Elle se taira ${SACRIFICE_DAYS} jours. Tout ce que tu as compris (carnet, verdicts, leçon) restera avec toi.`));
  if (days.length === 0 || ghosts.length === 0) {
    body.appendChild(el('p', 'ph-note', days.length === 0 ? 'Aucun jour antérieur n’a été gardé en mémoire.' : 'Aucune voix n’est assez proche de toi pour se sacrifier.'));
    ctx.showModal('⏳ Remonter le temps', 'Impossible cette fois', body, true);
    return;
  }
  let day = days[0]!.day;
  let ghost = ghosts[0]!;
  body.appendChild(el('h3', 'ph-h', 'Revenir au matin du…'));
  const dayRow = el('div', 'rewind-days');
  const dayBtns: HTMLButtonElement[] = [];
  for (const d of days) {
    const b = el('button', `ph-btn${d.day === day ? ' primary' : ''}`, d.label);
    b.type = 'button';
    b.addEventListener('click', () => { day = d.day; for (const x of dayBtns) x.classList.toggle('primary', x === b); });
    dayBtns.push(b);
    dayRow.appendChild(b);
  }
  body.appendChild(dayRow);
  body.appendChild(el('h3', 'ph-h', 'Qui se sacrifie ?'));
  const gRow = el('div', 'rewind-ghosts');
  const gBtns: HTMLButtonElement[] = [];
  for (const g of ghosts) {
    const b = el('button', `rewind-ghost${g === ghost ? ' chosen' : ''}`);
    b.type = 'button';
    b.appendChild(ghostAvatar(g, 'alerte', 48));
    b.appendChild(el('span', 'rewind-ghost-name', thinkerMeta(g).name));
    b.addEventListener('click', () => { ghost = g; for (const x of gBtns) x.classList.toggle('chosen', x === b); });
    gBtns.push(b);
    gRow.appendChild(b);
  }
  body.appendChild(gRow);
  const go = el('button', 'ph-btn primary', '⏳ Accepter le sacrifice et remonter le temps');
  go.type = 'button';
  go.addEventListener('click', () => {
    try {
      const restored = applyRewind(loadChronicle(day), w, ghost);
      saveToSlot('retour', restored);
      truncateAfter(day);
      sessionStorage.setItem(PENDING_LOAD_KEY, 'retour');
      location.reload();
    } catch (err) {
      ctx.toast(`Impossible : ${err instanceof Error ? err.message : String(err)}`, false);
    }
  });
  body.appendChild(go);
  const stay = el('button', 'ph-btn', 'Assumer et continuer');
  stay.type = 'button';
  stay.addEventListener('click', () => ctx.closeModal());
  body.appendChild(stay);
  ctx.showModal('⏳ Remonter le temps', 'Le prix : une voix qui se tait', body, true);
}

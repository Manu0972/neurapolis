/**
 * La ligne « 👉 Maintenant » sous la carte de chapitre : une seule étape à la fois
 * (src/simulation/guide.ts), cliquable pour ouvrir le bon écran. Reste visible carte repliée.
 */
import type { WorldState } from '../core/types';
import { nextStep, type GuideAction } from '../simulation/guide';
import { el } from './ui';

export interface GuideUi { sync(w: WorldState): void }

let styled = false;
function injectStyle(): void {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const s = document.createElement('style');
  s.id = 'guide-ui-style';
  s.textContent = `
.guide-step { display: flex; flex-direction: column; gap: 2px; width: 100%; margin-top: 6px; padding: 6px 8px; text-align: left;
  border: 1px solid var(--or); border-radius: 10px; background: rgba(255, 217, 138, 0.12); color: var(--ink);
  font: inherit; font-size: 12px; line-height: 1.35; cursor: pointer; pointer-events: auto; }
.guide-step:hover { background: rgba(255, 217, 138, 0.22); }
.guide-step.hidden { display: none; }
.guide-step .guide-now { font-weight: 800; color: var(--or); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; }
.guide-step .guide-detail { color: var(--ink-dim); font-size: 11px; }
.guide-step.fresh { animation: ghostBubblePop 0.35s ease; }
@media (prefers-reduced-motion: reduce) { .guide-step.fresh { animation: none; } }
`;
  document.head.appendChild(s);
}

export function createGuide(card: HTMLElement, deps: { openApp: (app: 'ascension' | 'banque') => void; openMap: () => void }): GuideUi {
  injectStyle();
  const box = el('button', 'guide-step hidden');
  box.type = 'button';
  const now = el('span', 'guide-now', '👉 Maintenant');
  const text = el('span', 'guide-text', '');
  const detail = el('span', 'guide-detail', '');
  box.appendChild(now);
  box.appendChild(text);
  box.appendChild(detail);
  card.appendChild(box);
  let key = '';
  let lastId = '';
  let action: GuideAction | undefined;
  box.addEventListener('click', (e) => {
    // La carte de chapitre se replie au clic : pas ici.
    e.stopPropagation();
    if (action === 'carte') deps.openMap();
    else if (action) deps.openApp(action);
  });
  return {
    sync(w: WorldState): void {
      const step = nextStep(w);
      const k = step ? `${step.icon}${step.text}${step.detail ?? ''}` : '';
      if (k === key) return;
      key = k;
      action = step?.action;
      box.classList.toggle('hidden', !step);
      if (!step) return;
      const changed = lastId !== '' && step.id !== lastId;
      lastId = step.id;
      text.textContent = `${step.icon} ${step.text}`;
      detail.textContent = step.detail ?? '';
      detail.style.display = step.detail ? '' : 'none';
      box.title = step.action === 'carte' ? 'Clique pour voir le plan de la ville' : 'Clique pour ouvrir le téléphone au bon endroit';
      if (changed) { box.classList.remove('fresh'); void box.offsetWidth; box.classList.add('fresh'); }
    },
  };
}

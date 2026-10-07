/**
 * Le tableau des plans (chambre-QG) et l'étagère des objets.
 * Un plan : l'objectif, ses besoins, ce qui manque et comment l'obtenir ; « Exécuter » quand
 * tout est prêt (le double face surgit alors pour la décision de lancement).
 */
import type { WorldState } from '../core/types';
import { IDEA_BY_ID, TIERS } from '../data/ascension/ideas';
import { ROOM_ITEMS, ROOM_ITEM_BY_ID } from '../data/room_registry';
import { ensureAscension, ideasOfTier } from '../simulation/ascension';
import { addPlan, ensureRoom, executePlan, maxPlans, planChecklist, planReady, removePlan } from '../simulation/room';
import type { ExtraItem } from './city3d/interior3d';
import { kindForFurnitureId } from './city3d/interior3d';
import { el } from './ui';

export interface PlanCtx {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
  /** Ouvre la décision de lancement (double face). */
  openDuel(): void;
}

function btn(label: string, onClick: () => void, cls = 'ph-btn'): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

export function openPlanner(ctx: PlanCtx): void {
  const w = ctx.world;
  const r = ensureRoom(w);
  const body = el('div', 'panel-body planner');
  body.appendChild(el('p', 'panel-desc', 'Le tableau de liège au-dessus du bureau. Un post-it par projet : ce qu’il faut, ce que tu as, ce qui manque. Quand tout est vert, tu peux exécuter le plan.'));
  for (const p of r.plans) {
    const idea = IDEA_BY_ID[p.ideaId];
    if (!idea) continue;
    const list = planChecklist(w, p.ideaId);
    const needed = list.filter((c) => !c.optional);
    const done = needed.filter((c) => c.ok).length;
    const card = el('div', 'ph-card plan-card');
    card.appendChild(el('div', 'ph-card-title', `📌 ${idea.icon} ${idea.name} — ${done}/${needed.length}`));
    const ul = el('ul', 'asc-checks');
    for (const c of list) {
      const li = el('li', c.ok ? 'ok' : '', `${c.optional ? '➕' : c.ok ? '✅' : '⬜'} ${c.label}`);
      if (!c.ok && c.hint) li.appendChild(el('div', 'plan-hint', `→ ${c.hint}`));
      ul.appendChild(li);
    }
    card.appendChild(ul);
    const actions = el('div', 'ph-actions');
    const go = btn('▶ Exécuter le plan', () => {
      const res = executePlan(w, p.id);
      if (!res.ok) { ctx.toast(res.message, false); return; }
      ctx.openDuel();
    }, 'ph-btn primary');
    go.disabled = !planReady(w, p.ideaId);
    actions.appendChild(go);
    actions.appendChild(btn('Décrocher', () => { removePlan(w, p.id); openPlanner(ctx); }, 'ph-btn danger'));
    card.appendChild(actions);
    body.appendChild(card);
  }
  const room = maxPlans(w) - r.plans.length;
  body.appendChild(el('h3', 'ph-h', room > 0 ? `Nouveau plan (encore ${room} place${room > 1 ? 's' : ''} au tableau)` : 'Tableau plein'));
  if (room > 0) {
    const tier = ensureAscension(w).tier;
    const picker = el('div', 'ph-list');
    for (const t of TIERS) {
      if (t.id > Math.min(6, tier + 1)) break;
      for (const idea of ideasOfTier(t.id)) {
        const running = ensureAscension(w).ventures[idea.id];
        if ((running && !running.closed) || r.plans.some((p) => p.ideaId === idea.id)) continue;
        picker.appendChild(btn(`${idea.icon} ${idea.name}${idea.tier > tier ? ' 🔒' : ''}`, () => {
          const res = addPlan(w, idea.id);
          ctx.toast(res.message, res.ok);
          openPlanner(ctx);
        }));
      }
    }
    body.appendChild(picker);
  }
  ctx.showModal('📌 Tableau des plans', `${r.plans.length}/${maxPlans(w)} plan(s)`, body, true);
}

/** L'étagère : tous les objets, gagnés ou à gagner. */
export function openShelf(ctx: PlanCtx, focus?: string): void {
  const r = ensureRoom(ctx.world);
  const body = el('div', 'panel-body');
  const list = el('div', 'ph-list');
  const items = focus ? [ROOM_ITEM_BY_ID[focus]!, ...ROOM_ITEMS.filter((i) => i.id !== focus)] : ROOM_ITEMS;
  for (const i of items) {
    const has = r.owned[i.id] !== undefined;
    const card = el('div', `ph-card${has ? '' : ' locked'}`);
    card.appendChild(el('div', 'ph-card-title', has ? `${i.icon} ${i.name}` : `❔ ${i.name}`));
    card.appendChild(el('p', 'ph-note', has ? i.lore : `Comment l’obtenir : ${i.how}`));
    if (i.bonus) {
      const what = { stress: 'stress en moins chaque matin', plan: 'plan de plus au tableau', negociation: 'XP de négociation chaque lundi', organisation: 'XP d’organisation chaque lundi', recherche: 'XP de recherche chaque lundi', chance: 'un peu de chance' }[i.bonus.kind];
      card.appendChild(el('p', 'ph-note ok', `+${i.bonus.value} ${what}`));
    }
    list.appendChild(card);
  }
  body.appendChild(list);
  ctx.showModal('🧸 Ta chambre', `${Object.keys(r.owned).length}/${ROOM_ITEMS.length} objets`, body, true);
}

/** Objets à poser dans la chambre 3D : le tableau des plans et les derniers objets gagnés. */
export function bedroomExtras(w: WorldState): ExtraItem[] {
  const r = ensureRoom(w);
  const recent = Object.entries(r.owned).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => ROOM_ITEM_BY_ID[id]).filter((i) => !!i);
  return [
    { id: 'tableau_plans', kind: 'tableau', label: 'Tableau des plans', icon: '📌', hotspot: 'plan' },
    ...recent.map((i) => ({ id: i!.id, kind: /ordi|ecran|reveil|casque/.test(i!.id) ? 'radio' as const : /tirelire|souvenir|maquette|globe/.test(i!.id) ? 'caisse_bois' as const : kindForFurnitureId(i!.id) === 'caisse_bois' ? 'plante' as const : kindForFurnitureId(i!.id), label: i!.name, icon: i!.icon, hotspot: 'objet' as const })),
  ];
}

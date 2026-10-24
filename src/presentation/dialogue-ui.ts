/**
 * Fenêtre de conversation avec un PNJ (vague 7). La logique vit dans src/simulation/dialogue.ts
 * (conversation bornée : sujet → réplique → réponse → réaction → menu … → au revoir) ; ici, on
 * l'affiche comme un petit fil de discussion qui garde la trace des échanges.
 */
import type { NpcId, WorldState } from '../core/types';
import { NPC_BY_ID } from '../data/npcs';
import { REL_LABELS } from '../data/dialogue';
import { answerTopic, askTopic, conversationMenu, endConversation, startConversation } from '../simulation/dialogue';
import { avatarElement } from './avatar';
import { el } from './ui';
import { AGE_LYCEE, adapterTexteEcole } from '../core/school';

export interface DialogueCtx {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  /** Temps passé à discuter (une réponse = une tâche courte). */
  spendTime(label: string): void;
  /** Rafraîchit la mission et le HUD après un échange. */
  onChange?(): void;
}

const DIALOG_CSS = `
.dlg-log { display: flex; flex-direction: column; gap: 6px; max-height: 42vh; overflow-y: auto; margin: 8px 0; }
.dlg-npc, .dlg-me { margin: 0; padding: 8px 11px; border-radius: 14px; line-height: 1.4; max-width: 88%; }
.dlg-npc { align-self: flex-start; background: rgba(249, 236, 208, 0.12); border-bottom-left-radius: 4px; }
.dlg-me { align-self: flex-end; background: rgba(255, 217, 138, 0.22); border-bottom-right-radius: 4px; }
.dlg-fx { align-self: flex-end; font-size: 12px; opacity: 0.8; margin: -2px 4px 0 0; }
.dlg-choices { display: flex; flex-wrap: wrap; gap: 6px; }
.dlg-choices .btn { width: auto; }
.dlg-ask { font-size: 13px; opacity: 0.85; margin: 2px 0; }
`;
let cssDone = false;
function ensureCss(): void {
  if (cssDone) return;
  cssDone = true;
  const st = document.createElement('style');
  st.dataset.owner = 'dialogue-ui';
  st.textContent = DIALOG_CSS;
  document.head.appendChild(st);
}

/** Ouvre une conversation avec un PNJ. Retourne faux si le PNJ est inconnu. */
export function openConversation(ctx: DialogueCtx, id: NpcId): boolean {
  const def = NPC_BY_ID[id];
  if (!def) return false;
  ensureCss();
  const conv = startConversation(id);
  const body = el('div', 'panel-body dlg');
  const head = el('div', 'avatar-row');
  head.appendChild(avatarElement(`pnj:${def.id}`, def.color, def.name, 56));
  const col = el('div', 'avatar-col');
  col.appendChild(el('span', 'rel-name', def.name));
  col.appendChild(el('div', 'rel-role', adapterTexteEcole(def.role, ctx.world.player.age >= AGE_LYCEE)));
  head.appendChild(col);
  body.appendChild(head);
  const log = el('div', 'dlg-log');
  body.appendChild(log);
  const ask = el('p', 'dlg-ask', '');
  body.appendChild(ask);
  const choices = el('div', 'dlg-choices');
  body.appendChild(choices);

  const say = (cls: string, text: string): void => {
    log.appendChild(el('p', cls, text));
    log.scrollTop = log.scrollHeight;
  };
  const button = (label: string, run: () => void, primary = false): void => {
    const b = el('button', primary ? 'btn primary' : 'btn', label);
    b.type = 'button';
    b.addEventListener('click', run);
    choices.appendChild(b);
  };

  function menu(): void {
    choices.replaceChildren();
    const topics = conversationMenu(conv);
    ask.textContent = topics.length > 0 ? 'De quoi veux-tu parler ?' : 'Vous avez fait le tour.';
    for (const t of topics) button(t.label, () => pick(t.id));
    button('👋 Au revoir', bye, topics.length === 0);
  }

  function pick(topic: string): void {
    const r = askTopic(ctx.world, conv, topic);
    if (!r) { menu(); return; }
    say('dlg-npc', r.line);
    choices.replaceChildren();
    ask.textContent = 'Ta réponse :';
    for (const rep of r.replies) button(rep.label, () => answer(rep.id));
  }

  function answer(tone: string): void {
    const r = answerTopic(ctx.world, conv, tone);
    if (!r) { menu(); return; }
    ctx.spendTime(`Discussion avec ${def!.name}`);
    say('dlg-me', r.said);
    const fx = Object.entries(r.applied).map(([k, d]) => `${REL_LABELS[k as keyof typeof REL_LABELS]} ${d > 0 ? '+' : ''}${d}`);
    if (fx.length > 0) log.appendChild(el('p', 'dlg-fx', fx.join(' · ')));
    say('dlg-npc', r.reaction);
    ctx.onChange?.();
    menu();
  }

  function bye(): void {
    say('dlg-npc', endConversation(conv));
    choices.replaceChildren();
    ask.textContent = '';
    button('Fermer', () => ctx.closeModal(), true);
  }

  say('dlg-npc', `${def.name.split(' ')[0]} te fait signe.`);
  menu();
  ctx.showModal(def.name, adapterTexteEcole(def.role, ctx.world.player.age >= AGE_LYCEE), body);
  return true;
}

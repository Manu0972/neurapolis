/**
 * Famille et collège, côté écran : dîner (une réplique, des réponses qui comptent), bureau de
 * la principale (trois voix pour trois choix), et panneau « Famille & collège ».
 */
import type { WorldState } from '../core/types';
import type { ParentId } from '../core/family_types';
import { dateOf, dayIndexOf } from '../core/clock';
import { PARENTS, SCHOOL_STAFF } from '../data/family_starter';
import {
  COSIGN_TRUST, SESSIONS, classWindow, ensureFamily, familyTrust, pendingDinner, resolveConvocation, resolveDinner,
  type ConvocationChoice,
} from '../simulation/family';
import { ensureSchoolLifeState } from '../simulation/school_life';
import { personalize } from '../simulation/story';
import { pendingSchoolEvent, resolveSchoolEvent } from '../simulation/school_events';
import { ghostAvatar, thinkerMeta } from './ghost-avatar';
import { el } from './ui';

export interface FamilyCtx {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
}

function gauge(label: string, value: number, tone: 'good' | 'bad'): HTMLElement {
  const row = el('div', 'fam-gauge');
  row.appendChild(el('span', 'fam-gauge-label', label));
  const bar = el('div', 'fam-gauge-bar');
  const fill = el('div', `fam-gauge-fill ${tone}`);
  fill.style.width = `${Math.round(value)}%`;
  bar.appendChild(fill);
  row.appendChild(bar);
  row.appendChild(el('span', 'fam-gauge-value', `${Math.round(value)}`));
  return row;
}

function parentCard(w: WorldState, id: ParentId): HTMLElement {
  const p = ensureFamily(w).parents[id];
  const meta = PARENTS[id];
  const card = el('div', 'ph-card fam-parent');
  card.appendChild(el('div', 'ph-card-title', `${meta.icon} ${meta.name} ${w.player.lastName ?? ''}`.trim()));
  card.appendChild(el('p', 'ph-note', meta.job));
  card.appendChild(gauge('Confiance', p.trust, 'good'));
  card.appendChild(gauge('Inquiétude', p.worry, 'bad'));
  card.appendChild(gauge('Fierté', p.pride, 'good'));
  return card;
}

/** Le dîner : la réplique des parents et tes réponses possibles. */
export function openDinnerModal(ctx: FamilyCtx): boolean {
  const line = pendingDinner(ctx.world);
  if (!line) return false;
  const body = el('div', 'panel-body fam-dinner');
  const who = line.speaker === 'les_deux'
    ? `${PARENTS.nora.icon} ${PARENTS.thierry.icon} Nora et Thierry`
    : `${PARENTS[line.speaker].icon} ${PARENTS[line.speaker].name}`;
  body.appendChild(el('div', 'fam-speaker', who));
  body.appendChild(el('p', 'fam-line', personalize(ctx.world, line.text)));
  const list = el('div', 'fam-replies');
  line.replies.forEach((r, i) => {
    const b = el('button', 'ph-btn', personalize(ctx.world, r.label));
    b.type = 'button';
    b.addEventListener('click', () => {
      const res = resolveDinner(ctx.world, i);
      ctx.closeModal();
      ctx.toast(personalize(ctx.world, res.message), true);
    });
    list.appendChild(b);
  });
  body.appendChild(list);
  ctx.showModal('🍝 Le dîner', dateOf(dayIndexOf(ctx.world.time.tick)).label, body, true);
  return true;
}

const CONVOCATION_VOICES: { choice: ConvocationChoice; ghost: string; label: string; advice: string }[] = [
  { choice: 'verite', ghost: 'weber', label: 'Dire la vérité et proposer un arrangement', advice: 'L’éthique de responsabilité : assume ce que tu fais, et négocie à visage découvert.' },
  { choice: 'promesse', ghost: 'rousseau', label: 'Promettre d’être en cours', advice: 'Un engagement pris devant ceux qui t’aiment est un contrat. Tiens-le, et il te libérera.' },
  { choice: 'mensonge', ghost: 'machiavel', label: 'Inventer une excuse médicale', advice: 'Les gens jugent sur les apparences. Une bonne histoire vaut mieux qu’une vérité qui dérange.' },
];

/** Le bureau de la principale : trois voix, trois choix. */
export function openConvocationModal(ctx: FamilyCtx): boolean {
  const f = ensureFamily(ctx.world);
  const c = f.convocation;
  if (!c) return false;
  const sl = ensureSchoolLifeState(ctx.world);
  const body = el('div', 'panel-body');
  body.appendChild(el('p', 'panel-desc', `Le bureau de ${SCHOOL_STAFF.principal.name}, principale du collège Jean-Moulin. Nora a pris sa matinée après sa garde de nuit ; Thierry a échangé son poste au Drive. Motif : ${c.reason}. Ta moyenne : ${sl.academicAverage}/20.`));
  const grid = el('div', 'fam-voices');
  for (const v of CONVOCATION_VOICES) {
    const box = el('div', 'duel-face');
    box.style.setProperty('--face', thinkerMeta(v.ghost).color);
    box.appendChild(ghostAvatar(v.ghost, v.choice === 'mensonge' ? 'joie' : 'calme', 44));
    box.appendChild(el('div', 'duel-name', thinkerMeta(v.ghost).name));
    box.appendChild(el('div', 'duel-strategy', v.label));
    box.appendChild(el('p', 'duel-advice', `« ${v.advice} »`));
    const b = el('button', 'ph-btn primary', 'Choisir');
    b.type = 'button';
    b.addEventListener('click', () => {
      const r = resolveConvocation(ctx.world, v.choice);
      ctx.closeModal();
      ctx.toast(r.message, r.ok);
    });
    box.appendChild(b);
    grid.appendChild(box);
  }
  body.appendChild(grid);
  ctx.showModal('🏫 Convocation', `${SCHOOL_STAFF.principal.name} vous attend`, body, true);
  return true;
}

/** Panneau « Famille & collège ». */
export function openFamilyPanel(ctx: FamilyCtx): void {
  const w = ctx.world;
  const f = ensureFamily(w);
  const sl = ensureSchoolLifeState(w);
  const day = dayIndexOf(w.time.tick);
  const body = el('div', 'panel-body');
  const parents = el('div', 'fam-parents');
  parents.appendChild(parentCard(w, 'nora'));
  parents.appendChild(parentCard(w, 'thierry'));
  body.appendChild(parents);
  const trust = familyTrust(w);
  body.appendChild(el('p', `ph-note ${trust < COSIGN_TRUST ? '' : 'ok'}`, trust < COSIGN_TRUST
    ? `⚠️ Confiance ${Math.round(trust)}/100 : ils refusent de se porter garants pour tes baux.`
    : `Ils se portent garants pour tes baux (confiance ${Math.round(trust)}/100).`));
  if (f.groundedUntil > day) body.appendChild(el('p', 'ph-note', `🔒 Puni encore ${f.groundedUntil - day} jour(s) : à la maison avant 18 h.`));
  if (pendingDinner(w)) {
    const b = el('button', 'ph-btn primary', '🍝 Répondre au dîner');
    b.type = 'button';
    b.addEventListener('click', () => openDinnerModal(ctx));
    body.appendChild(b);
  }
  const school = el('div', 'ph-card');
  school.appendChild(el('div', 'ph-card-title', '🏫 Collège Jean-Moulin'));
  const unexcused = f.absences.filter((a) => !a.excused).length;
  school.appendChild(el('p', 'ph-note', `Moyenne ${sl.academicAverage}/20 · assiduité ${sl.attendanceRate} % · ${unexcused} absence(s) injustifiée(s) · ${f.absences.length - unexcused} excusée(s)`));
  const next = classWindow(w);
  school.appendChild(el('p', 'ph-note', next
    ? `Cours ouvert maintenant (${next === 'matin' ? '8 h 30 – 12 h' : '13 h 30 – 16 h 30'}) : va au collège et appuie sur E à l’entrée.`
    : `Cours : ${Math.floor(SESSIONS.matin.start / 60)} h 30 – 12 h et 13 h 30 – 16 h 30, pas le mercredi après-midi.`));
  if (f.arrangement && f.arrangement.untilDay > day) {
    school.appendChild(el('p', 'ph-note ok', `📝 Convention avec ${f.arrangement.with} : ${f.arrangement.perWeek} demi-journées excusées par semaine, moyenne ≥ ${f.arrangement.minAverage}, encore ${f.arrangement.untilDay - day} jours.`));
  }
  if (f.convocation) {
    const b = el('button', 'ph-btn danger', '🏫 Aller à la convocation');
    b.type = 'button';
    b.addEventListener('click', () => openConvocationModal(ctx));
    school.appendChild(b);
  }
  for (const g of f.grades.slice(-5).reverse()) school.appendChild(el('p', 'ph-note', `📝 ${g.subject} (${dateOf(g.day).label}) : ${g.note}/20`));
  body.appendChild(school);
  ctx.showModal('👪 Famille & collège', 'Nora, Thierry, et le collège Jean-Moulin', body, true);
}

/** Un événement de collège : deux ou trois choix, chacun conseillé par une voix. */
export function openSchoolEventModal(ctx: FamilyCtx, onResolved: (ghost: string, text: string) => void): boolean {
  const e = pendingSchoolEvent(ctx.world);
  if (!e) return false;
  const body = el('div', 'panel-body');
  body.appendChild(el('p', 'panel-desc', personalize(ctx.world, e.text)));
  const grid = el('div', 'fam-voices');
  e.options.forEach((o, i) => {
    const box = el('div', 'duel-face');
    box.style.setProperty('--face', thinkerMeta(o.ghost).color);
    box.appendChild(ghostAvatar(o.ghost, 'calme', 44));
    box.appendChild(el('div', 'duel-name', thinkerMeta(o.ghost).name));
    box.appendChild(el('div', 'duel-strategy', personalize(ctx.world, o.label)));
    box.appendChild(el('p', 'duel-advice', `« ${o.advice} »`));
    const b = el('button', 'ph-btn primary', 'Choisir');
    b.type = 'button';
    b.addEventListener('click', () => {
      const r = resolveSchoolEvent(ctx.world, i);
      ctx.closeModal();
      if (r.ok) onResolved(o.ghost, personalize(ctx.world, r.message));
    });
    box.appendChild(b);
    grid.appendChild(box);
  });
  body.appendChild(grid);
  ctx.showModal(`🏫 ${e.title}`, 'Collège Jean-Moulin', body, true);
  return true;
}

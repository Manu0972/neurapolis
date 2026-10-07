/**
 * Interface de l'Ascension (docs/ASCENSION.md) : application du téléphone (paliers, idées,
 * entreprises, connexions), pop-up du fantôme double face, carnet d'économie.
 * Lit l'état du monde ; n'agit que par src/simulation/ascension.ts.
 */
import type { WorldState } from '../core/types';
import type { StrategyKey } from '../core/ascension_types';
import { ECON_CONCEPTS } from '../data/ascension/concepts';
import { CONTACTS } from '../data/ascension/contacts';
import { DUEL_BY_ID, type DuelFace } from '../data/ascension/duels';
import { IDEA_BY_ID, TIERS, type IdeaDef } from '../data/ascension/ideas';
import {
  MAX_LEVEL, VERDICT_DAYS, cancelLaunch, ensureAscension, ideaStatus, ideasOfTier, injectVenture, investCost, investVenture,
  requestLaunch, resolveLaunch, sellVenture, tierChecks, withdrawVenture,
} from '../simulation/ascension';
import { dayIndexOf } from '../core/clock';
import { el } from './ui';
import { duoAvatar } from './ghost-avatar';
import { QUIZ_BY_CONCEPT, isMastered, masteredCount, quizBest, submitQuiz } from '../simulation/quiz';

export interface AscensionCtx {
  world: WorldState;
  showModal(title: string, sub: string, body: HTMLElement, wide?: boolean): void;
  closeModal(): void;
  toast(text: string, ok: boolean): void;
  onChange(): void;
}

const money = (v: number): string => `${Math.round(v).toLocaleString('fr-FR')} €`;

function btn(label: string, onClick: () => void, cls = 'ph-btn'): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/** Contenu de l'application « Ascension » dans le téléphone. */
export function renderAscensionApp(ctx: AscensionCtx, screen: HTMLElement, rerender: () => void, back: () => void): void {
  const w = ctx.world;
  const a = ensureAscension(w);
  const tier = TIERS[a.tier - 1]!;
  const act = (r: { ok: boolean; message: string }): void => { ctx.toast(r.message, r.ok); ctx.onChange(); rerender(); };

  // Palier et preuves du suivant.
  const head = el('div', 'ph-card asc-tier');
  head.appendChild(el('div', 'ph-card-title', `🚀 Palier ${a.tier} — ${tier.name} · ${tier.scale}`));
  head.appendChild(el('p', 'ph-note', tier.lore));
  if (a.tier < 6) {
    const next = TIERS[a.tier]!;
    head.appendChild(el('p', 'asc-next', `Pour atteindre « ${next.name} » :`));
    const ul = el('ul', 'asc-checks');
    for (const c of tierChecks(w, (a.tier + 1) as 2 | 3 | 4 | 5 | 6)) ul.appendChild(el('li', c.ok ? 'ok' : '', `${c.ok ? '✅' : '⬜'} ${c.label}`));
    head.appendChild(ul);
  }
  const row = el('div', 'ph-actions');
  row.appendChild(btn(`📒 Carnet d’économie (${Object.keys(a.concepts).length}/${ECON_CONCEPTS.length})`, () => openNotebook(ctx, back)));
  row.appendChild(btn(`🤝 Connexions (${Object.keys(a.contacts).length}/${CONTACTS.length})`, () => openContacts(ctx, back)));
  if (a.pending) row.appendChild(btn('⚖️ Décision en attente', () => openDuelModal(ctx, back), 'ph-btn primary'));
  head.appendChild(row);
  screen.appendChild(head);

  // Entreprises en cours.
  const runs = Object.values(a.ventures);
  if (runs.length > 0) {
    screen.appendChild(el('h3', 'ph-h', 'Tes entreprises'));
    const day = dayIndexOf(w.time.tick);
    for (const run of runs) {
      const idea = IDEA_BY_ID[run.ideaId];
      const duel = idea ? DUEL_BY_ID[idea.duel] : undefined;
      if (!idea || !duel) continue;
      const card = el('div', `ph-card${run.closed ? ' asc-closed' : ''}`);
      card.appendChild(el('div', 'ph-card-title', `${idea.icon} ${idea.name}${run.closed ? ' — fermée' : ` · niveau ${run.level}`}`));
      const face = run.strategy === 'A' ? duel.a : run.strategy === 'B' ? duel.b : undefined;
      card.appendChild(el('p', 'ph-note', `Stratégie : ${face ? `${face.strategy} (${face.name})` : `à ta façon — ${duel.ownWay}`}`));
      if (!run.closed) {
        const l = run.last;
        card.appendChild(el('p', 'ph-note', l
          ? `Hier : ventes ${money(l.revenue)}, coûts ${money(l.costs)}, résultat ${l.profit >= 0 ? '+' : ''}${money(l.profit)}${l.unsold > 0 ? ` · invendus ${money(l.unsold)}` : ''}${l.missed > 0 ? ` · ventes manquées ${money(l.missed)}` : ''}`
          : 'Premier jour : les résultats tombent à minuit.'));
        card.appendChild(el('p', 'ph-note', `Caisse ${money(run.cash)} · cumul ${run.profitTotal >= 0 ? '+' : ''}${money(run.profitTotal)}${run.verdictDone ? '' : ` · verdict de ${duel.title} dans ${Math.max(0, run.verdictDay - day)} j`}${run.redDays > 0 ? ` · ⚠️ ${run.redDays} j dans le rouge` : ''}`));
        const actions = el('div', 'ph-actions');
        actions.appendChild(btn('Retirer la caisse', () => act(withdrawVenture(w, idea.id))));
        actions.appendChild(btn(`Verser ${money(idea.startCost * 0.1)}`, () => act(injectVenture(w, idea.id, idea.startCost * 0.1))));
        if (run.level < MAX_LEVEL) actions.appendChild(btn(`Investir (${money(investCost(run))})`, () => act(investVenture(w, idea.id))));
        actions.appendChild(btn('Vendre', () => { if (window.confirm(`Vendre « ${idea.name} » ?`)) act(sellVenture(w, idea.id)); }, 'ph-btn danger'));
        card.appendChild(actions);
      }
      screen.appendChild(card);
    }
  }

  // Idées : palier courant et inférieurs ; le palier suivant se devine.
  for (const t of TIERS) {
    if (t.id > a.tier + 1) break;
    const locked = t.id > a.tier;
    screen.appendChild(el('h3', 'ph-h', `${locked ? '🔒' : '💡'} Idées — ${t.name}${locked ? ' (bientôt)' : ''}`));
    const list = el('div', 'ph-list');
    for (const idea of ideasOfTier(t.id)) list.appendChild(ideaCard(ctx, idea, locked, back, act));
    screen.appendChild(list);
  }
  if (a.tier + 1 < 6) screen.appendChild(el('p', 'ph-note asc-mystery', `Au-delà : ${TIERS.slice(a.tier + 1).map(() => '???').join(' · ')}`));
}

function ideaCard(ctx: AscensionCtx, idea: IdeaDef, locked: boolean, back: () => void, act: (r: { ok: boolean; message: string }) => void): HTMLElement {
  const w = ctx.world;
  const st = ideaStatus(w, idea.id);
  const run = ensureAscension(w).ventures[idea.id];
  const card = el('div', `ph-card asc-idea${locked ? ' locked' : ''}`);
  card.appendChild(el('div', 'ph-card-title', `${idea.icon} ${locked ? idea.name.replace(/[a-zà-ÿ]/gi, (c, i: number) => (i % 3 === 0 ? c : '·')) : idea.name}`));
  if (!locked) {
    card.appendChild(el('p', 'ph-note', idea.pitch));
    const duel = DUEL_BY_ID[idea.duel]!;
    card.appendChild(el('p', 'ph-note', `Mise ${money(st.cost)}${st.eased ? ' (connexion : −25 %)' : ''} · marché jusqu’à ${money(idea.market)}/jour · marge ${Math.round(idea.margin * 100)} % · ${duel.a.emoji}${duel.b.emoji} ${duel.title}`));
    if (run && !run.closed) {
      card.appendChild(el('p', 'ph-note ok', '✅ En cours'));
    } else {
      const b = btn('Lancer', () => {
        const r = requestLaunch(w, idea.id);
        if (!r.ok) { act(r); return; }
        openDuelModal(ctx, back);
      }, 'ph-btn primary');
      b.disabled = !st.available;
      card.appendChild(b);
      if (!st.available) for (const reason of st.reasons) card.appendChild(el('p', 'ph-note', reason));
    }
  }
  return card;
}

function faceEl(f: DuelFace, side: 'a' | 'b', choose: () => void): HTMLElement {
  const box = el('div', `duel-face duel-${side}`);
  box.style.setProperty('--face', f.color);
  box.appendChild(el('div', 'duel-emoji', f.emoji));
  box.appendChild(el('div', 'duel-name', f.name));
  box.appendChild(el('div', 'duel-strategy', f.strategy));
  box.appendChild(el('p', 'duel-advice', `« ${f.advice} »`));
  box.appendChild(btn(`Suivre ${f.name.split(' ').pop()}`, choose, 'ph-btn primary'));
  return box;
}

/** Le fantôme double face surgit : deux moitiés, deux conseils, ta décision. */
export function openDuelModal(ctx: AscensionCtx, back: () => void): void {
  const w = ctx.world;
  const p = ensureAscension(w).pending;
  if (!p) return;
  const duel = DUEL_BY_ID[p.duelId]!;
  const idea = IDEA_BY_ID[p.ideaId]!;
  const decide = (k: StrategyKey): void => {
    const r = resolveLaunch(w, k);
    ctx.toast(r.message, r.ok);
    ctx.onChange();
    if (r.ok) back();
  };
  const body = el('div', 'panel-body duel');
  body.appendChild(el('p', 'duel-question', `${idea.icon} ${idea.name} — ${duel.question}`));
  // La silhouette coupée en deux.
  const mascot = el('div', 'duel-mascot-svg');
  mascot.appendChild(duoAvatar(duel.a.thinker, duel.b.thinker, 'alerte', 112));
  body.appendChild(mascot);
  const split = el('div', 'duel-split');
  split.appendChild(faceEl(duel.a, 'a', () => decide('A')));
  split.appendChild(faceEl(duel.b, 'b', () => decide('B')));
  body.appendChild(split);
  const own = el('div', 'duel-own');
  own.appendChild(el('p', 'ph-note', `Ou à ta façon : ${duel.ownWay}`));
  own.appendChild(btn('Faire à ma façon', () => decide('C')));
  own.appendChild(btn('Réfléchir encore', () => { cancelLaunch(w); back(); }));
  body.appendChild(own);
  body.appendChild(el('p', 'ph-note', `Le verdict tombera dans ${VERDICT_DAYS} jours : on comparera ce qu’aurait donné chaque voie.`));
  ctx.showModal(`👻 ${duel.title}`, `${duel.a.name} ⟷ ${duel.b.name}`, body, true);
}

export function openNotebook(ctx: AscensionCtx, back: () => void): void {
  const a = ensureAscension(ctx.world);
  const body = el('div', 'panel-body');
  body.appendChild(el('p', 'panel-desc', 'Ce que tu as compris en le vivant. Chaque verdict, chaque palier, chaque rencontre peut y ajouter une page.'));
  const list = el('div', 'ph-list');
  for (const c of ECON_CONCEPTS) {
    const known = a.concepts[c.id] !== undefined;
    const card = el('div', `ph-card${known ? '' : ' locked'}`);
    const star = known && isMastered(ctx.world, c.id) ? ' ⭐' : '';
    card.appendChild(el('div', 'ph-card-title', known ? `📗 ${c.name} — ${c.thinker}${star}` : `📕 ??? — ${c.thinker}`));
    if (known) {
      card.appendChild(el('p', 'ph-note', c.summary));
      card.appendChild(el('p', 'ph-note', `Vécu : ${c.example}`));
      const quiz = QUIZ_BY_CONCEPT[c.id];
      if (quiz) {
        const best = quizBest(ctx.world, c.id);
        card.appendChild(btn(star ? '⭐ Maîtrisé — refaire le test' : `🧠 Tester ma compréhension${best > 0 ? ` (meilleur : ${best}/${quiz.questions.length})` : ''}`, () => openQuiz(ctx, c.id, () => openNotebook(ctx, back))));
      }
    }
    list.appendChild(card);
  }
  body.appendChild(list);
  body.appendChild(btn('← Retour', back));
  ctx.showModal('📒 Carnet d’économie', `${Object.keys(a.concepts).length} / ${ECON_CONCEPTS.length} concepts · ${masteredCount(ctx.world)} maîtrisé(s) ⭐`, body, true);
}

/** Ordre d'affichage des choix, mélangé de façon stable (la bonne réponse n'est pas toujours la première). */
function shuffledOrder(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** Le test d'un concept : trois situations, une explication après chaque réponse. */
export function openQuiz(ctx: AscensionCtx, conceptId: string, back: () => void): void {
  const quiz = QUIZ_BY_CONCEPT[conceptId];
  const concept = ECON_CONCEPTS.find((c) => c.id === conceptId);
  if (!quiz || !concept) return;
  const answers: number[] = [];
  const show = (i: number): void => {
    const body = el('div', 'panel-body quiz');
    if (i >= quiz.questions.length) {
      const r = submitQuiz(ctx.world, conceptId, answers);
      body.appendChild(el('p', 'quiz-score', `${r.score} / ${r.total}`));
      body.appendChild(el('p', 'panel-desc', r.masteredNow
        ? `⭐ « ${concept.name} » est maîtrisé. ${concept.thinker} hoche la tête : tu ne récites pas, tu comprends.`
        : r.score === r.total ? 'Toujours parfait.' : 'Relis la page du carnet, repense à ce que tu as vécu, et retente quand tu veux.'));
      body.appendChild(btn('← Retour au carnet', back, 'ph-btn primary'));
      ctx.onChange();
      ctx.showModal(`🧠 ${concept.name}`, 'Résultat', body, true);
      return;
    }
    const item = quiz.questions[i]!;
    body.appendChild(el('p', 'quiz-progress', `Question ${i + 1} / ${quiz.questions.length}`));
    body.appendChild(el('p', 'quiz-q', item.q));
    const list = el('div', 'quiz-choices');
    const feedback = el('p', 'quiz-feedback', '');
    const next = btn(i + 1 < quiz.questions.length ? 'Question suivante' : 'Voir le résultat', () => show(i + 1), 'ph-btn primary');
    next.disabled = true;
    const buttons: HTMLButtonElement[] = [];
    for (const k of shuffledOrder(`${conceptId}:${i}`)) {
      const b = btn(item.choices[k]!, () => {
        answers[i] = k;
        for (const x of buttons) x.disabled = true;
        const good = k === item.answer;
        b.classList.add(good ? 'right' : 'wrong');
        buttons.find((x) => x.dataset.k === String(item.answer))?.classList.add('right');
        feedback.textContent = `${good ? '✅ Juste.' : '❌ Pas tout à fait.'} ${item.explanation}`;
        next.disabled = false;
        next.focus();
      }, 'ph-btn quiz-choice');
      b.dataset.k = String(k);
      buttons.push(b);
      list.appendChild(b);
    }
    body.appendChild(list);
    body.appendChild(feedback);
    body.appendChild(next);
    ctx.showModal(`🧠 ${concept.name}`, `Avec ${concept.thinker}`, body, true);
  };
  show(0);
}

export function openContacts(ctx: AscensionCtx, back: () => void): void {
  const a = ensureAscension(ctx.world);
  const body = el('div', 'panel-body');
  const list = el('div', 'ph-list');
  for (const c of CONTACTS) {
    const known = a.contacts[c.id] !== undefined;
    const card = el('div', `ph-card${known ? '' : ' locked'}`);
    card.appendChild(el('div', 'ph-card-title', `${known ? '🤝' : '❔'} ${c.name}`));
    card.appendChild(el('p', 'ph-note', known ? c.role : `Comment : ${c.how}`));
    list.appendChild(card);
  }
  body.appendChild(list);
  body.appendChild(btn('← Retour', back));
  ctx.showModal('🤝 Connexions', 'Les gens d’aujourd’hui ouvrent les portes de demain', body, true);
}

/**
 * Boucle de jeu : temps réel → ticks de simulation → rendu Canvas + HUD.
 * Panneaux (lieu/dialogue) : la simulation est en pause tant qu'un panneau est ouvert.
 * La présentation ne fait qu'appeler les actions de simulation et lire l'état.
 */
import { createWorld } from '../core/store';
import { tickWorld } from '../simulation/engine';
import { tryMove } from '../simulation/movement';
import { npcsNearby, placeAtAdjacent } from '../simulation/interact';
import { applyPlaceAction } from '../simulation/places';
import { dialogueTopics, npcLine, replyDialogue } from '../simulation/dialogue';
import { npcsAt } from '../simulation/npc';
import { performGatedAction } from '../simulation/actions';
import { skillProgress } from '../simulation/skills';
import { explainNotion } from '../simulation/notions';
import {
  adoptSharedRules, buyStock, createProject, imposeRule, ledgerInvariantHolds,
  makeEcoChoice, optimizeStand, recruitMember, repartition, runCourse, runSalesSession,
  sellCustomerData, setPrice, setRepartitionMode, weeklyResult,
} from '../simulation/project';
import {
  councilAnswerAdvice, councilArrivalChoose, councilColumns, councilPendingArrivals,
  councilSleep, councilWake, ghostSignature,
} from '../simulation/council';
import { contractChoose, exitSecurityContract, securityPending } from '../simulation/security';
import { affinityOf, fusionConfirm } from '../simulation/fusions';
import { allianceDesOmbres } from '../simulation/antagonists';
import { PLACE_BY_ID } from '../data/places';
import { NPC_BY_ID, NPCS } from '../data/npcs';
import { DIALOGUE_REPLIES, REL_LABELS } from '../data/dialogue';
import { GATED_ACTIONS, GATED_ACTION_BY_ID, SKILLS_LABELS } from '../data/actions';
import { EXPLANATION_SOURCES, NOTIONS } from '../data/notions';
import { GHOST_DEFS_BY_ID } from '../data/ghosts/registry';
import { FUSION_SCENES } from '../data/ghosts/composites';
import { ARRIVAL_CHOICE, ARRIVAL_SCENES, GHOST_DOCTRINES } from '../data/ghosts/scenes';
import {
  CHARACTERISTICS_LABELS, DOCTRINE_LABELS, EVENT_TYPE_LABELS, NOTION_STAGE_LABELS,
  REPARTITION_MODE_LABELS,
} from '../data/texts';
import { DATA_SALE, ECO_CHOICE, STAND_CONFIG } from '../data/project';
import { dateOf } from '../core/clock';
import type { CharacteristicsId, GhostId, NpcId, Notification, PlaceId, Rel4, RepartitionMode, SkillId, WorldState } from '../core/types';
import { ZERO_REL } from '../core/types';
import { createInput } from './input';
import { renderWorld } from './renderer';
import { buildUi, el, resizeCanvas, updateHud, type UiRefs } from './ui';
import { TOKENS } from './tokens';
import { avatarElement } from './avatar';

const TICK_MS = 1000; // 1 tick simulé (10 min) par seconde à vitesse 1
const MOVE_MS = 150;  // cadence d'un pas de tuile en maintenant une direction

const REL_DIMS: ReadonlyArray<keyof Rel4> = ['amitie', 'confiance', 'respect', 'rivalite'];

export function startGame(root: HTMLElement): void {
  const world: WorldState = createWorld();
  const ui = buildUi(root);
  let modalOpen = false;
  let last = performance.now();
  let acc = 0;
  let moveAcc = 0;

  const input = createInput(root, interact);
  window.addEventListener('resize', () => resizeCanvas(ui, root));

  // Outil d'inspection (Bible Partie XII) : l'état du monde reste lisible depuis la console
  // et depuis les tests E2E. Lecture/écriture directe = leviers de QA, jamais du gameplay.
  (window as unknown as { __NEURAPOLIS__: { world: WorldState } }).__NEURAPOLIS__ = { world };

  function promptText(): string {
    if (world.player.asleep) return '😴 Tu dors. La nuit passe…';
    const place = placeAtAdjacent(world);
    if (place) return `E — Entrer : ${PLACE_BY_ID[place]?.name ?? place}`;
    const near = npcsNearby(world, 2);
    if (near.length > 0) return `E — Parler à ${NPC_BY_ID[near[0]?.id ?? '']?.name ?? 'quelqu’un'}`;
    return '';
  }

  function interact(): void {
    if (modalOpen) return;
    const place = placeAtAdjacent(world);
    if (place) {
      openPlacePanel(place);
      return;
    }
    const near = npcsNearby(world, 2);
    const first = near[0];
    if (first) openNpcDialogue(first.id);
  }

  function showModal(title: string, sub: string, body: HTMLElement, wide = false): void {
    modalOpen = true;
    ui.modalEl.replaceChildren();
    const panel = el('div', 'modal-panel');
    if (wide) panel.classList.add('wide');
    const head = el('div', 'modal-head');
    head.appendChild(el('h2', 'modal-title', title));
    head.appendChild(el('p', 'modal-sub', sub));
    const close = el('button', 'modal-close', '✕');
    close.addEventListener('click', closeModal);
    head.appendChild(close);
    panel.appendChild(head);
    panel.appendChild(body);
    ui.modalEl.appendChild(panel);
    ui.modalEl.classList.remove('hidden');
  }

  function closeModal(): void {
    modalOpen = false;
    ui.modalEl.replaceChildren();
    ui.modalEl.classList.add('hidden');
  }

  function openPlacePanel(place: PlaceId): void {
    const def = PLACE_BY_ID[place];
    if (!def) return;
    const body = el('div', 'panel-body');
    body.appendChild(el('p', 'panel-desc', def.description));

    const present = npcsAt(world, place);
    if (present.length > 0) {
      body.appendChild(el('h3', 'panel-sub', 'Présents ici'));
      for (const n of present) {
        const npcDef = NPC_BY_ID[n.id];
        if (!npcDef) continue;
        const btn = el('button', 'btn btn-npc', `${npcDef.name} — ${n.activity}`);
        btn.style.borderLeftColor = npcDef.color;
        btn.addEventListener('click', () => openNpcDialogue(n.id));
        body.appendChild(btn);
      }
    }

    body.appendChild(el('h3', 'panel-sub', 'Actions'));
    for (const action of def.actions) {
      const btn = el('button', 'btn btn-action', action.label);
      btn.addEventListener('click', () => {
        const outcome = applyPlaceAction(world, place, action.id);
        btn.textContent = outcome.ok ? `${action.label} → ${outcome.message}` : outcome.message;
        btn.disabled = !outcome.ok;
      });
      body.appendChild(btn);
    }
    showModal(def.name, 'Intérieur', body);
  }

  function openNpcDialogue(id: NpcId): void {
    const def = NPC_BY_ID[id];
    if (!def) return;
    const body = el('div', 'panel-body');
    const head = el('div', 'avatar-row');
    head.appendChild(avatarElement(`pnj:${def.id}`, def.color, def.name, 48));
    const col = el('div', 'avatar-col');
    col.appendChild(el('span', 'rel-name', def.name));
    col.appendChild(el('div', 'rel-role', def.role));
    head.appendChild(col);
    body.appendChild(head);
    const lineBox = el('p', 'dialog-line', 'De quoi on parle ?');
    body.appendChild(lineBox);

    const topicRow = el('div', 'topic-row');
    for (const topic of dialogueTopics(id)) {
      const btn = el('button', 'btn btn-topic', topic);
      btn.addEventListener('click', () => {
        lineBox.textContent = npcLine(world, id, topic) ?? '…';
        showReplies();
      });
      topicRow.appendChild(btn);
    }
    body.appendChild(el('h3', 'panel-sub', 'De quoi parler ?'));
    body.appendChild(topicRow);

    const replyRow = el('div', 'reply-row');
    body.appendChild(replyRow);

    function showReplies(): void {
      replyRow.replaceChildren();
      for (const reply of DIALOGUE_REPLIES) {
        const btn = el('button', 'btn btn-reply', reply.label);
        btn.addEventListener('click', () => {
          const res = replyDialogue(world, id, reply.id);
          const effects = Object.entries(res.applied)
            .map(([k, d]) => `${REL_LABELS[k as keyof typeof REL_LABELS]} ${d > 0 ? '+' : ''}${d}`);
          lineBox.textContent =
            res.text + (effects.length > 0 ? `  →  ${effects.join(', ')}` : '');
          replyRow.replaceChildren();
          const bye = el('button', 'btn', 'Fermer');
          bye.addEventListener('click', closeModal);
          replyRow.appendChild(bye);
        });
        replyRow.appendChild(btn);
      }
    }
    showModal(def.name, def.role, body);
  }

  // ---------- Écrans M3 : personnage, relations, journal ----------

  function openPersonnage(): void {
    const p = world.player;
    const body = el('div', 'panel-body');
    const head = el('div', 'avatar-row');
    head.appendChild(avatarElement(`joueur:${p.name}`, TOKENS.or, p.name, 56));
    const col = el('div', 'avatar-col');
    col.appendChild(el('span', 'rel-name', `${p.name}, 12 ans`));
    col.appendChild(el('div', 'rel-role', `${p.money} € · réputation ${p.reputation}`));
    head.appendChild(col);
    body.appendChild(head);

    body.appendChild(el('h3', 'panel-sub', 'Caractéristiques'));
    for (const id of Object.keys(CHARACTERISTICS_LABELS) as CharacteristicsId[]) {
      const row = el('div', 'stat-row');
      row.appendChild(el('span', 'stat-label', CHARACTERISTICS_LABELS[id]));
      row.appendChild(el('span', 'stat-value', String(p.characteristics[id])));
      body.appendChild(row);
    }
    body.appendChild(el('p', 'panel-note', 'Les caractéristiques ne progressent que par la maîtrise des notions.'));

    body.appendChild(el('h3', 'panel-sub', 'Compétences'));
    for (const skill of Object.keys(SKILLS_LABELS) as SkillId[]) {
      const s = p.skills[skill];
      const prog = skillProgress(world, skill);
      const row = el('div', 'skill-row');
      row.appendChild(el('span', 'stat-label', `${SKILLS_LABELS[skill]} — niv. ${s.level}`));
      const track = el('div', 'xp-track');
      const fill = el('div', 'xp-fill');
      fill.style.width =
        prog.needed === null ? '100%' : `${Math.min(100, Math.round((prog.current / prog.needed) * 100))}%`;
      track.appendChild(fill);
      row.appendChild(track);
      body.appendChild(row);
      for (const a of GATED_ACTIONS.filter((x) => x.skill === skill)) {
        const unlocked = s.level >= a.minLevel;
        const btn = el(
          'button',
          'btn btn-action',
          unlocked ? a.label : `${a.label} (verrouillé — ${SKILLS_LABELS[a.skill]} niv. ${a.minLevel})`,
        );
        btn.disabled = !unlocked;
        if (unlocked) {
          btn.addEventListener('click', () => {
            const r = performGatedAction(world, a.id);
            btn.textContent = `${a.label} → ${r.message}`;
          });
        }
        body.appendChild(btn);
      }
    }

    body.appendChild(el('h3', 'panel-sub', 'Notions'));
    for (const def of NOTIONS) {
      const n = p.notions[def.id];
      const row = el('div', 'notion-row');
      row.appendChild(el('span', 'stat-label', def.name));
      row.appendChild(el('span', 'stage-badge', n ? NOTION_STAGE_LABELS[n.stage] : 'À découvrir'));
      body.appendChild(row);
      if (n?.stage === 4) {
        body.appendChild(el('p', 'panel-note', `Maîtrisée — ${CHARACTERISTICS_LABELS[def.characteristic]} +${def.gain}.`));
      } else if (n?.stage === 1) {
        body.appendChild(el('p', 'panel-note', 'Choisis ton explication :'));
        const explRow = el('div', 'reply-row');
        for (const source of EXPLANATION_SOURCES) {
          const b = el('button', 'btn btn-reply', def.explanations[source].label);
          b.addEventListener('click', () => {
            const r = explainNotion(world, def.id, source);
            if (r.ok) openPersonnage();
            else b.textContent = r.message;
          });
          explRow.appendChild(b);
        }
        body.appendChild(explRow);
      } else if (n) {
        const a = GATED_ACTION_BY_ID[def.applicationAction];
        body.appendChild(el('p', 'panel-note',
          n.stage === 3
            ? `Applications réussies : ${n.applications}/3 — pratique « ${a?.label ?? '?'} ».`
            : `Pour l’appliquer : pratique « ${a?.label ?? '?'} » (${SKILLS_LABELS[a?.skill ?? 'recherche']} niv. ${a?.minLevel ?? 0}).`));
      }
    }
    showModal('Ton personnage', 'progression & compétences', body, true);
  }

  function openRelations(): void {
    const body = el('div', 'panel-body');
    for (const def of NPCS) {
      const rel = world.player.relations[def.id] ?? ZERO_REL;
      const row = el('div', 'rel-row');
      const head = el('div', 'rel-head');
      head.style.borderLeftColor = def.color;
      head.appendChild(avatarElement(`pnj:${def.id}`, def.color, def.name, 34));
      const names = el('div', 'avatar-col');
      names.appendChild(el('span', 'rel-name', def.name));
      names.appendChild(el('div', 'rel-role', def.role));
      head.appendChild(names);
      row.appendChild(head);
      for (const dim of REL_DIMS) {
        const barRow = el('div', 'stat-row');
        barRow.appendChild(el('span', 'stat-label', REL_LABELS[dim]));
        const track = el('div', 'need-track');
        const fill = el('div', 'need-fill');
        fill.style.width = `${rel[dim]}%`;
        track.appendChild(fill);
        barRow.appendChild(track);
        row.appendChild(barRow);
      }
      body.appendChild(row);
    }
    showModal('Tes relations', 'amitié · confiance · respect · rivalité', body, true);
  }

  function openJournal(): void {
    const body = el('div', 'panel-body');
    const tabs = el('div', 'reply-row');
    const vieBtn = el('button', 'btn btn-topic', 'Journal de vie');
    const causesBtn = el('button', 'btn btn-topic', 'Journal des causes');
    tabs.appendChild(vieBtn);
    tabs.appendChild(causesBtn);
    body.appendChild(tabs);
    const list = el('div', 'journal-list');
    body.appendChild(list);

    const showVie = (): void => {
      list.replaceChildren();
      if (world.lifeJournal.length === 0) list.appendChild(el('p', 'panel-note', 'Rien pour l’instant.'));
      for (const e of world.lifeJournal) {
        const art = el('article', 'journal-entry');
        art.appendChild(el('h4', 'journal-title', `${dateOf(e.day).label} — ${e.title}`));
        art.appendChild(el('p', 'panel-desc', e.text));
        list.appendChild(art);
      }
    };
    const showCauses = (): void => {
      list.replaceChildren();
      if (world.events.length === 0) list.appendChild(el('p', 'panel-note', 'Rien pour l’instant.'));
      for (const evt of world.events) {
        const art = el('article', 'journal-entry');
        const head = el('div', 'journal-head');
        head.appendChild(el('span', 'event-badge', EVENT_TYPE_LABELS[evt.type]));
        head.appendChild(el('h4', 'journal-title', evt.title));
        art.appendChild(head);
        art.appendChild(el('p', 'panel-desc', evt.text));
        const why = el('button', 'btn btn-why', 'Pourquoi ?');
        const causesBox = el('div', 'causes hidden');
        for (const c of evt.causes) {
          causesBox.appendChild(el('p', 'cause-line',
            `${c.facteur}${c.seuil ? ` — seuil ${c.seuil}` : ''} — poids ${c.poids}`));
        }
        why.addEventListener('click', () => causesBox.classList.toggle('hidden'));
        art.appendChild(why);
        art.appendChild(causesBox);
        list.appendChild(art);
      }
    };
    vieBtn.addEventListener('click', showVie);
    causesBtn.addEventListener('click', showCauses);
    showVie();
    showModal('Journal', 'ta vie, et les causes derrière', body, true);
  }

  const navBtns = Array.from(ui.navEl.querySelectorAll('button'));
  navBtns[0]?.addEventListener('click', openPersonnage);
  navBtns[1]?.addEventListener('click', openRelations);
  navBtns[2]?.addEventListener('click', openJournal);
  navBtns[3]?.addEventListener('click', openProjet);
  navBtns[4]?.addEventListener('click', openConseil);

  // ---------- M5 : le projet (Stand des Roses) ----------

  function statRow(label: string, value: string): HTMLElement {
    const row = el('div', 'stat-row');
    row.appendChild(el('span', 'stat-label', label));
    row.appendChild(el('span', 'stat-value', value));
    return row;
  }

  function openProjet(): void {
    const p = world.project;
    const body = el('div', 'panel-body');

    if (!p || !p.active) {
      body.appendChild(el('p', 'panel-desc', 'Pas encore de projet. Le quartier regorge d’idées : pourquoi pas un stand de goûters à la récré ?'));
      const btn = el('button', 'btn btn-action', 'Lancer le Stand des Roses');
      btn.addEventListener('click', () => {
        const r = createProject(world);
        btn.textContent = r.message;
        btn.disabled = !r.ok;
        if (r.ok) openProjet();
      });
      body.appendChild(btn);
      showModal('Projet', 'entreprendre dans le quartier', body, true);
      return;
    }

    // Stock & prix
    body.appendChild(el('h3', 'panel-sub', 'Stock & prix'));
    body.appendChild(statRow('Stock', `${p.stock} unités`));
    body.appendChild(statRow('Prix', `${p.price.toFixed(2)} €/unité`));
    const prixRow = el('div', 'reply-row');
    const prixInput = el('input', 'price-input');
    prixInput.type = 'range';
    prixInput.min = String(STAND_CONFIG.priceMin);
    prixInput.max = String(STAND_CONFIG.priceMax);
    prixInput.step = '0.1';
    prixInput.value = String(p.price);
    const prixLabel = el('span', 'stat-label', `${p.price.toFixed(2)} €`);
    const prixBtn = el('button', 'btn btn-action', 'Fixer le prix');
    prixInput.addEventListener('input', () => prixLabel.textContent = `${Number(prixInput.value).toFixed(2)} €`);
    prixBtn.addEventListener('click', () => {
      const r = setPrice(world, Number(prixInput.value));
      prixBtn.textContent = r.ok ? `Prix : ${p.price.toFixed(2)} € ✓` : r.message;
    });
    prixRow.appendChild(prixInput);
    prixRow.appendChild(prixLabel);
    prixRow.appendChild(prixBtn);
    body.appendChild(prixRow);
    const achatBtn = el('button', 'btn btn-action', `Acheter du stock (${STAND_CONFIG.stockCost} € — ${STAND_CONFIG.stockUnits} unités)`);
    achatBtn.addEventListener('click', () => {
      const r = buyStock(world);
      achatBtn.textContent = r.message;
      achatBtn.disabled = !r.ok;
    });
    body.appendChild(achatBtn);

    // Équipe
    body.appendChild(el('h3', 'panel-sub', 'Équipe'));
    if (p.members.length === 0) body.appendChild(el('p', 'panel-note', 'Personne pour l’instant. Un stand à plusieurs, c’est plus fort — mais il faudra partager.'));
    for (const id of p.members) {
      const npcDef = NPC_BY_ID[id];
      if (!npcDef) continue;
      const chip = el('div', 'rel-row');
      const head = el('div', 'rel-head');
      head.style.borderLeftColor = npcDef.color;
      head.appendChild(el('span', 'rel-name', npcDef.name));
      head.appendChild(el('span', 'rel-role', `travail cette semaine : ${Math.round((p.work[id] ?? 0) / 3 * 100) / 100} h`));
      chip.appendChild(head);
      body.appendChild(chip);
    }
    for (const id of STAND_CONFIG.recruitables) {
      const npcDef = NPC_BY_ID[id];
      if (!npcDef) continue;
      const deja = p.members.includes(id);
      const niveau = world.player.skills[STAND_CONFIG.recruitSkill]?.level ?? 0;
      const debloque = niveau >= STAND_CONFIG.recruitMinLevel;
      const btn = el('button', 'btn btn-action',
        deja
          ? `${npcDef.name} — déjà dans l’équipe`
          : debloque
            ? `Recruter ${npcDef.name}`
            : `Recruter ${npcDef.name} (verrouillé — ${SKILLS_LABELS[STAND_CONFIG.recruitSkill]} niv. ${STAND_CONFIG.recruitMinLevel})`);
      btn.disabled = deja || !debloque;
      btn.addEventListener('click', () => {
        const r = recruitMember(world, id);
        btn.textContent = r.ok ? `${npcDef.name} a rejoint l’équipe ✓` : r.message;
        btn.disabled = !r.ok;
      });
      body.appendChild(btn);
    }

    // Actions du stand
    body.appendChild(el('h3', 'panel-sub', 'Actions'));
    const venteBtn = el('button', 'btn btn-action', 'Tenir le stand — 1 h');
    venteBtn.addEventListener('click', () => {
      const lieu = placeAtAdjacent(world);
      const ici = lieu === 'college' || lieu === 'place' ? lieu : null;
      if (!ici) {
        venteBtn.textContent = 'Rends-toi à la récré (collège) ou sur la place pour vendre.';
        return;
      }
      const r = runSalesSession(world, ici);
      venteBtn.textContent = r.message;
    });
    body.appendChild(venteBtn);
    const courseBtn = el('button', 'btn btn-action', 'Faire une course pour l’épicerie (20 min — 2 €)');
    courseBtn.addEventListener('click', () => {
      if (placeAtAdjacent(world) !== 'epicerie') {
        courseBtn.textContent = 'Rends-toi à l’épicerie pour prendre une course.';
        return;
      }
      const r = runCourse(world);
      courseBtn.textContent = r.message;
    });
    body.appendChild(courseBtn);

    // M6 : règles, optimisation, données, écologie
    body.appendChild(el('h3', 'panel-sub', 'Règles & choix difficiles'));
    body.appendChild(statRow('Règles du stand', p.rules.collectif ? 'partagées (collectif)' : 'aucune pour l’instant'));
    const reglesBtn = el('button', 'btn btn-action', 'Adopter des règles partagées (équipe ≥ 2)');
    reglesBtn.addEventListener('click', () => {
      const r = adoptSharedRules(world);
      reglesBtn.textContent = r.ok ? `${r.message} ✓` : r.message;
      reglesBtn.disabled = !r.ok;
    });
    body.appendChild(reglesBtn);
    const imposerBtn = el('button', 'btn btn-action', 'Imposer une règle (peut être contournée)');
    imposerBtn.addEventListener('click', () => {
      imposerBtn.textContent = imposeRule(world).message;
    });
    body.appendChild(imposerBtn);
    const optBtn = el('button', 'btn btn-action', 'Tenter une optimisation du rendement');
    optBtn.addEventListener('click', () => {
      optBtn.textContent = optimizeStand(world).message;
    });
    body.appendChild(optBtn);
    const dataBtn = el('button', 'btn btn-action',
      `Vendre le fichier clients (+${DATA_SALE.gain} € · réputation −${DATA_SALE.reputationPenalty})`);
    dataBtn.addEventListener('click', () => {
      dataBtn.textContent = sellCustomerData(world).message;
    });
    body.appendChild(dataBtn);
    const ecoBtn = el('button', 'btn btn-action',
      `Choix écologique coûteux (−${ECO_CHOICE.cost} € · réputation +${ECO_CHOICE.reputation})`);
    ecoBtn.addEventListener('click', () => {
      ecoBtn.textContent = makeEcoChoice(world).message;
    });
    body.appendChild(ecoBtn);

    // Comptes
    body.appendChild(el('h3', 'panel-sub', 'Comptes'));
    body.appendChild(statRow('Trésorerie (caisse)', `${p.balance.toFixed(2)} €`));
    body.appendChild(statRow('Résultat de la semaine', `${weeklyResult(p).toFixed(2)} €`));
    body.appendChild(el('p', 'panel-note', ledgerInvariantHolds(p)
      ? 'Livre de comptes : Σ(entrées − sorties) = solde ✓'
      : '⚠ Livre de comptes déséquilibré !'));
    const ledger = el('div', 'journal-list');
    for (const e of [...p.ledger].reverse().slice(0, 10)) {
      const art = el('article', 'journal-entry');
      art.appendChild(el('p', 'panel-desc',
        `${dateOf(e.day).label} — ${e.label} : ${e.amount > 0 ? '+' : ''}${e.amount.toFixed(2)} €`));
      ledger.appendChild(art);
    }
    body.appendChild(ledger);

    // Répartition
    body.appendChild(el('h3', 'panel-sub', 'Répartition (fin de semaine)'));
    const modeRow = el('div', 'reply-row');
    for (const mode of Object.keys(REPARTITION_MODE_LABELS) as RepartitionMode[]) {
      const btn = el('button', 'btn btn-topic', REPARTITION_MODE_LABELS[mode]);
      if (p.lastRepartition === mode) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        const r = setRepartitionMode(world, mode);
        if (r.ok) openProjet();
        else btn.textContent = r.message;
      });
      modeRow.appendChild(btn);
    }
    body.appendChild(modeRow);
    body.appendChild(el('p', 'panel-note',
      'Égalité : pareil pour tous · Équité : selon le travail fourni · Incitation : prime au plus gros travailleur.'));
    const repartBtn = el('button', 'btn btn-action', 'Répartir les gains de la semaine maintenant');
    repartBtn.addEventListener('click', () => {
      const r = repartition(world);
      repartBtn.textContent = r.ok
        ? `${r.message} — ${r.shares.map((s) => `${s.label} ${s.amount.toFixed(2)} €`).join(' · ')}`
        : r.message;
    });
    body.appendChild(repartBtn);

    showModal('Le Stand des Roses', 'stock · prix · équipe · comptes · répartition', body, true);
  }

  // ---------- M4 : Le Conseil ----------

  function openArrivalScene(id: GhostId): void {
    const def = GHOST_DEFS_BY_ID[id];
    const scene = ARRIVAL_SCENES[id];
    if (!def || !scene) return;
    const body = el('div', 'panel-body');
    const head = el('div', 'ghost-head');
    head.style.borderLeftColor = def.color;
    head.appendChild(el('span', 'ghost-name', `${def.emoji} ${def.name}`));
    head.appendChild(el('span', 'ghost-era', def.era));
    body.appendChild(head);
    for (const line of scene.lines) body.appendChild(el('p', 'scene-line', line));
    const msg = el('p', 'panel-note', '');
    body.appendChild(msg);
    const choices = el('div', 'reply-row');
    const listenBtn = el('button', 'btn btn-reply', ARRIVAL_CHOICE.listen);
    listenBtn.addEventListener('click', () => {
      const r = councilArrivalChoose(world, id, 'ecouter');
      if (!r.ok) {
        msg.textContent = r.message;
        return;
      }
      closeModal();
      const next = councilPendingArrivals(world);
      if (next.length > 0) openArrivalScene(next[0] ?? '');
    });
    const refuseBtn = el('button', 'btn btn-reply', ARRIVAL_CHOICE.refuse);
    refuseBtn.addEventListener('click', () => {
      const r = councilArrivalChoose(world, id, 'repousser');
      if (!r.ok) {
        msg.textContent = r.message;
        return;
      }
      closeModal();
      const next = councilPendingArrivals(world);
      if (next.length > 0) openArrivalScene(next[0] ?? '');
    });
    choices.appendChild(listenBtn);
    choices.appendChild(refuseBtn);
    body.appendChild(choices);
    showModal(`Une voix s’éveille — ${def.name}`, 'scène d’arrivée', body);
  }

  function openFusionScene(): void {
    const id = world.council.pendingFusion;
    if (!id) return;
    const def = GHOST_DEFS_BY_ID[id];
    const scene = FUSION_SCENES[id];
    if (!def || !scene) return;
    const body = el('div', 'panel-body');
    const head = el('div', 'ghost-head');
    head.style.borderLeftColor = def.color;
    head.appendChild(el('span', 'ghost-name', `${def.emoji} ${def.name}`));
    head.appendChild(el('span', 'ghost-era', def.era));
    body.appendChild(head);
    for (const line of scene.lines) body.appendChild(el('p', 'scene-line', line));
    const msg = el('p', 'panel-note', '');
    body.appendChild(msg);
    const btn = el('button', 'btn btn-reply', 'Laisser les voix fusionner');
    btn.addEventListener('click', () => {
      const r = fusionConfirm(world);
      if (!r.ok) {
        msg.textContent = r.message;
        return;
      }
      closeModal();
      showGhostBanner({ kind: 'fantome', text: r.message, ghost: id });
    });
    body.appendChild(btn);
    showModal(`Fusion — ${def.name}`, 'Smith et Ostrom se rejoignent', body);
  }

  function openConseil(): void {
    const cols = councilColumns(world);
    const body = el('div', 'panel-body');

    // Contrat de Sécurité (M6) : proposition en attente ou contrat en vigueur.
    if (securityPending(world)) {
      const box = el('div', 'ghost-detail');
      box.appendChild(el('h3', 'panel-sub', '⚖ Hobbes te tend le Contrat de Sécurité'));
      box.appendChild(el('p', 'panel-desc',
        'Rendement +20 % contre amitié du groupe −2/semaine. Sortie : uniquement par vote unanime et amitié ≥ 60.'));
      const row = el('div', 'reply-row');
      const signer = el('button', 'btn btn-reply', 'Signer le contrat');
      signer.addEventListener('click', () => {
        signer.textContent = contractChoose(world, true).message;
        openConseil();
      });
      const refuser = el('button', 'btn btn-reply', 'Refuser');
      refuser.addEventListener('click', () => {
        refuser.textContent = contractChoose(world, false).message;
        openConseil();
      });
      row.appendChild(signer);
      row.appendChild(refuser);
      box.appendChild(row);
      body.appendChild(box);
    } else if (world.council.contratSecurite?.active) {
      const box = el('div', 'ghost-detail');
      box.appendChild(el('h3', 'panel-sub', '⚖ Contrat de Sécurité actif'));
      box.appendChild(el('p', 'panel-desc', 'Rendement +20 % · amitié du groupe −2/semaine.'));
      const sortie = el('button', 'btn btn-action', 'Voter la sortie (unanime + amitié ≥ 60)');
      sortie.addEventListener('click', () => {
        const r = exitSecurityContract(world);
        sortie.textContent = r.message;
        sortie.disabled = !r.ok;
      });
      box.appendChild(sortie);
      body.appendChild(box);
    }
    if (allianceDesOmbres(world) > 0) {
      body.appendChild(el('p', 'panel-note', `🌑 Alliance des ombres : ${allianceDesOmbres(world)}. Quelque chose prend note de tes refus.`));
    }

    const grid = el('div', 'council-grid');
    const colonnes: ReadonlyArray<[string, GhostId[], string]> = [
      ['Voix actives', cols.actives, 'council-col council-actives'],
      ['Endormies', cols.endormies, 'council-col'],
      ['Hostiles', cols.hostiles, 'council-col council-hostiles'],
      ['Mortes', cols.mortes, 'council-col'],
      ['Inconnues', cols.inconnues, 'council-col'],
    ];
    for (const [label, ids, cls] of colonnes) {
      const col = el('div', cls);
      col.appendChild(el('h3', 'panel-sub', `${label} (${ids.length})`));
      for (const gid of ids) {
        const def = GHOST_DEFS_BY_ID[gid];
        const st = world.council.ghosts[gid];
        if (!def || !st) continue;
        const chip = el('button', 'ghost-chip');
        if (st.status === 'inconnu') {
          chip.classList.add('silhouette');
          chip.textContent = '?';
        } else {
          chip.textContent = `${def.emoji} ${def.name}`;
          chip.style.borderColor = def.color;
          chip.style.color = def.color;
          if (st.status === 'mort') chip.style.opacity = '0.6';
        }
        chip.addEventListener('click', () => selectGhost(gid));
        col.appendChild(chip);
      }
      grid.appendChild(col);
    }
    body.appendChild(grid);

    const detail = el('div', 'ghost-detail');
    body.appendChild(detail);

    function selectGhost(gid: GhostId, noteText = ''): void {
      const def = GHOST_DEFS_BY_ID[gid];
      const st = world.council.ghosts[gid];
      if (!def || !st) return;
      detail.replaceChildren();
      if (st.status === 'inconnu' || st.status === 'refuse') {
        const p = el('p', 'panel-desc',
          st.status === 'refuse'
            ? `${def.name} attend. Tu l’as repoussé — la voix reviendra quand tu auras avancé.`
            : 'Une silhouette. Tu ne sais pas encore qui se cache là — ni ce qui la ferait venir.');
        detail.appendChild(p);
        return;
      }
      if (st.status === 'fusionne') {
        detail.appendChild(el('p', 'panel-desc',
          `${def.name} s’est fondu dans Le Marché des Communs${gid === 'smith' ? ' (avec Elinor Ostrom)' : gid === 'ostrom' ? ' (avec Adam Smith)' : ''}. Ses mots parlent encore, mêlés à une autre voix.`));
        return;
      }
      const head = el('div', 'ghost-head');
      head.style.borderLeftColor = def.color;
      head.appendChild(el('span', 'ghost-name', `${def.emoji} ${def.name}`));
      head.appendChild(el('span', 'ghost-era', def.era));
      detail.appendChild(head);
      detail.appendChild(el('p', 'panel-desc', def.identity.portrait));

      const loyalRow = el('div', 'stat-row');
      loyalRow.appendChild(el('span', 'stat-label', 'Loyauté'));
      loyalRow.appendChild(el('span', 'stat-value', `${st.loyalty}/100`));
      detail.appendChild(loyalRow);
      const fiabRow = el('div', 'stat-row');
      fiabRow.appendChild(el('span', 'stat-label', 'Fiabilité perçue'));
      fiabRow.appendChild(el('span', 'stat-value', `${st.fiabilite}/100`));
      detail.appendChild(fiabRow);
      const doctrine = GHOST_DOCTRINES[gid];
      if (doctrine) {
        detail.appendChild(el('p', 'panel-note', `Doctrine : ${DOCTRINE_LABELS[doctrine]}.`));
      }
      if (gid === 'smith' || gid === 'ostrom') {
        const aff = affinityOf(world, 'smith', 'ostrom');
        const prog = world.council.fusionProgress['marche_des_communs'] ?? { marches: 0, communs: 0 };
        if (aff > 0 || prog.marches > 0 || prog.communs > 0) {
          detail.appendChild(el('p', 'panel-note',
            `Affinité Smith ↔ Ostrom : ${aff}/6 · décisions prises ensemble : marché ${prog.marches}/3, communs ${prog.communs}/3.`));
        }
      }

      if (ghostSignature(world, gid)) {
        detail.appendChild(el('p', 'ghost-sig', `✦ Signature — ${def.mecanique.signature80}`));
      }
      if (st.status === 'hostile') {
        detail.appendChild(el('p', 'ghost-hostile', `☠ Hostile — ${def.mecanique.hostile20}`));
      }
      if (st.status === 'actif') {
        const b = el('button', 'btn btn-action', 'Endormir cette voix (−1 loyauté/jour)');
        b.addEventListener('click', () => selectGhost(gid, councilSleep(world, gid).message));
        detail.appendChild(b);
      }
      if (st.status === 'endormi') {
        const b = el('button', 'btn btn-action', 'Réveiller cette voix');
        b.addEventListener('click', () => selectGhost(gid, councilWake(world, gid).message));
        detail.appendChild(b);
      }
      if (st.status === 'mort') {
        detail.appendChild(el('p', 'ghost-citation', `« ${st.lastWords} »`));
      }
      if (noteText) detail.appendChild(el('p', 'panel-note', noteText));

      detail.appendChild(el('h3', 'panel-sub', 'Historique des conseils'));
      if (st.history.length === 0) {
        detail.appendChild(el('p', 'panel-note', 'Pas encore de conseil.'));
      }
      for (const rec of [...st.history].reverse()) {
        const art = el('article', 'journal-entry');
        art.appendChild(el('p', 'panel-desc', `${dateOf(rec.day).label} — « ${rec.text} »`));
        const statut = rec.answered
          ? (rec.followed ? 'Suivi — loyauté +5' : 'Ignoré — loyauté −3')
          : 'En attente de ta réponse';
        const verite = rec.revealed ? ` · vérité : ${rec.veracite}` : ' · vérité : encore cachée';
        art.appendChild(el('p', 'panel-note', statut + verite));
        if (!rec.answered) {
          const row = el('div', 'reply-row');
          const suivre = el('button', 'btn btn-reply', 'Suivre (+5 loyauté)');
          suivre.addEventListener('click', () => selectGhost(gid, councilAnswerAdvice(world, gid, rec.adviceId, true).message));
          const ignorer = el('button', 'btn btn-reply', 'Ignorer (−3 loyauté)');
          ignorer.addEventListener('click', () => selectGhost(gid, councilAnswerAdvice(world, gid, rec.adviceId, false).message));
          row.appendChild(suivre);
          row.appendChild(ignorer);
          art.appendChild(row);
        }
        detail.appendChild(art);
      }
    }

    const first = cols.actives[0] ?? cols.endormies[0] ?? cols.hostiles[0] ?? cols.mortes[0];
    if (first) selectGhost(first);
    showModal('Le Conseil', 'les voix dans ta tête — 4 parlent, les autres attendent', body, true);
  }

  // ---------- Bandeau in-world (un fantôme parle) ----------

  let bannerUntil = 0;
  function showGhostBanner(n: Notification): void {
    const def = n.ghost ? GHOST_DEFS_BY_ID[n.ghost] : undefined;
    ui.bannerEl.textContent = n.text;
    ui.bannerEl.style.background = def ? `${def.color}22` : `${TOKENS.violet}22`;
    ui.bannerEl.style.borderColor = def?.color ?? TOKENS.violet;
    ui.bannerEl.classList.remove('hidden');
    bannerUntil = performance.now() + 7000;
  }

  function step(dx: number, dy: number): void {
    if (dx !== 0 && tryMove(world, dx, 0)) return;
    tryMove(world, 0, dy);
  }

  function frame(now: number): void {
    const dt = Math.min(100, now - last);
    last = now;

    if (bannerUntil > 0 && now >= bannerUntil) {
      ui.bannerEl.classList.add('hidden');
      bannerUntil = 0;
    }

    if (!modalOpen) {
      // Fusion prête : la scène attend le joueur (M6).
      if (world.council.pendingFusion) {
        openFusionScene();
      } else {
        // Scène d'arrivée : un fantôme attend le choix du joueur.
        const pend = councilPendingArrivals(world);
        if (pend.length > 0) {
          openArrivalScene(pend[0] ?? '');
        } else {
          const speed = world.time.speed;
          if (speed !== 0) {
            acc += dt;
            const tickMs = TICK_MS / speed;
            while (acc >= tickMs) {
              acc -= tickMs;
              const out = tickWorld(world);
              for (const n of out.notifications) {
                if (n.kind === 'fantome' || n.kind === 'journal') showGhostBanner(n);
              }
            }
          }
          moveAcc += dt;
          if (!world.player.asleep) {
            const d = input.dir();
            if (d.x !== 0 || d.y !== 0) {
              while (moveAcc >= MOVE_MS) {
                moveAcc -= MOVE_MS;
                step(d.x, d.y);
              }
            } else {
              moveAcc = Math.min(moveAcc, MOVE_MS);
            }
          }
        }
      }
    } else {
      acc = 0;
      moveAcc = 0;
    }

    renderWorld(ui.ctx, world, ui.cw, ui.ch, now);
    updateHud(ui, world, promptText());
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

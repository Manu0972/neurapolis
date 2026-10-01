/**
 * Le Conseil — moteur des fantômes (contrat M4 §3) : apparitions progressives
 * par déclencheurs, scène d'arrivée avec choix écouter/repousser (retour différé
 * à condition majorée), plafond de 4 voix actives, loyauté (0-100 : signature >80,
 * hostilité <20), mort symbolique après 3 jours à 0 (adieu + legs), véracité
 * secrète des conseils avec rétrospection 3-7 jours plus tard.
 * Données : src/data/ghosts (registry + scenes). État : w.council (types.ts).
 */
import type {
  DoctrineKey, GhostDef, GhostId, GhostState, Notification, WorldState,
} from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { rngInt } from '../core/rng';
import { COMPOSITE_DEFS, GHOST_DEFS, GHOST_DEFS_BY_ID } from '../data/ghosts/registry';
import { ADVICE_POOL, FAREWELLS, GHOST_DOCTRINES, OPPOSITE_DOCTRINE } from '../data/ghosts/scenes';
import { DOCTRINE_LABELS } from '../data/texts';
import { NOTION_BY_ID } from '../data/notions';
import { applyNotion, discoverNotion } from './notions';
import { notify, pushEvent, pushJournal } from './events';
import { fusionTick, recordPairApproval } from './fusions';
import { maybeProposeContract } from './security';
import { recordTaylorRefusal } from './antagonists';

export const MAX_ACTIVE_VOICES = 4;
export const REFUSAL_DELAY_DAYS = 2;   // jours avant qu'un fantôme repoussé puisse revenir
export const DEATH_DAYS_AT_ZERO = 3;   // loyauté à 0 pendant 3 jours → mort symbolique

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

export interface CouncilChoiceResult {
  ok: boolean;
  message: string;
}

export interface CouncilColumns {
  actives: GhostId[];
  endormies: GhostId[];
  hostiles: GhostId[];
  mortes: GhostId[];
  inconnues: GhostId[]; // silhouettes : jamais apparus + refusés (ils reviendront)
}

function adjustLoyalty(st: GhostState, delta: number): void {
  st.loyalty = clamp(st.loyalty + delta);
  if (st.loyalty > 0) st.loyaltyZeroDays = 0;
}

/**
 * Réconciliation des seuils 20/80 : loyauté < 20 ⇒ hostile (perturbe au lieu de
 * conseiller) ; retour ≥ 20 ⇒ endormi (le réveil est un choix du joueur).
 */
function reconcileStatus(w: WorldState, def: GhostDef, st: GhostState): void {
  if ((st.status === 'actif' || st.status === 'endormi') && st.loyalty < 20) {
    st.status = 'hostile';
    pushEvent(w, {
      type: 'antagonisme',
      title: `${def.name} devient hostile`,
      text: def.mecanique.hostile20,
      causes: [{ facteur: `loyauté de ${def.name}`, seuil: '20', poids: 3 }],
    });
  } else if (st.status === 'hostile' && st.loyalty >= 20) {
    st.status = 'endormi';
  }
}

/** Condition majorée d'un fantôme repoussé : il ne revient qu'en ayant avancé. */
function progressBeyond(w: WorldState, st: GhostState): boolean {
  const s = st.refusalSnapshot;
  if (!s) return true;
  for (const [k, v] of Object.entries(s.flags)) if ((w.flags[k] ?? 0) > v) return true;
  for (const [k, v] of Object.entries(s.characteristics)) {
    if ((w.player.characteristics[k as keyof typeof w.player.characteristics] ?? 0) > v) return true;
  }
  for (const [k, v] of Object.entries(s.npcStress)) if ((w.npcs[k]?.stress ?? 0) > v) return true;
  return false;
}

function snapshotOf(w: WorldState): NonNullable<GhostState['refusalSnapshot']> {
  const flags: Record<string, number> = {};
  for (const [k, v] of Object.entries(w.flags)) {
    if (!k.startsWith('__')) flags[k] = v; // jamais les compteurs internes
  }
  const characteristics: Record<string, number> = {};
  for (const [k, v] of Object.entries(w.player.characteristics)) characteristics[k] = v;
  const npcStress: Record<string, number> = {};
  for (const n of Object.values(w.npcs)) npcStress[n.id] = n.stress;
  return { flags, characteristics, npcStress };
}

/** Conseil spontané d'une voix active — véracité secrète, rétrospection 3-7 jours plus tard. */
function giveAdvice(w: WorldState, def: GhostDef, st: GhostState, out: Notification[]): void {
  const pool = ADVICE_POOL[def.id] ?? [];
  const day = dayIndexOf(w.time.tick);
  if (pool.length === 0) {
    st.nextAdviceDay = day + 1;
    return;
  }
  const rec = pool[st.history.length % pool.length];
  if (!rec) return;
  st.history.push({
    day,
    adviceId: rec.id,
    text: rec.text,
    veracite: rec.veracite,
    followed: false,
    revealDay: day + rngInt(w, 3, 7),
    revealed: false,
    answered: false,
  });
  st.lastWords = rec.text;
  st.nextAdviceDay = day + rngInt(w, 1, 3);
  pushEvent(w, {
    type: 'conseil',
    title: `Conseil de ${def.name}`,
    text: rec.text,
    causes: [{ facteur: `${def.name}, voix active`, poids: 2 }],
  });
  out.push(notify('fantome', `${def.name} : « ${rec.text} »`, def.id));
}

/** Rétrospection : la vérité du conseil est révélée (mensonge ⇒ fiabilité −20 permanent). */
function revealAdvice(
  w: WorldState, def: GhostDef, st: GhostState, rec: NonNullable<GhostState['history']>[number], out: Notification[],
): void {
  rec.revealed = true;
  let delta: number;
  let verdict: string;
  if (rec.veracite === 'mensonge') {
    delta = -20;
    verdict = `En y repensant : c’était faux, et ${def.name} le savait.`;
  } else if (rec.veracite === 'exageree') {
    delta = -5;
    verdict = 'En y repensant : il en rajoutait. Pas tout à fait tort — pas tout à fait vrai non plus.';
  } else {
    delta = 3;
    verdict = 'En y repensant : le conseil était juste.';
  }
  st.fiabilite = clamp(st.fiabilite + delta);
  pushEvent(w, {
    type: 'consequence',
    title: `Rétrospection — ${def.name}`,
    text: `${verdict} (« ${rec.text} »)`,
    causes: [
      { facteur: `véracité du conseil de ${def.name}`, seuil: rec.veracite, poids: rec.veracite === 'mensonge' ? 3 : 2 },
      { facteur: 'rétrospection 3-7 jours après le conseil', poids: 2 },
    ],
  });
  out.push(notify('journal', `Rétrospection : ${verdict}`, def.id));
}

/** Mort symbolique : adieu, citation gardée, legs (+1 notion). Définitive. */
function die(w: WorldState, def: GhostDef, st: GhostState): Notification {
  st.status = 'mort';
  st.loyaltyZeroDays = 0;
  const fw = FAREWELLS[def.id];
  const citation = fw?.citation ?? def.voice.echec;
  st.lastWords = citation;
  pushEvent(w, {
    type: 'consequence',
    title: `Adieu — ${def.name}`,
    text: `${(fw?.lines ?? ['La voix se tait.']).join(' ')} « ${citation} »`,
    causes: [{ facteur: `loyauté de ${def.name} à 0`, seuil: `${DEATH_DAYS_AT_ZERO} jours`, poids: 3 }],
  });
  let legacy = '';
  if (fw?.notion) legacy = grantLegacy(w, fw.notion);
  pushJournal(
    w,
    `${def.name} quitte le Conseil`,
    `Sa voix s’est tue après trois jours de silence. Il te laisse une phrase : « ${citation} »${legacy ? ` — et une leçon (${legacy})` : '.'}`,
  );
  return notify('fantome', `Adieu — ${def.name}. « ${citation} »${legacy ? ` ${legacy}` : ''}`, def.id);
}

/** Legs : la notion du fantôme (+1 découverte, ou +1 application vers la maîtrise). */
function grantLegacy(w: WorldState, notionId: string): string {
  const def = NOTION_BY_ID[notionId];
  if (!def) return '';
  const n = w.player.notions[notionId];
  if (!n) {
    const r = discoverNotion(w, notionId);
    return r.ok ? `Notion découverte : « ${def.name} ».` : '';
  }
  if (n.stage < 4) {
    const r = applyNotion(w, notionId, true);
    return r.ok ? `« ${def.name} » avance vers la maîtrise.` : '';
  }
  return '';
}

// ---------- Boucle de simulation (appelée par engine.ts) ----------

/** Vérifie les déclencheurs d’apparition et fait parler les voix actives. */
export function councilTick(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);

  for (const def of [...GHOST_DEFS, ...COMPOSITE_DEFS]) {
    const st = w.council.ghosts[def.id];
    if (!st) continue;
    reconcileStatus(w, def, st);
    if (st.arrivalPending) continue; // choix du joueur en attente (scène UI)
    if (st.status === 'inconnu') {
      if (def.apparition.condition(w)) {
        st.arrivalPending = true;
        out.push(notify('fantome', `${def.name} est là. Quelque chose veut te parler.`, def.id));
      }
    } else if (st.status === 'refuse') {
      if (day >= (st.returnDay ?? Number.POSITIVE_INFINITY)
        && def.apparition.condition(w) && progressBeyond(w, st)) {
        st.arrivalPending = true;
        st.returnDay = undefined;
        st.refusalSnapshot = undefined;
        out.push(notify('fantome', `${def.name} est revenu. Tu as avancé, depuis.`, def.id));
      }
    }
  }

  for (const def of [...GHOST_DEFS, ...COMPOSITE_DEFS]) {
    const st = w.council.ghosts[def.id];
    if (!st || st.status !== 'actif') continue;
    if (day < (st.nextAdviceDay ?? Number.POSITIVE_INFINITY)) continue;
    giveAdvice(w, def, st, out);
  }
  fusionTick(w, out);
  return out;
}

/** Décroît quotidien : endormi −1 loyauté/jour ; 3 jours à 0 → mort ; rétrospections. */
export function councilDay(w: WorldState): Notification[] {
  const out: Notification[] = [];
  const day = dayIndexOf(w.time.tick);

  for (const def of [...GHOST_DEFS, ...COMPOSITE_DEFS]) {
    const st = w.council.ghosts[def.id];
    if (!st) continue;
    if (st.status === 'endormi') adjustLoyalty(st, -1);
    reconcileStatus(w, def, st);
    if (st.status === 'actif' || st.status === 'endormi' || st.status === 'hostile') {
      if (st.loyalty <= 0) {
        st.loyaltyZeroDays += 1;
        if (st.loyaltyZeroDays >= DEATH_DAYS_AT_ZERO) out.push(die(w, def, st));
      } else {
        st.loyaltyZeroDays = 0;
      }
    }
    for (const rec of st.history) {
      if (!rec.revealed && rec.revealDay !== undefined && rec.revealDay <= day) {
        revealAdvice(w, def, st, rec, out);
      }
    }
  }
  maybeProposeContract(w, out);
  return out;
}

// ---------- Actions du joueur ----------

/** Choix de la scène d'arrivée : écouter (→ actif, max 4) ou repousser (→ refuse). */
export function councilArrivalChoose(
  w: WorldState, id: GhostId, choice: 'ecouter' | 'repousser',
): CouncilChoiceResult {
  const def = GHOST_DEFS_BY_ID[id];
  const st = w.council.ghosts[id];
  if (!def || !st) return { ok: false, message: 'Voix inconnue.' };
  if (!st.arrivalPending) return { ok: false, message: 'Aucune arrivée en attente.' };
  const day = dayIndexOf(w.time.tick);
  if (choice === 'ecouter') {
    if (councilActiveCount(w) >= MAX_ACTIVE_VOICES) {
      return { ok: false, message: `Quatre voix parlent déjà. Endors-en une d’abord (${MAX_ACTIVE_VOICES} max).` };
    }
    st.status = 'actif';
    st.arrivalPending = false;
    st.loyalty = 50;
    st.fiabilite = 60;
    st.loyaltyZeroDays = 0;
    st.returnDay = undefined;
    st.refusalSnapshot = undefined;
    st.nextAdviceDay = day + 1;
    pushEvent(w, {
      type: 'conseil',
      title: `${def.name} rejoint ton Conseil`,
      text: def.voice.favorable,
      causes: [{ facteur: 'choix : écouter la voix', poids: 2 }],
    });
    pushJournal(w, `${def.name} s’installe dans ton esprit`, def.voice.favorable);
    return { ok: true, message: `${def.name} t’accompagne maintenant.` };
  }
  st.status = 'refuse';
  st.arrivalPending = false;
  st.returnDay = day + REFUSAL_DELAY_DAYS;
  st.refusalSnapshot = snapshotOf(w);
  st.loyaltyZeroDays = 0;
  if (id === 'taylor') recordTaylorRefusal(w); // refus répétés → jauge des ombres (M6)
  pushEvent(w, {
    type: 'conseil',
    title: `${def.name} repoussé`,
    text: 'Tu refuses la voix. Elle se retire — elle reviendra quand tu auras avancé.',
    causes: [{ facteur: 'choix : repousser la voix', poids: 2 }],
  });
  return { ok: true, message: `La voix de ${def.name} s’est retirée.` };
}

/** Réveiller une voix endormie (plafond 4 actives). */
export function councilWake(w: WorldState, id: GhostId): CouncilChoiceResult {
  const def = GHOST_DEFS_BY_ID[id];
  const st = w.council.ghosts[id];
  if (!def || !st) return { ok: false, message: 'Voix inconnue.' };
  if (st.status !== 'endormi') return { ok: false, message: 'On ne réveille qu’une voix endormie.' };
  if (councilActiveCount(w) >= MAX_ACTIVE_VOICES) {
    return { ok: false, message: `Quatre voix parlent déjà (${MAX_ACTIVE_VOICES} max).` };
  }
  st.status = 'actif';
  st.nextAdviceDay = dayIndexOf(w.time.tick) + 1;
  return { ok: true, message: `${def.name} se remet à parler.` };
}

/** Endormir une voix active (silence ; loyauté −1/jour tant qu’elle dort). */
export function councilSleep(w: WorldState, id: GhostId): CouncilChoiceResult {
  const def = GHOST_DEFS_BY_ID[id];
  const st = w.council.ghosts[id];
  if (!def || !st) return { ok: false, message: 'Voix inconnue.' };
  if (st.status !== 'actif') return { ok: false, message: 'On n’endort qu’une voix active.' };
  st.status = 'endormi';
  return { ok: true, message: `${def.name} se tait (−1 loyauté par jour de silence).` };
}

/** Répondre à un conseil en attente : suivre (+5 loyauté) ou ignorer (−3). */
export function councilAnswerAdvice(w: WorldState, id: GhostId, adviceId: string, follow: boolean): CouncilChoiceResult {
  const def = GHOST_DEFS_BY_ID[id];
  const st = w.council.ghosts[id];
  if (!def || !st) return { ok: false, message: 'Voix inconnue.' };
  const rec = st.history.find((r) => r.adviceId === adviceId && !r.answered);
  if (!rec) return { ok: false, message: 'Conseil introuvable ou déjà répondu.' };
  rec.answered = true;
  rec.followed = follow;
  adjustLoyalty(st, follow ? 5 : -3);
  if (id === 'taylor' && !follow) recordTaylorRefusal(w); // refus répétés → jauge des ombres (M6)
  pushEvent(w, {
    type: 'conseil',
    title: `${def.name} — conseil ${follow ? 'suivi' : 'ignoré'}`,
    text: rec.text,
    causes: [{ facteur: `choix du joueur : ${follow ? 'suivre' : 'ignorer'} le conseil`, poids: 2 }],
  });
  return { ok: true, message: follow ? 'Loyauté +5.' : 'Loyauté −3.' };
}

/** Décision clé du projet : +8 aux voix alignées, −10 aux doctrines contraires, affinités +1. */
export function councilKeyDecision(w: WorldState, key: DoctrineKey): GhostId[] {
  const aligned: GhostId[] = [];
  for (const id of Object.keys(w.council.ghosts) as GhostId[]) {
    const st = w.council.ghosts[id];
    if (!st || st.status !== 'actif') continue;
    const doctrine = GHOST_DOCTRINES[id];
    if (!doctrine) continue;
    if (doctrine === key) {
      adjustLoyalty(st, 8);
      aligned.push(id);
    } else if (doctrine === OPPOSITE_DOCTRINE[key]) {
      adjustLoyalty(st, -10);
    }
  }
  w.council.decisions[key] += 1;
  recordPairApproval(w, key, aligned);
  pushEvent(w, {
    type: 'conseil',
    title: `Décision clé — ${DOCTRINE_LABELS[key]}`,
    text: `Décision alignée sur ${DOCTRINE_LABELS[key]} : voix alignées +8, doctrines contraires −10.`,
    causes: [{ facteur: `décision clé alignée sur ${DOCTRINE_LABELS[key]}`, poids: 3 }],
  });
  return aligned;
}

// ---------- Lectures pures (UI) ----------

export function councilActiveCount(w: WorldState): number {
  return Object.values(w.council.ghosts).filter((g) => g.status === 'actif').length;
}

/** Arrivées en attente du choix du joueur (scènes à afficher). */
export function councilPendingArrivals(w: WorldState): GhostId[] {
  return GHOST_DEFS.map((g) => g.id).filter((id) => w.council.ghosts[id]?.arrivalPending === true);
}

/** Colonnes de l'écran Conseil (y compris les composites nés d'une fusion). */
export function councilColumns(w: WorldState): CouncilColumns {
  const COLUMN_OF: Record<NonNullable<GhostState>['status'], keyof CouncilColumns> = {
    inconnu: 'inconnues',
    refuse: 'inconnues',
    actif: 'actives',
    endormi: 'endormies',
    hostile: 'hostiles',
    mort: 'mortes',
    fusionne: 'mortes',
  };
  const out: CouncilColumns = { actives: [], endormies: [], hostiles: [], mortes: [], inconnues: [] };
  for (const id of Object.keys(w.council.ghosts)) {
    const st = w.council.ghosts[id];
    if (!st || !GHOST_DEFS_BY_ID[id]) continue;
    out[COLUMN_OF[st.status]].push(id);
  }
  return out;
}

/** Capacité signature : loyauté > 80 (strict, contrat M4). */
export function ghostSignature(w: WorldState, id: GhostId): boolean {
  const st = w.council.ghosts[id];
  if (!st) return false;
  if (st.status !== 'actif' && st.status !== 'endormi' && st.status !== 'hostile') return false;
  return st.loyalty > 80;
}

export interface CouncilMobilizationResult {
  ok: boolean;
  message: string;
  mobilizedGhosts?: GhostId[];
  supportScore?: number;
}

/**
 * Mobilise les voix actives du Conseil pour préparer le débat citoyen (Chapitre 4).
 * Nécessite au moins 2 voix actives. Évalue la loyauté et les signatures.
 */
export function mobilizeCouncilForDebate(w: WorldState): CouncilMobilizationResult {
  if (w.campaign.currentChapter < 4) {
    return {
      ok: false,
      message: 'Le Conseil n’a pas encore besoin de se mobiliser pour le débat du quartier (attendre le Chapitre 4).',
    };
  }

  if ((w.flags['chapitre4ConseilMobilise'] ?? 0) > 0) {
    return {
      ok: true,
      message: 'Le Conseil a déjà été mobilisé pour préparer le débat.',
      supportScore: w.flags['chapitre4SupportConseil'] ?? 2,
    };
  }

  const activeIds = (Object.keys(w.council.ghosts) as GhostId[]).filter(
    (id) => w.council.ghosts[id]?.status === 'actif',
  );

  if (activeIds.length < 2) {
    return {
      ok: false,
      message: 'Le Conseil a besoin d’au moins deux voix actives pour formuler une pensée collective pour le quartier.',
    };
  }

  let support = 0;
  for (const id of activeIds) {
    const st = w.council.ghosts[id];
    if (!st) continue;
    if (st.loyalty >= 50) support += 1;
    if (ghostSignature(w, id)) support += 2;
  }
  // Décompte de l'hostilité des voix hostiles
  const hostileCount = Object.values(w.council.ghosts).filter((g) => g.status === 'hostile').length;
  support = Math.max(1, support - hostileCount);

  w.flags['chapitre4ConseilMobilise'] = 1;
  w.flags['chapitre4SupportConseil'] = support;
  w.player.characteristics.influence = Math.min(100, w.player.characteristics.influence + 3);
  w.player.characteristics.comprehension = Math.min(100, w.player.characteristics.comprehension + 2);

  const day = dayIndexOf(w.time.tick);
  pushEvent(w, {
    type: 'conseil',
    title: 'Mobilisation du Conseil pour le quartier',
    text: `Les penseurs de ton esprit s’accordent : ${activeIds.length} voix actives mobilisées pour préparer le débat citoyen (score de soutien : ${support}).`,
    causes: [
      { facteur: 'voix actives au Conseil', seuil: String(activeIds.length), poids: 3 },
      { facteur: 'préparation du grand débat citoyen', poids: 2 },
    ],
  });

  w.lifeJournal.push({
    day,
    date: dateOf(day).iso,
    title: 'Le Conseil s’accorde pour Val-Ferrand',
    text: 'Nos discussions intérieures ont porté leurs fruits. Les arguments sont affûtés, nous sommes prêts pour le grand débat sur la place.',
  });

  return {
    ok: true,
    message: `Le Conseil est mobilisé ! ${activeIds.length} voix actives consultées (score de soutien : ${support}).`,
    mobilizedGhosts: activeIds,
    supportScore: support,
  };
}

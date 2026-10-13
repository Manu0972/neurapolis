/**
 * Joueur scripté de la campagne (12 → 16 ans) — test de parcours, niveau simulation.
 *
 * Il démarre une partie neuve comme l'écran titre (`createCustomWorld`), passe la nuit de la
 * Maison du Peuple (`finishOrigin`), puis joue jour après jour par les VRAIES actions du moteur,
 * celles que les boutons du jeu appellent : stand (`project.ts`), contre-offensives (`rival.ts`),
 * dialogues (`dialogue.ts`), Conseil (`council.ts`), débat et fondation (`campaign.ts`), et le
 * temps qui passe par la routine de « Passer le temps » (`timeskip.ts`). Aucun drapeau n'est forcé.
 *
 * Contraintes de joueur réel respectées :
 *  - le joueur va en cours ; il n'agit qu'après les cours, le mercredi après-midi et le week-end ;
 *  - un lieu n'est utilisé que s'il est atteignable à pied depuis la maison (parcours en largeur
 *    sur la vraie grille de la ville) et l'action vérifie la même adjacence que le bouton du jeu ;
 *  - un PNJ n'est abordé que s'il est réellement présent au lieu à cette heure (sa routine).
 *
 * Il mesure : chapitre par chapitre (jour, âge, argent, besoins), spirales (argent négatif,
 * besoins au plafond plusieurs jours), blocages (objectif impossible, chapitre qui ne se termine
 * pas), exceptions, cahiers de Lucien découverts et épilogue.
 * Déterministe : tout passe par le PRNG du monde ; aucune horloge réelle.
 */
import { createCustomWorld } from '../../src/core/player_customization';
import { dateOf, dayIndexOf, isSchoolDay, isVacances, minutesOfDay } from '../../src/core/clock';
import { TICKS_PER_DAY, type NpcId, type PlaceId, type WorldState } from '../../src/core/types';
import { PLACE_ANCHORS, isWalkable } from '../../src/data/map';
import { CITY_H, CITY_W } from '../../src/data/city/layout';
import { LASTING_ECONOMIC_MODELS, URBAN_CHOICES, type LastingEconomicModelId, type UrbanChoiceId } from '../../src/data/campaign';
import { BEATS } from '../../src/data/story_registry';
import { STAND_CONFIG } from '../../src/data/project';
import { tickWorld } from '../../src/simulation/engine';
import { beginSkip, skipTime, stepSkip } from '../../src/simulation/timeskip';
import { attendClass, classWindow, isInClass } from '../../src/simulation/family';
import { finishOrigin, ensureStory } from '../../src/simulation/story';
import { placeAtAdjacent } from '../../src/simulation/interact';
import { npcsAt } from '../../src/simulation/npc';
import { npcLine, replyDialogue } from '../../src/simulation/dialogue';
import { adoptSharedRules, buyStock, createProject, recruitMember, runCourse, runSalesSession } from '../../src/simulation/project';
import { executeCounterStrategy, isCounterStrategyActive } from '../../src/simulation/rival';
import {
  councilActiveCount, councilAnswerAdvice, councilArrivalChoose, councilPendingArrivals,
  mobilizeCouncilForDebate, MAX_ACTIVE_VOICES,
} from '../../src/simulation/council';
import {
  calculateEpilogue, chapter4QuarterBacked, chapterObjectivesMet, foundLastingEconomicModel, getCampaignProgressSummary, holdCitizenDebate,
} from '../../src/simulation/campaign';
import { COUNTER_STRATEGIES } from '../../src/data/rivals';
import { WORKSHOP_CONFIG } from '../../src/data/workshop';
import {
  acceptOrder, buySalvageParts, createWorkshop, deliverOrder, maintainTools, repairOrder, scavengeParts,
} from '../../src/simulation/workshop';

/** « appliqué » tient son stand toute l'année ; « pressé » ne fait que les objectifs et saute des mois. */
export type Profil = 'applique' | 'presse';

export interface ParcoursOptions {
  seed: number;
  profil: Profil;
  /** Garde-fou : nombre maximal de jours joués (défaut : 5 ans). */
  maxDays?: number;
  /** Choix narratifs (par défaut : tournent avec la graine pour couvrir toutes les branches). */
  urbanChoice?: UrbanChoiceId;
  model?: LastingEconomicModelId;
  /** Observateur appelé chaque jour après les mesures (diagnostic, lecture seule). */
  observer?: (w: WorldState) => void;
}

export interface ChapitreBilan {
  chapter: number;
  title: string;
  /** Jour d'ouverture (0 pour le chapitre 1). */
  openedDay: number;
  /** Premier jour où tous les objectifs hors âge étaient remplis. */
  objectivesDay: number | null;
  completedDay: number | null;
  completedDate: string;
  age: number;
  money: number;
  needs: string;
  note: string;
}

/** Relevé économique d'une année scolaire (du 1er septembre au 31 août, ou jusqu'à la fin du parcours). */
export interface ReleveAnnuel {
  /** Année scolaire, ex. « 2020-21 ». */
  annee: string;
  /** Âge du joueur pendant cette année. */
  age: number;
  /** Date (ISO) du relevé. */
  date: string;
  /** Argent de poche au moment du relevé. */
  money: number;
  /** Chiffre d'affaires du stand sur l'année (ventes, courses, coopérative ; hors apports du joueur). */
  caStand: number;
  /** Dépenses du stand sur l'année (stock, contre-offensives payées par la caisse…). */
  depensesStand: number;
  /** Parts de gains reversées au joueur par le stand sur l'année. */
  partsJoueur: number;
  /** Apports de la poche du joueur à la caisse du stand sur l'année. */
  apports: number;
  /** Caisse du stand au moment du relevé. */
  caisse: number;
  stock: number;
  prix: number;
  reputation: number;
  confiance: number;
  vitalite: number;
  /** Parts de marché des rivaux (0-100), par rival. */
  rivaux: Record<string, number>;
  /** Atelier de la Friche : chiffre d'affaires de l'année, pièces, outils, fonds solidaire, commandes gardées. */
  atelier?: { ca: number; pieces: number; outils: number; fonds: number; commandes: number; livre: number };
  /** Taille des livres de comptes (stand + atelier) : la sauvegarde ne doit pas enfler sans fin. */
  ecritures: number;
}

export interface ParcoursBilan {
  seed: number;
  profil: Profil;
  finished: boolean;
  days: number;
  chapters: ChapitreBilan[];
  /** Problèmes de jeu détectés (spirales, blocages). Vide = parcours sain. */
  alerts: string[];
  /** Exceptions levées par le moteur (toujours un bug). */
  errors: string[];
  /** Dernières actions refusées par le jeu, avec leur message (diagnostic d'un blocage). */
  refusals: string[];
  minMoney: number;
  maxNeedsStreak: Record<string, number>;
  activeVoices: number;
  tier: number;
  concepts: number;
  cahiers: string[];
  epilogue?: { model: string; legacy: string; urban: string; ghost: string; text: string };
  finalState: { money: number; reputation: number; vitalite: number; confiance: number; team: number };
  /** Relevé économique année par année (une ligne par année scolaire commencée). */
  releves: ReleveAnnuel[];
  /** Clics « Passer le temps » du joueur pressé (mois, vacances). */
  sauts: { mois: number; vacances: number };
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

/**
 * Relevé de l'année scolaire qui commence le jour `fromDay` (inclus) : flux du stand jusqu'au jour
 * `toDay` exclu (défaut : demain), soldes et jauges arrêtés maintenant.
 */
export function releveAnnuel(w: WorldState, fromDay: number, age: number, toDay?: number): ReleveAnnuel {
  const today = dayIndexOf(w.time.tick);
  const end = toDay ?? today + 1;
  const y = dateOf(fromDay).y;
  const p = w.project;
  let ca = 0;
  let dep = 0;
  let parts = 0;
  let apports = 0;
  for (const e of p?.ledger ?? []) {
    if (e.day < fromDay || e.day >= end) continue;
    if (e.label.startsWith('Apport de capital')) { apports += e.amount; continue; }
    if (e.label.startsWith('Répartition — part de')) {
      if (e.label.endsWith(w.player.name)) parts -= e.amount;
      continue;
    }
    if (e.amount > 0) ca += e.amount;
    else dep -= e.amount;
  }
  const ws = w.workshop;
  let caAtelier = 0;
  for (const e of ws?.ledger ?? []) {
    if (e.day < fromDay || e.day >= end) continue;
    if (e.label.startsWith('Paiement réparation')) caAtelier += e.amount;
  }
  const rivaux: Record<string, number> = {};
  for (const [id, r] of Object.entries(w.rivals ?? {})) rivaux[id] = Math.round(r.marketShare);
  return {
    annee: `${y}-${String((y + 1) % 100).padStart(2, '0')}`,
    age,
    date: dateOf(today).iso,
    money: r2(w.player.money),
    caStand: r2(ca),
    depensesStand: r2(dep),
    partsJoueur: r2(parts),
    apports: r2(apports),
    caisse: r2(p?.balance ?? 0),
    stock: p?.stock ?? 0,
    prix: p?.price ?? 0,
    reputation: Math.round(w.player.reputation),
    confiance: Math.round(w.district.confianceQuartier),
    vitalite: Math.round(w.district.vitaliteEpicerie),
    rivaux,
    atelier: ws ? {
      ca: r2(caAtelier), pieces: ws.partsStock, outils: Math.round(ws.toolCondition), fonds: r2(ws.solidarityFund),
      commandes: ws.orders.length, livre: ws.completedRepairsCount,
    } : undefined,
    ecritures: (p?.ledger.length ?? 0) + (ws?.ledger.length ?? 0),
  };
}

const MIN = (h: number, m = 0): number => h * 60 + m;
const tickAt = (day: number, minutes: number): number => day * TICKS_PER_DAY + Math.floor(minutes / 10);

/** Lieux joignables à pied depuis la maison (parcours en largeur sur la grille réelle). */
export function lieuxAtteignables(): Record<PlaceId, boolean> {
  const start = PLACE_ANCHORS.maison;
  const seen = new Uint8Array(CITY_W * CITY_H);
  const queue = new Int32Array(CITY_W * CITY_H);
  let head = 0;
  let tail = 0;
  seen[start.y * CITY_W + start.x] = 1;
  queue[tail++] = start.y * CITY_W + start.x;
  while (head < tail) {
    const i = queue[head++]!;
    const x = i % CITY_W;
    const y = (i - x) / CITY_W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= CITY_W || ny >= CITY_H) continue;
      const j = ny * CITY_W + nx;
      if (seen[j] || !isWalkable(nx, ny)) continue;
      seen[j] = 1;
      queue[tail++] = j;
    }
  }
  const out = {} as Record<PlaceId, boolean>;
  for (const [place, a] of Object.entries(PLACE_ANCHORS) as [PlaceId, { x: number; y: number }][]) {
    out[place] = seen[a.y * CITY_W + a.x] === 1;
  }
  return out;
}

const URBAN_IDS = Object.keys(URBAN_CHOICES) as UrbanChoiceId[];
const MODEL_IDS = Object.keys(LASTING_ECONOMIC_MODELS) as LastingEconomicModelId[];

export function jouerCampagne(opts: ParcoursOptions): ParcoursBilan {
  const maxDays = opts.maxDays ?? 365 * 5;
  const urbanChoice = opts.urbanChoice ?? URBAN_IDS[opts.seed % URBAN_IDS.length]!;
  const modelChoice = opts.model ?? MODEL_IDS[opts.seed % MODEL_IDS.length]!;
  const reachable = lieuxAtteignables();

  // Nouvelle partie, comme l'écran titre, puis la nuit de la Maison du Peuple.
  const w: WorldState = createCustomWorld({ seed: opts.seed, customization: { firstName: 'Alex', lastName: 'Parcours' } });
  finishOrigin(w);

  const alerts: string[] = [];
  const errors: string[] = [];
  const refusals: string[] = [];
  const chapters: ChapitreBilan[] = [];
  const needsStreak: Record<string, number> = { faim: 0, fatigue: 0, stress: 0, moral: 0 };
  const maxNeedsStreak: Record<string, number> = { faim: 0, fatigue: 0, stress: 0, moral: 0 };
  let minMoney = w.player.money;
  let lastChapter = 0;
  let objectivesDay: number | null = null;
  let chapterOpenedDay = 0;
  const releves: ReleveAnnuel[] = [];
  const sauts = { mois: 0, vacances: 0 };
  let anneeDebut = 0;
  let anneeAge = w.player.age;

  const refus = (what: string, message: string): void => {
    refusals.push(`J${dayIndexOf(w.time.tick)} ${what} : ${message}`);
    if (refusals.length > 40) refusals.shift();
  };
  const alerte = (text: string): void => {
    if (!alerts.includes(text)) alerts.push(text);
  };

  /** Le temps passe par la routine du jeu (cours, repas, sommeil à la maison). */
  const routineJusqua = (target: number): void => {
    if (w.time.tick >= target) return;
    const s = beginSkip(w, 'jour');
    if (!('error' in s)) {
      s.target = target;
      while (!stepSkip(w, s, TICKS_PER_DAY)) { /* jour après jour */ }
    }
    // Saut interrompu (proposition de retour en arrière déclinée, cours en cours…) : on continue
    // à vivre avec la même routine que « Passer le temps ».
    while (w.time.tick < target) {
      if (classWindow(w) && !isInClass(w)) attendClass(w);
      const m = minutesOfDay(w.time.tick);
      if (m === MIN(12) || m === MIN(19)) w.player.needs.faim = Math.max(0, w.player.needs.faim - 55);
      tickWorld(w);
    }
  };
  /** Une action prend du temps sur place (sans rentrer à la maison). */
  const passer = (minutes: number): void => {
    const n = Math.max(1, Math.round(minutes / 10));
    for (let i = 0; i < n; i++) tickWorld(w);
  };
  /** Se rendre à pied à un lieu (trajet ≈ 15 min). Échec si le lieu n'est pas atteignable. */
  const allerA = (place: PlaceId): boolean => {
    if (!reachable[place]) {
      alerte(`Lieu inatteignable à pied depuis la maison : ${place}`);
      return false;
    }
    const a = PLACE_ANCHORS[place];
    w.player.pos = { x: a.x, y: a.y };
    passer(15);
    return placeAtAdjacent(w) === place;
  };
  /** Les arrivées de fantômes : le joueur appliqué les écoute (dans la limite de 4 voix). */
  const conseil = (): void => {
    for (const id of councilPendingArrivals(w)) {
      const r = councilArrivalChoose(w, id, councilActiveCount(w) < MAX_ACTIVE_VOICES ? 'ecouter' : 'repousser');
      if (!r.ok) refus(`arrivée ${id}`, r.message);
    }
    // Il suit un conseil en attente sur deux (un joueur attentif, pas aveugle).
    for (const [id, st] of Object.entries(w.council.ghosts)) {
      if (st.status !== 'actif') continue;
      for (const rec of st.history) {
        if (rec.answered) continue;
        councilAnswerAdvice(w, id, rec.adviceId, (rec.day + opts.seed) % 2 === 0);
      }
    }
  };
  /** Parler à un PNJ présent, avec une réplique choisie. Renvoie faux s'il n'est pas là. */
  const parler = (npc: NpcId, topic: string, reply: string): boolean => {
    const place = (Object.keys(PLACE_ANCHORS) as PlaceId[]).find((p) => p !== 'maison' && npcsAt(w, p).some((n) => n.id === npc));
    if (!place) return false;
    if (!allerA(place)) return false;
    if (!npcsAt(w, place).some((n) => n.id === npc)) return false; // parti pendant le trajet
    npcLine(w, npc, topic);
    replyDialogue(w, npc, reply);
    passer(10);
    return true;
  };
  const vendre = (): boolean => {
    const p = w.project;
    if (!p?.active) return false;
    if (p.stock <= 0) {
      const r = buyStock(w);
      if (!r.ok) { refus('acheter du stock', r.message); return false; }
    }
    const lieu: PlaceId = 'place';
    if (!allerA(lieu)) return false;
    const r = runSalesSession(w, lieu);
    passer(STAND_CONFIG.sessionMinutes);
    if (!r.ok) refus('tenir le stand', r.message);
    return r.ok;
  };
  const course = (): boolean => {
    if (!allerA('epicerie')) return false;
    const r = runCourse(w);
    passer(STAND_CONFIG.courseMinutes);
    if (!r.ok) refus('course', r.message);
    return r.ok;
  };
  /** Le dimanche à la Friche avec Karim : ouvrir l'atelier, puis réparer et livrer (écran Atelier). */
  const atelier = (libre: () => boolean): void => {
    if (!allerA('friche')) return;
    if (!w.workshop?.active) {
      const r = createWorkshop(w);
      if (!r.ok) { refus('ouvrir l’atelier', r.message); return; }
      passer(30);
    }
    const ws = w.workshop!;
    for (let n = 0; n < 3 && libre(); n++) {
      if (ws.toolCondition < 40) {
        const r = maintainTools(w);
        if (!r.ok) { refus('entretenir les outils', r.message); break; }
        passer(30);
      }
      const order = ws.orders.find((o) => o.status === 'en_cours') ?? ws.orders.find((o) => o.status === 'disponible');
      if (!order) break;
      if (order.status === 'disponible') acceptOrder(w, order.id);
      if (ws.partsStock < order.partsRequired) {
        // Pièces : la caisse ou la poche si possible, sinon une heure de fouille.
        const r = ws.balance + w.player.money >= WORKSHOP_CONFIG.partsBatchCost ? buySalvageParts(w) : scavengeParts(w);
        passer(r.ok && r.message.startsWith('Fouille') ? WORKSHOP_CONFIG.scavengeDurationMinutes : 15);
        if (!r.ok) { refus('pièces', r.message); break; }
        if (ws.partsStock < order.partsRequired) continue;
      }
      const rr = repairOrder(w, order.id);
      passer(WORKSHOP_CONFIG.repairDurationMinutes);
      if (!rr.ok) { refus('réparer', rr.message); break; }
      const rd = deliverOrder(w, order.id);
      if (!rd.ok) refus('livrer', rd.message);
    }
  };

  /** Contre-offensive la moins chère disponible (l'écran Concurrence). */
  const contreOffensive = (): boolean => {
    const choices = [...COUNTER_STRATEGIES].sort((a, b) => a.costMoney - b.costMoney);
    for (const def of choices) {
      const rival = w.rivals[def.rivalId];
      if (!rival || isCounterStrategyActive(w, rival, def.id)) continue;
      if (w.player.money < def.costMoney) continue;
      const ticks = Math.ceil(def.costTimeMinutes / 10);
      const r = executeCounterStrategy(w, def.id, ticks);
      if (!r.ok) { refus(`contre-offensive ${def.id}`, r.message); continue; }
      passer(def.costTimeMinutes);
      return true;
    }
    refus('contre-offensive', `aucune abordable (poche ${w.player.money.toFixed(2)} €)`);
    return false;
  };

  // Le chapitre 1 n'a pas de condition d'âge : il se conclut dès ses objectifs remplis.
  const objectifsHorsAge = (): boolean => w.campaign.currentChapter !== 1 && chapterObjectivesMet(w);

  /** Ce que fait le joueur pendant son temps libre, selon le chapitre. */
  const tempsLibre = (finMinutes: number): void => {
    const day = dayIndexOf(w.time.tick);
    const libre = (): boolean => minutesOfDay(w.time.tick) < finMinutes - 30 && dayIndexOf(w.time.tick) === day;
    const ch = w.campaign.currentChapter;
    const p = w.project;
    const done = w.campaign.completedChapters.includes(5);

    // Chapitre 1 : le stand, l'équipe, une contre-offensive.
    if (!p?.active) {
      const r = createProject(w);
      if (!r.ok) refus('créer le stand', r.message);
    }
    if (ch === 1) {
      // Contre-offensive tant qu'il reste de l'argent de poche (avant le premier stock).
      if ((w.flags['contreStrategiesLancees'] ?? 0) < 1 && libre()) contreOffensive();
      // L'équipe : il faut Communication 2 pour convaincre — on discute avec les copains.
      while (libre() && (w.player.skills.communication?.level ?? 0) < STAND_CONFIG.recruitMinLevel) {
        if (!parler('noah', 'projet', 'motive') && !parler('lina', 'projet', 'chaleureux')
          && !parler('yasmine', 'accueil', 'chaleureux')) break;
      }
      for (const id of STAND_CONFIG.recruitables) {
        if (w.project && !w.project.members.includes(id) && (w.player.skills.communication?.level ?? 0) >= STAND_CONFIG.recruitMinLevel) {
          const r = recruitMember(w, id);
          if (!r.ok) refus(`recruter ${id}`, r.message);
        }
      }
      for (let i = 0; i < 3 && libre() && (w.flags['ventes'] ?? 0) < 3; i++) if (!vendre()) break;
      return;
    }

    // Chapitre 2 : Samir à la Friche (sujet « coop »), règles partagées, une vente collective.
    if (ch === 2) {
      if (w.project && !w.project.rules.collectif) {
        for (const id of STAND_CONFIG.recruitables) {
          if (!w.project.members.includes(id)) {
            const r = recruitMember(w, id);
            if (!r.ok) refus(`recruter ${id}`, r.message);
          }
        }
        const r = adoptSharedRules(w);
        if (!r.ok) refus('règles partagées', r.message);
      }
      if ((w.flags['chapitre2ConversationCoopSamir'] ?? 0) < 1 && libre()) {
        if (!parler('samir', 'coop', 'curieux')) refus('parler à Samir', 'absent à cette heure');
      }
      if ((w.flags['chapitre2VentesCollectives'] ?? 0) < 1 && libre()) vendre();
    }

    // Chapitre 3 : cinq courses pour l'épicerie, une nouvelle contre-offensive.
    if (ch === 3) {
      const start = (w.flags['chapitre3ContreStrategiesDepart'] ?? 0);
      if ((w.flags['contreStrategiesLancees'] ?? 0) - start < 1 && libre()) contreOffensive();
      for (let i = 0; i < 5 && libre() && !objectifsHorsAge(); i++) if (!course()) break;
    }

    // Chapitre 4 : le Conseil, puis le débat sur la place (à 15 ans), la confiance du quartier.
    if (ch === 4) {
      if ((w.flags['chapitre4ConseilMobilise'] ?? 0) < 1) {
        const r = mobilizeCouncilForDebate(w);
        if (!r.ok) refus('mobiliser le Conseil', r.message);
      }
      if ((w.flags['chapitre4DebatCitoyen'] ?? 0) < 1 && w.player.age >= 15 && libre()) {
        if (allerA('place')) {
          const r = holdCitizenDebate(w, urbanChoice);
          if (!r.ok) refus(`débat (${urbanChoice})`, r.message);
          else passer(60);
        }
      }
      // Quartier pas encore convaincu : le joueur suit l'indice du HUD (courses pour l'épicerie).
      if ((w.flags['chapitre4DebatCitoyen'] ?? 0) > 0 && !chapter4QuarterBacked(w)) {
        for (let i = 0; i < 3 && libre(); i++) if (!course()) break;
      }
    }

    // Chapitre 5 : fonder le modèle économique.
    if (ch === 5 && !done && (w.flags['chapitre5ModeleFonde'] ?? 0) < 1) {
      const r = foundLastingEconomicModel(w, modelChoice);
      if (!r.ok) refus(`fonder ${modelChoice}`, r.message);
    }

    // Le joueur appliqué fait vivre son stand le samedi et rend une course le mercredi.
    if (opts.profil === 'applique' && !done) {
      const wd = dateOf(day).weekday;
      if (wd === 6) for (let i = 0; i < 2 && libre(); i++) vendre();
      if (wd === 3 && libre()) course();
      // Le dimanche, à partir du chapitre de la Friche : l'atelier de réparation avec Karim.
      if (wd === 0 && ch >= 2 && libre()) atelier(libre);
    }
  };

  // ---------- Boucle principale : un jour après l'autre ----------
  try {
    while (dayIndexOf(w.time.tick) < maxDays) {
      const day = dayIndexOf(w.time.tick);
      const ch = w.campaign.currentChapter;
      if (ch !== lastChapter) {
        chapterOpenedDay = day;
        objectivesDay = null;
        lastChapter = ch;
      }
      if (objectivesDay === null && objectifsHorsAge()) objectivesDay = day;

      // Temps libre : après les cours, le mercredi après-midi, toute la journée sinon.
      const school = isSchoolDay(day);
      const wd = dateOf(day).weekday;
      const debut = !school ? MIN(9) : wd === 3 ? MIN(12, 30) : MIN(16, 40);
      const fin = MIN(19);
      routineJusqua(tickAt(day, debut));
      conseil();

      const waitingForAge = objectivesDay !== null;
      if (opts.profil === 'presse' && waitingForAge && !w.campaign.completedChapters.includes(5)) {
        // Le joueur pressé a fini ses objectifs : il fait passer le temps — les vacances d'un
        // coup quand il y est, sinon mois par mois (les deux boutons de « Passer le temps »).
        const kind = isVacances(dayIndexOf(w.time.tick)) ? 'vacances' : 'mois';
        const r = skipTime(w, kind);
        if ('error' in r) refus(`passer ${kind === 'mois' ? 'le mois' : 'les vacances'}`, r.error);
        else sauts[kind] += 1;
      } else {
        tempsLibre(fin);
        routineJusqua(tickAt(dayIndexOf(w.time.tick) + 1, MIN(7)));
      }
      conseil();

      // Relevé annuel : chaque 1er septembre (l'âge change), on clôt l'année écoulée.
      if (w.player.age > anneeAge) {
        const veille = dayIndexOf(w.time.tick);
        let debutNouvelle = veille;
        while (dateOf(debutNouvelle).m !== 9 || dateOf(debutNouvelle).d !== 1) debutNouvelle--;
        const r = releveAnnuel(w, anneeDebut, anneeAge, debutNouvelle);
        releves.push(r);
        anneeDebut = debutNouvelle;
        anneeAge = w.player.age;
      }

      // Mesures du jour.
      minMoney = Math.min(minMoney, w.player.money);
      if (w.player.money < 0) alerte(`Argent de poche négatif (${w.player.money.toFixed(2)} €) le jour ${dayIndexOf(w.time.tick)}`);
      const n = w.player.needs;
      const hot: Record<string, boolean> = { faim: n.faim >= 90, fatigue: n.fatigue >= 90, stress: n.stress >= 90, moral: n.moral <= 10 };
      for (const k of Object.keys(hot)) {
        needsStreak[k] = hot[k] ? (needsStreak[k] ?? 0) + 1 : 0;
        maxNeedsStreak[k] = Math.max(maxNeedsStreak[k] ?? 0, needsStreak[k] ?? 0);
        if ((needsStreak[k] ?? 0) >= 7) alerte(`Besoin « ${k} » au plafond 7 jours de suite (spirale) vers le jour ${dayIndexOf(w.time.tick)}`);
      }

      opts.observer?.(w);

      // Chapitres terminés depuis le dernier passage.
      for (const c of w.campaign.completedChapters) {
        if (chapters.some((x) => x.chapter === c)) continue;
        const stage = w.campaign.stages.find((s) => s.chapter === c);
        const d = dayIndexOf(w.time.tick);
        chapters.push({
          chapter: c,
          title: stage?.title ?? `Chapitre ${c}`,
          openedDay: c === lastChapter ? chapterOpenedDay : chapterOpenedDay,
          objectivesDay,
          completedDay: d,
          completedDate: dateOf(d).iso,
          age: w.player.age,
          money: Math.round(w.player.money * 100) / 100,
          needs: `faim ${Math.round(n.faim)} · fatigue ${Math.round(n.fatigue)} · stress ${Math.round(n.stress)} · moral ${Math.round(n.moral)}`,
          note: getCampaignProgressSummary(w).prompt,
        });
      }
      if (w.campaign.completedChapters.includes(5)) break;

      // Blocage : objectifs non remplis 200 jours après l'âge requis du chapitre.
      const stage = w.campaign.stages.find((s) => s.chapter === w.campaign.currentChapter);
      if (stage && !stage.completed) {
        const ageDay = (stage.targetAge - 12) * 365;
        if (dayIndexOf(w.time.tick) > Math.max(chapterOpenedDay, ageDay) + 200) {
          alerte(`Chapitre ${stage.chapter} bloqué : ${getCampaignProgressSummary(w).prompt}`);
          break;
        }
      }
    }
  } catch (err) {
    errors.push(`J${dayIndexOf(w.time.tick)} chapitre ${w.campaign.currentChapter} : ${(err as Error).stack ?? String(err)}`);
  }

  const finished = w.campaign.completedChapters.includes(5);
  if (!finished && errors.length === 0 && !alerts.some((a) => a.includes('bloqué'))) {
    alerte(`Campagne non terminée après ${dayIndexOf(w.time.tick)} jours : ${getCampaignProgressSummary(w).prompt}`);
  }
  if (dayIndexOf(w.time.tick) > anneeDebut) releves.push(releveAnnuel(w, anneeDebut, anneeAge));
  const story = ensureStory(w);
  let epilogue: ParcoursBilan['epilogue'];
  if (finished) {
    const e = calculateEpilogue(w);
    epilogue = { model: e.modelTitle, legacy: e.legacyTitle, urban: e.urbanChoiceTitle, ghost: e.dominantGhost.name, text: e.epilogueText };
  }
  return {
    seed: opts.seed,
    profil: opts.profil,
    finished,
    days: dayIndexOf(w.time.tick),
    chapters,
    alerts,
    errors,
    refusals,
    minMoney: Math.round(minMoney * 100) / 100,
    maxNeedsStreak,
    activeVoices: councilActiveCount(w),
    tier: w.ascension?.tier ?? 1,
    concepts: Object.keys(w.ascension?.concepts ?? {}).length,
    cahiers: BEATS.filter((b) => story.seen[b.id] !== undefined).map((b) => b.id),
    epilogue,
    finalState: {
      money: Math.round(w.player.money * 100) / 100,
      reputation: Math.round(w.player.reputation),
      vitalite: Math.round(w.district.vitaliteEpicerie),
      confiance: Math.round(w.district.confianceQuartier),
      team: w.project?.members.length ?? 0,
    },
    releves,
    sauts,
  };
}

/** Rapport lisible (sortie des tests et de l'outil en ligne de commande). */
export function formatBilan(b: ParcoursBilan): string {
  const lines: string[] = [];
  lines.push(`— Graine ${b.seed} · joueur ${b.profil} · ${b.finished ? 'CAMPAGNE TERMINÉE' : 'NON TERMINÉE'} en ${b.days} jours`);
  for (const c of b.chapters) {
    lines.push(`  Ch.${c.chapter} ${c.title} : ouvert J${c.openedDay}, objectifs J${c.objectivesDay ?? '—'}, terminé J${c.completedDay} (${c.completedDate}) à ${c.age} ans · poche ${c.money.toFixed(2)} € · ${c.needs}`);
  }
  lines.push(`  Argent minimal ${b.minMoney.toFixed(2)} € · séries besoins au plafond ${JSON.stringify(b.maxNeedsStreak)} · voix actives ${b.activeVoices} · palier ${b.tier} · concepts ${b.concepts}`);
  lines.push(`  Fin : ${JSON.stringify(b.finalState)}`);
  if (b.sauts.mois + b.sauts.vacances > 0) lines.push(`  Passer le temps : ${b.sauts.mois} × « mois », ${b.sauts.vacances} × « vacances »`);
  lines.push(...formatReleves(b.releves));
  lines.push(`  Cahiers de Lucien : ${b.cahiers.length ? b.cahiers.join(', ') : 'aucun'}`);
  if (b.epilogue) lines.push(`  Épilogue : ${b.epilogue.legacy} — ${b.epilogue.model} · ${b.epilogue.urban} · voix de ${b.epilogue.ghost}`);
  for (const a of b.alerts) lines.push(`  ⚠ ${a}`);
  for (const e of b.errors) lines.push(`  ✗ ${e.split('\n').slice(0, 4).join(' | ')}`);
  if (!b.finished || b.alerts.length) for (const r of b.refusals.slice(-12)) lines.push(`    refus ${r}`);
  return lines.join('\n');
}

/** Tableau lisible du relevé annuel (une ligne par année scolaire). */
export function formatReleves(releves: ReleveAnnuel[]): string[] {
  const lines = ['  Année    | âge | relevé     | poche €  | CA stand € | dépenses € | parts € | apports € | caisse € | stock | prix | répu | confiance | vitalité | rivaux'];
  for (const r of releves) {
    const riv = Object.entries(r.rivaux).map(([id, v]) => `${id} ${v}%`).join(' ');
    const at = r.atelier ? ` | atelier CA ${r.atelier.ca.toFixed(2)} € · pièces ${r.atelier.pieces} · outils ${r.atelier.outils} % · fonds ${r.atelier.fonds.toFixed(2)} € · commandes ${r.atelier.commandes} · livrées ${r.atelier.livre}` : '';
    lines.push(`  ${r.annee.padEnd(8)} | ${String(r.age).padStart(3)} | ${r.date} | ${r.money.toFixed(2).padStart(8)} | ${r.caStand.toFixed(2).padStart(10)} | ${r.depensesStand.toFixed(2).padStart(10)} | ${r.partsJoueur.toFixed(2).padStart(7)} | ${r.apports.toFixed(2).padStart(9)} | ${r.caisse.toFixed(2).padStart(8)} | ${String(r.stock).padStart(5)} | ${r.prix.toFixed(2)} | ${String(r.reputation).padStart(4)} | ${String(r.confiance).padStart(9)} | ${String(r.vitalite).padStart(8)} | ${riv} | écritures ${r.ecritures}${at}`);
  }
  return lines;
}

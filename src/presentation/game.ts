/**
 * Boucle de jeu : temps réel → ticks de simulation → rendu Canvas + HUD.
 * Panneaux (lieu/dialogue) : la simulation est en pause tant qu'un panneau est ouvert.
 * La présentation ne fait qu'appeler les actions de simulation et lire l'état.
 */
import { createWorld } from '../core/store';
import { runTicks, tickWorld } from '../simulation/engine';
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
  acceptOrder, buySalvageParts, createWorkshop, deliverOrder,
  ledgerInvariantHolds as workshopLedgerInvariantHolds,
  ledgerBalance as workshopLedgerBalance,
  maintainTools, repairOrder, scavengeParts, setTariffMode,
  workshopWeeklyDistribution,
} from '../simulation/workshop';
import { TARIFF_GRID, WORKSHOP_CONFIG } from '../data/workshop';
import {
  councilAnswerAdvice, councilArrivalChoose, councilColumns, councilPendingArrivals,
  councilSleep, councilWake, ghostSignature, mobilizeCouncilForDebate,
} from '../simulation/council';
import {
  calculateEpilogue, foundLastingEconomicModel, holdCitizenDebate, type EpilogueResult,
} from '../simulation/campaign';
import { LASTING_ECONOMIC_MODELS, URBAN_CHOICES, type LastingEconomicModelId, type UrbanChoiceId } from '../data/campaign';
import { contractChoose, exitSecurityContract, securityPending } from '../simulation/security';
import { affinityOf, fusionConfirm } from '../simulation/fusions';
import { allianceDesOmbres } from '../simulation/antagonists';
import { calculateMarketShares, counterStrategyDaysRemaining, executeCounterStrategy, getAvailableCounterStrategies, isCounterStrategyActive } from '../simulation/rival';
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
import { dateOf, dayIndexOf, minutesOfDay } from '../core/clock';
import type { CharacteristicsId, GhostId, NpcId, Notification, PlaceId, Rel4, RepartitionMode, SkillId, SolidarityTariff, TerritorialZoneId, VendorId, VentureId, VentureRole, WorldState } from '../core/types';
import { ZERO_REL } from '../core/types';
import { createInput } from './input';
import { renderWorld } from './renderer';
import { buildUi, el, resizeCanvas, updateHud, showGhostAdvicePopup, MOOD_EMOTICONS, type UiRefs } from './ui';
import { TOKENS } from './tokens';
import { avatarElement } from './avatar';
import { loadAssetKit } from './asset-loader';
import { audio, type AmbientLocation } from './audio';
import { CityRenderer } from './city3d/CityRenderer';
import { moveToTile } from '../simulation/movement';
import { openPhone, type PhoneApp } from './phone';
import { BUSINESS_TYPE_BY_ID, WHOLESALER_BY_ID } from '../data/economy';
import { UNIT_BY_ID, ensureEconomy, pickUpOrder, pickupPoint, unloadAt, businessDoor } from '../simulation/economy';
import { streetNameAt, unitAt } from '../data/map';
import { COMPETITOR_BY_UNIT } from '../data/city/competitors';
import { drawMinimap, renderCityMap } from './minimap';
import { PENDING_LOAD_KEY, deleteSlot, exportSave, importSave, saveToSlot, slotSummary } from '../saves/persist';
import { businessInteriorSpec, destinationSpec, placeHasInterior, placeInteriorSpec } from './city3d/interior3d';
import { useFurniture } from '../simulation/interior_actions';
import { JOB, inShift, startShift } from '../simulation/jobs';
import { hhmmOfTick } from '../core/clock';
import { appeal } from '../simulation/economy';
import { ownsBike } from '../simulation/vehicles';
import {
  DESTINATIONS, DESTINATION_BY_ID, activitiesAt, activityDoneThisTrip, canTravel, currentDestination, doTravelActivity,
  isOnSite, isTraveling, leaveDestination, startTravel, travelSlotsLeft,
} from '../simulation/travel';
import { LAMINOIR_OPTIONS, chooseLaminoirFuture, laminoirDecisionPending } from '../simulation/laminoir';
import { BUS_HOURS, busFare, busRideTicks, busRunning, isOnBus, stopNear, takeBus } from '../simulation/transit';
import { BUS_STOPS, BUS_STOP_BY_ID } from '../data/city/transit';
import { createGhostBar } from './ghost-bar';
import { createNewsToaster, openSurpriseModal } from './news-ui';
import { pendingSurprise } from '../simulation/happenings';
import { isSilenced, lessonWarnings, rewindOffer, sacrificeCandidates } from '../simulation/rewind';
import { recordDay } from '../saves/chronicle';
import { openRewindModal } from './rewind-ui';
import { openConvocationModal, openDinnerModal, openFamilyPanel } from './family-ui';
import { bedroomExtras, openPlanner, openShelf, type PlanCtx } from './plan-ui';
import { openDuelModal } from './ascension-ui';
import { openNotebooks, openUnreadBeat, playOrigin } from './story-ui';
import { ensureRoom, planChecklist } from '../simulation/room';
import { searchSecret, secretHere } from '../simulation/secrets';
import { IDEA_BY_ID } from '../data/ascension/ideas';
import { attendClass, classWindow, ensureFamily, isHome, isInClass, pendingDinner } from '../simulation/family';
import { mostUrgentTip } from '../simulation/ghost_tips';
import { CITY, PLACE_ANCHORS } from '../data/map';
import * as economyApi from '../simulation/economy';
import { openDetailedInteriorModal } from './interiors';
import { tileAt } from '../data/map';
import { VENDOR_DEFS } from '../data/vendors';
import { buyVendorSpecialGood, ensureVendorsState } from '../simulation/vendors';
import { activateActionPlan, ensureActionPlanningState, payTerritoryConcession, progressActionPlanStep, selectTacticalBranch, unlockTerritoryNode } from '../simulation/action_plan';
import { VENTURE_DEFS, VENTURE_ROLE_DEFS } from '../data/multi_ventures';
import { assignVentureRole, ensureMultiVentureState, resolveEconomicHazard, unassignVentureRole, updateVentureSynergies } from '../simulation/multi_ventures';
import { ensureMacroNewsState, triggerCustomMarketShock } from '../simulation/macro_news';
import { attendSchoolClass, ensureSchoolLifeState, negotiateWithTeacher, skipSchoolForBusiness, studyEveningHomework, talkWithParents } from '../simulation/school_life';
import { ensureStreetRecognitionState, handleStreetEncounterChoice } from '../simulation/street_synergies';
import { askActiveGhostAdvice, checkAndUnlockThinkers, getGhostCompanionThought, switchCompanionGhost } from '../simulation/ghost_companions';
import { INITIAL_TUTORIALS } from '../data/tutorials';

/**
 * Un tick simulé dure 10 minutes de jeu. À vitesse ×1, 1 minute de jeu = 1 seconde réelle
 * (docs/DECISIONS.md, 2026-10-07) : une journée éveillée dure environ 16 minutes réelles.
 */
const TICK_MS = 10_000;
/** Multiplicateur de vitesse pendant le sommeil : une nuit de 9 h passe en ~5 s. */
const NIGHT_SPEED = 120;
/** En bus, un trajet de 10 à 30 minutes passe en une ou deux secondes. */
const BUS_SPEED = 25;
/** En voyage, trois jours passent en ~20 s. */
const TRAVEL_SPEED = 200;
/** Pendant un petit boulot, deux heures de service passent en ~15 s. */
const SHIFT_SPEED = 50;
/** En cours, une demi-journée de classe passe en une dizaine de secondes. */
const CLASS_SPEED = 25;
const MOVE_MS = 150;  // cadence d'un pas de tuile en maintenant une direction

const REL_DIMS: ReadonlyArray<keyof Rel4> = ['amitie', 'confiance', 'respect', 'rivalite'];

export function startGame(root: HTMLElement, initialWorld: WorldState = createWorld()): void {
  const world: WorldState = initialWorld;
  root.replaceChildren();
  const ui = buildUi(root);
  // Barre des fantômes : leurs têtes en haut de l'écran, qui bougent quand ils veulent parler.
  const ghostBar = createGhostBar(root, () => world, () => modalOpen);
  let lastTipText = '';
  // Notifications façon téléphone pour le fil d'infos ; un clic ouvre l'application « Infos ».
  const newsToaster = createNewsToaster(root, () => openPhoneUi('infos'));
  let surpriseRetryTick = 0;
  // Nouvelle partie : la nuit de la Maison du Peuple, avant tout le reste. Le jeu attend.
  if (!world.story?.originDone) {
    // Différé : l'état de l'interface (modalOpen…) est déclaré plus bas dans startGame.
    queueMicrotask(() => {
      modalOpen = true;
      playOrigin(root, world, () => { modalOpen = false; });
    });
  }
  // Chronique : un instantané chaque matin pour un éventuel retour en arrière.
  try { recordDay(world); } catch { /* stockage indisponible */ }
  let rewindOfferKey = '';
  let dinnerShownId = '';
  let convocationShownDay = -1;
  let classReminderKey = '';
  // Plans de la chambre : petit rappel en haut à gauche, un clic ouvre le tableau.
  const planChip = el('button', 'plan-chip hidden', '');
  planChip.type = 'button';
  planChip.addEventListener('click', () => openPlanner(planCtx()));
  root.appendChild(planChip);
  function planCtx(): PlanCtx {
    return {
      world, showModal, closeModal, toast,
      openDuel: () => openDuelModal({ world, showModal, closeModal, toast, onChange: () => updateHud(ui, world, promptText()) }, () => openPhoneUi('ascension')),
    };
  }
  function syncPlanChip(): void {
    const p = ensureRoom(world).plans[0];
    const idea = p ? IDEA_BY_ID[p.ideaId] : undefined;
    planChip.classList.toggle('hidden', !idea);
    if (!p || !idea) return;
    const list = planChecklist(world, p.ideaId).filter((c) => !c.optional);
    const done = list.filter((c) => c.ok).length;
    const ready = done === list.length;
    planChip.classList.toggle('ready', ready);
    const text = ready ? `▶ Plan prêt : ${idea.name}` : `🎯 ${idea.name} · ${done}/${list.length}`;
    if (planChip.textContent !== text) planChip.textContent = text;
  }
  let modalOpen = false;
  const deferredArrivals = new Set<string>();
  let last = performance.now();
  let acc = 0;
  let moveAcc = 0;
  let footstepAcc = 0;
  let hudFrame = 0;
  let interiorStepAcc = 0;
  let lastAdviceMood = '';
  let lastAdviceBubbleTime = 0;

  // Initialisation du rendu 3D WebGL / fallback 2D
  let use3D = true;
  let renderer3D: CityRenderer | null = null;
  try {
    renderer3D = new CityRenderer(ui.canvas3d);
    renderer3D.onPlayerTile = (x, y) => {
      const ok = moveToTile(world, x, y);
      if (ok) {
        const tile = tileAt(x, y);
        const surface = tile?.surface === 'herbe' || tile?.surface === 'aire_jeux' ? 'herbe'
          : tile?.surface === 'terre' || tile?.surface === 'gravier' ? 'terre'
            : tile?.surface === 'chaussee' || tile?.surface === 'parking' ? 'asphalte' : 'pave';
        footstepAcc += 1;
        if (footstepAcc % 2 === 0) audio.playFootstep(surface);
      }
      return ok;
    };
    renderer3D.onContextLost = () => {
      use3D = false;
      ui.canvas3d.style.display = 'none';
      ui.canvas.style.display = 'block';
    };
    if (!renderer3D.isWebGLAvailable) {
      use3D = false;
      ui.canvas3d.style.display = 'none';
      ui.canvas.style.display = 'block';
      ui.btnToggle3D.textContent = '🎨 2D';
    } else {
      ui.canvas.style.display = 'none';
      ui.canvas3d.style.display = 'block';
      ui.btnToggle3D.textContent = '🧊 3D';
    }
  } catch {
    use3D = false;
    ui.canvas3d.style.display = 'none';
    ui.canvas.style.display = 'block';
    ui.btnToggle3D.textContent = '🎨 2D';
  }

  // Initialisation audio sur première interaction
  let currentLocation: AmbientLocation = 'ville';
  const initAudioOnce = (): void => {
    audio.init();
    audio.updateAmbient(currentLocation, minutesOfDay(world.time.tick) / 60, world.district.meteo);
  };
  root.addEventListener('pointerdown', initAudioOnce, { once: true });
  window.addEventListener('keydown', initAudioOnce, { once: true });

  // Contrôles de la barre caméra & audio
  ui.btnRotLeft.addEventListener('click', () => {
    audio.playUiClick();
    renderer3D?.rotateLeft();
  });
  ui.btnRotRight.addEventListener('click', () => {
    audio.playUiClick();
    renderer3D?.rotateRight();
  });
  ui.btnCamView.addEventListener('click', () => {
    audio.playUiClick();
    renderer3D?.toggleTopDown();
    ui.btnCamView.textContent = renderer3D?.isTopDown ? '🗺️ Plan' : '🎥 Rue';
  });
  ui.btnZoomIn.addEventListener('click', () => {
    audio.playUiClick();
    renderer3D?.zoomIn();
  });
  ui.btnZoomOut.addEventListener('click', () => {
    audio.playUiClick();
    renderer3D?.zoomOut();
  });
  ui.btnToggle3D.addEventListener('click', () => {
    audio.playUiClick();
    if (!renderer3D || !renderer3D.isWebGLAvailable) return;
    use3D = !use3D;
    ui.canvas3d.style.display = use3D ? 'block' : 'none';
    ui.canvas.style.display = use3D ? 'none' : 'block';
    ui.btnToggle3D.textContent = use3D ? '🧊 3D' : '🎨 2D';
  });
  ui.btnMuteAudio.addEventListener('click', () => {
    const muted = audio.toggleMute();
    ui.btnMuteAudio.textContent = muted ? '🔇' : '🔊';
  });

  const input = createInput(root, interact);
  window.addEventListener('resize', () => resizeCanvas(ui, root));

  // Mode aménagement : défini plus bas, consulté ici par les raccourcis caméra.
  let layoutEditActive = (): boolean => false;
  // Raccourcis caméra (R / T / V) — inactifs pendant l'aménagement (R y fait tourner un meuble).
  window.addEventListener('keydown', (e) => {
    if (modalOpen || layoutEditActive()) return;
    if (e.code === 'KeyR') {
      audio.playUiClick();
      renderer3D?.rotateLeft();
    }
    if (e.code === 'KeyT') {
      audio.playUiClick();
      renderer3D?.rotateRight();
    }
    if (e.code === 'KeyV') {
      audio.playUiClick();
      renderer3D?.toggleTopDown();
      ui.btnCamView.textContent = renderer3D?.isTopDown ? '🗺️ Plan' : '🎥 Rue';
    }
  });

  // Charger les assets pixel-art en arrière-plan (le renderer bascule automatiquement)
  loadAssetKit().catch(() => { /* fallback procédural si le chargement échoue */ });

  // Contrôle de vitesse (×1, ×2, ×4)
  for (const btn of root.querySelectorAll<HTMLButtonElement>('.speed-btn')) {
    btn.addEventListener('click', () => {
      world.time.speed = (Number(btn.dataset.speed) || 1) as import('../core/types').Speed;
      for (const b of root.querySelectorAll<HTMLButtonElement>('.speed-btn')) {
        b.style.background = Number(b.dataset.speed) === world.time.speed ? 'var(--or)' : 'var(--panel2)';
        b.style.color = Number(b.dataset.speed) === world.time.speed ? 'var(--bg)' : 'var(--ink)';
      }
    });
  }

  // Outil d'inspection (Bible Partie XII) : l'état du monde reste lisible depuis la console
  // et depuis les tests E2E. Lecture/écriture directe = leviers de QA, jamais du gameplay.
  (window as unknown as { __NEURAPOLIS__: unknown }).__NEURAPOLIS__ = {
    world,
    /** Capture du rendu 3D (QA) : fonctionne même fenêtre masquée. */
    snapshot: (opts?: { frames?: number; yaw?: number; pitch?: number; dist?: number; move?: { x: number; y: number }; running?: boolean }) =>
      renderer3D?.snapshot(world, ui.cw || 1280, ui.ch || 720, opts),
    /** Leviers de QA (tests E2E) : mêmes chemins que le clavier, sans attendre une image. */
    qa: {
      interact: () => interact(),
      prompt: () => promptText(),
      phone: (app?: PhoneApp) => openPhoneUi(app),
      units: () => Object.values(UNIT_BY_ID).map((u) => ({ id: u.id, door: u.door, address: u.address })),
      pickup: (id: string) => pickupPoint(id),
      eco: economyApi,
      enterBusiness: (id: string) => enterBusiness(id),
      sync: () => { syncSigns(); syncWaypoints(); syncStallCrowds(); },
      layout: (id: string) => startLayoutEdit(id),
      ride: (on: boolean) => renderer3D?.setRiding(on),
      /** Place le joueur devant un lieu (QA uniquement). */
      goto: (place: PlaceId) => { const a = PLACE_ANCHORS[place]; world.player.pos.x = a.x; world.player.pos.y = a.y; },
      /** Fait tourner la vraie boucle de jeu `n` images de `ms` (fenêtre masquée : rAF en pause). */
      step: (n: number, ms = 50) => { let t = last; for (let i = 0; i < n; i++) frame((t += ms)); },
    },
  };

  // Fondu « Tu dors… » pendant l'ellipse de la nuit.
  const sleepOverlay = el('div', 'sleep-overlay', '');
  const sleepText = el('div', 'sleep-text', '😴 Tu dors… la nuit passe');
  sleepOverlay.appendChild(sleepText);
  root.appendChild(sleepOverlay);

  // ---------- Économie : interactions physiques et téléphone ----------

  const ecoToastEl = el('div', 'eco-toast hidden', '');
  root.appendChild(ecoToastEl);
  let ecoToastTimer: number | undefined;
  function toast(text: string, ok: boolean): void {
    ecoToastEl.textContent = text;
    ecoToastEl.classList.toggle('bad', !ok);
    ecoToastEl.classList.remove('hidden');
    window.clearTimeout(ecoToastTimer);
    ecoToastTimer = window.setTimeout(() => ecoToastEl.classList.add('hidden'), 4200);
    if (ok) audio.playUiClick();
  }

  function openPhoneUi(app: PhoneApp = 'ascension', focus?: { businessId?: string; unitId?: string }): void {
    openPhone({
      world,
      showModal,
      closeModal,
      toast,
      onChange: () => { syncSigns(); updateHud(ui, world, promptText()); },
    }, app, focus);
  }

  const nearTile = (p: { x: number; y: number }, d = 3): boolean =>
    Math.abs(world.player.pos.x - p.x) <= d && Math.abs(world.player.pos.y - p.y) <= d;

  /** Action économique possible ici (déchargement, retrait, porte de local), la plus prioritaire d'abord. */
  /** Rejoindre sa classe : la séance passe en accéléré, avec un moment de classe. */
  function goToClass(): void {
    const r = attendClass(world);
    toast(r.message, r.ok);
    if (r.ok && renderer3D?.inInterior) exitInterior();
  }

  function economyActionHere(): { label: string; run: () => void } | null {
    // Un secret dont tu as l'indice, ici et maintenant.
    const secret = secretHere(world);
    if (secret) {
      return {
        label: `E — Fouiller : ${secret.where.hint}`,
        run: () => {
          const r = searchSecret(world, secret.id);
          toast(r.ok ? `Secret trouvé : ${secret.title}` : r.message, r.ok);
          if (r.ok) ghostBar.push({ ghost: ghostBar.roster().find((g) => !isSilenced(world, g)) ?? 'smith', text: r.message, pop: true, mood: 'joie' });
        },
      };
    }
    const session = classWindow(world);
    if (session && placeAtAdjacent(world) === 'college') {
      return { label: `E — Aller en cours (${session === 'matin' ? '8 h 30 – 12 h' : '13 h 30 – 16 h 30'})`, run: goToClass };
    }
    const e = ensureEconomy(world);
    for (const b of Object.values(e.businesses)) {
      const q = e.carried.filter((c) => c.businessId === b.id).reduce((s, c) => s + c.qty, 0);
      if (q > 0 && nearTile(businessDoor(b))) {
        return { label: `E — Décharger ${q} unités dans ${b.name}`, run: () => { const r = unloadAt(world, b.id); toast(r.message, r.ok); } };
      }
    }
    for (const o of e.orders) {
      if (o.status !== 'a_retirer') continue;
      const pt = pickupPoint(o.wholesalerId);
      if (pt && nearTile(pt)) {
        const units = o.lines.reduce((s, l) => s + l.qty, 0);
        return { label: `E — Charger les cartons (${units} unités, ${WHOLESALER_BY_ID[o.wholesalerId]?.name ?? ''})`, run: () => { const r = pickUpOrder(world, o.id); toast(r.message, r.ok); } };
      }
    }
    const { x, y } = world.player.pos;
    const gareDoor = CITY.buildings.find((bd) => bd.id === 'gare')?.doors[0];
    if (gareDoor && Math.abs(gareDoor.x - x) <= 2 && Math.abs(gareDoor.y + 1 - y) <= 1) {
      return { label: 'E — Gare de Val-Ferrand : voir les départs', run: openDepartures };
    }
    const stop = stopNear(world);
    if (stop) return { label: `E — Arrêt « ${stop.name} » : prendre le bus (ligne 1)`, run: () => openBusStop(stop.id) };
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const unitId = unitAt(x + dx, y + dy);
      if (!unitId) continue;
      const u = UNIT_BY_ID[unitId]!;
      const biz = Object.values(e.businesses).find((b) => b.unitId === unitId);
      const comp = COMPETITOR_BY_UNIT[unitId];
      if (comp) {
        return { label: `E — Entrer chez ${comp.shopName}`, run: () => { audio.playDoorBell(); toast(`« ${comp.greeting} » — ${comp.owner}, ${comp.shopName}`, true); } };
      }
      if (biz) {
        if (renderer3D && use3D && !u.buildingId.startsWith('etal_')) {
          return { label: `E — Entrer dans ${biz.name}`, run: () => enterBusiness(biz.id) };
        }
        return { label: `E — Gérer ${biz.name}`, run: () => openPhoneUi('commerces', { businessId: biz.id }) };
      }
      if (e.leases[unitId]) return { label: `E — Créer ton commerce (${u.address})`, run: () => openPhoneUi('immobilier', { unitId }) };
      return { label: `E — ${u.buildingId.startsWith('etal_') ? 'Étal' : 'Local'} à louer : ${u.address}`, run: () => openPhoneUi('immobilier', { unitId }) };
    }
    return null;
  }

  // Enseignes : le nom du commerce remplace « À LOUER » dans la ville.
  let signsKey = '';
  function syncSigns(): void {
    const e = world.economy;
    if (!e || !renderer3D) return;
    const key = JSON.stringify([Object.keys(e.leases), Object.values(e.businesses).map((b) => [b.unitId, b.name, b.open])]);
    if (key === signsKey) return;
    signsKey = key;
    for (const u of Object.values(UNIT_BY_ID)) {
      if (u.buildingId.startsWith('etal_')) continue;
      const biz = Object.values(e.businesses).find((b) => b.unitId === u.id);
      const comp = COMPETITOR_BY_UNIT[u.id];
      if (comp) renderer3D.setUnitSign(u.id, comp.shopName, '#2c3f5e');
      else if (biz) renderer3D.setUnitSign(u.id, `${BUSINESS_TYPE_BY_ID[biz.typeId]?.icon ?? ''} ${biz.name}`, biz.open ? '#2f5d3a' : '#5b4a3a');
      else if (e.leases[u.id]) renderer3D.setUnitSign(u.id, 'BIENTÔT OUVERT', '#6b4a1f');
      else renderer3D.setUnitSign(u.id, 'À LOUER', '#5b5249');
    }
  }
  syncSigns();

  /** Clients devant les étals ouverts : seulement quand quelqu'un sert (le joueur ou un employé). */
  function syncStallCrowds(): void {
    const e = world.economy;
    if (!e || !renderer3D) return;
    const hour = Math.floor(minutesOfDay(world.time.tick) / 60);
    const stalls: { x: number; y: number; count: number }[] = [];
    for (const b of Object.values(e.businesses)) {
      const u = UNIT_BY_ID[b.unitId];
      if (!u?.buildingId.startsWith('etal_')) continue;
      const openNow = b.open && hour >= b.hours[0] && hour < b.hours[1];
      const served = economyApi.staffCapacity(world, b).staff > 0;
      const stock = economyApi.stockUnits(b) > 0;
      const count = openNow && served && stock ? Math.max(1, Math.min(5, Math.round(appeal(b) * 2.2 * (world.district.meteo === 'pluie' ? 0.5 : 1)))) : 0;
      stalls.push({ ...u.door, count });
    }
    renderer3D.setStallCustomers(stalls);
  }

  /** Repères 3D : cartons à retirer (jaune), puis boutique où les décharger (vert). */
  function syncWaypoints(): void {
    const e = world.economy;
    if (!e || !renderer3D) return;
    const pts: { x: number; y: number; color: string }[] = [];
    if (e.carried.length > 0) {
      for (const bizId of new Set(e.carried.map((c) => c.businessId))) {
        const b = e.businesses[bizId];
        if (b) pts.push({ ...businessDoor(b), color: '#5fd17a' });
      }
    } else {
      for (const o of e.orders) {
        if (o.status !== 'a_retirer') continue;
        const p = pickupPoint(o.wholesalerId);
        if (p && !pts.some((q) => q.x === p.x && q.y === p.y)) pts.push({ ...p, color: '#ffd84a' });
      }
    }
    renderer3D.setWaypoints(pts);
  }

  // ---------- Laminoir Taret (2032) : l'avenir de la halle ----------
  let laminoirAskedDay = -1;
  function openLaminoirModal(): void {
    const body = el('div', 'panel-body');
    body.appendChild(el('p', 'panel-desc', 'Le laminoir a fermé. Karim et TaretCoop réunissent le quartier dans la halle froide : trois projets sont sur la table, et ta voix compte. Ce choix change durablement le quartier de la Gare.'));
    const list = el('div', 'ph-list');
    for (const o of LAMINOIR_OPTIONS) {
      const card = el('div', 'ph-card');
      card.appendChild(el('div', 'ph-card-title', o.title));
      card.appendChild(el('p', 'ph-note', o.text));
      const req = [o.cost > 0 ? `apport ${o.cost} €` : 'sans apport', o.minReputation > 0 ? `réputation ≥ ${o.minReputation}` : ''].filter(Boolean).join(' · ');
      card.appendChild(el('p', 'ph-note', req));
      const btn = el('button', 'ph-btn primary', 'Soutenir ce projet');
      btn.addEventListener('click', () => {
        const r = chooseLaminoirFuture(world, o.id);
        toast(r.message, r.ok);
        if (r.ok) closeModal();
      });
      card.appendChild(btn);
      list.appendChild(card);
    }
    body.appendChild(list);
    body.appendChild(el('p', 'panel-note', 'Tu peux réfléchir : Karim reviendra demain.'));
    showModal('🏭 La halle du laminoir', 'Val-Ferrand, après la fermeture', body, true);
  }

  // ---------- Bus : ligne 1 ----------
  function openBusStop(fromId: string): void {
    const from = BUS_STOP_BY_ID[fromId];
    if (!from) return;
    const body = el('div', 'panel-body');
    const fare = busFare(world);
    body.appendChild(el('p', 'panel-desc', `Ticket : ${fare.toFixed(2)} €${world.player.age < 18 ? ' (tarif jeune)' : ''}. Service de ${BUS_HOURS[0]} h à ${BUS_HOURS[1]} h. Le bus fait la boucle : centre, avenue Jean-Jaurès, Gare, rue des Forges.`));
    if (!busRunning(world)) body.appendChild(el('p', 'ph-note', 'Plus de bus à cette heure-ci : il faudra marcher (ou pédaler).'));
    const list = el('div', 'ph-list');
    for (const s of BUS_STOPS) {
      if (s.id === fromId) continue;
      const card = el('div', 'ph-card');
      card.appendChild(el('div', 'ph-card-title', `🚌 ${s.name}`));
      card.appendChild(el('p', 'ph-note', `environ ${busRideTicks(fromId, s.id) * 10} min`));
      const btn = el('button', 'ph-btn primary', `Monter (${fare.toFixed(2)} €)`);
      btn.disabled = !busRunning(world) || world.player.money < fare;
      btn.addEventListener('click', () => {
        const r = takeBus(world, s.id);
        toast(r.message, r.ok);
        if (r.ok) closeModal();
      });
      card.appendChild(btn);
      list.appendChild(card);
    }
    body.appendChild(list);
    showModal('🚌 Ligne 1', from.name, body, true);
  }

  // ---------- Voyage : la destination est une place à explorer ----------
  function travelFastForward(): boolean {
    return isTraveling(world) && !isOnSite(world);
  }

  /** Entre dans la scène de la destination à l'arrivée, la met à jour après chaque activité, en sort au retour. */
  function syncDestinationScene(): void {
    if (!renderer3D || !use3D) return;
    const spec = renderer3D.interiorSpec;
    const dest = isOnSite(world) ? currentDestination(world) : undefined;
    if (dest) {
      const acts = activitiesAt(dest.id).map((a) => ({ id: a.id, icon: a.icon, title: a.title, host: a.host, done: activityDoneThisTrip(world, a.id) }));
      const next = destinationSpec(dest.id, acts);
      if (next && spec?.key !== next.key) {
        const arriving = spec?.destinationId !== dest.id;
        renderer3D.enterInterior(next, world, { staff: activitiesAt(dest.id).map((a) => ({ id: `hote_${a.id}`, name: a.host.split(',')[0]! })), customers: 5 });
        if (arriving) toast(`Bienvenue à ${dest.name} : ${dest.subtitle}. ${travelSlotsLeft(world)} demi-journées devant toi.`, true);
      }
    } else if (spec?.destinationId && !isTraveling(world)) {
      exitInterior();
    }
  }

  // ---------- Gare : tableau des départs ----------
  function openDepartures(): void {
    const body = el('div', 'panel-body');
    body.appendChild(el('p', 'panel-desc', 'Avant 18 ans, on part pendant les vacances scolaires. Pendant ton absence, tes commerces tournent avec tes employés (un étal sans employé reste fermé).'));
    const list = el('div', 'ph-list');
    for (const d of DESTINATIONS) {
      const card = el('div', 'ph-card');
      card.appendChild(el('div', 'ph-card-title', `🚆 ${d.name} — ${d.subtitle}`));
      card.appendChild(el('p', 'ph-note', `${d.days} jours · ${d.cost} € · tu y développes : ${d.skill}${(world.flags[`voyage:${d.id}`] ?? 0) > 0 ? ' · déjà visité' : ''}`));
      const check = canTravel(world, d.id);
      const btn = el('button', 'ph-btn primary', `Partir (${d.cost} €)`);
      btn.disabled = !check.ok;
      btn.addEventListener('click', () => {
        const r = startTravel(world, d.id);
        toast(r.message, r.ok);
        if (r.ok) closeModal();
      });
      card.appendChild(btn);
      if (!check.ok) card.appendChild(el('p', 'ph-note', check.message));
      list.appendChild(card);
    }
    body.appendChild(list);
    showModal('🚆 Départs', 'Gare de Val-Ferrand', body, true);
    void DESTINATION_BY_ID;
  }

  // ---------- Sauvegardes : 3 emplacements + auto, export / import de fichier ----------
  function openSaves(): void {
    const body = el('div', 'panel-body');
    const list = el('div', 'ph-list');
    const render = (): void => {
      list.replaceChildren();
      for (const slot of ['auto', 'slot1', 'slot2', 'slot3']) {
        const sum = slotSummary(slot);
        const card = el('div', 'ph-card');
        const label = slot === 'auto' ? 'Sauvegarde automatique (chaque nuit)' : `Emplacement ${slot.slice(-1)}`;
        card.appendChild(el('div', 'ph-card-title', `💾 ${label}`));
        card.appendChild(el('p', 'ph-note', !sum.exists ? 'Vide.'
          : sum.error ? `⚠️ ${sum.error}`
            : `${sum.name ?? '—'}, ${sum.age ?? '?'} ans · ${dateOf(dayIndexOf(sum.tick ?? 0)).label} · ${(sum.money ?? 0).toFixed(2)} € · ${sum.businesses ?? 0} commerce(s)`));
        const row = el('div', 'ph-actions');
        if (slot !== 'auto') {
          const save = el('button', 'ph-btn primary', 'Sauvegarder ici');
          save.addEventListener('click', () => {
            if (sum.exists && !window.confirm('Remplacer cette sauvegarde ?')) return;
            try { saveToSlot(slot, world); toast('Partie sauvegardée.', true); } catch (err) { toast(`Échec : ${String(err)}`, false); }
            render();
          });
          row.appendChild(save);
        }
        if (sum.exists && !sum.error) {
          const load = el('button', 'ph-btn', 'Charger');
          load.addEventListener('click', () => {
            if (!window.confirm('Charger cette partie ? La progression non sauvegardée sera perdue.')) return;
            try { sessionStorage.setItem(PENDING_LOAD_KEY, slot); } catch { /* indisponible */ }
            location.reload();
          });
          row.appendChild(load);
        }
        if (sum.exists && slot !== 'auto') {
          const del = el('button', 'ph-btn danger', 'Supprimer');
          del.addEventListener('click', () => {
            if (!window.confirm('Supprimer définitivement cette sauvegarde ?')) return;
            deleteSlot(slot);
            render();
          });
          row.appendChild(del);
        }
        card.appendChild(row);
        list.appendChild(card);
      }
    };
    render();
    body.appendChild(list);
    const files = el('div', 'ph-actions');
    const exportBtn = el('button', 'ph-btn', '⬇️ Exporter un fichier');
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([exportSave(world)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neurapolis-${world.player.firstName || 'partie'}-${dateOf(dayIndexOf(world.time.tick)).iso}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    const importBtn = el('button', 'ph-btn', '⬆️ Importer un fichier');
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return;
        file.text().then((text) => {
          const imported = importSave(text);
          saveToSlot('slot3', imported);
          toast('Fichier importé dans l’emplacement 3 : charge-le pour le reprendre.', true);
          render();
        }).catch((err) => toast(`Import impossible : ${err instanceof Error ? err.message : String(err)}`, false));
      });
      input.click();
    });
    files.appendChild(exportBtn);
    files.appendChild(importBtn);
    body.appendChild(files);
    showModal('💾 Sauvegardes', 'Trois emplacements, la sauvegarde automatique et les fichiers', body, true);
  }

  // ---------- Astuces contextuelles (mini-tutos non bloquants, désactivables) ----------
  const TIPS_OFF_KEY = 'neurapolis.astuces.off';
  const tipsOff = (): boolean => { try { return localStorage.getItem(TIPS_OFF_KEY) === '1'; } catch { return false; } };
  const tipCard = el('div', 'tip-card hidden');
  root.appendChild(tipCard);
  function showTip(tutoId: string): void {
    if (tipsOff() || !tipCard.classList.contains('hidden')) return;
    if (!world.tutorials) world.tutorials = { tutorials: structuredClone(INITIAL_TUTORIALS) };
    let t = world.tutorials.tutorials[tutoId];
    if (!t && INITIAL_TUTORIALS[tutoId]) {
      // Ancienne sauvegarde : la fiche n'existait pas encore.
      t = structuredClone(INITIAL_TUTORIALS[tutoId]!);
      world.tutorials.tutorials[tutoId] = t;
    }
    if (!t || t.seen) return;
    t.seen = true;
    tipCard.replaceChildren();
    tipCard.appendChild(el('div', 'tip-title', t.title));
    tipCard.appendChild(el('p', 'tip-body', t.body));
    const row = el('div', 'tip-actions');
    const ok = el('button', 'tip-btn primary', 'Compris');
    ok.addEventListener('click', () => tipCard.classList.add('hidden'));
    const off = el('button', 'tip-btn', 'Ne plus afficher les astuces');
    off.addEventListener('click', () => {
      try { localStorage.setItem(TIPS_OFF_KEY, '1'); } catch { /* préférence non enregistrée */ }
      tipCard.classList.add('hidden');
    });
    row.appendChild(ok);
    row.appendChild(off);
    tipCard.appendChild(row);
    tipCard.classList.remove('hidden');
  }

  /** Choisit l'astuce utile à cet instant (une à la fois, chacune une seule fois). */
  function syncTips(): void {
    if (modalOpen) return;
    const e = world.economy;
    const bizs = Object.values(e?.businesses ?? {});
    if (renderer3D?.inInterior) {
      showTip(renderer3D.interiorSpec?.placeId === 'epicerie' ? 'tuto_boulot' : 'tuto_interieur');
      return;
    }
    if (e?.orders.some((o) => o.status === 'a_retirer') || (e?.carried.length ?? 0) > 0) { showTip('tuto_eco_retrait'); return; }
    if (bizs.some((b) => !b.open && Object.keys(b.stock).length > 0)) { showTip('tuto_eco_ouverture'); return; }
    if (bizs.some((b) => Object.keys(b.stock).length === 0) && (e?.orders.length ?? 0) === 0) { showTip('tuto_eco_commande'); return; }
    if (economyActionHere()?.label.includes('à louer')) showTip('tuto_eco_bail');
  }

  function playerPose(): { x: number; z: number; heading: number } {
    return renderer3D && use3D ? renderer3D.playerPose : { x: world.player.pos.x + 0.5, z: world.player.pos.y + 0.5, heading: 0 };
  }
  function openCityMap(): void {
    showModal('🗺️ Plan de Val-Ferrand', 'Centre-ville · 1 case = 1 mètre', renderCityMap(world, playerPose()), true);
  }
  ui.phoneBtn.addEventListener('click', () => { if (!modalOpen) openPhoneUi(); });
  ui.mapBtn.addEventListener('click', () => { if (!modalOpen) openCityMap(); });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' && !modalOpen) {
      e.preventDefault();
      openPhoneUi();
    } else if (e.code === 'KeyM' && !modalOpen) {
      e.preventDefault();
      openCityMap();
    } else if (e.code === 'Escape' && modalOpen) {
      closeModal();
    } else if (e.code === 'KeyB' && !modalOpen && renderer3D) {
      if (!ownsBike(world)) { toast('Tu n’as pas de vélo : achète-en un dans le téléphone (application Banque).', false); return; }
      if (renderer3D.inInterior) { toast('On ne roule pas à l’intérieur.', false); return; }
      renderer3D.setRiding(!renderer3D.isRiding);
      toast(renderer3D.isRiding ? '🚲 En selle ! (B pour descendre)' : 'Tu descends de vélo.', true);
    }
  });

  // ---------- Intérieurs praticables ----------

  function enterBusiness(bizId: string): void {
    const b = world.economy?.businesses[bizId];
    if (!b || !renderer3D) return;
    const customers = economyApi.customersInStore(world, b);
    const staff = b.employeeIds.map((id) => world.economy?.employees[id]).filter((e) => !!e).map((e) => ({ id: e!.id, name: e!.name }));
    renderer3D.enterInterior(businessInteriorSpec(b), world, { customers, staff });
    audio.playDoorBell();
  }

  function enterPlace(place: PlaceId, roomId?: string): boolean {
    if (!renderer3D || !use3D || !placeHasInterior(place)) return false;
    // La chambre-QG : tableau des plans et derniers objets gagnés.
    const extras = place === 'maison' && (roomId ?? 'chambre') === 'chambre' ? bedroomExtras(world) : [];
    const spec = placeInteriorSpec(place, roomId, extras, world.player.firstName || undefined);
    if (!spec) return false;
    renderer3D.enterInterior(spec, world);
    if (place === 'epicerie') audio.playDoorBell();
    currentLocation = place === 'friche' ? 'atelier' : (place as AmbientLocation);
    audio.updateAmbient(currentLocation, minutesOfDay(world.time.tick) / 60, world.district.meteo);
    return true;
  }

  function exitInterior(): void {
    renderer3D?.exitInterior();
    currentLocation = 'ville';
    audio.updateAmbient('ville', minutesOfDay(world.time.tick) / 60, world.district.meteo);
  }

  // ---------- Mode « Aménager » (placement des meubles à la main) ----------
  let layoutEdit: { bizId: string; sel: number; x: number; z: number; rot: number } | null = null;
  layoutEditActive = (): boolean => layoutEdit !== null;

  function startLayoutEdit(bizId: string): void {
    const b = world.economy?.businesses[bizId];
    if (!b || !renderer3D) return;
    if (b.furniture.length === 0) { toast('Achète d’abord des meubles (téléphone, onglet Commerces).', false); return; }
    // On fige les positions actuelles (placement automatique compris) avant de modifier.
    const spec = businessInteriorSpec(b);
    for (const it of spec.items) {
      if (it.slot !== undefined && !b.layout?.[String(it.slot)]) economyApi.placeFurniture(world, bizId, it.slot, it.x, it.z, it.rot);
    }
    layoutEdit = { bizId, sel: 0, x: 0, z: 0, rot: 0 };
    selectLayoutItem(0);
    toast('Mode Aménager : Tab choisit un meuble, les flèches le déplacent, R le tourne, Entrée valide, Échap termine.', true);
  }

  function selectLayoutItem(index: number): void {
    if (!layoutEdit || !renderer3D) return;
    const b = world.economy?.businesses[layoutEdit.bizId];
    if (!b) return;
    const n = b.furniture.length;
    layoutEdit.sel = ((index % n) + n) % n;
    const it = businessInteriorSpec(b).items.find((x) => x.slot === layoutEdit!.sel);
    layoutEdit.x = it?.x ?? 2;
    layoutEdit.z = it?.z ?? 2;
    layoutEdit.rot = it?.rot ?? 0;
    renderer3D.enterInterior(businessInteriorSpec(b, layoutEdit.sel), world);
  }

  function previewLayout(): void {
    if (!layoutEdit || !renderer3D) return;
    const b = world.economy?.businesses[layoutEdit.bizId];
    if (!b) return;
    // Aperçu : on montre la position candidate sans l'enregistrer.
    const ghost = structuredClone(b);
    ghost.layout = { ...(b.layout ?? {}), [String(layoutEdit.sel)]: { x: layoutEdit.x, z: layoutEdit.z, rot: layoutEdit.rot } };
    renderer3D.enterInterior(businessInteriorSpec(ghost, layoutEdit.sel), world);
  }

  window.addEventListener('keydown', (e) => {
    if (!layoutEdit || modalOpen) return;
    const step = 0.5;
    const k = e.code;
    if (k === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); selectLayoutItem(layoutEdit.sel + (e.shiftKey ? -1 : 1)); return; }
    if (k === 'ArrowLeft') layoutEdit.x -= step;
    else if (k === 'ArrowRight') layoutEdit.x += step;
    else if (k === 'ArrowUp') layoutEdit.z -= step;
    else if (k === 'ArrowDown') layoutEdit.z += step;
    else if (k === 'KeyR') layoutEdit.rot += Math.PI / 2;
    else if (k === 'Enter') {
      const r = economyApi.placeFurniture(world, layoutEdit.bizId, layoutEdit.sel, layoutEdit.x, layoutEdit.z, layoutEdit.rot);
      toast(r.message, r.ok);
      if (!r.ok) selectLayoutItem(layoutEdit.sel);
      return;
    } else if (k === 'Escape') {
      const b = world.economy?.businesses[layoutEdit.bizId];
      layoutEdit = null;
      if (b) renderer3D?.enterInterior(businessInteriorSpec(b), world);
      toast('Aménagement enregistré.', true);
      return;
    } else return;
    e.preventDefault();
    e.stopImmediatePropagation();
    previewLayout();
  }, { capture: true });

  /** Action du point d'interaction à portée, à l'intérieur. */
  function interiorActionHere(): { label: string; run: () => void } | null {
    const spec = renderer3D?.interiorSpec;
    const h = renderer3D?.interiorHotspot;
    if (spec?.placeId === 'college' && classWindow(world)) return { label: 'E — Rejoindre ta classe', run: goToClass };
    if (h?.kind === 'plan') return { label: `E — ${h.label}`, run: () => openPlanner(planCtx()) };
    if (h?.kind === 'objet') return { label: `E — ${h.label}`, run: () => openShelf(planCtx(), h.target) };
    if (!spec || !h) return null;
    const label = `E — ${h.label}`;
    if (h.kind === 'sortie') return { label, run: exitInterior };
    if (h.kind === 'activite' && h.target) {
      const id = h.target;
      return {
        label,
        run: () => {
          const r = doTravelActivity(world, id);
          toast(r.message, r.ok);
          if (r.ok) audio.playMarketAlert();
        },
      };
    }
    if (h.kind === 'depart') {
      return {
        label,
        run: () => {
          const left = travelSlotsLeft(world);
          if (left > 0 && !window.confirm(`Rentrer maintenant ? Il te reste ${left} demi-journée(s) sur place.`)) return;
          const r = leaveDestination(world);
          toast(r.message, r.ok);
        },
      };
    }
    if (h.kind === 'amenager' && spec.businessId) {
      return { label, run: () => startLayoutEdit(spec.businessId!) };
    }
    if (h.kind === 'travail') {
      return { label, run: () => { const r = startShift(world); toast(r.message, r.ok); } };
    }
    if (h.kind === 'piece' && spec.placeId) return { label, run: () => { enterPlace(spec.placeId!, h.target); } };
    if (h.kind === 'gestion' && spec.businessId) return { label, run: () => openPhoneUi('commerces', { businessId: spec.businessId }) };
    if (h.kind === 'decharger' && spec.businessId) {
      return {
        label,
        run: () => {
          const r = unloadAt(world, spec.businessId!);
          toast(r.message, r.ok);
          if (r.ok) enterBusiness(spec.businessId!);
        },
      };
    }
    if (h.kind === 'mobilier' && spec.placeId && h.target) {
      const place = spec.placeId;
      const target = h.target;
      return {
        label,
        run: () => {
          const r = useFurniture(world, place, target);
          if (r.special === 'open_workshop') { openWorkshopModal(); return; }
          if (r.special === 'open_debate') { openUrbanDebate(); return; }
          toast(r.message, r.ok);
          updateHud(ui, world, promptText());
        },
      };
    }
    return null;
  }

  function promptText(): string {
    if (world.player.asleep) return '😴 Tu dors. La nuit passe…';
    if (inShift(world)) return `🧺 ${JOB.title} — fin du service à ${hhmmOfTick(world.flags['jobShiftEnd'] ?? world.time.tick)}`;
    if (layoutEdit) return '🛠️ Aménager — Tab : meuble suivant · flèches : déplacer · R : tourner · Entrée : valider · Échap : terminer';
    if (renderer3D?.inInterior) {
      const inside = interiorActionHere();
      if (inside) return inside.label;
      const nearNpc = npcsNearby(world, 2)[0];
      if (nearNpc) return `E — Parler à ${NPC_BY_ID[nearNpc.id]?.name ?? 'quelqu’un'}`;
      if (renderer3D.interiorSpec?.destinationId) {
        return `${renderer3D.interiorSpec.title} · ${travelSlotsLeft(world)} demi-journée(s) sur place · approche-toi d’une icône pour agir`;
      }
      return `${renderer3D.interiorSpec?.title ?? ''} · approche-toi d’un objet (icône) pour agir`;
    }
    const eco = economyActionHere();
    if (eco) return eco.label;
    const place = placeAtAdjacent(world);
    if (place) return `E — Entrer : ${PLACE_BY_ID[place]?.name ?? place}`;
    const near = npcsNearby(world, 2);
    if (near.length > 0) return `E — Parler à ${NPC_BY_ID[near[0]?.id ?? '']?.name ?? 'quelqu’un'}`;
    return '';
  }

  function interact(): void {
    if (modalOpen) return;
    if (world.player.asleep || inShift(world) || travelFastForward() || isOnBus(world) || isInClass(world)) return;
    if (renderer3D?.inInterior) {
      const inside = interiorActionHere();
      if (inside) { inside.run(); return; }
      const nearNpc = npcsNearby(world, 2)[0];
      if (nearNpc) openNpcDialogue(nearNpc.id);
      return;
    }
    const eco = economyActionHere();
    if (eco) {
      eco.run();
      return;
    }
    const place = placeAtAdjacent(world);
    if (place) {
      if (enterPlace(place)) return;
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
    const loc: AmbientLocation = place === 'friche' ? 'atelier' : (place as AmbientLocation);
    currentLocation = loc;
    audio.updateAmbient(currentLocation, minutesOfDay(world.time.tick) / 60, world.district.meteo);
    openDetailedInteriorModal(place, world, {
      showModal,
      closeModal: () => {
        closeModal();
        currentLocation = 'ville';
        audio.updateAmbient('ville', minutesOfDay(world.time.tick) / 60, world.district.meteo);
      },
      openNpcDialogue,
      openWorkshopModal,
      openUrbanDebate,
      refreshWorldHud: () => updateHud(ui, world, promptText()),
    });
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

  function checkTutorial(tutoId: string): void {
    if (!world.tutorials) world.tutorials = { tutorials: structuredClone(INITIAL_TUTORIALS) };
    const t = world.tutorials.tutorials[tutoId];
    if (t && !t.seen) {
      t.seen = true;
      showMiniTutorial(t.title, t.body);
    }
  }

  function showMiniTutorial(title: string, bodyText: string): void {
    const body = el('div', 'panel-body');
    body.appendChild(el('p', 'panel-desc', bodyText));
    const row = el('div', 'reply-row');
    const okBtn = el('button', 'btn btn-action', 'Compris ! (Continuer)');
    okBtn.addEventListener('click', closeModal);
    row.appendChild(okBtn);
    body.appendChild(row);
    showModal(title, 'Mini-Guide de Prise en Main (Skippé)', body);
  }

  function openStrategieCarte(): void {
    checkTutorial('tuto_plan_action');
    const ap = ensureActionPlanningState(world);
    const body = el('div', 'panel-body');

    // Section 1 : Plans d'action
    body.appendChild(el('h3', 'panel-sub', `Plans d’Action Stratégiques (Palier : ${ap.expansionLevel.toUpperCase()})`));
    for (const plan of Object.values(ap.plans)) {
      const card = el('div', 'ghost-detail');
      if (plan.active) card.style.borderColor = 'var(--or)';
      const head = el('div', 'avatar-row');
      head.appendChild(el('span', 'rel-name', `${plan.title} ${plan.completed ? '✓ (Accompli)' : plan.active ? '⚡ (En cours)' : ''}`));
      card.appendChild(head);
      card.appendChild(el('p', 'panel-desc', plan.description));
      card.appendChild(el('p', 'panel-note', plan.ghostInsight));

      // Sélecteur de branches tactiques pour les plans avec modificateurs statistiques visuels
      if (plan.tacticalBranches && plan.tacticalBranches.length > 0) {
        const branchBox = el('div', 'tactical-branches-box');
        branchBox.style.cssText = 'margin:10px 0;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px dashed var(--line);border-radius:8px;';
        branchBox.appendChild(el('h4', 'stat-label', '✦ Arbitrage Tactique & Approvisionnement :'));

        const branchGrid = el('div', 'tactical-branch-grid');
        branchGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;';

        for (const branch of plan.tacticalBranches) {
          const isSelected = plan.selectedBranchId === branch.id;
          const bCard = el('div', 'tactical-branch-card');
          bCard.style.cssText = `padding:8px;border-radius:6px;border:1.5px solid ${isSelected ? 'var(--or)' : 'var(--line)'};background:${isSelected ? 'rgba(255,217,138,0.12)' : 'var(--panel2)'};display:flex;flex-direction:column;justify-content:space-between;gap:4px;cursor:pointer;`;

          const bTitle = el('div', 'branch-title', `${isSelected ? '✓ ' : '○ '}${branch.label}`);
          bTitle.style.cssText = `font-weight:700;font-size:11px;color:${isSelected ? 'var(--or)' : 'var(--ink)'};`;
          bCard.appendChild(bTitle);

          const bDesc = el('div', 'branch-desc', branch.description);
          bDesc.style.cssText = 'font-size:10px;color:var(--ink-muted);line-height:1.3;';
          bCard.appendChild(bDesc);

          const bMod = el('div', 'branch-modifier', `⚡ ${branch.modifierSummary}`);
          bMod.style.cssText = 'font-size:10px;font-weight:600;color:var(--bleu);background:rgba(80,140,220,0.14);padding:2px 6px;border-radius:4px;width:fit-content;margin-top:4px;';
          bCard.appendChild(bMod);

          if (plan.active && !isSelected) {
            const chooseBtn = el('button', 'btn btn-action', 'Choisir cette branche');
            chooseBtn.style.fontSize = '10px';
            chooseBtn.style.padding = '2px 8px';
            chooseBtn.style.marginTop = '6px';
            chooseBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              selectTacticalBranch(world, plan.id, branch.id);
              audio.playUiClick();
              openStrategieCarte();
            });
            bCard.appendChild(chooseBtn);
          } else if (isSelected) {
            const activeTag = el('span', 'stat-label', '✦ Branche Active');
            activeTag.style.cssText = 'font-size:9px;color:var(--or);font-weight:700;margin-top:4px;';
            bCard.appendChild(activeTag);
          }

          bCard.addEventListener('click', () => {
            if (plan.active && !isSelected) {
              selectTacticalBranch(world, plan.id, branch.id);
              audio.playUiClick();
              openStrategieCarte();
            }
          });

          branchGrid.appendChild(bCard);
        }
        branchBox.appendChild(branchGrid);
        card.appendChild(branchBox);
      }

      const stepList = el('div', 'journal-list');
      for (const st of plan.steps) {
        const stepRow = el('div', 'stat-row');
        stepRow.appendChild(el('span', 'stat-label', `${st.completed ? '✓' : '○'} ${st.label}`));
        if (!st.completed && plan.active) {
          const checkBtn = el('button', 'btn btn-action', 'Valider cette étape');
          checkBtn.style.fontSize = '10px';
          checkBtn.style.padding = '2px 6px';
          checkBtn.addEventListener('click', () => {
            const res = progressActionPlanStep(world, plan.id, st.id);
            audio.playObjectiveComplete();
            checkBtn.textContent = res.message;
            setTimeout(openStrategieCarte, 800);
          });
          stepRow.appendChild(checkBtn);
        }
        stepList.appendChild(stepRow);
      }
      card.appendChild(stepList);

      if (!plan.active && !plan.completed) {
        const actBtn = el('button', 'btn btn-action', 'Activer ce plan stratégique');
        actBtn.addEventListener('click', () => {
          activateActionPlan(world, plan.id);
          openStrategieCarte();
        });
        card.appendChild(actBtn);
      }
      body.appendChild(card);
    }

    // Section 2 : Cartographie du Territoire (9 nœuds interactifs & liaisons de flux)
    body.appendChild(el('h3', 'panel-sub', 'Cartographie Interactive & Concessions Territoriales'));

    const nodeCoords: Record<TerritorialZoneId, { x: number; y: number }> = {
      roses: { x: 310, y: 170 },
      caves: { x: 170, y: 220 },
      bassin: { x: 450, y: 220 },
      hauts: { x: 310, y: 65 },
      tramway: { x: 160, y: 95 },
      docks: { x: 460, y: 95 },
      ville_voisine: { x: 55, y: 160 },
      metropole_regionale: { x: 565, y: 160 },
      national: { x: 310, y: 295 },
    };

    const connections: Array<[TerritorialZoneId, TerritorialZoneId]> = [
      ['roses', 'caves'],
      ['roses', 'bassin'],
      ['roses', 'hauts'],
      ['caves', 'tramway'],
      ['bassin', 'docks'],
      ['hauts', 'tramway'],
      ['hauts', 'docks'],
      ['tramway', 'ville_voisine'],
      ['docks', 'metropole_regionale'],
      ['caves', 'national'],
      ['bassin', 'national'],
      ['ville_voisine', 'national'],
      ['metropole_regionale', 'national'],
    ];

    const mapContainer = el('div', 'interactive-cartography-map');
    mapContainer.style.cssText = 'position:relative;width:100%;height:340px;background:radial-gradient(ellipse at center, rgba(30,22,40,0.9) 0%, rgba(18,12,24,0.98) 100%);border:1.5px solid var(--line);border-radius:10px;margin-bottom:16px;overflow:hidden;box-shadow:inset 0 0 30px rgba(0,0,0,0.55);';

    // SVG liaisons de flux
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgEl = document.createElementNS(svgNS, 'svg');
    svgEl.setAttribute('viewBox', '0 0 620 340');
    svgEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';

    for (const [fromId, toId] of connections) {
      const fromCoord = nodeCoords[fromId];
      const toCoord = nodeCoords[toId];
      const fromNode = ap.territory[fromId];
      const toNode = ap.territory[toId];
      const isLinked = !!(fromNode?.unlocked && toNode?.unlocked);
      const isArranged = !!(fromNode?.activeArrangement && toNode?.activeArrangement);

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(fromCoord.x));
      line.setAttribute('y1', String(fromCoord.y));
      line.setAttribute('x2', String(toCoord.x));
      line.setAttribute('y2', String(toCoord.y));
      line.setAttribute('stroke', isArranged ? '#ffd98a' : isLinked ? '#7850dc' : 'rgba(120,100,140,0.3)');
      line.setAttribute('stroke-width', isArranged ? '3' : isLinked ? '2' : '1.5');
      if (!isLinked) {
        line.setAttribute('stroke-dasharray', '4,4');
      }
      svgEl.appendChild(line);
    }
    mapContainer.appendChild(svgEl);

    // Éléments interactifs des 9 nœuds sur la carte
    for (const [nodeId, coord] of Object.entries(nodeCoords) as Array<[TerritorialZoneId, { x: number; y: number }]>) {
      const node = ap.territory[nodeId];
      if (!node) continue;

      const nodePin = el('div', `map-node-pin ${node.unlocked ? 'unlocked' : 'locked'}`);
      const leftPct = (coord.x / 620) * 100;
      const topPct = (coord.y / 340) * 100;
      nodePin.style.cssText = `position:absolute;left:${leftPct}%;top:${topPct}%;transform:translate(-50%, -50%);display:flex;flex-direction:column;align-items:center;padding:4px 8px;border-radius:8px;font-size:10px;font-weight:600;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;background:${node.activeArrangement ? 'rgba(40,30,60,0.95)' : node.unlocked ? 'rgba(30,25,45,0.92)' : 'rgba(20,15,25,0.88)'};border:1.5px solid ${node.activeArrangement ? 'var(--or)' : node.unlocked ? 'var(--bleu)' : 'var(--line)'};color:${node.unlocked ? 'var(--ink)' : 'var(--ink-muted)'};box-shadow:${node.activeArrangement ? '0 0 10px rgba(255,217,138,0.35)' : '0 2px 6px rgba(0,0,0,0.45)'};min-width:68px;text-align:center;user-select:none;`;

      nodePin.innerHTML = `
        <div style="font-size:11px;">${node.activeArrangement ? '✦' : node.unlocked ? '🔓' : '🔒'}</div>
        <div style="font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:85px;">${node.name.replace(/ \(.*\)/, '')}</div>
        <div style="font-size:8px;color:${node.unlocked ? 'var(--or)' : 'var(--ink-muted)'};">${node.unlocked ? `${node.ourPresence}% part` : `${node.marketPotential}% pot.`}</div>
      `;

      nodePin.addEventListener('mouseenter', () => {
        nodePin.style.transform = 'translate(-50%, -50%) scale(1.1)';
        nodePin.style.zIndex = '10';
      });
      nodePin.addEventListener('mouseleave', () => {
        nodePin.style.transform = 'translate(-50%, -50%) scale(1)';
        nodePin.style.zIndex = '1';
      });

      mapContainer.appendChild(nodePin);
    }
    body.appendChild(mapContainer);

    const territoryGrid = el('div', 'council-grid');
    for (const node of Object.values(ap.territory)) {
      const box = el('div', 'ghost-detail');
      box.appendChild(el('h4', 'journal-title', `${node.name} ${node.unlocked ? '🔓' : '🔒'}`));
      box.appendChild(el('p', 'panel-note', `Potentiel : ${node.marketPotential}% · Présence : ${node.ourPresence}% · Rivaux : ${node.competitorPresence}%`));

      if (!node.unlocked) {
        const unlBtn = el('button', 'btn btn-action', 'Explorer & Débloquer');
        unlBtn.addEventListener('click', () => {
          unlockTerritoryNode(world, node.id as TerritorialZoneId);
          openStrategieCarte();
        });
        box.appendChild(unlBtn);
      } else if (!node.activeArrangement && node.concessionCost > 0) {
        const arrBtn = el('button', 'btn btn-reply', `Payer Concession (${node.concessionCost} €)`);
        arrBtn.addEventListener('click', () => {
          const res = payTerritoryConcession(world, node.id as TerritorialZoneId);
          if (res.ok) {
            audio.playCoin();
          }
          arrBtn.textContent = res.message;
          setTimeout(openStrategieCarte, 800);
        });
        box.appendChild(arrBtn);
      } else if (node.activeArrangement) {
        box.appendChild(el('p', 'panel-note', '✓ Concession officielle & arrangements sécurisés.'));
      }
      territoryGrid.appendChild(box);
    }
    body.appendChild(territoryGrid);

    showModal('Stratégie & Cartographie', 'plans d’action · expansion géographique · concessions', body, true);
  }

  function openEntreprisesRoles(): void {
    checkTutorial('tuto_multi_entreprises');
    const mv = ensureMultiVentureState(world);
    const body = el('div', 'panel-body');

    // Synergies actives
    updateVentureSynergies(world);
    if (mv.synergiesActive.length > 0) {
      const synBox = el('div', 'ghost-detail');
      synBox.style.borderColor = 'var(--vert)';
      synBox.appendChild(el('h4', 'journal-title', '✨ Synergies Inter-Entreprises Actives'));
      for (const syn of mv.synergiesActive) {
        synBox.appendChild(el('p', 'panel-note', `✦ ${syn}`));
      }
      body.appendChild(synBox);
    }

    // Aléas économiques (Hazards)
    const pendingHazards = mv.hazards.filter((h) => !h.resolved);
    if (pendingHazards.length > 0) {
      body.appendChild(el('h3', 'panel-sub', '⚠️ Aléas Économiques & Frictions'));
      for (const h of pendingHazards) {
        const hBox = el('div', 'ghost-detail');
        hBox.style.borderColor = 'var(--rouge)';
        hBox.appendChild(el('h4', 'journal-title', `🚨 ${h.title}`));
        hBox.appendChild(el('p', 'panel-desc', h.description));
        hBox.appendChild(el('p', 'panel-note', `Conseil : « ${h.ghostAdviceText} »`));
        const resBtn = el('button', 'btn btn-action', `Régler cet aléa (${h.costToResolve} €)`);
        resBtn.addEventListener('click', () => {
          const res = resolveEconomicHazard(world, h.id);
          resBtn.textContent = res.message;
          setTimeout(openEntreprisesRoles, 800);
        });
        hBox.appendChild(resBtn);
        body.appendChild(hBox);
      }
    }

    // Liste des entreprises
    body.appendChild(el('h3', 'panel-sub', 'Portefeuille d’Activités & Attribution des Rôles'));
    const candidateNpcs: Array<{ id: string; name: string }> = [
      { id: 'noah', name: 'Noah' },
      { id: 'lina', name: 'Lina' },
      { id: 'yasmine', name: 'Yasmine' },
      { id: 'karim', name: 'Karim' },
      { id: 'samir', name: 'Samir' },
      { id: 'monique', name: 'Monique' },
    ];

    for (const v of Object.values(mv.ventures)) {
      const vCard = el('div', 'ghost-detail');
      vCard.appendChild(el('h4', 'journal-title', `${v.name} ${v.active ? '🟢 (Actif)' : '⚪ (En veille)'}`));
      vCard.appendChild(el('p', 'panel-desc', VENTURE_DEFS[v.id]?.description ?? ''));
      vCard.appendChild(el('p', 'panel-note', `Rendement estimé : +${v.dailyRevenue} €/j · Frais : −${v.dailyExpenses} €/j`));

      const rolesBox = el('div', 'journal-list');
      for (const [rKey, rDef] of Object.entries(VENTURE_ROLE_DEFS) as [VentureRole, typeof VENTURE_ROLE_DEFS[VentureRole]][]) {
        const rRow = el('div', 'stat-row');
        const assigned = v.roles[rKey];
        rRow.appendChild(el('span', 'stat-label', `${rDef.title} : ${assigned ? assigned.toUpperCase() : 'Non assigné'}`));
        if (assigned) {
          const unBtn = el('button', 'btn btn-reply', 'Libérer');
          unBtn.style.fontSize = '10px';
          unBtn.style.padding = '2px 4px';
          unBtn.addEventListener('click', () => {
            unassignVentureRole(world, v.id, rKey);
            openEntreprisesRoles();
          });
          rRow.appendChild(unBtn);
        } else {
          const selRow = el('div', 'reply-row');
          for (const cand of candidateNpcs.slice(0, 3)) {
            const asBtn = el('button', 'btn btn-action', `+ ${cand.name}`);
            asBtn.style.fontSize = '10px';
            asBtn.style.padding = '2px 4px';
            asBtn.addEventListener('click', () => {
              assignVentureRole(world, v.id, rKey, cand.id);
              openEntreprisesRoles();
            });
            selRow.appendChild(asBtn);
          }
          rRow.appendChild(selRow);
        }
        rolesBox.appendChild(rRow);
      }
      vCard.appendChild(rolesBox);
      body.appendChild(vCard);
    }

    showModal('Entreprises & Rôles', 'multi-activités · attribution des postes · synergies & aléas', body, true);
  }

  function openMarchandsTiers(): void {
    checkTutorial('tuto_marchands_tiers');
    const vendors = ensureVendorsState(world);
    const body = el('div', 'panel-body');

    body.appendChild(el('p', 'panel-desc', 'Commercer régulièrement avec les marchands fait grimper vos Paliers de Fidélité (Tiers 0 à 3), débloquant remises permanentes et stocks réservés.'));

    for (const [vId, def] of Object.entries(VENDOR_DEFS) as [VendorId, typeof VENDOR_DEFS[VendorId]][]) {
      const rel = vendors[vId] ?? {
        vendorId: vId, name: def.name, location: def.location, tier: 0, spentTotal: 0, tradeCount: 0, discountRate: 0, unlockedPerks: [], friendshipDialogueUnlocked: false, specialStockAvailable: false,
      };

      const card = el('div', 'ghost-detail');
      const head = el('div', 'avatar-row');
      head.appendChild(el('span', 'rel-name', `${def.name} — Rang : Palier ${rel.tier} (${def.tierBenefits[rel.tier].title})`));
      card.appendChild(head);
      card.appendChild(el('p', 'panel-desc', def.description));
      card.appendChild(el('p', 'panel-note',
        `Dépensé cumulé : ${rel.spentTotal.toFixed(2)} € · ${rel.tradeCount} transactions · Remise accordée : ${Math.round(rel.discountRate * 100)} %`));

      const perkBox = el('div', 'journal-list');
      for (const perk of rel.unlockedPerks) {
        perkBox.appendChild(el('p', 'panel-note', `✓ ${perk}`));
      }
      card.appendChild(perkBox);

      if (def.specialGoods.length > 0) {
        card.appendChild(el('h4', 'journal-title', 'Articles & Concessions Spéciales :'));
        for (const good of def.specialGoods) {
          const gRow = el('div', 'stat-row');
          const discountedPrice = (good.cost * (1 - rel.discountRate)).toFixed(2);
          gRow.appendChild(el('span', 'stat-label', `${good.name} (${discountedPrice} €)`));
          const canBuy = rel.tier >= good.requiredTier && world.player.money >= Number(discountedPrice);
          const buyBtn = el('button', 'btn btn-action', rel.tier < good.requiredTier ? `Requis Tier ${good.requiredTier}` : `Acheter (${discountedPrice} €)`);
          buyBtn.disabled = !canBuy;
          if (canBuy) {
            buyBtn.addEventListener('click', () => {
              const res = buyVendorSpecialGood(world, vId, good.id);
              buyBtn.textContent = res.message;
              setTimeout(openMarchandsTiers, 800);
            });
          }
          gRow.appendChild(buyBtn);
          card.appendChild(gRow);
        }
      }

      body.appendChild(card);
    }

    showModal('Marchands & Niveaux de Relation', 'fidélité · remises · stocks exclusifs', body, true);
  }

  function openActualitesChocs(): void {
    checkTutorial('tuto_chocs_macro');
    const mn = ensureMacroNewsState(world);
    const body = el('div', 'panel-body');

    const currentCard = el('div', 'ghost-detail');
    currentCard.style.borderColor = 'var(--or)';
    currentCard.appendChild(el('h4', 'journal-title', `Climat Économique Actuel : ${mn.currentTrend.toUpperCase()}`));
    currentCard.appendChild(el('p', 'panel-desc',
      `Impact sur les coûts : ${mn.costModifier >= 0 ? '+' : ''}${Math.round(mn.costModifier * 100)} % · Impact sur la demande : ${mn.demandModifier >= 0 ? '+' : ''}${Math.round(mn.demandModifier * 100)} %`));

    const testShockBtn = el('button', 'btn btn-action', 'Susciter un choc de conjoncture');
    testShockBtn.addEventListener('click', () => {
      triggerCustomMarketShock(world);
      audio.playMarketAlert();
      openActualitesChocs();
    });
    currentCard.appendChild(testShockBtn);
    body.appendChild(currentCard);

    body.appendChild(el('h3', 'panel-sub', 'Fil des Dépêches Économiques'));
    const feedList = el('div', 'journal-list');
    for (const item of mn.feed) {
      const art = el('article', 'journal-entry');
      art.appendChild(el('h4', 'journal-title', `${item.date} — ${item.headline}`));
      art.appendChild(el('p', 'panel-desc', item.summary));
      art.appendChild(el('p', 'panel-note', `Tendance : ${item.trend} (Coûts : ${item.costModifier >= 0 ? '+' : ''}${Math.round(item.costModifier * 100)}%, Demande : ${item.demandModifier >= 0 ? '+' : ''}${Math.round(item.demandModifier * 100)}%)`));
      feedList.appendChild(art);
    }
    body.appendChild(feedList);

    showModal('Actualités & Chocs Macroéconomiques', 'presse · tendances de marché · opportunités', body, true);
  }

  function openEtudesFamille(): void {
    checkTutorial('tuto_etudes_famille');
    const sl = ensureSchoolLifeState(world);
    const body = el('div', 'panel-body');

    // Situation scolaire
    const cardScolaire = el('div', 'ghost-detail');
    cardScolaire.appendChild(el('h4', 'journal-title', 'Vie Scolaire au Collège Val-Ferrand'));
    cardScolaire.appendChild(el('p', 'panel-desc',
      `Moyenne scolaire : ${sl.academicAverage}/20 · Taux d'assiduité : ${sl.attendanceRate}% · Cours séchés : ${sl.skippedClassesCount}`));
    if (sl.teacherWarningActive) {
      cardScolaire.appendChild(el('p', 'panel-note', '⚠️ Avertissement professeur : M. Moreau s’inquiète de tes absences.'));
    }
    if (sl.negotiatedExemption) {
      cardScolaire.appendChild(el('p', 'panel-note', '✓ Statut officiel : Convention de projet jeune entrepreneur validée !'));
    }

    const actRow = el('div', 'reply-row');
    const coursBtn = el('button', 'btn btn-action', 'Suivre le cours avec attention');
    coursBtn.addEventListener('click', () => {
      const res = attendSchoolClass(world);
      coursBtn.textContent = res.message;
      setTimeout(openEtudesFamille, 800);
    });
    const secherBtn = el('button', 'btn btn-reply', 'Sécher pour une urgence business');
    secherBtn.addEventListener('click', () => {
      const res = skipSchoolForBusiness(world);
      secherBtn.textContent = res.message;
      setTimeout(openEtudesFamille, 800);
    });
    const devoirsBtn = el('button', 'btn btn-action', 'Faire ses devoirs le soir');
    devoirsBtn.addEventListener('click', () => {
      const res = studyEveningHomework(world);
      devoirsBtn.textContent = res.message;
      setTimeout(openEtudesFamille, 800);
    });
    const negoBtn = el('button', 'btn btn-reply', 'Négocier dispense avec M. Moreau');
    negoBtn.addEventListener('click', () => {
      const res = negotiateWithTeacher(world);
      negoBtn.textContent = res.message;
      setTimeout(openEtudesFamille, 800);
    });

    actRow.appendChild(coursBtn);
    actRow.appendChild(secherBtn);
    actRow.appendChild(devoirsBtn);
    actRow.appendChild(negoBtn);
    cardScolaire.appendChild(actRow);
    body.appendChild(cardScolaire);

    // Sentiment des parents
    const cardFamille = el('div', 'ghost-detail');
    cardFamille.appendChild(el('h4', 'journal-title', `Sentiment des Parents : ${sl.parentSentiment.toUpperCase()}`));
    cardFamille.appendChild(el('p', 'panel-desc', sl.lastParentMessage));
    const parlerParentsBtn = el('button', 'btn btn-action', 'Discuter avec ses parents à la maison');
    parlerParentsBtn.addEventListener('click', () => {
      const res = talkWithParents(world);
      parlerParentsBtn.textContent = res.message;
      setTimeout(openEtudesFamille, 800);
    });
    cardFamille.appendChild(parlerParentsBtn);
    body.appendChild(cardFamille);

    showModal('Études, Collège & Famille', 'assiduité · devoirs · dialogue avec les parents', body, true);
  }

  function openGhostCompanionModal(): void {
    const thought = getGhostCompanionThought(world);
    const advice = askActiveGhostAdvice(world);
    const body = el('div', 'panel-body');

    const card = el('div', 'ghost-detail');
    card.appendChild(el('h4', 'journal-title', `${thought.emoji} ${thought.name} — Compagnon Actif`));
    card.appendChild(el('p', 'panel-desc', `Humeur : « ${thought.mood} »`));
    card.appendChild(el('p', 'panel-note', `Pensée instantanée : « ${thought.speechBubble} »`));
    card.appendChild(el('p', 'panel-desc', advice.adviceText));
    body.appendChild(card);

    body.appendChild(el('h3', 'panel-sub', 'Changer de Compagnon'));
    const actRow = el('div', 'reply-row');
    const activeGhostIds = Object.values(world.council.ghosts).filter((g) => g.status === 'actif').map((g) => g.id);
    for (const gid of activeGhostIds) {
      const def = GHOST_DEFS_BY_ID[gid];
      if (!def) continue;
      const btn = el('button', 'btn btn-topic', `${def.emoji} ${def.name}`);
      btn.addEventListener('click', () => {
        switchCompanionGhost(world, gid);
        openGhostCompanionModal();
      });
      actRow.appendChild(btn);
    }
    body.appendChild(actRow);

    showModal('Conseiller Fantôme Kawaii', 'dialogue rapide & orientation stratégique', body);
  }

  function openStreetEncounterModal(): void {
    const sr = ensureStreetRecognitionState(world);
    const body = el('div', 'panel-body');
    body.appendChild(el('p', 'panel-desc', sr.lastEncounterDialogue || 'Un habitant du quartier t’interpelle dans la rue avec enthousiasme !'));
    const choices = el('div', 'reply-row');
    const acceptBtn = el('button', 'btn btn-action', 'Vendre 3 sachets de biscuits (+6.00 €)');
    acceptBtn.addEventListener('click', () => {
      const res = handleStreetEncounterChoice(world, true);
      closeModal();
      showGhostBanner({ kind: 'bien', text: res.message });
    });
    const refuseBtn = el('button', 'btn btn-reply', 'Discuter poliment et valoriser l’initiative (+1 Influence)');
    refuseBtn.addEventListener('click', () => {
      const res = handleStreetEncounterChoice(world, false);
      closeModal();
      showGhostBanner({ kind: 'info', text: res.message });
    });
    choices.appendChild(acceptBtn);
    choices.appendChild(refuseBtn);
    body.appendChild(choices);
    showModal('Rencontre Spontanée dans la Rue !', 'notoriété populaire · vente sur le pouce', body);
  }

  for (const b of ui.navEl.querySelectorAll('button')) {
    const nav = b.dataset.nav;
    if (nav === '💾 Sauvegardes') b.addEventListener('click', openSaves);
    else if (nav === '📱 Téléphone') b.addEventListener('click', () => openPhoneUi());
    else if (nav === 'Personnage') b.addEventListener('click', openPersonnage);
    else if (nav === 'Relations') b.addEventListener('click', openRelations);
    else if (nav === 'Stratégie / Carte') b.addEventListener('click', openStrategieCarte);
    else if (nav === 'Entreprises & Rôles') b.addEventListener('click', openEntreprisesRoles);
    else if (nav === 'Marchands & Tiers') b.addEventListener('click', openMarchandsTiers);
    else if (nav === 'Actualités & Chocs') b.addEventListener('click', openActualitesChocs);
    else if (nav === 'Carnets de Lucien') b.addEventListener('click', () => openNotebooks({ world, showModal, closeModal }));
    else if (nav === 'Chambre & plans') b.addEventListener('click', () => openPlanner(planCtx()));
    else if (nav === 'Études & Famille') b.addEventListener('click', () => openFamilyPanel({ world, showModal, closeModal, toast }));
    else if (nav === 'Projet') b.addEventListener('click', openProjet);
    else if (nav === 'Concurrence') b.addEventListener('click', openConcurrence);
    else if (nav === 'Conseil') b.addEventListener('click', openConseil);
    else if (nav === 'Journal') b.addEventListener('click', openJournal);
  }
  ui.ghostCompanionWidgetEl.addEventListener('click', openGhostCompanionModal);
  ui.ghostAdviceBubbleEl.addEventListener('click', openGhostCompanionModal);
  ui.newsTickerEl.addEventListener('click', openActualitesChocs);

  // ---------- Concurrence & Campagne narrative ----------

  function openConcurrence(): void {
    const body = el('div', 'panel-body');

    // Section 1 : Campagne & Objectif
    body.appendChild(el('h3', 'panel-sub', `Campagne — Chapitre ${world.campaign.currentChapter}`));
    const stage = world.campaign.stages.find((s) => s.chapter === world.campaign.currentChapter);
    if (stage) {
      const cBox = el('div', 'ghost-detail');
      cBox.appendChild(el('h4', 'journal-title', `✦ ${stage.title} (âge : ${stage.targetAge} ans)`));
      cBox.appendChild(el('p', 'panel-desc', stage.objective));

      // Actions spécifiques au Chapitre 4 : Conseil et Débat
      if (world.campaign.currentChapter === 4) {
        const conseilOk = (world.flags['chapitre4ConseilMobilise'] ?? 0) > 0;
        const debatOk = (world.flags['chapitre4DebatCitoyen'] ?? 0) > 0;

        const row4 = el('div', 'reply-row');
        if (!conseilOk) {
          const btnMob = el('button', 'btn btn-action', 'Mobiliser le Conseil pour le débat citoyen');
          btnMob.addEventListener('click', () => {
            const res = mobilizeCouncilForDebate(world);
            btnMob.textContent = res.message;
            if (res.ok) setTimeout(openConcurrence, 600);
          });
          row4.appendChild(btnMob);
        } else {
          row4.appendChild(el('span', 'stat-label', '✓ Conseil mobilisé pour le quartier'));
          if (!debatOk) {
            const btnDebat = el('button', 'btn btn-action', 'Choisir l’aménagement de la place');
            btnDebat.addEventListener('click', openUrbanDebate);
            row4.appendChild(btnDebat);
          } else {
            row4.appendChild(el('span', 'stat-label', '✓ Grand débat citoyen validé !'));
          }
        }
        cBox.appendChild(row4);
      }

      // Actions spécifiques au Chapitre 5 : Fonder le modèle économique
      if (world.campaign.currentChapter === 5) {
        const modeleOk = (world.flags['chapitre5ModeleFonde'] ?? 0) > 0;
        if (!modeleOk) {
          cBox.appendChild(el('h4', 'panel-sub', 'Choisir le modèle économique de Val-Ferrand :'));
          for (const mId of Object.keys(LASTING_ECONOMIC_MODELS) as LastingEconomicModelId[]) {
            const mDef = LASTING_ECONOMIC_MODELS[mId];
            const mBtn = el('button', 'btn btn-action', `${mDef.title} (${mDef.ghostAlliance})`);
            mBtn.addEventListener('click', () => {
              const res = foundLastingEconomicModel(world, mId);
              mBtn.textContent = res.message;
              openEpilogueModal(res.epilogue);
            });
            cBox.appendChild(mBtn);
          }
        } else {
          const epilogueBtn = el('button', 'btn btn-action', '✦ Consulter l’Épilogue & l’Héritage de Val-Ferrand');
          epilogueBtn.addEventListener('click', () => openEpilogueModal());
          cBox.appendChild(epilogueBtn);
        }
      } else if (world.campaign.completedChapters.includes(5)) {
        const epilogueBtn = el('button', 'btn btn-action', '✦ Consulter l’Épilogue & l’Héritage de Val-Ferrand');
        epilogueBtn.addEventListener('click', () => openEpilogueModal());
        cBox.appendChild(epilogueBtn);
      }

      body.appendChild(cBox);
    }

    // Section 2 : Rivaux & Territoire
    body.appendChild(el('h3', 'panel-sub', 'Concurrence & Parts de marché'));
    for (const rival of Object.values(world.rivals)) {
      const box = el('div', 'ghost-detail');
      const { playerShare, rivalShare } = calculateMarketShares(world, rival.place);
      const placeName = PLACE_BY_ID[rival.place]?.name ?? rival.place;

      box.appendChild(el('h4', 'journal-title', `${rival.name} (${placeName})`));
      box.appendChild(el('p', 'panel-desc',
        `Prix rival : ${rival.price.toFixed(2)} € · Stratégie : ${rival.strategy} · Agressivité : ${rival.aggressiveness}/100`));

      const lastClosed = rival.marketObservation.lastClosed;
      if (lastClosed) {
        const observedPlayerShare = 100 - rival.marketShare;
        const barRow = el('div', 'stat-row');
        barRow.appendChild(el('span', 'stat-label', `Bilan du jour ${lastClosed.day} : toi ${observedPlayerShare}% | rival ${rival.marketShare}% (${lastClosed.sessions} sessions)`));
        const track = el('div', 'need-track');
        const fill = el('div', 'need-fill');
        fill.style.width = `${observedPlayerShare}%`;
        fill.style.background = TOKENS.vert;
        track.appendChild(fill);
        barRow.appendChild(track);
        box.appendChild(barRow);
      } else {
        box.appendChild(el('p', 'panel-note', 'Aucune part mesurée pour l’instant : joue une session de vente puis laisse passer une journée.'));
      }
      box.appendChild(el('p', 'panel-note',
        `Projection avant la prochaine vente : toi ${playerShare}% | rival ${rivalShare}%. Le bilan réel est recalculé après les sessions jouées.`));

      if (rival.id === 'drive_hyper') {
        const impactText = rival.marketShare >= 65
          ? '⚠ Le Drive écrase l’épicerie de Mme Bertin (−0,20/jour)'
          : rival.marketShare >= 45
            ? 'Équilibre fragile : l’épicerie résiste (−0,10/jour)'
            : '✓ Vos circuits courts protègent l’épicerie (+0,10/jour) !';
        const pressureSource = lastClosed
          ? `Pression du quartier après le bilan du jour ${lastClosed.day} : `
          : 'Pression de fond estimée, avant une première vente mesurée : ';
        box.appendChild(el('p', 'panel-note', pressureSource + impactText));
      }

      body.appendChild(box);
    }

    // Section 3 : Contre-stratégies
    body.appendChild(el('h3', 'panel-sub', 'Contre-stratégies jouables'));
    const strategies = getAvailableCounterStrategies(world);
    for (const strat of strategies) {
      const rival = world.rivals[strat.rivalId];
      const isActive = rival ? isCounterStrategyActive(world, rival, strat.id) : false;
      const daysRemaining = rival ? counterStrategyDaysRemaining(world, rival, strat.id) : 0;

      const sBox = el('div', 'rel-row');
      sBox.appendChild(el('span', 'rel-name', strat.label));
      sBox.appendChild(el('p', 'panel-desc', strat.description));
      sBox.appendChild(el('p', 'panel-note',
        `Coût : ${strat.costMoney} € · Temps : ${strat.costTimeMinutes} min · bonus d’attractivité : +${strat.playerShareBonus} · Réputation immédiate : +${strat.reputationBonus}`));

      const btn = el('button', 'btn btn-action', isActive ? `✓ Active · ${daysRemaining} j` : `Lancer (${strat.costMoney} €)`);
      btn.disabled = !!isActive;
      if (!isActive) {
        btn.addEventListener('click', () => {
          const timeCostTicks = Math.ceil(strat.costTimeMinutes / 10);
          const res = executeCounterStrategy(world, strat.id, timeCostTicks);
          btn.textContent = res.message;
          btn.disabled = !res.ok;
          if (res.ok) {
            // Le coût en temps passe par l'horloge canonique et ses effets de simulation.
            runTicks(world, res.timeCostTicks ?? timeCostTicks);
            setTimeout(openConcurrence, 700);
          }
        });
      }
      sBox.appendChild(btn);
      body.appendChild(sBox);
    }

    showModal('Marché & Concurrence', 'parts de marché · rivaux · contre-offensives', body, true);
  }

  function openUrbanDebate(): void {
    const body = el('div', 'panel-body');
    const chapterReady = world.campaign.currentChapter === 4;
    const ageReady = world.player.age >= 15;
    const councilReady = (world.flags['chapitre4ConseilMobilise'] ?? 0) > 0;
    const choiceMade = (world.flags['chapitre4DebatCitoyen'] ?? 0) > 0;
    if (!chapterReady) {
      body.appendChild(el('p', 'panel-desc', 'Le grand choix d’aménagement viendra après les étapes de la Friche et du Réseau Solidaire.'));
    } else if (!ageReady) {
      body.appendChild(el('p', 'panel-desc', `Le débat citoyen aura lieu à 15 ans. Tu as ${world.player.age} ans; tu peux déjà préparer tes arguments et le Conseil.`));
    } else if (!councilReady) {
      body.appendChild(el('p', 'panel-desc', 'Le débat a besoin d’arguments préparés avec au moins deux voix actives du Conseil.'));
      const prepare = el('button', 'btn btn-action', 'Préparer les arguments au Conseil');
      prepare.addEventListener('click', () => openConcurrence());
      body.appendChild(prepare);
    } else if (choiceMade) {
      const code = world.flags['chapitre4ChoixUrbain'];
      const choice = code === 1 ? URBAN_CHOICES.marche_paysan
        : code === 2 ? URBAN_CHOICES.agora_verte
          : code === 3 ? URBAN_CHOICES.foyer_cooperatif : undefined;
      body.appendChild(el('p', 'panel-desc', choice
        ? `Le quartier a choisi ${choice.title}. ${choice.epilogueSummary}`
        : 'Le quartier a déjà voté son aménagement.'));
    } else {
      body.appendChild(el('p', 'panel-desc', 'Après le débat public, les habitants doivent choisir un projet. Chacun engage une partie de la caisse et transforme différemment la place et les commerces.'));
      for (const choiceId of Object.keys(URBAN_CHOICES) as UrbanChoiceId[]) {
        const choice = URBAN_CHOICES[choiceId];
        const card = el('div', 'ghost-detail');
        card.appendChild(el('h3', 'panel-sub', choice.title));
        card.appendChild(el('p', 'panel-note', choice.subtitle));
        card.appendChild(el('p', 'panel-desc', choice.description));
        card.appendChild(el('p', 'panel-note',
          `Coût ${choice.cost} € · Épicerie ${choice.effects.vitaliteEpicerie >= 0 ? '+' : ''}${choice.effects.vitaliteEpicerie} · Parc ${choice.effects.frequentationParc >= 0 ? '+' : ''}${choice.effects.frequentationParc} · Confiance +${choice.effects.confianceQuartier} · Réputation +${choice.effects.reputation}`));
        const choose = el('button', 'btn btn-action', 'Soutenir ce projet');
        choose.disabled = world.player.money < choice.cost;
        if (choose.disabled) choose.title = `Il faut ${choice.cost} €; ta caisse contient ${world.player.money.toFixed(2)} €.`;
        choose.addEventListener('click', () => {
          const result = holdCitizenDebate(world, choiceId);
          if (result.ok) {
            closeModal();
            openConcurrence();
          } else {
            choose.textContent = result.message;
          }
        });
        card.appendChild(choose);
        body.appendChild(card);
      }
    }
    showModal('Le Grand Débat de Val-Ferrand', 'choix d’aménagement · coûts et conséquences', body, true);
  }

  function openEpilogueModal(customEpilogue?: EpilogueResult): void {
    world.seen['epilogue_modal_shown'] = true;
    const epilogue = customEpilogue ?? calculateEpilogue(world);
    const body = el('div', 'panel-body');

    const hero = el('div', 'ghost-detail');
    hero.appendChild(el('h3', 'panel-sub', '✦ ÉPILOGUE DE NEURAPOLIS ✦'));
    hero.appendChild(el('h2', 'journal-title', `${epilogue.legacyTitle} — ${epilogue.modelTitle}`));
    body.appendChild(hero);

    // Destin du quartier
    const distBox = el('div', 'rel-row');
    distBox.appendChild(el('span', 'rel-name', 'Destin de Val-Ferrand'));
    distBox.appendChild(el('p', 'panel-desc', epilogue.districtSummary));
    distBox.appendChild(el('p', 'panel-desc', `${epilogue.urbanChoiceTitle} — ${epilogue.urbanChoiceSummary}`));
    distBox.appendChild(el('p', 'panel-note', `Vitalité épicerie : ${epilogue.vitaliteEpicerie}/100 · Confiance citoyenne : ${epilogue.confianceQuartier}/100`));
    body.appendChild(distBox);

    // Voix du Conseil
    const ghostBox = el('div', 'rel-row');
    ghostBox.appendChild(el('span', 'rel-name', `Pensée directrice — ${epilogue.dominantGhost.name}`));
    ghostBox.appendChild(el('p', 'ghost-citation', `« ${epilogue.dominantGhost.quote} »`));
    body.appendChild(ghostBox);

    // Compagnons de route
    body.appendChild(el('h3', 'panel-sub', 'Compagnons de route'));
    for (const relItem of epilogue.relationshipHighlights) {
      const rBox = el('div', 'rel-row');
      rBox.appendChild(el('span', 'rel-name', `${relItem.name} (${relItem.role})`));
      rBox.appendChild(el('p', 'panel-desc', relItem.highlight));
      body.appendChild(rBox);
    }

    // Récit narratif complet
    body.appendChild(el('h3', 'panel-sub', `La traversée de ${world.player.name} (12 → 16 ans)`));
    for (const para of epilogue.epilogueText.split('\n\n')) {
      body.appendChild(el('p', 'panel-desc', para));
    }

    const closeBtn = el('button', 'btn btn-action', 'Continuer à vivre dans Val-Ferrand');
    closeBtn.addEventListener('click', closeModal);
    body.appendChild(closeBtn);

    showModal('L’Héritage de Val-Ferrand', 'conclusion & postérité', body, true);
  }

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

    // Onglets de bascule entre projets économiques
    const projTabs = el('div', 'reply-row');
    const standBtn = el('button', 'btn btn-topic selected', 'Stand des Roses');
    const atelierBtn = el('button', 'btn btn-topic', 'Atelier de la Friche (Karim)');
    atelierBtn.addEventListener('click', openWorkshopModal);
    projTabs.appendChild(standBtn);
    projTabs.appendChild(atelierBtn);
    body.appendChild(projTabs);

    if (!p || !p.active) {
      body.appendChild(el('p', 'panel-desc', 'Pas encore de stand actif. Le quartier regorge d’idées : pourquoi pas un stand de goûters à la récré ?'));
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

  // ---------- J5 : L’Atelier de la Friche (Karim Bensalah) ----------

  function openWorkshopModal(): void {
    const ws = world.workshop;
    const body = el('div', 'panel-body');

    // Onglets de bascule entre projets économiques
    const projTabs = el('div', 'reply-row');
    const standBtn = el('button', 'btn btn-topic', 'Stand des Roses');
    standBtn.addEventListener('click', openProjet);
    const atelierBtn = el('button', 'btn btn-topic selected', 'Atelier de la Friche (Karim)');
    projTabs.appendChild(standBtn);
    projTabs.appendChild(atelierBtn);
    body.appendChild(projTabs);

    if (!ws || !ws.active) {
      body.appendChild(el('p', 'panel-desc',
        'Karim Bensalah nettoie une carcasse de moteur dans la Friche : « Ici, y’a tout pour un atelier populaire. Il manque juste quelqu’un qui croit. »'));
      const btn = el('button', 'btn btn-action', 'Créer l’Atelier de la Friche avec Karim');
      btn.addEventListener('click', () => {
        const r = createWorkshop(world);
        btn.textContent = r.message;
        btn.disabled = !r.ok;
        if (r.ok) openWorkshopModal();
      });
      body.appendChild(btn);
      showModal('Atelier de la Friche', 'projet économique & solidaire avec Karim', body, true);
      return;
    }

    // Vue d'ensemble de l'Atelier
    const summaryBox = el('div', 'ghost-detail');
    summaryBox.appendChild(statRow('Caisse de l’atelier',
      `${ws.balance.toFixed(2)} € (Livre : ${workshopLedgerBalance(ws).toFixed(2)} € · ${workshopLedgerInvariantHolds(ws) ? 'invariants vérifiés ✓' : 'divergence ⚠'})`));
    summaryBox.appendChild(statRow('Fonds solidaire du quartier',
      `${ws.solidarityFund.toFixed(2)} € (prélèvement solidaire : ${Math.round(ws.solidarityRate * 100)} %)`));
    summaryBox.appendChild(statRow('Stock de pièces de rechange',
      `${ws.partsStock} pièce(s) de récupération`));
    summaryBox.appendChild(statRow('État des outils d’établi',
      `${ws.toolCondition} % ${ws.toolCondition < WORKSHOP_CONFIG.minToolConditionForRepair ? '(trop usés pour réparer !)' : ''}`));
    summaryBox.appendChild(statRow('Réparations achevées',
      `${ws.completedRepairsCount} objets rendus aux habitants`));
    body.appendChild(summaryBox);

    // Actions rapides
    body.appendChild(el('h3', 'panel-sub', 'Gestion & Approvisionnement'));
    const quickActions = el('div', 'reply-row');

    const scavengeBtn = el('button', 'btn btn-action', 'Fouiller la Friche (pièces)');
    scavengeBtn.addEventListener('click', () => {
      const r = scavengeParts(world);
      scavengeBtn.textContent = r.message;
      openWorkshopModal();
    });
    quickActions.appendChild(scavengeBtn);

    const buyPartsBtn = el('button', 'btn btn-action', `Acheter lot de pièces (${WORKSHOP_CONFIG.partsBatchCost} € — 6 pièces)`);
    buyPartsBtn.addEventListener('click', () => {
      const r = buySalvageParts(world);
      buyPartsBtn.textContent = r.message;
      openWorkshopModal();
    });
    quickActions.appendChild(buyPartsBtn);

    const maintainBtn = el('button', 'btn btn-action', `Réviser les outils (${WORKSHOP_CONFIG.maintenanceCost} € → 100 %)`);
    maintainBtn.addEventListener('click', () => {
      const r = maintainTools(world);
      maintainBtn.textContent = r.message;
      openWorkshopModal();
    });
    quickActions.appendChild(maintainBtn);
    body.appendChild(quickActions);

    // Grille tarifaire
    body.appendChild(el('h3', 'panel-sub', 'Politique tarifaire'));
    const tariffRow = el('div', 'reply-row');
    for (const tKey of ['solidaire', 'standard', 'soutien'] as SolidarityTariff[]) {
      const tDef = TARIFF_GRID[tKey];
      const tBtn = el('button', 'btn btn-topic', tDef.label);
      if (ws.tariffMode === tKey) tBtn.classList.add('selected');
      tBtn.addEventListener('click', () => {
        setTariffMode(world, tKey);
        openWorkshopModal();
      });
      tariffRow.appendChild(tBtn);
    }
    body.appendChild(tariffRow);
    body.appendChild(el('p', 'panel-note',
      `${TARIFF_GRID[ws.tariffMode].description} (Alimente la caisse solidaire à hauteur de ${Math.round(TARIFF_GRID[ws.tariffMode].solidarityContributionFactor * 100)} %).`));

    // Commandes
    body.appendChild(el('h3', 'panel-sub', 'Commandes des habitants'));
    const ordersList = el('div', 'journal-list');

    const repaired = ws.orders.filter((o) => o.status === 'repare');
    const pending = ws.orders.filter((o) => o.status === 'en_cours');
    const available = ws.orders.filter((o) => o.status === 'disponible');

    if (repaired.length > 0) {
      ordersList.appendChild(el('h4', 'journal-title', 'Prêts pour livraison :'));
      for (const ord of repaired) {
        const art = el('article', 'journal-entry');
        art.appendChild(el('p', 'panel-desc', `✦ ${ord.item} (${ord.clientName}) — Tarif : ${ord.finalPrice.toFixed(2)} € [${TARIFF_GRID[ord.appliedTariff].label}]`));
        const delBtn = el('button', 'btn btn-reply', 'Livrer & Encaisser (+ part solidaire)');
        delBtn.addEventListener('click', () => {
          deliverOrder(world, ord.id);
          openWorkshopModal();
        });
        art.appendChild(delBtn);
        ordersList.appendChild(art);
      }
    }

    if (pending.length > 0) {
      ordersList.appendChild(el('h4', 'journal-title', 'En cours à l’établi :'));
      for (const ord of pending) {
        const art = el('article', 'journal-entry');
        art.appendChild(el('p', 'panel-desc', `⚙ ${ord.item} (${ord.clientName}) — Pièces nécessaires : ${ord.partsRequired} · Difficulté : ${ord.difficulty}/3 · Tarif : ${ord.finalPrice.toFixed(2)} €`));
        const repBtn = el('button', 'btn btn-action', `Réparer (${ord.partsRequired} pièces, −${ord.difficulty * 6 + 4} % usure)`);
        repBtn.disabled = ws.partsStock < ord.partsRequired || ws.toolCondition < WORKSHOP_CONFIG.minToolConditionForRepair;
        repBtn.addEventListener('click', () => {
          repairOrder(world, ord.id);
          openWorkshopModal();
        });
        art.appendChild(repBtn);
        ordersList.appendChild(art);
      }
    }

    if (available.length > 0) {
      ordersList.appendChild(el('h4', 'journal-title', 'Commandes disponibles du quartier :'));
      for (const ord of available) {
        const art = el('article', 'journal-entry');
        art.appendChild(el('p', 'panel-desc', `📥 ${ord.item} — Client : ${ord.clientName}. « ${ord.description} »`));
        art.appendChild(el('p', 'panel-note', `Prix standard : ${ord.basePrice.toFixed(2)} € · Pièces requises : ${ord.partsRequired} · Difficulté : ${ord.difficulty}/3`));
        const acceptRow = el('div', 'reply-row');
        for (const t of ['solidaire', 'standard', 'soutien'] as SolidarityTariff[]) {
          const calcPrice = (ord.basePrice * TARIFF_GRID[t].multiplier).toFixed(2);
          const aBtn = el('button', 'btn btn-reply', `${TARIFF_GRID[t].label} (${calcPrice} €)`);
          aBtn.addEventListener('click', () => {
            acceptOrder(world, ord.id, t);
            openWorkshopModal();
          });
          acceptRow.appendChild(aBtn);
        }
        art.appendChild(acceptRow);
        ordersList.appendChild(art);
      }
    }
    body.appendChild(ordersList);

    // Grand Livre
    body.appendChild(el('h3', 'panel-sub', `Grand Livre (Σ entrées−sorties = ${workshopLedgerBalance(ws).toFixed(2)} €)`));
    const ledgerBox = el('div', 'journal-list');
    for (const e of [...ws.ledger].reverse().slice(0, 10)) {
      const art = el('article', 'journal-entry');
      art.appendChild(el('p', 'panel-note', `${dateOf(e.day).label} — ${e.label} : ${e.amount >= 0 ? '+' : ''}${e.amount.toFixed(2)} €`));
      ledgerBox.appendChild(art);
    }
    body.appendChild(ledgerBox);

    // Répartition hebdomadaire
    body.appendChild(el('h3', 'panel-sub', 'Répartition hebdomadaire des bénéfices'));
    const distRow = el('div', 'reply-row');
    for (const m of ['equite', 'egalite', 'incitation'] as RepartitionMode[]) {
      const dBtn = el('button', 'btn btn-action', `Répartir (${m})`);
      dBtn.addEventListener('click', () => {
        const r = workshopWeeklyDistribution(world, m);
        dBtn.textContent = r.message;
        openWorkshopModal();
      });
      distRow.appendChild(dBtn);
    }
    body.appendChild(distRow);

    showModal('L’Atelier de la Friche', 'réparations · outillage · pièces · comptabilité solidaire', body, true);
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
    const deferBtn = el('button', 'btn btn-reply', 'Accéder au Conseil (mettre en attente)');
    deferBtn.addEventListener('click', () => {
      deferredArrivals.add(id);
      openConseil();
    });
    choices.appendChild(listenBtn);
    choices.appendChild(refuseBtn);
    choices.appendChild(deferBtn);
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
        b.addEventListener('click', () => {
          deferredArrivals.clear();
          selectGhost(gid, councilSleep(world, gid).message);
        });
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
  let currentBannerGhost: GhostId | undefined = undefined;
  function showGhostBanner(n: Notification): void {
    const def = n.ghost ? GHOST_DEFS_BY_ID[n.ghost] : undefined;
    currentBannerGhost = n.ghost;
    if (n.ghost) audio.playGhostDebate();
    ui.bannerEl.textContent = n.text;
    ui.bannerEl.style.background = def ? `${def.color}22` : `${TOKENS.violet}22`;
    ui.bannerEl.style.borderColor = def?.color ?? TOKENS.violet;
    ui.bannerEl.classList.remove('hidden');
    bannerUntil = performance.now() + 7000;
  }

  function step(dx: number, dy: number): void {
    const moved = (dx !== 0 && tryMove(world, dx, 0)) || tryMove(world, 0, dy);
    if (moved) {
      const tile = tileAt(world.player.pos.x, world.player.pos.y);
      const surface = tile?.kind === 'herbe' ? 'herbe' : tile?.kind === 'terre' ? 'terre' : 'pave';
      audio.playFootstep(surface);
    }
  }

  function frame(now: number): void {
    const dt = Math.min(100, now - last);
    last = now;

    if (bannerUntil > 0 && now >= bannerUntil) {
      ui.bannerEl.classList.add('hidden');
      bannerUntil = 0;
      currentBannerGhost = undefined;
    }

    if (!modalOpen) {
      // Épilogue prêt : ouverture de l'écran de conclusion de la campagne
      if (world.campaign.completedChapters.includes(5) && !world.seen['epilogue_modal_shown']) {
        world.seen['epilogue_modal_shown'] = true;
        audio.playChapterComplete();
        openEpilogueModal();
      } else if (world.council.pendingFusion) {
        // Fusion prête : la scène attend le joueur (M6).
        audio.playGhostDebate();
        openFusionScene();
      } else {
        // Scène d'arrivée : un fantôme attend le choix du joueur.
        const pend = councilPendingArrivals(world).filter((id) => !deferredArrivals.has(id));
        if (pend.length > 0) {
          audio.playGhostArrival();
          openArrivalScene(pend[0] ?? '');
        } else if (world.streetRecognition?.spontaneousEncounterPending) {
          openStreetEncounterModal();
        } else if (pendingSurprise(world) && world.time.tick >= surpriseRetryTick && !world.player.asleep && !travelFastForward() && !isOnBus(world)) {
          // Dilemme : deux fantômes défendent chacun une option. Fermé sans choisir, il revient une heure plus tard.
          surpriseRetryTick = world.time.tick + 6;
          audio.playMarketAlert();
          openSurpriseModal({ world, showModal, closeModal, toast }, (ghost, text, failed) => {
            ghostBar.push({ ghost, text, pop: true, mood: failed ? 'alerte' : 'joie' });
            updateHud(ui, world, promptText());
          });
        } else if (pendingDinner(world) && world.family?.pendingDinner !== dinnerShownId && isHome(world) && !world.player.asleep) {
          // Le dîner : Nora et Thierry attendent une réponse.
          dinnerShownId = world.family?.pendingDinner ?? '';
          openDinnerModal({ world, showModal, closeModal, toast });
        } else if (world.family?.convocation && convocationShownDay !== dayIndexOf(world.time.tick) && !isInClass(world) && !world.player.asleep && minutesOfDay(world.time.tick) >= 16 * 60 + 30) {
          // La principale convoque : un rendez-vous par jour tant que rien n'est réglé.
          convocationShownDay = dayIndexOf(world.time.tick);
          openConvocationModal({ world, showModal, closeModal, toast });
        } else if ((world.story?.unread.length ?? 0) > 0 && !world.player.asleep && !isInClass(world) && !travelFastForward()) {
          // Un cahier de Lucien vient d'être retrouvé : on le lit.
          openUnreadBeat({ world, showModal, closeModal });
        } else if (laminoirDecisionPending(world) && laminoirAskedDay !== dayIndexOf(world.time.tick) && !world.player.asleep && !isTraveling(world)) {
          // Karim revient chaque jour tant que le quartier n'a pas tranché.
          laminoirAskedDay = dayIndexOf(world.time.tick);
          openLaminoirModal();
        } else {
          // La nuit défile en accéléré (ellipse) : 9 heures de sommeil en quelques secondes,
          // tick par tick, sans jamais sauter la clôture économique ni les événements.
          // Sur place, le temps attend le joueur : seules les activités, le train et la nuit le font avancer.
          const speed = world.time.speed === 0 || (isOnSite(world) && !world.player.asleep) ? 0 : isTraveling(world) ? TRAVEL_SPEED : isOnBus(world) ? BUS_SPEED : isInClass(world) ? CLASS_SPEED : world.player.asleep ? NIGHT_SPEED : inShift(world) ? SHIFT_SPEED : world.time.speed;
          if (speed !== 0) {
            acc += dt;
            const tickMs = TICK_MS / speed;
            while (acc >= tickMs) {
              acc -= tickMs;
              const prevDay = dayIndexOf(world.time.tick);
              const out = tickWorld(world);
              // Arrivé sur place (fin du train ou d'une activité) : le temps s'arrête net.
              if (isOnSite(world) && !world.player.asleep) acc = 0;
              const curDay = dayIndexOf(world.time.tick);
              if (curDay !== prevDay) {
                try { recordDay(world); } catch { /* stockage indisponible */ }
                const unlocks = checkAndUnlockThinkers(world);
                for (const un of unlocks) {
                  showGhostBanner(un);
                  audio.playGhostArrival();
                }
              }
              for (const n of out.notifications) {
                if (n.kind === 'journal') audio.playMarketAlert();
                if (n.ghost) {
                  // Un fantôme parle : sa tête s'anime, et il surgit en dessin si c'est important.
                  ghostBar.push({ ghost: n.ghost, text: n.text, pop: n.kind === 'fantome' || n.kind === 'journal' || n.kind === 'alerte', mood: n.kind === 'alerte' ? 'alerte' : n.kind === 'bien' ? 'joie' : 'calme' });
                } else if (n.kind === 'fantome' || n.kind === 'journal') {
                  showGhostBanner(n);
                }
              }
              // Toutes les deux heures de jeu, le penseur le plus concerné par ta situation lève la main.
              if (world.time.tick % 12 === 0 && !world.player.asleep) {
                // Une voix sacrifiée reconnaît l'erreur qui recommence : elle prévient en priorité.
                const warn = lessonWarnings(world)[0];
                if (warn && warn.text !== lastTipText) {
                  lastTipText = warn.text;
                  ghostBar.push({ ghost: warn.ghost, text: warn.text, pop: true, mood: 'alerte' });
                }
                const t = mostUrgentTip(world, ghostBar.roster());
                if (t && t.weight >= 2 && t.text !== lastTipText) {
                  lastTipText = t.text;
                  ghostBar.push({ ghost: t.ghost, text: t.text, pop: t.weight >= 3, mood: t.weight >= 3 ? 'alerte' : 'calme' });
                }
              }
            }
          }
          // Rendu 2D de secours : déplacement case par case. En 3D, la marche est continue
          // et gérée par CityRenderer (voir plus bas).
          if (!(use3D && renderer3D)) {
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
      }
    } else {
      acc = 0;
      moveAcc = 0;
    }

    // Ambiance audio dynamique réactive au lieu, à l'heure du jour et à la météo
    audio.updateAmbient(currentLocation, minutesOfDay(world.time.tick) / 60, world.district.meteo);

    // Bulle de pensée en temps réel pour le compagnon fantôme lors de seuils critiques
    if (world.ghostCompanion) {
      const thought = getGhostCompanionThought(world);
      if (thought.mood !== lastAdviceMood && (thought.mood === 'inquiet' || thought.mood === 'tactique' || thought.mood === 'enthousiaste' || world.player.money < 10)) {
        lastAdviceMood = thought.mood;
        if (now - lastAdviceBubbleTime > 12000) {
          lastAdviceBubbleTime = now;
          showGhostAdvicePopup(ui, thought.name, thought.speechBubble, MOOD_EMOTICONS[thought.mood] ?? '💡');
          audio.playGhostDebate();
        }
      }
    }

    if (use3D && renderer3D && renderer3D.isWebGLAvailable) {
      renderer3D.frame(world, dt / 1000, {
        move: input.vector(),
        running: input.running(),
        canMove: !modalOpen && !world.player.asleep && !inShift(world) && !layoutEdit && !travelFastForward() && !isOnBus(world) && !isInClass(world),
      }, ui.cw, ui.ch);
    } else {
      const rawD = input.dir();
      const isPlayerMoving = !world.player.asleep && (rawD.x !== 0 || rawD.y !== 0);
      renderWorld(ui.ctx, world, ui.cw, ui.ch, now, {
        walkingEntities: { player: isPlayerMoving },
        whisperingGhosts: currentBannerGhost ? [currentBannerGhost] : undefined,
      });
    }

    syncDestinationScene();
    const away = travelFastForward();
    const riding = isOnBus(world);
    const inClass = isInClass(world);
    sleepOverlay.classList.toggle('on', world.player.asleep || away || riding || inClass);
    const destName = currentDestination(world)?.name ?? '…';
    const homeward = (world.flags['voyageAvance'] ?? 0) >= (world.flags['voyageRetour'] ?? 0);
    const busStop = riding ? stopNear(world, 0) : undefined;
    const sleepMsg = inClass
      ? `📚 ${world.family?.inClass?.moment ?? 'En cours'}`
      : riding
      ? `🚌 Ligne 1 → ${busStop?.name ?? '…'}`
      : !away
      ? '😴 Tu dors… la nuit passe'
      : homeward
        ? `🚆 Retour vers Val-Ferrand — arrivée le ${dateOf(dayIndexOf(world.flags['voyageRetour'] ?? world.time.tick)).label}`
        : renderer3D?.interiorSpec?.destinationId
          ? `⏳ Une demi-journée à ${destName}…`
          : `🚆 En train vers ${destName}…`;
    if (sleepText.textContent !== sleepMsg) sleepText.textContent = sleepMsg;
    if (renderer3D && use3D && hudFrame % 10 === 0) audio.setTrafficLevel(renderer3D.trafficLevel);
    if (renderer3D?.inInterior && !modalOpen && !layoutEditActive()) {
      const v = input.vector();
      if (v.x !== 0 || v.y !== 0) {
        interiorStepAcc += dt;
        if (interiorStepAcc > (input.running() ? 300 : 460)) {
          interiorStepAcc = 0;
          audio.playFootstep(renderer3D.interiorSpec?.floor === 'parquet' ? 'parquet' : 'sol');
        }
      }
    }
    if (++hudFrame % 30 === 0) {
      ghostBar.sync(world);
      newsToaster.check(world);
      syncPlanChip();
      // Les cours ouvrent : une voix le rappelle si tu es loin du collège.
      const session = classWindow(world);
      const reminder = session ? `${dayIndexOf(world.time.tick)}:${session}` : '';
      if (session && reminder !== classReminderKey && !world.player.asleep) {
        classReminderKey = reminder;
        const far = placeAtAdjacent(world) !== 'college';
        const voice = ghostBar.roster().find((g) => !isSilenced(world, g));
        if (far && voice) ghostBar.push({ ghost: voice, pop: session === 'matin', mood: 'calme', text: `Les cours ${session === 'matin' ? 'du matin commencent à 8 h 30' : 'de l’après-midi commencent à 13 h 30'}. Va au collège, ou assume l’absence : ${ensureFamily(world).arrangement ? 'ta convention en couvre deux par semaine.' : 'tes parents seront prévenus.'}` });
      }
      // Très grosse erreur : une voix propose de se sacrifier pour remonter le temps.
      const cat = rewindOffer(world);
      const key = cat ? `${cat.day}|${cat.text}` : '';
      if (cat && key !== rewindOfferKey) {
        rewindOfferKey = key;
        const g = sacrificeCandidates(world)[0];
        if (g) {
          ghostBar.push({
            ghost: g, mood: 'alerte', pop: true,
            text: `${cat.text} Je peux te ramener avant… mais j’y laisserai ma voix pour un temps.`,
            action: { label: '⏳ Remonter le temps', run: () => openRewindModal({ world, showModal, closeModal, toast }) },
          });
        }
      }
      syncSigns();
      syncWaypoints();
      syncTips();
      syncStallCrowds();
    }
    if (hudFrame % 2 === 0 && ui.minimapCtx) {
      const pose = playerPose();
      drawMinimap(ui.minimapCtx, 360, world, pose, pose.heading, renderer3D?.cameraYaw ?? 0);
      const street = streetNameAt(world.player.pos.x, world.player.pos.y) ?? 'Val-Ferrand';
      if (ui.streetEl.textContent !== street) ui.streetEl.textContent = street;
    }
    updateHud(ui, world, promptText());
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

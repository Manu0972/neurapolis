import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { checkAndUnlockThinkers, ensureGhostCompanionState, THINKER_UNLOCK_RULES } from '../src/simulation/ghost_companions';
import { ensureActionPlanningState, selectTacticalBranch } from '../src/simulation/action_plan';
import { INITIAL_ACTION_PLANS } from '../src/data/action_plans';
import { getCameraRelativeInput } from '../src/presentation/renderer3d';
import { audio } from '../src/presentation/audio';

describe('R3 — Déblocage Progressif des Penseurs & Compagnons Fantômes', () => {
  it('contient les règles de déblocage pour les 8 penseurs clés', () => {
    expect(THINKER_UNLOCK_RULES.length).toBe(8);
    const ids = THINKER_UNLOCK_RULES.map((r) => r.ghostId);
    expect(ids).toEqual(['smith', 'walras', 'taylor', 'locke', 'ostrom', 'marx', 'keynes', 'schumpeter']);
  });

  it('débloque Adam Smith dès le premier échange commercial', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    gc.unlockedThinkers = []; // Reset pour test unitaire

    expect(checkAndUnlockThinkers(w)).toEqual([]);
    expect(gc.unlockedThinkers.includes('smith')).toBe(false);

    w.flags['echanges'] = 1;
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.length).toBe(1);
    expect(notifs[0]?.ghost).toBe('smith');
    expect(notifs[0]?.text).toContain('Adam Smith');
    expect(gc.unlockedThinkers).toContain('smith');

    // Vérification d'idempotence : ne se débloque pas une deuxième fois
    const notifs2 = checkAndUnlockThinkers(w);
    expect(notifs2.length).toBe(0);
  });

  it('débloque Léon Walras si moyenne scolaire >= 15 et compréhension >= 40', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    gc.unlockedThinkers = [];

    w.player.characteristics.comprehension = 42;
    if (w.schoolLife) w.schoolLife.academicAverage = 14.5;
    expect(checkAndUnlockThinkers(w)).toEqual([]);

    if (w.schoolLife) w.schoolLife.academicAverage = 15.5;
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.some((n) => n.ghost === 'walras')).toBe(true);
    expect(gc.unlockedThinkers).toContain('walras');
  });

  it('débloque Frederick Taylor si discipline >= 50 et 5 cours consécutifs suivis', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    gc.unlockedThinkers = [];

    w.player.characteristics.discipline = 52;
    if (w.schoolLife) w.schoolLife.consecutiveClassesAttended = 4;
    expect(checkAndUnlockThinkers(w).some((n) => n.ghost === 'taylor')).toBe(false);

    if (w.schoolLife) w.schoolLife.consecutiveClassesAttended = 5;
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.some((n) => n.ghost === 'taylor')).toBe(true);
    expect(gc.unlockedThinkers).toContain('taylor');
  });

  it('débloque John Locke si assiduité scolaire >= 95% et première injustice observée', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    gc.unlockedThinkers = [];

    if (w.schoolLife) w.schoolLife.attendanceRate = 96;
    w.flags['injustices'] = 0;
    expect(checkAndUnlockThinkers(w).some((n) => n.ghost === 'locke')).toBe(false);

    w.flags['injustices'] = 1;
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.some((n) => n.ghost === 'locke')).toBe(true);
    expect(gc.unlockedThinkers).toContain('locke');
  });

  it('débloque Elinor Ostrom avec la maîtrise de la notion « confiance_incitations » (stade 4)', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    gc.unlockedThinkers = [];

    w.player.notions['confiance_incitations'] = { id: 'confiance_incitations', stage: 3, applications: 1 };
    expect(checkAndUnlockThinkers(w).some((n) => n.ghost === 'ostrom')).toBe(false);

    w.player.notions['confiance_incitations'] = { id: 'confiance_incitations', stage: 4, applications: 2 };
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.some((n) => n.ghost === 'ostrom')).toBe(true);
    expect(gc.unlockedThinkers).toContain('ostrom');
  });

  it('débloque Karl Marx avec la maîtrise de la notion « egalite_equite_incitation » (stade 4)', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    gc.unlockedThinkers = [];

    w.player.notions['egalite_equite_incitation'] = { id: 'egalite_equite_incitation', stage: 2, applications: 0 };
    expect(checkAndUnlockThinkers(w).some((n) => n.ghost === 'marx')).toBe(false);

    w.player.notions['egalite_equite_incitation'] = { id: 'egalite_equite_incitation', stage: 4, applications: 3 };
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.some((n) => n.ghost === 'marx')).toBe(true);
    expect(gc.unlockedThinkers).toContain('marx');
  });

  it('débloque John Maynard Keynes avec la maîtrise de la notion « prevision_incertaine » (stade 4)', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    gc.unlockedThinkers = [];

    w.player.notions['prevision_incertaine'] = { id: 'prevision_incertaine', stage: 3, applications: 2 };
    expect(checkAndUnlockThinkers(w).some((n) => n.ghost === 'keynes')).toBe(false);

    w.player.notions['prevision_incertaine'] = { id: 'prevision_incertaine', stage: 4, applications: 3 };
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.some((n) => n.ghost === 'keynes')).toBe(true);
    expect(gc.unlockedThinkers).toContain('keynes');
  });

  it('débloque Joseph Schumpeter si expansion !== quartier et adaptabilité >= 45', () => {
    const w = createWorld();
    const gc = ensureGhostCompanionState(w);
    const ap = ensureActionPlanningState(w);
    gc.unlockedThinkers = [];

    ap.expansionLevel = 'quartier';
    w.player.characteristics.adaptabilite = 50;
    expect(checkAndUnlockThinkers(w).some((n) => n.ghost === 'schumpeter')).toBe(false);

    ap.expansionLevel = 'inter_quartiers';
    const notifs = checkAndUnlockThinkers(w);
    expect(notifs.some((n) => n.ghost === 'schumpeter')).toBe(true);
    expect(gc.unlockedThinkers).toContain('schumpeter');
  });
});

describe('R3 — Branches Tactiques des Plans d’Action Stratégiques', () => {
  it('contient des branches tactiques enrichies dans INITIAL_ACTION_PLANS', () => {
    const planA = INITIAL_ACTION_PLANS.find((p) => p.id === 'plan_approvisionnement_direct');
    expect(planA).toBeDefined();
    expect(planA?.tacticalBranches?.length).toBe(2);

    const branchIds = planA?.tacticalBranches?.map((b) => b.id);
    expect(branchIds).toContain('branche_bertin_court');
    expect(branchIds).toContain('branche_docks_volume');

    const bBertin = planA?.tacticalBranches?.find((b) => b.id === 'branche_bertin_court');
    expect(bBertin?.label).toContain('Épicerie Bertin Circuit Court');
    expect(bBertin?.modifierSummary).toContain('Marge +15 %');
    expect(bBertin?.marginBonus).toBe(0.15);

    const bDocks = planA?.tacticalBranches?.find((b) => b.id === 'branche_docks_volume');
    expect(bDocks?.label).toContain('Grossiste Fluvial des Docks');
    expect(bDocks?.costModifier).toBe(-0.25);
  });

  it('initialise les instances de plans avec une branche tactique par défaut', () => {
    const w = createWorld();
    const ap = ensureActionPlanningState(w);
    const planA = ap.plans['plan_approvisionnement_direct'];

    expect(planA?.tacticalBranches).toBeDefined();
    expect(planA?.tacticalBranches?.length).toBe(2);
    expect(planA?.selectedBranchId).toBe('branche_bertin_court');
  });

  it('permet de sélectionner une branche tactique et persiste le choix dans l’instance', () => {
    const w = createWorld();
    const planId = 'plan_approvisionnement_direct';
    const ap = ensureActionPlanningState(w);

    const ok = selectTacticalBranch(w, planId, 'branche_docks_volume');
    expect(ok).toBe(true);
    expect(ap.plans[planId]?.selectedBranchId).toBe('branche_docks_volume');

    // Vérifie le basculement inverse
    const ok2 = selectTacticalBranch(w, planId, 'branche_bertin_court');
    expect(ok2).toBe(true);
    expect(ap.plans[planId]?.selectedBranchId).toBe('branche_bertin_court');
  });

  it('rejette la sélection d’une branche inexistante ou d’un plan inconnu', () => {
    const w = createWorld();
    expect(selectTacticalBranch(w, 'plan_approvisionnement_direct', 'branche_inexistante')).toBe(false);
    expect(selectTacticalBranch(w, 'plan_inconnu', 'branche_bertin_court')).toBe(false);
  });
});

describe('R1 & R2 — Transformation Caméra et Hooks Audio Procéduraux', () => {
  it('convertit correctement les entrées directionnelles selon le quart de tour caméra', () => {
    // 0° (isométrique standard)
    expect(getCameraRelativeInput(0, -1, 0)).toEqual({ x: 0, y: -1 });
    expect(getCameraRelativeInput(1, 0, 0)).toEqual({ x: 1, y: 0 });

    // 90° sens horaire : (dx, dy) -> (-dy, dx)
    expect(getCameraRelativeInput(0, -1, 1)).toEqual({ x: 1, y: 0 });
    expect(getCameraRelativeInput(1, 0, 1)).toEqual({ x: 0, y: 1 });

    // 180° : (dx, dy) -> (-dx, -dy)
    expect(getCameraRelativeInput(0, -1, 2)).toEqual({ x: 0, y: 1 });
    expect(getCameraRelativeInput(1, 0, 2)).toEqual({ x: -1, y: 0 });

    // 270° : (dx, dy) -> (dy, -dx)
    expect(getCameraRelativeInput(0, -1, 3)).toEqual({ x: -1, y: 0 });
    expect(getCameraRelativeInput(1, 0, 3)).toEqual({ x: 0, y: -1 });
  });

  it('exécute les effets sonores SFX et nappes d’ambiance sans erreur en environnement headless', () => {
    expect(() => audio.playObjectiveComplete()).not.toThrow();
    expect(() => audio.playMarketAlert()).not.toThrow();
    expect(() => audio.playCoin()).not.toThrow();
    expect(() => audio.playGhostArrival()).not.toThrow();
    expect(() => audio.updateAmbient('ville', 14, 'soleil')).not.toThrow();
    expect(() => audio.updateAmbient('maison', 22, 'pluie')).not.toThrow();
  });
});

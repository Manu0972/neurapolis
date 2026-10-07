/**
 * Chambre-QG : objets gagnés en faisant, leurs avantages, tableau des plans (besoins,
 * manques, exécution), sauvegarde v21.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY } from '../src/core/types';
import { runTicks } from '../src/simulation/engine';
import { ensureAscension, resolveLaunch } from '../src/simulation/ascension';
import { addPlan, ensureRoom, executePlan, maxPlans, planChecklist, planReady, removePlan } from '../src/simulation/room';
import { exportSave, importSave } from '../src/saves/persist';
import { CURRENT_SAVE_VERSION, migrateSave } from '../src/saves/migrations';

describe('objets', () => {
  it('la photo de Lucien est là dès le début ; un objet arrive quand on l’a mérité', () => {
    const w = createWorld();
    expect(ensureRoom(w).owned['photo_lucien']).toBe(0);
    runTicks(w, TICKS_PER_DAY);
    expect(ensureRoom(w).owned['tirelire']).toBeUndefined();
    w.player.money = 100;
    addPlan(w, 'gouters_cour');
    executePlan(w, ensureRoom(w).plans[0]!.id);
    resolveLaunch(w, 'A');
    const out = runTicks(w, TICKS_PER_DAY);
    expect(ensureRoom(w).owned['tirelire']).toBeDefined();
    expect(ensureRoom(w).owned['tableau_liege']).toBeDefined();
    expect(out.some((n) => n.text.includes('Tirelire'))).toBe(true);
  });

  it('le tableau de liège donne une place de plan en plus', () => {
    const w = createWorld();
    expect(maxPlans(w)).toBe(1);
    ensureRoom(w).owned['tableau_liege'] = 0;
    expect(maxPlans(w)).toBe(2);
  });

  it('le casque calme le stress chaque matin', () => {
    const w = createWorld();
    ensureRoom(w).owned['casque'] = 0;
    w.player.needs.stress = 50;
    runTicks(w, TICKS_PER_DAY);
    expect(w.player.needs.stress).toBeLessThan(50);
  });
});

describe('tableau des plans', () => {
  it('un plan d’un palier supérieur montre ce qui manque et comment l’obtenir', () => {
    const w = createWorld();
    expect(addPlan(w, 'livraison_courses').ok).toBe(true);
    const list = planChecklist(w, 'livraison_courses');
    const tier = list[0]!;
    expect(tier.ok).toBe(false);
    expect(tier.hint).toMatch(/bénéfices cumulés/);
    expect(planReady(w, 'livraison_courses')).toBe(false);
    expect(executePlan(w, ensureRoom(w).plans[0]!.id).ok).toBe(false);
  });

  it('le tableau a une taille limitée ; on décroche un plan', () => {
    const w = createWorld();
    addPlan(w, 'gouters_cour');
    expect(addPlan(w, 'soutien_scolaire').ok).toBe(false);
    removePlan(w, ensureRoom(w).plans[0]!.id);
    expect(addPlan(w, 'soutien_scolaire').ok).toBe(true);
  });

  it('un plan prêt s’exécute ; le post-it reste jusqu’au vrai lancement', () => {
    const w = createWorld();
    w.player.money = 100;
    addPlan(w, 'gouters_cour');
    expect(planReady(w, 'gouters_cour')).toBe(true);
    const id = ensureRoom(w).plans[0]!.id;
    expect(executePlan(w, id).ok).toBe(true);
    expect(ensureAscension(w).pending?.ideaId).toBe('gouters_cour');
    expect(ensureRoom(w).plans).toHaveLength(1);
    resolveLaunch(w, 'B');
    runTicks(w, TICKS_PER_DAY);
    expect(ensureRoom(w).plans).toHaveLength(0);
  });
});

describe('sauvegarde v21', () => {
  it('une sauvegarde v20 reçoit une chambre avec la photo de Lucien ; aller-retour fidèle', () => {
    const w = createWorld();
    addPlan(w, 'gouters_cour');
    const raw = JSON.parse(exportSave(w)) as Record<string, unknown>;
    raw.version = 20;
    delete raw.room;
    const m = migrateSave(raw);
    expect(m.version).toBe(CURRENT_SAVE_VERSION);
    expect(m.room!.owned['photo_lucien']).toBe(0);
    expect(importSave(exportSave(w)).room).toEqual(w.room);
  });
});

describe('objets d’Antigravity', () => {
  it('chaque objet a une condition d’arrivée, sauf les doublons connus', async () => {
    const { ROOM_ITEMS: AG } = await import('../src/data/room/items');
    const { ROOM_ITEM_BY_ID } = await import('../src/data/room_registry');
    const doublons = ['room_photo_lucien_fonderie', 'room_reveil_mecanique_rouille', 'room_tirelire_cochon_fonte', 'room_ordinateur_portable_reconditionne'];
    const orphelins = AG.filter((i) => !ROOM_ITEM_BY_ID[i.id] && !doublons.includes(i.id)).map((i) => i.id);
    expect(orphelins).toEqual([]);
  });

  it('une connexion fait arriver son objet', () => {
    const w = createWorld();
    ensureAscension(w).contacts['karim'] = 0;
    runTicks(w, TICKS_PER_DAY);
    expect(ensureRoom(w).owned['room_poste_radio_transistor']).toBeDefined();
  });
});

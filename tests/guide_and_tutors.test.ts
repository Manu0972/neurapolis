/**
 * Prise en main (sprint V1, lot ASC-3) : les applications se gagnent selon docs/ASCENSION.md §3.2,
 * chacune présentée par un fantôme en trois étapes courtes ; le guide « Maintenant » donne une
 * seule étape concrète, lue dans l'état réel, sans rien modifier.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { minutesOfDay } from '../src/core/clock';
import { runTicks, tickWorld } from '../src/simulation/engine';
import { APP_TUTORIALS, INITIAL_TUTORIALS, appTutorialId } from '../src/data/tutorials';
import { APP_UNLOCKS, STARTING_APPS, isAppOpen } from '../src/simulation/unlocks';
import { ensureAscension, requestLaunch, resolveLaunch } from '../src/simulation/ascension';
import { nextStep } from '../src/simulation/guide';
import { appTutorialSeen, markAppTutorialSeen, shouldPresent } from '../src/presentation/ghost-tutor';

describe('mini-tutoriels des applications', () => {
  it('chaque application a son fantôme et trois étapes courtes, en français', () => {
    for (const id of [...STARTING_APPS, ...APP_UNLOCKS.map((a) => a.id)]) {
      const t = APP_TUTORIALS[id];
      expect(t, id).toBeDefined();
      expect(t!.steps).toHaveLength(3);
      for (const s of t!.steps) expect(s.length, `${id} : ${s}`).toBeLessThanOrEqual(150);
      expect(INITIAL_TUTORIALS[appTutorialId(id)]).toBeDefined();
    }
    for (const a of APP_UNLOCKS) expect(APP_TUTORIALS[a.id]!.ghost).toBe(a.ghost);
  });

  it('pas de mur de texte : chaque astuce tient en deux phrases courtes', () => {
    for (const t of Object.values(INITIAL_TUTORIALS)) {
      if (t.id.startsWith('tuto_app_')) continue;
      expect(t.body.length, t.id).toBeLessThanOrEqual(200);
    }
  });

  it('une application gagnée se présente une fois, puis plus jamais ; jamais en bac à sable', () => {
    const w = createWorld();
    expect(shouldPresent(w, 'banque')).toBe(false); // pas encore gagnée
    w.player.notions['cout_opportunite'] = { id: 'cout_opportunite', stage: 1, applications: 0 };
    expect(isAppOpen(w, 'banque')).toBe(true);
    expect(shouldPresent(w, 'banque')).toBe(true);
    markAppTutorialSeen(w, 'banque');
    expect(appTutorialSeen(w, 'banque')).toBe(true);
    expect(shouldPresent(w, 'banque')).toBe(false);
    expect(shouldPresent(createWorld({ sandbox: true }), 'banque')).toBe(false);
  });

  it('une ancienne sauvegarde sans fiche de tutoriel la reçoit en la marquant vue', () => {
    const w = createWorld();
    w.tutorials = { tutorials: {} };
    markAppTutorialSeen(w, 'emploi');
    expect(w.tutorials.tutorials['tuto_app_emploi']?.seen).toBe(true);
  });
});

describe('applications gagnées en jouant (ASCENSION §3.2)', () => {
  it('la Banque s’ouvre en découvrant le coût d’opportunité', () => {
    const w = createWorld();
    expect(isAppOpen(w, 'banque')).toBe(false);
    w.player.notions['cout_opportunite'] = { id: 'cout_opportunite', stage: 1, applications: 0 };
    expect(isAppOpen(w, 'banque')).toBe(true);
  });

  it('l’Immobilier s’ouvre après une première semaine de ventes, et la présentation est annoncée le soir', () => {
    const w = createWorld({ seed: 5 });
    w.player.money = 15;
    requestLaunch(w, 'soutien_scolaire');
    resolveLaunch(w, 'B');
    expect(isAppOpen(w, 'immobilier')).toBe(false);
    const out = runTicks(w, 8 * TICKS_PER_DAY);
    expect(isAppOpen(w, 'immobilier')).toBe(true);
    const intro = out.find((n) => n.text.startsWith('📱') && n.text.includes('Immobilier'));
    expect(intro?.ghost).toBe('smith');
    expect(intro!.text.length).toBeLessThan(80); // une ligne : la voix présente le reste en trois étapes
  });

  it('l’Emploi s’ouvre quand des ventes sont manquées au Quartier', () => {
    const w = createWorld();
    const a = ensureAscension(w);
    expect(isAppOpen(w, 'emploi')).toBe(false);
    a.tier = 2;
    a.ventures['livraison_courses'] = {
      ideaId: 'livraison_courses', launchedDay: 0, strategy: 'B', level: 1, cash: 10, revenueTotal: 100, profitTotal: 5, universes: {},
      verdictDay: 21, verdictDone: false, redDays: 0, last: { day: 0, demand: 100, revenue: 60, costs: 50, profit: 10, unsold: 0, missed: 40 },
    };
    expect(isAppOpen(w, 'emploi')).toBe(true);
  });
});

/** Campagne de Val-Ferrand achevée : le guide ne parle plus que de l'Ascension. */
function campagneFinie(w: WorldState): void {
  for (const st of w.campaign.stages) st.completed = true;
  w.campaign.currentChapter = 5;
  w.campaign.completedChapters = [1, 2, 3, 4, 5];
}

describe('guide « Maintenant »', () => {
  it('au réveil du premier jour : la carte du chapitre 1 prime (le stand), pas l’Ascension', () => {
    const w = createWorld();
    const s = nextStep(w)!;
    expect(s.id).toBe('campagne');
    expect(s.text).toMatch(/^Chapitre 1 : .*Tenir le stand/);
    expect(s.action).toBe('carte');
  });

  it('campagne achevée : lancer sa première affaire depuis le téléphone', () => {
    const w = createWorld();
    campagneFinie(w);
    const s = nextStep(w)!;
    expect(s.id).toBe('premiere');
    expect(s.action).toBe('ascension');
    expect(s.text).toMatch(/Téléphone \(P\)/);
  });

  it('les cours approchent : aller au collège, le plan à la main', () => {
    const w = createWorld();
    w.player.money = 15;
    requestLaunch(w, 'soutien_scolaire');
    resolveLaunch(w, 'B');
    while (minutesOfDay(w.time.tick) < 8 * 60 + 10) tickWorld(w);
    const s = nextStep(w)!;
    expect(s.id).toBe('cours');
    expect(s.action).toBe('carte');
  });

  it('une décision en attente passe avant tout, puis une caisse dans le rouge', () => {
    const w = createWorld();
    w.player.money = 100;
    requestLaunch(w, 'gouters_cour');
    expect(nextStep(w)!.id).toBe('decision');
    resolveLaunch(w, 'A');
    ensureAscension(w).ventures['gouters_cour']!.cash = -8;
    const s = nextStep(w)!;
    expect(s.id).toBe('rouge');
    expect(s.text).toContain('renfloue');
  });

  it('sans argent ni idée abordable : le petit boulot chez Mme Bertin, avec le compte des services', () => {
    const w = createWorld();
    w.player.money = 15;
    requestLaunch(w, 'soutien_scolaire');
    resolveLaunch(w, 'B');
    campagneFinie(w);
    w.time.tick += 9 * 6; // 16 h 10 : plus de cours aujourd'hui, l'épicerie embauche
    const s = nextStep(w)!;
    expect(s.id).toBe('boulot');
    expect(s.text).toContain('0/3');
    expect(s.text).toContain('maintenant');
  });

  it('ensuite, la preuve qui manque pour le palier suivant, avec son « comment »', () => {
    const w = createWorld();
    const a = ensureAscension(w);
    w.flags['jobShiftsDone'] = 3;
    a.contacts['bertin'] = 0;
    w.player.money = 0;
    w.player.asleep = false;
    a.ventures['soutien_scolaire'] = {
      ideaId: 'soutien_scolaire', launchedDay: 0, strategy: 'B', level: 1, cash: 2, revenueTotal: 10, profitTotal: 2, universes: {},
      verdictDay: 21, verdictDone: false, redDays: 0,
    };
    campagneFinie(w);
    // Hors des heures de cours : un dimanche après-midi.
    w.time.tick = 5 * TICKS_PER_DAY + 15 * 6;
    const s = nextStep(w);
    expect(s?.id).toBe('palier');
    expect(s?.text).toMatch(/Le Quartier/);
  });

  it('le guide lit le monde sans le modifier', () => {
    const w = createWorld();
    const before = JSON.stringify(w);
    nextStep(w);
    expect(JSON.stringify(w)).toBe(before);
  });
});

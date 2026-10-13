/**
 * Cohérence du récit et des textes (sprint V1, vague 3, agent « coherence ») : garde-fous sur les
 * incohérences relevées en jouant la V1 — nom du collège, tutoiement, accords, enseignants des
 * moments de classe, guide « Maintenant » (campagne d'abord, horaires), fin du chapitre 1,
 * contre-offensive payée par la caisse du stand, moyenne du bilan de « Passer le temps ».
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { dayIndexOf, isSchoolDay } from '../src/core/clock';
import { INITIAL_CAMPAIGN_STAGES } from '../src/data/campaign';
import { PLACES } from '../src/data/places';
import { CLASS_MOMENTS, SCHOOL_STAFF, SESSION_SUBJECT, type ClassMoment } from '../src/data/family_starter';
import { CLASS_MOMENTS_EXT } from '../src/data/school/events';
import { FAMILY_LINES, SCHOOL_CHARACTERS } from '../src/data/story/family';
import { STARTER_ORIGIN } from '../src/data/story_starter';
import { BEATS } from '../src/data/story_registry';
import { personalize } from '../src/simulation/story';
import { etablissementScolaire, ensureSchoolLifeState } from '../src/simulation/school_life';
import {
  CHAPTER_CLOSES_TONIGHT, campaignNextHint, getCampaignProgressSummary, syncStageTexts,
} from '../src/simulation/campaign';
import { bertinWhen, nextStep } from '../src/simulation/guide';
import { createProject, ledgerInvariantHolds } from '../src/simulation/project';
import { executeCounterStrategy } from '../src/simulation/rival';
import { COUNTER_STRATEGIES } from '../src/data/rivals';
import { ensureFamily } from '../src/simulation/family';
import { schoolAverage, skipTime } from '../src/simulation/timeskip';

/** Tous les fichiers .ts d'un dossier (récursif). */
function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}
const SOURCES = ['src/data', 'src/simulation', 'src/presentation'].flatMap(tsFiles)
  .map((f) => ({ f, text: readFileSync(f, 'utf-8') }));

function campagneFinie(w: WorldState): void {
  for (const st of w.campaign.stages) st.completed = true;
  w.campaign.currentChapter = 5;
  w.campaign.completedChapters = [1, 2, 3, 4, 5];
}

describe('nom du collège : un seul, « collège Jean-Moulin »', () => {
  it('aucun « Collège des Roses » dans les textes du jeu', () => {
    const hits = SOURCES.filter((s) => /coll[eè]ge des roses/i.test(s.text)).map((s) => s.f);
    expect(hits).toEqual([]);
  });

  it('le lieu, l’intérieur et le nom d’établissement disent la même chose', () => {
    expect(PLACES.find((p) => p.id === 'college')?.name).toBe('Collège Jean-Moulin');
    expect(etablissementScolaire(12)).toBe('collège Jean-Moulin');
    expect(SCHOOL_STAFF.principal.role).toContain('collège Jean-Moulin');
  });
});

describe('tutoiement et accords', () => {
  it('pas de « vous » dans les titres et objectifs de chapitre, ni dans les indices de campagne', () => {
    const vous = /\b(vous|vos|votre|vôtre)\b/i;
    for (const st of INITIAL_CAMPAIGN_STAGES) {
      expect(st.objective, st.id).not.toMatch(vous);
      expect(st.title, st.id).not.toMatch(vous);
    }
    const w = createWorld();
    for (let ch = 1; ch <= 5; ch++) {
      w.campaign.currentChapter = ch;
      expect(campaignNextHint(w) ?? '', `chapitre ${ch}`).not.toMatch(vous);
    }
  });

  it('la nuit de la Maison du Peuple s’accorde au genre du personnage', () => {
    const page = STARTER_ORIGIN.pages.find((p) => p.includes('lino'))!;
    const w = createWorld();
    w.player.gender = 'fille';
    expect(personalize(w, page)).toContain('couchée sur le lino');
    w.player.gender = 'garcon';
    expect(personalize(w, page)).toContain('couché sur le lino');
    w.player.gender = 'non-binaire';
    expect(personalize(w, page)).toContain('couché·e sur le lino');
  });

  it('aucun marqueur d’accord ne reste visible dans le récit', () => {
    const w = createWorld();
    for (const g of ['fille', 'garcon', 'non-binaire'] as const) {
      w.player.gender = g;
      for (const b of BEATS) {
        for (const t of [b.title, ...b.pages, b.note ?? '']) expect(personalize(w, t), b.id).not.toMatch(/\{e\}|\{prenom\}/);
      }
    }
  });

  it('les fantômes ne disent plus « mon ami » au joueur (mot genré) : « mon enfant »', () => {
    // « mon ami Karl », « mon ami Noah » s'adressent à des personnages masculins : permis.
    const hits = SOURCES.flatMap((s) => (s.text.match(/\bmon ami\b(?! (Karl|Noah))/gi) ?? []).map(() => s.f));
    expect(hits).toEqual([]);
  });

  it('pas de participe masculin imposé au joueur dans la convocation (« Puni cinq jours »)', () => {
    const family = SOURCES.find((s) => s.f.replace(/\\/g, '/').endsWith('simulation/family.ts'))!;
    expect(family.text).not.toMatch(/\bPuni cinq jours\b/);
  });
});

describe('famille et collège', () => {
  it('le massage de Thierry : c’est lui qui rentre de sa journée de cariste, pas l’enfant', () => {
    const line = FAMILY_LINES.find((l) => l.id === 'fam_fatigue_thierry_massage_epaules')!;
    expect(line.text).not.toMatch(/trapèzes noués après une journée de manutention/);
    expect(line.text).toMatch(/rentré de sa journée de cariste/);
  });

  it('principal et CPE : les mêmes noms dans le bureau de convocation et dans le registre du collège', () => {
    const principal = SCHOOL_CHARACTERS.find((c) => /^Principal/.test(c.role))!;
    const cpe = SCHOOL_CHARACTERS.find((c) => /CPE/.test(c.role))!;
    expect(SCHOOL_STAFF.principal.name).toBe(principal.name);
    expect(SCHOOL_STAFF.cpe.name).toBe(cpe.name);
  });

  it('un enseignant nommé dans un moment de classe est celui de la matière de la séance', () => {
    const subjects = [...SESSION_SUBJECT.matin, ...SESSION_SUBJECT.apres];
    const teacherOf = new Map<string, string>(); // nom → matière
    for (const s of subjects) {
      const m = s.match(/^(.+?) avec ((?:M\.|Mme|Mr\.) \S+)$/);
      if (m) teacherOf.set(m[2]!, m[1]!);
    }
    // Un même nom ne peut pas enseigner deux matières différentes dans le registre (sauf les maths
    // de Mme Moreau, présentes matin et après-midi).
    for (const c of SCHOOL_CHARACTERS) {
      if (!/^Professeur/.test(c.role)) continue;
      expect(teacherOf.has(c.name), `${c.name} (${c.role}) absent de l’emploi du temps`).toBe(true);
    }
    const moments: ClassMoment[] = [...CLASS_MOMENTS, ...CLASS_MOMENTS_EXT];
    for (const mo of moments) {
      for (const [name] of teacherOf) {
        if (mo.text.includes(name)) expect(mo.subject ?? '', mo.text).toContain(name);
      }
      if (mo.subject) for (const [name] of teacherOf) {
        if (mo.text.includes(name)) expect(mo.subject).toContain(name);
      }
    }
    // « Mme Diallo » est le nom de Yasmine, élève : plus de professeure homonyme.
    expect(subjects.some((s) => s.includes('Diallo'))).toBe(false);
  });
});

describe('guide « Maintenant » et carte de chapitre', () => {
  it('chapitre 1 rempli : la carte dit que le chapitre se conclut en fin de journée', () => {
    const w = createWorld();
    w.flags['ventes'] = 3;
    w.flags['contreStrategiesLancees'] = 1;
    createProject(w);
    w.project!.members.push('noah');
    expect(campaignNextHint(w)).toBe(CHAPTER_CLOSES_TONIGHT);
    expect(getCampaignProgressSummary(w).prompt).toContain('fin de la journée');
  });

  it('étiquette et titre portent le même âge (celui du chapitre)', () => {
    const w = createWorld();
    w.campaign.currentChapter = 2;
    const s = getCampaignProgressSummary(w);
    expect(w.player.age).toBe(12);
    expect(s.chapterLabel).toBe('Chapitre 2 (13 ans)');
    expect(s.title).toBe('L’Appel de la Friche Taret');
    expect(s.prompt).toContain('Âge : 12/13 ans');
  });

  it('une ancienne sauvegarde reçoit les textes corrigés (titre sans âge, tutoiement)', () => {
    const w = createWorld();
    w.campaign.stages[0]!.title = 'Les Goûters de Val-Ferrand (12 ans)';
    w.campaign.stages[0]!.objective = 'Ouvrir le Stand des Roses, constituer une équipe et réaliser vos premières ventes face au distributeur.';
    syncStageTexts(w);
    expect(w.campaign.stages[0]!.title).toBe('Les Goûters de Val-Ferrand');
    expect(w.campaign.stages[0]!.objective).toContain('tes premières ventes');
  });

  it('à 21 h, l’étape de campagne se fait demain', () => {
    const w = createWorld();
    w.time.tick = dayIndexOf(w.time.tick) * TICKS_PER_DAY + 21 * 6;
    const s = nextStep(w)!;
    expect(s.id).toBe('campagne');
    expect(s.text).toContain('demain');
  });

  it('Mme Bertin à 21 h : le guide propose le lendemain, à ses horaires', () => {
    const w = createWorld();
    const day = dayIndexOf(w.time.tick); // mardi 1er septembre 2020
    w.time.tick = day * TICKS_PER_DAY + 21 * 6;
    expect(isSchoolDay(day + 1)).toBe(true);
    expect(bertinWhen(w)).toBe('demain (16 h – 19 h), à l’épicerie');
    w.time.tick = day * TICKS_PER_DAY + 10 * 6; // 10 h : plus tard dans la journée
    expect(bertinWhen(w)).toBe('aujourd’hui dès 16 h, à l’épicerie');
    w.time.tick = (day + 4) * TICKS_PER_DAY + 21 * 6; // samedi soir : dimanche fermé
    expect(bertinWhen(w)).toMatch(/^lundi \(/);
    w.time.tick = day * TICKS_PER_DAY + 16 * 6 + 1;
    expect(bertinWhen(w)).toContain('maintenant');
    // Le guide l'emploie : à 21 h, jamais « aide Mme Bertin (16 h – 19 h) » sans « demain ».
    campagneFinie(w);
    w.player.money = 0;
    w.time.tick = day * TICKS_PER_DAY + 21 * 6;
    const s = nextStep(w)!;
    expect(['boulot', 'argent']).toContain(s.id);
    expect(s.text).toContain('demain (16 h – 19 h)');
  });

  it('« Il te manque » compte ce que tu as déjà, et la caisse du stand est mentionnée', () => {
    const w = createWorld();
    campagneFinie(w);
    w.player.money = 0;
    createProject(w);
    w.project!.balance = 12;
    w.project!.ledger.push({ day: 0, date: '2020-09-01', label: 'Report', amount: 12 });
    const s = nextStep(w)!;
    expect(s.id).toBe('argent');
    expect(s.text).toMatch(/Il te manque \d+ € \(tu as 0 € sur toi\)/);
    expect(s.detail).toContain('caisse du stand');
  });
});

describe('contre-offensive : la caisse du stand paie d’abord, puis la poche', () => {
  const strat = COUNTER_STRATEGIES[0]!;

  it('caisse suffisante : la poche ne bouge pas, le livre reste juste', () => {
    const w = createWorld();
    createProject(w);
    w.project!.balance = 50;
    w.project!.ledger.push({ day: 0, date: '2020-09-01', label: 'Report', amount: 50 });
    w.player.money = 1;
    const r = executeCounterStrategy(w, strat.id);
    expect(r.ok).toBe(true);
    expect(r.message).toContain('caisse du stand');
    expect(w.player.money).toBe(1);
    expect(w.project!.balance).toBe(50 - strat.costMoney);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);
  });

  it('caisse insuffisante : la poche complète ; sans stand, tout vient de la poche', () => {
    const w = createWorld();
    createProject(w);
    w.project!.balance = 2;
    w.project!.ledger.push({ day: 0, date: '2020-09-01', label: 'Report', amount: 2 });
    w.player.money = 20;
    expect(executeCounterStrategy(w, strat.id).ok).toBe(true);
    expect(w.project!.balance).toBe(0);
    expect(w.player.money).toBe(Math.round((20 - (strat.costMoney - 2)) * 100) / 100);
    expect(ledgerInvariantHolds(w.project!)).toBe(true);

    const w2 = createWorld();
    w2.player.money = 20;
    expect(executeCounterStrategy(w2, strat.id).ok).toBe(true);
    expect(w2.player.money).toBe(20 - strat.costMoney);
  });
});

describe('bilan de « Passer le temps » : une seule moyenne', () => {
  it('la moyenne du bilan est celle du panneau Famille', () => {
    const w = createWorld();
    const r = skipTime(w, 'semaine');
    if ('error' in r) throw new Error(r.error);
    const line = r.lines.find((l) => l.startsWith('📝'))!;
    expect(line).toBeDefined();
    expect(line).toContain(`${schoolAverage(w)}/20`);
    expect(schoolAverage(w)).toBe(ensureSchoolLifeState(w).academicAverage);
  });

  it('un saut sans contrôle n’affiche pas les anciennes notes (carnet plein)', () => {
    const w = createWorld();
    const f = ensureFamily(w);
    for (let i = 0; i < 30; i++) f.grades.push({ day: -40 + i, subject: 'Contrôle de la semaine', note: 20 });
    const r = skipTime(w, 'jour'); // mardi → mercredi : pas de note du vendredi
    if ('error' in r) throw new Error(r.error);
    expect(r.lines.some((l) => l.startsWith('📝'))).toBe(false);
  });
});

/**
 * Vie quotidienne de 12 à 16 ans (sprint V1, vague 2) : argent de poche, collège, famille,
 * besoins, habitants et événements de quartier, mesurés sur les quatre ans de la campagne.
 *
 * 1. Le joueur scripté « appliqué » (tests/parcours/joueur-scripte.ts) joue la campagne ; un
 *    observateur répond chaque jour comme le ferait un joueur réel aux fenêtres du jeu (dîner,
 *    événement du collège, convocation, surprise) et mesure.
 * 2. Un joueur qui sèche des cours, simulé tick par tick, puis qui se reprend.
 * 3. Les barèmes (argent de poche, brevet, classes) aux bornes.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type WorldState } from '../src/core/types';
import { dateOf, dayIndexOf, minutesOfDay } from '../src/core/clock';
import { PLACE_ANCHORS } from '../src/data/map';
import { FAMILY_LINE_BY_ID } from '../src/data/family_registry';
import { tickWorld } from '../src/simulation/engine';
import {
  attendClass, brevetMention, bulletinBonus, classWindow, ensureFamily, familyTrust, isInClass, pendingDinner,
  pocketMoneyStatus, POCKET_MONEY_BY_AGE, resolveConvocation, resolveDinner, DINNER_LINE_GAP,
} from '../src/simulation/family';
import { pendingSchoolEvent, resolveSchoolEvent } from '../src/simulation/school_events';
import { classeScolaire, ensureSchoolLifeState } from '../src/simulation/school_life';
import { ensureHappenings, pendingSurprise, resolveSurprise } from '../src/simulation/happenings';
import { rememberedNpcLine, RECALL_GAP_DAYS } from '../src/simulation/npc';
import { talkToResident } from '../src/simulation/residents';
import { RESIDENTS } from '../src/data/residents/residents';
import { jouerCampagne, type ParcoursBilan } from './parcours/joueur-scripte';

const LONG = 300_000;

// ---------- 1. Quatre ans de campagne ----------

interface Mesures {
  bilan: ParcoursBilan;
  /** Âge → argent de poche cumulé à l'anniversaire. */
  pocheParAge: Record<number, number>;
  notes: number[];
  dinners: { day: number; id: string }[];
  convocations: number;
  punitions: number;
  ecoleParAge: Record<number, number>;
  surprises: Map<string, number>;
  news: Map<string, number>;
  souvenirs: Map<string, number[]>;
  confianceFin: number;
  inquietudeMax: number;
  rumeurs: Map<string, number>;
}

let M: Mesures;

beforeAll(() => {
  const m: Omit<Mesures, 'bilan'> = {
    pocheParAge: {}, notes: [], dinners: [], convocations: 0, punitions: 0, ecoleParAge: {},
    surprises: new Map(), news: new Map(), souvenirs: new Map(), confianceFin: 0, inquietudeMax: 0, rumeurs: new Map(),
  };
  let lastAge = 0;
  let lastNews = '';
  let lastGrade = -1;
  let lastGrounded = -1;
  const seenSurprise = new Set<string>();
  const bilan = jouerCampagne({
    seed: 20200901,
    profil: 'applique',
    chaqueJour: (w: WorldState, d: number) => {
      const f = ensureFamily(w);
      // Les fenêtres du jeu, comme un joueur qui y répond (réponses variées).
      const dn = pendingDinner(w);
      if (dn) { m.dinners.push({ day: d, id: dn.id }); resolveDinner(w, d % dn.replies.length); }
      const se = pendingSchoolEvent(w);
      if (se) { m.ecoleParAge[w.player.age] = (m.ecoleParAge[w.player.age] ?? 0) + 1; resolveSchoolEvent(w, d % se.options.length); }
      if (f.convocation) { m.convocations++; resolveConvocation(w, 'verite'); }
      if (pendingSurprise(w)) resolveSurprise(w, 0);
      if (f.groundedUntil > lastGrounded && f.groundedUntil >= d) { m.punitions++; lastGrounded = f.groundedUntil; }
      // Notes, dépêches, surprises.
      for (const g of f.grades) if (g.day > lastGrade) { m.notes.push(g.note); lastGrade = g.day; }
      const h = ensureHappenings(w);
      for (const n of h.news) { if (n.id === lastNews) break; m.news.set(n.templateId, (m.news.get(n.templateId) ?? 0) + 1); }
      lastNews = h.news[0]?.id ?? lastNews;
      for (const s of h.history) {
        const k = `${s.surpriseId}@${s.day}`;
        if (!seenSurprise.has(k)) { seenSurprise.add(k); m.surprises.set(s.surpriseId, (m.surprises.get(s.surpriseId) ?? 0) + 1); }
      }
      // Ce que disent Noah et Yasmine quand on leur parle (le souvenir d'un fait, ou rien).
      for (const [npc, topic] of [['noah', 'projet'], ['yasmine', 'quartier'], ['samir', 'coop'], ['bertin', 'quartier']] as const) {
        const line = rememberedNpcLine(w, npc, topic);
        if (line) { const list = m.souvenirs.get(line) ?? []; list.push(d); m.souvenirs.set(line, list); }
      }
      // Un habitant croisé chaque jour : ses rumeurs.
      const r = RESIDENTS[d % RESIDENTS.length]!;
      const said = talkToResident(w, r.id);
      if (said.rumor) m.rumeurs.set(`${r.id}:${said.rumor}`, (m.rumeurs.get(`${r.id}:${said.rumor}`) ?? 0) + 1);
      m.inquietudeMax = Math.max(m.inquietudeMax, (f.parents.nora.worry + f.parents.thierry.worry) / 2);
      if (w.player.age !== lastAge) { m.pocheParAge[w.player.age] = w.flags['argentDePoche'] ?? 0; lastAge = w.player.age; }
      m.confianceFin = familyTrust(w);
    },
  });
  M = { ...m, bilan };
}, LONG);

/** Événements de rentrée présents dans le journal du monde. */
function rentreesDe(w: WorldState): string[] {
  return w.events.filter((e) => e.title.startsWith('Rentrée en ')).map((e) => e.title);
}

describe('vie quotidienne — quatre ans du joueur appliqué', () => {
  it('la campagne reste saine (aucune exception, aucune spirale)', () => {
    expect(M.bilan.errors).toEqual([]);
    expect(M.bilan.finished).toBe(true);
    expect(M.bilan.minMoney).toBeGreaterThanOrEqual(0);
  });

  it('argent de poche : il suit le barème par âge et reste borné sur quatre ans', () => {
    const cumul = M.pocheParAge[16] ?? 0;
    // Avant la vague 2 : 5 €/semaine sans condition + 5 € de « fierté » = ~2 075 € en 4 ans.
    expect(cumul).toBeGreaterThanOrEqual(900);
    expect(cumul).toBeLessThanOrEqual(1300);
    // Chaque année rapporte au moins autant que la précédente (barème croissant).
    const parAn = [13, 14, 15, 16].map((a) => (M.pocheParAge[a] ?? 0) - (M.pocheParAge[a - 1] ?? 0));
    for (let i = 1; i < parAn.length; i++) expect(parAn[i]!, `année ${i + 1}`).toBeGreaterThanOrEqual(parAn[i - 1]! - 10);
  });

  it('collège : des notes vivantes (ni 20/20 en boucle, ni effondrées), aucune convocation', () => {
    expect(M.notes.length).toBeGreaterThan(150);
    const moyenne = M.notes.reduce((a, b) => a + b, 0) / M.notes.length;
    expect(moyenne).toBeGreaterThan(12);
    expect(moyenne).toBeLessThan(17.5);
    expect(M.notes.filter((n) => n === 20).length / M.notes.length, 'part de 20/20').toBeLessThan(0.05);
    expect(new Set(M.notes).size, 'notes différentes').toBeGreaterThan(8);
    expect(M.convocations).toBe(0);
  });

  it('famille : un joueur sérieux gagne la confiance de ses parents, sans punition', () => {
    expect(M.confianceFin).toBeGreaterThanOrEqual(70);
    expect(M.punitions).toBe(0);
    expect(M.inquietudeMax).toBeLessThan(60);
  });

  it('besoins : aucun ne reste bloqué au plafond', () => {
    for (const [k, v] of Object.entries(M.bilan.maxNeedsStreak)) expect(v, k).toBeLessThan(3);
  });

  it('dîners : une même réplique ne revient pas avant trois semaines, et la fatigue ne monopolise pas la table', () => {
    expect(M.dinners.length).toBeGreaterThan(300);
    const last = new Map<string, number>();
    let tooSoon = 0;
    for (const { day, id } of M.dinners) {
      const prev = last.get(id);
      if (prev !== undefined && day - prev < DINNER_LINE_GAP) tooSoon++;
      last.set(id, day);
    }
    // Quelques sujets ont peu de répliques (convocation, nuit blanche) : tolérance minime.
    expect(tooSoon / M.dinners.length).toBeLessThan(0.05);
    const fatigue = M.dinners.filter((x) => FAMILY_LINE_BY_ID[x.id]?.when === 'fatigue').length;
    expect(fatigue / M.dinners.length, 'part des dîners sur la fatigue').toBeLessThan(0.15);
    expect(new Set(M.dinners.map((x) => x.id)).size).toBeGreaterThanOrEqual(20);
  });

  it('collège : des événements chaque année, étalés (pas tout le premier trimestre)', () => {
    for (const age of [12, 13, 14, 15]) expect(M.ecoleParAge[age] ?? 0, `${age} ans`).toBeGreaterThanOrEqual(3);
  });

  it('quartier : des surprises variées sur quatre ans, et un journal qui ne radote pas', () => {
    const total = [...M.surprises.values()].reduce((a, b) => a + b, 0);
    expect(total, 'surprises en 4 ans').toBeGreaterThanOrEqual(40);
    expect(total).toBeLessThanOrEqual(160);
    expect(M.surprises.size, 'surprises différentes').toBeGreaterThanOrEqual(15);
    // Une même dépêche : au plus ~5 fois par an.
    expect(Math.max(...M.news.values())).toBeLessThanOrEqual(20);
  });

  it('PNJ : un souvenir se raconte, puis ne revient pas avant un mois', () => {
    for (const [line, days] of M.souvenirs) {
      for (let i = 1; i < days.length; i++) expect(days[i]! - days[i - 1]!, line).toBeGreaterThanOrEqual(RECALL_GAP_DAYS);
    }
  });

  it('habitants : une même rumeur ne se répète pas en boucle', () => {
    // 36 habitants × 2 rumeurs, un habitant par jour : chacun est croisé ~40 fois en 4 ans.
    expect(Math.max(...M.rumeurs.values())).toBeLessThanOrEqual(15);
  });
});

// ---------- 2. Rentrées et classes ----------

describe('années scolaires', () => {
  it('5e à 12 ans, puis 4e, 3e, 2de (lycée) et 1re à chaque 1er septembre', () => {
    expect([12, 13, 14, 15, 16].map(classeScolaire)).toEqual(['5e', '4e', '3e', '2de', '1re']);
    const w = createWorld();
    w.flags['classeAge'] = 12;
    // On saute au 31 août de chaque année, puis la journée du 1er septembre.
    const titles: string[] = [];
    for (const year of [2021, 2022, 2023, 2024]) {
      let d = dayIndexOf(w.time.tick);
      while (dateOf(d).iso !== `${year}-08-31`) d++;
      w.time.tick = d * TICKS_PER_DAY + 23 * 6;
      for (let i = 0; i < 12; i++) tickWorld(w);
      titles.push(...rentreesDe(w).filter((t) => !titles.includes(t)));
    }
    expect(titles).toEqual(['Rentrée en 4e', 'Rentrée en 3e', 'Rentrée en 2de', 'Rentrée en 1re']);
    const brevet = w.events.find((e) => e.title === 'Rentrée en 2de');
    expect(brevet?.text).toMatch(/Brevet des collèges/);
    expect(brevet?.text).toMatch(/lycée/);
  }, LONG);
});

// ---------- 3. Un joueur qui sèche, puis se reprend ----------

/**
 * Simule `days` jours : le joueur reste près de la maison, va en cours sauf les demi-journées
 * que `skip` désigne, répond aux dîners et à la convocation (`convoc`).
 */
function vivre(w: WorldState, days: number, skip: (day: number, session: string) => boolean,
  convoc: 'verite' | 'promesse' | 'mensonge', log: { convocations: number; groundedDays: number; pocket: number[] }): void {
  const home = PLACE_ANCHORS.maison;
  const end = dayIndexOf(w.time.tick) + days;
  let lastDay = dayIndexOf(w.time.tick);
  while (dayIndexOf(w.time.tick) < end) {
    w.player.pos = { x: home.x, y: home.y };
    const s = classWindow(w);
    if (s && !isInClass(w) && !skip(dayIndexOf(w.time.tick), s)) attendClass(w);
    const m = minutesOfDay(w.time.tick);
    if (m === 12 * 60 || m === 19 * 60) w.player.needs.faim = Math.max(0, w.player.needs.faim - 55);
    const before = w.player.money;
    const out = tickWorld(w).notifications;
    if (out.some((n) => n.text.startsWith('Argent de poche'))) log.pocket.push(Math.round((w.player.money - before) * 100) / 100);
    const f = ensureFamily(w);
    if (pendingDinner(w)) resolveDinner(w, 0);
    if (f.convocation && m >= 17 * 60) { log.convocations++; resolveConvocation(w, convoc); }
    const d = dayIndexOf(w.time.tick);
    if (d !== lastDay) { if (f.groundedUntil >= d) log.groundedDays++; lastDay = d; }
  }
}

describe('vie quotidienne — un joueur qui sèche les cours', () => {
  it('il est convoqué, son argent de poche baisse ; une fois repris, tout rentre dans l’ordre', () => {
    const w = createWorld({ seed: 7 });
    const log = { convocations: 0, groundedDays: 0, pocket: [] as number[] };
    // Six semaines à sécher le lundi et le jeudi après-midi, avec des promesses non tenues.
    const secheur = (day: number, s: string): boolean => {
      const wd = dateOf(day).weekday;
      return (wd === 1 && s === 'matin') || (wd === 4 && s === 'apres');
    };
    vivre(w, 42, secheur, 'promesse', log);
    const f = ensureFamily(w);
    expect(log.convocations, 'convocations pendant les semaines séchées').toBeGreaterThanOrEqual(2);
    expect(f.absences.filter((a) => !a.excused).length).toBeGreaterThanOrEqual(10);
    expect(log.pocket.some((p) => p < POCKET_MONEY_BY_AGE[12]!), 'argent de poche réduit ou suspendu').toBe(true);
    const trustLow = familyTrust(w);
    expect(trustLow, 'promesses rompues : la confiance baisse').toBeLessThan(55);
    expect(ensureSchoolLifeState(w).academicAverage).toBeLessThan(14.5);

    // Il se reprend : huit semaines sans une absence.
    const log2 = { convocations: 0, groundedDays: 0, pocket: [] as number[] };
    vivre(w, 56, () => false, 'verite', log2);
    expect(log2.convocations).toBe(0);
    expect(familyTrust(w), 'la confiance remonte').toBeGreaterThan(trustLow + 5);
    expect(log2.groundedDays, 'pas de punition sans fin').toBeLessThanOrEqual(7);
    expect(log2.pocket.slice(-3).every((p) => p === POCKET_MONEY_BY_AGE[12]), 'argent de poche rétabli').toBe(true);
    expect((f.parents.nora.worry + f.parents.thierry.worry) / 2).toBeLessThan(50);
  }, LONG);

  it('la vérité, avec une bonne moyenne, ouvre la convention jeune entrepreneur', () => {
    const w = createWorld({ seed: 3 });
    const log = { convocations: 0, groundedDays: 0, pocket: [] as number[] };
    // Trois semaines sérieuses, puis une journée séchée : convocation, et la vérité.
    vivre(w, 20, () => false, 'verite', log);
    expect(ensureSchoolLifeState(w).academicAverage).toBeGreaterThanOrEqual(12);
    const lundi = (day: number): boolean => dateOf(day).weekday === 1;
    let d = dayIndexOf(w.time.tick);
    while (!lundi(d)) d++;
    vivre(w, d - dayIndexOf(w.time.tick) + 1, (day) => lundi(day), 'verite', log);
    expect(log.convocations).toBe(1);
    expect(ensureFamily(w).arrangement?.perWeek).toBe(2);
  }, LONG);
});

// ---------- 4. Barèmes aux bornes ----------

describe('barèmes de la vie quotidienne', () => {
  it('argent de poche : plein, moitié après une absence, rien pendant une punition ou sans confiance', () => {
    const w = createWorld();
    expect(pocketMoneyStatus(w).amount).toBe(5);
    const f = ensureFamily(w);
    const day = dayIndexOf(w.time.tick);
    f.absences.push({ day, session: 'matin', excused: false });
    expect(pocketMoneyStatus(w).amount).toBe(2);
    f.absences = [];
    f.groundedUntil = day + 2;
    expect(pocketMoneyStatus(w).amount).toBe(0);
    f.groundedUntil = -1;
    f.parents.nora.trust = 20;
    f.parents.thierry.trust = 20;
    expect(pocketMoneyStatus(w).amount).toBe(0);
    f.parents.nora.trust = 45;
    f.parents.thierry.trust = 45;
    expect(pocketMoneyStatus(w).amount).toBe(2);
    w.player.age = 15;
    f.parents.nora.trust = 70;
    f.parents.thierry.trust = 70;
    expect(pocketMoneyStatus(w).amount).toBe(7);
  });

  it('barème croissant de 5 à 8 € par semaine ; total plein sur 4 ans ≤ 1 200 €', () => {
    const ages = [12, 13, 14, 15, 16];
    for (let i = 1; i < ages.length; i++) expect(POCKET_MONEY_BY_AGE[ages[i]!]!).toBeGreaterThanOrEqual(POCKET_MONEY_BY_AGE[ages[i - 1]!]!);
    const plein = [12, 13, 14, 15].reduce((s, a) => s + 52 * POCKET_MONEY_BY_AGE[a]!, 0);
    expect(plein).toBeLessThanOrEqual(1200);
  });

  it('brevet et prime de bulletin', () => {
    expect(brevetMention(17).label).toMatch(/très bien/);
    expect(brevetMention(8).label).toMatch(/rattrapage/);
    expect(bulletinBonus(16)).toBe(30);
    expect(bulletinBonus(14)).toBe(20);
    expect(bulletinBonus(13.9)).toBe(0);
  });
});

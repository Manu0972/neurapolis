/**
 * NEURAPOLIS — Workflow AG-2 (« Monde profond et pédagogie »)
 * Suite de tests de validation d'acceptation complète :
 * 1. Neutralité de genre dans le récit adressé au joueur (family.ts, lucien.ts, school/events.ts)
 * 2. Unicité et convention snake_case des identifiants sans accents
 * 3. Références croisées (penseurs, 32 concepts, rues de CITY.roads, objets de ROOM_ITEMS, contacts de CONTACT_BY_ID)
 * 4. Événements scolaires (2-3 options, conseils de fantômes, effets) et 30 moments de classe
 * 5. Extension Ascension (12 concepts, 3 duels, 15 idées de business, 96 questions de quiz pour 32 concepts)
 */
import { describe, expect, it } from 'vitest';

// 1. Données d'extension AG-2
import { EXTRA_CONCEPTS } from '../src/data/ascension_ext/concepts';
import { EXTRA_DUELS, POLANYI_THINKER } from '../src/data/ascension_ext/duels';
import { EXTRA_IDEAS } from '../src/data/ascension_ext/ideas';
import { QUIZZES } from '../src/data/ascension_ext/quiz';
import { SECRETS } from '../src/data/secrets/secrets';
import { SCHOOL_EVENTS, CLASS_MOMENTS_EXT } from '../src/data/school/events';

// 2. Données de base et de référence
import { ECON_CONCEPTS as ALL_CONCEPTS } from '../src/data/ascension/concepts';
import { DUELS as ALL_DUELS } from '../src/data/ascension/duels';
import { IDEAS as ALL_IDEAS } from '../src/data/ascension/ideas';
import { CONTACT_BY_ID } from '../src/data/ascension/contacts';
import { GHOST_DEFS } from '../src/data/ghosts/registry';
import { CITY } from '../src/data/city/layout';
import { ROOM_ITEMS } from '../src/data/room/items';
import { FAMILY_LINES, SCHOOL_CHARACTERS } from '../src/data/story/family';
import { ORIGIN_SCENE, LUCIEN_BEATS } from '../src/data/story/lucien';

// Depuis le branchement (Claude Code, 2026-10-07), les registres contiennent aussi le contenu AG-2 :
// « de base » = registre moins les ajouts d'Antigravity.
const ECON_CONCEPTS = ALL_CONCEPTS.filter((c) => !EXTRA_CONCEPTS.some((x) => x.id === c.id));
const DUELS = ALL_DUELS.filter((d) => !EXTRA_DUELS.some((x) => x.id === d.id));
const IDEAS = ALL_IDEAS.filter((i) => !EXTRA_IDEAS.some((x) => x.id === i.id));

const SNAKE_CASE_REGEX = /^[a-z0-9]+(_[a-z0-9]+)*$/;

// Vocatifs et termes genrés strictement interdits lorsqu'adressés au joueur
const FORBIDDEN_GENDERED_PLAYER_WORDS = /\b(garçon|garçons|fiston|fistons|petit-fils|mon grand|ma grande|faire ton grand)\b/i;

describe('AG-2 Phase 1 — Neutralité de genre du récit adressé au joueur', () => {
  it('ne contient aucun terme genré proscrit dans FAMILY_LINES (textes et répliques)', () => {
    expect(FAMILY_LINES.length).toBeGreaterThanOrEqual(60);
    for (const line of FAMILY_LINES) {
      expect(line.text, `Terme genré interdit dans texte ligne ${line.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(line.replies.length).toBeGreaterThanOrEqual(2);
      for (const reply of line.replies) {
        expect(reply.label, `Terme genré interdit dans label réplique ${line.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
        expect(reply.answer, `Terme genré interdit dans answer réplique ${line.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      }
    }
  });

  it('ne contient aucun terme genré proscrit dans la scène d’origine et les carnets de Lucien', () => {
    // Scène d'origine
    expect(ORIGIN_SCENE.title).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    for (const page of ORIGIN_SCENE.pages) {
      expect(page, 'Terme genré interdit dans page ORIGIN_SCENE').not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    }
    if (ORIGIN_SCENE.note) {
      expect(ORIGIN_SCENE.note, 'Terme genré interdit dans note ORIGIN_SCENE').not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      // Confirme l'emploi du vocatif neutre « petit-enfant »
      expect(ORIGIN_SCENE.note).toContain('petit-enfant');
    }

    // Carnets de Lucien (Story beats)
    expect(LUCIEN_BEATS.length).toBeGreaterThanOrEqual(14);
    for (const beat of LUCIEN_BEATS) {
      expect(beat.title, `Terme genré interdit dans titre ${beat.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      for (const page of beat.pages) {
        expect(page, `Terme genré interdit dans page ${beat.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      }
      if (beat.note) {
        expect(beat.note, `Terme genré interdit dans note ${beat.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      }
    }
  });

  it('ne contient aucun terme genré proscrit dans les événements du collège (school/events.ts)', () => {
    expect(SCHOOL_EVENTS.length).toBeGreaterThanOrEqual(25);
    for (const event of SCHOOL_EVENTS) {
      expect(event.title, `Terme genré interdit dans titre événement ${event.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(event.text, `Terme genré interdit dans texte événement ${event.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      for (const opt of event.options) {
        expect(opt.label, `Terme genré interdit dans label option de ${event.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
        expect(opt.advice, `Terme genré interdit dans advice option de ${event.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
        expect(opt.outcome, `Terme genré interdit dans outcome option de ${event.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      }
    }

    for (const moment of CLASS_MOMENTS_EXT) {
      expect(moment.text, 'Terme genré interdit dans moment de classe').not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    }
  });
});

describe('AG-2 Identifiants — Format snake_case strict et unicité', () => {
  it('tous les identifiants de SECRETS sont uniques et en snake_case sans accents', () => {
    expect(SECRETS).toHaveLength(16);
    const seen = new Set<string>();
    for (const s of SECRETS) {
      expect(s.id).toMatch(SNAKE_CASE_REGEX);
      expect(seen.has(s.id), `ID secret en doublon : ${s.id}`).toBe(false);
      seen.add(s.id);
    }
  });

  it('tous les identifiants de SCHOOL_EVENTS sont uniques et en snake_case sans accents', () => {
    expect(SCHOOL_EVENTS.length).toBeGreaterThanOrEqual(25);
    const seen = new Set<string>();
    for (const e of SCHOOL_EVENTS) {
      expect(e.id).toMatch(SNAKE_CASE_REGEX);
      expect(seen.has(e.id), `ID événement école en doublon : ${e.id}`).toBe(false);
      seen.add(e.id);
    }
  });

  it('tous les identifiants de EXTRA_CONCEPTS sont uniques, en snake_case et disjoints des concepts de base', () => {
    expect(EXTRA_CONCEPTS).toHaveLength(12);
    const baseIds = new Set(ECON_CONCEPTS.map((c) => c.id));
    const seen = new Set<string>();
    for (const c of EXTRA_CONCEPTS) {
      expect(c.id).toMatch(SNAKE_CASE_REGEX);
      expect(seen.has(c.id), `ID concept supplémentaire en doublon : ${c.id}`).toBe(false);
      expect(baseIds.has(c.id), `ID concept supplémentaire chevauche la base : ${c.id}`).toBe(false);
      seen.add(c.id);
    }
  });

  it('tous les identifiants de EXTRA_DUELS sont uniques, en snake_case et disjoints des duels de base', () => {
    expect(EXTRA_DUELS).toHaveLength(3);
    const baseIds = new Set(DUELS.map((d) => d.id));
    const seen = new Set<string>();
    for (const d of EXTRA_DUELS) {
      expect(d.id).toMatch(SNAKE_CASE_REGEX);
      expect(seen.has(d.id), `ID duel supplémentaire en doublon : ${d.id}`).toBe(false);
      expect(baseIds.has(d.id), `ID duel supplémentaire chevauche la base : ${d.id}`).toBe(false);
      seen.add(d.id);
    }
  });

  it('tous les identifiants de EXTRA_IDEAS sont uniques, en snake_case et disjoints des idées de base', () => {
    expect(EXTRA_IDEAS).toHaveLength(15);
    const baseIds = new Set(IDEAS.map((i) => i.id));
    const seen = new Set<string>();
    for (const idea of EXTRA_IDEAS) {
      expect(idea.id).toMatch(SNAKE_CASE_REGEX);
      expect(seen.has(idea.id), `ID idée supplémentaire en doublon : ${idea.id}`).toBe(false);
      expect(baseIds.has(idea.id), `ID idée supplémentaire chevauche la base : ${idea.id}`).toBe(false);
      seen.add(idea.id);
    }
  });

  it('tous les conceptIds de QUIZZES sont uniques, en snake_case et sans accents', () => {
    expect(QUIZZES).toHaveLength(32);
    const seen = new Set<string>();
    for (const q of QUIZZES) {
      expect(q.conceptId).toMatch(SNAKE_CASE_REGEX);
      expect(seen.has(q.conceptId), `conceptId quiz en doublon : ${q.conceptId}`).toBe(false);
      seen.add(q.conceptId);
    }
  });

  it('tous les identifiants de FAMILY_LINES et SCHOOL_CHARACTERS sont uniques et en snake_case', () => {
    const seenLines = new Set<string>();
    for (const l of FAMILY_LINES) {
      expect(l.id).toMatch(SNAKE_CASE_REGEX);
      expect(seenLines.has(l.id), `ID ligne famille en doublon : ${l.id}`).toBe(false);
      seenLines.add(l.id);
    }

    const seenChars = new Set<string>();
    for (const c of SCHOOL_CHARACTERS) {
      expect(c.id).toMatch(SNAKE_CASE_REGEX);
      expect(seenChars.has(c.id), `ID personnage collège en doublon : ${c.id}`).toBe(false);
      seenChars.add(c.id);
    }
  });

  it('tous les identifiants de LUCIEN_BEATS et ORIGIN_SCENE sont uniques et en snake_case', () => {
    expect(ORIGIN_SCENE.id).toMatch(SNAKE_CASE_REGEX);
    const seen = new Set<string>([ORIGIN_SCENE.id]);
    for (const b of LUCIEN_BEATS) {
      expect(b.id).toMatch(SNAKE_CASE_REGEX);
      expect(seen.has(b.id), `ID carnet Lucien en doublon : ${b.id}`).toBe(false);
      seen.add(b.id);
    }
  });
});

describe('AG-2 Références croisées — Penseurs, Concepts, Rues, Objets, Contacts', () => {
  const CANONICAL_GHOST_IDS = new Set(GHOST_DEFS.map((g) => g.id));
  const RECOGNIZED_THINKERS = new Set([
    ...CANONICAL_GHOST_IDS,
    'schumpeter',
    'ford',
    'polanyi',
    'walras',
  ]);

  const BASE_CONCEPTS_SET = new Set(ECON_CONCEPTS.map((c) => c.id));
  const EXTRA_CONCEPTS_SET = new Set(EXTRA_CONCEPTS.map((c) => c.id));
  const ALL_32_CONCEPTS = new Set([...BASE_CONCEPTS_SET, ...EXTRA_CONCEPTS_SET]);

  const VALID_ROADS = new Set(CITY.roads.map((r) => r.name));
  const VALID_PLACES = new Set(['maison', 'college', 'epicerie', 'friche', 'parc', 'place']);
  const VALID_ROOM_ITEMS = new Set(ROOM_ITEMS.map((item) => item.id));
  const ALL_DUEL_IDS = new Set([...DUELS.map((d) => d.id), ...EXTRA_DUELS.map((d) => d.id)]);

  it('les penseurs référencés existent dans le registre des fantômes ou les penseurs reconnus', () => {
    // Duels supplémentaires
    for (const duel of EXTRA_DUELS) {
      expect(RECOGNIZED_THINKERS.has(duel.a.thinker), `Penseur inconnu dans face A de ${duel.id}: ${duel.a.thinker}`).toBe(true);
      expect(RECOGNIZED_THINKERS.has(duel.b.thinker), `Penseur inconnu dans face B de ${duel.id}: ${duel.b.thinker}`).toBe(true);
    }

    // Fiche dédiée Polanyi
    expect(POLANYI_THINKER.id).toBe('polanyi');
    expect(RECOGNIZED_THINKERS.has(POLANYI_THINKER.id)).toBe(true);

    // Événements scolaires
    for (const ev of SCHOOL_EVENTS) {
      for (const opt of ev.options) {
        expect(RECOGNIZED_THINKERS.has(opt.ghost), `Fantôme conseiller inconnu dans option de ${ev.id}: ${opt.ghost}`).toBe(true);
      }
    }

    // Scène d'origine et carnets de Lucien
    if (ORIGIN_SCENE.ghost) {
      expect(RECOGNIZED_THINKERS.has(ORIGIN_SCENE.ghost)).toBe(true);
    }
    for (const beat of LUCIEN_BEATS) {
      if (beat.ghost) {
        expect(RECOGNIZED_THINKERS.has(beat.ghost), `Fantôme inconnu dans carnet ${beat.id}: ${beat.ghost}`).toBe(true);
      }
    }
  });

  it('l’univers compte exactement 32 concepts économiques (20 de base + 12 supplémentaires)', () => {
    expect(ECON_CONCEPTS).toHaveLength(20);
    expect(ALL_CONCEPTS).toHaveLength(32);
    expect(EXTRA_CONCEPTS).toHaveLength(12);
    expect(ALL_32_CONCEPTS.size).toBe(32);
  });

  it('tous les concepts référencés dans les duels, les secrets et les quiz existent dans les 32 concepts', () => {
    // Duels supplémentaires
    for (const duel of EXTRA_DUELS) {
      expect(ALL_32_CONCEPTS.has(duel.a.concept), `Concept inconnu dans face A de ${duel.id}: ${duel.a.concept}`).toBe(true);
      expect(ALL_32_CONCEPTS.has(duel.b.concept), `Concept inconnu dans face B de ${duel.id}: ${duel.b.concept}`).toBe(true);
    }

    // Secrets récompensant un concept
    const conceptSecrets = SECRETS.filter((s) => s.reward.kind === 'concept');
    expect(conceptSecrets.length).toBe(5);
    for (const s of conceptSecrets) {
      expect(ALL_32_CONCEPTS.has(s.reward.value as string), `Concept inconnu récompensé dans ${s.id}: ${s.reward.value}`).toBe(true);
    }

    // Quiz
    for (const q of QUIZZES) {
      expect(ALL_32_CONCEPTS.has(q.conceptId), `Concept inconnu dans quiz: ${q.conceptId}`).toBe(true);
    }
  });

  it('toutes les rues des secrets correspondent exactement aux axes de CITY.roads', () => {
    const secretsWithStreet = SECRETS.filter((s) => Boolean(s.where.street));
    expect(secretsWithStreet.length).toBe(11);

    for (const s of SECRETS) {
      if (s.where.street) {
        expect(VALID_ROADS.has(s.where.street), `Rue inconnue dans secret ${s.id}: ${s.where.street}`).toBe(true);
      }
      if (s.where.place) {
        expect(VALID_PLACES.has(s.where.place), `Lieu d’ancrage inconnu dans secret ${s.id}: ${s.where.place}`).toBe(true);
      }
    }

    // Vérifie que les axes verticaux et horizontaux sont tous deux représentés
    const streetsUsed = new Set(secretsWithStreet.map((s) => s.where.street));
    const verticalRoadNames = CITY.roads.filter((r) => r.axis === 'v').map((r) => r.name);
    const horizontalRoadNames = CITY.roads.filter((r) => r.axis === 'h').map((r) => r.name);
    expect(verticalRoadNames.some((r) => streetsUsed.has(r))).toBe(true);
    expect(horizontalRoadNames.some((r) => streetsUsed.has(r))).toBe(true);
  });

  it('tous les objets récompensés par les secrets existent dans ROOM_ITEMS', () => {
    const itemSecrets = SECRETS.filter((s) => s.reward.kind === 'objet');
    expect(itemSecrets.length).toBe(9);

    for (const s of itemSecrets) {
      const itemId = String(s.reward.value);
      expect(VALID_ROOM_ITEMS.has(itemId), `Objet de chambre inconnu dans secret ${s.id}: ${itemId}`).toBe(true);
    }
  });

  it('toutes les connexions (contacts) des idées et des secrets existent dans CONTACT_BY_ID', () => {
    // Idées étendues
    for (const idea of EXTRA_IDEAS) {
      for (const contactId of [...(idea.eases ?? []), ...(idea.needs ?? [])]) {
        expect(CONTACT_BY_ID[contactId], `Contact inconnu dans idée ${idea.id}: ${contactId}`).toBeDefined();
      }
    }

    // Secrets avec prérequis de contact
    for (const s of SECRETS) {
      if (s.requires?.contact) {
        expect(CONTACT_BY_ID[s.requires.contact], `Contact prérequis inconnu dans secret ${s.id}: ${s.requires.contact}`).toBeDefined();
      }
    }
  });

  it('toutes les idées étendues référencent des duels existants', () => {
    for (const idea of EXTRA_IDEAS) {
      expect(ALL_DUEL_IDS.has(idea.duel), `Duel inconnu dans idée ${idea.id}: ${idea.duel}`).toBe(true);
    }
  });
});

describe('AG-2 Phase 5 — Événements scolaires et moments de classe', () => {
  it('contient au moins 25 événements scolaires (exactement 28) avec 2 ou 3 options chacun', () => {
    expect(SCHOOL_EVENTS.length).toBeGreaterThanOrEqual(25);
    expect(SCHOOL_EVENTS).toHaveLength(28);

    for (const ev of SCHOOL_EVENTS) {
      expect([2, 3], `L'événement ${ev.id} doit avoir 2 ou 3 options, en a ${ev.options.length}`).toContain(ev.options.length);
      expect(ev.title.trim().length).toBeGreaterThan(0);
      expect(ev.text.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(ev.characters)).toBe(true);
    }
  });

  it('chaque option d’événement possède un conseil de fantôme, un résultat et des effets chiffrés valides', () => {
    for (const ev of SCHOOL_EVENTS) {
      for (const opt of ev.options) {
        expect(opt.label.trim().length).toBeGreaterThan(0);
        expect(opt.ghost.trim().length).toBeGreaterThan(0);
        expect(opt.advice.trim().length).toBeGreaterThan(0);
        expect(opt.outcome.trim().length).toBeGreaterThan(0);
        expect(opt.effects).toBeDefined();

        if (opt.effects.average !== undefined) {
          expect(typeof opt.effects.average).toBe('number');
          expect(Number.isFinite(opt.effects.average)).toBe(true);
        }
        if (opt.effects.stress !== undefined) {
          expect(typeof opt.effects.stress).toBe('number');
          expect(Number.isFinite(opt.effects.stress)).toBe(true);
        }
        if (opt.effects.moral !== undefined) {
          expect(typeof opt.effects.moral).toBe('number');
          expect(Number.isFinite(opt.effects.moral)).toBe(true);
        }
        if (opt.effects.reputation !== undefined) {
          expect(typeof opt.effects.reputation).toBe('number');
          expect(Number.isFinite(opt.effects.reputation)).toBe(true);
        }
        if (opt.effects.pride !== undefined) {
          expect(typeof opt.effects.pride).toBe('number');
          expect(Number.isFinite(opt.effects.pride)).toBe(true);
        }
        if (opt.effects.relations !== undefined) {
          for (const [relKey, relVal] of Object.entries(opt.effects.relations)) {
            expect(typeof relKey).toBe('string');
            expect(typeof relVal).toBe('number');
            expect(Number.isFinite(relVal)).toBe(true);
          }
        }
      }
    }
  });

  it('CLASS_MOMENTS_EXT contient exactement 30 moments de classe immersifs et valides', () => {
    expect(CLASS_MOMENTS_EXT).toHaveLength(30);
    for (let i = 0; i < CLASS_MOMENTS_EXT.length; i++) {
      const m = CLASS_MOMENTS_EXT[i]!;
      expect(m.text.trim().length, `Texte vide au moment d’indice ${i}`).toBeGreaterThan(0);
      expect(typeof m.comprehension).toBe('number');
      expect(Number.isFinite(m.comprehension)).toBe(true);
      expect(typeof m.mood).toBe('number');
      expect(Number.isFinite(m.mood)).toBe(true);
    }
  });
});

describe('AG-2 Phases 2, 3 & 6 — Ascension étendue (Concepts, Duels, Idées, Quiz)', () => {
  it('contient 12 concepts supplémentaires complets avec penseurs emblématiques', () => {
    expect(EXTRA_CONCEPTS).toHaveLength(12);

    for (const c of EXTRA_CONCEPTS) {
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect(c.thinker.trim().length).toBeGreaterThan(0);
      expect(c.summary.trim().length).toBeGreaterThan(0);
      expect(c.example.trim().length).toBeGreaterThan(0);
    }

    const byId = Object.fromEntries(EXTRA_CONCEPTS.map((c) => [c.id, c]));
    expect(byId['monopole']?.thinker).toBe('Adam Smith');
    expect(byId['oligopole']?.thinker).toBe('Antoine-Augustin Cournot');
    expect(byId['concurrence_deloyale']?.thinker).toBe('Karl Polanyi');
    expect(byId['capture_reglementaire']?.thinker).toBe('George Stigler');
    expect(byId['conglomerat_chaebol']?.thinker).toBe('Max Weber');
    expect(byId['alea_moral']?.thinker).toBe('Kenneth Arrow');
    expect(byId['asymetrie_information']?.thinker).toBe('George Akerlof');
    expect(byId['externalite']?.thinker).toBe('Arthur Cecil Pigou');
    expect(byId['bien_public']?.thinker).toBe('Paul Samuelson');
    expect(byId['rente']?.thinker).toBe('David Ricardo');
    expect(byId['effet_eviction']?.thinker).toBe('Friedrich Hayek');
    expect(byId['dumping']?.thinker).toBe('Joan Robinson');
  });

  it('contient 3 duels supplémentaires équilibrés et la fiche complète de Polanyi', () => {
    expect(EXTRA_DUELS).toHaveLength(3);

    for (const d of EXTRA_DUELS) {
      expect(d.title.trim().length).toBeGreaterThan(0);
      expect(d.question.trim().length).toBeGreaterThan(0);
      expect(d.ownWay.trim().length).toBeGreaterThan(0);
      expect(d.a.thinker.trim().length).toBeGreaterThan(0);
      expect(d.a.concept.trim().length).toBeGreaterThan(0);
      expect(d.b.thinker.trim().length).toBeGreaterThan(0);
      expect(d.b.concept.trim().length).toBeGreaterThan(0);
      expect(Object.keys(d.A).length).toBeGreaterThan(0);
      expect(Object.keys(d.B).length).toBeGreaterThan(0);
    }

    expect(POLANYI_THINKER.id).toBe('polanyi');
    expect(POLANYI_THINKER.name).toBe('Karl Polanyi');
    expect(POLANYI_THINKER.emoji).toBe('⚓');
    expect(POLANYI_THINKER.color).toBe('#2b6cb0');
    expect(POLANYI_THINKER.summary.trim().length).toBeGreaterThan(0);
  });

  it('contient 15 idées supplémentaires réparties sur les paliers 4, 5 et 6', () => {
    expect(EXTRA_IDEAS).toHaveLength(15);
    expect(EXTRA_IDEAS.filter((i) => i.tier === 4)).toHaveLength(5);
    expect(EXTRA_IDEAS.filter((i) => i.tier === 5)).toHaveLength(5);
    expect(EXTRA_IDEAS.filter((i) => i.tier === 6)).toHaveLength(5);

    for (const idea of EXTRA_IDEAS) {
      expect(idea.name.trim().length).toBeGreaterThan(0);
      expect(idea.pitch.trim().length).toBeGreaterThan(0);
      expect(idea.icon.trim().length).toBeGreaterThan(0);
      expect(idea.market).toBeGreaterThan(0);
      expect(idea.margin).toBeGreaterThan(0);
      expect(idea.margin).toBeLessThanOrEqual(1);
      expect(idea.baseShare).toBeGreaterThan(0);
      expect(idea.baseShare).toBeLessThanOrEqual(1);
      expect(idea.startCost).toBeGreaterThan(0);
    }
  });

  it('couvre tous les 32 concepts économiques avec exactement 32 quiz dans QUIZZES', () => {
    expect(QUIZZES).toHaveLength(32);
    const all32Ids = new Set([...ECON_CONCEPTS.map((c) => c.id), ...EXTRA_CONCEPTS.map((c) => c.id)]);
    const quizConceptIds = new Set(QUIZZES.map((q) => q.conceptId));
    expect(quizConceptIds).toEqual(all32Ids);
  });

  it('contient exactement 96 questions de quiz, chacune avec 4 choix distincts, réponse 0..3 et explication', () => {
    let totalQuestions = 0;

    for (const quiz of QUIZZES) {
      expect(quiz.questions, `Le quiz ${quiz.conceptId} doit compter 3 questions`).toHaveLength(3);
      for (const item of quiz.questions) {
        totalQuestions++;
        expect(item.q.trim().length, `Énoncé vide dans quiz ${quiz.conceptId}`).toBeGreaterThan(0);
        expect(item.choices, `Doit avoir 4 choix dans quiz ${quiz.conceptId}`).toHaveLength(4);

        for (let i = 0; i < 4; i++) {
          expect(item.choices[i]!.trim().length, `Choix ${i} vide dans question "${item.q}"`).toBeGreaterThan(0);
        }

        const distinctChoices = new Set(item.choices);
        expect(distinctChoices.size, `Les 4 choix doivent être distincts dans "${item.q}"`).toBe(4);

        expect([0, 1, 2, 3], `Index de réponse invalide (${item.answer}) dans "${item.q}"`).toContain(item.answer);
        expect(item.explanation.trim().length, `Explication vide dans "${item.q}"`).toBeGreaterThan(0);
      }
    }

    expect(totalQuestions).toBe(96);
  });
});

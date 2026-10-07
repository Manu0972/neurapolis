/**
 * NEURAPOLIS — Workflow AG-3 (« Quartiers vivants & rivalités »)
 * Suite de tests de validation d'acceptation complète :
 * 1. Habitants des 9 quartiers (36 habitants, 4 par quartier, rues valides de CITY.roads, heures, répliques, rumeurs, clés étrangères)
 * 2. Événements des quartiers (45 événements, 5 par quartier, minTier [2, 6], multiplicateurs [0.6, 1.5], jours [2, 30], fantômes canoniques)
 * 3. Mécaniques multijoueur (14 mécaniques complètes, bilatéralité {autre}, duels de fantômes, leçons, 16 moments)
 * 4. Concepts & Quiz de théorie des jeux (7 concepts sans collision, 21 questions de quiz à 4 choix distincts)
 * 5. Lore et bible des quartiers (docs/lore/QUARTIERS.md, 9 quartiers, 9 phrases de lock verbatim)
 * 6. Neutralité de genre globale (aucun terme proscrit adressé au joueur)
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// 1. Données du Workflow AG-3
import { RESIDENTS, type ResidentDistrict } from '../src/data/residents/residents';
import { DISTRICT_HAPPENINGS } from '../src/data/districts_ext/happenings';
import { MULTI_FLAVOR, MULTI_MOMENTS, type MultiMechanicId } from '../src/data/multi/flavor';
import { MULTI_CONCEPTS } from '../src/data/ascension_ext/concepts_multi';
import { MULTI_QUIZZES } from '../src/data/ascension_ext/quiz_multi';

// 2. Données de référence et registres existants
import { CITY, CITY_AREAS } from '../src/data/city/layout';
import { SECRETS as ALL_SECRETS } from '../src/data/secrets_registry';
import { IDEAS as BASE_IDEAS } from '../src/data/ascension/ideas';
import { EXTRA_IDEAS } from '../src/data/ascension_ext/ideas';
import { ECON_CONCEPTS as ALL_CONCEPTS } from '../src/data/ascension/concepts';
import { EXTRA_CONCEPTS } from '../src/data/ascension_ext/concepts';
import { ALL_GHOST_IDS, GHOST_DEFS } from '../src/data/ghosts/registry';

const SNAKE_CASE_REGEX = /^[a-z0-9]+(_[a-z0-9]+)*$/;

// Vocatifs et termes genrés strictement interdits lorsqu'adressés au joueur
const FORBIDDEN_GENDERED_PLAYER_WORDS = /\b(garçon|garçons|fiston|fistons|petit-fils|mon grand|ma grande|faire ton grand)\b/i;

const EXPECTED_9_DISTRICTS: readonly ResidentDistrict[] = [
  'gare_est',
  'hyperval',
  'industrie',
  'collines',
  'berges',
  'faubourg',
  'grand_ensemble',
  'friche_sud',
  'bellevue',
];

const VALID_SECTORS = new Set([
  'alimentation',
  'commerce',
  'services',
  'logistique',
  'mode',
  'tech',
  'immobilier',
  'culture',
  'industrie',
  'finance',
  'energie',
  'medias',
]);

// Ensemble des penseurs canoniques reconnus de NEURAPOLIS (conforme à content_ext.test.ts et content_happenings.test.ts)
const CANON_THINKERS = new Set([
  ...ALL_GHOST_IDS,
  ...GHOST_DEFS.map((g) => g.id),
  'ford',
  'schumpeter',
  'polanyi',
  'walras',
]);

// Idées combinées de base et d'extension (AG-2)
const ALL_AVAILABLE_IDEAS = new Set([
  ...BASE_IDEAS.map((i) => i.id),
  ...EXTRA_IDEAS.map((i) => i.id),
]);

function getRepoRoot(): string {
  let cur = process.cwd();
  while (cur.length > 3) {
    if (fs.existsSync(path.join(cur, 'docs', 'lore', 'QUARTIERS.md'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return path.resolve(__dirname, '..');
}

const REPO_ROOT = getRepoRoot();
const LORE_PATH = path.join(REPO_ROOT, 'docs', 'lore', 'QUARTIERS.md');

describe('AG-3 Phase 1 — Habitants nommés des 9 quartiers (residents.ts)', () => {
  it('contient exactement 36 habitants uniques avec identifiants en snake_case', () => {
    expect(RESIDENTS).toHaveLength(36);
    const seenIds = new Set<string>();
    for (const res of RESIDENTS) {
      expect(res.id).toMatch(SNAKE_CASE_REGEX);
      expect(seenIds.has(res.id), `ID habitant en doublon : ${res.id}`).toBe(false);
      seenIds.add(res.id);
    }
  });

  it('compte exactement 4 habitants par quartier pour chacun des 9 districts', () => {
    for (const d of EXPECTED_9_DISTRICTS) {
      const inDistrict = RESIDENTS.filter((r) => r.district === d);
      expect(inDistrict, `Nombre d'habitants incorrect pour le quartier ${d}`).toHaveLength(4);
    }
  });

  it('chaque habitant a un nom, un âge réaliste, un rôle et des horaires valides', () => {
    for (const res of RESIDENTS) {
      expect(res.name.trim().length).toBeGreaterThanOrEqual(3);
      expect(res.age).toBeGreaterThanOrEqual(14);
      expect(res.age).toBeLessThanOrEqual(95);
      expect(res.role.trim().length).toBeGreaterThanOrEqual(5);

      const [start, end] = res.hours;
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeLessThanOrEqual(1440);
      expect(start).toBeLessThan(end);
    }
  });

  it('chaque habitant est situé dans une rue valide de CITY.roads qui traverse son quartier', () => {
    const roadNames = new Set(CITY.roads.map((r) => r.name));
    for (const res of RESIDENTS) {
      expect(roadNames.has(res.street), `Rue inconnue "${res.street}" pour l'habitant ${res.id}`).toBe(true);

      const area = CITY_AREAS.find((a) => a.id === res.district);
      expect(area, `Quartier inconnu ${res.district} pour ${res.id}`).toBeDefined();
      if (area) {
        const matchingRoads = CITY.roads.filter((r) => r.name === res.street);
        // Les limites de quartier dans layout.ts passent "derrière les trottoirs (rue + 11 m)"
        // Une rue limitrophe ou traversante est donc comprise dans cette marge de 12 m
        const margin = 12;
        const crosses = matchingRoads.some((r) => {
          const overlapX = Math.max(r.x - margin, area.x) < Math.min(r.x + r.w + margin, area.x + area.w);
          const overlapY = Math.max(r.y - margin, area.y) < Math.min(r.y + r.h + margin, area.y + area.h);
          return overlapX && overlapY;
        });
        expect(crosses, `La rue "${res.street}" ne traverse pas le quartier ${res.district} pour ${res.id}`).toBe(true);
      }
    }
  });

  it('chaque habitant a un greeting non vide, au moins 5 répliques et au moins 2 rumeurs', () => {
    for (const res of RESIDENTS) {
      expect(res.greeting.trim().length).toBeGreaterThanOrEqual(10);
      expect(res.lines.length, `Moins de 5 répliques pour ${res.id}`).toBeGreaterThanOrEqual(5);
      for (const line of res.lines) {
        expect(line.trim().length).toBeGreaterThanOrEqual(10);
      }
      expect(res.rumors.length, `Moins de 2 rumeurs pour ${res.id}`).toBeGreaterThanOrEqual(2);
      for (const rumor of res.rumors) {
        expect(rumor.text.trim().length).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('les références des rumeurs et des habitants (secrets, idées, fantômes, secteurs) sont valides', () => {
    const validSecretIds = new Set(ALL_SECRETS.map((s) => s.id));

    for (const res of RESIDENTS) {
      if (res.ghost) {
        expect(CANON_THINKERS.has(res.ghost), `Fantôme inconnu ${res.ghost} chez ${res.id}`).toBe(true);
      }
      for (const rumor of res.rumors) {
        if (rumor.secretId) {
          expect(validSecretIds.has(rumor.secretId), `secretId inconnu "${rumor.secretId}" chez ${res.id}`).toBe(true);
        }
        if (rumor.ideaId) {
          expect(ALL_AVAILABLE_IDEAS.has(rumor.ideaId), `ideaId inconnu "${rumor.ideaId}" chez ${res.id}`).toBe(true);
        }
        if (rumor.sector) {
          expect(VALID_SECTORS.has(rumor.sector), `sector inconnu "${rumor.sector}" chez ${res.id}`).toBe(true);
        }
      }
    }
  });
});

describe('AG-3 Phase 2 — Fil d’actualités des quartiers (districts_ext/happenings.ts)', () => {
  it('contient exactement 45 événements uniques avec identifiants en snake_case', () => {
    expect(DISTRICT_HAPPENINGS).toHaveLength(45);
    const seenIds = new Set<string>();
    for (const h of DISTRICT_HAPPENINGS) {
      expect(h.id).toMatch(SNAKE_CASE_REGEX);
      expect(seenIds.has(h.id), `ID happening en doublon : ${h.id}`).toBe(false);
      seenIds.add(h.id);
    }
  });

  it('compte exactement 5 événements par quartier pour chacun des 9 districts', () => {
    for (const d of EXPECTED_9_DISTRICTS) {
      const inDistrict = DISTRICT_HAPPENINGS.filter((h) => h.district === d);
      expect(inDistrict, `Nombre d'événements incorrect pour le quartier ${d}`).toHaveLength(5);
    }
  });

  it('les paliers minTier sont compris entre 2 et 6', () => {
    for (const h of DISTRICT_HAPPENINGS) {
      expect(h.minTier, `minTier hors bornes [2, 6] dans ${h.id}`).toBeGreaterThanOrEqual(2);
      expect(h.minTier, `minTier hors bornes [2, 6] dans ${h.id}`).toBeLessThanOrEqual(6);
      expect(Number.isInteger(h.minTier)).toBe(true);
    }
  });

  it('chaque événement a un titre, un corps concret et des effets économiques bornés [0.6, 1.5] sur 2 à 30 jours', () => {
    for (const h of DISTRICT_HAPPENINGS) {
      expect(h.headline.trim().length).toBeGreaterThanOrEqual(10);
      expect(h.body.trim().length).toBeGreaterThanOrEqual(25);
      expect(h.effects.length).toBeGreaterThanOrEqual(1);

      for (const eff of h.effects) {
        expect(VALID_SECTORS.has(eff.sector), `Secteur invalide "${eff.sector}" dans ${h.id}`).toBe(true);
        expect(eff.mult, `Multiplicateur hors bornes [0.6, 1.5] dans ${h.id}`).toBeGreaterThanOrEqual(0.6);
        expect(eff.mult, `Multiplicateur hors bornes [0.6, 1.5] dans ${h.id}`).toBeLessThanOrEqual(1.5);
        expect(eff.days, `Durée hors bornes [2, 30] dans ${h.id}`).toBeGreaterThanOrEqual(2);
        expect(eff.days, `Durée hors bornes [2, 30] dans ${h.id}`).toBeLessThanOrEqual(30);
      }
    }
  });

  it('chaque réaction doctrinale est portée par un penseur canonique reconnu avec un texte substantiel', () => {
    for (const h of DISTRICT_HAPPENINGS) {
      expect(CANON_THINKERS.has(h.reaction.ghost), `Fantôme non canonique "${h.reaction.ghost}" dans ${h.id}`).toBe(true);
      expect(h.reaction.text.trim().length).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('AG-3 Phase 3 — Textes et moments multijoueur (multi/flavor.ts)', () => {
  const EXPECTED_MECHANICS: readonly MultiMechanicId[] = [
    'pret',
    'coentreprise',
    'achats_groupes',
    'recommandation',
    'formation',
    'garant_mutuel',
    'entente_prix',
    'guerre_des_prix',
    'rumeur',
    'debauchage',
    'signalement',
    'rachat_fournisseur',
    'espionnage',
    'bail_coupe',
  ];

  it('définit les 14 mécaniques sans omission ni doublon, réparties en 6 coop, 1 zone_grise et 7 sabotage', () => {
    expect(MULTI_FLAVOR).toHaveLength(14);
    const ids = MULTI_FLAVOR.map((f) => f.id);
    expect(new Set(ids).size).toBe(14);
    for (const m of EXPECTED_MECHANICS) {
      expect(ids.includes(m), `Mécanique manquante : ${m}`).toBe(true);
    }

    const coops = MULTI_FLAVOR.filter((f) => f.kind === 'coop');
    const zonesGrises = MULTI_FLAVOR.filter((f) => f.kind === 'zone_grise');
    const sabotages = MULTI_FLAVOR.filter((f) => f.kind === 'sabotage');

    expect(coops).toHaveLength(6);
    expect(zonesGrises).toHaveLength(1);
    expect(sabotages).toHaveLength(7);
  });

  it('chaque mécanique a toActor contenant {autre}, et les sabotages ont discovered contenant {autre}', () => {
    for (const f of MULTI_FLAVOR) {
      expect(f.toActor, `toActor doit contenir {autre} dans ${f.id}`).toContain('{autre}');
      if (f.kind === 'sabotage') {
        expect(f.discovered, `discovered doit contenir {autre} pour le sabotage ${f.id}`).toContain('{autre}');
      }
    }
  });

  it('chaque mécanique possède un habillage complet, des fantômes canoniques et une leçon pédagogique', () => {
    for (const f of MULTI_FLAVOR) {
      expect(f.label.trim().length).toBeGreaterThanOrEqual(4);
      expect(f.pitch.trim().length).toBeGreaterThanOrEqual(15);
      expect(f.toActor.trim().length).toBeGreaterThanOrEqual(15);
      expect(f.toTarget.trim().length).toBeGreaterThanOrEqual(15);
      expect(f.discovered.trim().length).toBeGreaterThanOrEqual(15);
      expect(f.lesson.trim().length).toBeGreaterThanOrEqual(20);

      // Penseurs pour et contre
      expect(CANON_THINKERS.has(f.ghostFor.ghost), `Fantôme pour inconnu "${f.ghostFor.ghost}" dans ${f.id}`).toBe(true);
      expect(CANON_THINKERS.has(f.ghostAgainst.ghost), `Fantôme contre inconnu "${f.ghostAgainst.ghost}" dans ${f.id}`).toBe(true);
      expect(f.ghostFor.text.trim().length).toBeGreaterThanOrEqual(20);
      expect(f.ghostAgainst.text.trim().length).toBeGreaterThanOrEqual(20);
    }
  });

  it('contient au moins 12 moments relationnels couvrant les 4 dynamiques multijoueur', () => {
    expect(MULTI_MOMENTS.length).toBeGreaterThanOrEqual(12);

    const DYNAMICS = ['alliance_longue', 'trahison', 'reconciliation', 'rivalite_ouverte'] as const;
    for (const dyn of DYNAMICS) {
      const matching = MULTI_MOMENTS.filter((m) => m.when === dyn);
      expect(matching.length, `Pas assez de moments pour la dynamique ${dyn}`).toBeGreaterThanOrEqual(2);
    }

    const seenMomentIds = new Set<string>();
    for (const m of MULTI_MOMENTS) {
      expect(m.id).toMatch(SNAKE_CASE_REGEX);
      expect(seenMomentIds.has(m.id), `ID moment en doublon : ${m.id}`).toBe(false);
      seenMomentIds.add(m.id);
      expect(CANON_THINKERS.has(m.ghost), `Fantôme inconnu "${m.ghost}" dans moment ${m.id}`).toBe(true);
      expect(m.text.trim().length).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('AG-3 Phase 4 — Théorie des jeux & Concepts multijoueur (concepts_multi.ts & quiz_multi.ts)', () => {
  const EXPECTED_CONCEPTS = [
    'dilemme_prisonnier',
    'cartel',
    'coentreprise',
    'confiance_repetee',
    'barriere_entree',
    'guerre_des_prix',
    'passager_clandestin',
  ];

  it('définit exactement 7 concepts multijoueur conformes à EconConcept sans collision avec les 32 concepts existants', () => {
    expect(MULTI_CONCEPTS).toHaveLength(7);
    const conceptIds = MULTI_CONCEPTS.map((c) => c.id);
    expect(new Set(conceptIds).size).toBe(7);

    for (const id of EXPECTED_CONCEPTS) {
      expect(conceptIds.includes(id), `Concept attendu manquant : ${id}`).toBe(true);
    }

    // 32 concepts existants (20 de base + 12 supplémentaires)
    const existingConceptIds = new Set([
      ...ALL_CONCEPTS.filter((c) => !MULTI_CONCEPTS.some((m) => m.id === c.id)).map((c) => c.id),
      ...EXTRA_CONCEPTS.map((c) => c.id),
    ]);
    expect(existingConceptIds.size).toBe(32);

    for (const c of MULTI_CONCEPTS) {
      expect(c.id).toMatch(SNAKE_CASE_REGEX);
      expect(existingConceptIds.has(c.id), `Collision d'ID avec les concepts existants : ${c.id}`).toBe(false);
      expect(c.name.trim().length).toBeGreaterThanOrEqual(3);
      expect(c.thinker.trim().length).toBeGreaterThanOrEqual(3);
      expect(c.summary.trim().length).toBeGreaterThanOrEqual(20);
      expect(c.example.trim().length).toBeGreaterThanOrEqual(20);
      expect(c.quote.trim().length).toBeGreaterThanOrEqual(15);
      expect(c.practicalEffect.trim().length).toBeGreaterThanOrEqual(20);
    }
  });

  it('les concepts référencés dans MULTI_FLAVOR existent dans l’univers complet des concepts', () => {
    const allConceptIds = new Set([
      ...ALL_CONCEPTS.map((c) => c.id),
      ...EXTRA_CONCEPTS.map((c) => c.id),
      ...MULTI_CONCEPTS.map((c) => c.id),
    ]);

    for (const f of MULTI_FLAVOR) {
      expect(allConceptIds.has(f.concept), `Concept inconnu "${f.concept}" référencé dans mécanique ${f.id}`).toBe(true);
    }
  });

  it('définit exactement 21 questions de quiz (3 par concept) avec 4 choix distincts et réponse 0..3', () => {
    expect(MULTI_QUIZZES).toHaveLength(21);
    const seenQuizIds = new Set<string>();

    for (const q of MULTI_QUIZZES) {
      expect(q.id).toMatch(SNAKE_CASE_REGEX);
      expect(seenQuizIds.has(q.id), `ID quiz en doublon : ${q.id}`).toBe(false);
      seenQuizIds.add(q.id);

      expect(EXPECTED_CONCEPTS.includes(q.conceptId), `conceptId inconnu "${q.conceptId}" dans quiz ${q.id}`).toBe(true);
      expect(q.question.trim().length).toBeGreaterThanOrEqual(15);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size, `Choix non distincts dans quiz ${q.id}`).toBe(4);
      expect([0, 1, 2, 3].includes(q.correctIndex)).toBe(true);
      expect(q.explanation.trim().length).toBeGreaterThanOrEqual(20);
    }

    // Exactement 3 questions par concept
    for (const cId of EXPECTED_CONCEPTS) {
      const forConcept = MULTI_QUIZZES.filter((q) => q.conceptId === cId);
      expect(forConcept, `Nombre de questions incorrect pour ${cId}`).toHaveLength(3);
    }
  });
});

describe('AG-3 Phase 5 — Lore et bible des quartiers (docs/lore/QUARTIERS.md)', () => {
  it('le fichier docs/lore/QUARTIERS.md existe et est bien documenté', () => {
    expect(fs.existsSync(LORE_PATH), 'docs/lore/QUARTIERS.md doit exister').toBe(true);
    const stat = fs.statSync(LORE_PATH);
    expect(stat.size).toBeGreaterThan(10000);
  });

  it('mentionne explicitement les 9 quartiers de Val-Ferrand', () => {
    const content = fs.readFileSync(LORE_PATH, 'utf-8');
    for (const d of EXPECTED_9_DISTRICTS) {
      expect(content, `Le quartier ${d} doit être mentionné dans QUARTIERS.md`).toContain(d);
    }
  });

  it('contient verbatim les 9 phrases de lock issues de CITY_AREAS', () => {
    const content = fs.readFileSync(LORE_PATH, 'utf-8');
    const districtAreas = CITY_AREAS.filter((a) => a.id !== 'centre');
    expect(districtAreas).toHaveLength(9);

    for (const area of districtAreas) {
      expect(area.lock.length).toBeGreaterThan(0);
      expect(
        content.includes(area.lock),
        `La phrase de lock pour ${area.id} ("${area.lock}") doit figurer dans QUARTIERS.md`
      ).toBe(true);
    }
  });
});

describe('AG-3 Phase 6 — Neutralité de genre globale', () => {
  it('ne contient aucun terme genré proscrit dans les textes des 36 résidents', () => {
    for (const res of RESIDENTS) {
      expect(res.greeting, `Terme genré dans greeting de ${res.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      for (const line of res.lines) {
        expect(line, `Terme genré dans réplique de ${res.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      }
      for (const rumor of res.rumors) {
        expect(rumor.text, `Terme genré dans rumeur de ${res.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      }
    }
  });

  it('ne contient aucun terme genré proscrit dans les 45 dépêches de quartier', () => {
    for (const h of DISTRICT_HAPPENINGS) {
      expect(h.headline, `Terme genré dans headline de ${h.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(h.body, `Terme genré dans body de ${h.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(h.reaction.text, `Terme genré dans reaction de ${h.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    }
  });

  it('ne contient aucun terme genré proscrit dans les textes multijoueur (mécaniques et moments)', () => {
    for (const f of MULTI_FLAVOR) {
      expect(f.label, `Terme genré dans label de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(f.pitch, `Terme genré dans pitch de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(f.toActor, `Terme genré dans toActor de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(f.toTarget, `Terme genré dans toTarget de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(f.discovered, `Terme genré dans discovered de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(f.lesson, `Terme genré dans lesson de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(f.ghostFor.text, `Terme genré dans ghostFor de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(f.ghostAgainst.text, `Terme genré dans ghostAgainst de ${f.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    }

    for (const m of MULTI_MOMENTS) {
      expect(m.text, `Terme genré dans moment ${m.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    }
  });

  it('ne contient aucun terme genré proscrit dans les concepts et quiz multijoueur', () => {
    for (const c of MULTI_CONCEPTS) {
      expect(c.name, `Terme genré dans concept ${c.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(c.summary, `Terme genré dans concept ${c.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(c.example, `Terme genré dans concept ${c.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      expect(c.practicalEffect, `Terme genré dans concept ${c.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    }

    for (const q of MULTI_QUIZZES) {
      expect(q.question, `Terme genré dans quiz ${q.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      for (const opt of q.options) {
        expect(opt, `Terme genré dans option quiz ${q.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
      }
      expect(q.explanation, `Terme genré dans explication quiz ${q.id}`).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
    }
  });

  it('ne contient aucun terme genré proscrit dans la bible des quartiers (QUARTIERS.md)', () => {
    const content = fs.readFileSync(LORE_PATH, 'utf-8');
    expect(content).not.toMatch(FORBIDDEN_GENDERED_PLAYER_WORDS);
  });
});

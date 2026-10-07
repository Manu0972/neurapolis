import { describe, expect, it } from 'vitest';
import { NEWS_TEMPLATES } from '../src/data/happenings/news';
import { SURPRISES } from '../src/data/happenings/surprises';
import { LUCIEN_BEATS, ORIGIN_SCENE } from '../src/data/story/lucien';
import { FAMILY_LINES, SCHOOL_CHARACTERS } from '../src/data/story/family';
import { ROOM_ITEMS } from '../src/data/room/items';

const CANON_GHOSTS = new Set([
  'smith', 'marx', 'keynes', 'hayek', 'ford', 'ohno',
  'taylor', 'dejours', 'ricardo', 'raworth', 'schumpeter',
  'ostrom', 'bourdieu', 'weber', 'rosa',
]);

describe('Contenu Happenings — Fil d’infos (NEWS_TEMPLATES)', () => {
  it('contient au moins 60 dépêches', () => {
    expect(NEWS_TEMPLATES.length).toBeGreaterThanOrEqual(60);
  });

  it('garantit des identifiants uniques et bien formés', () => {
    const ids = new Set<string>();
    for (const item of NEWS_TEMPLATES) {
      expect(item.id).toMatch(/^news_[a-z0-9_]+$/);
      expect(ids.has(item.id), `ID en doublon : ${item.id}`).toBe(false);
      ids.add(item.id);
    }
  });

  it('respecte les bornes numériques et les catégories sectorielles', () => {
    for (const item of NEWS_TEMPLATES) {
      expect(item.minTier).toBeGreaterThanOrEqual(1);
      expect(item.minTier).toBeLessThanOrEqual(6);
      expect(item.headline.length).toBeGreaterThan(10);
      expect(item.body.length).toBeGreaterThan(20);
      expect(item.effects.length).toBeGreaterThanOrEqual(1);

      for (const eff of item.effects) {
        expect(eff.mult).toBeGreaterThanOrEqual(0.6);
        expect(eff.mult).toBeLessThanOrEqual(1.5);
        expect(eff.days).toBeGreaterThanOrEqual(2);
        expect(eff.days).toBeLessThanOrEqual(30);
      }

      expect(CANON_GHOSTS.has(item.reaction.ghost), `Fantôme inconnu dans news : ${item.reaction.ghost}`).toBe(true);
      expect(item.reaction.text.length).toBeGreaterThan(15);
    }
  });
});

describe('Contenu Happenings — Événements aléatoires (SURPRISES)', () => {
  it('contient au moins 40 surprises au total', () => {
    expect(SURPRISES.length).toBeGreaterThanOrEqual(40);
  });

  it('respecte la répartition moitié bons, moitié mauvais, avec au moins 6 catastrophes', () => {
    const bons = SURPRISES.filter((s) => s.tone === 'bon');
    const mauvais = SURPRISES.filter((s) => s.tone === 'mauvais');
    const catastrophes = SURPRISES.filter((s) => s.tone === 'catastrophe');

    expect(catastrophes.length).toBeGreaterThanOrEqual(6);
    // Moitié bons, moitié mauvais/catastrophes
    expect(bons.length).toBe(mauvais.length + catastrophes.length);
  });

  it('garantit des identifiants uniques', () => {
    const ids = new Set<string>();
    for (const s of SURPRISES) {
      expect(s.id).toMatch(/^surp_[a-z0-9_]+$/);
      expect(ids.has(s.id), `ID surprise en doublon : ${s.id}`).toBe(false);
      ids.add(s.id);
    }
  });

  it('respecte la règle stricte des options (soit 0 effet direct, soit 2 dilemme)', () => {
    for (const s of SURPRISES) {
      const opts = s.options;
      if (opts !== undefined && opts.length > 0) {
        expect(opts.length, `Surprise ${s.id} doit avoir exactement 2 options pour un dilemme`).toBe(2);
        for (const opt of opts) {
          expect(opt.label.length).toBeGreaterThan(5);
          expect(opt.advice.length).toBeGreaterThan(10);
          expect(opt.outcome.length).toBeGreaterThan(10);
          expect(CANON_GHOSTS.has(opt.ghost), `Fantôme inconnu dans option surprise : ${opt.ghost}`).toBe(true);
          if (opt.risk !== undefined) {
            expect(opt.risk).toBeGreaterThanOrEqual(0);
            expect(opt.risk).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});

describe('Récit — Les Carnets de Lucien (LUCIEN_BEATS)', () => {
  it('scène inaugurale conforme (nuit du 31 août 2020)', () => {
    expect(ORIGIN_SCENE.id).toBe('beat_origin_31_aout_2020');
    expect(ORIGIN_SCENE.pages.length).toBeGreaterThanOrEqual(5);
    expect(ORIGIN_SCENE.pages.length).toBeLessThanOrEqual(7);
    expect(ORIGIN_SCENE.ghost).toBe('smith');
    expect(ORIGIN_SCENE.note).toBeDefined();
  });

  it('contient au moins 12 étapes de carnet après l’origine avec des ID uniques', () => {
    expect(LUCIEN_BEATS.length).toBeGreaterThanOrEqual(12);
    const ids = new Set<string>([ORIGIN_SCENE.id]);
    for (const beat of LUCIEN_BEATS) {
      expect(ids.has(beat.id), `ID beat en doublon : ${beat.id}`).toBe(false);
      ids.add(beat.id);
      expect(beat.pages.length).toBeGreaterThanOrEqual(3);
      expect(beat.pages.length).toBeLessThanOrEqual(6);
      if (beat.ghost) {
        expect(CANON_GHOSTS.has(beat.ghost), `Fantôme inconnu dans beat : ${beat.ghost}`).toBe(true);
      }
    }
  });
});

describe('Récit — Parents et École (FAMILY_LINES & SCHOOL_CHARACTERS)', () => {
  it('contient au moins 60 répliques familiales avec ID uniques', () => {
    expect(FAMILY_LINES.length).toBeGreaterThanOrEqual(60);
    const ids = new Set<string>();
    for (const f of FAMILY_LINES) {
      expect(ids.has(f.id), `ID famille en doublon : ${f.id}`).toBe(false);
      ids.add(f.id);
      expect(['nora', 'thierry', 'les_deux']).toContain(f.speaker);
      expect(['fier', 'inquiet', 'fache', 'tendre', 'espoir', 'fatigue']).toContain(f.mood);
      expect(f.replies.length).toBeGreaterThanOrEqual(2);
      expect(f.replies.length).toBeLessThanOrEqual(3);
      for (const rep of f.replies) {
        expect(rep.label.length).toBeGreaterThan(5);
        expect(rep.answer.length).toBeGreaterThan(5);
        expect(typeof rep.effect.trust).toBe('number');
        expect(typeof rep.effect.worry).toBe('number');
        expect(typeof rep.effect.pride).toBe('number');
      }
    }
  });

  it('contient au moins 10 personnages scolaires bien documentés', () => {
    expect(SCHOOL_CHARACTERS.length).toBeGreaterThanOrEqual(10);
    const ids = new Set<string>();
    for (const c of SCHOOL_CHARACTERS) {
      expect(ids.has(c.id), `ID personnage scolaire en doublon : ${c.id}`).toBe(false);
      ids.add(c.id);
      expect(c.name.length).toBeGreaterThan(2);
      expect(c.traits.length).toBeGreaterThanOrEqual(2);
      expect(c.bio.length).toBeGreaterThan(30);
    }
  });
});

describe('Chambre — Objets de décoration et bonus (ROOM_ITEMS)', () => {
  it('contient au moins 40 objets avec ID uniques', () => {
    expect(ROOM_ITEMS.length).toBeGreaterThanOrEqual(40);
    const ids = new Set<string>();
    for (const item of ROOM_ITEMS) {
      expect(ids.has(item.id), `ID objet en doublon : ${item.id}`).toBe(false);
      ids.add(item.id);
      expect(item.tier).toBeGreaterThanOrEqual(1);
      expect(item.tier).toBeLessThanOrEqual(6);
      expect(item.how.length).toBeGreaterThan(5);
      expect(item.lore.length).toBeGreaterThan(20);
      if (item.bonus) {
        expect(['stress', 'negociation', 'organisation', 'recherche', 'chance', 'plan']).toContain(item.bonus.kind);
        expect(typeof item.bonus.value).toBe('number');
      }
    }
  });
});

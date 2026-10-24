/**
 * Vague 7 (récit) : plans de cinématique déterministes, pensées du personnage, fantômes kawaii.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { GHOST_DEFS } from '../src/data/ghosts/registry';
import {
  CHAPTER1_END_SUBTITLES, OPENING_THOUGHTS, OPENING_VOICE, ORIGIN_SUBTITLES,
} from '../src/data/story_cinematics';
import { personalize } from '../src/simulation/story';
import {
  CHAPTER1_END_CINEMATIC, CINEMATICS, ORIGIN_CINEMATIC, cameraAt, cueStart, nextShotStart, planDuration, shotAt, subtitleAt,
} from '../src/presentation/cinematic/plan';
import { GHOST_ACCESSORY, ghostSvgMarkup, mouthOpenAt, pastel } from '../src/presentation/ghost-avatar';
import { thoughtMs } from '../src/presentation/cinematic/thoughts';

describe('cinématiques : plans déterministes', () => {
  it('la nuit de la Maison du Peuple dure ~50 s, la fin du chapitre 1 ~15 s', () => {
    expect(planDuration(ORIGIN_CINEMATIC)).toBeGreaterThan(40);
    expect(planDuration(ORIGIN_CINEMATIC)).toBeLessThan(65);
    expect(planDuration(CHAPTER1_END_CINEMATIC)).toBeGreaterThanOrEqual(14);
    expect(planDuration(CHAPTER1_END_CINEMATIC)).toBeLessThanOrEqual(17);
  });

  it('un sous-titre par plan, dans l’ordre du texte', () => {
    expect(ORIGIN_CINEMATIC.shots.map((s) => s.subtitle)).toEqual([...ORIGIN_SUBTITLES]);
    expect(CHAPTER1_END_CINEMATIC.shots.map((s) => s.subtitle)).toEqual([...CHAPTER1_END_SUBTITLES]);
    expect(subtitleAt(ORIGIN_CINEMATIC, 0)).toBe(ORIGIN_SUBTITLES[0]);
    expect(subtitleAt(ORIGIN_CINEMATIC, planDuration(ORIGIN_CINEMATIC) + 1)).toBeNull();
  });

  it('les repères arrivent dans l’ordre du récit (lampe → éclair → carnet → lueur → voix → Smith)', () => {
    const order = ['orage', 'poussiere', 'eclair', 'carnet', 'lueur', 'voix', 'smith'] as const;
    const starts = order.map((c) => cueStart(ORIGIN_CINEMATIC, c));
    for (const s of starts) expect(s).not.toBeNull();
    for (let i = 1; i < starts.length; i += 1) expect(starts[i]!).toBeGreaterThan(starts[i - 1]!);
  });

  it('caméra : toujours dans la bibliothèque, mouvement doux dans un plan, même résultat à chaque lecture', () => {
    const total = planDuration(ORIGIN_CINEMATIC);
    for (let t = 0; t <= total; t += 0.25) {
      const p = cameraAt(ORIGIN_CINEMATIC, t).pos;
      expect(Math.abs(p.x), `t=${t}`).toBeLessThan(3.6);
      expect(p.y).toBeGreaterThan(0.2);
      expect(p.y).toBeLessThan(4.3);
      expect(p.z).toBeGreaterThan(-10);
      expect(p.z).toBeLessThan(8.5);
    }
    for (const plan of Object.values(CINEMATICS)) {
      for (let t = 0.05; t < planDuration(plan); t += 0.1) {
        if (shotAt(plan, t)?.index !== shotAt(plan, t + 0.05)?.index) continue; // coupe franche entre deux plans
        const a = cameraAt(plan, t).pos;
        const b = cameraAt(plan, t + 0.05).pos;
        expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), `${plan.id} t=${t}`).toBeLessThan(0.2);
      }
      expect(cameraAt(plan, 7.3)).toEqual(cameraAt(plan, 7.3));
    }
  });

  it('clic = plan suivant ; la fin est atteinte en un nombre fini de clics', () => {
    let t = 0;
    let clicks = 0;
    while (shotAt(ORIGIN_CINEMATIC, t) && clicks < 50) { t = nextShotStart(ORIGIN_CINEMATIC, t); clicks += 1; }
    expect(clicks).toBe(ORIGIN_CINEMATIC.shots.length);
  });

  it('Smith parle dans le dernier plan de la nuit', () => {
    expect(ORIGIN_CINEMATIC.shots.at(-1)!.speaker).toBe('smith');
  });
});

describe('pensées du personnage', () => {
  for (const gender of ['garcon', 'fille', 'non-binaire'] as const) {
    it(`accordées et personnalisées (${gender})`, () => {
      const w = createWorld({ seed: 1 });
      w.player.gender = gender;
      w.player.firstName = 'Sacha';
      const all = [...OPENING_THOUGHTS, OPENING_VOICE.text, ...ORIGIN_SUBTITLES].map((t) => personalize(w, t));
      for (const t of all) expect(t).not.toMatch(/\{|\}/);
      expect(all.join(' ')).toMatch(/Sacha/);
      expect(personalize(w, OPENING_THOUGHTS[2]!)).toMatch(gender === 'garcon' ? /né riche/ : gender === 'fille' ? /née riche/ : /né·e riche/);
    });
  }

  it('2 à 3 pensées courtes, qui disent pourquoi gagner de l’argent', () => {
    expect(OPENING_THOUGHTS.length).toBeGreaterThanOrEqual(2);
    expect(OPENING_THOUGHTS.length).toBeLessThanOrEqual(3);
    expect(OPENING_THOUGHTS.join(' ')).toMatch(/argent|sous/);
    for (const t of OPENING_THOUGHTS) expect(thoughtMs(t)).toBeLessThanOrEqual(7000);
  });

  it('la cinématique cite la même somme de départ que la partie', () => {
    expect(OPENING_THOUGHTS[0]).toMatch(new RegExp(String(createWorld({ seed: 2 }).player.money === 15 ? 'Quinze' : 'XX')));
  });
});

describe('fantômes kawaii 2D', () => {
  it('chacune des 22 voix a son accessoire', () => {
    for (const g of GHOST_DEFS) expect(GHOST_ACCESSORY[g.id], g.id).toBeTruthy();
  });

  it('dessin SVG bien formé : aucun attribut en double, tous les états présents', () => {
    for (const id of [...Object.keys(GHOST_ACCESSORY), 'inconnu']) {
      const svg = ghostSvgMarkup(id, 'calme', 64, { standalone: true });
      for (const tag of svg.match(/<[a-zA-Z][^>]*>/g) ?? []) {
        const names = [...tag.matchAll(/\s([a-zA-Z:-]+)="/g)].map((m) => m[1]);
        expect(new Set(names).size, `${id}: ${tag}`).toBe(names.length);
      }
      for (const cls of ['gk-eyes-open', 'gk-eyes-happy', 'gk-mouth-open', 'gk-mouth-closed', 'gk-brows']) expect(svg).toContain(cls);
      expect(svg).toContain('#2a1a14');
      expect(svg).not.toMatch(/https?:\/\/(?!www\.w3\.org)/); // aucune image externe
    }
  });

  it('couleurs adoucies (pas de néon) et bouche au rythme du texte', () => {
    expect(pastel('#ff0000')).not.toBe('#ff0000');
    const text = 'Bonjour toi';
    const states = Array.from({ length: text.length + 1 }, (_, i) => mouthOpenAt(text, i));
    expect(states.some(Boolean)).toBe(true);
    expect(states.some((s) => !s)).toBe(true);
    expect(mouthOpenAt(text, 0)).toBe(false);
    expect(mouthOpenAt(text, text.length)).toBe(false);
  });

  it('échappe les attributs SVG contre les injections XSS', () => {
    const maliciousId = 'ghost" onload="alert(1)" x="';
    const svg = ghostSvgMarkup(maliciousId, 'calme', 64);
    expect(svg).not.toContain('data-ghost="ghost" onload="alert(1)"');
    expect(svg).toContain('data-ghost="ghost&quot; onload=&quot;alert(1)&quot; x=&quot;"');
    expect(svg).toContain('aria-label="ghost&quot; onload=&quot;alert(1)&quot; x=&quot;"');
  });
});

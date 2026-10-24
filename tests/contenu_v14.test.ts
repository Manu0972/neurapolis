/**
 * Vague 14 — contenu : habitants plus bavards (12 répliques, 5 rumeurs, contextuelles, sans
 * répétition rapprochée, accordées pour les 3 genres), camarades à l'heure du lycée, étapes
 * « va parler à » des chapitres 2 à 5, fêtes de quartier saisonnières sur la place.
 */
import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/core/store';
import { TICKS_PER_DAY, type PlayerGender, type WorldState } from '../src/core/types';
import { dayOfIso } from '../src/core/clock';
import { NPCS } from '../src/data/npcs';
import { PLACE_ANCHORS } from '../src/data/map';
import { RESIDENTS } from '../src/data/residents/residents';
import { LYCEE_COURS, ROUTINES_LYCEE } from '../src/data/school/routines_lycee';
import { FETES_QUARTIER } from '../src/data/happenings_saison';
import {
  MAX_REPLIQUES, contexteDe, quandOk, residentLines, residentRumors, talkToResident,
} from '../src/simulation/residents';
import { personalize } from '../src/simulation/story';
import { npcTick } from '../src/simulation/npc';
import { dialogueTopics, npcLine } from '../src/simulation/dialogue';
import {
  HOME_VISIT_FLAG, MOVEMENT_LESSON_FLAG, currentMission, missionTargetReached, talkDone,
} from '../src/simulation/missions';
import { feteDuJour, fetesTick, prochaineFete } from '../src/simulation/happenings_saison';

const tickAt = (iso: string, h: number, m = 0): number => dayOfIso(iso) * TICKS_PER_DAY + Math.floor((h * 60 + m) / 10);
const GENRES: readonly PlayerGender[] = ['garcon', 'fille', 'non-binaire'];
const toMin = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

function monde(iso = '2020-10-06', h = 15): WorldState {
  const w = createWorld({ seed: 14 });
  w.time.tick = tickAt(iso, h);
  w.player.firstName = 'Alex';
  w.seen[MOVEMENT_LESSON_FLAG] = true;
  w.seen[HOME_VISIT_FLAG] = true;
  return w;
}

describe('habitants : répliques et rumeurs', () => {
  it('au moins 12 répliques et 5 rumeurs chacun, dans les limites de la mémoire', () => {
    expect(RESIDENTS.length).toBeGreaterThanOrEqual(30);
    for (const r of RESIDENTS) {
      expect(residentLines(r).length, r.id).toBeGreaterThanOrEqual(12);
      expect(residentLines(r).length, r.id).toBeLessThanOrEqual(MAX_REPLIQUES);
      expect(residentRumors(r).length, r.id).toBeGreaterThanOrEqual(5);
      expect(residentRumors(r).length, r.id).toBeLessThanOrEqual(30);
      expect(new Set(residentLines(r).map((l) => l.text)).size, r.id).toBe(residentLines(r).length);
    }
  });

  it('chaque texte est accordé pour les 3 genres (aucune marque oubliée, aucun mot genré)', () => {
    // Adjectif adressé au joueur sans accord : « tu as l’air pressé », « tu sembles seul »…
    const sansAccord = /\b(tu es|t’es|as l’air|tu sembles|te voilà|tu restes|tu deviens)( bien| un peu| très| trop| si)? (\p{L}+é|seul|prêt|content|occupé|motivé)(?!\{e\})(?=[\s,.!?…]|$)/iu;
    for (const r of RESIDENTS) {
      const textes = [r.greeting, ...residentLines(r).map((l) => l.text), ...residentRumors(r).map((x) => x.text)];
      for (const t of textes) {
        expect(sansAccord.test(t), `${r.id} : ${t}`).toBe(false);
        for (const g of GENRES) {
          const w = monde();
          w.player.gender = g;
          const p = personalize(w, t);
          expect(p, `${r.id} (${g})`).not.toMatch(/[{}]/);
          if (g !== 'garcon') expect(p, `${r.id} (${g})`).not.toMatch(/\b(garçon|fiston|mon grand|jeune homme)\b/);
          if (t.includes('{e}')) expect(p).toContain(g === 'garcon' ? '' : g === 'fille' ? 'e' : '·e');
        }
      }
    }
  });

  it('une réplique ne revient pas tant que les autres possibles n’ont pas été dites', () => {
    for (const r of RESIDENTS) {
      const w = monde();
      const ctx = contexteDe(w);
      const possibles = residentLines(r).filter((l) => quandOk(w, ctx, l.quand)).length;
      expect(possibles, r.id).toBeGreaterThanOrEqual(5);
      const dites = Array.from({ length: possibles }, () => talkToResident(w, r.id).line);
      expect(new Set(dites).size, r.id).toBe(possibles);
      expect(talkToResident(w, r.id).line, r.id).not.toBe(dites[dites.length - 1]);
    }
  });

  it('sur deux mois, jamais deux fois de suite la même réplique, jamais deux fois la même rumeur', () => {
    for (const r of RESIDENTS) {
      const w = monde('2020-09-01', 9);
      w.economy!.sandbox = true;
      let prev = '';
      const rumeurs: string[] = [];
      for (let d = 0; d < 60; d++) {
        w.time.tick += TICKS_PER_DAY;
        w.district.meteo = d % 3 === 0 ? 'pluie' : 'soleil';
        for (let k = 0; k < 2; k++) {
          const res = talkToResident(w, r.id);
          expect(res.line, `${r.id} jour ${d}`).not.toBe(prev);
          prev = res.line;
          if (res.rumor) rumeurs.push(res.rumor);
        }
      }
      expect(rumeurs.length, r.id).toBeGreaterThanOrEqual(3);
      expect(new Set(rumeurs).size, r.id).toBe(rumeurs.length);
    }
  });

  it('préfère une réplique de circonstance (pluie, chapitre, fête) quand il y en a une', () => {
    let circonstance = 0;
    for (const r of RESIDENTS) {
      const w = monde('2020-12-15', 11); // marché de Noël
      w.district.meteo = 'pluie';
      w.campaign.currentChapter = 4;
      const ctx = contexteDe(w);
      expect(ctx.fete).toBe('noel');
      const de = residentLines(r).filter((l) => l.quand && quandOk(w, ctx, l.quand)).map((l) => personalize(w, l.text));
      const line = talkToResident(w, r.id).line;
      if (de.length > 0) {
        expect(de, r.id).toContain(line);
        circonstance++;
      }
    }
    expect(circonstance).toBeGreaterThanOrEqual(RESIDENTS.length / 2);
  });
});

describe('camarades au lycée', () => {
  const lyceen = (iso: string, h: number, m = 0): WorldState => {
    const w = monde(iso, h);
    w.player.age = 15;
    w.time.tick = tickAt(iso, h, m);
    npcTick(w);
    return w;
  };

  it('suivent l’emploi du temps du lycée (8 h – 12 h, 14 h – 17 h)', () => {
    expect(lyceen('2023-09-05', 10).npcs['noah']!.place).toBe('lycee');
    const midi = lyceen('2023-09-05', 12, 30);
    expect(midi.npcs['noah']!.place).toBe('lycee');
    expect(midi.npcs['noah']!.activity).toContain('self');
    expect(lyceen('2023-09-05', 16, 50).npcs['yasmine']!.place).toBe('lycee');
    const soir = lyceen('2023-09-05', 17, 30);
    expect(soir.npcs['noah']!.place).toBe('parc');
    expect(soir.npcs['yasmine']!.place).toBe('place');
    expect(soir.npcs['lina']!.place).toBe('lycee');
  });

  it('mercredi matin seulement ; rien au lycée le week-end ni en vacances', () => {
    expect(lyceen('2023-09-06', 10).npcs['lina']!.place).toBe('lycee');
    const aprem = lyceen('2023-09-06', 14);
    expect(aprem.npcs['noah']!.place).toBe('parc');
    expect(aprem.npcs['yasmine']!.place).toBe('place');
    expect(lyceen('2023-09-09', 10).npcs['noah']!.place).not.toBe('lycee');
    expect(lyceen('2023-10-24', 10).npcs['lina']!.place).not.toBe('lycee'); // Toussaint
  });

  it('au collège, rien ne change', () => {
    const w = monde('2020-10-06', 12);
    w.player.age = 13;
    w.time.tick = tickAt('2020-10-06', 16, 50);
    npcTick(w);
    expect(w.npcs['noah']!.place).toBe('parc');
    w.time.tick = tickAt('2020-10-06', 12, 30);
    npcTick(w);
    expect(w.npcs['noah']!.place).toBe('college');
  });

  it('les cours tombent dans les séances du lycée', () => {
    const dans = (a: number, b: number): boolean =>
      [LYCEE_COURS.matin, LYCEE_COURS.apres].some(([s, e]) => a >= s && b <= e);
    for (const [id, r] of Object.entries(ROUTINES_LYCEE)) {
      expect(NPCS.some((n) => n.id === id), id).toBe(true);
      for (const s of r.semaine.filter((x) => x.activity.startsWith('en cours'))) {
        expect(dans(toMin(s.from), toMin(s.to)), `${id} ${s.from}`).toBe(true);
      }
      for (const s of r.mercredi) expect(toMin(s.from), id).toBeGreaterThanOrEqual(12 * 60);
    }
  });
});

describe('missions des chapitres 2 à 5 : aller voir quelqu’un', () => {
  /** Suit le bandeau : rejoint la cible puis parle au PNJ ; renvoie les étapes « va parler à » vues. */
  function suivre(w: WorldState, max = 6): string[] {
    const vus: string[] = [];
    for (let i = 0; i < max; i++) {
      const s = currentMission(w);
      if (!s?.talk) break;
      vus.push(s.talk.flag.replace('mission:', ''));
      if (s.target && !missionTargetReached(w, s.target)) w.player.pos = { x: s.target.x, y: s.target.y };
      const a = currentMission(w)!.action!;
      expect(a.do).toBe('parler');
      expect(npcLine(w, a.npc!, dialogueTopics(a.npc!)[0]!)).not.toBeNull();
      expect(talkDone(w, s.talk.flag.replace('mission:', ''))).toBe(true);
    }
    return vus;
  }
  const chapitre = (ch: number): WorldState => {
    const w = monde('2020-10-10', 15); // samedi : pas de cours
    w.campaign.currentChapter = ch;
    for (const s of w.campaign.stages) if (s.chapter < ch) s.completed = true;
    return w;
  };

  it('chapitre 2 : Karim après Samir', () => {
    const w = chapitre(2);
    w.flags['chapitre2ConversationCoopSamir'] = 1;
    expect(suivre(w, 1)).toEqual(['c2:karim']);
    expect(currentMission(w)!.id).not.toContain('c2:karim');
  });

  it('chapitre 3 : la liste de Mme Bertin, puis les livraisons', () => {
    const w = chapitre(3);
    expect(suivre(w, 1)).toEqual(['c3:bertin']);
    const s = currentMission(w)!;
    expect(s.id.startsWith('c3:course')).toBe(true);
    expect(s.count?.unit).toBe('livraisons');
  });

  it('chapitre 4 : convaincre Monique, préparer le débat avec Samir', () => {
    const w = chapitre(4);
    w.flags['chapitre4ConseilMobilise'] = 1;
    expect(suivre(w)).toEqual(['c4:monique', 'c4:samir']);
    expect(currentMission(w)!.id).toMatch(/^c4:(attente-debat|debat)/);
  });

  it('chapitre 5 : bilan avec Mme Bertin, puis Noah, avant de choisir le modèle', () => {
    const w = chapitre(5);
    expect(suivre(w)).toEqual(['c5:bertin', 'c5:noah']);
    expect(currentMission(w)!.id).toBe('c5:modele');
  });

  it('parler à quelqu’un d’autre ne valide pas l’étape', () => {
    const w = chapitre(5);
    npcLine(w, 'noah', dialogueTopics('noah')[0]!);
    expect(talkDone(w, 'c5:noah')).toBe(false);
    expect(currentMission(w)!.talk?.npc).toBe('bertin');
  });
});

describe('fêtes de quartier saisonnières', () => {
  it('dates déterministes : rentrée, Toussaint, Noël, marché d’été', () => {
    expect(feteDuJour(dayOfIso('2020-09-05'))?.id).toBe('rentree');
    expect(feteDuJour(dayOfIso('2020-10-31'))?.id).toBe('toussaint');
    expect(feteDuJour(dayOfIso('2020-12-15'))?.id).toBe('noel');
    expect(feteDuJour(dayOfIso('2021-07-02'))?.id).toBe('marche_ete');
    expect(feteDuJour(dayOfIso('2020-10-06'))).toBeNull();
    const vues = new Set<string>();
    for (let d = dayOfIso('2020-09-01'); d < dayOfIso('2021-09-01'); d++) {
      const f = feteDuJour(d);
      if (f) vues.add(f.id);
    }
    expect([...vues].sort()).toEqual(FETES_QUARTIER.map((f) => f.id).sort());
    expect(prochaineFete(dayOfIso('2020-11-01'))?.fete.id).toBe('noel');
  });

  it('annonce une fois, puis un petit effet si le joueur passe sur la place', () => {
    const w = monde('2020-12-15', 9); // avant l'ouverture
    expect(fetesTick(w)).toEqual([]);
    w.time.tick = tickAt('2020-12-15', 11);
    w.player.pos = { x: 0, y: 0 };
    expect(fetesTick(w)).toHaveLength(1); // annonce
    expect(fetesTick(w)).toEqual([]);
    const rep = w.player.reputation;
    w.player.pos = { ...PLACE_ANCHORS.place };
    expect(fetesTick(w)).toHaveLength(1); // visite
    expect(w.player.reputation).toBeGreaterThan(rep);
    w.time.tick = tickAt('2020-12-16', 11);
    expect(fetesTick(w)).toEqual([]); // déjà vu cette année
  });

  // Ce que game.ts affiche : une notification avec fantôme (barre) ou de type fantome/journal (bandeau).
  const affichee = (n: { kind: string; ghost?: string }): boolean => !!n.ghost || n.kind === 'fantome' || n.kind === 'journal';

  it('nouvelle partie, 5 septembre 2020 sur la place : annonce affichée, aucun fantôme pas encore rencontré', () => {
    const w = createWorld({ seed: 14 });
    w.time.tick = tickAt('2020-09-05', 11);
    w.player.pos = { ...PLACE_ANCHORS.place };
    expect(w.council.ghosts.bourdieu?.status).toBe('inconnu');
    const ns = fetesTick(w);
    expect(ns).toHaveLength(2); // annonce + visite
    for (const n of ns) {
      expect(affichee(n)).toBe(true);
      if (n.ghost) {
        const rencontre = w.council.ghosts[n.ghost as keyof typeof w.council.ghosts]?.status === 'actif'
          || (w.ghostCompanion?.unlockedThinkers ?? ['smith']).includes(n.ghost);
        expect(rencontre).toBe(true);
      }
    }
    expect(ns.some((n) => n.ghost === 'bourdieu')).toBe(false);
  });

  it('le fantôme de la fête parle s’il est actif ; une voix tue se tait (bandeau à la place)', () => {
    const w = monde('2020-12-15', 11);
    w.council.ghosts.marx!.status = 'actif';
    w.player.pos = { ...PLACE_ANCHORS.place };
    expect(fetesTick(w).find((n) => n.kind === 'fantome')?.ghost).toBe('marx');
    const v = monde('2020-12-15', 11);
    v.ghostCompanion = { ...v.ghostCompanion!, unlockedThinkers: ['smith'] };
    v.rewind = { count: 1, lessons: [], sacrifices: [{ ghost: 'smith', day: 0, untilDay: dayOfIso('2021-01-01'), returned: false }] };
    v.player.pos = { ...PLACE_ANCHORS.place };
    const ns = fetesTick(v);
    expect(ns.every((n) => !n.ghost && n.kind === 'journal')).toBe(true);
  });
});

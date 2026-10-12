/**
 * Musique adaptative : choix de l'état musical (fonctions pures), hystérésis, lecture du monde,
 * couleurs de quartier / d'heure, réglages mémorisés, corde Karplus-Strong et séquenceur à graine.
 */
import { describe, it, expect } from 'vitest';
import {
  CONFIRM_MS, MIN_DWELL_MS, PULSE_MS, calmScore, createDirector, debtFactor, desiredMood,
  moodForModal, stepDirector, tensionScore, type DirectorState, type MusicSignals,
} from '../src/presentation/music/director';
import { MOODS, dayPartOf, resolveMood } from '../src/presentation/music/moods';
import { readMusicSignals } from '../src/presentation/music/signals';
import { parseAudioPrefs, DEFAULT_AUDIO_PREFS } from '../src/presentation/music/prefs';
import { renderPluck } from '../src/presentation/music/synth';
import { MusicEngine } from '../src/presentation/music/engine';
import { createWorld } from '../src/core/store';
import { PLACE_ANCHORS } from '../src/data/map';
import { TICKS_PER_DAY } from '../src/core/types';

function sig(over: Partial<MusicSignals> = {}): MusicSignals {
  return {
    hour: 14, asleep: false, insideHome: false, inBedroom: false, nearPlace: null, district: 'centre',
    stress: 25, moral: 60, money: 50, debt: 0, rival: 0, grave: 0, convocation: 0, redVenture: 0,
    chapters: 0, tier: 1, rewinds: 0, sales: 0, scene: null, ...over,
  };
}

/** Fait tourner le chef d'orchestre `ms` millisecondes, une mise à jour toutes les 250 ms. */
function run(st: DirectorState, s: MusicSignals, from: number, ms: number): { st: DirectorState; t: number } {
  let t = from;
  for (; t <= from + ms; t += 250) st = stepDirector(st, s, t);
  return { st, t };
}

describe('Musique — situation → état voulu', () => {
  it('exploration par défaut, en journée, sans souci', () => {
    expect(desiredMood(sig(), 'exploration')).toBe('exploration');
  });

  it('tension : stress élevé, dette, rival, coup dur, convocation, entreprise dans le rouge', () => {
    expect(desiredMood(sig({ stress: 80 }), 'exploration')).toBe('tension');
    expect(desiredMood(sig({ money: -5 }), 'exploration')).toBe('tension');
    expect(desiredMood(sig({ money: 20, debt: 400 }), 'exploration')).toBe('tension');
    expect(desiredMood(sig({ rival: 0.75 }), 'exploration')).toBe('tension');
    expect(desiredMood(sig({ grave: 1 }), 'exploration')).toBe('tension');
    expect(desiredMood(sig({ convocation: 0.7 }), 'exploration')).toBe('tension');
    expect(desiredMood(sig({ redVenture: 0.6 }), 'exploration')).toBe('tension');
  });

  it('un petit prêt bien couvert ne crée pas de tension', () => {
    expect(debtFactor(500, 100)).toBe(0);
    expect(desiredMood(sig({ money: 500, debt: 100 }), 'exploration')).toBe('exploration');
  });

  it('résonance : nuit, sommeil, chambre, soirée à la maison, parc paisible', () => {
    expect(desiredMood(sig({ hour: 23 }), 'exploration')).toBe('resonance');
    expect(desiredMood(sig({ hour: 3 }), 'exploration')).toBe('resonance');
    expect(desiredMood(sig({ asleep: true, stress: 90 }), 'exploration')).toBe('resonance');
    expect(desiredMood(sig({ inBedroom: true, insideHome: true }), 'exploration')).toBe('resonance');
    expect(desiredMood(sig({ insideHome: true, hour: 20.5 }), 'exploration')).toBe('resonance');
    expect(desiredMood(sig({ nearPlace: 'parc', stress: 20 }), 'exploration')).toBe('resonance');
  });

  it('la tension l’emporte sur le calme (sauf pendant le sommeil)', () => {
    expect(desiredMood(sig({ inBedroom: true, stress: 90 }), 'exploration')).toBe('tension');
  });

  it('une fenêtre impose son état ; un moment fort passe avant la situation', () => {
    expect(desiredMood(sig({ stress: 90, scene: 'climax' }), 'tension')).toBe('climax');
    expect(desiredMood(sig({ hour: 23 }), 'resonance', 'climax')).toBe('climax');
  });

  it('hystérésis des seuils : on entre en tension à 75 de stress, on n’en sort que sous ~69', () => {
    // stress 72 → score 0,48 : pas assez pour entrer, assez pour rester.
    expect(tensionScore(sig({ stress: 72 }))).toBeCloseTo(0.48, 2);
    expect(desiredMood(sig({ stress: 72 }), 'exploration')).toBe('exploration');
    expect(desiredMood(sig({ stress: 72 }), 'tension')).toBe('tension');
    expect(desiredMood(sig({ stress: 65 }), 'tension')).toBe('exploration');
    // Calme : la soirée à la maison (0,7) fait entrer, la maison en journée stressée (0,45) fait rester.
    expect(calmScore(sig({ insideHome: true, stress: 50 }))).toBeCloseTo(0.45, 2);
    expect(desiredMood(sig({ insideHome: true, stress: 50 }), 'exploration')).toBe('exploration');
    expect(desiredMood(sig({ insideHome: true, stress: 50 }), 'resonance')).toBe('resonance');
  });
});

describe('Musique — chef d’orchestre (temporisation, anti va-et-vient)', () => {
  it('un changement doit être confirmé quelques secondes avant d’être adopté', () => {
    let st = createDirector(0);
    st = run(st, sig(), 0, MIN_DWELL_MS.exploration).st; // séjour minimal écoulé
    const t0 = MIN_DWELL_MS.exploration + 1000;
    st = stepDirector(st, sig({ stress: 90 }), t0);
    expect(st.mood).toBe('exploration');
    st = stepDirector(st, sig({ stress: 90 }), t0 + CONFIRM_MS - 100);
    expect(st.mood).toBe('exploration');
    st = stepDirector(st, sig({ stress: 90 }), t0 + CONFIRM_MS + 10);
    expect(st.mood).toBe('tension');
  });

  it('un bref pic de stress (< confirmation) ne change rien', () => {
    let st = run(createDirector(0), sig(), 0, 20_000).st;
    st = stepDirector(st, sig({ stress: 95 }), 20_250);
    st = stepDirector(st, sig({ stress: 95 }), 21_000);
    st = run(st, sig(), 21_250, 10_000).st;
    expect(st.mood).toBe('exploration');
  });

  it('pas de va-et-vient : un stress qui oscille autour du seuil reste en tension', () => {
    let st = createDirector(0);
    st = run(st, sig({ stress: 90 }), 0, 15_000).st;
    expect(st.mood).toBe('tension');
    let changes = 0;
    let prev = st.mood;
    for (let t = 15_000; t < 120_000; t += 250) {
      const stress = Math.floor(t / 2000) % 2 === 0 ? 76 : 70; // oscille de part et d'autre de 75
      st = stepDirector(st, sig({ stress }), t);
      if (st.mood !== prev) { changes++; prev = st.mood; }
    }
    expect(changes).toBe(0);
    expect(st.mood).toBe('tension');
  });

  it('séjour minimal : même confirmé, on ne quitte pas la tension avant 15 s', () => {
    let st = createDirector(0);
    st = run(st, sig({ stress: 90 }), 0, 12_000).st;
    expect(st.mood).toBe('tension');
    const enteredAt = st.since;
    st = run(st, sig({ stress: 10 }), 12_250, 6000).st; // calme confirmé, mais séjour trop court
    expect(st.mood).toBe('tension');
    st = run(st, sig({ stress: 10 }), 18_500, enteredAt + MIN_DWELL_MS.tension).st;
    expect(st.mood).toBe('exploration');
  });

  it('une fenêtre de climax (Grand Débat) s’impose presque tout de suite, sans attendre le séjour minimal', () => {
    let st = createDirector(0);
    st = stepDirector(st, sig(), 0);
    st = run(st, sig({ scene: 'climax' }), 250, 600).st;
    expect(st.mood).toBe('climax');
    expect(st.reason).toBe('scène en cours');
  });

  it('fin de chapitre → climax pendant un moment, puis retour à la situation', () => {
    let st = run(createDirector(0), sig({ chapters: 1 }), 0, 10_000).st;
    expect(st.mood).toBe('exploration');
    st = run(st, sig({ chapters: 2 }), 10_250, 1000).st;
    expect(st.mood).toBe('climax');
    expect(st.reason).toBe('fin de chapitre');
    st = run(st, sig({ chapters: 2 }), 11_500, PULSE_MS.chapter + 20_000).st;
    expect(st.mood).toBe('exploration');
  });

  it('retour en arrière → résonance ; pas de faux moment fort au chargement', () => {
    let st = stepDirector(createDirector(0), sig({ chapters: 3, rewinds: 2, tier: 2 }), 0);
    st = run(st, sig({ chapters: 3, rewinds: 2, tier: 2 }), 250, 5000).st;
    expect(st.mood).toBe('exploration');
    st = run(st, sig({ chapters: 3, rewinds: 3, tier: 2 }), 5500, 1000).st;
    expect(st.mood).toBe('resonance');
    expect(st.reason).toBe('retour en arrière');
  });

  it('grande vente → climax, pas un emprunt ; anti-répétition', () => {
    let st = run(createDirector(0), sig({ money: 100 }), 0, 10_000).st;
    // Un prêt de 500 € n'est pas une vente.
    st = run(st, sig({ money: 600, debt: 500 }), 10_250, 1000).st;
    expect(st.mood).not.toBe('climax');
    st = run(createDirector(0), sig({ money: 100, sales: 10 }), 0, 10_000).st;
    st = run(st, sig({ money: 300, sales: 30 }), 10_250, 1000).st;
    expect(st.mood).toBe('climax');
    expect(st.reason).toBe('grande vente');
  });

  it('fenêtres reconnues à leur titre', () => {
    expect(moodForModal('Le Grand Débat de Val-Ferrand')).toBe('climax');
    expect(moodForModal('L’Héritage de Val-Ferrand')).toBe('climax');
    expect(moodForModal('Fusion — Smith-Ostrom')).toBe('climax');
    expect(moodForModal('🏫 Convocation')).toBe('tension');
    expect(moodForModal('💥 Incendie')).toBe('tension');
    expect(moodForModal('⏳ Remonter le temps')).toBe('resonance');
    expect(moodForModal('🍝 Le dîner')).toBe('resonance');
    expect(moodForModal('💾 Sauvegardes')).toBeNull();
    expect(moodForModal(null)).toBeNull();
  });
});

describe('Musique — lecture du monde (sans le modifier)', () => {
  it('lit stress, heure, sommeil, rival, convocation et coup dur sans toucher au monde', () => {
    const w = createWorld({ seed: 42 });
    const before = JSON.stringify(w);
    const s = readMusicSignals(w, { interiorPlace: 'maison', interiorRoom: 'chambre' });
    expect(JSON.stringify(w)).toBe(before); // lecture seule, PRNG de la simulation intact
    expect(s.inBedroom).toBe(true);
    expect(s.insideHome).toBe(true);
    expect(s.stress).toBe(w.player.needs.stress);
    expect(s.scene).toBeNull();
    expect(typeof s.district).toBe('string');
  });

  it('rival : rien sans offensive, tension près de son terrain pendant une contre-attaque', () => {
    const w = createWorld({ seed: 7 });
    const a = PLACE_ANCHORS.place;
    w.player.pos = { x: a.x, y: a.y };
    expect(readMusicSignals(w).rival).toBe(0);
    w.rivals.drive_hyper.reactionCooldown = 4;
    w.rivals.drive_hyper.aggressiveness = 70;
    const s = readMusicSignals(w);
    expect(s.nearPlace).toBe('place');
    expect(s.rival).toBeCloseTo(0.75, 2);
    expect(desiredMood(s, 'exploration')).toBe('tension');
  });

  it('nuit et convocation du jour', () => {
    const w = createWorld({ seed: 7 });
    w.time.tick = 2 * TICKS_PER_DAY + 23 * 6; // 23 h
    expect(desiredMood(readMusicSignals(w), 'exploration')).toBe('resonance');
    w.time.tick = 2 * TICKS_PER_DAY + 10 * 6; // 10 h
    w.family = { ...(w.family ?? ({} as never)), convocation: { day: 2, reason: 'absences' } } as typeof w.family;
    expect(readMusicSignals(w).convocation).toBe(0.7);
  });
});

describe('Musique — couleurs (quartier, moment) et réglages', () => {
  it('tempos du prototype et couleurs de quartier / de nuit', () => {
    expect(resolveMood('exploration', 'centre', 14).bpm).toBe(92);
    expect(resolveMood('tension', 'centre', 14).bpm).toBe(118);
    expect(resolveMood('climax', 'centre', 2).bpm).toBe(140); // le climax ne ralentit pas la nuit
    expect(resolveMood('resonance', 'centre', 14).bpm).toBe(66);
    expect(resolveMood('exploration', 'centre', 23).bpm).toBeLessThan(92);
    const gare = resolveMood('exploration', 'gare', 14);
    expect(gare.scale[0]).toBe(MOODS.exploration.scale[0]! + 2);
    expect(dayPartOf(7)).toBe('matin');
    expect(dayPartOf(22)).toBe('nuit');
    // La basse ne descend jamais sous Mi 1.
    for (const d of ['industrie', 'berges', 'friche_sud', 'centre']) {
      for (const m of ['exploration', 'tension', 'climax', 'resonance'] as const) {
        expect(resolveMood(m, d, 12).bass).toBeGreaterThanOrEqual(28);
      }
    }
  });

  it('réglages mémorisés : lecture tolérante', () => {
    expect(parseAudioPrefs(null)).toEqual(DEFAULT_AUDIO_PREFS);
    expect(parseAudioPrefs('pas du json')).toEqual(DEFAULT_AUDIO_PREFS);
    expect(parseAudioPrefs('{"music":0.3,"effects":2,"muted":true}')).toEqual({ music: 0.3, effects: 1, muted: true });
    expect(parseAudioPrefs('{"music":"fort"}')).toEqual(DEFAULT_AUDIO_PREFS);
  });
});

describe('Musique — synthèse et séquenceur à graine', () => {
  it('Karplus-Strong : hauteur juste (La 220 Hz) et extinction', () => {
    let s = 1;
    const rand = (): number => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    const sr = 22050;
    const y = renderPluck(220, sr, 1.6, rand);
    // Autocorrélation sur une fenêtre stable : le pic doit tomber sur la période (100,2 échantillons).
    let best = 0;
    let bestLag = 0;
    for (let lag = 60; lag < 160; lag++) {
      let c = 0;
      for (let i = 2000; i < 6000; i++) c += y[i]! * y[i + lag]!;
      if (c > best) { best = c; bestLag = lag; }
    }
    expect(Math.abs(bestLag - sr / 220)).toBeLessThanOrEqual(1);
    const peak = (a: number, b: number): number => { let m = 0; for (let i = a; i < b; i++) m = Math.max(m, Math.abs(y[i]!)); return m; };
    expect(peak(y.length - 2000, y.length)).toBeLessThan(peak(0, 2000) * 0.01);
  });

  it('même graine ⇒ même musique ; autre graine ⇒ autre musique ; tempo qui glisse au changement', () => {
    const play = (seed: number, change = false): { notes: string; bpmMid: number } => {
      const ctx = new MockCtx();
      const e = new MusicEngine(ctx as unknown as BaseAudioContext, ctx.destination as unknown as AudioNode, seed);
      e.trace = [];
      e.start(false, 0.01);
      e.scheduleUntil(10);
      let bpmMid = 0;
      if (change) {
        ctx.currentTime = 10;
        e.setMood('climax');
        bpmMid = e.bpmAt(11.6);
        e.scheduleUntil(20);
      }
      return { notes: e.trace.map((n) => `${n.kind}:${n.midi ?? ''}:${n.t.toFixed(3)}`).join('|'), bpmMid };
    };
    expect(play(7).notes).toBe(play(7).notes);
    expect(play(7).notes).not.toBe(play(8).notes);
    const { bpmMid } = play(7, true);
    expect(bpmMid).toBeGreaterThan(92);
    expect(bpmMid).toBeLessThan(140);
  });

  it('la résonance n’a pas de percussions ; le climax en a', () => {
    const count = (mood: 'resonance' | 'climax'): { perc: number; notes: number } => {
      const ctx = new MockCtx();
      const e = new MusicEngine(ctx as unknown as BaseAudioContext, ctx.destination as unknown as AudioNode, 3, mood);
      e.trace = [];
      e.start(false, 0.01);
      e.scheduleUntil(15);
      return { perc: e.trace.filter((n) => n.kind === 'kick' || n.kind === 'hat').length, notes: e.trace.length };
    };
    expect(count('resonance').perc).toBe(0);
    expect(count('climax').perc).toBeGreaterThan(20);
  });
});

// ---------- Contexte audio factice (juste ce que le moteur utilise) ----------

class P {
  value = 0;
  setValueAtTime(v: number): void { this.value = v; }
  linearRampToValueAtTime(): void {}
  exponentialRampToValueAtTime(): void {}
  setTargetAtTime(): void {}
  cancelScheduledValues(): void {}
}
class N {
  gain = new P(); frequency = new P(); detune = new P(); Q = new P(); threshold = new P(); ratio = new P(); attack = new P(); release = new P();
  type = ''; buffer: unknown = null; onended: (() => void) | null = null;
  connect(): void {}
  disconnect(): void {}
  start(): void {}
  stop(): void {}
}
class MockCtx {
  currentTime = 0;
  sampleRate = 44100;
  destination = new N();
  createGain(): N { return new N(); }
  createBiquadFilter(): N { return new N(); }
  createOscillator(): N { return new N(); }
  createBufferSource(): N { return new N(); }
  createDynamicsCompressor(): N { return new N(); }
  createConvolver(): N { return new N(); }
  createBuffer(ch: number, len: number, rate: number): { getChannelData(i: number): Float32Array; sampleRate: number; length: number } {
    const data = Array.from({ length: ch }, () => new Float32Array(len));
    return { getChannelData: (i: number) => data[i]!, sampleRate: rate, length: len };
  }
}

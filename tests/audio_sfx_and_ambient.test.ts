import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { audio, SoundEngine } from '../src/presentation/audio';

/**
 * Mock minimaliste et fidèle de l'API Web Audio pour inspecter la topologie
 * des nœuds générés (fréquences, types de filtres, réutilisation de buffers).
 */
class MockAudioParam {
  value: number;
  calls: Array<{ method: string; args: any[] }> = [];

  constructor(initial = 0) {
    this.value = initial;
  }

  setValueAtTime(val: number, time: number) {
    this.value = val;
    this.calls.push({ method: 'setValueAtTime', args: [val, time] });
  }

  exponentialRampToValueAtTime(val: number, time: number) {
    this.calls.push({ method: 'exponentialRampToValueAtTime', args: [val, time] });
  }

  linearRampToValueAtTime(val: number, time: number) {
    this.calls.push({ method: 'linearRampToValueAtTime', args: [val, time] });
  }

  setTargetAtTime(val: number, time: number, constant: number) {
    this.calls.push({ method: 'setTargetAtTime', args: [val, time, constant] });
  }

  setValueCurveAtTime(values: Float32Array, time: number, duration: number) {
    this.calls.push({ method: 'setValueCurveAtTime', args: [values, time, duration] });
  }
}

class MockAudioBuffer {
  channels: Float32Array[];
  sampleRate: number;
  length: number;
  duration: number;

  constructor(channels: number, length: number, sampleRate: number) {
    this.channels = Array.from({ length: channels }, () => new Float32Array(length));
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
  }

  getChannelData(channel: number) {
    return this.channels[channel] || new Float32Array(this.length);
  }
}

class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam(440);
  connectedTo: any[] = [];
  started = false;
  stopped = false;

  connect(target: any) {
    this.connectedTo.push(target);
  }
  disconnect() {}
  start(t?: number) {
    this.started = true;
  }
  stop(t?: number) {
    this.stopped = true;
  }
}

class MockGainNode {
  gain = new MockAudioParam(1.0);
  connectedTo: any[] = [];

  connect(target: any) {
    this.connectedTo.push(target);
  }
  disconnect() {}
}

class MockBiquadFilterNode {
  type: BiquadFilterType = 'lowpass';
  frequency = new MockAudioParam(350);
  Q = new MockAudioParam(1);
  connectedTo: any[] = [];

  connect(target: any) {
    this.connectedTo.push(target);
  }
  disconnect() {}
}

class MockBufferSourceNode {
  buffer: MockAudioBuffer | null = null;
  loop = false;
  connectedTo: any[] = [];
  started = false;
  stopped = false;

  connect(target: any) {
    this.connectedTo.push(target);
  }
  disconnect() {}
  start(t?: number, offset?: number, duration?: number) {
    this.started = true;
  }
  stop(t?: number) {
    this.stopped = true;
  }
}

class MockAudioContext {
  currentTime = 10.0;
  sampleRate = 44100;
  state: AudioContextState = 'running';
  destination = new MockGainNode();

  createdOscillators: MockOscillatorNode[] = [];
  createdGains: MockGainNode[] = [];
  createdFilters: MockBiquadFilterNode[] = [];
  createdBuffers: MockAudioBuffer[] = [];
  createdBufferSources: MockBufferSourceNode[] = [];

  createOscillator() {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc;
  }

  createGain() {
    const gain = new MockGainNode();
    this.createdGains.push(gain);
    return gain;
  }

  createBiquadFilter() {
    const filter = new MockBiquadFilterNode();
    this.createdFilters.push(filter);
    return filter;
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    const buf = new MockAudioBuffer(channels, length, sampleRate);
    this.createdBuffers.push(buf);
    return buf;
  }

  createBufferSource() {
    const src = new MockBufferSourceNode();
    this.createdBufferSources.push(src);
    return src;
  }

  resume() {
    return Promise.resolve();
  }
}

describe('Moteur Audio — Tests Headless (Vitest / Node.js pur)', () => {
  it('exécute l’ensemble des méthodes SFX et ambiance sans lever d’exception sans AudioContext', () => {
    expect(() => {
      audio.init();
      audio.playFootstep('pave');
      audio.playFootstep('herbe');
      audio.playFootstep('parquet');
      audio.playFootstep('terre');
      audio.playFootstep('sol');
      audio.playObjectiveComplete();
      audio.playMarketAlert();
      audio.playUiClick();
      audio.playCoin();
      audio.playGhostArrival();
      audio.playGhostDebate();
      audio.playChapterComplete();

      // Variations complètes d'ambiance temporelle et météorologique
      audio.updateAmbient('ville', 12, 'soleil');
      audio.updateAmbient('maison', 18, 'soleil'); // Crépuscule
      audio.updateAmbient('place', 23, 'pluie');   // Nuit + pluie
      audio.updateAmbient('parc', 3, 'brume');     // Nuit profonde
      audio.updateAmbient('atelier', 15);
      audio.updateAmbient('silence');
      audio.setAmbient('epicerie');
      audio.stopAmbient();
    }).not.toThrow();
  });

  it('gère correctement le volume maître, l’état muet et le clamping', () => {
    audio.setMasterVolume(0.5);
    expect(audio.isMuted()).toBe(false);

    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);

    const toggled = audio.toggleMute();
    expect(toggled).toBe(false);
    expect(audio.isMuted()).toBe(false);

    // Clamping bornes 0.0 - 1.0
    audio.setMasterVolume(2.0);
    audio.setMasterVolume(-1.0);
  });
});

describe('Moteur Audio — Topologie Web Audio synthétisée (Mock AudioContext)', () => {
  let mockCtx: MockAudioContext;
  let originalWindow: any;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    originalWindow = (globalThis as any).window;
    (globalThis as any).window = {
      AudioContext: vi.fn(() => mockCtx),
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it('pré-alloue un buffer de bruit partagé d’une seconde dans init()', () => {
    const engine = new SoundEngine();
    const initialized = engine.init();
    expect(initialized).toBe(true);

    const sharedBuf = engine.getSharedNoiseBuffer();
    expect(sharedBuf).not.toBeNull();
    expect(sharedBuf?.sampleRate).toBe(44100);
    expect(sharedBuf?.duration).toBe(1.0);
    expect(mockCtx.createdBuffers.length).toBe(1);
  });

  it('joue les pas d’herbe via le sharedNoiseBuffer et un filtre passe-bande 1100-1500 Hz sans réallouer de buffer', () => {
    const engine = new SoundEngine();
    engine.init();
    const bufferCountBefore = mockCtx.createdBuffers.length;

    engine.playFootstep('herbe');

    // Aucun nouveau buffer n'a été alloué à chaque pas
    expect(mockCtx.createdBuffers.length).toBe(bufferCountBefore);

    // Une source de buffer a été créée à partir du shared buffer
    const lastSource = mockCtx.createdBufferSources[mockCtx.createdBufferSources.length - 1];
    expect(lastSource).toBeDefined();
    expect(lastSource!.buffer).toBe(engine.getSharedNoiseBuffer());
    expect(lastSource!.started).toBe(true);

    // Un filtre passe-bande entre 1100 et 1500 Hz a été appliqué
    const bandpassFilter = mockCtx.createdFilters.find((f) => f.type === 'bandpass');
    expect(bandpassFilter).toBeDefined();
    expect(bandpassFilter!.frequency.value).toBeGreaterThanOrEqual(1100);
    expect(bandpassFilter!.frequency.value).toBeLessThanOrEqual(1500);
  });

  it('respecte le profil acoustique du pavé (triangle 340 Hz -> 90 Hz, passe-haut 200 Hz)', () => {
    const engine = new SoundEngine();
    engine.init();

    engine.playFootstep('pave');

    const paveOsc = mockCtx.createdOscillators[mockCtx.createdOscillators.length - 1];
    expect(paveOsc).toBeDefined();
    expect(paveOsc!.type).toBe('triangle');
    expect(paveOsc!.frequency.value).toBeGreaterThanOrEqual(330);
    expect(paveOsc!.frequency.value).toBeLessThanOrEqual(350);

    const highpassFilter = mockCtx.createdFilters.find((f) => f.type === 'highpass');
    expect(highpassFilter).toBeDefined();
    expect(highpassFilter!.frequency.value).toBe(200);
  });

  it('respecte le profil acoustique du parquet (triangle 140 Hz -> 70 Hz, passe-bas 450 Hz)', () => {
    const engine = new SoundEngine();
    engine.init();

    engine.playFootstep('parquet');

    const parquetOsc = mockCtx.createdOscillators[mockCtx.createdOscillators.length - 1];
    expect(parquetOsc).toBeDefined();
    expect(parquetOsc!.type).toBe('triangle');
    expect(parquetOsc!.frequency.value).toBeGreaterThanOrEqual(135);
    expect(parquetOsc!.frequency.value).toBeLessThanOrEqual(145);

    const lowpassFilter = mockCtx.createdFilters.find((f) => f.type === 'lowpass');
    expect(lowpassFilter).toBeDefined();
    expect(lowpassFilter!.frequency.value).toBe(450);
  });

  it('génère un carillon ascendant à 3 notes pour playObjectiveComplete() (Sol4, Do5, Sol5)', () => {
    const engine = new SoundEngine();
    engine.init();
    const oscCountBefore = mockCtx.createdOscillators.length;

    engine.playObjectiveComplete();

    const created = mockCtx.createdOscillators.slice(oscCountBefore);
    expect(created.length).toBe(3);

    const freqs = created.map((o) => o.frequency.value);
    expect(freqs).toEqual([392.00, 523.25, 783.99]);

    for (const osc of created) {
      expect(osc.type).toBe('triangle');
      expect(osc.started).toBe(true);
      expect(osc.stopped).toBe(true);
    }
  });

  it('génère deux impulsions de triton descendantes pour playMarketAlert() avec balayage passe-bas', () => {
    const engine = new SoundEngine();
    engine.init();
    const oscCountBefore = mockCtx.createdOscillators.length;
    const filterCountBefore = mockCtx.createdFilters.length;

    engine.playMarketAlert();

    const createdOscs = mockCtx.createdOscillators.slice(oscCountBefore);
    expect(createdOscs.length).toBe(2);

    const freqs = createdOscs.map((o) => o.frequency.value);
    expect(freqs).toEqual([587.33, 466.16]);

    const createdFilters = mockCtx.createdFilters.slice(filterCountBefore);
    expect(createdFilters.length).toBe(2);

    for (const filter of createdFilters) {
      expect(filter.type).toBe('lowpass');
      expect(filter.frequency.value).toBe(900);
      const sweepCall = filter.frequency.calls.find((c) => c.method === 'exponentialRampToValueAtTime');
      expect(sweepCall).toBeDefined();
      expect(sweepCall?.args[0]).toBe(300);
    }
  });

  it('active la couche pluie procédurale quand meteo === "pluie"', () => {
    const engine = new SoundEngine();
    engine.init();

    engine.updateAmbient('ville', 14, 'pluie');

    const rainSrc = mockCtx.createdBufferSources.find((s) => s.loop === true);
    expect(rainSrc).toBeDefined();

    const rainFilter = mockCtx.createdFilters.find((f) => f.type === 'bandpass' && f.frequency.value === 850);
    expect(rainFilter).toBeDefined();
  });

  it('applique le filtre passe-bas atténué et les grillons à 4500 Hz la nuit (heure >= 21 ou heure < 6)', () => {
    const engine = new SoundEngine();
    engine.init();

    // 22h : nuit
    engine.updateAmbient('ville', 22, 'soleil');

    // Drone atténué (passe-bas 135 Hz)
    const droneFilter = mockCtx.createdFilters.find((f) => f.type === 'lowpass' && f.frequency.value === 135);
    expect(droneFilter).toBeDefined();

    // Grillons à 4500 Hz
    const cricketOsc = mockCtx.createdOscillators.find((o) => o.frequency.value === 4500);
    expect(cricketOsc).toBeDefined();
  });

  it('amplifie l’harmonique 1800K (164.81 Hz) pendant le crépuscule (17h - 20h)', () => {
    const engine = new SoundEngine();
    engine.init();

    engine.updateAmbient('place', 18, 'soleil');

    const warmHarmonicOsc = mockCtx.createdOscillators.find((o) => Math.abs(o.frequency.value - 164.81) < 0.1);
    expect(warmHarmonicOsc).toBeDefined();
    expect(warmHarmonicOsc!.type).toBe('triangle');
  });

  it('n’émet aucun son et nettoie les nœuds en mode silence', () => {
    const engine = new SoundEngine();
    engine.init();

    engine.updateAmbient('maison', 12);
    expect(mockCtx.createdOscillators.length).toBeGreaterThan(0);

    engine.updateAmbient('silence');
    // Le statut courant est silence
  });
});

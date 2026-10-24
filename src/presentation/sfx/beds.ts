/**
 * Nappes d'ambiance continues (Web Audio) : pluie, vent, rumeur lointaine de la rue,
 * calme d'un intérieur. Chaque nappe = une boucle de bruit + un ou deux filtres + un gain ;
 * elle n'est créée qu'au premier besoin, puis son volume glisse vers sa cible (pas de coupure).
 * À l'intérieur, la pluie et la rue passent derrière un passe-bas (assourdies par les murs).
 */
import type { AmbienceLevels } from './logic';

interface Bed { gain: GainNode; lp: BiquadFilterNode; level: number; cut: number; src: AudioBufferSourceNode; extra: AudioScheduledSourceNode[] }

type BedName = 'rain' | 'wind' | 'street' | 'room';

/** Volume maximal de chaque nappe (sous le bus « ambiance », déjà réglé par le volume Effets). */
const PEAK: Record<BedName, number> = { rain: 0.22, wind: 0.12, street: 0.1, room: 0.05 };

export class AmbienceBeds {
  private beds: Partial<Record<BedName, Bed>> = {};
  private buffer: AudioBuffer;

  constructor(private ctx: BaseAudioContext, private out: AudioNode) {
    // Bruit rose approché de 3 s (boucle longue : pas de périodicité audible).
    const n = Math.floor(ctx.sampleRate * 3);
    this.buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = this.buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029591;
      b1 = 0.985 * b1 + w * 0.032534;
      b2 = 0.95 * b2 + w * 0.048056;
      d[i] = (b0 + b1 + b2 + w * 0.05) * 0.9;
    }
  }

  /** Nombre de nappes créées (mesure du coût). */
  get size(): number { return Object.keys(this.beds).length; }

  private make(name: BedName): Bed {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = true;
    if (src.playbackRate) src.playbackRate.value = { rain: 1.07, wind: 0.6, street: 0.8, room: 0.5 }[name];
    const shape = ctx.createBiquadFilter();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 12000;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    const extra: AudioScheduledSourceNode[] = [];
    if (name === 'rain') {
      shape.type = 'highpass';
      shape.frequency.value = 700;
    } else if (name === 'wind') {
      shape.type = 'bandpass';
      shape.frequency.value = 420;
      shape.Q.value = 1.1;
      // Rafales : un oscillateur très lent module la fréquence du filtre.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const depth = ctx.createGain();
      depth.gain.value = 220;
      lfo.connect(depth);
      depth.connect(shape.frequency);
      lfo.start();
      extra.push(lfo);
    } else if (name === 'street') {
      shape.type = 'lowpass';
      shape.frequency.value = 380;
      lp.frequency.value = 900;
    } else {
      shape.type = 'lowpass';
      shape.frequency.value = 160;
    }
    src.connect(shape);
    shape.connect(lp);
    lp.connect(gain);
    gain.connect(this.out);
    src.start(0, Math.random() * 2.5);
    const bed: Bed = { gain, lp, level: 0, cut: lp.frequency.value, src, extra };
    this.beds[name] = bed;
    return bed;
  }

  /** Fait glisser chaque nappe vers son niveau (0-1). */
  set(levels: AmbienceLevels): void {
    const t = this.ctx.currentTime;
    for (const name of ['rain', 'wind', 'street', 'room'] as BedName[]) {
      const target = levels[name];
      let bed = this.beds[name];
      if (!bed) {
        if (target <= 0.001) continue;
        bed = this.make(name);
      }
      if (Math.abs(bed.level - target) > 0.01) {
        bed.level = target;
        bed.gain.gain.setTargetAtTime(Math.max(0.0001, target * PEAK[name]), t, 1.2);
      }
      if (name === 'rain' || name === 'street') {
        const cut = levels.muffled ? (name === 'rain' ? 900 : 300) : name === 'rain' ? 9000 : 900;
        if (bed.cut !== cut) { bed.cut = cut; bed.lp.frequency.setTargetAtTime(cut, t, 0.4); }
      }
    }
  }

  /** Coupe tout (fin de partie, tests). */
  dispose(): void {
    for (const bed of Object.values(this.beds)) {
      try { bed.src.stop(); bed.extra.forEach((x) => x.stop()); bed.gain.disconnect(); } catch { /* déjà arrêté */ }
    }
    this.beds = {};
  }
}

/**
 * Bruitages de « sensation » : façade au-dessus du bus Effets de audio.ts.
 * Tout passe par le pool de voix (audio.voices) et le limiteur de sortie ; rien ne sonne avant la
 * première interaction (audio.sfxBus() renvoie null), ni quand le son est coupé ou l'onglet caché.
 * Le volume suit le réglage « Effets » du panneau Son (bus sfx / ambiance de audio.ts).
 */
import { audio, type SurfaceType } from '../audio';
import { AmbienceBeds } from './beds';
import type { AmbienceLevels, SfxKind } from './logic';
import * as S from './synth';

class Sfx {
  private beds: AmbienceBeds | null = null;
  private nextDistant = 0;
  /** Mesure du coût côté JavaScript (création des nœuds). */
  private cost = { calls: 0, ms: 0 };

  private play(kind: SfxKind, est: number, fn: (k: S.Kit, t: number) => number, delay = 0): void {
    const b = audio.sfxBus();
    if (!b) return;
    const t = b.ctx.currentTime + 0.005 + delay;
    if (!audio.voices.tryStart(kind, t, est)) return;
    const t0 = performance.now();
    try { fn({ ctx: b.ctx, out: b.sfx, noise: b.noise }, t); } catch { /* un bruitage raté ne bloque jamais le jeu */ }
    this.cost.calls++;
    this.cost.ms += performance.now() - t0;
  }

  step(surface: SurfaceType, speed: number): void { audio.playFootstep(surface, speed); }
  doorOpen(): void { this.play('porte', 0.42, S.doorOpen); }
  doorClose(delay = 0): void { this.play('porte', 0.18, S.doorClose, delay); }
  /** Vente : caisse enregistreuse puis pièces. */
  sale(coins = 4): void {
    this.play('caisse', 0.82, S.cashRegister);
    this.play('piece', 0.5, (k, t) => S.coins(k, t, Math.min(6, Math.max(2, coins))), 0.12);
  }
  coins(n = 3): void { this.play('piece', 0.4, (k, t) => S.coins(k, t, n)); }
  panel(open: boolean): void { this.play('fenetre', 0.13, (k, t) => S.panel(k, t, open)); }
  phone(open: boolean): void { this.play('fenetre', 0.26, (k, t) => S.phone(k, t, open)); }
  tick(): void { this.play('ui', 0.03, S.tick); }
  mission(): void { this.play('jingle', 0.9, S.missionJingle); }
  arrival(): void { this.play('alerte', 0.46, S.arrival); }

  /** Nappes d'ambiance (à appeler quelques fois par seconde) et bruits lointains épars. */
  ambience(levels: AmbienceLevels): void {
    const b = audio.sfxBus();
    if (!b) return;
    const t0 = performance.now();
    try {
      if (!this.beds) this.beds = new AmbienceBeds(b.ctx, b.ambient);
      this.beds.set(levels);
    } catch { return; }
    const now = b.ctx.currentTime;
    if (levels.street > 0.3 && !levels.muffled) {
      if (this.nextDistant === 0) this.nextDistant = now + 8 + Math.random() * 10;
      else if (now >= this.nextDistant) {
        const which = Math.random();
        this.play('lointain', 0.45, (k, t) => S.distant(k, t, which));
        this.nextDistant = now + 14 + Math.random() * 24;
      }
    }
    this.cost.ms += performance.now() - t0;
  }

  /** Mesures (console de développement : __sfx.stats()). */
  stats(): { voix: number; lancées: number; refusées: number; nappes: number; appels: number; msParAppel: number } {
    const b = audio.sfxBus();
    return {
      voix: b ? audio.voices.count(b.ctx.currentTime) : 0,
      lancées: audio.voices.started,
      refusées: audio.voices.refused,
      nappes: this.beds?.size ?? 0,
      appels: this.cost.calls,
      msParAppel: this.cost.calls ? +(this.cost.ms / this.cost.calls).toFixed(3) : 0,
    };
  }
}

export const sfx = new Sfx();

/**
 * Banc d'essai hors ligne : rend 10 s de la pire situation (4 nappes, pas de course, vente,
 * fenêtres, jingle) et renvoie le facteur temps réel (durée de calcul / durée audio).
 */
export async function benchSfxOffline(seconds = 10): Promise<{ secondes: number; calculMs: number; facteurTempsReel: number; voixMax: number }> {
  const rate = 44100;
  const ctx = new OfflineAudioContext(1, rate * seconds, rate);
  const noise = ctx.createBuffer(1, rate, rate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.25;
  const out = ctx.createDynamicsCompressor();
  out.connect(ctx.destination);
  const kit: S.Kit = { ctx, out, noise };
  const beds = new AmbienceBeds(ctx, out);
  beds.set({ rain: 1, wind: 0.6, street: 0.75, room: 0.4, muffled: false });
  let voices = 0;
  for (let t = 0.05; t < seconds - 0.5; t += 0.34) { S.tick(kit, t); voices++; } // cadence de course
  for (let t = 0.5; t < seconds - 1; t += 1.5) {
    S.cashRegister(kit, t); S.coins(kit, t + 0.12, 6); S.panel(kit, t + 0.3, true); S.phone(kit, t + 0.6, false);
    S.doorOpen(kit, t + 0.8); S.doorClose(kit, t + 1.1); S.missionJingle(kit, t + 0.2); voices += 7;
  }
  const t0 = performance.now();
  await ctx.startRendering();
  const calculMs = performance.now() - t0;
  return { secondes: seconds, calculMs: Math.round(calculMs), facteurTempsReel: +(calculMs / (seconds * 1000)).toFixed(4), voixMax: voices };
}

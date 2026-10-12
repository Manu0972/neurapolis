/**
 * Réglages du son mémorisés : volume de la musique, volume des effets (bruitages et ambiances),
 * coupure. Stockés dans le navigateur ; tout accès est protégé (navigation privée, stockage
 * bloqué) et le jeu fonctionne avec les valeurs par défaut si rien n'est lisible.
 */

export interface AudioPrefs {
  /** Volume de la musique (0-1). */
  music: number;
  /** Volume des effets : bruitages et ambiances (0-1). */
  effects: number;
  muted: boolean;
}

export const AUDIO_PREFS_KEY = 'neurapolis.audio.v1';
export const DEFAULT_AUDIO_PREFS: Readonly<AudioPrefs> = { music: 0.7, effects: 1, muted: false };

const unit = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;

/** Lecture tolérante : valeurs absentes, invalides ou hors bornes → défauts. */
export function parseAudioPrefs(raw: string | null | undefined): AudioPrefs {
  if (!raw) return { ...DEFAULT_AUDIO_PREFS };
  try {
    const o = JSON.parse(raw) as Partial<Record<keyof AudioPrefs, unknown>> | null;
    if (!o || typeof o !== 'object') return { ...DEFAULT_AUDIO_PREFS };
    return {
      music: unit(o.music, DEFAULT_AUDIO_PREFS.music),
      effects: unit(o.effects, DEFAULT_AUDIO_PREFS.effects),
      muted: typeof o.muted === 'boolean' ? o.muted : DEFAULT_AUDIO_PREFS.muted,
    };
  } catch {
    return { ...DEFAULT_AUDIO_PREFS };
  }
}

function storage(): Storage | null {
  try {
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

export function loadAudioPrefs(): AudioPrefs {
  try {
    return parseAudioPrefs(storage()?.getItem(AUDIO_PREFS_KEY));
  } catch {
    return { ...DEFAULT_AUDIO_PREFS };
  }
}

export function saveAudioPrefs(p: AudioPrefs): void {
  try {
    storage()?.setItem(AUDIO_PREFS_KEY, JSON.stringify({ music: p.music, effects: p.effects, muted: p.muted }));
  } catch {
    /* stockage plein ou bloqué : le réglage vaut pour la session */
  }
}

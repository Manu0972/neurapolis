/**
 * Le récit : la nuit de la médiathèque (origine des voix) et « Les Carnets de Lucien », un fil
 * qui se découvre au fil des paliers et des notions. Save v22.
 * `StoryBeat` reprend l'interface confiée à Antigravity (src/data/story/lucien.ts).
 */

export interface StoryBeat {
  id: string;
  trigger: { tier?: number; flag?: string; concepts?: number; day?: number };
  title: string;
  pages: string[];
  note?: string;
  ghost?: string;
}

export interface StoryState {
  /** La scène d'origine a été vue (ou passée). */
  originDone: boolean;
  /** Cahier → jour de découverte. */
  seen: Record<string, number>;
  /** Cahier découvert mais pas encore lu à l'écran. */
  unread: string[];
}

export function createStoryState(): StoryState {
  return { originDone: false, seen: {}, unread: [] };
}
